import { useState } from "react";
import { Box, Group, Stack, Text, Title, UnstyledButton } from "@mantine/core";
import { IconUsers, IconBolt, IconMessage, IconClock, IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { formatRelativeTime, formatCompact } from "../lib/format";

interface CommunityHeaderProps {
  slug: string;
  displayName: string;
  description: string | null;
  postingRules: string | null;
  postCount: number;
  engagementScore: number;
  createdAt: string;
}

export function CommunityHeader({
  slug,
  displayName,
  description,
  postingRules,
  postCount,
  engagementScore,
  createdAt,
}: CommunityHeaderProps) {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <Box
      style={{
        background: "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-surface) 100%)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-xl)",
        padding: "var(--space-6)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top accent bar */}
      <Box
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: "linear-gradient(90deg, var(--karma-glow) 0%, transparent 100%)",
          opacity: 0.8,
        }}
      />

      <Stack gap="md">
        {/* Community icon + name */}
        <Group gap="md" wrap="nowrap">
          <Box
            style={{
              width: 56,
              height: 56,
              borderRadius: "var(--radius-lg)",
              background: "var(--bg-surface)",
              border: "2px solid var(--karma-glow)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 0 16px var(--karma-shadow)",
            }}
          >
            <IconUsers size={28} style={{ color: "var(--karma-glow)" }} aria-hidden />
          </Box>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Title
              order={1}
              fz={{ base: "var(--text-2xl)", sm: "var(--text-3xl)" }}
              fw={800}
              style={{ fontFamily: "var(--font-display)" }}
            >
              {displayName}
            </Title>
            <Text fz="var(--text-sm)" c="var(--text-tertiary)" ff="var(--font-mono)">
              c/{slug}
            </Text>
          </Box>
        </Group>

        {/* Description */}
        {description && (
          <Text fz="var(--text-sm)" c="var(--text-secondary)" style={{ lineHeight: 1.6 }}>
            {description}
          </Text>
        )}

        {/* Stats row */}
        <Group gap="lg">
          <Group gap={6} wrap="nowrap">
            <IconMessage size={16} style={{ color: "var(--text-tertiary)" }} aria-hidden />
            <Text fz="var(--text-sm)" fw={500}>
              {formatCompact(postCount)} posts
            </Text>
          </Group>

          <Group gap={6} wrap="nowrap">
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
              {formatCompact(engagementScore)} engagement
            </Text>
          </Group>

          <Group gap={6} wrap="nowrap">
            <IconClock size={16} style={{ color: "var(--text-tertiary)" }} aria-hidden />
            <Text fz="var(--text-sm)" c="var(--text-tertiary)">
              Created {formatRelativeTime(createdAt)}
            </Text>
          </Group>
        </Group>

        {/* Posting rules (collapsible) */}
        {postingRules && (
          <Box
            style={{
              borderTop: "1px solid var(--border-subtle)",
              paddingTop: "var(--space-3)",
            }}
          >
            <UnstyledButton
              onClick={() => setRulesOpen((v) => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                color: "var(--text-secondary)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
              }}
              aria-expanded={rulesOpen}
            >
              {rulesOpen ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
              Posting Rules
            </UnstyledButton>
            {rulesOpen && (
              <Text
                fz="var(--text-sm)"
                c="var(--text-secondary)"
                mt="sm"
                style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}
              >
                {postingRules}
              </Text>
            )}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
