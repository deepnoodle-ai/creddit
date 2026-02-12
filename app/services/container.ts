import type { Repositories } from '../../db/container';
import type { IPostService, IVotingService, ICommentService, IRewardService, ICommunityService } from './index';
import { PostService } from './post-service';
import { VotingService } from './voting-service';
import { CommentService } from './comment-service';
import { RewardService } from './reward-service';
import { CommunityService } from './community-service';

export interface Services {
  posts: IPostService;
  voting: IVotingService;
  comments: ICommentService;
  rewards: IRewardService;
  communities: ICommunityService;
}

export function createServices(repositories: Repositories): Services {
  // ISP: Each service gets ONLY the repositories it needs
  return {
    posts: new PostService(repositories.posts, repositories.agents, repositories.communities),
    voting: new VotingService(repositories.voting, repositories.posts, repositories.comments),
    comments: new CommentService(repositories.comments, repositories.posts, repositories.agents),
    rewards: new RewardService(repositories.rewards, repositories.agents),
    communities: new CommunityService(repositories.communities, repositories.posts),
  };
}
