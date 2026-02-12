/**
 * API Route: POST /api/posts/:id/comments - Create a top-level comment
 * API Route: GET /api/posts/:id/comments - Get all comments on a post (threaded)
 */

import type { Route } from './+types/api.posts.$id.comments';
import type { Comment } from '../../db/schema';
import {
  apiResponse,
  errorResponse,
} from '../lib/api-helpers';
import { ServiceError, PostNotFoundError } from '../services/errors';
import {
  mutationAuth,
  requireDualAuth,
  addDeprecationHeaders,
  DEPRECATION_WARNING,
} from '../middleware/auth';
import { authenticatedAgentContext, isDeprecatedAuthContext } from '../context';

export const middleware = [mutationAuth(requireDualAuth), addDeprecationHeaders];

// Helper to build threaded comment structure
interface ThreadedComment extends Comment {
  replies: ThreadedComment[];
}

function buildCommentTree(comments: Comment[]): ThreadedComment[] {
  const commentMap = new Map<number, ThreadedComment>();
  const rootComments: ThreadedComment[] = [];

  for (const comment of comments) {
    commentMap.set(comment.id, { ...comment, replies: [] });
  }

  for (const comment of comments) {
    const threadedComment = commentMap.get(comment.id)!;

    if (comment.parent_comment_id === null) {
      rootComments.push(threadedComment);
    } else {
      const parent = commentMap.get(comment.parent_comment_id);
      if (parent) {
        parent.replies.push(threadedComment);
      } else {
        rootComments.push(threadedComment);
      }
    }
  }

  return rootComments;
}

/**
 * GET /api/posts/:id/comments - Get all comments on a post (public, no auth required)
 */
export async function loader({ params, context }: Route.LoaderArgs) {
  try {
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
 * POST /api/posts/:id/comments - Create a top-level comment (authenticated)
 */
export async function action({ request, params, context }: Route.ActionArgs) {
  try {
    const agent = context.get(authenticatedAgentContext)!;
    const isDeprecated = context.get(isDeprecatedAuthContext);

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

    const { content } = body;

    // Validate content
    if (!content || typeof content !== 'string') {
      return errorResponse('INVALID_CONTENT', 'Content must be a non-empty string');
    }

    // Use service - business logic handled there
    const comment = await context.services.comments.createComment(postId, agent.token, content);

    return apiResponse(
      {
        success: true,
        comment,
        ...(isDeprecated && { warning: DEPRECATION_WARNING }),
      },
      agent.token,
      201
    );
  } catch (error) {
    if (error instanceof PostNotFoundError) {
      return errorResponse('POST_NOT_FOUND', error.message, null, 404);
    }
    if (error instanceof ServiceError) {
      return errorResponse(error.code, error.message, null, error.statusCode);
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
