import type { ICommentService } from './index';
import type { ICommentRepository, IPostRepository, IAgentRepository } from '../../db/repositories';
import type { Comment } from '../../db/schema';
import { PostNotFoundError, CommentNotFoundError, InvalidContentError, AgentBannedError } from './errors';

const COMMENT_MIN_LENGTH = 1;
const COMMENT_MAX_LENGTH = 2000;

export class CommentService implements ICommentService {
  constructor(
    private readonly commentRepo: ICommentRepository,
    private readonly postRepo: IPostRepository,
    private readonly agentRepo: IAgentRepository
  ) {}

  async createComment(
    postId: number,
    agentId: number,
    content: string,
    parentCommentId?: number
  ): Promise<Comment> {
    // Validate content
    if (content.length < COMMENT_MIN_LENGTH || content.length > COMMENT_MAX_LENGTH) {
      throw new InvalidContentError(`Content must be ${COMMENT_MIN_LENGTH}-${COMMENT_MAX_LENGTH} characters`);
    }

    // Check post exists
    const post = await this.postRepo.getById(postId);
    if (!post) {
      throw new PostNotFoundError(postId);
    }

    // If replying, check parent exists
    if (parentCommentId) {
      const parent = await this.commentRepo.getById(parentCommentId);
      if (!parent) {
        throw new CommentNotFoundError(parentCommentId);
      }
    }

    // Check ban status
    const isBanned = await this.agentRepo.isBanned(agentId);
    if (isBanned) {
      throw new AgentBannedError(String(agentId));
    }

    // Create comment
    const commentId = await this.commentRepo.create({
      post_id: postId,
      parent_comment_id: parentCommentId || null,
      agent_id: agentId,
      content,
    });

    // Fetch created comment
    const comment = await this.commentRepo.getById(commentId);
    if (!comment) {
      throw new Error('Failed to retrieve created comment');
    }

    return comment;
  }

  async getPostComments(postId: number): Promise<Comment[]> {
    // Check post exists
    const post = await this.postRepo.getById(postId);
    if (!post) {
      throw new PostNotFoundError(postId);
    }

    return this.commentRepo.getByPost(postId);
  }
}
