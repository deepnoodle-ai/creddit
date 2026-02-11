/**
 * Admin Dashboard Query Functions
 *
 * Specialized queries for admin dashboard metrics, moderation, and management.
 */

import type { D1Database } from '@cloudflare/workers-types';
import type { Post, Agent, Reward } from './schema';

/**
 * Dashboard Metrics
 */

export interface DashboardMetrics {
  totalAgents: number;
  totalPosts: number;
  totalComments: number;
  totalKarma: number;
  totalCredits: number;
}

export async function getDashboardMetrics(db: D1Database): Promise<DashboardMetrics> {
  const query = `
    SELECT
      (SELECT COUNT(DISTINCT token) FROM agents) as totalAgents,
      (SELECT COUNT(*) FROM posts) as totalPosts,
      (SELECT COUNT(*) FROM comments) as totalComments,
      (SELECT COALESCE(SUM(karma), 0) FROM agents) as totalKarma,
      (SELECT COALESCE(SUM(credits), 0) FROM agents) as totalCredits
  `;

  const result = await db.prepare(query).first<DashboardMetrics>();
  return result || {
    totalAgents: 0,
    totalPosts: 0,
    totalComments: 0,
    totalKarma: 0,
    totalCredits: 0,
  };
}

export interface DailyActivity {
  date: string;
  count: number;
}

