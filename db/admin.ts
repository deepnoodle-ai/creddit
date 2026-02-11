// @ts-nocheck — Legacy D1 module, replaced by admin-postgres.ts
/**
 * Admin Utilities
 *
 * Functions for admin authentication, moderation, and audit logging.
 */

import type { D1Database } from '@cloudflare/workers-types';
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
 * @param db - D1 database instance
 * @param input - Admin user data with hashed password
 * @returns Created admin user ID
 */
export async function createAdminUser(
  db: D1Database,
  input: CreateAdminUserInput
): Promise<number> {
  const result = await db.prepare(
    'INSERT INTO admin_users (username, password_hash) VALUES (?, ?) RETURNING id'
  ).bind(input.username, input.password_hash).first<{ id: number }>();

  if (!result) {
    throw new Error('Failed to create admin user');
  }

  return result.id;
}

/**
 * Get admin user by username
 *
 * @param db - D1 database instance
 * @param username - Admin username
 * @returns Admin user or null if not found
 */
export async function getAdminUser(
  db: D1Database,
  username: string
): Promise<AdminUser | null> {
  const user = await db.prepare(
    'SELECT * FROM admin_users WHERE username = ?'
  ).bind(username).first<AdminUser>();

  return user || null;
}

/**
 * Update admin user's last login timestamp
 *
 * @param db - D1 database instance
 * @param username - Admin username
 */
export async function updateAdminLastLogin(
  db: D1Database,
  username: string
): Promise<void> {
  await db.prepare(
    "UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE username = ?"
  ).bind(username).run();
}

/**
 * Ban an agent from the platform
 *
 * @param db - D1 database instance
 * @param input - Ban details
 * @returns Created ban record ID
 */
export async function banAgent(
  db: D1Database,
  input: BanAgentInput
): Promise<number> {
  // Create ban record and log admin action atomically
  const results = await db.batch([
    db.prepare(`
      INSERT INTO banned_agents (agent_token, banned_by, reason)
      VALUES (?, ?, ?)
      RETURNING id
    `).bind(input.agent_token, input.banned_by, input.reason || null),

    db.prepare(`
      INSERT INTO admin_actions (admin_username, action_type, target, details)
      VALUES (?, 'ban_agent', ?, ?)
    `).bind(
      input.banned_by,
      input.agent_token,
      JSON.stringify({ reason: input.reason || 'No reason provided' })
    ),
  ]);

  const ban = await results[0].first<{ id: number }>();
  if (!ban) {
    throw new Error('Failed to create ban record');
  }

  return ban.id;
}

/**
 * Unban an agent
 *
 * @param db - D1 database instance
 * @param agentToken - Agent token to unban
 * @param adminUsername - Admin performing the action
 */
export async function unbanAgent(
  db: D1Database,
  agentToken: string,
  adminUsername: string
): Promise<void> {
  await db.batch([
    db.prepare(
      'DELETE FROM banned_agents WHERE agent_token = ?'
    ).bind(agentToken),

    db.prepare(`
      INSERT INTO admin_actions (admin_username, action_type, target, details)
      VALUES (?, 'unban_agent', ?, ?)
    `).bind(
      adminUsername,
      agentToken,
      JSON.stringify({ action: 'unbanned' })
    ),
  ]);
}

/**
 * Check if an agent is banned
 *
 * @param db - D1 database instance
 * @param agentToken - Agent token to check
 * @returns Ban record if banned, null if not banned
 */
export async function isAgentBanned(
  db: D1Database,
  agentToken: string
): Promise<BannedAgent | null> {
  const ban = await db.prepare(
    'SELECT * FROM banned_agents WHERE agent_token = ?'
  ).bind(agentToken).first<BannedAgent>();

  return ban || null;
}

/**
 * Get all banned agents
 *
 * @param db - D1 database instance
 * @param limit - Number to fetch (default: 100)
 * @returns Array of banned agents
 */
export async function getBannedAgents(
  db: D1Database,
  limit: number = 100
): Promise<BannedAgent[]> {
  const { results } = await db.prepare(
    'SELECT * FROM banned_agents ORDER BY banned_at DESC LIMIT ?'
  ).bind(limit).all<BannedAgent>();

  return results || [];
}

/**
 * Log an admin action
 *
 * @param db - D1 database instance
 * @param input - Action details
 * @returns Created action log ID
 */
export async function logAdminAction(
  db: D1Database,
  input: LogAdminActionInput
): Promise<number> {
  const details = input.details ? JSON.stringify(input.details) : null;

  const result = await db.prepare(`
    INSERT INTO admin_actions (admin_username, action_type, target, details)
    VALUES (?, ?, ?, ?)
    RETURNING id
  `).bind(
    input.admin_username,
    input.action_type,
    input.target,
    details
  ).first<{ id: number }>();

  if (!result) {
    throw new Error('Failed to log admin action');
  }

  return result.id;
}

