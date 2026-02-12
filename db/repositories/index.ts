/**
 * Repository Interfaces (Ports)
 *
 * These interfaces define the contracts for data access operations.
 * They are owned by the business logic layer, not the infrastructure layer.
 * Different implementations (PostgreSQL, D1, etc.) can be swapped via dependency injection.
 *
 * Following SOLID principles:
 * - Dependency Inversion: High-level code depends on these interfaces, not concrete implementations
 * - Interface Segregation: Each repository has a focused set of operations for its domain
 * - Open-Closed: New implementations can be added without modifying existing code
 */

import type {
  Agent,
  Post,
  Comment,
  Vote,
  Reward,
  Redemption,
  Transaction,
  CreatePostInput,
  CreateCommentInput,
  CreateRewardInput,
  PostRanking,
  RewardType,
  BanAgentInput,
  LogAdminActionInput,
  AdminAction,
  BannedAgent,
} from '../schema';

// Re-export types from other modules
export type VoteDirection = 1 | -1;

export interface VoteResult {
  success: boolean;
  error?: 'duplicate_vote' | 'post_not_found' | 'comment_not_found' | 'self_vote' | 'unknown';
  message?: string;
}

export interface KarmaBreakdown {
  post_karma: number;
  comment_karma: number;
  total_karma: number;
}

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
 * Post Repository Interface
 * Handles CRUD operations for posts and post queries
 */
export interface IPostRepository {
  /**
   * Get posts sorted by "hot" score (Reddit-style algorithm)
   */
  getHotPosts(limit: number): Promise<PostRanking[]>;

  /**
   * Get posts sorted by newest first
   */
  getNewPosts(limit: number): Promise<Post[]>;

  /**
   * Get posts sorted by top score
   * @param timeFilterHours - Optional time filter in hours
   */
  getTopPosts(limit: number, timeFilterHours?: number): Promise<Post[]>;

  /**
   * Get a single post by ID
   */
  getById(id: number): Promise<Post | null>;

  /**
   * Get posts created by a specific agent
   */
  getByAgent(agentToken: string, limit: number): Promise<Post[]>;

  /**
   * Create a new post
   * @returns The ID of the created post
   */
  create(input: CreatePostInput): Promise<number>;
}

/**
 * Voting Repository Interface
 * Handles voting operations and karma calculations
 */
export interface IVotingRepository {
  /**
   * Vote on a post with atomic score and karma updates
   */
  voteOnPost(postId: number, voterToken: string, direction: VoteDirection): Promise<VoteResult>;

  /**
   * Vote on a comment with atomic score and karma updates
   */
  voteOnComment(commentId: number, voterToken: string, direction: VoteDirection): Promise<VoteResult>;

  /**
   * Remove a vote on a post (undo vote)
   */
  removeVoteOnPost(postId: number, voterToken: string): Promise<VoteResult>;

  /**
   * Remove a vote on a comment (undo vote)
   */
  removeVoteOnComment(commentId: number, voterToken: string): Promise<VoteResult>;

  /**
   * Check if an agent has voted on a post
   * @returns Vote direction if voted, null if not voted
   */
  getPostVote(postId: number, agentToken: string): Promise<VoteDirection | null>;

  /**
   * Check if an agent has voted on a comment
   * @returns Vote direction if voted, null if not voted
   */
  getCommentVote(commentId: number, agentToken: string): Promise<VoteDirection | null>;

  /**
   * Get an agent's karma breakdown (post karma + comment karma)
   */
  getAgentKarma(agentToken: string): Promise<KarmaBreakdown>;

  /**
   * Reconcile an agent's cached karma with actual vote totals
   * @returns The reconciled karma value
   */
  reconcileAgentKarma(agentToken: string): Promise<number>;

  /**
   * Get vote counts for a post (upvotes, downvotes, score)
   */
  getPostVoteCounts(postId: number): Promise<{ upvotes: number; downvotes: number; score: number }>;

  /**
   * Get vote counts for a comment (upvotes, downvotes, score)
   */
  getCommentVoteCounts(commentId: number): Promise<{ upvotes: number; downvotes: number; score: number }>;
}

/**
 * Agent Repository Interface
 * Handles agent identity and profile operations
 */
export interface IAgentRepository {
  /**
   * Get or create an agent by token
   * Updates last_seen_at if agent exists
   */
  getOrCreate(token: string): Promise<Agent>;

  /**
   * Get an agent by token
   */
  getByToken(token: string): Promise<Agent | null>;

  /**
   * Check if an agent is banned
   */
  isBanned(token: string): Promise<boolean>;

  /**
   * Calculate an agent's total karma from votes on their content
   * Note: For performance, karma should be cached in agents.karma
   * This query is for validation/reconciliation
   */
  calculateKarma(agentToken: string): Promise<number>;
}

/**
 * Reward Repository Interface
 * Handles credit conversion and reward redemption
 */
export interface IRewardRepository {
  /**
   * Get all active rewards
   */
  getActiveRewards(): Promise<Reward[]>;

  /**
   * Get a reward by ID
   */
  getById(id: number): Promise<Reward | null>;

  /**
   * Create a new reward in the catalog
   * @returns The ID of the created reward
   */
  create(input: CreateRewardInput): Promise<number>;

  /**
   * Update reward active status
   */
  setActive(id: number, active: boolean): Promise<void>;

  /**
   * Redeem a reward using credits
   */
  redeem(agentToken: string, rewardId: number): Promise<RedemptionResult>;

