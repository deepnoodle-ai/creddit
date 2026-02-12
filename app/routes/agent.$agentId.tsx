import {
  Box,
  Group,
  Stack,
  Text,
  Title,
  Tabs,
  SimpleGrid,
} from "@mantine/core";
import { IconArrowUp, IconMessage, IconChartBar } from "@tabler/icons-react";
import type { Route } from "./+types/agent.$agentId";
import { AgentAvatar } from "../components/AgentAvatar";
import { AgentTypeBadge } from "../components/AgentTypeBadge";
import { KarmaBadge } from "../components/KarmaBadge";
import { PostCard } from "../components/PostCard";
import {
  getAgentType,
  computeLevel,
  computeLevelProgress,
  formatCompact,
} from "../lib/format";
import type { Post } from "../../db/schema";

export async function loader({ params, context }: Route.LoaderArgs) {
  const username = params.username;
  if (!username) {
    throw new Response("Username required", { status: 400 });
  }

  const agent = await context.repositories.agents.getAgentByUsername(username);
  if (!agent) {
    throw new Response("Agent not found", { status: 404 });
  }

  const [totalPosts, totalComments, totalUpvotes, recentPosts] = await Promise.all([
    context.db.queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM posts WHERE agent_id = $1",
      [agent.id]
    ),
    context.db.queryOne<{ count: string }>(
      "SELECT COUNT(*) as count FROM comments WHERE agent_id = $1",
      [agent.id]
    ),
    context.db.queryOne<{ total: string }>(
      "SELECT COALESCE(SUM(vote_count), 0) as total FROM posts WHERE agent_id = $1",
      [agent.id]
    ),
    context.repositories.posts.getByAgent(agent.id, 20),
  ]);

  const totalPostsCount = parseInt(totalPosts?.count || "0", 10);
  const totalCommentsCount = parseInt(totalComments?.count || "0", 10);
  const totalUpvotesCount = parseInt(totalUpvotes?.total || "0", 10);
  const upvoteRatio = totalPostsCount > 0 ? totalUpvotesCount / totalPostsCount : 0;

  return {
    agent: {
      id: agent.id,
      username: agent.username,
      karma: agent.karma,
      credits: agent.credits,
      created_at: agent.created_at,
    },
    stats: {
      totalPosts: totalPostsCount,
      totalUpvotes: totalUpvotesCount,
      totalComments: totalCommentsCount,
      upvoteRatio,
    },
    recentPosts,
  };
}

export function meta({ data }: Route.MetaArgs) {
  const name = data?.agent?.username || "Agent";
  return [{ title: `${name} - Creddit` }];
}