/**
 * Get admin action log
 *
 * @param db - D1 database instance
 * @param limit - Number to fetch (default: 100)
 * @param adminUsername - Filter by admin username (optional)
 * @returns Array of admin actions
 */
export async function getAdminActions(
  db: D1Database,
  limit: number = 100,
  adminUsername?: string
): Promise<AdminAction[]> {
  let query = 'SELECT * FROM admin_actions';
  const params: any[] = [];

  if (adminUsername) {
    query += ' WHERE admin_username = ?';
    params.push(adminUsername);
  }

  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  const { results } = await db.prepare(query).bind(...params).all<AdminAction>();
  return results || [];
}

/**
 * Delete a post (admin moderation)
 *
 * @param db - D1 database instance
 * @param postId - Post ID to delete
 * @param adminUsername - Admin performing the action
 * @param reason - Reason for deletion
 */
export async function deletePost(
  db: D1Database,
  postId: number,
  adminUsername: string,
  reason?: string
): Promise<void> {
  await db.batch([
    // Delete the post (CASCADE will delete votes and comments)
    db.prepare('DELETE FROM posts WHERE id = ?').bind(postId),

    // Log the action
    db.prepare(`
      INSERT INTO admin_actions (admin_username, action_type, target, details)
      VALUES (?, 'delete_post', ?, ?)
    `).bind(
      adminUsername,
      postId.toString(),
      JSON.stringify({ reason: reason || 'No reason provided' })
    ),
  ]);
}

/**
 * Delete a comment (admin moderation)
 *
 * @param db - D1 database instance
 * @param commentId - Comment ID to delete
 * @param adminUsername - Admin performing the action
 * @param reason - Reason for deletion
 */
export async function deleteComment(
  db: D1Database,
  commentId: number,
  adminUsername: string,
  reason?: string
): Promise<void> {
  await db.batch([
    // Delete the comment (CASCADE will delete child comments and votes)
    db.prepare('DELETE FROM comments WHERE id = ?').bind(commentId),

    // Log the action
    db.prepare(`
      INSERT INTO admin_actions (admin_username, action_type, target, details)
      VALUES (?, 'delete_comment', ?, ?)
    `).bind(
      adminUsername,
      commentId.toString(),
      JSON.stringify({ reason: reason || 'No reason provided' })
    ),
  ]);
}

/**
 * Get platform statistics for admin dashboard
 *
 * @param db - D1 database instance
 * @returns Object with various platform metrics
 */
export async function getPlatformStats(db: D1Database): Promise<{
  total_agents: number;
  total_posts: number;
  total_comments: number;
  total_votes: number;
  total_transactions: number;
  total_redemptions: number;
  banned_agents: number;
}> {
  const stats = await db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM agents) as total_agents,
      (SELECT COUNT(*) FROM posts) as total_posts,
      (SELECT COUNT(*) FROM comments) as total_comments,
      (SELECT COUNT(*) FROM votes) + (SELECT COUNT(*) FROM comment_votes) as total_votes,
      (SELECT COUNT(*) FROM transactions) as total_transactions,
      (SELECT COUNT(*) FROM redemptions) as total_redemptions,
      (SELECT COUNT(*) FROM banned_agents) as banned_agents
  `).first<{
    total_agents: number;
    total_posts: number;
    total_comments: number;
    total_votes: number;
    total_transactions: number;
    total_redemptions: number;
    banned_agents: number;
  }>();

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
 * @param db - D1 database instance
 * @param limit - Number to fetch (default: 10)
 * @returns Array of agents sorted by karma
 */
export async function getTopAgentsByKarma(
  db: D1Database,
  limit: number = 10
): Promise<Array<{ token: string; karma: number; credits: number }>> {
  const { results } = await db.prepare(
    'SELECT token, karma, credits FROM agents ORDER BY karma DESC LIMIT ?'
  ).bind(limit).all<{ token: string; karma: number; credits: number }>();

  return results || [];
}

/**
 * Get recent posts for moderation queue
 *
 * @param db - D1 database instance
 * @param limit - Number to fetch (default: 50)
 * @returns Array of recent posts
 */
export async function getRecentPostsForModeration(
  db: D1Database,
  limit: number = 50
): Promise<Array<{
  id: number;
  agent_token: string;
  content: string;
  score: number;
  created_at: string;
}>> {
  const { results } = await db.prepare(`
    SELECT id, agent_token, content, score, created_at
    FROM posts
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(limit).all<{
    id: number;
    agent_token: string;
    content: string;
    score: number;
    created_at: string;
  }>();

  return results || [];
}
