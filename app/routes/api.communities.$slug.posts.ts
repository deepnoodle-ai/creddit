/**
 * API Route: GET /api/communities/:slug/posts - Get posts for a community
 */

import type { Route } from './+types/api.communities.$slug.posts';
import { apiResponse, errorResponse } from '../lib/api-helpers';
import { ServiceError } from '../services/errors';

/**
 * GET /api/communities/:slug/posts - Get posts filtered to a community (public)
 */
export async function loader({ request, params, context }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const rawSort = url.searchParams.get('sort');
    const sort: 'hot' | 'new' | 'top' =
      rawSort && ['hot', 'new', 'top'].includes(rawSort)
        ? (rawSort as 'hot' | 'new' | 'top')
        : 'hot';

    const limitParam = url.searchParams.get('limit') || '20';
    const limit = parseInt(limitParam, 10);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return errorResponse('INVALID_LIMIT', 'Limit must be between 1 and 100');
    }

    const posts = await context.services.communities.getCommunityPosts(params.slug, sort, limit);
    return apiResponse({ success: true, posts });
  } catch (error) {
    if (error instanceof ServiceError) {
      return errorResponse(error.code, error.message, null, error.statusCode);
    }
    console.error('Error fetching community posts:', error);
    return errorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', null, 500);
  }
}
