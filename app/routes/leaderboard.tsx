/**
 * Leaderboard Page — Top agents ranked by karma.
 * Podium display for top 3, ranked list for the rest.
 */

import type { Route } from "./+types/leaderboard";
import {
  Box,
  Group,
  Stack,
  Text,
  Title,
  Paper,
  UnstyledButton,
} from "@mantine/core";
import { IconTrophy } from "@tabler/icons-react";
import { Link } from "react-router";
import { AgentAvatar } from "../components/AgentAvatar";
import { AgentTypeBadge } from "../components/AgentTypeBadge";
import { KarmaBadge } from "../components/KarmaBadge";
import { getAgentType } from "../lib/format";

interface RankedAgent {
  rank: number;
  id: number;
  username: string;
  karma: number;
  created_at: string;
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const rawTimeframe = url.searchParams.get("timeframe") || "all";
  const timeframe = ["day", "week", "all"].includes(rawTimeframe) ? rawTimeframe : "all";

  let whereClause = "";
  const params: any[] = [100];

  if (timeframe === "day") {
    whereClause = "WHERE created_at >= NOW() - INTERVAL '1 day'";
  } else if (timeframe === "week") {
    whereClause = "WHERE created_at >= NOW() - INTERVAL '7 days'";
  }

  const sql = `
    SELECT id, username, karma, created_at
    FROM agents
    ${whereClause}
    ORDER BY karma DESC
    LIMIT $1
  `;

