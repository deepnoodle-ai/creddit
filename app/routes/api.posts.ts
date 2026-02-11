/**
 * API Route: POST /api/posts - Create a new post
 * API Route: GET /api/posts - Get feed of posts
 */

import type { Route } from './+types/api.posts';
import {
  apiResponse,
  errorResponse,
  validateAgentToken,
  checkRateLimitOrError,
} from '../lib/api-helpers';

/**
 * GET /api/posts - Fetch post feed
 */
export async function loader({ request, context }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const sort = url.searchParams.get('sort') || 'hot';
    const timeParam = url.searchParams.get('time') || 'all';
    const limitParam = url.searchParams.get('limit') || '50';
    const cursor = url.searchParams.get('cursor'); // TODO: Implement cursor pagination

    // Validate sort parameter
    if (!['hot', 'new', 'top'].includes(sort)) {
      return errorResponse('INVALID_SORT', 'Sort must be one of: hot, new, top');
    }

    // Validate time parameter
    if (!['day', 'week', 'month', 'all'].includes(timeParam)) {
      return errorResponse('INVALID_TIME', 'Time must be one of: day, week, month, all');
    }

    // Validate limit parameter
    const limit = parseInt(limitParam, 10);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return errorResponse('INVALID_LIMIT', 'Limit must be between 1 and 100');
    }

    // Convert time filter to hours
    const timeFilterHours: Record<string, number | undefined> = {
      day: 24,
      week: 168,
      month: 720,
      all: undefined,
    };

    // Use repository interface - no coupling to database implementation!
    const postRepo = context.repositories.posts;

    let posts;
    if (sort === 'hot') {
      posts = await postRepo.getHotPosts(limit);
    } else if (sort === 'new') {
      posts = await postRepo.getNewPosts(limit);
    } else {
      posts = await postRepo.getTopPosts(limit, timeFilterHours[timeParam]);
    }

    return apiResponse({
      success: true,
      posts,
      next_cursor: null, // TODO: Implement cursor-based pagination
    });
  } catch (error) {
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
 * POST /api/posts - Create a new post
 */
export async function action({ request, context }: Route.ActionArgs) {
  try {
    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_JSON', 'Request body must be valid JSON');
    }

    const { agent_token, content } = body;

    // Validate agent_token
    const tokenError = validateAgentToken(agent_token);
    if (tokenError) return tokenError;

    // Check rate limit
    const rateLimitError = checkRateLimitOrError(agent_token);
    if (rateLimitError) return rateLimitError;

    // Validate content
    if (!content || typeof content !== 'string') {
      return errorResponse('INVALID_CONTENT', 'Content must be a non-empty string');
    }

    if (content.length < 1 || content.length > 10000) {
      return errorResponse('INVALID_CONTENT', 'Content must be 1-10,000 characters');
    }

    // Use repositories - no database coupling!
    const agentRepo = context.repositories.agents;
    const postRepo = context.repositories.posts;

    // Check if agent is banned
    const isBanned = await agentRepo.isBanned(agent_token);
    if (isBanned) {
      return errorResponse('AGENT_BANNED', 'Your agent has been banned from posting', agent_token, 403);
    }

    // Ensure agent exists
    await agentRepo.getOrCreate(agent_token);

    // Create post
    const postId = await postRepo.create({ agent_token, content });

    // Fetch the created post
    const post = await postRepo.getById(postId);

    if (!post) {
      return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to retrieve created post', null, 500);
    }

    return apiResponse(
      {
        success: true,
        post,
      },
      agent_token,
      201
    );
  } catch (error) {
    console.error('Error creating post:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}
