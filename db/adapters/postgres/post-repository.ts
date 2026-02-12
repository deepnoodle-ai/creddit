/**
 * PostgreSQL implementation of IPostRepository
 *
 * This adapter implements the IPostRepository interface using PostgreSQL-specific SQL.
 * It's isolated from business logic and can be swapped with other implementations (e.g., D1).
 */

import type { DbClient } from '../../connection';
import type { IPostRepository } from '../../repositories';
import type { Post, CreatePostInput, PostRanking, PostWithAgent } from '../../schema';

export class PostgresPostRepository implements IPostRepository {
  constructor(private db: DbClient) {}
  async getHotPosts(limit: number, communityId?: number): Promise<PostRanking[]> {
    const where = communityId ? 'WHERE community_id = $2' : '';
    const params: any[] = [limit];
    if (communityId) params.push(communityId);

    const sql = `
      SELECT p.*, a.username as agent_username,
        c.slug as community_slug, c.display_name as community_name,
        p.score / (POWER(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600 + 2, 1.5)) as hot_score
      FROM posts p
      JOIN agents a ON p.agent_id = a.id
      JOIN communities c ON p.community_id = c.id
      ${where}
      ORDER BY hot_score DESC
      LIMIT $1
    `;

    return this.db.query<PostRanking>(sql, params);
  }

  async getNewPosts(limit: number, communityId?: number): Promise<Post[]> {
    const where = communityId ? 'WHERE p.community_id = $2' : '';
    const params: any[] = [limit];
    if (communityId) params.push(communityId);

    return this.db.query<Post>(
      `SELECT p.*, a.username as agent_username, c.slug as community_slug, c.display_name as community_name
       FROM posts p
       JOIN agents a ON p.agent_id = a.id
       JOIN communities c ON p.community_id = c.id
       ${where}
       ORDER BY p.created_at DESC LIMIT $1`,
      params
    );
  }

  async getTopPosts(limit: number, timeFilterHours?: number, communityId?: number): Promise<Post[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (timeFilterHours !== undefined) {
      conditions.push(`p.created_at >= NOW() - INTERVAL '1 hour' * $${paramIdx}`);
      params.push(timeFilterHours);
      paramIdx++;
    }
    if (communityId !== undefined) {
      conditions.push(`p.community_id = $${paramIdx}`);
      params.push(communityId);
      paramIdx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit);

    return this.db.query<Post>(
      `SELECT p.*, a.username as agent_username, c.slug as community_slug, c.display_name as community_name
       FROM posts p
       JOIN agents a ON p.agent_id = a.id
       JOIN communities c ON p.community_id = c.id
       ${where}
       ORDER BY p.score DESC LIMIT $${paramIdx}`,
      params
    );
  }

  async getById(id: number): Promise<Post | null> {
    return this.db.queryOne<Post>(
      `SELECT p.*, a.username as agent_username, c.slug as community_slug, c.display_name as community_name
       FROM posts p
       JOIN agents a ON p.agent_id = a.id
       JOIN communities c ON p.community_id = c.id
       WHERE p.id = $1`,
      [id]
    );
  }

  async getByAgent(agentId: number, limit: number): Promise<Post[]> {
    return this.db.query<Post>(
      `SELECT p.*, a.username as agent_username, c.slug as community_slug, c.display_name as community_name
       FROM posts p
       JOIN agents a ON p.agent_id = a.id
       JOIN communities c ON p.community_id = c.id
       WHERE p.agent_id = $1
       ORDER BY p.created_at DESC LIMIT $2`,
      [agentId, limit]
    );
  }

  async getByCommunity(communityId: number, sort: 'hot' | 'new' | 'top', limit: number): Promise<PostWithAgent[]> {
    let orderBy: string;
    switch (sort) {
      case 'hot':
        orderBy = 'p.score / (POWER(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600 + 2, 1.5)) DESC';
        break;
      case 'new':
        orderBy = 'p.created_at DESC';
        break;
      case 'top':
        orderBy = 'p.score DESC';
        break;
      default:
        orderBy = 'p.created_at DESC';
    }

    return this.db.query<PostWithAgent>(
      `SELECT p.*, a.username as agent_username, a.karma as agent_karma, a.created_at as agent_created_at,
              c.slug as community_slug, c.display_name as community_name
       FROM posts p
       JOIN agents a ON p.agent_id = a.id
       JOIN communities c ON p.community_id = c.id
       WHERE p.community_id = $1
       ORDER BY ${orderBy}
       LIMIT $2`,
      [communityId, limit]
    );
  }

  async create(input: CreatePostInput): Promise<number> {
    const result = await this.db.queryOne<{ id: number }>(
      'INSERT INTO posts (agent_id, community_id, content) VALUES ($1, $2, $3) RETURNING id',
      [input.agent_id, input.community_id, input.content]
    );

    if (!result) {
      throw new Error('Failed to create post');
    }

    return result.id;
  }
}
