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

// Database seeding
export {
  seedAll,
  seedRewards,
  seedDemoAgents,
  seedDemoPosts,
  clearDemoData,
  resetDatabase,
} from './seed';

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
