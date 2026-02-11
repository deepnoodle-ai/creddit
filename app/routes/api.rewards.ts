/**
 * API Route: GET /api/rewards - Get available rewards catalog
 */

import type { Route } from './+types/api.rewards';
import { getActiveRewards } from '../../db/index-postgres';
import { apiResponse, errorResponse } from '../lib/api-helpers';

/**
 * GET /api/rewards - Get available rewards catalog
 */
export async function loader({}: Route.LoaderArgs) {
  try {
    // Fetch active rewards
    const rewards = await getActiveRewards();

    // Map to API response format (exclude internal fields)
    const mappedRewards = rewards.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      credit_cost: r.credit_cost,
      reward_type: r.reward_type,
    }));

    return apiResponse({
      success: true,
      rewards: mappedRewards,
    });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred',
      null,
      500
    );
  }
}
