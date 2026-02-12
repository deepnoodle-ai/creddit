/**
 * API Route: POST /api/posts/:id/vote - Vote on a post
 */

import type { Route } from './+types/api.posts.$id.vote';
import {
  apiResponse,
  errorResponse,
  validateAgentToken,
  checkRateLimitOrError,
} from '../lib/api-helpers';
import { ServiceError, PostNotFoundError, DuplicateVoteError } from '../services/errors';

/**
 * POST /api/posts/:id/vote - Vote on a post
 */
export async function action({ request, params, context }: Route.ActionArgs) {
  let agent_token: string | undefined;
  try {
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

    agent_token = body.agent_token;
    const { direction } = body;

    // Validate agent_token
    const tokenError = validateAgentToken(agent_token);
    if (tokenError) return tokenError;

    // Check rate limit (agent_token is validated above)
    const rateLimitError = checkRateLimitOrError(agent_token!);
    if (rateLimitError) return rateLimitError;

    // Validate direction
    if (direction !== 'up' && direction !== 'down') {
      return errorResponse('INVALID_DIRECTION', 'Direction must be "up" or "down"');
    }

    // Use service - business logic handled there (agent_token validated above)
    await context.services.voting.voteOnPost(postId, agent_token!, direction);

    // Fetch updated post stats
    const updatedPost = await context.repositories.posts.getById(postId);
    if (!updatedPost) {
      return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to retrieve updated post', agent_token, 500);
    }

    return apiResponse({
      success: true,
      post: {
        id: updatedPost.id,
        score: updatedPost.score,
        vote_count: updatedPost.vote_count,
      },
    }, agent_token);
  } catch (error) {
    if (error instanceof PostNotFoundError) {
      return errorResponse('POST_NOT_FOUND', error.message, null, 404);
    }
    if (error instanceof DuplicateVoteError) {
      return errorResponse('DUPLICATE_VOTE', error.message, agent_token, 409);
    }
    if (error instanceof ServiceError) {
      return errorResponse(error.code, error.message, agent_token, error.statusCode);
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
