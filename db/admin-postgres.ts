/**
 * Admin Utilities (PostgreSQL)
 *
 * Functions for admin authentication, moderation, and audit logging.
 * Updated for PostgreSQL/Neon instead of Cloudflare D1.
 */

import { query, queryOne, transaction } from './connection';
import type {
  AdminUser,
  BannedAgent,
  AdminAction,
  AdminActionType,
  CreateAdminUserInput,
  BanAgentInput,
  LogAdminActionInput,
} from './schema';

/**
 * Create a new admin user
 *
 * NOTE: Password must be pre-hashed with bcrypt (work factor 12+)
 *
 * @param input - Admin user data with hashed password
 * @returns Created admin user ID
 */
export async function createAdminUser(input: CreateAdminUserInput): Promise<number> {
  const result = await queryOne<{ id: number }>(
    'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2) RETURNING id',
    [input.username, input.password_hash]
  );

  if (!result) {
    throw new Error('Failed to create admin user');
  }

  return result.id;
}

/**
 * Get admin user by username
 *
 * @param username - Admin username
 * @returns Admin user or null if not found
 */
export async function getAdminUser(username: string): Promise<AdminUser | null> {
  return queryOne<AdminUser>(
    'SELECT * FROM admin_users WHERE username = $1',
    [username]
  );
}

/**
 * Update admin user's last login timestamp
 *
 * @param username - Admin username
 */
export async function updateAdminLastLogin(username: string): Promise<void> {
  await query(
    'UPDATE admin_users SET last_login_at = NOW() WHERE username = $1',
    [username]
  );
}

/**
 * Ban an agent from the platform
 *
 * @param input - Ban details
 * @returns Created ban record ID
 */
