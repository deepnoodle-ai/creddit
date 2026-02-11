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

    // Use repository interface
    const postRepo = context.repositories.posts;
    const commentRepo = context.repositories.comments;

    // Check if post exists
    const post = await postRepo.getById(postId);
    if (!post) {
      return errorResponse('POST_NOT_FOUND', `Post ${postId} does not exist`, null, 404);
    }

    // Fetch all comments for this post
    const comments = await commentRepo.getByPost(postId);

    // Build threaded structure
    const threadedComments = buildCommentTree(comments);

    return apiResponse({
      success: true,
      comments: threadedComments,
    });
  } catch (error) {
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
  try {
    // Parse post ID
    const postId = parseInt(params.id || '', 10);
    if (isNaN(postId)) {
      return errorResponse('INVALID_POST_ID', 'Post ID must be a valid number', null, 404);
    }

    // Use repository interface
    const postRepo = context.repositories.posts;
    const agentRepo = context.repositories.agents;
    const commentRepo = context.repositories.comments;

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

    // Create comment
    const commentId = await commentRepo.create({
      post_id: postId,
      parent_comment_id: null,
      agent_token,
      content,
    });

    // Fetch the created comment using queryOne from connection
    const { queryOne } = await import('../../db/connection');
    const comment = await queryOne('SELECT * FROM comments WHERE id = $1', [commentId]);

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
    console.error('Error creating comment:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}
