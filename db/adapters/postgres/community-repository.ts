/**
 * PostgreSQL implementation of ICommunityRepository
 */

import { query, queryOne } from '../../connection';
import type { ICommunityRepository, CommunitySortOption } from '../../repositories';
import type { Community, CreateCommunityInput } from '../../schema';

export class PostgresCommunityRepository implements ICommunityRepository {
  async getAll(sort: CommunitySortOption, limit: number, offset: number): Promise<Community[]> {
    let orderBy: string;
    switch (sort) {
      case 'engagement':
        orderBy = 'engagement_score DESC, created_at DESC';
        break;
      case 'posts':
        orderBy = 'post_count DESC, created_at DESC';
        break;
      case 'newest':
        orderBy = 'created_at DESC';
        break;
      case 'alphabetical':
        orderBy = 'display_name ASC';
        break;
      default:
        orderBy = 'engagement_score DESC, created_at DESC';
    }

    return query<Community>(
      `SELECT * FROM communities ORDER BY ${orderBy} LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
  }

  async getBySlug(slug: string): Promise<Community | null> {
    return queryOne<Community>(
      'SELECT * FROM communities WHERE slug = $1',
      [slug]
    );
  }

  async getById(id: number): Promise<Community | null> {
    return queryOne<Community>(
      'SELECT * FROM communities WHERE id = $1',
      [id]
    );
  }

  async create(input: CreateCommunityInput): Promise<number> {
    const result = await queryOne<{ id: number }>(
      `INSERT INTO communities (slug, display_name, description, posting_rules, creator_agent_token)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        input.slug,
        input.display_name,
        input.description || null,
        input.posting_rules || null,
        input.creator_agent_token,
      ]
    );

    if (!result) {
      throw new Error('Failed to create community');
    }

    return result.id;
  }

  async setPostingRules(communityId: number, rules: string | null): Promise<void> {
    await query(
      'UPDATE communities SET posting_rules = $1, updated_at = NOW() WHERE id = $2',
      [rules, communityId]
    );
  }

  async incrementPostCount(communityId: number): Promise<void> {
    await query(
      'UPDATE communities SET post_count = post_count + 1, updated_at = NOW() WHERE id = $1',
      [communityId]
    );
  }

  async decrementPostCount(communityId: number): Promise<void> {
    await query(
      'UPDATE communities SET post_count = GREATEST(post_count - 1, 0), updated_at = NOW() WHERE id = $1',
      [communityId]
    );
  }

  async recalculateEngagementScore(communityId: number): Promise<void> {
    await query(
      `UPDATE communities SET engagement_score = COALESCE((
        SELECT
          COUNT(*)::int
          * COUNT(DISTINCT agent_token)::int
          * GREATEST(AVG(score)::int, 0)
        FROM posts
        WHERE community_id = $1
      ), 0), updated_at = NOW()
      WHERE id = $1`,
      [communityId]
    );
  }

  async slugExists(slug: string): Promise<boolean> {
    const result = await queryOne<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM communities WHERE slug = $1) as exists',
      [slug]
    );
    return result?.exists ?? false;
  }

  async getTotalCount(): Promise<number> {
    const result = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM communities'
    );
    return parseInt(result?.count ?? '0', 10);
  }

  async getByCreator(agentToken: string): Promise<Community[]> {
    return query<Community>(
      'SELECT * FROM communities WHERE creator_agent_token = $1 ORDER BY created_at DESC',
      [agentToken]
    );
  }

  async search(searchQuery: string, limit: number): Promise<Community[]> {
    return query<Community>(
      `SELECT * FROM communities
       WHERE display_name ILIKE $1 OR description ILIKE $1
       ORDER BY engagement_score DESC, created_at DESC
       LIMIT $2`,
      [`%${searchQuery}%`, limit]
    );
  }
}
