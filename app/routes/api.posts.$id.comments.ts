/**
 * API Route: POST /api/posts/:id/comments - Create a top-level comment
 * API Route: GET /api/posts/:id/comments - Get all comments on a post (threaded)
 */

import type { Route } from './+types/api.posts.$id.comments';
import type { Comment } from '../../db/schema';
import {
  apiResponse,
  errorResponse,
  validateAgentToken,
  checkRateLimitOrError,
} from '../lib/api-helpers';
import { ServiceError, PostNotFoundError } from '../services/errors';

// Helper to build threaded comment structure
interface ThreadedComment extends Comment {
  replies: ThreadedComment[];
}

function buildCommentTree(comments: Comment[]): ThreadedComment[] {
  const commentMap = new Map<number, ThreadedComment>();
  const rootComments: ThreadedComment[] = [];

  // First pass: create all comment objects
  for (const comment of comments) {
    commentMap.set(comment.id, { ...comment, replies: [] });
  }

  // Second pass: build tree structure
  for (const comment of comments) {
    const threadedComment = commentMap.get(comment.id)!;

    if (comment.parent_comment_id === null) {
      // Top-level comment
      rootComments.push(threadedComment);
    } else {
      // Reply to another comment
      const parent = commentMap.get(comment.parent_comment_id);
      if (parent) {
        parent.replies.push(threadedComment);
      } else {
        // Parent not found (shouldn't happen with proper foreign keys)
        // Treat as top-level
        rootComments.push(threadedComment);
      }
    }
  }

  return rootComments;
}

/**
 * GET /api/posts/:id/comments - Get all comments on a post (threaded)
 */
export async function loader({ params, context }: Route.LoaderArgs) {
  try {
    // Parse post ID
    const postId = parseInt(params.id || '', 10);
    if (isNaN(postId)) {
      return errorResponse('INVALID_POST_ID', 'Post ID must be a valid number', null, 404);
    }

    // Use service - business logic handled there
    const comments = await context.services.comments.getPostComments(postId);

    // Build threaded structure (view concern - kept in route)
    const threadedComments = buildCommentTree(comments);

    return apiResponse({
      success: true,
      comments: threadedComments,
    });
  } catch (error) {
    if (error instanceof PostNotFoundError) {
      return errorResponse('POST_NOT_FOUND', error.message, null, 404);
    }
    if (error instanceof ServiceError) {
      return errorResponse(error.code, error.message, null, error.statusCode);
    }
    console.error('Error fetching comments:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}

/**
 * POST /api/posts/:id/comments - Create a top-level comment on a post
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
    const comment = await context.services.comments.createComment(postId, agent_token!, content);

    return apiResponse(
      {
        success: true,
        comment,
      },
      agent_token,
      201
    );
  } catch (error) {
    if (error instanceof PostNotFoundError) {
      return errorResponse('POST_NOT_FOUND', error.message, agent_token, 404);
    }
    if (error instanceof ServiceError) {
      return errorResponse(error.code, error.message, agent_token, error.statusCode);
    }
    console.error('Error creating comment:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}
