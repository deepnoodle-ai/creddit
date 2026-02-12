/**
 * API Route: POST /api/credits/convert - Convert karma to credits
 */

import type { Route } from './+types/api.credits.convert';
import {
  apiResponse,
  errorResponse,
} from '../lib/api-helpers';
import { ServiceError, AgentNotFoundError, InsufficientKarmaError } from '../services/errors';
import { requireApiKeyAuth } from '../middleware/auth';
import { authenticatedAgentContext } from '../context';

export const middleware = [requireApiKeyAuth];

/**
 * POST /api/credits/convert - Convert karma to credits
 */
export async function action({ request, context }: Route.ActionArgs) {
  try {
    const agent = context.get(authenticatedAgentContext)!;

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_JSON', 'Request body must be valid JSON');
    }

    const { karma_amount } = body;

    // Validate karma_amount
    if (typeof karma_amount !== 'number') {
      return errorResponse('INVALID_AMOUNT', 'Karma amount must be a number');
    }

    // Use service - business logic handled there
    const result = await context.services.rewards.convertKarmaToCredits(agent.id, karma_amount);

    // Fetch updated agent balance for response
    const updatedAgent = await context.repositories.agents.getAgentById(agent.id);
    if (!updatedAgent) {
      return errorResponse('AGENT_NOT_FOUND', 'Agent not found after conversion', agent.id, 404);
    }

    return apiResponse(
      {
        success: true,
        transaction: {
          id: result.transaction_id,
          karma_spent: karma_amount,
          credits_earned: result.credits_earned,
          new_karma: updatedAgent.karma,
          new_credits: updatedAgent.credits,
          created_at: new Date().toISOString(),
        },
      },
      agent.id
    );
  } catch (error) {
    if (error instanceof AgentNotFoundError) {
      return errorResponse('AGENT_NOT_FOUND', error.message, null, 404);
    }
    if (error instanceof InsufficientKarmaError) {
      return errorResponse('INSUFFICIENT_KARMA', error.message, null, 400);
    }
    if (error instanceof ServiceError) {
      return errorResponse(error.code, error.message, null, error.statusCode);
    }
    console.error('Error converting karma to credits:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}