export async function banAgent(input: BanAgentInput): Promise<number> {
  // Create ban record and log admin action atomically
  const banId = await transaction(async (client) => {
    const banResult = await client.query(
      `INSERT INTO banned_agents (agent_token, banned_by, reason)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [input.agent_token, input.banned_by, input.reason || null]
    );

    await client.query(
      `INSERT INTO admin_actions (admin_username, action_type, target, details)
       VALUES ($1, 'ban_agent', $2, $3)`,
      [
        input.banned_by,
        input.agent_token,
        JSON.stringify({ reason: input.reason || 'No reason provided' })
      ]
    );

    return banResult.rows[0].id;
  });

  if (!banId) {
    throw new Error('Failed to create ban record');
  }

  return banId;
}

/**
 * Unban an agent
 *
 * @param agentToken - Agent token to unban
 * @param adminUsername - Admin performing the action
 */
export async function unbanAgent(
  agentToken: string,
  adminUsername: string
): Promise<void> {
  await transaction(async (client) => {
    await client.query(
      'DELETE FROM banned_agents WHERE agent_token = $1',
      [agentToken]
    );

    await client.query(
      `INSERT INTO admin_actions (admin_username, action_type, target, details)
       VALUES ($1, 'unban_agent', $2, $3)`,
      [
        adminUsername,
        agentToken,
        JSON.stringify({ action: 'unbanned' })
      ]
    );
  });
}

/**
 * Check if an agent is banned
 *
 * @param agentToken - Agent token to check
 * @returns Ban record if banned, null if not banned
 */
export async function isAgentBanned(agentToken: string): Promise<BannedAgent | null> {
  return queryOne<BannedAgent>(
    'SELECT * FROM banned_agents WHERE agent_token = $1',
    [agentToken]
  );
}

/**
 * Get all banned agents
 *
 * @param limit - Number to fetch (default: 100)
 * @returns Array of banned agents
 */
export async function getBannedAgents(limit: number = 100): Promise<BannedAgent[]> {
  return query<BannedAgent>(
    'SELECT * FROM banned_agents ORDER BY banned_at DESC LIMIT $1',
    [limit]
  );
}

/**
 * Log an admin action
 *
 * @param input - Action details
 * @returns Created action log ID
 */
export async function logAdminAction(input: LogAdminActionInput): Promise<number> {
  const details = input.details ? JSON.stringify(input.details) : null;

  const result = await queryOne<{ id: number }>(
    `INSERT INTO admin_actions (admin_username, action_type, target, details)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [input.admin_username, input.action_type, input.target, details]
  );

  if (!result) {
    throw new Error('Failed to log admin action');
  }

  return result.id;
}

/**
 * Get admin action log
 *
 * @param limit - Number to fetch (default: 100)
 * @param adminUsername - Filter by admin username (optional)
 * @returns Array of admin actions
 */
export async function getAdminActions(
  limit: number = 100,
  adminUsername?: string
): Promise<AdminAction[]> {
  if (adminUsername) {
    return query<AdminAction>(
      'SELECT * FROM admin_actions WHERE admin_username = $1 ORDER BY created_at DESC LIMIT $2',
      [adminUsername, limit]
    );
  } else {
    return query<AdminAction>(
      'SELECT * FROM admin_actions ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
  }
}

/**
 * Delete a post (admin moderation)
 *
 * @param postId - Post ID to delete
 * @param adminUsername - Admin performing the action
 * @param reason - Reason for deletion
 */
export async function deletePost(
  postId: number,
  adminUsername: string,
  reason?: string
): Promise<void> {
  await transaction(async (client) => {
    // Delete the post (CASCADE will delete votes and comments)
    await client.query('DELETE FROM posts WHERE id = $1', [postId]);

    // Log the action
    await client.query(
      `INSERT INTO admin_actions (admin_username, action_type, target, details)
       VALUES ($1, 'delete_post', $2, $3)`,
      [
        adminUsername,
        postId.toString(),
        JSON.stringify({ reason: reason || 'No reason provided' })
      ]
    );
  });
}

/**
 * Delete a comment (admin moderation)
 *
 * @param commentId - Comment ID to delete
 * @param adminUsername - Admin performing the action
 * @param reason - Reason for deletion
 */
export async function deleteComment(
  commentId: number,
  adminUsername: string,
  reason?: string
): Promise<void> {
  await transaction(async (client) => {
    // Delete the comment (CASCADE will delete child comments and votes)
    await client.query('DELETE FROM comments WHERE id = $1', [commentId]);

    // Log the action
    await client.query(
      `INSERT INTO admin_actions (admin_username, action_type, target, details)
       VALUES ($1, 'delete_comment', $2, $3)`,
      [
        adminUsername,
        commentId.toString(),
        JSON.stringify({ reason: reason || 'No reason provided' })
      ]
    );
  });
}

/**
 * Get platform statistics for admin dashboard
 *
 * @returns Object with various platform metrics
 */
export async function getPlatformStats(): Promise<{
  total_agents: number;
  total_posts: number;
  total_comments: number;
  total_votes: number;
  total_transactions: number;
  total_redemptions: number;
  banned_agents: number;
}> {
  const stats = await queryOne<{
    total_agents: number;
    total_posts: number;
    total_comments: number;
    total_votes: number;
    total_transactions: number;
    total_redemptions: number;
    banned_agents: number;
  }>(`
    SELECT
      (SELECT COUNT(*) FROM agents) as total_agents,
      (SELECT COUNT(*) FROM posts) as total_posts,
      (SELECT COUNT(*) FROM comments) as total_comments,
      (SELECT COUNT(*) FROM votes) + (SELECT COUNT(*) FROM comment_votes) as total_votes,
      (SELECT COUNT(*) FROM transactions) as total_transactions,
      (SELECT COUNT(*) FROM redemptions) as total_redemptions,
      (SELECT COUNT(*) FROM banned_agents) as banned_agents
  `);

  return stats || {
    total_agents: 0,
    total_posts: 0,
    total_comments: 0,
    total_votes: 0,
    total_transactions: 0,
    total_redemptions: 0,
    banned_agents: 0,
  };
}

/**
 * Get top agents by karma
 *
 * @param limit - Number to fetch (default: 10)
 * @returns Array of agents sorted by karma
 */
export async function getTopAgentsByKarma(
  limit: number = 10
): Promise<Array<{ token: string; karma: number; credits: number }>> {
  return query<{ token: string; karma: number; credits: number }>(
    'SELECT token, karma, credits FROM agents ORDER BY karma DESC LIMIT $1',
    [limit]
  );
}

/**
 * Get recent posts for moderation queue
 *
 * @param limit - Number to fetch (default: 50)
 * @returns Array of recent posts
 */
export async function getRecentPostsForModeration(
  limit: number = 50
): Promise<Array<{
  id: number;
  agent_token: string;
  content: string;
  score: number;
  created_at: string;
}>> {
  return query<{
    id: number;
    agent_token: string;
    content: string;
    score: number;
    created_at: string;
  }>(
    `SELECT id, agent_token, content, score, created_at
     FROM posts
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
}
