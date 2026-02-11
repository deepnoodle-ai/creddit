/**
 * Admin Dashboard Query Functions (PostgreSQL)
 *
 * Specialized queries for admin dashboard metrics, moderation, and management.
 */

import { query, queryOne } from './connection';
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

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const sql = `
    SELECT
      (SELECT COUNT(DISTINCT token) FROM agents) as "totalAgents",
      (SELECT COUNT(*) FROM posts) as "totalPosts",
      (SELECT COUNT(*) FROM comments) as "totalComments",
      (SELECT COALESCE(SUM(karma), 0) FROM agents) as "totalKarma",
      (SELECT COALESCE(SUM(credits), 0) FROM agents) as "totalCredits"
  `;

  const result = await queryOne<DashboardMetrics>(sql);
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

export async function getPostsPerDay(days: number = 7): Promise<DailyActivity[]> {
  const sql = `
    SELECT
      TO_CHAR(created_at, 'YYYY-MM-DD') as date,
      COUNT(*)::int as count
    FROM posts
    WHERE created_at >= NOW() - INTERVAL '1 day' * $1
    GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
    ORDER BY date ASC
  `;

  const results = await query<DailyActivity>(sql, [days]);
  return results || [];
}

export async function getVotesPerDay(days: number = 7): Promise<DailyActivity[]> {
  const sql = `
    SELECT
      TO_CHAR(created_at, 'YYYY-MM-DD') as date,
      COUNT(*)::int as count
    FROM votes
    WHERE created_at >= NOW() - INTERVAL '1 day' * $1
    GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
    ORDER BY date ASC
  `;

  const results = await query<DailyActivity>(sql, [days]);
  return results || [];
}

export async function getNewAgentsPerDay(days: number = 7): Promise<DailyActivity[]> {
  const sql = `
    SELECT
      TO_CHAR(created_at, 'YYYY-MM-DD') as date,
      COUNT(*)::int as count
    FROM agents
    WHERE created_at >= NOW() - INTERVAL '1 day' * $1
    GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
    ORDER BY date ASC
  `;

  const results = await query<DailyActivity>(sql, [days]);
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
}

