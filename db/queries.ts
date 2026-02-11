// @ts-nocheck — Legacy D1 module, replaced by queries-postgres.ts
/**
 * Database Query Functions
 *
 * Reusable query patterns for common database operations.
 * These functions demonstrate best practices for D1 queries.
 */

import type { D1Database } from '@cloudflare/workers-types';
import type {
  Agent,
  Post,
  Comment,
  Vote,
  CreatePostInput,
  CreateVoteInput,
  CreateCommentInput,
  PostRanking,
} from './schema';

/**
 * Fetch posts sorted by "hot" score (Reddit-style algorithm)
 * Formula: score / (age_hours + 2)^1.5
 *
 * @param db - D1 database instance
 * @param limit - Number of posts to fetch (default: 50)
 */
export async function getHotPosts(db: D1Database, limit: number = 50): Promise<PostRanking[]> {
  const query = `
    SELECT *,
      score / (POWER((julianday('now') - julianday(created_at)) * 24 + 2, 1.5)) as hot_score
    FROM posts
    ORDER BY hot_score DESC
    LIMIT ?
  `;

  const { results } = await db.prepare(query).bind(limit).all<PostRanking>();
  return results || [];
}

/**
 * Fetch posts sorted by newest first
 *
 * @param db - D1 database instance
 * @param limit - Number of posts to fetch (default: 50)
 */
export async function getNewPosts(db: D1Database, limit: number = 50): Promise<Post[]> {
  const { results } = await db.prepare(
    'SELECT * FROM posts ORDER BY created_at DESC LIMIT ?'
  ).bind(limit).all<Post>();

  return results || [];
}

/**
 * Fetch posts sorted by top score
 *
 * @param db - D1 database instance
 * @param limit - Number of posts to fetch (default: 50)
 * @param timeFilter - Time filter in hours (optional)
 */
export async function getTopPosts(
  db: D1Database,
  limit: number = 50,
  timeFilter?: number
): Promise<Post[]> {
  let query = 'SELECT * FROM posts';
  const params: any[] = [];

  if (timeFilter) {
    query += ` WHERE julianday('now') - julianday(created_at) <= ?`;
    params.push(timeFilter / 24); // Convert hours to days for julianday
  }

  query += ' ORDER BY score DESC LIMIT ?';
  params.push(limit);

  const { results } = await db.prepare(query).bind(...params).all<Post>();
  return results || [];
}

/**
 * Create a new post
 *
 * @param db - D1 database instance
 * @param input - Post data
 * @returns Created post ID
 */
export async function createPost(db: D1Database, input: CreatePostInput): Promise<number> {
  const result = await db.prepare(
    'INSERT INTO posts (agent_token, content) VALUES (?, ?) RETURNING id'
  ).bind(input.agent_token, input.content).first<{ id: number }>();

  if (!result) {
    throw new Error('Failed to create post');
  }

  return result.id;
}

/**
 * Record a vote on a post
 * This function handles the atomic update of post score and vote_count
 *
 * @param db - D1 database instance
 * @param input - Vote data
 * @returns Success boolean
 */
export async function createVote(db: D1Database, input: CreateVoteInput): Promise<boolean> {
  try {
    // Use a batch transaction to ensure atomicity
    await db.batch([
      // Insert vote record
      db.prepare(
        'INSERT INTO votes (post_id, agent_token, direction) VALUES (?, ?, ?)'
      ).bind(input.post_id, input.agent_token, input.direction),

      // Update post score and vote_count atomically
      db.prepare(
        'UPDATE posts SET score = score + ?, vote_count = vote_count + 1 WHERE id = ?'
      ).bind(input.direction, input.post_id),

      // Update agent karma (post author gets karma)
      db.prepare(`
        UPDATE agents
        SET karma = karma + ?
        WHERE token = (SELECT agent_token FROM posts WHERE id = ?)
      `).bind(input.direction, input.post_id),
    ]);

    return true;
  } catch (error) {
    // UNIQUE constraint violation on (post_id, agent_token) means duplicate vote
    if (error instanceof Error && error.message.includes('UNIQUE')) {
      return false;
    }
    throw error;
  }
}

/**
 * Calculate an agent's total karma from votes on their content
 * Note: For performance, karma should be cached in agents.karma table
 * and updated incrementally on each vote. This query is for validation.
 *
 * @param db - D1 database instance
 * @param agentToken - Agent token
 * @returns Total karma
 */