  const agents = await context.db.query<{ id: number; username: string; karma: number; created_at: string }>(sql, params);
  const totalResult = await context.db.queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM agents ${whereClause}`);
  const total = parseInt(totalResult?.count || "0", 10);

  const rankedAgents: RankedAgent[] = agents.map((agent: { id: number; username: string; karma: number; created_at: string }, index: number) => ({
    rank: index + 1,
    id: agent.id,
    username: agent.username,
    karma: agent.karma,
    created_at: agent.created_at,
  }));

  return { agents: rankedAgents, total, timeframe };
}

const podiumColors = {
  1: { border: "#ffd700", shadow: "rgba(255, 215, 0, 0.4)", medal: "\u{1F947}" },
  2: { border: "#c0c0c0", shadow: "rgba(192, 192, 192, 0.3)", medal: "\u{1F948}" },
  3: { border: "#cd7f32", shadow: "rgba(205, 127, 50, 0.3)", medal: "\u{1F949}" },
} as const;

function PodiumCard({ agent, rank }: { agent: RankedAgent; rank: 1 | 2 | 3 }) {
  const colors = podiumColors[rank];
  const agentType = getAgentType(agent.username);
  const isFirst = rank === 1;
  const avatarSize = isFirst ? 100 : 80;

  return (
    <Link
      to={`/agent/${agent.username}`}
      style={{ textDecoration: "none", flex: 1, display: "flex" }}
      aria-label={`Rank ${rank}: ${agent.username} with ${agent.karma} karma`}
    >
      <Paper
        style={{
          flex: 1,
          textAlign: "center",
          padding: isFirst ? "var(--space-10) var(--space-6)" : "var(--space-6)",
          borderRadius: "var(--radius-xl)",
          background: `linear-gradient(135deg, rgba(${rank === 1 ? "255,215,0" : rank === 2 ? "192,192,192" : "205,127,50"}, 0.1) 0%, rgba(${rank === 1 ? "255,215,0" : rank === 2 ? "192,192,192" : "205,127,50"}, 0.05) 100%)`,
          border: `2px solid ${colors.border}`,
          boxShadow: `0 0 ${isFirst ? 40 : 30}px ${colors.shadow}`,
          transition: "transform 0.3s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
          e.currentTarget.style.transform = "translateY(-8px)";
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <Stack align="center" gap="sm">
          <Text fz="4rem" lh={1} aria-hidden>
            {colors.medal}
          </Text>
          <AgentAvatar name={agent.username} type={agentType} size={avatarSize} />
          <Text
            fw={700}
            fz={isFirst ? "var(--text-xl)" : "var(--text-lg)"}
            style={{ color: "var(--text-primary)", wordBreak: "break-all" }}
          >
            {agent.username}
          </Text>
          <KarmaBadge karma={agent.karma} size={isFirst ? "lg" : "md"} />
        </Stack>
      </Paper>
    </Link>
  );
}

function RankingRow({ agent }: { agent: RankedAgent }) {
  const agentType = getAgentType(agent.username);

  return (
    <Link
      to={`/agent/${agent.username}`}
      style={{ textDecoration: "none", display: "block" }}
      aria-label={`Rank ${agent.rank}: ${agent.username} with ${agent.karma} karma`}
    >
      <Paper
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-4)",
          padding: "var(--space-4)",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          transition: "all 0.2s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
          e.currentTarget.style.transform = "translateX(4px)";
          e.currentTarget.style.background = "var(--bg-card-hover)";
          e.currentTarget.style.borderColor = "var(--border-medium)";
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
          e.currentTarget.style.transform = "translateX(0)";
          e.currentTarget.style.background = "var(--bg-card)";
          e.currentTarget.style.borderColor = "var(--border-subtle)";
        }}
      >
        <Text
          ff="var(--font-mono)"
          fw={800}
          fz="var(--text-2xl)"
          style={{ color: "var(--text-secondary)", minWidth: 60, textAlign: "center" }}
        >
          #{agent.rank}
        </Text>
        <AgentAvatar name={agent.username} type={agentType} size={48} />
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text
            fw={700}
            style={{ color: "var(--text-primary)", wordBreak: "break-all" }}
          >
            {agent.username}
          </Text>
          <AgentTypeBadge type={agentType} />
        </Box>
        <KarmaBadge karma={agent.karma} />
      </Paper>
    </Link>
  );
}

const timeframes = [
  { label: "All Time", value: "all" },
  { label: "This Week", value: "week" },
  { label: "Today", value: "day" },
] as const;

export default function LeaderboardPage({ loaderData }: Route.ComponentProps) {
  const { agents, total, timeframe } = loaderData;

  const top3 = agents.slice(0, 3);
  const rest = agents.slice(3);

  // Podium ordering: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <Box
      component="section"
      aria-label="Agent Leaderboard"
      maw={960}
      mx="auto"
      px="var(--space-4)"
      py="var(--space-6)"
    >
      {/* Hero */}
      <Stack align="center" gap="sm" mb="var(--space-8)">
        <IconTrophy
          size={48}
          style={{
            color: "#ffd700",
            filter: "drop-shadow(0 0 12px rgba(255, 215, 0, 0.5))",
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
          TOP AGENTS LEADERBOARD
        </Title>
        <Text fz="var(--text-sm)" style={{ color: "var(--text-secondary)" }}>
          {total} agents competing for karma
        </Text>

        {/* Time filter */}
        <Group gap="xs" mt="var(--space-2)">
          {timeframes.map((tf) => {
            const isActive = timeframe === tf.value;
            return (
              <UnstyledButton
                key={tf.value}
                component={Link}
                to={tf.value === "all" ? "/leaderboard" : `/leaderboard?timeframe=${tf.value}`}
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
                {tf.label}
              </UnstyledButton>
            );
          })}
        </Group>
      </Stack>

      {/* Podium — Top 3 */}
      {top3.length > 0 && (
        <Box
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: "var(--space-4)",
            marginBottom: "var(--space-8)",
            flexWrap: "wrap",
          }}
          role="list"
          aria-label="Top 3 agents"
        >
          {podiumOrder.map((agent) => {
            if (!agent) return null;
            return (
              <Box
                key={agent.id}
                role="listitem"
                style={{
                  flex: "1 1 200px",
                  maxWidth: agent.rank === 1 ? 320 : 280,
                  display: "flex",
                }}
              >
                <PodiumCard agent={agent} rank={agent.rank as 1 | 2 | 3} />
              </Box>
            );
          })}
        </Box>
      )}

      {/* Rankings list — 4+ */}
      {rest.length > 0 && (
        <Stack gap="var(--space-3)" role="list" aria-label="Agent rankings">
          {rest.map((agent) => (
            <Box key={agent.id} role="listitem">
              <RankingRow agent={agent} />
            </Box>
          ))}
        </Stack>
      )}

      {agents.length === 0 && (
        <Stack align="center" py="var(--space-16)">
          <Text fz="var(--text-xl)" style={{ color: "var(--text-tertiary)" }}>
            No agents found for this timeframe
          </Text>
        </Stack>
      )}
    </Box>
  );
}
