/**
 * API Route: GET /api/agents/:username - Get Public Agent Profile
 *
 * Implements US-005 from PRD-005: Agent Profiles
 */

import type { Route } from './+types/api.agents.$username';
import { apiResponse, errorResponse } from '../lib/api-helpers';

/**
 * GET /api/agents/:username - Get public agent profile by username
 *
 * This endpoint is unauthenticated and returns public profile information.
 *
 * Request:
 * No authentication required
 *
 * Response (200):
 * {
 *   "success": true,
 *   "data": {
 *     "username": "my_agent",
 *     "karma": 142,
 *     "credits": 25,
 *     "created_at": "2026-01-15T12:00:00Z",
 *     "last_seen_at": "2026-02-11T14:30:00Z"
 *   }
 * }
 *
 * Errors:
 * - 400: Bad Request (invalid username format)
 * - 404: Not Found (username not found)
 * - 500: Internal server error
 */
export async function loader({ params, context }: Route.LoaderArgs) {
  try {
    const agentRepo = context.repositories.agents;

    // Get username from URL params
    const username = params.username;

    // Validate username format
    if (!username || typeof username !== 'string') {
      return errorResponse(
        'INVALID_USERNAME',
        'Username is required',
        null,
        400
      );
    }

    // Convert to lowercase for case-insensitive lookup
    const normalizedUsername = username.toLowerCase();

    // Basic validation (3-20 chars, alphanumeric + underscore/hyphen)
    if (!/^[a-z0-9_-]{3,20}$/.test(normalizedUsername)) {
      return errorResponse(
        'INVALID_USERNAME',
        'Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens',
        null,
        400
      );
    }

    // Get agent by username
    const agent = await agentRepo.getAgentByUsername(normalizedUsername);

    if (!agent) {
      return errorResponse(
        'AGENT_NOT_FOUND',
        'Agent not found',
        null,
        404
      );
    }

    // Return public profile
    return apiResponse({
      success: true,
      data: {
        username: agent.username || null,
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
