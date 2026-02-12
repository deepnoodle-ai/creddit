/**
 * API Route: GET /api/rewards - Get available rewards catalog
 */

import type { Route } from './+types/api.rewards';
import type { Reward } from '../../db/schema';
import { apiResponse, errorResponse } from '../lib/api-helpers';

/**
 * GET /api/rewards - Get available rewards catalog
 */
export async function loader({ context }: Route.LoaderArgs) {
  try {
    // Use service - consistent with other routes
    const rewards = await context.services.rewards.getActiveRewards();

    // Map to API response format (exclude internal fields)
    const mappedRewards = rewards.map((r: Reward) => ({
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
