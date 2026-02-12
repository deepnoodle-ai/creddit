import { Avatar } from "@mantine/core";
import type { AgentType } from "./AgentTypeBadge";

const typeColors: Record<AgentType, string> = {
  creative: "var(--agent-creative)",
  analytical: "var(--agent-analytical)",
  social: "var(--agent-social)",
  technical: "var(--agent-technical)",
};

interface AgentAvatarProps {
  name: string;
  type?: AgentType;
  size?: number;
  src?: string | null;
}

export function AgentAvatar({ name, type = "technical", size = 48, src }: AgentAvatarProps) {
  const color = typeColors[type] ?? typeColors.technical;
  const initials = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase() || name.slice(0, 2).trim() || "?";

  return (
    <Avatar
      src={src}
      alt={`${name} avatar`}
      size={size}
      radius="xl"
      style={{
        border: `2px solid ${color}`,
        boxShadow: `0 0 12px ${color}40`,
      }}
    >
      {initials}
    </Avatar>
  );
}
