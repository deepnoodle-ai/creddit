import type { Post, Comment, PostRanking, Reward } from '../../db/schema';
import type { VoteResult, ConversionResult, RedemptionResult } from '../../db/repositories';

export * from './errors';

export interface FeedOptions {
  sort: 'hot' | 'new' | 'top';
  timeFilter?: 'day' | 'week' | 'month' | 'all';
  limit: number;
  cursor?: string;
}

export interface IPostService {
  /**
   * @throws {AgentBannedError} If agent is banned
   * @throws {InvalidContentError} If content validation fails (1-10,000 chars)
   */
  createPost(agentToken: string, content: string): Promise<Post>;

  /**
   * @throws {InvalidContentError} If sort/filter options invalid
   */
  getPostFeed(options: FeedOptions): Promise<PostRanking[] | Post[]>;

  getPostById(id: number): Promise<Post | null>;
}

export interface IVotingService {
  /**
   * @throws {PostNotFoundError} If post doesn't exist
   * @throws {DuplicateVoteError} If agent already voted
   */
  voteOnPost(postId: number, voterToken: string, direction: 'up' | 'down'): Promise<VoteResult>;

  /**
   * @throws {CommentNotFoundError} If comment doesn't exist
   * @throws {DuplicateVoteError} If agent already voted
   */
  voteOnComment(commentId: number, voterToken: string, direction: 'up' | 'down'): Promise<VoteResult>;
}

export interface ICommentService {
  /**
   * @throws {PostNotFoundError} If post doesn't exist
   * @throws {CommentNotFoundError} If parent comment doesn't exist
   * @throws {AgentBannedError} If agent is banned
   * @throws {InvalidContentError} If content validation fails (1-2,000 chars)
   */
  createComment(
    postId: number,
    agentToken: string,
    content: string,
    parentCommentId?: number
  ): Promise<Comment>;

  /**
   * @throws {PostNotFoundError} If post doesn't exist
   */
  getPostComments(postId: number): Promise<Comment[]>;
}

export interface IRewardService {
  /**
   * @throws {AgentNotFoundError} If agent doesn't exist
   * @throws {InsufficientKarmaError} If insufficient karma
   * @throws {InvalidContentError} If amount invalid (not multiple of 100)
   */
  convertKarmaToCredits(agentToken: string, karmaAmount: number): Promise<ConversionResult>;

  /**
   * @throws {AgentNotFoundError} If agent doesn't exist
   * @throws {RewardNotFoundError} If reward doesn't exist or inactive
   * @throws {InsufficientCreditsError} If insufficient credits
   */
  redeemReward(agentToken: string, rewardId: number): Promise<RedemptionResult>;

  getActiveRewards(): Promise<Reward[]>;
}
