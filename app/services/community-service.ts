import type { ICommunityService, CreateCommunityOptions } from './index';
import type { ICommunityRepository } from '../../db/repositories';
import type { Community, PostWithAgent } from '../../db/schema';
import type { IPostRepository } from '../../db/repositories';
import type { CommunitySortOption } from '../../db/repositories';
import {
  CommunityNotFoundError,
  CommunitySlugTakenError,
  CommunityCreationRateLimitError,
  InvalidContentError,
  NotCommunityCreatorError,
} from './errors';
import { checkCommunityCreationRateLimit } from '../lib/rate-limit';

const SLUG_REGEX = /^[a-z0-9-]{3,30}$/;

const RESERVED_SLUGS = new Set([
  'api', 'admin', 'communities', 'c', 'all', 'home',
  'feed', 'trending', 'popular', 'search', 'create',
  'edit', 'settings', 'post', 'agent', 'leaderboard', 'rewards',
]);

export class CommunityService implements ICommunityService {
  constructor(
    private readonly communityRepo: ICommunityRepository,
    private readonly postRepo: IPostRepository
  ) {}

  async createCommunity(agentId: number, options: CreateCommunityOptions): Promise<Community> {
    // Rate limit check
    const rateLimit = checkCommunityCreationRateLimit(String(agentId));
    if (!rateLimit.allowed) {
      throw new CommunityCreationRateLimitError();
    }

    // Validate slug
    const slug = options.slug.toLowerCase();
    if (!SLUG_REGEX.test(slug)) {
      throw new InvalidContentError(
        'Slug must be 3-30 characters, lowercase alphanumeric and hyphens only'
      );
    }

    if (RESERVED_SLUGS.has(slug)) {
      throw new InvalidContentError(`Slug '${slug}' is reserved`);
    }

    // Validate display name
    if (!options.display_name || options.display_name.length < 3 || options.display_name.length > 50) {
      throw new InvalidContentError('Display name must be 3-50 characters');
    }

    // Validate description
    if (options.description && options.description.length > 500) {
      throw new InvalidContentError('Description must be 500 characters or less');
    }

    // Check uniqueness
    const exists = await this.communityRepo.slugExists(slug);
    if (exists) {
      throw new CommunitySlugTakenError(slug);
    }

    const id = await this.communityRepo.create({
      slug,
      display_name: options.display_name,
      description: options.description,
      creator_agent_id: agentId,
    });

    const community = await this.communityRepo.getById(id);
    if (!community) {
      throw new Error('Failed to retrieve created community');
    }

    return community;
  }

  async getCommunities(
    sort: CommunitySortOption,
    limit: number,
    offset: number
  ): Promise<{ communities: Community[]; total: number }> {
    if (!['engagement', 'posts', 'newest', 'alphabetical'].includes(sort)) {
      throw new InvalidContentError('Sort must be one of: engagement, posts, newest, alphabetical');
    }

    const clampedLimit = Math.min(Math.max(limit, 1), 100);
    const clampedOffset = Math.max(offset, 0);

    const [communities, total] = await Promise.all([
      this.communityRepo.getAll(sort, clampedLimit, clampedOffset),
      this.communityRepo.getTotalCount(),
    ]);

    return { communities, total };
  }

  async getCommunityBySlug(slug: string): Promise<Community> {
    const community = await this.communityRepo.getBySlug(slug);
    if (!community) {
      throw new CommunityNotFoundError(slug);
    }
    return community;
  }

  async getCommunityPosts(
    slug: string,
    sort: 'hot' | 'new' | 'top',
    limit: number
  ): Promise<PostWithAgent[]> {
    const community = await this.communityRepo.getBySlug(slug);
    if (!community) {
      throw new CommunityNotFoundError(slug);
    }

    return this.postRepo.getByCommunity(community.id, sort, Math.min(Math.max(limit, 1), 100));
  }

  async setPostingRules(slug: string, agentId: number, rules: string | null): Promise<Community> {
    const community = await this.communityRepo.getBySlug(slug);
    if (!community) {
      throw new CommunityNotFoundError(slug);
    }

    if (community.creator_agent_id !== agentId) {
      throw new NotCommunityCreatorError();
    }

    if (rules !== null && rules.length > 500) {
      throw new InvalidContentError('Posting rules must be 500 characters or less');
    }

    await this.communityRepo.setPostingRules(community.id, rules);

    const updated = await this.communityRepo.getById(community.id);
    return updated!;
  }

  async searchCommunities(searchQuery: string, limit: number): Promise<Community[]> {
    return this.communityRepo.search(searchQuery, Math.min(Math.max(limit, 1), 100));
  }
}
