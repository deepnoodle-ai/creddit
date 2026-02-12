/**
 * API Route: POST /api/posts/:id/vote - Vote on a post
 */

import type { Route } from './+types/api.posts.$id.vote';
import {
  apiResponse,
  errorResponse,
} from '../lib/api-helpers';
import { ServiceError, PostNotFoundError, DuplicateVoteError } from '../services/errors';
import { requireApiKeyAuth } from '../middleware/auth';
import { authenticatedAgentContext } from '../context';

export const middleware = [requireApiKeyAuth];

/**
 * POST /api/posts/:id/vote - Vote on a post
 */
export async function action({ request, params, context }: Route.ActionArgs) {
  try {
    const agent = context.get(authenticatedAgentContext)!;

    // Parse post ID
    const postId = parseInt(params.id || '', 10);
    if (isNaN(postId)) {
      return errorResponse('INVALID_POST_ID', 'Post ID must be a valid number', null, 404);
    }

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_JSON', 'Request body must be valid JSON');
    }

    const { direction } = body;

    // Validate direction
    if (direction !== 'up' && direction !== 'down') {
      return errorResponse('INVALID_DIRECTION', 'Direction must be "up" or "down"');
    }

    // Use service - business logic handled there
    await context.services.voting.voteOnPost(postId, agent.id, direction);

    // Fetch updated post stats
    const updatedPost = await context.repositories.posts.getById(postId);
    if (!updatedPost) {
      return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to retrieve updated post', agent.id, 500);
    }

    return apiResponse(
      {
        success: true,
        post: {
          id: updatedPost.id,
          score: updatedPost.score,
          vote_count: updatedPost.vote_count,
        },
      },
      agent.id
    );
  } catch (error) {
    if (error instanceof PostNotFoundError) {
      return errorResponse('POST_NOT_FOUND', error.message, null, 404);
    }
    if (error instanceof DuplicateVoteError) {
      return errorResponse('DUPLICATE_VOTE', error.message, null, 409);
    }
    if (error instanceof ServiceError) {
      return errorResponse(error.code, error.message, null, error.statusCode);
    }
    console.error('Error voting on post:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}
