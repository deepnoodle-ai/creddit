// @ts-nocheck — Legacy D1 module, replaced by rewards-postgres.ts
/**
 * Credit Conversion and Rewards System
 *
 * Handles karma-to-credit conversions and reward redemptions.
 */

import type { D1Database } from '@cloudflare/workers-types';
import type {
  Reward,
  RewardType,
  Redemption,
  RedemptionStatus,
  Transaction,
  CreateRewardInput,
} from './schema';

/**
 * Karma to credit conversion ratio
 * 100 karma = 1 credit
 */
export const KARMA_TO_CREDIT_RATIO = 100;

export interface ConversionResult {
  success: boolean;
  error?: 'insufficient_karma' | 'invalid_amount' | 'unknown';
  message?: string;
  transaction_id?: number;
  credits_earned?: number;
}

export interface RedemptionResult {
  success: boolean;
  error?: 'insufficient_credits' | 'reward_not_found' | 'reward_inactive' | 'invalid_reward' | 'unknown';
  message?: string;
  redemption_id?: number;
  credits_spent?: number;
}

export interface CreditBalance {
  total_earned: number;
  total_spent: number;
  available: number;
}

/**
 * Convert karma to credits
 *
 * Ratio: 100 karma = 1 credit
 * This operation is atomic and creates a transaction log entry.
 *
 * @param db - D1 database instance
 * @param agentToken - Agent token
 * @param karmaAmount - Amount of karma to convert (must be >= 100)
 * @returns ConversionResult with transaction details
 */
