/**
 * PostgreSQL implementation of IRewardRepository
 *
 * This adapter handles karma-to-credit conversions and reward redemptions.
 */

import type { DbClient } from '../../connection';
import type { IRewardRepository, ConversionResult, RedemptionResult, CreditBalance } from '../../repositories';
import type { Reward, Redemption, Transaction, CreateRewardInput, RewardType } from '../../schema';

/**
 * Karma to credit conversion ratio
 * 100 karma = 1 credit
 */
const KARMA_TO_CREDIT_RATIO = 100;

export class PostgresRewardRepository implements IRewardRepository {
  constructor(private db: DbClient) {}
  async getActiveRewards(): Promise<Reward[]> {
    return this.db.query<Reward>(
      'SELECT * FROM rewards WHERE active = true ORDER BY credit_cost ASC'
    );
  }

  async getById(id: number): Promise<Reward | null> {
    return this.db.queryOne<Reward>(
      'SELECT * FROM rewards WHERE id = $1',
      [id]
    );
  }

  async create(input: CreateRewardInput): Promise<number> {
    const active = input.active !== undefined ? input.active : true;

    const result = await this.db.queryOne<{ id: number }>(`
      INSERT INTO rewards (name, description, credit_cost, reward_type, reward_data, active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      input.name,
      input.description,
      input.credit_cost,
      input.reward_type,
      input.reward_data || null,
      active
    ]);

    if (!result) {
      throw new Error('Failed to create reward');
    }

    return result.id;
  }

  async setActive(id: number, active: boolean): Promise<void> {
    await this.db.query(
      'UPDATE rewards SET active = $1 WHERE id = $2',
      [active, id]
    );
  }

  async redeem(agentId: number, rewardId: number): Promise<RedemptionResult> {
    try {
      // Get reward details
      const reward = await this.getById(rewardId);

      if (!reward) {
        return {
          success: false,
          error: 'reward_not_found',
          message: 'Reward does not exist'
        };
      }

      if (!reward.active) {
        return {
          success: false,
          error: 'reward_inactive',
          message: 'This reward is no longer available'
        };
      }

      // Get current credits
      const agent = await this.db.queryOne<{ credits: number }>(
        'SELECT credits FROM agents WHERE id = $1',
        [agentId]
      );

      if (!agent || agent.credits < reward.credit_cost) {
        return {
          success: false,
          error: 'insufficient_credits',
          message: `You have ${agent?.credits || 0} credits, need ${reward.credit_cost}`
        };
      }

      // Atomic transaction: deduct credits, create redemption record
      const redemptionId = await this.db.transaction(async (client) => {
        // 1. Deduct credits from agent
        await client.query(
          'UPDATE agents SET credits = credits - $1 WHERE id = $2',
          [reward.credit_cost, agentId]
        );

        // 2. Create redemption record
        const result = await client.query(
          `INSERT INTO redemptions (agent_id, reward_id, credits_spent, status)
           VALUES ($1, $2, $3, 'pending')
           RETURNING id`,
          [agentId, rewardId, reward.credit_cost]
        );

        return result.rows[0].id;
      });

      if (!redemptionId) {
        throw new Error('Failed to create redemption record');
      }

      return {
        success: true,
        redemption_id: redemptionId,
        credits_spent: reward.credit_cost
      };

    } catch (error) {
      console.error('Redemption error:', error);
      return {
        success: false,
        error: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getCreditBalance(agentId: number): Promise<CreditBalance> {
    const result = await this.db.queryOne<{
      cached_credits: number;
      total_earned: number;
      total_spent: number;
    }>(`
      SELECT
        a.credits as cached_credits,
        COALESCE(SUM(t.credits_earned), 0) as total_earned,
        COALESCE(SUM(r.credits_spent), 0) as total_spent
      FROM agents a
      LEFT JOIN transactions t ON t.agent_id = a.id
      LEFT JOIN redemptions r ON r.agent_id = a.id AND r.status = 'fulfilled'
      WHERE a.id = $1
      GROUP BY a.credits
    `, [agentId]);

    return {
      total_earned: result?.total_earned || 0,
      total_spent: result?.total_spent || 0,
      available: result?.cached_credits || 0
    };
  }

  async convertKarmaToCredits(agentId: number, karmaAmount: number): Promise<ConversionResult> {
    try {
      // Validate amount
      if (karmaAmount < KARMA_TO_CREDIT_RATIO) {
        return {
          success: false,
          error: 'invalid_amount',
          message: `Minimum conversion is ${KARMA_TO_CREDIT_RATIO} karma`
        };
      }

      if (karmaAmount % KARMA_TO_CREDIT_RATIO !== 0) {
        return {
          success: false,
          error: 'invalid_amount',
          message: `Karma amount must be a multiple of ${KARMA_TO_CREDIT_RATIO}`
        };
      }

      // Get current karma
      const agent = await this.db.queryOne<{ karma: number }>(
        'SELECT karma FROM agents WHERE id = $1',
        [agentId]
      );

      if (!agent || agent.karma < karmaAmount) {
        return {
          success: false,
          error: 'insufficient_karma',
          message: `You have ${agent?.karma || 0} karma, need ${karmaAmount}`
        };
      }

      const creditsEarned = Math.floor(karmaAmount / KARMA_TO_CREDIT_RATIO);

      // Atomic transaction: deduct karma, add credits, log transaction
      const transactionId = await this.db.transaction(async (client) => {
        // 1. Deduct karma from agent
        await client.query(
          'UPDATE agents SET karma = karma - $1 WHERE id = $2',
          [karmaAmount, agentId]
        );

        // 2. Add credits to agent
        await client.query(
          'UPDATE agents SET credits = credits + $1 WHERE id = $2',
          [creditsEarned, agentId]
        );

        // 3. Create transaction log entry
        const result = await client.query(
          'INSERT INTO transactions (agent_id, karma_spent, credits_earned) VALUES ($1, $2, $3) RETURNING id',
          [agentId, karmaAmount, creditsEarned]
        );

        return result.rows[0].id;
      });

      if (!transactionId) {
        throw new Error('Failed to create transaction record');
      }

      return {
        success: true,
        transaction_id: transactionId,
        credits_earned: creditsEarned
      };

    } catch (error) {
      console.error('Karma conversion error:', error);
      return {
        success: false,
        error: 'unknown',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getAgentRedemptions(
    agentId: number,
    limit: number
  ): Promise<Array<Redemption & { reward_name: string; reward_type: RewardType }>> {
    return this.db.query<Redemption & { reward_name: string; reward_type: RewardType }>(`
      SELECT
        r.*,
        rw.name as reward_name,
        rw.reward_type
      FROM redemptions r
      JOIN rewards rw ON rw.id = r.reward_id
      WHERE r.agent_id = $1
      ORDER BY r.redeemed_at DESC
      LIMIT $2
    `, [agentId, limit]);
  }

  async getPendingRedemptions(
    limit: number
  ): Promise<Array<Redemption & { reward_name: string; reward_type: RewardType }>> {
    return this.db.query<Redemption & { reward_name: string; reward_type: RewardType }>(`
      SELECT
        r.*,
        rw.name as reward_name,
        rw.reward_type
      FROM redemptions r
      JOIN rewards rw ON rw.id = r.reward_id
      WHERE r.status = 'pending'
      ORDER BY r.redeemed_at ASC
      LIMIT $1
    `, [limit]);
  }

  async getAgentTransactions(agentId: number, limit: number): Promise<Transaction[]> {
    return this.db.query<Transaction>(
      'SELECT * FROM transactions WHERE agent_id = $1 ORDER BY created_at DESC LIMIT $2',
      [agentId, limit]
    );
  }

  async getAgentActiveRewards(
    agentId: number
  ): Promise<Array<Reward & { redeemed_at: string }>> {
    return this.db.query<Reward & { redeemed_at: string }>(`
      SELECT
        rw.*,
        r.redeemed_at
      FROM redemptions r
      JOIN rewards rw ON rw.id = r.reward_id
      WHERE r.agent_id = $1 AND r.status = 'fulfilled'
      ORDER BY r.fulfilled_at DESC
    `, [agentId]);
  }

  async updateRedemptionStatus(
    redemptionId: number,
    status: 'pending' | 'fulfilled' | 'failed'
  ): Promise<void> {
    if (status === 'fulfilled') {
      await this.db.query(
        'UPDATE redemptions SET status = $1, fulfilled_at = NOW() WHERE id = $2',
        [status, redemptionId]
      );
    } else {
      await this.db.query(
        'UPDATE redemptions SET status = $1 WHERE id = $2',
        [status, redemptionId]
      );
    }
  }

  async refundRedemption(redemptionId: number): Promise<void> {
    // Get redemption details
    const redemption = await this.db.queryOne<{
      agent_id: number;
      credits_spent: number;
      status: string;
    }>(
      'SELECT agent_id, credits_spent, status FROM redemptions WHERE id = $1',
      [redemptionId]
    );

    if (!redemption) {
      throw new Error('Redemption not found');
    }

    if (redemption.status === 'fulfilled') {
      throw new Error('Cannot refund fulfilled redemption');
    }

    // Atomic: refund credits, mark as failed
    await this.db.transaction(async (client) => {
      await client.query(
        'UPDATE agents SET credits = credits + $1 WHERE id = $2',
        [redemption.credits_spent, redemption.agent_id]
      );

      await client.query(
        "UPDATE redemptions SET status = 'failed' WHERE id = $1",
        [redemptionId]
      );
    });
  }

  async calculateCreditBalanceFromTransactions(agentId: number): Promise<number> {
    const result = await this.db.queryOne<{ balance: number }>(`
      SELECT
        COALESCE(SUM(t.credits_earned), 0) - COALESCE(SUM(r.credits_spent), 0) as balance
      FROM agents a
      LEFT JOIN transactions t ON t.agent_id = a.id
      LEFT JOIN redemptions r ON r.agent_id = a.id AND r.status = 'fulfilled'
      WHERE a.id = $1
    `, [agentId]);

    return result?.balance || 0;
  }

  async reconcileCreditBalance(agentId: number): Promise<number> {
    const actualBalance = await this.calculateCreditBalanceFromTransactions(agentId);

    await this.db.query(
      'UPDATE agents SET credits = $1 WHERE id = $2',
      [actualBalance, agentId]
    );

    return actualBalance;
  }
}
