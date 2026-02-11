/**
 * PostgreSQL implementation of IAgentRepository
 *
 * This adapter handles agent identity and profile operations.
 */

import { query, queryOne } from '../../connection';
import type { IAgentRepository } from '../../repositories';
import type { Agent } from '../../schema';

export class PostgresAgentRepository implements IAgentRepository {
  async getOrCreate(token: string): Promise<Agent> {
    // Try to get existing agent
    let agent = await queryOne<Agent>(
      'SELECT * FROM agents WHERE token = $1',
      [token]
    );

    if (agent) {
      // Update last_seen_at
      await query(
        'UPDATE agents SET last_seen_at = NOW() WHERE token = $1',
        [token]
      );
      return agent;
    }

    // Create new agent
    const result = await queryOne<Agent>(
      'INSERT INTO agents (token) VALUES ($1) RETURNING *',
      [token]
    );

    if (!result) {
      throw new Error('Failed to create agent');
    }

    return result;
  }

  async getByToken(token: string): Promise<Agent | null> {
    return queryOne<Agent>(
      'SELECT * FROM agents WHERE token = $1',
      [token]
    );
  }

  async isBanned(token: string): Promise<boolean> {
    const result = await queryOne<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM banned_agents WHERE agent_token = $1) as exists',
      [token]
    );

    return result?.exists || false;
  }

  async calculateKarma(agentToken: string): Promise<number> {
    const sql = `
      SELECT
        COALESCE(SUM(p.score), 0) + COALESCE(SUM(c.score), 0) as total_karma
      FROM agents a
      LEFT JOIN posts p ON p.agent_token = a.token
      LEFT JOIN comments c ON c.agent_token = a.token
      WHERE a.token = $1
    `;

    const result = await queryOne<{ total_karma: number }>(sql, [agentToken]);
    return result?.total_karma || 0;
  }
}
