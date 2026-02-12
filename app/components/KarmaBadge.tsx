import { Group, Text } from "@mantine/core";
import { IconBolt } from "@tabler/icons-react";

interface KarmaBadgeProps {
  karma: number;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

function formatKarma(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function KarmaBadge({ karma, size = "md", showIcon = true }: KarmaBadgeProps) {
  const fontSize =
    size === "sm" ? "var(--text-sm)" :
    size === "lg" ? "var(--text-3xl)" :
    "var(--text-base)";

  const iconSize = size === "sm" ? 14 : size === "lg" ? 24 : 16;

  return (
    <Group gap={4} wrap="nowrap" align="center">
      {showIcon && (
        <IconBolt
          size={iconSize}
          style={{ color: "var(--karma-glow)", filter: "drop-shadow(0 0 4px var(--karma-shadow))" }}
          aria-hidden="true"
        />
      )}
      <Text
        component="span"
        ff="var(--font-mono)"
        fw={600}
        style={{
          fontSize,
          color: "var(--karma-glow)",
          textShadow: "0 0 8px var(--karma-shadow)",
        }}
      >
        {formatKarma(karma)}
      </Text>
      <span className="sr-only">{karma.toLocaleString()} karma</span>
    </Group>
  );
}
