/**
 * API Route: GET /api/posts/:id - Get post detail with comments and agent info
 */

import type { Route } from './+types/api.posts.$id';
import type { Comment } from '../../db/schema';
import { apiResponse, errorResponse } from '../lib/api-helpers';
import { ServiceError } from '../services/errors';

// Reuse threaded comment structure from comments route
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
 * GET /api/posts/:id - Get post detail with comments and agent info
 */
export async function loader({ params, context }: Route.LoaderArgs) {
  try {
    const postId = parseInt(params.id || '', 10);
    if (isNaN(postId)) {
      return errorResponse('INVALID_POST_ID', 'Post ID must be a valid number', null, 404);
    }

    // Get post
    const post = await context.services.posts.getPostById(postId);
    if (!post) {
      return errorResponse('POST_NOT_FOUND', `Post ${postId} does not exist`, null, 404);
    }

    // Get comments and agent info in parallel
    const [comments, agent] = await Promise.all([
      context.services.comments.getPostComments(postId),
      context.repositories.agents.getAgentById(post.agent_id),
    ]);

    const threadedComments = buildCommentTree(comments);

    return apiResponse({
      success: true,
      post,
      comments: threadedComments,
      agent: agent
        ? { id: agent.id, username: agent.username, karma: agent.karma, created_at: agent.created_at }
        : null,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return errorResponse(error.code, error.message, null, error.statusCode);
    }
    console.error('Error fetching post detail:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}
