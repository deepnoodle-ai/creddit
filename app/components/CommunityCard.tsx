import { Box, Group, Stack, Text } from "@mantine/core";
import { IconUsers, IconBolt, IconMessage } from "@tabler/icons-react";
import { Link } from "react-router";
import { formatRelativeTime, formatCompact } from "../lib/format";

interface CommunityCardProps {
  id: number;
  slug: string;
  displayName: string;
  description: string | null;
  postCount: number;
  engagementScore: number;
  createdAt: string;
}

export function CommunityCard({
  slug,
  displayName,
  description,
  postCount,
  engagementScore,
  createdAt,
}: CommunityCardProps) {
  return (
    <Box
      component={Link}
      to={`/c/${slug}`}
      aria-label={`Community: ${displayName}`}
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
        el.style.borderColor = "var(--karma-glow)";
        el.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3), 0 0 20px var(--karma-shadow)";
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
        el.style.borderColor = "var(--karma-glow)";
        el.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3), 0 0 20px var(--karma-shadow)";
      }}
      onBlur={(e: React.FocusEvent<HTMLAnchorElement>) => {
        const el = e.currentTarget;
        el.style.transform = "";
        el.style.borderColor = "var(--border-subtle)";
        el.style.boxShadow = "";
      }}
    >
      {/* Top accent bar */}
      <Box
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: "linear-gradient(90deg, var(--karma-glow) 0%, transparent 100%)",
          opacity: 0.6,
        }}
      />

      <Stack gap="sm">
        {/* Header: icon + name + slug */}
        <Group gap="sm" wrap="nowrap">
          <Box
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--radius-md)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconUsers size={20} style={{ color: "var(--karma-glow)" }} aria-hidden />
          </Box>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text
              fw={700}
              fz="var(--text-lg)"
              truncate
              style={{ fontFamily: "var(--font-display)" }}
            >
              {displayName}
            </Text>
            <Text fz="var(--text-xs)" c="var(--text-tertiary)">
              c/{slug}
            </Text>
          </Box>
        </Group>

        {/* Description */}
        {description && (
          <Text fz="var(--text-sm)" c="var(--text-secondary)" lineClamp={2}>
            {description}
          </Text>
        )}

        {/* Stats bar */}
        <Group gap="md" mt="xs">
          <Group gap={4} wrap="nowrap">
            <IconMessage size={14} style={{ color: "var(--text-tertiary)" }} aria-hidden />
            <Text fz="var(--text-xs)" c="var(--text-secondary)" fw={500}>
              {formatCompact(postCount)} posts
            </Text>
          </Group>

          <Group gap={4} wrap="nowrap">
            <IconBolt
              size={14}
              style={{ color: "var(--karma-glow)", filter: "drop-shadow(0 0 4px var(--karma-shadow))" }}
              aria-hidden
            />
            <Text
              fz="var(--text-xs)"
              fw={600}
              ff="var(--font-mono)"
              style={{ color: "var(--karma-glow)", textShadow: "0 0 8px var(--karma-shadow)" }}
            >
              {formatCompact(engagementScore)}
            </Text>
          </Group>

          <Text fz="var(--text-xs)" c="var(--text-tertiary)">
            {formatRelativeTime(createdAt)}
          </Text>
        </Group>
      </Stack>
    </Box>
  );
}
