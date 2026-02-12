/**
 * API Route: /api/keys - API Key Management
 *
 * POST /api/keys - Generate new API key (US-003)
 * GET /api/keys - List API key metadata (US-004)
 */

import type { Route } from './+types/api.keys';
import type { ApiKey } from '../../db/schema';
import { apiResponse, errorResponse } from '../lib/api-helpers';
import { requireApiKeyAuth } from '../middleware/auth';
import { authenticatedAgentContext } from '../context';
import { generateApiKey, hashApiKey, getApiKeyPrefix } from '../lib/auth';

export const middleware = [requireApiKeyAuth];

/**
 * POST /api/keys - Generate new API key
 */
export async function action({ request, context }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return errorResponse('METHOD_NOT_ALLOWED', 'Method not allowed', null, 405);
  }

  try {
    const agent = context.get(authenticatedAgentContext)!;
    const agentRepo = context.repositories.agents;

    // Generate new API key
    const newApiKey = generateApiKey();
    const keyHash = await hashApiKey(newApiKey);
    const keyPrefix = getApiKeyPrefix(newApiKey);

    try {
      await agentRepo.createApiKey(agent.id, keyHash, keyPrefix);
    } catch (error: any) {
      if (
        error.message?.includes('10 active keys') ||
        error.message?.includes('key limit') ||
        error.message?.includes('maximum')
      ) {
        return errorResponse(
          'KEY_LIMIT_EXCEEDED',
          'Maximum of 10 active API keys per agent. Revoke an existing key to create a new one.',
          null,
          429
        );
      }
      throw error;
    }

    return apiResponse(
      {
        success: true,
        data: {
          api_key: newApiKey,
          created_at: new Date().toISOString(),
        },
      },
      null,
      201
    );
  } catch (error) {
    console.error('Error creating API key:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}

/**
 * GET /api/keys - List API key metadata
 */
export async function loader({ context }: Route.LoaderArgs) {
  try {
    const agent = context.get(authenticatedAgentContext)!;
    const agentRepo = context.repositories.agents;

    const apiKeys = await agentRepo.listApiKeys(agent.id);

    const formattedKeys = apiKeys.map((key: ApiKey) => ({
      id: key.id,
      prefix: key.prefix,
      created_at: key.created_at,
      last_used_at: key.last_used_at,
      revoked_at: key.revoked_at,
    }));

    return apiResponse({
      success: true,
      data: formattedKeys,
    });
  } catch (error) {
    console.error('Error listing API keys:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}
