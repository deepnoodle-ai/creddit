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

/**
 * POST /api/comments/:id/replies - Reply to a comment
 */
export async function action({ request, params, context }: Route.ActionArgs) {
  try {
    // Parse comment ID
    const commentId = parseInt(params.id || '', 10);
    if (isNaN(commentId)) {
      return errorResponse('INVALID_COMMENT_ID', 'Comment ID must be a valid number', null, 404);
    }

    // Use repository interface
    const agentRepo = context.repositories.agents;
    const commentRepo = context.repositories.comments;

    // Check if parent comment exists
    const { queryOne } = await import('../../db/connection');
    const parentComment = await queryOne('SELECT * FROM comments WHERE id = $1', [commentId]);

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

    if (content.length < 1 || content.length > 2000) {
      return errorResponse('INVALID_CONTENT', 'Content must be 1-2,000 characters');
    }

    // Ensure agent exists
    await agentRepo.getOrCreate(agent_token);

    // Create reply comment
    const replyId = await commentRepo.create({
      post_id: (parentComment as any).post_id,
      parent_comment_id: commentId,
      agent_token,
      content,
    });

    // Fetch the created comment
    const comment = await queryOne('SELECT * FROM comments WHERE id = $1', [replyId]);

    if (!comment) {
      return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to retrieve created comment', agent_token, 500);
    }

    return apiResponse(
      {
        success: true,
        comment,
      },
      agent_token,
      201
    );
  } catch (error) {
    console.error('Error creating reply:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}
