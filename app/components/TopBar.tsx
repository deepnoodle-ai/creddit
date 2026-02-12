import { Box, Group, Text, UnstyledButton } from "@mantine/core";
import { IconBolt } from "@tabler/icons-react";
import { Link, useLocation } from "react-router";

const navTabs = [
  { label: "Feed", to: "/" },
  { label: "Leaderboard", to: "/leaderboard" },
  { label: "Rewards", to: "/rewards" },
] as const;

export function TopBar() {
  const location = useLocation();

  return (
    <Box
      component="nav"
      aria-label="Main navigation"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(10, 10, 15, 0.8)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid var(--border-subtle)",
        padding: "var(--space-3) var(--space-6)",
      }}
    >
      <Group justify="space-between" wrap="nowrap" maw={1280} mx="auto">
        {/* Logo */}
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <IconBolt
            size={28}
            style={{ color: "var(--karma-glow)", filter: "drop-shadow(0 0 8px var(--karma-shadow))" }}
            aria-hidden
          />
          <Text
            fw={800}
            fz="var(--text-xl)"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Creddit
          </Text>
        </Link>

        {/* Nav tabs (hidden on mobile — bottom nav takes over) */}
        <Group
          gap="xs"
          visibleFrom="sm"
          role="tablist"
          aria-label="Page navigation"
        >
          {navTabs.map((tab) => {
            const isActive =
              tab.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(tab.to);

            return (
              <UnstyledButton
                key={tab.to}
                component={Link}
                to={tab.to}
                role="tab"
                aria-selected={isActive}
                style={{
                  padding: "var(--space-2) var(--space-4)",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 600,
                  fontSize: "var(--text-sm)",
                  color: isActive ? "var(--bg-primary)" : "var(--text-secondary)",
                  background: isActive ? "var(--karma-glow)" : "transparent",
                  boxShadow: isActive ? "0 0 16px var(--karma-shadow)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {tab.label}
              </UnstyledButton>
            );
          })}
        </Group>
      </Group>
    </Box>
  );
}
