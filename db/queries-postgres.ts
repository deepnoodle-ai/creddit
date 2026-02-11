/**
 * Database Query Functions (PostgreSQL)
 *
 * Reusable query patterns for common database operations.
 * Updated for PostgreSQL/Neon instead of Cloudflare D1.
 */

import { query, queryOne, prepared } from './connection';
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
 * @param limit - Number of posts to fetch (default: 50)
 */
export async function getHotPosts(limit: number = 50): Promise<PostRanking[]> {
  const sql = `
    SELECT *,
      score / (POWER(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 + 2, 1.5)) as hot_score
    FROM posts
    ORDER BY hot_score DESC
    LIMIT $1
  `;

  return query<PostRanking>(sql, [limit]);
}

/**
 * Fetch posts sorted by newest first
 *
 * @param limit - Number of posts to fetch (default: 50)
 */
export async function getNewPosts(limit: number = 50): Promise<Post[]> {
  return query<Post>(
    'SELECT * FROM posts ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
}

/**
 * Fetch posts sorted by top score
 *
 * @param limit - Number of posts to fetch (default: 50)
 * @param timeFilter - Time filter in hours (optional)
 */
export async function getTopPosts(
  limit: number = 50,
  timeFilter?: number
): Promise<Post[]> {
  let sql = 'SELECT * FROM posts';
  const params: any[] = [];

  if (timeFilter) {
    sql += ` WHERE created_at >= NOW() - INTERVAL '$1 hours'`;
    params.push(timeFilter);
    sql += ' ORDER BY score DESC LIMIT $2';
    params.push(limit);
  } else {
    sql += ' ORDER BY score DESC LIMIT $1';
    params.push(limit);
  }

  return query<Post>(sql, params);
}

/**
 * Create a new post
 *
 * @param input - Post data
 * @returns Created post ID
 */
export async function createPost(input: CreatePostInput): Promise<number> {
  const result = await queryOne<{ id: number }>(
    'INSERT INTO posts (agent_token, content) VALUES ($1, $2) RETURNING id',
    [input.agent_token, input.content]
  );

  if (!result) {
    throw new Error('Failed to create post');
  }

  return result.id;
}

/**
 * Record a vote on a post
 * This function handles the atomic update of post score and vote_count
 *
 * Note: PostgreSQL transactions are handled differently than D1 batch
 *
 * @param input - Vote data
 * @returns Success boolean
 */
export async function createVote(input: CreateVoteInput): Promise<boolean> {
  try {
    const { transaction } = await import('./connection');

    await transaction(async (client) => {
      // Insert vote record
      await client.query(
        'INSERT INTO votes (post_id, agent_token, direction) VALUES ($1, $2, $3)',
        [input.post_id, input.agent_token, input.direction]
      );

      // Update post score and vote_count atomically
      await client.query(
        'UPDATE posts SET score = score + $1, vote_count = vote_count + 1 WHERE id = $2',
        [input.direction, input.post_id]
      );

      // Update agent karma (post author gets karma)
      await client.query(
        `UPDATE agents
         SET karma = karma + $1
         WHERE token = (SELECT agent_token FROM posts WHERE id = $2)`,
        [input.direction, input.post_id]
      );
    });

    return true;
  } catch (error) {
    // UNIQUE constraint violation on (post_id, agent_token) means duplicate vote
    if (error instanceof Error && error.message.includes('duplicate key')) {
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
 * @param agentToken - Agent token
 * @returns Total karma
 */
export async function calculateAgentKarma(agentToken: string): Promise<number> {
  const sql = `
    SELECT
      COALESCE(SUM(p.score), 0) + COALESCE(SUM(c.score), 0) as total_karma
    FROM agents a
    LEFT JOIN posts p ON p.agent_token = a.token
    LEFT JOIN comments c ON c.agent_token = a.token
    WHERE a.token = $1
  `;

  const result = await queryOne<{ total_karma: number }>(sql, [agentToken]);
  return result?.total_karma || 0;
}

/**
 * Get or create an agent by token
 *
 * @param token - Agent token
 * @returns Agent record
 */
export async function getOrCreateAgent(token: string): Promise<Agent> {
  // Try to get existing agent
  let agent = await queryOne<Agent>(
    'SELECT * FROM agents WHERE token = $1',
    [token]
  );

  if (agent) {
    // Update last_seen_at
    await query(
      'UPDATE agents SET last_seen_at = NOW() WHERE token = $1',
      [token]
    );
    return agent;
  }

  // Create new agent
  const result = await queryOne<Agent>(
    'INSERT INTO agents (token) VALUES ($1) RETURNING *',
    [token]
  );

  if (!result) {
    throw new Error('Failed to create agent');
  }

  return result;
}

/**
 * Fetch comments for a post with threading structure
 * Returns all comments in a flat array - client code should build tree
 *
 * @param postId - Post ID
 * @returns Array of comments
 */
export async function getCommentsForPost(postId: number): Promise<Comment[]> {
  return query<Comment>(
    'SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at ASC',
    [postId]
  );
}

/**
 * Create a new comment
 *
 * @param input - Comment data
 * @returns Created comment ID
 */
export async function createComment(input: CreateCommentInput): Promise<number> {
  const { transaction } = await import('./connection');

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

/**
 * Calculate an agent's credit balance from transactions and redemptions
 *
 * @param agentToken - Agent token
 * @returns Credit balance
 */
export async function calculateCreditBalance(agentToken: string): Promise<number> {
  const sql = `
    SELECT
      COALESCE(SUM(t.credits_earned), 0) - COALESCE(SUM(r.credits_spent), 0) as balance
    FROM agents a
    LEFT JOIN transactions t ON t.agent_token = a.token
    LEFT JOIN redemptions r ON r.agent_token = a.token AND r.status = 'fulfilled'
    WHERE a.token = $1
  `;

  const result = await queryOne<{ balance: number }>(sql, [agentToken]);
  return result?.balance || 0;
}

/**
 * Get post by ID
 *
 * @param postId - Post ID
 * @returns Post or null if not found
 */
export async function getPostById(postId: number): Promise<Post | null> {
  return queryOne<Post>(
    'SELECT * FROM posts WHERE id = $1',
    [postId]
  );
}

/**
 * Get posts by agent
 *
 * @param agentToken - Agent token
 * @param limit - Number of posts to fetch (default: 50)
 * @returns Array of posts
 */
export async function getPostsByAgent(
  agentToken: string,
  limit: number = 50
): Promise<Post[]> {
  return query<Post>(
    'SELECT * FROM posts WHERE agent_token = $1 ORDER BY created_at DESC LIMIT $2',
    [agentToken, limit]
  );
}
