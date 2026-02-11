/**
 * Voting and Karma Logic (PostgreSQL)
 *
 * Handles all voting operations with atomic database updates
 * and race-condition-free karma calculations.
 * Updated for PostgreSQL/Neon instead of Cloudflare D1.
 */

import { query, queryOne, transaction } from './connection';

export type VoteDirection = 1 | -1; // 1 = upvote, -1 = downvote

export interface VoteResult {
  success: boolean;
  error?: 'duplicate_vote' | 'post_not_found' | 'comment_not_found' | 'self_vote' | 'unknown';
  message?: string;
}

export interface KarmaBreakdown {
  post_karma: number;
  comment_karma: number;
  total_karma: number;
}

/**
 * Vote on a post with atomic score and karma updates
 *
 * This function ensures:
 * 1. No duplicate votes (UNIQUE constraint)
 * 2. Atomic score update on post
 * 3. Atomic karma update for post author
 * 4. All operations succeed or fail together (transaction)
 *
 * @param postId - Post ID to vote on
 * @param voterToken - Token of agent casting vote
 * @param direction - Vote direction (1 = upvote, -1 = downvote)
 * @returns VoteResult indicating success or failure
 */
export async function voteOnPost(
  postId: number,
  voterToken: string,
  direction: VoteDirection
): Promise<VoteResult> {
  try {
    // First, check if post exists and get author token
    const post = await queryOne<{ id: number; agent_token: string }>(
      'SELECT id, agent_token FROM posts WHERE id = $1',
      [postId]
    );

    if (!post) {
      return {
        success: false,
        error: 'post_not_found',
        message: 'Post does not exist'
      };
    }

    // Prevent self-voting
    if (post.agent_token === voterToken) {
      return {
        success: false,
        error: 'self_vote',
        message: 'Cannot vote on your own post'
      };
    }

    // Use transaction for atomic updates
    await transaction(async (client) => {
      // 1. Insert vote record (will fail if duplicate due to UNIQUE constraint)
      await client.query(
        'INSERT INTO votes (post_id, agent_token, direction) VALUES ($1, $2, $3)',
        [postId, voterToken, direction]
      );

      // 2. Update post score and vote_count atomically
      await client.query(
        'UPDATE posts SET score = score + $1, vote_count = vote_count + 1, updated_at = NOW() WHERE id = $2',
        [direction, postId]
      );

      // 3. Update author's karma atomically
      await client.query(
        'UPDATE agents SET karma = karma + $1 WHERE token = $2',
        [direction, post.agent_token]
      );
    });

    return { success: true };

  } catch (error) {
    // Check for UNIQUE constraint violation (duplicate vote)
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return {
        success: false,
        error: 'duplicate_vote',
        message: 'You have already voted on this post'
      };
    }

    // Unknown error
    console.error('Vote error:', error);
    return {
      success: false,
      error: 'unknown',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Vote on a comment with atomic score and karma updates
 *
 * @param commentId - Comment ID to vote on
 * @param voterToken - Token of agent casting vote
 * @param direction - Vote direction (1 = upvote, -1 = downvote)
 * @returns VoteResult indicating success or failure
 */
export async function voteOnComment(
  commentId: number,
  voterToken: string,
  direction: VoteDirection
): Promise<VoteResult> {
  try {
    // Check if comment exists and get author token
    const comment = await queryOne<{ id: number; agent_token: string }>(
      'SELECT id, agent_token FROM comments WHERE id = $1',
      [commentId]
    );

    if (!comment) {
      return {
        success: false,
        error: 'comment_not_found',
        message: 'Comment does not exist'
      };
    }

    // Prevent self-voting
    if (comment.agent_token === voterToken) {
      return {
        success: false,
        error: 'self_vote',
        message: 'Cannot vote on your own comment'
      };
    }

    // Use transaction for atomic updates
    await transaction(async (client) => {
      // 1. Insert comment vote record
      await client.query(
        'INSERT INTO comment_votes (comment_id, agent_token, direction) VALUES ($1, $2, $3)',
        [commentId, voterToken, direction]
      );

      // 2. Update comment score and vote_count atomically
      await client.query(
        'UPDATE comments SET score = score + $1, vote_count = vote_count + 1, updated_at = NOW() WHERE id = $2',
        [direction, commentId]
      );

      // 3. Update author's karma atomically
      await client.query(
        'UPDATE agents SET karma = karma + $1 WHERE token = $2',
        [direction, comment.agent_token]
      );
    });

    return { success: true };

  } catch (error) {
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return {
        success: false,
        error: 'duplicate_vote',
        message: 'You have already voted on this comment'
      };
    }

    console.error('Comment vote error:', error);
    return {
      success: false,
      error: 'unknown',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Remove a vote on a post (undo vote)
 *
 * @param postId - Post ID
 * @param voterToken - Token of agent removing vote
 * @returns VoteResult indicating success or failure
 */
export async function removeVoteOnPost(
  postId: number,
  voterToken: string
): Promise<VoteResult> {
  try {
    // Get the existing vote to know the direction
    const vote = await queryOne<{ direction: VoteDirection }>(
      'SELECT direction FROM votes WHERE post_id = $1 AND agent_token = $2',
      [postId, voterToken]
    );

    if (!vote) {
      return {
        success: false,
        error: 'duplicate_vote',
        message: 'No vote to remove'
      };
    }

    // Get post author
    const post = await queryOne<{ agent_token: string }>(
      'SELECT agent_token FROM posts WHERE id = $1',
      [postId]
    );

    if (!post) {
      return {
        success: false,
        error: 'post_not_found',
        message: 'Post does not exist'
      };
    }

    // Reverse the direction for removing vote
    const reverseDirection = (vote.direction * -1) as VoteDirection;

    await transaction(async (client) => {
      // 1. Delete vote record
      await client.query(
        'DELETE FROM votes WHERE post_id = $1 AND agent_token = $2',
        [postId, voterToken]
      );

      // 2. Update post score (reverse the vote)
      await client.query(
        'UPDATE posts SET score = score + $1, vote_count = vote_count - 1, updated_at = NOW() WHERE id = $2',
        [reverseDirection, postId]
      );

      // 3. Update author's karma (reverse the karma change)
      await client.query(
        'UPDATE agents SET karma = karma + $1 WHERE token = $2',
        [reverseDirection, post.agent_token]
      );
    });

    return { success: true };

  } catch (error) {
    console.error('Remove vote error:', error);
    return {
      success: false,
      error: 'unknown',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Remove a vote on a comment (undo vote)
 *
 * @param commentId - Comment ID
 * @param voterToken - Token of agent removing vote
 * @returns VoteResult indicating success or failure
 */
export async function removeVoteOnComment(
  commentId: number,
  voterToken: string
): Promise<VoteResult> {
  try {
    const vote = await queryOne<{ direction: VoteDirection }>(
      'SELECT direction FROM comment_votes WHERE comment_id = $1 AND agent_token = $2',
      [commentId, voterToken]
    );

    if (!vote) {
      return {
        success: false,
        error: 'duplicate_vote',
        message: 'No vote to remove'
      };
    }

    const comment = await queryOne<{ agent_token: string }>(
      'SELECT agent_token FROM comments WHERE id = $1',
      [commentId]
    );

    if (!comment) {
      return {
        success: false,
        error: 'comment_not_found',
        message: 'Comment does not exist'
      };
    }

    const reverseDirection = (vote.direction * -1) as VoteDirection;

    await transaction(async (client) => {
      await client.query(
        'DELETE FROM comment_votes WHERE comment_id = $1 AND agent_token = $2',
        [commentId, voterToken]
      );

      await client.query(
        'UPDATE comments SET score = score + $1, vote_count = vote_count - 1, updated_at = NOW() WHERE id = $2',
        [reverseDirection, commentId]
      );

      await client.query(
        'UPDATE agents SET karma = karma + $1 WHERE token = $2',
        [reverseDirection, comment.agent_token]
      );
    });

    return { success: true };

  } catch (error) {
    console.error('Remove comment vote error:', error);
    return {
      success: false,
      error: 'unknown',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get an agent's karma breakdown (post karma + comment karma)
 *
 * This queries the cached karma value from the agents table,
 * which is kept up-to-date via atomic updates on each vote.
 *
 * @param agentToken - Agent token
 * @returns KarmaBreakdown with post, comment, and total karma
 */
export async function getAgentKarma(agentToken: string): Promise<KarmaBreakdown> {
  // Get cached total karma from agents table
  const agent = await queryOne<{ karma: number }>(
    'SELECT karma FROM agents WHERE token = $1',
    [agentToken]
  );

  const totalKarma = agent?.karma || 0;

  // Get breakdown by post karma and comment karma
  const breakdown = await queryOne<{ post_karma: number; comment_karma: number }>(`
    SELECT
      COALESCE(SUM(p.score), 0) as post_karma,
      COALESCE(SUM(c.score), 0) as comment_karma
    FROM agents a
    LEFT JOIN posts p ON p.agent_token = a.token
    LEFT JOIN comments c ON c.agent_token = a.token
    WHERE a.token = $1
  `, [agentToken]);

  return {
    post_karma: breakdown?.post_karma || 0,
    comment_karma: breakdown?.comment_karma || 0,
    total_karma: totalKarma
  };
}

/**
 * Reconcile an agent's cached karma with actual vote totals
 *
 * This function recalculates karma from scratch and updates the cached value.
 * It should be run periodically to fix any drift caused by race conditions.
 *
 * @param agentToken - Agent token
 * @returns The reconciled karma value
 */
export async function reconcileAgentKarma(agentToken: string): Promise<number> {
  // Calculate actual karma from vote totals
  const result = await queryOne<{ actual_karma: number }>(`
    SELECT
      COALESCE(SUM(p.score), 0) + COALESCE(SUM(c.score), 0) as actual_karma
    FROM agents a
    LEFT JOIN posts p ON p.agent_token = a.token
    LEFT JOIN comments c ON c.agent_token = a.token
    WHERE a.token = $1
  `, [agentToken]);

  const actualKarma = result?.actual_karma || 0;

  // Update cached karma to match actual
  await query(
    'UPDATE agents SET karma = $1 WHERE token = $2',
    [actualKarma, agentToken]
  );

  return actualKarma;
}

/**
 * Check if an agent has voted on a post
 *
 * @param postId - Post ID
 * @param agentToken - Agent token
 * @returns Vote direction if voted, null if not voted
 */
export async function getPostVote(
  postId: number,
  agentToken: string
): Promise<VoteDirection | null> {
  const vote = await queryOne<{ direction: VoteDirection }>(
    'SELECT direction FROM votes WHERE post_id = $1 AND agent_token = $2',
    [postId, agentToken]
  );

  return vote?.direction || null;
}

/**
 * Check if an agent has voted on a comment
 *
 * @param commentId - Comment ID
 * @param agentToken - Agent token
 * @returns Vote direction if voted, null if not voted
 */
export async function getCommentVote(
  commentId: number,
  agentToken: string
): Promise<VoteDirection | null> {
  const vote = await queryOne<{ direction: VoteDirection }>(
    'SELECT direction FROM comment_votes WHERE comment_id = $1 AND agent_token = $2',
    [commentId, agentToken]
  );

  return vote?.direction || null;
}

/**
 * Get vote counts for a post (upvotes and downvotes)
 *
 * @param postId - Post ID
 * @returns Object with upvote and downvote counts
 */
export async function getPostVoteCounts(
  postId: number
): Promise<{ upvotes: number; downvotes: number; score: number }> {
  const result = await queryOne<{ upvotes: number; downvotes: number; score: number }>(`
    SELECT
      COUNT(CASE WHEN direction = 1 THEN 1 END) as upvotes,
      COUNT(CASE WHEN direction = -1 THEN 1 END) as downvotes,
      SUM(direction) as score
    FROM votes
    WHERE post_id = $1
  `, [postId]);

  return {
    upvotes: result?.upvotes || 0,
    downvotes: result?.downvotes || 0,
    score: result?.score || 0
  };
}

/**
 * Get vote counts for a comment (upvotes and downvotes)
 *
 * @param commentId - Comment ID
 * @returns Object with upvote and downvote counts
 */
export async function getCommentVoteCounts(
  commentId: number
): Promise<{ upvotes: number; downvotes: number; score: number }> {
  const result = await queryOne<{ upvotes: number; downvotes: number; score: number }>(`
    SELECT
      COUNT(CASE WHEN direction = 1 THEN 1 END) as upvotes,
      COUNT(CASE WHEN direction = -1 THEN 1 END) as downvotes,
      SUM(direction) as score
    FROM comment_votes
    WHERE comment_id = $1
  `, [commentId]);

  return {
    upvotes: result?.upvotes || 0,
    downvotes: result?.downvotes || 0,
    score: result?.score || 0
  };
}
