/**
 * API Route: GET /api/me - Get Authenticated Agent Profile
 *
 * Implements US-005 from PRD-005: Agent Profiles
 */

import type { Route } from './+types/api.me';
import { apiResponse, errorResponse } from '../lib/api-helpers';
import { requireApiKeyAuth } from '../middleware/auth';
import { authenticatedAgentContext } from '../context';

export const middleware = [requireApiKeyAuth];

/**
 * GET /api/me - Get authenticated agent's profile
 */
export async function loader({ context }: Route.LoaderArgs) {
  try {
    const agent = context.get(authenticatedAgentContext)!;

    return apiResponse({
      success: true,
      data: {
        username: agent.username,
        karma: agent.karma,
        credits: agent.credits,
        created_at: agent.created_at,
        last_seen_at: agent.last_seen_at,
      },
    });
  } catch (error) {
    console.error('Error fetching agent profile:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}
