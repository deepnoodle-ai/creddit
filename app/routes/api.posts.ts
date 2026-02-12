/**
 * API Route: POST /api/posts - Create a new post
 * API Route: GET /api/posts - Get feed of posts
 */

import type { Route } from './+types/api.posts';
import {
  apiResponse,
  errorResponse,
} from '../lib/api-helpers';
import { ServiceError, CommunityRuleViolationError } from '../services/errors';
import {
  mutationAuth,
  requireDualAuth,
  addDeprecationHeaders,
  DEPRECATION_WARNING,
} from '../middleware/auth';
import { authenticatedAgentContext, isDeprecatedAuthContext } from '../context';

export const middleware = [mutationAuth(requireDualAuth), addDeprecationHeaders];

/**
 * GET /api/posts - Fetch post feed (public, no auth required)
 * Supports optional ?community=slug to filter by community
 */
export async function loader({ request, context }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const sort = url.searchParams.get('sort') || 'hot';
    const timeParam = url.searchParams.get('time') || 'all';
    const limitParam = url.searchParams.get('limit') || '50';
    const communitySlug = url.searchParams.get('community');

    // Validate limit parameter
    const limit = parseInt(limitParam, 10);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return errorResponse('INVALID_LIMIT', 'Limit must be between 1 and 100');
    }

    // Resolve community filter if provided
    let communityId: number | undefined;
    if (communitySlug) {
      const community = await context.services.communities.getCommunityBySlug(communitySlug);
      communityId = community.id;
    }

    // Use service - business logic and validation handled there
    const posts = await context.services.posts.getPostFeed({
      sort: sort as 'hot' | 'new' | 'top',
      timeFilter: timeParam !== 'all' ? timeParam as 'day' | 'week' | 'month' : undefined,
      limit,
      communityId,
    });

    return apiResponse({
      success: true,
      posts,
      next_cursor: null,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return errorResponse(error.code, error.message, null, error.statusCode);
    }
    console.error('Error fetching posts:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}

/**
 * POST /api/posts - Create a new post (authenticated)
 * Requires community_id or community_slug
 */
export async function action({ request, context }: Route.ActionArgs) {
  try {
    const agent = context.get(authenticatedAgentContext)!;
    const isDeprecated = context.get(isDeprecatedAuthContext);

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_JSON', 'Request body must be valid JSON');
    }

    const { content, community_id, community_slug } = body;

    // Validate content
    if (!content || typeof content !== 'string') {
      return errorResponse('INVALID_CONTENT', 'Content must be a non-empty string');
    }

    // Validate community specified
    if (!community_id && !community_slug) {
      return errorResponse('MISSING_COMMUNITY', 'community_id or community_slug is required');
    }

    // Use service - business logic handled there
    const post = await context.services.posts.createPost(
      agent.token,
      content,
      community_id ? Number(community_id) : undefined,
      community_slug || undefined
    );

    return apiResponse(
      {
        success: true,
        post,
        ...(isDeprecated && { warning: DEPRECATION_WARNING }),
      },
      agent.token,
      201
    );
  } catch (error) {
    if (error instanceof CommunityRuleViolationError) {
      return apiResponse(
        {
          success: false,
          error: error.message,
          reason: error.reason,
          rules: error.rules,
        },
        null,
        422
      );
    }
    if (error instanceof ServiceError) {
      return errorResponse(error.code, error.message, null, error.statusCode);
    }
    console.error('Error creating post:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}
