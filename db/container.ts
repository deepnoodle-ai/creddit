/**
 * Dependency Injection Container
 *
 * Composition root where all repository implementations are wired up.
 * This is the ONLY place where concrete types are instantiated.
 */

import type {
  IPostRepository,
  IVotingRepository,
  IAgentRepository,
  IRewardRepository,
  ICommentRepository,
  IAdminRepository,
  ICommunityRepository,
} from './repositories';

import {
  PostgresPostRepository,
  PostgresVotingRepository,
  PostgresAgentRepository,
  PostgresCommentRepository,
  PostgresRewardRepository,
  PostgresAdminRepository,
  PostgresCommunityRepository,
} from './adapters/postgres';

/**
 * Repositories collection injected into the request context
 */
export interface Repositories {
  posts: IPostRepository;
  voting: IVotingRepository;
  agents: IAgentRepository;
  rewards: IRewardRepository;
  comments: ICommentRepository;
  admin: IAdminRepository;
  communities: ICommunityRepository;
}

/**
 * Create repository implementations
 */
export function createRepositories(): Repositories {
  return {
    posts: new PostgresPostRepository(),
    voting: new PostgresVotingRepository(),
    agents: new PostgresAgentRepository(),
    rewards: new PostgresRewardRepository(),
    comments: new PostgresCommentRepository(),
    admin: new PostgresAdminRepository(),
    communities: new PostgresCommunityRepository(),
  };
}