export async function calculateAgentKarma(db: D1Database, agentToken: string): Promise<number> {
  const query = `
    SELECT
      COALESCE(SUM(p.score), 0) + COALESCE(SUM(c.score), 0) as total_karma
    FROM agents a
    LEFT JOIN posts p ON p.agent_token = a.token
    LEFT JOIN comments c ON c.agent_token = a.token
    WHERE a.token = ?
  `;

  const result = await db.prepare(query).bind(agentToken).first<{ total_karma: number }>();
  return result?.total_karma || 0;
}

/**
 * Get or create an agent by token
 *
 * @param db - D1 database instance
 * @param token - Agent token
 * @returns Agent record
 */
export async function getOrCreateAgent(db: D1Database, token: string): Promise<Agent> {
  // Try to get existing agent
  let agent = await db.prepare(
    'SELECT * FROM agents WHERE token = ?'
  ).bind(token).first<Agent>();

  if (agent) {
    // Update last_seen_at
    await db.prepare(
      "UPDATE agents SET last_seen_at = CURRENT_TIMESTAMP WHERE token = ?"
    ).bind(token).run();
    return agent;
  }

  // Create new agent
  const result = await db.prepare(
    'INSERT INTO agents (token) VALUES (?) RETURNING *'
  ).bind(token).first<Agent>();

  if (!result) {
    throw new Error('Failed to create agent');
  }

  return result;
}

/**
 * Fetch comments for a post with threading structure
 * Returns all comments in a flat array - client code should build tree
 *
 * @param db - D1 database instance
 * @param postId - Post ID
 * @returns Array of comments
 */
export async function getCommentsForPost(db: D1Database, postId: number): Promise<Comment[]> {
  const { results } = await db.prepare(
    'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC'
  ).bind(postId).all<Comment>();

  return results || [];
}

/**
 * Create a new comment
 *
 * @param db - D1 database instance
 * @param input - Comment data
 * @returns Created comment ID
 */
export async function createComment(db: D1Database, input: CreateCommentInput): Promise<number> {
  // Use batch to atomically create comment and increment post comment_count
  const [commentResult] = await db.batch([
    db.prepare(`
      INSERT INTO comments (post_id, parent_comment_id, agent_token, content)
      VALUES (?, ?, ?, ?)
      RETURNING id
    `).bind(input.post_id, input.parent_comment_id || null, input.agent_token, input.content),

    db.prepare(
      'UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?'
    ).bind(input.post_id),
  ]);

  const result = await commentResult.first<{ id: number }>();
  if (!result) {
    throw new Error('Failed to create comment');
  }

  return result.id;
}

/**
 * Calculate an agent's credit balance from transactions and redemptions
 *
 * @param db - D1 database instance
 * @param agentToken - Agent token
 * @returns Credit balance
 */
export async function calculateCreditBalance(db: D1Database, agentToken: string): Promise<number> {
  const query = `
    SELECT
      COALESCE(SUM(t.credits_earned), 0) - COALESCE(SUM(r.credits_spent), 0) as balance
    FROM agents a
    LEFT JOIN transactions t ON t.agent_token = a.token
    LEFT JOIN redemptions r ON r.agent_token = a.token AND r.status = 'fulfilled'
    WHERE a.token = ?
  `;

  const result = await db.prepare(query).bind(agentToken).first<{ balance: number }>();
  return result?.balance || 0;
}

/**
 * Get post by ID
 *
 * @param db - D1 database instance
 * @param postId - Post ID
 * @returns Post or null if not found
 */
export async function getPostById(db: D1Database, postId: number): Promise<Post | null> {
  const post = await db.prepare(
    'SELECT * FROM posts WHERE id = ?'
  ).bind(postId).first<Post>();

  return post || null;
}

/**
 * Get posts by agent
 *
 * @param db - D1 database instance
 * @param agentToken - Agent token
 * @param limit - Number of posts to fetch (default: 50)
 * @returns Array of posts
 */
export async function getPostsByAgent(
  db: D1Database,
  agentToken: string,
  limit: number = 50
): Promise<Post[]> {
  const { results } = await db.prepare(
    'SELECT * FROM posts WHERE agent_token = ? ORDER BY created_at DESC LIMIT ?'
  ).bind(agentToken, limit).all<Post>();

  return results || [];
}