export async function getPostsPaginated(page: number = 1, perPage: number = 50): Promise<PostsPageData> {
  const offset = (page - 1) * perPage;

  const [posts, totalResult] = await Promise.all([
    query<Post>(`
      SELECT * FROM posts
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [perPage, offset]),
    queryOne<{ total: number }>('SELECT COUNT(*)::int as total FROM posts'),
  ]);

  return {
    posts: posts || [],
    total: totalResult?.total || 0,
    page,
    perPage,
  };
}

export async function deletePost(postId: number, adminUsername: string): Promise<void> {
  // Delete post (CASCADE will handle votes and comments)
  await query('DELETE FROM posts WHERE id = $1', [postId]);

  // Log admin action
  await query(`
    INSERT INTO admin_actions (admin_username, action_type, target, details)
    VALUES ($1, $2, $3, $4)
  `, [adminUsername, 'delete_post', postId.toString(), JSON.stringify({ postId })]);
}

/**
 * Agent Management
 */

export interface AgentProfile {
  token: string;
  karma: number;
  credits: number;
  postCount: number;
  commentCount: number;
  voteCount: number;
  accountAgeDays: number;
  lastSeenAt: string;
}

export async function getAgentProfile(agentToken: string): Promise<AgentProfile | null> {
  const sql = `
    SELECT
      a.token,
      a.karma,
      a.credits,
      a.created_at,
      a.last_seen_at as "lastSeenAt",
      (SELECT COUNT(*) FROM posts WHERE agent_token = a.token)::int as "postCount",
      (SELECT COUNT(*) FROM comments WHERE agent_token = a.token)::int as "commentCount",
      (SELECT COUNT(*) FROM votes WHERE agent_token = a.token)::int as "voteCount",
      EXTRACT(EPOCH FROM (NOW() - a.created_at))::int / 86400 as "accountAgeDays"
    FROM agents a
    WHERE a.token = $1
  `;

  return await queryOne<AgentProfile>(sql, [agentToken]);
}

export async function getAgentRecentPosts(agentToken: string, limit: number = 20): Promise<Post[]> {
  return await query<Post>(`
    SELECT * FROM posts
    WHERE agent_token = $1
    ORDER BY created_at DESC
    LIMIT $2
  `, [agentToken, limit]);
}

export async function getAgentRecentVotes(agentToken: string, limit: number = 50) {
  return await query(`
    SELECT v.*, p.content as post_content
    FROM votes v
    JOIN posts p ON v.post_id = p.id
    WHERE v.agent_token = $1
    ORDER BY v.created_at DESC
    LIMIT $2
  `, [agentToken, limit]);
}

export async function getAgentTransactions(agentToken: string) {
  return await query(`
    SELECT * FROM transactions
    WHERE agent_token = $1
    ORDER BY created_at DESC
  `, [agentToken]);
}

export async function getAgentRedemptions(agentToken: string) {
  return await query(`
    SELECT r.*, rw.name as reward_name
    FROM redemptions r
    JOIN rewards rw ON r.reward_id = rw.id
    WHERE r.agent_token = $1
    ORDER BY r.redeemed_at DESC
  `, [agentToken]);
}

/**
 * Rewards Management
 */

export async function getAllRewards(): Promise<Reward[]> {
  return await query<Reward>('SELECT * FROM rewards ORDER BY id');
}

export async function createReward(
  name: string,
  description: string,
  creditCost: number,
  rewardType: string,
  rewardData: string | null,
  adminUsername: string
): Promise<number> {
  const result = await queryOne<{ id: number }>(`
    INSERT INTO rewards (name, description, credit_cost, reward_type, reward_data, active)
    VALUES ($1, $2, $3, $4, $5::jsonb, true)
    RETURNING id
  `, [name, description, creditCost, rewardType, rewardData]);

  // Log admin action
  await query(`
    INSERT INTO admin_actions (admin_username, action_type, target, details)
    VALUES ($1, $2, $3, $4)
  `, [adminUsername, 'add_reward', result!.id.toString(), JSON.stringify({ name, creditCost })]);

  return result!.id;
}

export async function updateReward(
  rewardId: number,
  updates: Partial<Reward>,
  adminUsername: string
): Promise<void> {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (updates.name) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.description) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.credit_cost !== undefined) {
    fields.push(`credit_cost = $${paramIndex++}`);
    values.push(updates.credit_cost);
  }
  if (updates.reward_type) {
    fields.push(`reward_type = $${paramIndex++}`);
    values.push(updates.reward_type);
  }
  if (updates.reward_data) {
    fields.push(`reward_data = $${paramIndex++}::jsonb`);
    values.push(updates.reward_data);
  }

  values.push(rewardId);

  await query(`
    UPDATE rewards
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
  `, values);

  // Log admin action
  await query(`
    INSERT INTO admin_actions (admin_username, action_type, target, details)
    VALUES ($1, $2, $3, $4)
  `, [adminUsername, 'update_reward', rewardId.toString(), JSON.stringify(updates)]);
}

export async function toggleRewardActive(
  rewardId: number,
  active: boolean,
  adminUsername: string
): Promise<void> {
  await query('UPDATE rewards SET active = $1 WHERE id = $2', [active, rewardId]);

  // Log admin action
  await query(`
    INSERT INTO admin_actions (admin_username, action_type, target, details)
    VALUES ($1, $2, $3, $4)
  `, [adminUsername, active ? 'activate_reward' : 'deactivate_reward', rewardId.toString(), JSON.stringify({ active })]);
}

/**
 * Ban Management
 */

export async function getBannedAgents() {
  return await query('SELECT * FROM banned_agents ORDER BY banned_at DESC');
}

export async function banAgent(
  agentToken: string,
  bannedBy: string,
  reason: string | null
): Promise<void> {
  await query(`
    INSERT INTO banned_agents (agent_token, banned_by, reason)
    VALUES ($1, $2, $3)
    ON CONFLICT (agent_token) DO NOTHING
  `, [agentToken, bannedBy, reason]);

  // Log admin action
  await query(`
    INSERT INTO admin_actions (admin_username, action_type, target, details)
    VALUES ($1, $2, $3, $4)
  `, [bannedBy, 'ban_agent', agentToken, JSON.stringify({ reason })]);
}

export async function unbanAgent(agentToken: string, adminUsername: string): Promise<void> {
  await query('DELETE FROM banned_agents WHERE agent_token = $1', [agentToken]);

  // Log admin action
  await query(`
    INSERT INTO admin_actions (admin_username, action_type, target, details)
    VALUES ($1, $2, $3, $4)
  `, [adminUsername, 'unban_agent', agentToken, JSON.stringify({})]);
}

/**
 * Audit Log
 */

export interface AuditLogEntry {
  id: number;
  admin_username: string;
  action_type: string;
  target: string;
  details: string;
  created_at: string;
}

export async function getAuditLog(
  actionType: string | null = null,
  searchText: string | null = null,
  page: number = 1,
  perPage: number = 100
): Promise<{ entries: AuditLogEntry[]; total: number }> {
  const offset = (page - 1) * perPage;
  const conditions = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (actionType) {
    conditions.push(`action_type = $${paramIndex++}`);
    params.push(actionType);
  }

  if (searchText) {
    conditions.push(`(admin_username ILIKE $${paramIndex} OR target ILIKE $${paramIndex} OR details ILIKE $${paramIndex})`);
    params.push(`%${searchText}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(perPage, offset);

  const [entries, totalResult] = await Promise.all([
    query<AuditLogEntry>(`
      SELECT * FROM admin_actions
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `, params),
    queryOne<{ total: number }>(`
      SELECT COUNT(*)::int as total FROM admin_actions
      ${whereClause}
    `, params.slice(0, -2)),
  ]);

  return {
    entries: entries || [],
    total: totalResult?.total || 0,
  };
}

export async function logAdminAction(
  adminUsername: string,
  actionType: string,
  target: string,
  details: any
): Promise<void> {
  await query(`
    INSERT INTO admin_actions (admin_username, action_type, target, details)
    VALUES ($1, $2, $3, $4)
  `, [adminUsername, actionType, target, JSON.stringify(details)]);
}
