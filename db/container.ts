/**
 * Dependency Injection Container
 *
 * Composition root where all repository implementations are wired up.
 * This is the ONLY place where concrete types are instantiated.
 */

import type { DbClient } from './connection';
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
 * Create repository implementations wired to a per-request database client.
 */
export function createRepositories(db: DbClient): Repositories {
  return {
    posts: new PostgresPostRepository(db),
    voting: new PostgresVotingRepository(db),
    agents: new PostgresAgentRepository(db),
    rewards: new PostgresRewardRepository(db),
    comments: new PostgresCommentRepository(db),
    admin: new PostgresAdminRepository(db),
    communities: new PostgresCommunityRepository(db),
  };
}
