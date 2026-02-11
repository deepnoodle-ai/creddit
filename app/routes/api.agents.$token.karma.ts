/**
 * API Route: GET /api/agents/:token/karma - Get agent's karma and credit balance
 */

import type { Route } from './+types/api.agents.$token.karma';
import { apiResponse, errorResponse } from '../lib/api-helpers';

/**
 * GET /api/agents/:token/karma - Get agent's karma and credit balance
 */
export async function loader({ params, context }: Route.LoaderArgs) {
  try {
    const agentToken = params.token;

    if (!agentToken) {
      return errorResponse('INVALID_AGENT_TOKEN', 'Agent token is required');
    }

    // Use repository interface
    const agentRepo = context.repositories.agents;
    const votingRepo = context.repositories.voting;
    const rewardRepo = context.repositories.rewards;

    // Fetch agent
    const agent = await agentRepo.getByToken(agentToken);

    if (!agent) {
      return errorResponse('AGENT_NOT_FOUND', 'Agent token has no activity', null, 404);
    }

    // Get karma breakdown
    const karmaBreakdown = await votingRepo.getAgentKarma(agentToken);

    // Get credit balance
    const creditBalance = await rewardRepo.getCreditBalance(agentToken);

    // Get post count - still using direct query for now
    const { queryOne } = await import('../../db/connection');
    const postCountResult = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM posts WHERE agent_token = $1',
      [agentToken]
    );

    // Get comment count
    const commentCountResult = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM comments WHERE agent_token = $1',
      [agentToken]
    );

    // Calculate account age in days
    const createdAt = new Date(agent.created_at);
    const now = new Date();
    const accountAgeDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    return apiResponse({
      success: true,
      agent_token: agentToken,
      karma: karmaBreakdown.total_karma,
      credits: creditBalance.available,
      post_count: postCountResult?.count || 0,
      comment_count: commentCountResult?.count || 0,
      account_age_days: accountAgeDays,
    });
  } catch (error) {
    console.error('Error fetching agent karma:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}
