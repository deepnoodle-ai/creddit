/**
 * Database Connection
 *
 * Per-request PostgreSQL client. In production, Hyperdrive manages connection
 * pooling. In local dev, connects directly via DATABASE_URL.
 */

import { Client } from 'pg';

let currentClient: Client | null = null;

/**
 * Initialize a new database client for the current request.
 * Falls back to process.env.DATABASE_URL if no connection string is provided.
 */
export async function initClient(connectionString?: string): Promise<void> {
  const connStr = connectionString || process.env.DATABASE_URL;

  if (!connStr) {
    throw new Error(
      'No database connection string available. ' +
      'Either provide connectionString parameter or set DATABASE_URL environment variable.'
    );
  }

  currentClient = new Client({ connectionString: connStr });
  await currentClient.connect();
}

/**
 * Get the current request's database client.
 * Throws if initClient hasn't been called for this request.
 */
function getClient(): Client {
  if (!currentClient) {
    throw new Error('Database client not initialized. Call initClient() first.');
  }
  return currentClient;
}

/**
 * Close the current database client.
 * Called at the end of request processing.
 */
export async function closeClient(): Promise<void> {
  if (currentClient) {
    try {
      await currentClient.end();
    } catch {
      // Ignore close errors
    }
    currentClient = null;
  }
}

/**
 * Execute a single query
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const client = getClient();
  const result = await client.query(sql, params);
  return result.rows as T[];
}

/**
 * Execute a query and return the first result
 */
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const results = await query<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction<T>(
  callback: (client: Client) => Promise<T>
): Promise<T> {
  const client = getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

/**
 * Prepared statement helper
 * PostgreSQL uses $1, $2, etc. for parameters
 */
export async function prepared<T = any>(sql: string, ...params: any[]): Promise<T[]> {
  return query<T>(sql, params);
}

/**
 * Batch execute multiple queries (not in a transaction)
 */
export async function batch(
  queries: Array<{ sql: string; params?: any[] }>
): Promise<any[]> {
  const client = getClient();
  return Promise.all(queries.map(q => client.query(q.sql, q.params)));
}

/**
 * Health check - verify database connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await queryOne<{ now: Date }>('SELECT NOW() as now');
    return result !== null;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Database client interface
 */
export interface DatabaseClient {
  query: typeof query;
  queryOne: typeof queryOne;
  transaction: typeof transaction;
  batch: typeof batch;
  prepared: typeof prepared;
  healthCheck: typeof healthCheck;
}

/**
 * Get database client
 */
export function getDatabase(): DatabaseClient {
  return {
    query,
    queryOne,
    transaction,
    batch,
    prepared,
    healthCheck,
  };
}

export type DB = DatabaseClient;
