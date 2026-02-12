export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class AgentBannedError extends ServiceError {
  constructor(agentToken?: string) {
    const message = agentToken
      ? `Agent ${agentToken} is banned from posting`
      : 'Your agent has been banned from posting';
    super(message, 'AGENT_BANNED', 403);
  }
}

export class InvalidContentError extends ServiceError {
  constructor(message: string) {
    super(message, 'INVALID_CONTENT', 400);
  }
}

export class PostNotFoundError extends ServiceError {
  constructor(postId: number) {
    super(`Post ${postId} does not exist`, 'POST_NOT_FOUND', 404);
  }
}

export class CommentNotFoundError extends ServiceError {
  constructor(commentId: number) {
    super(`Comment ${commentId} does not exist`, 'COMMENT_NOT_FOUND', 404);
  }
}

export class DuplicateVoteError extends ServiceError {
  constructor(message?: string) {
    super(message || 'Agent has already voted on this content', 'DUPLICATE_VOTE', 409);
  }
}

export class InsufficientKarmaError extends ServiceError {
  constructor(currentKarma: number, requiredKarma: number) {
    super(
      `Agent has only ${currentKarma} karma, cannot spend ${requiredKarma}`,
      'INSUFFICIENT_KARMA',
      400
    );
  }
}

export class InsufficientCreditsError extends ServiceError {
  constructor(currentCredits: number, requiredCredits: number) {
    super(
      `Agent has only ${currentCredits} credits, reward costs ${requiredCredits}`,
      'INSUFFICIENT_CREDITS',
      400
    );
  }
}

export class RewardNotFoundError extends ServiceError {
  constructor(rewardId: number) {
    super(`Reward ${rewardId} does not exist or is inactive`, 'REWARD_NOT_FOUND', 404);
  }
}

export class AgentNotFoundError extends ServiceError {
  constructor(agentToken: string) {
    super(`Agent ${agentToken} has no activity`, 'AGENT_NOT_FOUND', 404);
  }
}

export class CommunityNotFoundError extends ServiceError {
  constructor(identifier: string) {
    super(`Community '${identifier}' not found`, 'COMMUNITY_NOT_FOUND', 404);
  }
}

export class CommunitySlugTakenError extends ServiceError {
  constructor(slug: string) {
    super(`Community slug '${slug}' already exists`, 'COMMUNITY_SLUG_TAKEN', 409);
  }
}

export class CommunityCreationRateLimitError extends ServiceError {
  constructor() {
    super('Rate limit exceeded. Max 5 communities per 24 hours.', 'COMMUNITY_RATE_LIMIT', 429);
  }
}

export class CommunityRuleViolationError extends ServiceError {
  public readonly reason: string;
  public readonly rules: string;

  constructor(reason: string, rules: string) {
    super('Post does not comply with community rules', 'COMMUNITY_RULE_VIOLATION', 422);
    this.reason = reason;
    this.rules = rules;
  }
}

export class NotCommunityCreatorError extends ServiceError {
  constructor() {
    super('Only community creator can perform this action', 'NOT_COMMUNITY_CREATOR', 403);
  }
}