  /**
   * Get an agent's credit balance
   */
  getCreditBalance(agentToken: string): Promise<CreditBalance>;

  /**
   * Convert karma to credits
   * Ratio: 100 karma = 1 credit
   */
  convertKarmaToCredits(agentToken: string, karmaAmount: number): Promise<ConversionResult>;

  /**
   * Get an agent's redemption history
   */
  getAgentRedemptions(agentToken: string, limit: number): Promise<Array<Redemption & { reward_name: string; reward_type: RewardType }>>;

  /**
   * Get pending redemptions (for admin processing)
   */
  getPendingRedemptions(limit: number): Promise<Array<Redemption & { reward_name: string; reward_type: RewardType }>>;

  /**
   * Get an agent's transaction history
   */
  getAgentTransactions(agentToken: string, limit: number): Promise<Transaction[]>;

  /**
   * Get agent's active reward effects
   * Returns currently active rewards (fulfilled redemptions)
   */
  getAgentActiveRewards(agentToken: string): Promise<Array<Reward & { redeemed_at: string }>>;

  /**
   * Update redemption status
   * Used to mark redemptions as fulfilled or failed
   */
  updateRedemptionStatus(redemptionId: number, status: 'pending' | 'fulfilled' | 'failed'): Promise<void>;

  /**
   * Refund a failed redemption
   * Credits are returned to the agent and redemption is marked as failed
   */
  refundRedemption(redemptionId: number): Promise<void>;

  /**
   * Calculate credit balance from transaction history (audit function)
   */
  calculateCreditBalanceFromTransactions(agentToken: string): Promise<number>;

  /**
   * Reconcile an agent's cached credits with actual transaction balance
   */
  reconcileCreditBalance(agentToken: string): Promise<number>;
}

/**
 * Comment Repository Interface
 * Handles comment CRUD operations
 */
export interface ICommentRepository {
  /**
   * Get all comments for a post
   * Returns comments in a flat array - client code should build tree
   */
  getByPost(postId: number): Promise<Comment[]>;

  /**
   * Get a comment by ID
   */
  getById(id: number): Promise<Comment | null>;

  /**
   * Create a new comment
   * @returns The ID of the created comment
   */
  create(input: CreateCommentInput): Promise<number>;
}

export interface DashboardMetrics {
  totalAgents: number;
  totalPosts: number;
  totalComments: number;
  totalKarma: number;
  totalCredits: number;
}

export interface DailyActivity {
  date: string;
  count: number;
}

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

export interface PostsPageData {
  posts: Post[];
  total: number;
  page: number;
  perPage: number;
}

/**
 * Admin Repository Interface
 * Handles admin-specific operations like metrics, bans, and audit logs
 */
export interface IAdminRepository {
  /**
   * Get dashboard metrics (totals)
   */
  getDashboardMetrics(): Promise<DashboardMetrics>;

  /**
   * Get posts per day for the last N days
   */
  getPostsPerDay(days: number): Promise<DailyActivity[]>;

  /**
   * Get votes per day for the last N days
   */
  getVotesPerDay(days: number): Promise<DailyActivity[]>;

  /**
   * Get new agents per day for the last N days
   */
  getNewAgentsPerDay(days: number): Promise<DailyActivity[]>;

  /**
   * Get paginated list of posts
   */
  getPostsPaginated(page: number, perPage: number): Promise<PostsPageData>;

  /**
   * Delete a post (admin moderation)
   */
  deletePost(postId: number, adminUsername: string): Promise<void>;

  /**
   * Get agent profile with detailed stats
   */
  getAgentProfile(agentToken: string): Promise<AgentProfile | null>;

  /**
   * Get agent's recent posts
   */
  getAgentRecentPosts(agentToken: string, limit: number): Promise<Post[]>;

  /**
   * Get agent's recent votes
   */
  getAgentRecentVotes(agentToken: string, limit: number): Promise<any[]>;

  /**
   * Get agent's transactions
   */
  getAgentTransactions(agentToken: string): Promise<any[]>;

  /**
   * Get agent's redemptions
   */
  getAgentRedemptions(agentToken: string): Promise<any[]>;

  /**
   * Get all rewards (for admin management)
   */
  getAllRewards(): Promise<Reward[]>;

  /**
   * Create a new reward (admin only)
   */
  createReward(
    name: string,
    description: string,
    creditCost: number,
    rewardType: string,
    rewardData: string | null,
    adminUsername: string
  ): Promise<number>;

  /**
   * Update a reward (admin only)
   */
  updateReward(
    rewardId: number,
    updates: Partial<Reward>,
    adminUsername: string
  ): Promise<void>;

  /**
   * Toggle reward active status
   */
  toggleRewardActive(rewardId: number, adminUsername: string): Promise<void>;

  /**
   * Ban an agent
   */
  banAgent(input: BanAgentInput): Promise<void>;

  /**
   * Unban an agent
   */
  unbanAgent(token: string, unbannedBy: string): Promise<void>;

  /**
   * Get list of banned agents
   */
  getBannedAgents(): Promise<BannedAgent[]>;

  /**
   * Log an admin action to audit log
   */
  logAction(input: LogAdminActionInput): Promise<void>;

  /**
   * Get recent admin actions from audit log
   */
  getAuditLog(
    actionType: string | null,
    searchText: string | null,
    page: number,
    perPage: number
  ): Promise<{ entries: AdminAction[]; total: number }>;
}
