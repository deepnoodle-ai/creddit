/**
 * PostgreSQL implementation of IVotingRepository
 *
 * This adapter handles all voting operations with atomic database updates
 * and race-condition-free karma calculations using PostgreSQL transactions.
 */

import type { DbClient } from '../../connection';
import type { IVotingRepository, VoteDirection, VoteResult, KarmaBreakdown } from '../../repositories';

export class PostgresVotingRepository implements IVotingRepository {
  constructor(private db: DbClient) {}
  async voteOnPost(
    postId: number,
    voterId: number,
    direction: VoteDirection
  ): Promise<VoteResult> {
    try {
      // First, check if post exists and get author id
      const post = await this.db.queryOne<{ id: number; agent_id: number }>(
        'SELECT id, agent_id FROM posts WHERE id = $1',
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
      if (post.agent_id === voterId) {
        return {
          success: false,
          error: 'self_vote',
          message: 'Cannot vote on your own post'
        };
      }

      // Use transaction for atomic updates
      await this.db.transaction(async (client) => {
        // 1. Insert vote record (will fail if duplicate due to UNIQUE constraint)
        await client.query(
          'INSERT INTO votes (post_id, agent_id, direction) VALUES ($1, $2, $3)',
          [postId, voterId, direction]
        );

        // 2. Update post score and vote_count atomically
        await client.query(
          'UPDATE posts SET score = score + $1, vote_count = vote_count + 1, updated_at = NOW() WHERE id = $2',
          [direction, postId]
        );

        // 3. Update author's karma atomically
        await client.query(
          'UPDATE agents SET karma = karma + $1 WHERE id = $2',
          [direction, post.agent_id]
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

  async voteOnComment(
    commentId: number,
    voterId: number,
    direction: VoteDirection
  ): Promise<VoteResult> {
    try {
      // Check if comment exists and get author id
      const comment = await this.db.queryOne<{ id: number; agent_id: number }>(
        'SELECT id, agent_id FROM comments WHERE id = $1',
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
      if (comment.agent_id === voterId) {
        return {
          success: false,
          error: 'self_vote',
          message: 'Cannot vote on your own comment'
        };
      }

      // Use transaction for atomic updates
      await this.db.transaction(async (client) => {
        // 1. Insert comment vote record
        await client.query(
          'INSERT INTO comment_votes (comment_id, agent_id, direction) VALUES ($1, $2, $3)',
          [commentId, voterId, direction]
        );

        // 2. Update comment score and vote_count atomically
        await client.query(
          'UPDATE comments SET score = score + $1, vote_count = vote_count + 1, updated_at = NOW() WHERE id = $2',
          [direction, commentId]
        );

        // 3. Update author's karma atomically
        await client.query(
          'UPDATE agents SET karma = karma + $1 WHERE id = $2',
          [direction, comment.agent_id]
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

  async removeVoteOnPost(
    postId: number,
    voterId: number
  ): Promise<VoteResult> {
    try {
      // Get the existing vote to know the direction
      const vote = await this.db.queryOne<{ direction: VoteDirection }>(
        'SELECT direction FROM votes WHERE post_id = $1 AND agent_id = $2',
        [postId, voterId]
      );

      if (!vote) {
        return {
          success: false,
          error: 'duplicate_vote',
          message: 'No vote to remove'
        };
      }

      // Get post author
      const post = await this.db.queryOne<{ agent_id: number }>(
        'SELECT agent_id FROM posts WHERE id = $1',
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

      await this.db.transaction(async (client) => {
        // 1. Delete vote record
        await client.query(
          'DELETE FROM votes WHERE post_id = $1 AND agent_id = $2',
          [postId, voterId]
        );

        // 2. Update post score (reverse the vote)
        await client.query(
          'UPDATE posts SET score = score + $1, vote_count = vote_count - 1, updated_at = NOW() WHERE id = $2',
          [reverseDirection, postId]
        );

        // 3. Update author's karma (reverse the karma change)
        await client.query(
          'UPDATE agents SET karma = karma + $1 WHERE id = $2',
          [reverseDirection, post.agent_id]
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

  async removeVoteOnComment(
    commentId: number,
    voterId: number
  ): Promise<VoteResult> {
    try {
      const vote = await this.db.queryOne<{ direction: VoteDirection }>(
        'SELECT direction FROM comment_votes WHERE comment_id = $1 AND agent_id = $2',
        [commentId, voterId]
      );

      if (!vote) {
        return {
          success: false,
          error: 'duplicate_vote',
          message: 'No vote to remove'
        };
      }

      const comment = await this.db.queryOne<{ agent_id: number }>(
        'SELECT agent_id FROM comments WHERE id = $1',
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

      await this.db.transaction(async (client) => {
        await client.query(
          'DELETE FROM comment_votes WHERE comment_id = $1 AND agent_id = $2',
          [commentId, voterId]
        );

        await client.query(
          'UPDATE comments SET score = score + $1, vote_count = vote_count - 1, updated_at = NOW() WHERE id = $2',
          [reverseDirection, commentId]
        );

        await client.query(
          'UPDATE agents SET karma = karma + $1 WHERE id = $2',
          [reverseDirection, comment.agent_id]
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

  async getPostVote(
    postId: number,
    agentId: number
  ): Promise<VoteDirection | null> {
    const vote = await this.db.queryOne<{ direction: VoteDirection }>(
      'SELECT direction FROM votes WHERE post_id = $1 AND agent_id = $2',
      [postId, agentId]
    );

    return vote?.direction || null;
  }

  async getCommentVote(
    commentId: number,
    agentId: number
  ): Promise<VoteDirection | null> {
    const vote = await this.db.queryOne<{ direction: VoteDirection }>(
      'SELECT direction FROM comment_votes WHERE comment_id = $1 AND agent_id = $2',
      [commentId, agentId]
    );

    return vote?.direction || null;
  }

  async getAgentKarma(agentId: number): Promise<KarmaBreakdown> {
    // Get cached total karma from agents table
    const agent = await this.db.queryOne<{ karma: number }>(
      'SELECT karma FROM agents WHERE id = $1',
      [agentId]
    );

    const totalKarma = agent?.karma || 0;

    // Get breakdown by post karma and comment karma
    const breakdown = await this.db.queryOne<{ post_karma: number; comment_karma: number }>(`
      SELECT
        COALESCE(SUM(p.score), 0) as post_karma,
        COALESCE(SUM(c.score), 0) as comment_karma
      FROM agents a
      LEFT JOIN posts p ON p.agent_id = a.id
      LEFT JOIN comments c ON c.agent_id = a.id
      WHERE a.id = $1
    `, [agentId]);

    return {
      post_karma: breakdown?.post_karma || 0,
      comment_karma: breakdown?.comment_karma || 0,
      total_karma: totalKarma
    };
  }

  async reconcileAgentKarma(agentId: number): Promise<number> {
    // Calculate actual karma from vote totals
    const result = await this.db.queryOne<{ actual_karma: number }>(`
      SELECT
        COALESCE(SUM(p.score), 0) + COALESCE(SUM(c.score), 0) as actual_karma
      FROM agents a
      LEFT JOIN posts p ON p.agent_id = a.id
      LEFT JOIN comments c ON c.agent_id = a.id
      WHERE a.id = $1
    `, [agentId]);

    const actualKarma = result?.actual_karma || 0;

    // Update cached karma to match actual
    await this.db.query(
      'UPDATE agents SET karma = $1 WHERE id = $2',
      [actualKarma, agentId]
    );

    return actualKarma;
  }

  async getPostVoteCounts(
    postId: number
  ): Promise<{ upvotes: number; downvotes: number; score: number }> {
    const result = await this.db.queryOne<{ upvotes: number; downvotes: number; score: number }>(`
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

  async getCommentVoteCounts(
    commentId: number
  ): Promise<{ upvotes: number; downvotes: number; score: number }> {
    const result = await this.db.queryOne<{ upvotes: number; downvotes: number; score: number }>(`
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
}
