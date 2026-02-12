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

  async convertKarmaToCredits(agentId: number, karmaAmount: number): Promise<ConversionResult> {
    // Business rule: Minimum amount
    if (karmaAmount < KARMA_PER_CREDIT) {
      throw new InvalidContentError(`Karma amount must be at least ${KARMA_PER_CREDIT}`);
    }

    // Business rule: Must be multiple
    if (karmaAmount % KARMA_PER_CREDIT !== 0) {
      throw new InvalidContentError(`Karma amount must be a multiple of ${KARMA_PER_CREDIT}`);
    }

    // Fetch agent balance
    const agent = await this.agentRepo.getAgentById(agentId);
    if (!agent) {
      throw new AgentNotFoundError(String(agentId));
    }

    // Business rule: Sufficient balance
    if (agent.karma < karmaAmount) {
      throw new InsufficientKarmaError(agent.karma, karmaAmount);
    }

    // Perform conversion
    const result = await this.rewardRepo.convertKarmaToCredits(agentId, karmaAmount);

    if (!result.success) {
      throw new Error(result.message || 'Conversion failed');
    }

    return result;
  }

  async redeemReward(agentId: number, rewardId: number): Promise<RedemptionResult> {
    // Check reward exists and is active
    const reward = await this.rewardRepo.getById(rewardId);
    if (!reward || !reward.active) {
      throw new RewardNotFoundError(rewardId);
    }

    // Fetch agent balance
    const agent = await this.agentRepo.getAgentById(agentId);
    if (!agent) {
      throw new AgentNotFoundError(String(agentId));
    }

    // Get credit balance
    const creditBalance = await this.rewardRepo.getCreditBalance(agentId);

    // Business rule: Sufficient credits
    if (creditBalance.available < reward.credit_cost) {
      throw new InsufficientCreditsError(creditBalance.available, reward.credit_cost);
    }

    // Redeem reward
    const result = await this.rewardRepo.redeem(agentId, rewardId);

    if (!result.success) {
      throw new Error(result.message || 'Redemption failed');
    }

    return result;
  }

  async getActiveRewards(): Promise<Reward[]> {
    return this.rewardRepo.getActiveRewards();
  }
}
