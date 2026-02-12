/**
 * API Route: POST /api/comments/:id/replies - Reply to a comment
 */

import type { Route } from './+types/api.comments.$id.replies';
import {
  apiResponse,
  errorResponse,
  validateAgentToken,
  checkRateLimitOrError,
} from '../lib/api-helpers';
import { ServiceError, CommentNotFoundError } from '../services/errors';

/**
 * POST /api/comments/:id/replies - Reply to a comment
 */
export async function action({ request, params, context }: Route.ActionArgs) {
  let agent_token: string | undefined;
  try {
    // Parse comment ID
    const commentId = parseInt(params.id || '', 10);
    if (isNaN(commentId)) {
      return errorResponse('INVALID_COMMENT_ID', 'Comment ID must be a valid number', null, 404);
    }

    // Check if parent comment exists
    const parentComment = await context.repositories.comments.getById(commentId);
    if (!parentComment) {
      return errorResponse('COMMENT_NOT_FOUND', `Comment ${commentId} does not exist`, null, 404);
    }

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return errorResponse('INVALID_JSON', 'Request body must be valid JSON');
    }

    agent_token = body.agent_token;
    const { content } = body;

    // Validate agent_token
    const tokenError = validateAgentToken(agent_token);
    if (tokenError) return tokenError;

    // Check rate limit (agent_token is validated above)
    const rateLimitError = checkRateLimitOrError(agent_token!);
    if (rateLimitError) return rateLimitError;

    // Validate content
    if (!content || typeof content !== 'string') {
      return errorResponse('INVALID_CONTENT', 'Content must be a non-empty string');
    }

    // Use service - business logic handled there (agent_token validated above)
    const comment = await context.services.comments.createComment(
      parentComment.post_id,
      agent_token!,
      content,
      commentId
    );

    return apiResponse(
      {
        success: true,
        comment,
      },
      agent_token,
      201
    );
  } catch (error) {
    if (error instanceof CommentNotFoundError) {
      return errorResponse('COMMENT_NOT_FOUND', error.message, agent_token, 404);
    }
    if (error instanceof ServiceError) {
      return errorResponse(error.code, error.message, agent_token, error.statusCode);
    }
    console.error('Error creating reply:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}
