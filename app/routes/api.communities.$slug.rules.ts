/**
 * API Route: PATCH /api/communities/:slug/rules - Set community posting rules
 */

import type { Route } from './+types/api.communities.$slug.rules';
import { apiResponse, errorResponse } from '../lib/api-helpers';
import { ServiceError } from '../services/errors';
import { requireApiKeyAuth } from '../middleware/auth';
import { authenticatedAgentContext } from '../context';

export const middleware = [requireApiKeyAuth];

/**
 * PATCH /api/communities/:slug/rules - Set or clear posting rules (creator only)
 */
export async function action({ request, params, context }: Route.ActionArgs) {
  try {
    if (request.method !== 'PATCH') {
      return errorResponse('METHOD_NOT_ALLOWED', 'Only PATCH method is supported', null, 405);
    }

    const agent = context.get(authenticatedAgentContext)!;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_JSON', 'Request body must be valid JSON');
    }

    const { posting_rules } = body;

    // Allow null to clear rules, string to set them
    if (posting_rules !== null && posting_rules !== undefined && typeof posting_rules !== 'string') {
      return errorResponse('INVALID_RULES', 'posting_rules must be a string or null');
    }

    const community = await context.services.communities.setPostingRules(
      params.slug,
      agent.id,
      posting_rules ?? null
    );

    return apiResponse({
      success: true,
      community,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return errorResponse(error.code, error.message, null, error.statusCode);
    }
    console.error('Error setting community rules:', error);
    return errorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', null, 500);
  }
}
