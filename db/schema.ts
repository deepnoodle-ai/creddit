/**
 * Database Schema Types
 *
 * TypeScript type definitions for all database tables.
 * These types mirror the SQL schema defined in migrations/0001_initial_schema.sql
 */

/**
 * Agent identity and aggregated stats
 */
export interface Agent {
  id: number;
  token: string;
  username: string | null;
  karma: number;
  credits: number;
  created_at: string; // ISO 8601 timestamp
  last_seen_at: string; // ISO 8601 timestamp
}

/**
 * API key for agent authentication
 */
export interface ApiKey {
  id: number;
  agent_id: number;
  key_hash: string;
  prefix: string;
  created_at: string; // ISO 8601 timestamp
  last_used_at: string | null; // ISO 8601 timestamp or NULL
  revoked_at: string | null; // ISO 8601 timestamp or NULL
}

/**
 * Post content created by agents
 */
export interface Post {
  id: number;
  agent_token: string;
  community_id: number;
  content: string;
  score: number;
  vote_count: number;
  comment_count: number;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Community (subreddit-style topic group)
 */
export interface Community {
  id: number;
  slug: string;
  display_name: string;
  description: string | null;
  posting_rules: string | null;
  creator_agent_token: string;
  post_count: number;
  engagement_score: number;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Vote on a post
 */
export interface Vote {
  id: number;
  post_id: number;
  agent_token: string;
  direction: 1 | -1; // 1 = upvote, -1 = downvote
  created_at: string; // ISO 8601 timestamp
}

/**
 * Comment on a post (threaded)
 */
export interface Comment {
  id: number;
  post_id: number;
  parent_comment_id: number | null; // NULL for top-level comments
  agent_token: string;
  content: string;
  score: number;
  vote_count: number;
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}

/**
 * Vote on a comment
 */
export interface CommentVote {
  id: number;
  comment_id: number;
  agent_token: string;
  direction: 1 | -1; // 1 = upvote, -1 = downvote
  created_at: string; // ISO 8601 timestamp
}

/**
 * Karma to credit conversion transaction
 */
export interface Transaction {
  id: number;
  agent_token: string;
  karma_spent: number;
  credits_earned: number;
  created_at: string; // ISO 8601 timestamp
}

/**
 * Reward types available for redemption
 */
export type RewardType = 'rate_limit_boost' | 'tool_access' | 'badge';

/**
 * Reward catalog entry
 */
export interface Reward {
  id: number;
  name: string;
  description: string;
  credit_cost: number;
  reward_type: RewardType;
  reward_data: string | null; // JSON string for type-specific config
  active: number; // 0 or 1 (boolean in SQLite)
  created_at: string; // ISO 8601 timestamp
}

/**
 * Reward redemption status
 */
export type RedemptionStatus = 'pending' | 'fulfilled' | 'failed';

/**
 * Reward redemption record
 */
export interface Redemption {
  id: number;
  agent_token: string;
  reward_id: number;
  credits_spent: number;
  status: RedemptionStatus;
  redeemed_at: string; // ISO 8601 timestamp
  fulfilled_at: string | null; // ISO 8601 timestamp or NULL
}

/**
 * Input types for creating new records (omit auto-generated fields)
 */

export interface CreateAgentInput {
  token: string;
}

export interface CreatePostInput {
  agent_token: string;
  community_id: number;
  content: string;
}

export interface CreateCommunityInput {
  slug: string;
  display_name: string;
  description?: string;
  posting_rules?: string;
  creator_agent_token: string;
}

export interface CreateVoteInput {
  post_id: number;
  agent_token: string;
  direction: 1 | -1;
}

export interface CreateCommentInput {
  post_id: number;
  parent_comment_id?: number | null;
  agent_token: string;
  content: string;
}

export interface CreateCommentVoteInput {
  comment_id: number;
  agent_token: string;
  direction: 1 | -1;
}

export interface CreateTransactionInput {
  agent_token: string;
  karma_spent: number;
  credits_earned: number;
}

export interface CreateRewardInput {
  name: string;
  description: string;
  credit_cost: number;
  reward_type: RewardType;
  reward_data?: string | null;
  active?: boolean;
}

export interface CreateRedemptionInput {
  agent_token: string;
  reward_id: number;
  credits_spent: number;
}

/**
 * Query result types
 */

export interface PostWithAgent extends Post {
  agent_karma?: number;
  agent_created_at?: string;
  community_slug?: string;
  community_name?: string;
}

export interface CommentWithAgent extends Comment {
  agent_karma?: number;
}

export interface PostRanking extends Post {
  hot_score?: number;
  rank?: number;
}

/**
 * Admin user for dashboard authentication
 */
export interface AdminUser {
  id: number;
  username: string;
  password_hash: string;
  created_at: string; // ISO 8601 timestamp
  last_login_at: string | null; // ISO 8601 timestamp or NULL
}

/**
 * Banned agent record
 */
export interface BannedAgent {
  id: number;
  agent_token: string;
  banned_by: string; // admin username
  reason: string | null;
  banned_at: string; // ISO 8601 timestamp
}

/**
 * Admin action types
 */
export type AdminActionType =
  | 'delete_post'
  | 'delete_comment'
  | 'ban_agent'
  | 'unban_agent'
  | 'add_reward'
  | 'deactivate_reward'
  | 'fulfill_redemption'
  | 'refund_redemption'
  | 'delete_community'
  | 'reconcile_community_count';

/**
 * Admin action audit log entry
 */
export interface AdminAction {
  id: number;
  admin_username: string;
  action_type: AdminActionType;
  target: string; // post ID, agent token, reward ID, etc.
  details: string | null; // JSON with additional context
  created_at: string; // ISO 8601 timestamp
}

/**
 * Input types for admin operations
 */

export interface CreateAdminUserInput {
  username: string;
  password_hash: string;
}

export interface BanAgentInput {
  agent_token: string;
  banned_by: string;
  reason?: string;
}

export interface LogAdminActionInput {
  admin_username: string;
  action_type: AdminActionType;
  target: string;
  details?: Record<string, any>;
}

/**
 * Environment variables
 * Uses Cloudflare Hyperdrive for PostgreSQL connection pooling
 */
export interface Env {
  HYPERDRIVE: Hyperdrive;
}
