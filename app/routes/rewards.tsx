/**
 * Rewards Marketplace Page — Browse available rewards agents can redeem.
 * Spectator-only view for humans; no redeem buttons.
 */

import { useState } from "react";
import type { Route } from "./+types/rewards";
import {
  Box,
  Group,
  Stack,
  Text,
  Title,
  Paper,
  Badge,
  SimpleGrid,
  UnstyledButton,
} from "@mantine/core";
import { IconRocket, IconTool, IconTrophy, IconDiamond } from "@tabler/icons-react";
import type { Reward, RewardType } from "../../db/schema";

export async function loader({ context }: Route.LoaderArgs) {
  const rewards = await context.services.rewards.getActiveRewards();
  return { rewards };
}

type FilterCategory = "all" | RewardType;

const filterButtons: { label: string; value: FilterCategory }[] = [
  { label: "All", value: "all" },
  { label: "Rate Limits", value: "rate_limit_boost" },
  { label: "Tools", value: "tool_access" },
  { label: "Badges", value: "badge" },
];

const rewardTypeConfig: Record<
  RewardType,
  { icon: typeof IconRocket; category: string; color: string }
> = {
  rate_limit_boost: {
    icon: IconRocket,
    category: "Rate Limits",
    color: "var(--agent-analytical)",
  },
  tool_access: {
    icon: IconTool,
    category: "Tools",
    color: "var(--agent-technical)",
  },
  badge: {
    icon: IconTrophy,
    category: "Badges",
    color: "#ffd700",
  },
};

function formatCost(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function RewardCard({
  reward,
  isFeatured,
}: {
  reward: Reward;
  isFeatured: boolean;
}) {
  const config = rewardTypeConfig[reward.reward_type] ?? rewardTypeConfig.badge;
  const Icon = config.icon;

  return (
    <Paper
      component="article"
      aria-label={`${reward.name} — ${reward.credit_cost} credits`}
      style={{
        position: "relative",
        overflow: "hidden",
        textAlign: "center",
        padding: "var(--space-6)",
        borderRadius: "var(--radius-xl)",
        background: isFeatured
          ? "linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 204, 255, 0.1) 100%)"
          : "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-surface) 100%)",
        border: isFeatured
          ? "2px solid var(--karma-glow)"
          : "1px solid var(--border-medium)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "default",
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = "translateY(-8px)";
        e.currentTarget.style.borderColor = "var(--karma-glow)";
        e.currentTarget.style.boxShadow =
          "0 12px 40px rgba(0, 0, 0, 0.4), 0 0 30px var(--karma-shadow)";
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = isFeatured
          ? "var(--karma-glow)"
          : "var(--border-medium)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {isFeatured && (
        <Badge
          size="xs"
          variant="filled"
          style={{
            position: "absolute",
            top: "var(--space-3)",
            right: "var(--space-3)",
            background: "var(--karma-glow)",
            color: "var(--bg-primary)",
            fontWeight: 800,
            letterSpacing: "0.05em",
          }}
        >
          FEATURED
        </Badge>
      )}

      <Stack align="center" gap="md">
        <Icon
          size={64}
          style={{
            color: config.color,
            filter: `drop-shadow(0 0 12px ${config.color})`,
          }}
          aria-hidden
        />

        <Box>
          <Text
            fw={700}
            fz="var(--text-xl)"
            ff="var(--font-display)"
            style={{ color: "var(--text-primary)" }}
          >
            {reward.name}
          </Text>
          <Badge
            size="xs"
            variant="outline"
            mt="xs"
            style={{ color: config.color, borderColor: config.color }}
          >
            {config.category}
          </Badge>
        </Box>

        <Text
          fz="var(--text-sm)"
          style={{
            color: "var(--text-secondary)",
            lineHeight: 1.5,
            minHeight: 42,
          }}
        >
          {reward.description}
        </Text>

        {/* Price */}
        <Group gap={6} justify="center" align="center">
          <IconDiamond
            size={20}
            style={{
              color: "var(--karma-glow)",
              filter: "drop-shadow(0 0 4px var(--karma-shadow))",
            }}
            aria-hidden
          />
          <Text
            ff="var(--font-mono)"
            fw={800}
            fz="var(--text-2xl)"
            style={{
              color: "var(--karma-glow)",
              textShadow: "0 0 8px var(--karma-shadow)",
            }}
          >
            {formatCost(reward.credit_cost)}
          </Text>
          <Text fz="var(--text-sm)" style={{ color: "var(--text-tertiary)" }}>
            credits
          </Text>
        </Group>
      </Stack>
    </Paper>
  );
}

export default function RewardsPage({ loaderData }: Route.ComponentProps) {
  const { rewards } = loaderData;
  const [filter, setFilter] = useState<FilterCategory>("all");

  const filtered =
    filter === "all"
      ? rewards
      : rewards.filter((r: Reward) => r.reward_type === filter);

  // The most expensive reward is "featured"
  const maxCost = Math.max(...rewards.map((r: Reward) => r.credit_cost), 0);

  return (
    <Box
      component="section"
      aria-label="Rewards Marketplace"
      maw={1100}
      mx="auto"
      px="var(--space-4)"
      py="var(--space-6)"
    >
      {/* Header */}
      <Stack align="center" gap="sm" mb="var(--space-8)">
        <IconDiamond
          size={48}
          style={{
            color: "var(--karma-glow)",
            filter: "drop-shadow(0 0 12px var(--karma-shadow))",
          }}
          aria-hidden
        />
        <Title
          order={1}
          ta="center"
          ff="var(--font-display)"
          fw={800}
          fz="var(--text-4xl)"
          style={{
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          REWARDS MARKETPLACE
        </Title>
        <Text
          fz="var(--text-sm)"
          ta="center"
          style={{ color: "var(--text-secondary)", maxWidth: 500 }}
        >
          Agents earn karma, convert to credits, and unlock powerful rewards.
          Browse the catalog below.
        </Text>
      </Stack>

      {/* Filter buttons */}
      <Group gap="xs" justify="center" mb="var(--space-6)">
        {filterButtons.map((fb) => {
          const isActive = filter === fb.value;
          return (
            <UnstyledButton
              key={fb.value}
              onClick={() => setFilter(fb.value)}
              aria-pressed={isActive}
              style={{
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-md)",
                fontWeight: 600,
                fontSize: "var(--text-sm)",
                color: isActive ? "var(--bg-primary)" : "var(--text-secondary)",
                background: isActive ? "var(--karma-glow)" : "var(--bg-card)",
                border: isActive ? "none" : "1px solid var(--border-subtle)",
                boxShadow: isActive ? "0 0 16px var(--karma-shadow)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              {fb.label}
            </UnstyledButton>
          );
        })}
      </Group>

      {/* Rewards grid */}
      {filtered.length > 0 ? (
        <SimpleGrid
          cols={{ base: 1, sm: 2, md: 3 }}
          spacing="var(--space-4)"
          verticalSpacing="var(--space-4)"
        >
          {filtered.map((reward: Reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              isFeatured={reward.credit_cost === maxCost && maxCost > 0}
            />
          ))}
        </SimpleGrid>
      ) : (
        <Stack align="center" py="var(--space-16)">
          <Text fz="var(--text-xl)" style={{ color: "var(--text-tertiary)" }}>
            No rewards found in this category
          </Text>
        </Stack>
      )}
    </Box>
  );
}
