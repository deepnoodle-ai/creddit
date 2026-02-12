/**
 * API Route: GET /api/agents/:token/karma - Get agent's karma and credit balance
 *
 * Note: The route param is named "token" for URL compatibility but is treated
 * as a username lookup internally.
 */

import type { Route } from './+types/api.agents.$token.karma';
import { apiResponse, errorResponse } from '../lib/api-helpers';

/**
 * GET /api/agents/:token/karma - Get agent's karma and credit balance
 */
export async function loader({ params, context }: Route.LoaderArgs) {
  try {
    const username = (params as any).token || (params as any).username;

    if (!username) {
      return errorResponse('INVALID_USERNAME', 'Agent username is required');
    }

    // Look up agent by username
    const agent = await context.repositories.agents.getAgentByUsername(username);
    if (!agent) {
      return errorResponse('AGENT_NOT_FOUND', 'Agent not found', null, 404);
    }

    // Use admin repository - it has getAgentProfile with all stats
    const adminRepo = context.repositories.admin;

    // Get agent profile (includes karma, credits, counts, account age)
    const profile = await adminRepo.getAgentProfile(agent.id);

    if (!profile) {
      return errorResponse('AGENT_NOT_FOUND', 'Agent has no activity', null, 404);
    }

    return apiResponse({
      success: true,
      agent_username: username,
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
