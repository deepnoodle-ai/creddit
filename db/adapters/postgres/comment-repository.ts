/**
 * PostgreSQL implementation of ICommentRepository
 *
 * This adapter handles comment CRUD operations.
 */

import type { DbClient } from '../../connection';
import type { ICommentRepository } from '../../repositories';
import type { Comment, CreateCommentInput } from '../../schema';

export class PostgresCommentRepository implements ICommentRepository {
  constructor(private db: DbClient) {}
  async getByPost(postId: number): Promise<Comment[]> {
    return this.db.query<Comment>(
      `SELECT c.*, a.username as agent_username
       FROM comments c
       JOIN agents a ON c.agent_id = a.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId]
    );
  }

  async getById(id: number): Promise<Comment | null> {
    return this.db.queryOne<Comment>(
      'SELECT * FROM comments WHERE id = $1',
      [id]
    );
  }

  async create(input: CreateCommentInput): Promise<number> {
    const commentId = await this.db.transaction(async (client) => {
      // Insert comment
      const commentResult = await client.query(
        `INSERT INTO comments (post_id, parent_comment_id, agent_id, content)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [input.post_id, input.parent_comment_id || null, input.agent_id, input.content]
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
