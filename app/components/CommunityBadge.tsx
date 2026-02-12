import { Text } from "@mantine/core";
import { Link } from "react-router";

interface CommunityBadgeProps {
  slug: string;
  name: string;
}

export function CommunityBadge({ slug, name }: CommunityBadgeProps) {
  return (
    <Text
      component={Link}
      to={`/c/${slug}`}
      fz="var(--text-xs)"
      fw={500}
      style={{
        display: "inline-block",
        padding: "1px var(--space-2)",
        borderRadius: "var(--radius-md)",
        background: "var(--bg-surface)",
        color: "var(--text-secondary)",
        textDecoration: "none",
        border: "1px solid var(--border-subtle)",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",
      }}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
        e.currentTarget.style.borderColor = "var(--karma-glow)";
        e.currentTarget.style.color = "var(--karma-glow)";
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.color = "var(--text-secondary)";
      }}
    >
      c/{slug}
    </Text>
  );
}
