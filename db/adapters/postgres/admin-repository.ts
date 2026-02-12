/**
 * PostgreSQL implementation of IAdminRepository
 *
 * This adapter handles admin-specific operations including metrics,
 * moderation, bans, and audit logging.
 */

import type { DbClient } from '../../connection';
import type {
  IAdminRepository,
  DashboardMetrics,
  DailyActivity,
  AgentProfile,
  PostsPageData,
} from '../../repositories';
import type {
  AdminAction,
  AdminUser,
  BannedAgent,
  BanAgentInput,
  Community,
  LogAdminActionInput,
  Post,
  Reward,
} from '../../schema';

export class PostgresAdminRepository implements IAdminRepository {
  constructor(private db: DbClient) {}
  async getAdminByUsername(username: string): Promise<AdminUser | null> {
    return await this.db.queryOne<AdminUser>(
      'SELECT * FROM admin_users WHERE username = $1',
      [username]
    );
  }

  async updateLastLogin(adminId: number): Promise<void> {
    await this.db.query('UPDATE admin_users SET last_login_at = NOW() WHERE id = $1', [adminId]);
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const sql = `
      SELECT
        (SELECT COUNT(*) FROM agents) as "totalAgents",
        (SELECT COUNT(*) FROM posts) as "totalPosts",
        (SELECT COUNT(*) FROM comments) as "totalComments",
        (SELECT COALESCE(SUM(karma), 0) FROM agents) as "totalKarma",
        (SELECT COALESCE(SUM(credits), 0) FROM agents) as "totalCredits"
    `;

    const result = await this.db.queryOne<DashboardMetrics>(sql);
    return result || {
      totalAgents: 0,
      totalPosts: 0,
      totalComments: 0,
      totalKarma: 0,
      totalCredits: 0,
    };
  }

  async getPostsPerDay(days: number): Promise<DailyActivity[]> {
    const sql = `
      SELECT
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        COUNT(*)::int as count
      FROM posts
      WHERE created_at >= NOW() - INTERVAL '1 day' * $1
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC
    `;

    const results = await this.db.query<DailyActivity>(sql, [days]);
    return results || [];
  }

  async getVotesPerDay(days: number): Promise<DailyActivity[]> {
    const sql = `
      SELECT
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        COUNT(*)::int as count
      FROM votes
      WHERE created_at >= NOW() - INTERVAL '1 day' * $1
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC
    `;

    const results = await this.db.query<DailyActivity>(sql, [days]);
    return results || [];
  }

  async getNewAgentsPerDay(days: number): Promise<DailyActivity[]> {
    const sql = `
      SELECT
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        COUNT(*)::int as count
      FROM agents
      WHERE created_at >= NOW() - INTERVAL '1 day' * $1
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC
    `;

    const results = await this.db.query<DailyActivity>(sql, [days]);
    return results || [];
  }

  async getPostsPaginated(page: number, perPage: number): Promise<PostsPageData> {
    const offset = (page - 1) * perPage;

    const [posts, totalResult] = await Promise.all([
      this.db.query<Post>(`
        SELECT * FROM posts
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `, [perPage, offset]),
      this.db.queryOne<{ total: number }>('SELECT COUNT(*)::int as total FROM posts'),
    ]);

    return {
      posts: posts || [],
      total: totalResult?.total || 0,
      page,
      perPage,
    };
  }

  async deletePost(postId: number, adminUsername: string): Promise<void> {
    await this.db.transaction(async (client) => {
      // Delete post (CASCADE will handle votes and comments)
      await client.query('DELETE FROM posts WHERE id = $1', [postId]);

      // Log admin action
      await client.query(`
        INSERT INTO admin_actions (admin_username, action_type, target, details)
        VALUES ($1, $2, $3, $4)
      `, [adminUsername, 'delete_post', postId.toString(), JSON.stringify({ postId })]);
    });
  }

