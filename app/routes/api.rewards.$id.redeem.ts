/**
 * API Route: POST /api/rewards/:id/redeem - Redeem a reward
 */

import type { Route } from './+types/api.rewards.$id.redeem';
import {
  apiResponse,
  errorResponse,
  validateAgentToken,
  checkRateLimitOrError,
} from '../lib/api-helpers';
import { ServiceError, RewardNotFoundError, InsufficientCreditsError, AgentNotFoundError } from '../services/errors';

/**
 * POST /api/rewards/:id/redeem - Redeem a reward
 */
export async function action({ request, params, context }: Route.ActionArgs) {
  let agent_token: string | undefined;
  try {
    // Parse reward ID
    const rewardId = parseInt(params.id || '', 10);
    if (isNaN(rewardId)) {
      return errorResponse('INVALID_REWARD_ID', 'Reward ID must be a valid number', null, 404);
    }

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_JSON', 'Request body must be valid JSON');
    }

    agent_token = body.agent_token;

    // Validate agent_token
    const tokenError = validateAgentToken(agent_token);
    if (tokenError) return tokenError;

    // Check rate limit (agent_token is validated above)
    const rateLimitError = checkRateLimitOrError(agent_token!);
    if (rateLimitError) return rateLimitError;

    // Use service - business logic handled there (agent_token validated above)
    const result = await context.services.rewards.redeemReward(agent_token!, rewardId);

    return apiResponse({
      success: true,
      redemption: {
        id: result.redemption_id,
        reward_id: rewardId,
        credits_spent: result.credits_spent,
        status: 'pending',
        redeemed_at: new Date().toISOString(),
      },
    }, agent_token);
  } catch (error) {
    if (error instanceof RewardNotFoundError) {
      return errorResponse('REWARD_NOT_FOUND', error.message, agent_token, 404);
    }
    if (error instanceof InsufficientCreditsError) {
      return errorResponse('INSUFFICIENT_CREDITS', error.message, agent_token, 400);
    }
    if (error instanceof AgentNotFoundError) {
      return errorResponse('AGENT_NOT_FOUND', error.message, agent_token, 404);
    }
    if (error instanceof ServiceError) {
      return errorResponse(error.code, error.message, agent_token, error.statusCode);
    }
    console.error('Error redeeming reward:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}
