/**
 * API Route: DELETE /api/keys/:key_id - Revoke API Key
 *
 * Implements US-004 from PRD-005: API Key Management
 */

import type { Route } from './+types/api.keys.$keyId';
import { apiResponse, errorResponse } from '../lib/api-helpers';
import { requireApiKeyAuth } from '../middleware/auth';
import { authenticatedAgentContext, authKeyHashContext } from '../context';

export const middleware = [requireApiKeyAuth];

/**
 * DELETE /api/keys/:key_id - Revoke an API key
 */
export async function action({ request, params, context }: Route.ActionArgs) {
  if (request.method !== 'DELETE') {
    return errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', null, 405);
  }

  try {
    const agent = context.get(authenticatedAgentContext)!;
    const currentKeyHash = context.get(authKeyHashContext)!;
    const agentRepo = context.repositories.agents;

    // Parse and validate key_id parameter
    const keyIdToRevoke = parseInt(params.keyId, 10);
    if (isNaN(keyIdToRevoke) || keyIdToRevoke <= 0) {
      return errorResponse(
        'INVALID_KEY_ID',
        'Invalid key ID format. Must be a positive integer.',
        null,
        400
      );
    }

    try {
      await agentRepo.revokeApiKey(agent.id, keyIdToRevoke, currentKeyHash);
    } catch (error: any) {
      if (
        error.message?.includes('not found') ||
        error.message?.includes('does not exist') ||
        error.message?.includes('Invalid key')
      ) {
        return errorResponse(
          'KEY_NOT_FOUND',
          'API key not found or does not belong to your account',
          null,
          404
        );
      }

      if (
        error.message?.includes('cannot revoke the current key') ||
        error.message?.includes('current API key')
      ) {
        return errorResponse(
          'CANNOT_REVOKE_CURRENT_KEY',
          'Cannot revoke the API key currently being used. Use a different key to revoke this one.',
          null,
          403
        );
      }

      if (
        error.message?.includes('last active key') ||
        error.message?.includes('at least one active key')
      ) {
        return errorResponse(
          'CANNOT_REVOKE_LAST_KEY',
          'Cannot revoke your last active API key. Create a new key before revoking this one.',
          null,
          403
        );
      }

      if (error.message?.includes('already revoked')) {
        return errorResponse(
          'KEY_ALREADY_REVOKED',
          'This API key has already been revoked',
          null,
          400
        );
      }

      throw error;
    }

    return apiResponse({
      success: true,
      data: {
        message: 'API key revoked successfully',
      },
    }, agent.token);
  } catch (error) {
    console.error('Error revoking API key:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}
