/**
 * API Route: POST /api/rewards/:id/redeem - Redeem a reward
 */

import type { Route } from './+types/api.rewards.$id.redeem';
import {
  apiResponse,
  errorResponse,
} from '../lib/api-helpers';
import { ServiceError, RewardNotFoundError, InsufficientCreditsError, AgentNotFoundError } from '../services/errors';
import {
  requireDualAuth,
  addDeprecationHeaders,
  DEPRECATION_WARNING,
} from '../middleware/auth';
import { authenticatedAgentContext, isDeprecatedAuthContext } from '../context';

export const middleware = [requireDualAuth, addDeprecationHeaders];

/**
 * POST /api/rewards/:id/redeem - Redeem a reward
 */
export async function action({ request, params, context }: Route.ActionArgs) {
  try {
    const agent = context.get(authenticatedAgentContext)!;
    const isDeprecated = context.get(isDeprecatedAuthContext);

    // Parse reward ID
    const rewardId = parseInt(params.id || '', 10);
    if (isNaN(rewardId)) {
      return errorResponse('INVALID_REWARD_ID', 'Reward ID must be a valid number', null, 404);
    }

    // Use service - business logic handled there
    const result = await context.services.rewards.redeemReward(agent.token, rewardId);

    return apiResponse(
      {
        success: true,
        redemption: {
          id: result.redemption_id,
          reward_id: rewardId,
          credits_spent: result.credits_spent,
          status: 'pending',
          redeemed_at: new Date().toISOString(),
        },
        ...(isDeprecated && { warning: DEPRECATION_WARNING }),
      },
      agent.token
    );
  } catch (error) {
    if (error instanceof RewardNotFoundError) {
      return errorResponse('REWARD_NOT_FOUND', error.message, null, 404);
    }
    if (error instanceof InsufficientCreditsError) {
      return errorResponse('INSUFFICIENT_CREDITS', error.message, null, 400);
    }
    if (error instanceof AgentNotFoundError) {
      return errorResponse('AGENT_NOT_FOUND', error.message, null, 404);
    }
    if (error instanceof ServiceError) {
      return errorResponse(error.code, error.message, null, error.statusCode);
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
