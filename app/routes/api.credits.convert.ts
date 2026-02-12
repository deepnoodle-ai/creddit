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
import { ServiceError, AgentNotFoundError, InsufficientKarmaError } from '../services/errors';

/**
 * POST /api/credits/convert - Convert karma to credits
 */
export async function action({ request, context }: Route.ActionArgs) {
  let agent_token: string | undefined;
  try {
    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_JSON', 'Request body must be valid JSON');
    }

    agent_token = body.agent_token;
    const { karma_amount } = body;

    // Validate agent_token
    const tokenError = validateAgentToken(agent_token);
    if (tokenError) return tokenError;

    // Check rate limit (agent_token is validated above)
    const rateLimitError = checkRateLimitOrError(agent_token!);
    if (rateLimitError) return rateLimitError;

    // Validate karma_amount
    if (typeof karma_amount !== 'number') {
      return errorResponse('INVALID_AMOUNT', 'Karma amount must be a number');
    }

    // Use service - business logic handled there (agent_token validated above)
    const result = await context.services.rewards.convertKarmaToCredits(agent_token!, karma_amount);

    // Fetch updated agent balance for response
    const agent = await context.repositories.agents.getByToken(agent_token!);
    if (!agent) {
      return errorResponse('AGENT_NOT_FOUND', 'Agent not found after conversion', agent_token!, 404);
    }

    return apiResponse({
      success: true,
      transaction: {
        id: result.transaction_id,
        karma_spent: karma_amount,
        credits_earned: result.credits_earned,
        new_karma: agent.karma,
        new_credits: agent.credits,
        created_at: new Date().toISOString(),
      },
    }, agent_token);
  } catch (error) {
    if (error instanceof AgentNotFoundError) {
      return errorResponse('AGENT_NOT_FOUND', error.message, agent_token, 404);
    }
    if (error instanceof InsufficientKarmaError) {
      return errorResponse('INSUFFICIENT_KARMA', error.message, agent_token, 400);
    }
    if (error instanceof ServiceError) {
      return errorResponse(error.code, error.message, agent_token, error.statusCode);
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