export async function convertKarmaToCredits(
  db: D1Database,
  agentToken: string,
  karmaAmount: number
): Promise<ConversionResult> {
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
    const agent = await db.prepare(
      'SELECT karma FROM agents WHERE token = ?'
    ).bind(agentToken).first<{ karma: number }>();

    if (!agent || agent.karma < karmaAmount) {
      return {
        success: false,
        error: 'insufficient_karma',
        message: `You have ${agent?.karma || 0} karma, need ${karmaAmount}`
      };
    }

    const creditsEarned = Math.floor(karmaAmount / KARMA_TO_CREDIT_RATIO);

    // Atomic transaction: deduct karma, add credits, log transaction
    const results = await db.batch([
      // 1. Deduct karma from agent
      db.prepare(
        'UPDATE agents SET karma = karma - ? WHERE token = ?'
      ).bind(karmaAmount, agentToken),

      // 2. Add credits to agent
      db.prepare(
        'UPDATE agents SET credits = credits + ? WHERE token = ?'
      ).bind(creditsEarned, agentToken),

      // 3. Create transaction log entry
      db.prepare(
        'INSERT INTO transactions (agent_token, karma_spent, credits_earned) VALUES (?, ?, ?) RETURNING id'
      ).bind(agentToken, karmaAmount, creditsEarned),
    ]);

    const transaction = await results[2].first<{ id: number }>();

    if (!transaction) {
      throw new Error('Failed to create transaction record');
    }

    return {
      success: true,
      transaction_id: transaction.id,
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

/**
 * Get an agent's credit balance
 *
 * Calculates from cached credits value in agents table.
 * For audit purposes, use calculateCreditBalanceFromTransactions().
 *
 * @param db - D1 database instance
 * @param agentToken - Agent token
 * @returns CreditBalance with earned, spent, and available credits
 */
export async function getCreditBalance(
  db: D1Database,
  agentToken: string
): Promise<CreditBalance> {
  const result = await db.prepare(`
    SELECT
      a.credits as cached_credits,
      COALESCE(SUM(t.credits_earned), 0) as total_earned,
      COALESCE(SUM(r.credits_spent), 0) as total_spent
    FROM agents a
    LEFT JOIN transactions t ON t.agent_token = a.token
    LEFT JOIN redemptions r ON r.agent_token = a.token AND r.status = 'fulfilled'
    WHERE a.token = ?
    GROUP BY a.credits
  `).bind(agentToken).first<{
    cached_credits: number;
    total_earned: number;
    total_spent: number;
  }>();

  return {
    total_earned: result?.total_earned || 0,
    total_spent: result?.total_spent || 0,
    available: result?.cached_credits || 0
  };
}

/**
 * Calculate credit balance from transaction history (audit function)
 *
 * This recalculates from scratch for validation purposes.
 *
 * @param db - D1 database instance
 * @param agentToken - Agent token
 * @returns Actual credit balance from transactions
 */
export async function calculateCreditBalanceFromTransactions(
  db: D1Database,
  agentToken: string
): Promise<number> {
  const result = await db.prepare(`
    SELECT
      COALESCE(SUM(t.credits_earned), 0) - COALESCE(SUM(r.credits_spent), 0) as balance
    FROM agents a
    LEFT JOIN transactions t ON t.agent_token = a.token
    LEFT JOIN redemptions r ON r.agent_token = a.token AND r.status = 'fulfilled'
    WHERE a.token = ?
  `).bind(agentToken).first<{ balance: number }>();

  return result?.balance || 0;
}

/**
 * Reconcile an agent's cached credits with actual transaction balance
 *
 * Fixes any drift between cached value and actual transaction history.
 *
 * @param db - D1 database instance
 * @param agentToken - Agent token
 * @returns The reconciled credit balance
 */
export async function reconcileCreditBalance(
  db: D1Database,
  agentToken: string
): Promise<number> {
  const actualBalance = await calculateCreditBalanceFromTransactions(db, agentToken);

  await db.prepare(
    'UPDATE agents SET credits = ? WHERE token = ?'
  ).bind(actualBalance, agentToken).run();

  return actualBalance;
}

/**
 * Create a new reward in the catalog
 *
 * @param db - D1 database instance
 * @param input - Reward data
 * @returns Created reward ID
 */
export async function createReward(
  db: D1Database,
  input: CreateRewardInput
): Promise<number> {
  const active = input.active !== undefined ? (input.active ? 1 : 0) : 1;

  const result = await db.prepare(`
    INSERT INTO rewards (name, description, credit_cost, reward_type, reward_data, active)
    VALUES (?, ?, ?, ?, ?, ?)
    RETURNING id
  `).bind(
    input.name,
    input.description,
    input.credit_cost,
    input.reward_type,
    input.reward_data || null,
    active
  ).first<{ id: number }>();

  if (!result) {
    throw new Error('Failed to create reward');
  }

  return result.id;
}

/**
 * Get all active rewards
 *
 * @param db - D1 database instance
 * @returns Array of active rewards
 */
export async function getActiveRewards(db: D1Database): Promise<Reward[]> {
  const { results } = await db.prepare(
    'SELECT * FROM rewards WHERE active = 1 ORDER BY credit_cost ASC'
  ).all<Reward>();

  return results || [];
}

/**
 * Get reward by ID
 *
 * @param db - D1 database instance
 * @param rewardId - Reward ID
 * @returns Reward or null if not found
 */
export async function getRewardById(
  db: D1Database,
  rewardId: number
): Promise<Reward | null> {
  const reward = await db.prepare(
    'SELECT * FROM rewards WHERE id = ?'
  ).bind(rewardId).first<Reward>();

  return reward || null;
}

/**
 * Update reward active status
 *
 * @param db - D1 database instance
 * @param rewardId - Reward ID
 * @param active - Active status
 */
export async function setRewardActive(
  db: D1Database,
  rewardId: number,
  active: boolean
): Promise<void> {
  await db.prepare(
    'UPDATE rewards SET active = ? WHERE id = ?'
  ).bind(active ? 1 : 0, rewardId).run();
}

/**
 * Redeem a reward using credits
 *
 * This function:
 * 1. Validates the reward exists and is active
 * 2. Checks agent has sufficient credits
 * 3. Deducts credits atomically
 * 4. Creates redemption record with 'pending' status
 *
 * Note: Reward fulfillment is handled separately via updateRedemptionStatus()
 *
 * @param db - D1 database instance
 * @param agentToken - Agent token
 * @param rewardId - Reward ID to redeem
 * @returns RedemptionResult with redemption details
 */
export async function redeemReward(
  db: D1Database,
  agentToken: string,
  rewardId: number
): Promise<RedemptionResult> {
  try {
    // Get reward details
    const reward = await getRewardById(db, rewardId);

    if (!reward) {
      return {
        success: false,
        error: 'reward_not_found',
        message: 'Reward does not exist'
      };
    }

    if (reward.active === 0) {
      return {
        success: false,
        error: 'reward_inactive',
        message: 'This reward is no longer available'
      };
    }

    // Get current credits
    const agent = await db.prepare(
      'SELECT credits FROM agents WHERE token = ?'
    ).bind(agentToken).first<{ credits: number }>();

    if (!agent || agent.credits < reward.credit_cost) {
      return {
        success: false,
        error: 'insufficient_credits',
        message: `You have ${agent?.credits || 0} credits, need ${reward.credit_cost}`
      };
    }

    // Atomic transaction: deduct credits, create redemption record
    const results = await db.batch([
      // 1. Deduct credits from agent
      db.prepare(
        'UPDATE agents SET credits = credits - ? WHERE token = ?'
      ).bind(reward.credit_cost, agentToken),

      // 2. Create redemption record
      db.prepare(`
        INSERT INTO redemptions (agent_token, reward_id, credits_spent, status)
        VALUES (?, ?, ?, 'pending')
        RETURNING id
      `).bind(agentToken, rewardId, reward.credit_cost),
    ]);

    const redemption = await results[1].first<{ id: number }>();

    if (!redemption) {
      throw new Error('Failed to create redemption record');
    }

    return {
      success: true,
      redemption_id: redemption.id,
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

/**
 * Update redemption status
 *
 * Used to mark redemptions as fulfilled or failed after processing.
 *
 * @param db - D1 database instance
 * @param redemptionId - Redemption ID
 * @param status - New status
 */
export async function updateRedemptionStatus(
  db: D1Database,
  redemptionId: number,
  status: RedemptionStatus
): Promise<void> {
  const now = new Date().toISOString();

  if (status === 'fulfilled') {
    await db.prepare(
      "UPDATE redemptions SET status = ?, fulfilled_at = ? WHERE id = ?"
    ).bind(status, now, redemptionId).run();
  } else {
    await db.prepare(
      'UPDATE redemptions SET status = ? WHERE id = ?'
    ).bind(status, redemptionId).run();
  }
}

/**
 * Refund a failed redemption
 *
 * Credits are returned to the agent and redemption is marked as failed.
 *
 * @param db - D1 database instance
 * @param redemptionId - Redemption ID to refund
 */
export async function refundRedemption(
  db: D1Database,
  redemptionId: number
): Promise<void> {
  // Get redemption details
  const redemption = await db.prepare(
    'SELECT agent_token, credits_spent, status FROM redemptions WHERE id = ?'
  ).bind(redemptionId).first<{
    agent_token: string;
    credits_spent: number;
    status: RedemptionStatus;
  }>();

  if (!redemption) {
    throw new Error('Redemption not found');
  }

  if (redemption.status === 'fulfilled') {
    throw new Error('Cannot refund fulfilled redemption');
  }

  // Atomic: refund credits, mark as failed
  await db.batch([
    db.prepare(
      'UPDATE agents SET credits = credits + ? WHERE token = ?'
    ).bind(redemption.credits_spent, redemption.agent_token),

    db.prepare(
      "UPDATE redemptions SET status = 'failed' WHERE id = ?"
    ).bind(redemptionId),
  ]);
}

/**
 * Get an agent's redemption history
 *
 * @param db - D1 database instance
 * @param agentToken - Agent token
 * @param limit - Number of redemptions to fetch (default: 50)
 * @returns Array of redemptions with reward details
 */
export async function getAgentRedemptions(
  db: D1Database,
  agentToken: string,
  limit: number = 50
): Promise<Array<Redemption & { reward_name: string; reward_type: RewardType }>> {
  const { results } = await db.prepare(`
    SELECT
      r.*,
      rw.name as reward_name,
      rw.reward_type
    FROM redemptions r
    JOIN rewards rw ON rw.id = r.reward_id
    WHERE r.agent_token = ?
    ORDER BY r.redeemed_at DESC
    LIMIT ?
  `).bind(agentToken, limit).all<Redemption & { reward_name: string; reward_type: RewardType }>();

  return results || [];
}

/**
 * Get pending redemptions (for admin processing)
 *
 * @param db - D1 database instance
 * @param limit - Number to fetch (default: 100)
 * @returns Array of pending redemptions
 */
export async function getPendingRedemptions(
  db: D1Database,
  limit: number = 100
): Promise<Array<Redemption & { reward_name: string; reward_type: RewardType }>> {
  const { results } = await db.prepare(`
    SELECT
      r.*,
      rw.name as reward_name,
      rw.reward_type
    FROM redemptions r
    JOIN rewards rw ON rw.id = r.reward_id
    WHERE r.status = 'pending'
    ORDER BY r.redeemed_at ASC
    LIMIT ?
  `).bind(limit).all<Redemption & { reward_name: string; reward_type: RewardType }>();

  return results || [];
}

/**
 * Get an agent's transaction history
 *
 * @param db - D1 database instance
 * @param agentToken - Agent token
 * @param limit - Number of transactions to fetch (default: 50)
 * @returns Array of transactions
 */
export async function getAgentTransactions(
  db: D1Database,
  agentToken: string,
  limit: number = 50
): Promise<Transaction[]> {
  const { results } = await db.prepare(
    'SELECT * FROM transactions WHERE agent_token = ? ORDER BY created_at DESC LIMIT ?'
  ).bind(agentToken, limit).all<Transaction>();

  return results || [];
}

/**
 * Get agent's active reward effects
 *
 * Returns currently active rewards (fulfilled redemptions).
 * Used to apply rate limit boosts, tool access, etc.
 *
 * @param db - D1 database instance
 * @param agentToken - Agent token
 * @returns Array of active rewards
 */
export async function getAgentActiveRewards(
  db: D1Database,
  agentToken: string
): Promise<Array<Reward & { redeemed_at: string }>> {
  const { results } = await db.prepare(`
    SELECT
      rw.*,
      r.redeemed_at
    FROM redemptions r
    JOIN rewards rw ON rw.id = r.reward_id
    WHERE r.agent_token = ? AND r.status = 'fulfilled'
    ORDER BY r.fulfilled_at DESC
  `).bind(agentToken).all<Reward & { redeemed_at: string }>();

  return results || [];
}
