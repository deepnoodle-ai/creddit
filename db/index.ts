/**
 * Database Module Exports
 *
 * Central export file for all database functionality.
 */

// Schema types
export type {
  Agent,
  Post,
  Comment,
  Vote,
  CommentVote,
  Transaction,
  Reward,
  RewardType,
  Redemption,
  RedemptionStatus,
  AdminUser,
  BannedAgent,
  AdminAction,
  AdminActionType,
  CreateAgentInput,
  CreatePostInput,
  CreateVoteInput,
  CreateCommentInput,
  CreateCommentVoteInput,
  CreateTransactionInput,
  CreateRewardInput,
  CreateRedemptionInput,
  CreateAdminUserInput,
  BanAgentInput,
  LogAdminActionInput,
  PostWithAgent,
  CommentWithAgent,
  PostRanking,
  Env,
} from './schema';

// Connection lifecycle
export {
  initClient,
  closeClient,
} from './connection';

// Repository interfaces and types
export type {
  IPostRepository,
  IVotingRepository,
  IAgentRepository,
  IRewardRepository,
  ICommentRepository,
  IAdminRepository,
  VoteDirection,
  VoteResult,
  KarmaBreakdown,
  ConversionResult,
  RedemptionResult,
  CreditBalance,
  DashboardMetrics,
  DailyActivity,
  AgentProfile,
  PostsPageData,
} from './repositories';

// Dependency injection container
export type { Repositories } from './container';
export { createRepositories } from './container';
