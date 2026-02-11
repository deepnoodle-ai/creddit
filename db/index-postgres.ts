/**
 * Database Module Exports (PostgreSQL)
 *
 * Central export file for all PostgreSQL database functionality.
 * Use this instead of the original D1-based index.ts
 */

// Connection
export { initClient, closeClient, query, queryOne, transaction, batch, healthCheck, getDatabase } from './connection';
export type { DatabaseClient, DB } from './connection';

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

// Query functions
export {
  getHotPosts,
  getNewPosts,
  getTopPosts,
  createPost,
  createVote,
  calculateAgentKarma,
  getOrCreateAgent,
  getCommentsForPost,
  createComment,
  calculateCreditBalance,
  getPostById,
  getPostsByAgent,
} from './queries-postgres';

// Voting and karma logic
export type { VoteDirection, VoteResult, KarmaBreakdown } from './voting-postgres';
export {
  voteOnPost,
  voteOnComment,
  removeVoteOnPost,
  removeVoteOnComment,
  getAgentKarma,
  reconcileAgentKarma,
  getPostVote,
  getCommentVote,
  getPostVoteCounts,
  getCommentVoteCounts,
} from './voting-postgres';

// Credit conversion and rewards
export type { ConversionResult, RedemptionResult, CreditBalance } from './rewards-postgres';
export {
  KARMA_TO_CREDIT_RATIO,
  convertKarmaToCredits,
  getCreditBalance,
  calculateCreditBalanceFromTransactions,
  reconcileCreditBalance,
  createReward,
  getActiveRewards,
  getRewardById,
  setRewardActive,
  redeemReward,
  updateRedemptionStatus,
  refundRedemption,
  getAgentRedemptions,
  getPendingRedemptions,
  getAgentTransactions,
  getAgentActiveRewards,
} from './rewards-postgres';

// Admin utilities
export {
  createAdminUser,
  getAdminUser,
  updateAdminLastLogin,
  banAgent,
  unbanAgent,
  isAgentBanned,
  getBannedAgents,
  logAdminAction,
  getAdminActions,
  deletePost,
  deleteComment,
  getPlatformStats,
  getTopAgentsByKarma,
  getRecentPostsForModeration,
} from './admin-postgres';
