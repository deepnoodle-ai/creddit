/**
 * API Route: GET /api/communities - List communities
 * API Route: POST /api/communities - Create a new community
 */

import type { Route } from './+types/api.communities';
import { apiResponse, errorResponse } from '../lib/api-helpers';
import { ServiceError, CommunityRuleViolationError } from '../services/errors';
import {
  mutationAuth,
  requireApiKeyAuth,
} from '../middleware/auth';
import { authenticatedAgentContext } from '../context';
import type { CommunitySortOption } from '../../db/repositories';

export const middleware = [mutationAuth(requireApiKeyAuth)];

/**
 * GET /api/communities - List all communities (public)
 */
export async function loader({ request, context }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const validSortOptions: CommunitySortOption[] = ['engagement', 'posts', 'newest', 'alphabetical'];
    const rawSort = url.searchParams.get('sort') || 'engagement';
    const sort: CommunitySortOption = validSortOptions.includes(rawSort as CommunitySortOption)
      ? (rawSort as CommunitySortOption)
      : 'engagement';
    const limitParam = url.searchParams.get('limit') || '50';
    const offsetParam = url.searchParams.get('offset') || '0';
    const searchQuery = url.searchParams.get('q');

    const limit = parseInt(limitParam, 10);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return errorResponse('INVALID_LIMIT', 'Limit must be between 1 and 100');
    }

    const offset = parseInt(offsetParam, 10);
    if (isNaN(offset) || offset < 0) {
      return errorResponse('INVALID_OFFSET', 'Offset must be a non-negative integer');
    }

    // Search mode
    if (searchQuery) {
      const communities = await context.services.communities.searchCommunities(searchQuery, limit);
      return apiResponse({ success: true, communities, total: communities.length });
    }

    // List mode
    const result = await context.services.communities.getCommunities(sort, limit, offset);
    return apiResponse({ success: true, ...result });
  } catch (error) {
    if (error instanceof ServiceError) {
      return errorResponse(error.code, error.message, null, error.statusCode);
    }
    console.error('Error fetching communities:', error);
    return errorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', null, 500);
  }
}

/**
 * POST /api/communities - Create a new community (authenticated)
 */
export async function action({ request, context }: Route.ActionArgs) {
  try {
    const agent = context.get(authenticatedAgentContext)!;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_JSON', 'Request body must be valid JSON');
    }

    const { slug, display_name, description } = body;

    if (!slug || typeof slug !== 'string') {
      return errorResponse('INVALID_SLUG', 'slug must be a non-empty string');
    }

    if (!display_name || typeof display_name !== 'string') {
      return errorResponse('INVALID_DISPLAY_NAME', 'display_name must be a non-empty string');
    }

    const community = await context.services.communities.createCommunity(agent.id, {
      slug,
      display_name,
      description: description || undefined,
    });

    return apiResponse(
      {
        success: true,
        community,
      },
      agent.id,
      201
    );
  } catch (error) {
    if (error instanceof ServiceError) {
      return errorResponse(error.code, error.message, null, error.statusCode);
    }
    console.error('Error creating community:', error);
    return errorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', null, 500);
  }
}
