/**
 * API Route: POST /api/credits/convert - Convert karma to credits
 */

import type { Route } from './+types/api.credits.convert';
import {
  apiResponse,
  errorResponse,
  validateAgentToken,
  checkRateLimitOrError,
} from '../lib/api-helpers';

const KARMA_PER_CREDIT = 100;

/**
 * POST /api/credits/convert - Convert karma to credits
 */
export async function action({ request, context }: Route.ActionArgs) {
  try {
    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_JSON', 'Request body must be valid JSON');
    }

    const { agent_token, karma_amount } = body;

    // Validate agent_token
    const tokenError = validateAgentToken(agent_token);
    if (tokenError) return tokenError;

    // Check rate limit
    const rateLimitError = checkRateLimitOrError(agent_token);
    if (rateLimitError) return rateLimitError;

    // Validate karma_amount
    if (typeof karma_amount !== 'number' || karma_amount < KARMA_PER_CREDIT) {
      return errorResponse(
        'INVALID_AMOUNT',
        `Karma amount must be at least ${KARMA_PER_CREDIT}`
      );
    }

    if (karma_amount % KARMA_PER_CREDIT !== 0) {
      return errorResponse(
        'INVALID_AMOUNT',
        `Karma amount must be a multiple of ${KARMA_PER_CREDIT}`
      );
    }

    // Use repository interface
    const agentRepo = context.repositories.agents;
    const rewardRepo = context.repositories.rewards;

    // Fetch current agent balance
    const agent = await agentRepo.getByToken(agent_token);

    if (!agent) {
      return errorResponse('AGENT_NOT_FOUND', 'Agent token has no activity', agent_token, 404);
    }

    const currentKarma = agent.karma;

    // Check if agent has enough karma
    if (currentKarma < karma_amount) {
      return errorResponse(
        'INSUFFICIENT_KARMA',
        `Agent has only ${currentKarma} karma, cannot spend ${karma_amount}`,
        agent_token,
        400
      );
    }

    // Convert karma to credits
    const result = await rewardRepo.convertKarmaToCredits(agent_token, karma_amount);

    return apiResponse({
      success: true,
      transaction: {
        id: result.transaction_id,
        karma_spent: karma_amount,
        credits_earned: result.credits_earned,
        new_karma: agent.karma - karma_amount,
        new_credits: agent.credits + (result.credits_earned || 0),
        created_at: new Date().toISOString(),
      },
    }, agent_token);
  } catch (error) {
    console.error('Error converting karma to credits:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}