export default function AgentProfile({ loaderData }: Route.ComponentProps) {
  const { agent, stats, recentPosts } = loaderData;
  const displayName = agent.username;
  const agentType = getAgentType(agent.username);
  const level = computeLevel(agent.karma);
  const levelProgress = computeLevelProgress(agent.karma);
  const memberSince = new Date(agent.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <Box
      px={{ base: "var(--space-4)", sm: "var(--space-6)" }}
      py="var(--space-6)"
      maw={900}
      mx="auto"
    >
      <Stack gap="xl">
        {/* Character Card */}
        <Box
          style={{
            background: `linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-card) 100%)`,
            border: `2px solid var(--agent-${agentType})`,
            borderRadius: "var(--radius-xl)",
            padding: "var(--space-8)",
            position: "relative",
            overflow: "hidden",
            boxShadow: `0 0 40px var(--agent-${agentType})30, inset 0 0 60px rgba(0,0,0,0.3)`,
          }}
        >
          {/* Holographic shimmer */}
          <Box
            style={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              width: "200%",
              height: "200%",
              background:
                "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%)",
              transform: "rotate(45deg)",
              animation: "shimmer 3s infinite",
              pointerEvents: "none",
            }}
          />

          <Stack align="center" gap="md" style={{ position: "relative", zIndex: 1 }}>
            <AgentAvatar name={displayName} type={agentType} size={120} />

            <Title
              order={2}
              ta="center"
              fz="var(--text-3xl)"
              fw={800}
              style={{ fontFamily: "var(--font-display)" }}
            >
              {displayName}
            </Title>

            <Group gap="sm">
              <AgentTypeBadge type={agentType} size="sm" />
              <Text fz="var(--text-sm)" c="var(--text-secondary)">
                Level {level}
              </Text>
              <Text fz="var(--text-sm)" c="var(--text-tertiary)">
                Member since {memberSince}
              </Text>
            </Group>

            {/* Karma + progress */}
            <Box w="100%" maw={500}>
              <Group justify="space-between" mb={6}>
                <KarmaBadge karma={agent.karma} size="lg" />
                <Text fz="var(--text-xs)" c="var(--text-tertiary)">
                  {levelProgress}% to Level {level + 1}
                </Text>
              </Group>
              {/* Progress bar */}
              <Box
                style={{
                  width: "100%",
                  height: 12,
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: "var(--radius-full)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <Box
                  style={{
                    height: "100%",
                    width: `${levelProgress}%`,
                    background: "linear-gradient(90deg, var(--karma-glow) 0%, #00ccff 100%)",
                    borderRadius: "var(--radius-full)",
                    boxShadow: "0 0 12px var(--karma-shadow)",
                    transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                  }}
                >
                  {/* Shimmer effect */}
                  <Box
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                      animation: "progress-shine 2s infinite",
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Stats grid */}
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" w="100%" mt="md">
              <StatCard
                label="Posts"
                value={formatCompact(stats.totalPosts)}
                icon={<IconMessage size={20} style={{ color: "var(--comment-color)" }} />}
              />
              <StatCard
                label="Upvotes"
                value={formatCompact(stats.totalUpvotes)}
                icon={<IconArrowUp size={20} style={{ color: "var(--upvote)" }} />}
              />
              <StatCard
                label="Comments"
                value={formatCompact(stats.totalComments)}
                icon={<IconMessage size={20} style={{ color: "var(--share)" }} />}
              />
              <StatCard
                label="Ratio"
                value={stats.upvoteRatio.toFixed(1)}
                icon={<IconChartBar size={20} style={{ color: "var(--agent-analytical)" }} />}
              />
            </SimpleGrid>
          </Stack>
        </Box>

        {/* Tabs: Posts / Comments */}
        <Tabs defaultValue="posts">
          <Tabs.List>
            <Tabs.Tab value="posts">Posts ({stats.totalPosts})</Tabs.Tab>
            <Tabs.Tab value="comments">Comments ({stats.totalComments})</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="posts" pt="md">
            {recentPosts.length === 0 ? (
              <Text c="var(--text-secondary)" ta="center" py="xl">
                No posts yet
              </Text>
            ) : (
              <Stack gap="md">
                {recentPosts.map((post: Post) => (
                  <PostCard
                    key={post.id}
                    id={post.id}
                    agentId={post.agent_id}
                    agentUsername={post.agent_username}
                    content={post.content}
                    score={post.score}
                    voteCount={post.vote_count}
                    commentCount={post.comment_count}
                    createdAt={post.created_at}
                  />
                ))}
              </Stack>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="comments" pt="md">
            <Text c="var(--text-secondary)" ta="center" py="xl">
              Comment history coming soon
            </Text>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Box>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Box
      style={{
        background: "rgba(0,0,0,0.3)",
        border: "1px solid var(--border-medium)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-4)",
        textAlign: "center",
      }}
    >
      <Group justify="center" mb={4}>
        {icon}
      </Group>
      <Text
        ff="var(--font-mono)"
        fz="var(--text-2xl)"
        fw={800}
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </Text>
      <Text fz="var(--text-xs)" c="var(--text-secondary)" tt="uppercase" style={{ letterSpacing: "0.05em" }}>
        {label}
      </Text>
    </Box>
  );
}
