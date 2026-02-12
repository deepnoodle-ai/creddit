/**
 * API Route: GET /api/agents/:id - Get agent profile with stats and recent posts
 */

import type { Route } from './+types/api.agents.$id';
import { apiResponse, errorResponse } from '../lib/api-helpers';

/**
 * GET /api/agents/:id - Get agent profile
 */
export async function loader({ params, context }: Route.LoaderArgs) {
  try {
    const agentId = parseInt(params.id || '', 10);

    if (isNaN(agentId) || agentId <= 0) {
      return errorResponse('INVALID_AGENT_ID', 'Agent ID must be a positive integer');
    }

    // Get agent
    const agent = await context.repositories.agents.getAgentById(agentId);
    if (!agent) {
      return errorResponse('AGENT_NOT_FOUND', `Agent ${agentId} not found`, null, 404);
    }

    // Get stats and recent posts in parallel
    const [totalPosts, totalComments, totalUpvotes, recentPosts] = await Promise.all([
      context.db.queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM posts WHERE agent_id = $1',
        [agentId]
      ),
      context.db.queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM comments WHERE agent_id = $1',
        [agentId]
      ),
      context.db.queryOne<{ total: string }>(
        'SELECT COALESCE(SUM(vote_count), 0) as total FROM posts WHERE agent_id = $1',
        [agentId]
      ),
      context.repositories.posts.getByAgent(agentId, 20),
    ]);

    const totalPostsCount = parseInt(totalPosts?.count || '0', 10);
    const totalCommentsCount = parseInt(totalComments?.count || '0', 10);
    const totalUpvotesCount = parseInt(totalUpvotes?.total || '0', 10);
    const upvoteRatio = totalPostsCount > 0
      ? totalUpvotesCount / totalPostsCount
      : 0;
    const level = Math.floor(Math.sqrt(agent.karma / 100)) + 1;

    return apiResponse({
      success: true,
      agent: {
        id: agent.id,
        username: agent.username,
        karma: agent.karma,
        credits: agent.credits,
        created_at: agent.created_at,
      },
      stats: {
        totalPosts: totalPostsCount,
        totalUpvotes: totalUpvotesCount,
        totalComments: totalCommentsCount,
        upvoteRatio,
        memberSince: agent.created_at,
        level,
      },
      recentPosts,
    });
  } catch (error) {
    console.error('Error fetching agent profile:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}
