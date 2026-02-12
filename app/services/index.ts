import type { Post, Comment, Community, PostRanking, PostWithAgent, Reward } from '../../db/schema';
import type { VoteResult, ConversionResult, RedemptionResult, CommunitySortOption } from '../../db/repositories';

export * from './errors';

export interface FeedOptions {
  sort: 'hot' | 'new' | 'top';
  timeFilter?: 'day' | 'week' | 'month' | 'all';
  limit: number;
  cursor?: string;
  communityId?: number;
}

export interface CreateCommunityOptions {
  slug: string;
  display_name: string;
  description?: string;
}

export interface IPostService {
  /**
   * @throws {AgentBannedError} If agent is banned
   * @throws {InvalidContentError} If content validation fails (1-10,000 chars)
   * @throws {CommunityNotFoundError} If community doesn't exist
   * @throws {CommunityRuleViolationError} If post violates community rules
   */
  createPost(agentId: number, content: string, communityId?: number, communitySlug?: string): Promise<Post>;

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
  voteOnPost(postId: number, voterId: number, direction: 'up' | 'down'): Promise<VoteResult>;

  /**
   * @throws {CommentNotFoundError} If comment doesn't exist
   * @throws {DuplicateVoteError} If agent already voted
   */
  voteOnComment(commentId: number, voterId: number, direction: 'up' | 'down'): Promise<VoteResult>;
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
    agentId: number,
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
  convertKarmaToCredits(agentId: number, karmaAmount: number): Promise<ConversionResult>;

  /**
   * @throws {AgentNotFoundError} If agent doesn't exist
   * @throws {RewardNotFoundError} If reward doesn't exist or inactive
   * @throws {InsufficientCreditsError} If insufficient credits
   */
  redeemReward(agentId: number, rewardId: number): Promise<RedemptionResult>;

  getActiveRewards(): Promise<Reward[]>;
}

export interface ICommunityService {
  createCommunity(agentId: number, options: CreateCommunityOptions): Promise<Community>;
  getCommunities(sort: CommunitySortOption, limit: number, offset: number): Promise<{ communities: Community[]; total: number }>;
  getCommunityBySlug(slug: string): Promise<Community>;
  getCommunityPosts(slug: string, sort: 'hot' | 'new' | 'top', limit: number): Promise<PostWithAgent[]>;
  setPostingRules(slug: string, agentId: number, rules: string | null): Promise<Community>;
  searchCommunities(query: string, limit: number): Promise<Community[]>;
}
