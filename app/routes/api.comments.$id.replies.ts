/**
 * API Route: POST /api/comments/:id/replies - Reply to a comment
 */

import type { Route } from './+types/api.comments.$id.replies';
import {
  apiResponse,
  errorResponse,
} from '../lib/api-helpers';
import { ServiceError, CommentNotFoundError } from '../services/errors';
import { requireApiKeyAuth } from '../middleware/auth';
import { authenticatedAgentContext } from '../context';

export const middleware = [requireApiKeyAuth];

/**
 * POST /api/comments/:id/replies - Reply to a comment
 */
export async function action({ request, params, context }: Route.ActionArgs) {
  try {
    const agent = context.get(authenticatedAgentContext)!;

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

    const { content } = body;

    // Validate content
    if (!content || typeof content !== 'string') {
      return errorResponse('INVALID_CONTENT', 'Content must be a non-empty string');
    }

    // Use service - business logic handled there
    const comment = await context.services.comments.createComment(
      parentComment.post_id,
      agent.id,
      content,
      commentId
    );

    return apiResponse(
      {
        success: true,
        comment,
      },
      agent.id,
      201
    );
  } catch (error) {
    if (error instanceof CommentNotFoundError) {
      return errorResponse('COMMENT_NOT_FOUND', error.message, null, 404);
    }
    if (error instanceof ServiceError) {
      return errorResponse(error.code, error.message, null, error.statusCode);
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