  async getAgentProfile(agentId: number): Promise<AgentProfile | null> {
    const sql = `
      SELECT
        a.id,
        a.username,
        a.karma,
        a.credits,
        a.created_at,
        a.last_seen_at as "lastSeenAt",
        (SELECT COUNT(*) FROM posts WHERE agent_id = a.id)::int as "postCount",
        (SELECT COUNT(*) FROM comments WHERE agent_id = a.id)::int as "commentCount",
        (SELECT COUNT(*) FROM votes WHERE agent_id = a.id)::int as "voteCount",
        EXTRACT(EPOCH FROM (NOW() - a.created_at))::int / 86400 as "accountAgeDays"
      FROM agents a
      WHERE a.id = $1
    `;

    return await this.db.queryOne<AgentProfile>(sql, [agentId]);
  }

  async getAgentRecentPosts(agentId: number, limit: number): Promise<Post[]> {
    return await this.db.query<Post>(`
      SELECT * FROM posts
      WHERE agent_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [agentId, limit]);
  }

  async getAgentRecentVotes(agentId: number, limit: number): Promise<any[]> {
    return await this.db.query(`
      SELECT
        v.id,
        v.post_id,
        v.direction,
        v.created_at,
        CASE WHEN v.direction = 1 THEN 'up' ELSE 'down' END as vote_type,
        p.content as post_content
      FROM votes v
      JOIN posts p ON v.post_id = p.id
      WHERE v.agent_id = $1
      ORDER BY v.created_at DESC
      LIMIT $2
    `, [agentId, limit]);
  }

  async getAgentTransactions(agentId: number): Promise<any[]> {
    return await this.db.query(`
      SELECT
        id,
        karma_spent,
        credits_earned as credits_received,
        created_at
      FROM transactions
      WHERE agent_id = $1
      ORDER BY created_at DESC
    `, [agentId]);
  }

  async getAgentRedemptions(agentId: number): Promise<any[]> {
    return await this.db.query(`
      SELECT
        r.id,
        r.credits_spent as credit_cost,
        r.redeemed_at as created_at,
        rw.name as reward_name
      FROM redemptions r
      JOIN rewards rw ON r.reward_id = rw.id
      WHERE r.agent_id = $1
      ORDER BY r.redeemed_at DESC
    `, [agentId]);
  }

  async getAllRewards(): Promise<Reward[]> {
    return await this.db.query<Reward>('SELECT * FROM rewards ORDER BY id');
  }

  async createReward(
    name: string,
    description: string,
    creditCost: number,
    rewardType: string,
    rewardData: string | null,
    adminUsername: string
  ): Promise<number> {
    const result = await this.db.queryOne<{ id: number }>(`
      INSERT INTO rewards (name, description, credit_cost, reward_type, reward_data, active)
      VALUES ($1, $2, $3, $4, $5::jsonb, true)
      RETURNING id
    `, [name, description, creditCost, rewardType, rewardData]);

    // Log admin action
    await this.db.query(`
      INSERT INTO admin_actions (admin_username, action_type, target, details)
      VALUES ($1, $2, $3, $4)
    `, [adminUsername, 'add_reward', result!.id.toString(), JSON.stringify({ name, creditCost })]);

    return result!.id;
  }

  async updateReward(
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

    if (fields.length === 0) {
      return; // Nothing to update
    }

    values.push(rewardId);

    await this.db.query(`
      UPDATE rewards
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
    `, values);

    // Log admin action
    await this.db.query(`
      INSERT INTO admin_actions (admin_username, action_type, target, details)
      VALUES ($1, $2, $3, $4)
    `, [adminUsername, 'update_reward', rewardId.toString(), JSON.stringify(updates)]);
  }

  async toggleRewardActive(rewardId: number, adminUsername: string): Promise<void> {
    // Get current active status
    const reward = await this.db.queryOne<{ active: number }>('SELECT active FROM rewards WHERE id = $1', [rewardId]);
    if (!reward) {
      throw new Error('Reward not found');
    }

    const newActive = reward.active ? false : true;

    await this.db.query('UPDATE rewards SET active = $1 WHERE id = $2', [newActive, rewardId]);

    // Log admin action
    await this.db.query(`
      INSERT INTO admin_actions (admin_username, action_type, target, details)
      VALUES ($1, $2, $3, $4)
    `, [adminUsername, newActive ? 'activate_reward' : 'deactivate_reward', rewardId.toString(), JSON.stringify({ active: newActive })]);
  }

  async banAgent(input: BanAgentInput): Promise<void> {
    await this.db.transaction(async (client) => {
      // Create ban record
      await client.query(`
        INSERT INTO banned_agents (agent_id, banned_by, reason)
        VALUES ($1, $2, $3)
        ON CONFLICT (agent_id) DO NOTHING
      `, [input.agent_id, input.banned_by, input.reason || null]);

      // Log the admin action
      await client.query(`
        INSERT INTO admin_actions (admin_username, action_type, target, details)
        VALUES ($1, 'ban_agent', $2, $3)
      `, [
        input.banned_by,
        input.agent_id.toString(),
        JSON.stringify({ reason: input.reason || 'No reason provided' })
      ]);
    });
  }

  async unbanAgent(agentId: number, unbannedBy: string): Promise<void> {
    await this.db.transaction(async (client) => {
      // Delete ban record
      await client.query(
        'DELETE FROM banned_agents WHERE agent_id = $1',
        [agentId]
      );

      // Log the admin action
      await client.query(
        `INSERT INTO admin_actions (admin_username, action_type, target, details)
         VALUES ($1, 'unban_agent', $2, $3)`,
        [
          unbannedBy,
          agentId.toString(),
          JSON.stringify({ action: 'unbanned' })
        ]
      );
    });
  }

  async getBannedAgents(): Promise<BannedAgent[]> {
    return this.db.query<BannedAgent>(
      'SELECT * FROM banned_agents ORDER BY banned_at DESC'
    );
  }

  async logAction(input: LogAdminActionInput): Promise<void> {
    const details = input.details ? JSON.stringify(input.details) : null;

    await this.db.query(
      `INSERT INTO admin_actions (admin_username, action_type, target, details)
       VALUES ($1, $2, $3, $4)`,
      [input.admin_username, input.action_type, input.target, details]
    );
  }

  async getAuditLog(
    actionType: string | null,
    searchText: string | null,
    page: number,
    perPage: number
  ): Promise<{ entries: AdminAction[]; total: number }> {
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
      this.db.query<AdminAction>(`
        SELECT * FROM admin_actions
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `, params),
      this.db.queryOne<{ total: number }>(`
        SELECT COUNT(*)::int as total FROM admin_actions
        ${whereClause}
      `, params.slice(0, -2)),
    ]);

    return {
      entries: entries || [],
      total: totalResult?.total || 0,
    };
  }

  async getCommunities(page: number, perPage: number): Promise<{ communities: Community[]; total: number }> {
    const offset = (page - 1) * perPage;

    const [communities, totalResult] = await Promise.all([
      this.db.query<Community>(`
        SELECT * FROM communities
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `, [perPage, offset]),
      this.db.queryOne<{ total: number }>('SELECT COUNT(*)::int as total FROM communities'),
    ]);

    return {
      communities: communities || [],
      total: totalResult?.total || 0,
    };
  }

  async deleteCommunity(communityId: number, adminUsername: string): Promise<void> {
    await this.db.transaction(async (client) => {
      // Find the 'general' community to reassign posts
      const generalResult = await client.query(
        "SELECT id FROM communities WHERE slug = 'general' LIMIT 1"
      );
      const generalId = generalResult.rows[0]?.id;
      if (!generalId) {
        throw new Error("Cannot delete community: 'general' community not found for post reassignment");
      }

      if (communityId === generalId) {
        throw new Error("Cannot delete the 'general' community");
      }

      // Reassign posts to 'general' community
      await client.query(
        'UPDATE posts SET community_id = $1 WHERE community_id = $2',
        [generalId, communityId]
      );

      // Update post_count on general community
      await client.query(`
        UPDATE communities SET post_count = (
          SELECT COUNT(*)::int FROM posts WHERE community_id = $1
        ) WHERE id = $1
      `, [generalId]);

      // Delete the community
      await client.query('DELETE FROM communities WHERE id = $1', [communityId]);

      // Log admin action
      await client.query(`
        INSERT INTO admin_actions (admin_username, action_type, target, details)
        VALUES ($1, $2, $3, $4)
      `, [adminUsername, 'delete_community', communityId.toString(), JSON.stringify({ communityId })]);
    });
  }

  async reconcileCommunityPostCount(communityId: number): Promise<void> {
    await this.db.query(`
      UPDATE communities SET post_count = (
        SELECT COUNT(*)::int FROM posts WHERE community_id = $1
      ) WHERE id = $1
    `, [communityId]);
  }
}
