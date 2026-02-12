/**
 * PostgreSQL implementation of IAgentRepository
 *
 * This adapter handles agent identity and profile operations.
 */

import { query, queryOne } from '../../connection';
import type { IAgentRepository } from '../../repositories';
import type { Agent, ApiKey } from '../../schema';

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

  async registerAgent(username: string, apiKeyHash: string, apiKeyPrefix: string): Promise<{ agentId: number; username: string }> {
    // Use a transaction to atomically create agent and API key
    const sql = `
      WITH new_agent AS (
        INSERT INTO agents (token, username)
        VALUES (gen_random_uuid()::text, $1)
        RETURNING id, username
      ),
      new_key AS (
        INSERT INTO api_keys (agent_id, key_hash, prefix)
        SELECT id, $2, $3 FROM new_agent
        RETURNING id
      )
      SELECT id as agent_id, username FROM new_agent
    `;

    const result = await queryOne<{ agent_id: number; username: string }>(
      sql,
      [username, apiKeyHash, apiKeyPrefix]
    );

    if (!result) {
      throw new Error('Failed to register agent');
    }

    return { agentId: result.agent_id, username: result.username };
  }

  async createApiKey(agentId: number, keyHash: string, keyPrefix: string): Promise<{ keyId: number }> {
    // Atomic insert: only insert if the agent has fewer than 10 active keys
    const result = await queryOne<{ id: number }>(
      `INSERT INTO api_keys (agent_id, key_hash, prefix)
       SELECT $1, $2, $3
       WHERE (SELECT COUNT(*) FROM api_keys WHERE agent_id = $1 AND revoked_at IS NULL) < 10
       RETURNING id`,
      [agentId, keyHash, keyPrefix]
    );

    if (!result) {
      throw new Error('Maximum of 10 active API keys per agent');
    }

    return { keyId: result.id };
  }

  async listApiKeys(agentId: number): Promise<ApiKey[]> {
    return query<ApiKey>(
      'SELECT * FROM api_keys WHERE agent_id = $1 ORDER BY created_at DESC',
      [agentId]
    );
  }

  async revokeApiKey(agentId: number, keyId: number, currentKeyHash: string): Promise<void> {
    // Get the key to revoke
    const keyToRevoke = await queryOne<ApiKey>(
      'SELECT * FROM api_keys WHERE id = $1 AND agent_id = $2',
      [keyId, agentId]
    );

    if (!keyToRevoke) {
      throw new Error('API key not found');
    }

    if (keyToRevoke.revoked_at) {
      throw new Error('API key already revoked');
    }

    // Prevent revoking the current key (self-revocation)
    if (keyToRevoke.key_hash === currentKeyHash) {
      throw new Error('Cannot revoke the current API key');
    }

    // Atomic conditional revoke: only revoke if agent has more than 1 active key
    const revokeResult = await queryOne<{ id: number }>(
      `UPDATE api_keys SET revoked_at = NOW()
       WHERE id = $1
         AND revoked_at IS NULL
         AND (SELECT COUNT(*) FROM api_keys WHERE agent_id = $2 AND revoked_at IS NULL) > 1
       RETURNING id`,
      [keyId, agentId]
    );

    if (!revokeResult) {
      throw new Error('Cannot revoke last active API key');
    }
  }

  async authenticateApiKey(keyHash: string): Promise<{ agent: Agent; keyId: number } | null> {
    // Join api_keys and agents, check key is not revoked
    const sql = `
      SELECT
        a.id, a.token, a.username, a.karma, a.credits,
        a.created_at, a.last_seen_at,
        k.id as key_id
      FROM api_keys k
      JOIN agents a ON a.id = k.agent_id
      WHERE k.key_hash = $1 AND k.revoked_at IS NULL
    `;

    const result = await queryOne<Agent & { key_id: number }>(sql, [keyHash]);

    if (!result) {
      return null;
    }

    // Update last_used_at asynchronously (fire and forget)
    query(
      'UPDATE api_keys SET last_used_at = NOW() WHERE id = $1',
      [result.key_id]
    ).catch((err) => {
      console.error('Failed to update last_used_at:', err);
    });

    // Extract agent data
    const { key_id, ...agent } = result;

    return { agent, keyId: key_id };
  }

  async getAgentByUsername(username: string): Promise<Agent | null> {
    return queryOne<Agent>(
      'SELECT * FROM agents WHERE LOWER(username) = LOWER($1)',
      [username]
    );
  }

  async getAgentById(agentId: number): Promise<Agent | null> {
    return queryOne<Agent>(
      'SELECT * FROM agents WHERE id = $1',
      [agentId]
    );
  }
}
