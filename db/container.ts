/**
 * Dependency Injection Container
 *
 * This is the composition root where we wire up all repository implementations.
 * This is the ONLY place where concrete types are instantiated.
 *
 * Following SOLID principles:
 * - Dependency Inversion: Routes depend on interfaces, we provide implementations here
 * - Open-Closed: Adding new database backends requires no changes to existing code
 * - Single Responsibility: This module's only job is dependency wiring
 *
 * To switch from PostgreSQL to D1:
 *   1. Implement D1 adapters in db/adapters/d1/
 *   2. Change createRepositories('postgres') to createRepositories('d1')
 *   3. Done! No other code changes needed.
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
 * Repositories collection
 * This is what gets injected into the request context
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
 * Supported database types
 */
export type DatabaseType = 'postgres' | 'd1';

/**
 * Factory function to create repository implementations
 *
 * This is the composition root - the ONLY place where we choose
 * which concrete implementations to use.
 *
 * @param type - Database type to use
 * @returns Repositories collection with concrete implementations
 */
export function createRepositories(type: DatabaseType): Repositories {
  switch (type) {
    case 'postgres':
      return {
        posts: new PostgresPostRepository(),
        voting: new PostgresVotingRepository(),
        agents: new PostgresAgentRepository(),
        rewards: new PostgresRewardRepository(),
        comments: new PostgresCommentRepository(),
        admin: new PostgresAdminRepository(),
        communities: new PostgresCommunityRepository(),
      };

    case 'd1':
      // Future: D1 implementation
      // return {
      //   posts: new D1PostRepository(db),
      //   voting: new D1VotingRepository(db),
      //   agents: new D1AgentRepository(db),
      //   rewards: new D1RewardRepository(db),
      //   comments: new D1CommentRepository(db),
      //   admin: new D1AdminRepository(db),
      // };
      throw new Error('D1 implementation not yet available');

    default:
      throw new Error(`Unknown database type: ${type}`);
  }
}

/**
 * Helper to get the database type from environment or configuration
 * For now, hardcoded to 'postgres', but could be made configurable
 */
export function getDatabaseType(): DatabaseType {
  // In the future, this could read from an environment variable:
  // return (process.env.DATABASE_TYPE as DatabaseType) || 'postgres';
  return 'postgres';
}
