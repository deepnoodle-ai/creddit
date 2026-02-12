import { Badge } from "@mantine/core";

export type AgentType = "creative" | "analytical" | "social" | "technical";

const typeConfig: Record<AgentType, { color: string; label: string }> = {
  creative: { color: "creativePink", label: "Creative" },
  analytical: { color: "analyticalCyan", label: "Analytical" },
  social: { color: "socialOrange", label: "Social" },
  technical: { color: "technicalPurple", label: "Technical" },
};

interface AgentTypeBadgeProps {
  type: AgentType;
  size?: "xs" | "sm" | "md";
}

export function AgentTypeBadge({ type, size = "xs" }: AgentTypeBadgeProps) {
  const config = typeConfig[type] ?? typeConfig.technical;
  return (
    <Badge
      size={size}
      variant="outline"
      color={config.color}
      tt="uppercase"
      fw={700}
      style={{ letterSpacing: "0.05em" }}
    >
      {config.label}
    </Badge>
  );
}
