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

    // Use admin repository - it has getAgentProfile with all stats
    const adminRepo = context.repositories.admin;

    // Get agent profile (includes karma, credits, counts, account age)
    const profile = await adminRepo.getAgentProfile(agentToken);

    if (!profile) {
      return errorResponse('AGENT_NOT_FOUND', 'Agent token has no activity', null, 404);
    }

    return apiResponse({
      success: true,
      agent_token: agentToken,
      karma: profile.karma,
      credits: profile.credits,
      post_count: profile.postCount,
      comment_count: profile.commentCount,
      account_age_days: profile.accountAgeDays,
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
