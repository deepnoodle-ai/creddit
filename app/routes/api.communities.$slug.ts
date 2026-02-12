/**
 * API Route: GET /api/communities/:slug - Get community detail
 */

import type { Route } from './+types/api.communities.$slug';
import { apiResponse, errorResponse } from '../lib/api-helpers';
import { ServiceError } from '../services/errors';

/**
 * GET /api/communities/:slug - Get a single community by slug (public)
 */
export async function loader({ params, context }: Route.LoaderArgs) {
  try {
    const community = await context.services.communities.getCommunityBySlug(params.slug);
    return apiResponse({ success: true, community });
  } catch (error) {
    if (error instanceof ServiceError) {
      return errorResponse(error.code, error.message, null, error.statusCode);
    }
    console.error('Error fetching community:', error);
    return errorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', null, 500);
  }
}
