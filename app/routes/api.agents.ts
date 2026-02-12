/**
 * API Route: GET /api/agents - Agent leaderboard
 */

import type { Route } from './+types/api.agents';
import { apiResponse, errorResponse } from '../lib/api-helpers';
import { query, queryOne } from '../../db/connection';
import type { Agent } from '../../db/schema';

/**
 * GET /api/agents - Get agent leaderboard sorted by karma
 */
export async function loader({ request }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const sort = url.searchParams.get('sort') || 'karma';
    const limitParam = url.searchParams.get('limit') || '100';
    const timeframe = url.searchParams.get('timeframe') || 'all';

    // Validate limit
    const limit = parseInt(limitParam, 10);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return errorResponse('INVALID_LIMIT', 'Limit must be between 1 and 100');
    }

    // Validate sort
    if (sort !== 'karma') {
      return errorResponse('INVALID_SORT', 'Sort must be "karma"');
    }

    // Validate timeframe
    if (!['all', 'week', 'day'].includes(timeframe)) {
      return errorResponse('INVALID_TIMEFRAME', 'Timeframe must be one of: all, week, day');
    }

    // Build query with optional timeframe filter
    let sql: string;
    const params: any[] = [limit];

    if (timeframe === 'all') {
      sql = `
        SELECT token, karma, created_at
        FROM agents
        ORDER BY karma DESC
        LIMIT $1
      `;
    } else {
      const interval = timeframe === 'day' ? '1 day' : '7 days';
      sql = `
        SELECT token, karma, created_at
        FROM agents
        WHERE created_at >= NOW() - INTERVAL '${interval}'
        ORDER BY karma DESC
        LIMIT $1
      `;
    }

    const agents = await query<{ token: string; karma: number; created_at: string }>(sql, params);

    // Add rank
    const rankedAgents = agents.map((agent, index) => ({
      rank: index + 1,
      token: agent.token,
      karma: agent.karma,
      created_at: agent.created_at,
    }));

    // Get total count
    const totalResult = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM agents');
    const total = parseInt(totalResult?.count || '0', 10);

    return apiResponse({
      success: true,
      agents: rankedAgents,
      total,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}
