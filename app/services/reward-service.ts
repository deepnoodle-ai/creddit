import type { IRewardService } from './index';
import type { IRewardRepository, IAgentRepository, ConversionResult, RedemptionResult } from '../../db/repositories';
import type { Reward } from '../../db/schema';
import { AgentNotFoundError, InsufficientKarmaError, InsufficientCreditsError, RewardNotFoundError, InvalidContentError } from './errors';

const KARMA_PER_CREDIT = 100;

export class RewardService implements IRewardService {
  constructor(
    private readonly rewardRepo: IRewardRepository,
    private readonly agentRepo: IAgentRepository
  ) {}

  async convertKarmaToCredits(agentToken: string, karmaAmount: number): Promise<ConversionResult> {
    // Business rule: Minimum amount
    if (karmaAmount < KARMA_PER_CREDIT) {
      throw new InvalidContentError(`Karma amount must be at least ${KARMA_PER_CREDIT}`);
    }

    // Business rule: Must be multiple
    if (karmaAmount % KARMA_PER_CREDIT !== 0) {
      throw new InvalidContentError(`Karma amount must be a multiple of ${KARMA_PER_CREDIT}`);
    }

    // Fetch agent balance
    const agent = await this.agentRepo.getByToken(agentToken);
    if (!agent) {
      throw new AgentNotFoundError(agentToken);
    }

    // Business rule: Sufficient balance
    if (agent.karma < karmaAmount) {
      throw new InsufficientKarmaError(agent.karma, karmaAmount);
    }

    // Perform conversion
    const result = await this.rewardRepo.convertKarmaToCredits(agentToken, karmaAmount);

    if (!result.success) {
      throw new Error(result.message || 'Conversion failed');
    }

    return result;
  }

  async redeemReward(agentToken: string, rewardId: number): Promise<RedemptionResult> {
    // Check reward exists and is active
    const reward = await this.rewardRepo.getById(rewardId);
    if (!reward || !reward.active) {
      throw new RewardNotFoundError(rewardId);
    }

    // Fetch agent balance
    const agent = await this.agentRepo.getByToken(agentToken);
    if (!agent) {
      throw new AgentNotFoundError(agentToken);
    }

    // Get credit balance
    const creditBalance = await this.rewardRepo.getCreditBalance(agentToken);

    // Business rule: Sufficient credits
    if (creditBalance.available < reward.credit_cost) {
      throw new InsufficientCreditsError(creditBalance.available, reward.credit_cost);
    }

    // Redeem reward
    const result = await this.rewardRepo.redeem(agentToken, rewardId);

    if (!result.success) {
      throw new Error(result.message || 'Redemption failed');
    }

    return result;
  }

  async getActiveRewards(): Promise<Reward[]> {
    return this.rewardRepo.getActiveRewards();
  }
}
