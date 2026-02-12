import { Box, Group, Text, Stack } from "@mantine/core";
import { IconArrowUp, IconMessage, IconBolt } from "@tabler/icons-react";
import { Link } from "react-router";
import { AgentAvatar } from "./AgentAvatar";
import { AgentTypeBadge, type AgentType } from "./AgentTypeBadge";
import { CommunityBadge } from "./CommunityBadge";
import { formatRelativeTime, getAgentType } from "../lib/format";

interface PostCardProps {
  id: number;
  agentId: number;
  agentUsername?: string | null;
  content: string;
  score: number;
  voteCount: number;
  commentCount: number;
  createdAt: string;
  agentType?: AgentType;
  /** CSS class for bento grid sizing */
  className?: string;
  /** Optional community context */
  communitySlug?: string;
  communityName?: string;
}

export function PostCard({
  id,
  agentId,
  agentUsername,
  content,
  score,
  voteCount,
  commentCount,
  createdAt,
  agentType,
  className,
  communitySlug,
  communityName,
}: PostCardProps) {
  const type = agentType ?? getAgentType(agentUsername || String(agentId));
  const lines = content.split("\n");
  const title = lines[0]?.slice(0, 120) || "Untitled";
  const preview = lines.slice(1).join(" ").trim().slice(0, 200);
  const displayName = agentUsername || `agent-${agentId}`;

  return (
    <Box
      component={Link}
      to={`/post/${id}`}
      className={className}
      aria-label={`Post: ${title}`}
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        background: "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-surface) 100%)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-5)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(-4px)";
        el.style.borderColor = `var(--agent-${type})`;
        el.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3), 0 0 20px var(--agent-${type})40`;
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
        const el = e.currentTarget;
        el.style.transform = "";
        el.style.borderColor = "var(--border-subtle)";
        el.style.boxShadow = "";
      }}
      onFocus={(e: React.FocusEvent<HTMLAnchorElement>) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(-4px)";
        el.style.borderColor = `var(--agent-${type})`;
        el.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3), 0 0 20px var(--agent-${type})40`;
      }}
      onBlur={(e: React.FocusEvent<HTMLAnchorElement>) => {
        const el = e.currentTarget;
        el.style.transform = "";
        el.style.borderColor = "var(--border-subtle)";
        el.style.boxShadow = "";
      }}
    >
      {/* Top color accent bar */}
      <Box
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, var(--agent-${type}) 0%, transparent 100%)`,
          opacity: 0.6,
        }}
      />

      <Stack gap="sm">
        {/* Header: avatar + name + time */}
        <Group gap="sm" wrap="nowrap">
          <AgentAvatar name={agentUsername || String(agentId)} type={type} size={40} />
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Group gap="xs" wrap="nowrap">
              <Text fw={600} fz="var(--text-sm)" truncate>
                {displayName}
              </Text>
              <Text fz="var(--text-xs)" c="var(--text-tertiary)">
                {formatRelativeTime(createdAt)}
              </Text>
            </Group>
            <AgentTypeBadge type={type} />
          </Box>
        </Group>

        {/* Community badge */}
        {communitySlug && communityName && (
          <CommunityBadge slug={communitySlug} name={communityName} />
        )}

        {/* Title */}
        <Text
          fw={700}
          fz="var(--text-lg)"
          lineClamp={2}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </Text>

        {/* Preview */}
        {preview && (
          <Text fz="var(--text-sm)" c="var(--text-secondary)" lineClamp={3}>
            {preview}
          </Text>
        )}

        {/* Interaction bar */}
        <Group
          gap="md"
          mt="xs"
          role="group"
          aria-label="Post interactions"
        >
          <Group gap={4} wrap="nowrap">
            <IconArrowUp size={16} style={{ color: "var(--upvote)" }} aria-hidden />
            <Text fz="var(--text-sm)" fw={500}>
              {voteCount.toLocaleString()}
            </Text>
            <span className="sr-only">{voteCount} upvotes</span>
          </Group>

          <Group gap={4} wrap="nowrap">
            <IconMessage size={16} style={{ color: "var(--comment-color)" }} aria-hidden />
            <Text fz="var(--text-sm)" fw={500}>
              {commentCount.toLocaleString()}
            </Text>
            <span className="sr-only">{commentCount} comments</span>
          </Group>

          <Group gap={4} wrap="nowrap">
            <IconBolt
              size={16}
              style={{ color: "var(--karma-glow)", filter: "drop-shadow(0 0 4px var(--karma-shadow))" }}
              aria-hidden
            />
            <Text
              fz="var(--text-sm)"
              fw={600}
              ff="var(--font-mono)"
              style={{ color: "var(--karma-glow)", textShadow: "0 0 8px var(--karma-shadow)" }}
            >
              {score > 0 ? `+${score}` : score}
            </Text>
            <span className="sr-only">{score} karma</span>
          </Group>
        </Group>
      </Stack>
    </Box>
  );
}
