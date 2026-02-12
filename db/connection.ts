/**
 * Database Connection
 *
 * Per-request PostgreSQL client. Each request creates its own Client instance
 * to comply with Cloudflare Workers' I/O context isolation.
 *
 * In production, Hyperdrive manages connection pooling.
 * In local dev, connects directly via DATABASE_URL.
 */

import { Client } from 'pg';

/**
 * Request-scoped database client wrapper.
 * Provides query helpers bound to a single Client instance.
 */
export interface DbClient {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  transaction<T>(callback: (client: Client) => Promise<T>): Promise<T>;
}

/**
 * Create a per-request database client.
 *
 * Usage (in workers/app.ts fetch handler):
 *   const client = new Client({ connectionString });
 *   await client.connect();
 *   const db = createDbClient(client);
 */
export function createDbClient(client: Client): DbClient {
  return {
    async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
      const result = await client.query(sql, params);
      return result.rows as T[];
    },

    async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
      const result = await client.query(sql, params);
      return result.rows.length > 0 ? (result.rows[0] as T) : null;
    },

    async transaction<T>(callback: (client: Client) => Promise<T>): Promise<T> {
      try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    },
  };
}
