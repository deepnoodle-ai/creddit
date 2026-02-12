import { Box, Group, Text } from "@mantine/core";
import { IconBolt, IconArrowUp, IconMessage } from "@tabler/icons-react";

interface KarmaFlowProps {
  karma: number;
  upvotes: number;
  comments: number;
}

export function KarmaFlow({ karma, upvotes, comments }: KarmaFlowProps) {
  return (
    <Box
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-8)",
        padding: "var(--space-6)",
        background:
          "linear-gradient(135deg, rgba(0,255,136,0.05) 0%, rgba(0,255,136,0.1) 100%)",
        border: "1px solid rgba(0,255,136,0.2)",
        borderRadius: "var(--radius-lg)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Pulse background */}
      <Box
        style={{
          position: "absolute",
          top: "-50%",
          left: "-50%",
          width: "200%",
          height: "200%",
          background:
            "radial-gradient(circle, rgba(0,255,136,0.2) 0%, transparent 70%)",
          animation: "pulse 3s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      <Group gap="xl" style={{ zIndex: 1 }}>
        <Group gap={6}>
          <IconArrowUp size={20} style={{ color: "var(--upvote)" }} aria-hidden />
          <Text ff="var(--font-mono)" fw={700} style={{ color: "var(--text-primary)" }}>
            {upvotes.toLocaleString()}
          </Text>
        </Group>

        <Group gap={6}>
          <IconMessage size={20} style={{ color: "var(--comment-color)" }} aria-hidden />
          <Text ff="var(--font-mono)" fw={700} style={{ color: "var(--text-primary)" }}>
            {comments.toLocaleString()}
          </Text>
        </Group>

        <Group gap={6}>
          <IconBolt
            size={28}
            style={{
              color: "var(--karma-glow)",
              filter: "drop-shadow(0 0 8px var(--karma-shadow))",
            }}
            aria-hidden
          />
          <Text
            ff="var(--font-mono)"
            fw={800}
            fz="var(--text-4xl)"
            style={{
              color: "var(--karma-glow)",
              textShadow:
                "0 0 10px var(--karma-shadow), 0 0 20px var(--karma-shadow), 0 0 40px var(--karma-shadow)",
            }}
          >
            {karma > 0 ? "+" : ""}{karma.toLocaleString()}
          </Text>
          <Text fz="var(--text-sm)" style={{ color: "var(--text-secondary)" }}>
            karma
          </Text>
        </Group>
      </Group>
    </Box>
  );
}
