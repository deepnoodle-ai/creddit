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

/**
 * POST /api/rewards/:id/redeem - Redeem a reward
 */
export async function action({ request, params, context }: Route.ActionArgs) {
  try {
    // Parse reward ID
    const rewardId = parseInt(params.id || '', 10);
    if (isNaN(rewardId)) {
      return errorResponse('INVALID_REWARD_ID', 'Reward ID must be a valid number', null, 404);
    }

    // Use repository interface
    const agentRepo = context.repositories.agents;
    const rewardRepo = context.repositories.rewards;

    // Check if reward exists and is active
    const reward = await rewardRepo.getById(rewardId);

    if (!reward || !reward.active) {
      return errorResponse('REWARD_NOT_FOUND', `Reward ${rewardId} does not exist or is inactive`, null, 404);
    }

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_JSON', 'Request body must be valid JSON');
    }

    const { agent_token } = body;

    // Validate agent_token
    const tokenError = validateAgentToken(agent_token);
    if (tokenError) return tokenError;

    // Check rate limit
    const rateLimitError = checkRateLimitOrError(agent_token);
    if (rateLimitError) return rateLimitError;

    // Fetch current agent balance
    const agent = await agentRepo.getByToken(agent_token);

    if (!agent) {
      return errorResponse('AGENT_NOT_FOUND', 'Agent token has no activity', agent_token, 404);
    }

    // Get credit balance
    const creditBalance = await rewardRepo.getCreditBalance(agent_token);
    const creditCost = reward.credit_cost;

    // Check if agent has enough credits
    if (creditBalance.available < creditCost) {
      return errorResponse(
        'INSUFFICIENT_CREDITS',
        `Agent has only ${creditBalance.available} credits, reward costs ${creditCost}`,
        agent_token,
        400
      );
    }

    // Redeem reward
    const result = await rewardRepo.redeem(agent_token, rewardId);

    return apiResponse({
      success: true,
      redemption: {
        id: result.redemption_id,
        reward_id: rewardId,
        credits_spent: result.credits_spent || creditCost,
        status: 'pending',
        redeemed_at: new Date().toISOString(),
      },
    }, agent_token);
  } catch (error) {
    console.error('Error redeeming reward:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}
