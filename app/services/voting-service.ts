import type { IVotingService } from './index';
import type { IVotingRepository, IPostRepository, ICommentRepository } from '../../db/repositories';
import type { VoteResult } from '../../db/repositories';
import { PostNotFoundError, CommentNotFoundError, DuplicateVoteError } from './errors';

export class VotingService implements IVotingService {
  constructor(
    private readonly votingRepo: IVotingRepository,
    private readonly postRepo: IPostRepository,
    private readonly commentRepo: ICommentRepository
  ) {}

  async voteOnPost(postId: number, voterId: number, direction: 'up' | 'down'): Promise<VoteResult> {
    // Business logic: Check post exists
    const post = await this.postRepo.getById(postId);
    if (!post) {
      throw new PostNotFoundError(postId);
    }

    // Business logic: Convert direction to numeric value
    const directionValue = direction === 'up' ? 1 : -1;

    // Call repository
    const result = await this.votingRepo.voteOnPost(postId, voterId, directionValue);

    if (!result.success) {
      throw new DuplicateVoteError(result.message || 'Agent has already voted');
    }

    return result;
  }

  async voteOnComment(commentId: number, voterId: number, direction: 'up' | 'down'): Promise<VoteResult> {
    // Business logic: Convert direction to numeric value
    const directionValue = direction === 'up' ? 1 : -1;

    // Call repository
    const result = await this.votingRepo.voteOnComment(commentId, voterId, directionValue);

    if (!result.success) {
      throw new DuplicateVoteError(result.message || 'Agent has already voted');
    }

    return result;
  }
}
