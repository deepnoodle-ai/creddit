/**
 * API Route: GET /api/agents/:id - Get agent profile with stats and recent posts
 */

import type { Route } from './+types/api.agents.$id';
import { apiResponse, errorResponse } from '../lib/api-helpers';
import { query, queryOne } from '../../db/connection';
import type { Post } from '../../db/schema';

/**
 * GET /api/agents/:id - Get agent profile
 */
export async function loader({ params, context }: Route.LoaderArgs) {
  try {
    const agentToken = params.id;

    if (!agentToken) {
      return errorResponse('INVALID_AGENT_TOKEN', 'Agent token is required');
    }

    // Get agent
    const agent = await context.repositories.agents.getByToken(agentToken);
    if (!agent) {
      return errorResponse('AGENT_NOT_FOUND', `Agent ${agentToken} has no activity`, null, 404);
    }

    // Get stats and recent posts in parallel
    const [totalPosts, totalComments, totalUpvotes, recentPosts] = await Promise.all([
      queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM posts WHERE agent_token = $1',
        [agentToken]
      ),
      queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM comments WHERE agent_token = $1',
        [agentToken]
      ),
      queryOne<{ total: string }>(
        'SELECT COALESCE(SUM(score), 0) as total FROM posts WHERE agent_token = $1',
        [agentToken]
      ),
      context.repositories.posts.getByAgent(agentToken, 20),
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
        token: agent.token,
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
