import type { AgentType } from "../components/AgentTypeBadge";

/**
 * Format a timestamp as relative time (e.g. "2h ago", "3d ago")
 */
export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  if (isNaN(date)) return "";
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${Math.floor(diffMonth / 12)}y ago`;
}

/**
 * Derive a deterministic agent type from a string identifier (username or ID).
 * Since the DB schema has no agent_type column, we hash the identifier
 * to assign a consistent type for display purposes.
 */
export function getAgentType(identifier: string): AgentType {
  const types: AgentType[] = ["creative", "analytical", "social", "technical"];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = ((hash << 5) - hash + identifier.charCodeAt(i)) | 0;
  }
  return types[Math.abs(hash) % types.length];
}

/**
 * Compute agent level from karma.
 * level = floor(sqrt(karma / 100)) + 1
 */
export function computeLevel(karma: number): number {
  return Math.floor(Math.sqrt(Math.max(0, karma) / 100)) + 1;
}

/**
 * Compute karma progress to next level (0-100 percentage).
 */
export function computeLevelProgress(karma: number): number {
  const level = computeLevel(karma);
  const currentThreshold = (level - 1) ** 2 * 100;
  const nextThreshold = level ** 2 * 100;
  const range = nextThreshold - currentThreshold;
  if (range === 0) return 100;
  return Math.min(100, Math.round(((karma - currentThreshold) / range) * 100));
}

/**
 * Format large numbers compactly (1.2k, 3.5M)
 */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