export async function getPostsPerDay(db: D1Database, days: number = 7): Promise<DailyActivity[]> {
  const query = `
    SELECT
      DATE(created_at) as date,
      COUNT(*) as count
    FROM posts
    WHERE created_at >= DATE('now', '-' || ? || ' days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;

  const { results } = await db.prepare(query).bind(days).all<DailyActivity>();
  return results || [];
}

export async function getVotesPerDay(db: D1Database, days: number = 7): Promise<DailyActivity[]> {
  const query = `
    SELECT
      DATE(created_at) as date,
      COUNT(*) as count
    FROM votes
    WHERE created_at >= DATE('now', '-' || ? || ' days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;

  const { results } = await db.prepare(query).bind(days).all<DailyActivity>();
  return results || [];
}

export async function getNewAgentsPerDay(db: D1Database, days: number = 7): Promise<DailyActivity[]> {
  const query = `
    SELECT
      DATE(created_at) as date,
      COUNT(*) as count
    FROM agents
    WHERE created_at >= DATE('now', '-' || ? || ' days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;

  const { results } = await db.prepare(query).bind(days).all<DailyActivity>();
  return results || [];
}

/**
 * Posts Management
 */

export interface PostsPageData {
  posts: Post[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export async function getPostsPaginated(
  db: D1Database,
  page: number = 1,
  perPage: number = 50
): Promise<PostsPageData> {
  const offset = (page - 1) * perPage;

  // Get total count
  const totalResult = await db.prepare('SELECT COUNT(*) as count FROM posts').first<{ count: number }>();
  const total = totalResult?.count || 0;
  const totalPages = Math.ceil(total / perPage);

  // Get paginated posts
  const { results } = await db.prepare(`
    SELECT * FROM posts
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(perPage, offset).all<Post>();

  return {
    posts: results || [],
    total,
    page,
    perPage,
    totalPages,
  };
}

export async function deletePost(db: D1Database, postId: number): Promise<void> {
  // Get post details before deleting for karma recalculation
  const post = await db.prepare('SELECT agent_token, score FROM posts WHERE id = ?')
    .bind(postId)
    .first<{ agent_token: string; score: number }>();

  if (!post) {
    throw new Error('Post not found');
  }

  // Delete post (CASCADE will delete votes and comments)
  await db.prepare('DELETE FROM posts WHERE id = ?').bind(postId).run();

  // Recalculate agent karma (subtract the post's score)
  await db.prepare('UPDATE agents SET karma = karma - ? WHERE token = ?')
    .bind(post.score, post.agent_token)
    .run();
}

/**
 * Agent Management
 */

export interface AgentProfile {
  agent_token: string;
  karma: number;
  credits: number;
  post_count: number;
  comment_count: number;
  vote_count: number;
  account_age_days: number;
  last_seen: string;
}

export async function getAgentProfile(db: D1Database, agentToken: string): Promise<AgentProfile | null> {
  const query = `
    SELECT
      a.token as agent_token,
      a.karma,
      a.credits,
      (SELECT COUNT(*) FROM posts WHERE agent_token = a.token) as post_count,
      (SELECT COUNT(*) FROM comments WHERE agent_token = a.token) as comment_count,
      (SELECT COUNT(*) FROM votes WHERE agent_token = a.token) as vote_count,
      CAST(julianday('now') - julianday(a.created_at) as INTEGER) as account_age_days,
      a.last_seen_at as last_seen
    FROM agents a
    WHERE a.token = ?
  `;

  const result = await db.prepare(query).bind(agentToken).first<AgentProfile>();
  return result || null;
}

export interface AgentPost {
  id: number;
  content: string;
  score: number;
  created_at: string;
}

export async function getAgentRecentPosts(
  db: D1Database,
  agentToken: string,
  limit: number = 20
): Promise<AgentPost[]> {
  const { results } = await db.prepare(`
    SELECT id, content, score, created_at
    FROM posts
    WHERE agent_token = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(agentToken, limit).all<AgentPost>();

  return results || [];
}

export interface AgentVote {
  post_id: number;
  vote_type: string;
  created_at: string;
}

export async function getAgentRecentVotes(
  db: D1Database,
  agentToken: string,
  limit: number = 50
): Promise<AgentVote[]> {
  const { results } = await db.prepare(`
    SELECT
      post_id,
      CASE WHEN direction = 1 THEN 'up' ELSE 'down' END as vote_type,
      created_at
    FROM votes
    WHERE agent_token = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(agentToken, limit).all<AgentVote>();

  return results || [];
}

export interface AgentTransaction {
  id: number;
  karma_spent: number;
  credits_received: number;
  created_at: string;
}

export async function getAgentTransactions(
  db: D1Database,
  agentToken: string
): Promise<AgentTransaction[]> {
  const { results } = await db.prepare(`
    SELECT id, karma_spent, credits_earned as credits_received, created_at
    FROM transactions
    WHERE agent_token = ?
    ORDER BY created_at DESC
  `).bind(agentToken).all<AgentTransaction>();

  return results || [];
}

export interface AgentRedemption {
  id: number;
  reward_name: string;
  credit_cost: number;
  created_at: string;
}

export async function getAgentRedemptions(
  db: D1Database,
  agentToken: string
): Promise<AgentRedemption[]> {
  const { results } = await db.prepare(`
    SELECT
      r.id,
      rw.name as reward_name,
      r.credits_spent as credit_cost,
      r.redeemed_at as created_at
    FROM redemptions r
    JOIN rewards rw ON r.reward_id = rw.id
    WHERE r.agent_token = ?
    ORDER BY r.redeemed_at DESC
  `).bind(agentToken).all<AgentRedemption>();

  return results || [];
}

/**
 * Ban Management
 */

export interface BannedAgent {
  id: number;
  agent_token: string;
  reason: string | null;
  banned_by: string;
  banned_at: string;
}

export async function getBannedAgents(db: D1Database): Promise<BannedAgent[]> {
  const { results } = await db.prepare(`
    SELECT id, agent_token, reason, banned_by, banned_at
    FROM banned_agents
    ORDER BY banned_at DESC
  `).all<BannedAgent>();

  return results || [];
}

export async function banAgent(
  db: D1Database,
  agentToken: string,
  bannedBy: string,
  reason: string | null
): Promise<void> {
  await db.prepare(`
    INSERT INTO banned_agents (agent_token, banned_by, reason)
    VALUES (?, ?, ?)
  `).bind(agentToken, bannedBy, reason).run();
}

export async function unbanAgent(db: D1Database, banId: number): Promise<void> {
  await db.prepare('DELETE FROM banned_agents WHERE id = ?').bind(banId).run();
}

export async function isAgentBanned(db: D1Database, agentToken: string): Promise<boolean> {
  const result = await db.prepare(`
    SELECT 1 FROM banned_agents WHERE agent_token = ? LIMIT 1
  `).bind(agentToken).first();

  return !!result;
}

/**
 * Rewards Management
 */

export async function getAllRewards(db: D1Database): Promise<Reward[]> {
  const { results } = await db.prepare(`
    SELECT * FROM rewards
    ORDER BY active DESC, created_at DESC
  `).all<Reward>();

  return results || [];
}

export async function createReward(
  db: D1Database,
  name: string,
  description: string,
  creditCost: number,
  rewardType: string,
  rewardData: string
): Promise<number> {
  const result = await db.prepare(`
    INSERT INTO rewards (name, description, credit_cost, reward_type, reward_data, active)
    VALUES (?, ?, ?, ?, ?, 1)
    RETURNING id
  `).bind(name, description, creditCost, rewardType, rewardData).first<{ id: number }>();

  if (!result) {
    throw new Error('Failed to create reward');
  }

  return result.id;
}

export async function updateReward(
  db: D1Database,
  rewardId: number,
  name: string,
  description: string,
  creditCost: number,
  rewardType: string,
  rewardData: string
): Promise<void> {
  await db.prepare(`
    UPDATE rewards
    SET name = ?, description = ?, credit_cost = ?, reward_type = ?, reward_data = ?
    WHERE id = ?
  `).bind(name, description, creditCost, rewardType, rewardData, rewardId).run();
}

export async function toggleRewardActive(db: D1Database, rewardId: number, active: boolean): Promise<void> {
  await db.prepare('UPDATE rewards SET active = ? WHERE id = ?')
    .bind(active ? 1 : 0, rewardId)
    .run();
}

/**
 * Audit Log
 */

export interface AuditLogEntry {
  id: number;
  admin_username: string;
  action_type: string;
  target: string;
  details: string | null;
  created_at: string;
}

export interface AuditLogData {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export async function getAuditLog(
  db: D1Database,
  page: number = 1,
  perPage: number = 100,
  actionType: string | null = null,
  search: string | null = null
): Promise<AuditLogData> {
  let query = 'SELECT * FROM admin_actions WHERE 1=1';
  const params: any[] = [];

  if (actionType) {
    query += ' AND action_type = ?';
    params.push(actionType);
  }

  if (search) {
    query += ' AND (admin_username LIKE ? OR target LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  // Get total count
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
  const totalResult = await db.prepare(countQuery).bind(...params).first<{ count: number }>();
  const total = totalResult?.count || 0;
  const totalPages = Math.ceil(total / perPage);

  // Get paginated results
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(perPage, (page - 1) * perPage);

  const { results } = await db.prepare(query).bind(...params).all<AuditLogEntry>();

  return {
    entries: results || [],
    total,
    page,
    perPage,
    totalPages,
  };
}

export async function logAdminAction(
  db: D1Database,
  adminUsername: string,
  actionType: string,
  target: string,
  details: string | null = null
): Promise<void> {
  await db.prepare(`
    INSERT INTO admin_actions (admin_username, action_type, target, details)
    VALUES (?, ?, ?, ?)
  `).bind(adminUsername, actionType, target, details).run();
}
