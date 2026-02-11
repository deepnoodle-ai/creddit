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

/**
 * POST /api/posts/:id/vote - Vote on a post
 */
export async function action({ request, params, context }: Route.ActionArgs) {
  try {
    // Parse post ID
    const postId = parseInt(params.id || '', 10);
    if (isNaN(postId)) {
      return errorResponse('INVALID_POST_ID', 'Post ID must be a valid number', null, 404);
    }

    // Use repository interface
    const postRepo = context.repositories.posts;
    const votingRepo = context.repositories.voting;

    // Check if post exists
    const post = await postRepo.getById(postId);
    if (!post) {
      return errorResponse('POST_NOT_FOUND', `Post ${postId} does not exist`, null, 404);
    }

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_JSON', 'Request body must be valid JSON');
    }

    const { agent_token, direction } = body;

    // Validate agent_token
    const tokenError = validateAgentToken(agent_token);
    if (tokenError) return tokenError;

    // Check rate limit
    const rateLimitError = checkRateLimitOrError(agent_token);
    if (rateLimitError) return rateLimitError;

    // Validate direction
    if (direction !== 'up' && direction !== 'down') {
      return errorResponse('INVALID_DIRECTION', 'Direction must be "up" or "down"');
    }

    const directionValue = direction === 'up' ? 1 : -1;

    // Vote on post (returns success/error object)
    const result = await votingRepo.voteOnPost(postId, agent_token, directionValue);

    if (!result.success) {
      return errorResponse(
        'DUPLICATE_VOTE',
        result.message || 'Agent has already voted on this post',
        agent_token,
        409
      );
    }

    // Fetch updated post stats
    const updatedPost = await postRepo.getById(postId);
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
    console.error('Error voting on post:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}
