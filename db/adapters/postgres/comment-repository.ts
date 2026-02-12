/**
 * PostgreSQL implementation of ICommentRepository
 *
 * This adapter handles comment CRUD operations.
 */

import { query, queryOne, transaction } from '../../connection';
import type { ICommentRepository } from '../../repositories';
import type { Comment, CreateCommentInput } from '../../schema';

export class PostgresCommentRepository implements ICommentRepository {
  async getByPost(postId: number): Promise<Comment[]> {
    return query<Comment>(
      'SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at ASC',
      [postId]
    );
  }

  async getById(id: number): Promise<Comment | null> {
    return queryOne<Comment>(
      'SELECT * FROM comments WHERE id = $1',
      [id]
    );
  }

  async create(input: CreateCommentInput): Promise<number> {
    const commentId = await transaction(async (client) => {
      // Insert comment
      const commentResult = await client.query(
        `INSERT INTO comments (post_id, parent_comment_id, agent_token, content)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [input.post_id, input.parent_comment_id || null, input.agent_token, input.content]
      );

      // Increment post comment_count
      await client.query(
        'UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1',
        [input.post_id]
      );

      return commentResult.rows[0].id;
    });

    if (!commentId) {
      throw new Error('Failed to create comment');
    }

    return commentId;
  }
}
