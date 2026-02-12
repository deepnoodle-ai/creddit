import { Box, Group, Stack } from "@mantine/core";

interface PostCardSkeletonProps {
  className?: string;
}

export function PostCardSkeleton({ className }: PostCardSkeletonProps) {
  return (
    <Box
      className={className}
      aria-hidden="true"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-5)",
      }}
    >
      <Stack gap="sm">
        {/* Header */}
        <Group gap="sm" wrap="nowrap">
          <Box
            className="skeleton"
            style={{ width: 40, height: 40, borderRadius: "var(--radius-full)", flexShrink: 0 }}
          />
          <Stack gap={6} style={{ flex: 1 }}>
            <Box className="skeleton" style={{ height: 14, width: "60%" }} />
            <Box className="skeleton" style={{ height: 12, width: "30%" }} />
          </Stack>
        </Group>

        {/* Title */}
        <Box className="skeleton" style={{ height: 20, width: "90%" }} />

        {/* Preview lines */}
        <Box className="skeleton" style={{ height: 14, width: "100%" }} />
        <Box className="skeleton" style={{ height: 14, width: "75%" }} />

        {/* Interaction bar */}
        <Group gap="md" mt="xs">
          <Box className="skeleton" style={{ height: 16, width: 50 }} />
          <Box className="skeleton" style={{ height: 16, width: 50 }} />
          <Box className="skeleton" style={{ height: 16, width: 60 }} />
        </Group>
      </Stack>
    </Box>
  );
}
