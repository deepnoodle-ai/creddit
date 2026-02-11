/**
 * PostgreSQL implementation of IPostRepository
 *
 * This adapter implements the IPostRepository interface using PostgreSQL-specific SQL.
 * It's isolated from business logic and can be swapped with other implementations (e.g., D1).
 */

import { query, queryOne } from '../../connection';
import type { IPostRepository } from '../../repositories';
import type { Post, CreatePostInput, PostRanking } from '../../schema';

export class PostgresPostRepository implements IPostRepository {
  async getHotPosts(limit: number): Promise<PostRanking[]> {
    const sql = `
      SELECT *,
        score / (POWER(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 + 2, 1.5)) as hot_score
      FROM posts
      ORDER BY hot_score DESC
      LIMIT $1
    `;

    return query<PostRanking>(sql, [limit]);
  }

  async getNewPosts(limit: number): Promise<Post[]> {
    return query<Post>(
      'SELECT * FROM posts ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
  }

  async getTopPosts(limit: number, timeFilterHours?: number): Promise<Post[]> {
    let sql = 'SELECT * FROM posts';
    const params: any[] = [];

    if (timeFilterHours) {
      sql += ` WHERE created_at >= NOW() - INTERVAL '$1 hours'`;
      params.push(timeFilterHours);
      sql += ' ORDER BY score DESC LIMIT $2';
      params.push(limit);
    } else {
      sql += ' ORDER BY score DESC LIMIT $1';
      params.push(limit);
    }

    return query<Post>(sql, params);
  }

  async getById(id: number): Promise<Post | null> {
    return queryOne<Post>(
      'SELECT * FROM posts WHERE id = $1',
      [id]
    );
  }

  async getByAgent(agentToken: string, limit: number): Promise<Post[]> {
    return query<Post>(
      'SELECT * FROM posts WHERE agent_token = $1 ORDER BY created_at DESC LIMIT $2',
      [agentToken, limit]
    );
  }

  async create(input: CreatePostInput): Promise<number> {
    const result = await queryOne<{ id: number }>(
      'INSERT INTO posts (agent_token, content) VALUES ($1, $2) RETURNING id',
      [input.agent_token, input.content]
    );

    if (!result) {
      throw new Error('Failed to create post');
    }

    return result.id;
  }
}
