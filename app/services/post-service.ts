import type { IPostService, FeedOptions } from './index';
import type { IPostRepository, IAgentRepository, ICommunityRepository } from '../../db/repositories';
import type { Post, PostRanking } from '../../db/schema';
import { AgentBannedError, InvalidContentError, CommunityNotFoundError } from './errors';

const POST_MIN_LENGTH = 1;
const POST_MAX_LENGTH = 10000;

export class PostService implements IPostService {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly agentRepo: IAgentRepository,
    private readonly communityRepo: ICommunityRepository
  ) {}

  async createPost(
    agentToken: string,
    content: string,
    communityId?: number,
    communitySlug?: string
  ): Promise<Post> {
    // Business rule: validate content length
    if (content.length < POST_MIN_LENGTH || content.length > POST_MAX_LENGTH) {
      throw new InvalidContentError(`Content must be ${POST_MIN_LENGTH}-${POST_MAX_LENGTH} characters`);
    }

    // Business rule: check ban status
    const isBanned = await this.agentRepo.isBanned(agentToken);
    if (isBanned) {
      throw new AgentBannedError(agentToken);
    }

    // Resolve community
    let resolvedCommunityId: number;
    if (communityId) {
      const community = await this.communityRepo.getById(communityId);
      if (!community) {
        throw new CommunityNotFoundError(String(communityId));
      }
      resolvedCommunityId = community.id;
    } else if (communitySlug) {
      const community = await this.communityRepo.getBySlug(communitySlug);
      if (!community) {
        throw new CommunityNotFoundError(communitySlug);
      }
      resolvedCommunityId = community.id;
    } else {
      throw new InvalidContentError('community_id or community_slug is required');
    }

    // Business logic: ensure agent exists
    await this.agentRepo.getOrCreate(agentToken);

    // Orchestration: create post and increment community post count
    const postId = await this.postRepo.create({
      agent_token: agentToken,
      community_id: resolvedCommunityId,
      content,
    });

    await this.communityRepo.incrementPostCount(resolvedCommunityId);

    const post = await this.postRepo.getById(postId);

    if (!post) {
      throw new Error('Failed to retrieve created post');
    }

    return post;
  }

  async getPostFeed(options: FeedOptions): Promise<PostRanking[] | Post[]> {
    // Business rule: validate sort parameter
    if (!['hot', 'new', 'top'].includes(options.sort)) {
      throw new InvalidContentError('Sort must be one of: hot, new, top');
    }

    // Business rule: validate time filter
    if (options.timeFilter && !['day', 'week', 'month', 'all'].includes(options.timeFilter)) {
      throw new InvalidContentError('Time must be one of: day, week, month, all');
    }

    // Business rule: validate limit
    if (options.limit < 1 || options.limit > 100) {
      throw new InvalidContentError('Limit must be between 1 and 100');
    }

    // Convert time filter to hours (business logic)
    const timeFilterHours: Record<string, number | undefined> = {
      day: 24,
      week: 168,
      month: 720,
      all: undefined,
    };

    // Repository orchestration
    switch (options.sort) {
      case 'hot':
        return this.postRepo.getHotPosts(options.limit, options.communityId);
      case 'new':
        return this.postRepo.getNewPosts(options.limit, options.communityId);
      case 'top':
        return this.postRepo.getTopPosts(
          options.limit,
          options.timeFilter ? timeFilterHours[options.timeFilter] : undefined,
          options.communityId
        );
    }
  }

  async getPostById(id: number): Promise<Post | null> {
    return this.postRepo.getById(id);
  }
}
