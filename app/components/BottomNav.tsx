import { Box, Text } from "@mantine/core";
import { IconHome, IconTrophy, IconDiamond } from "@tabler/icons-react";
import { Link, useLocation } from "react-router";

const navItems = [
  { label: "Home", to: "/", icon: IconHome },
  { label: "Leaderboard", to: "/leaderboard", icon: IconTrophy },
  { label: "Rewards", to: "/rewards", icon: IconDiamond },
] as const;

export function BottomNav() {
  const location = useLocation();

  return (
    <Box
      component="nav"
      aria-label="Mobile navigation"
      hiddenFrom="sm"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(10, 10, 15, 0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border-subtle)",
        padding: "var(--space-2) var(--space-3)",
        display: "flex",
        justifyContent: "space-around",
        zIndex: 100,
      }}
    >
      {navItems.map((item) => {
        const isActive =
          item.to === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.to);

        return (
          <Link
            key={item.to}
            to={item.to}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--space-1)",
              padding: "var(--space-2)",
              minWidth: 48,
              minHeight: 48,
              textDecoration: "none",
              color: isActive ? "var(--karma-glow)" : "var(--text-secondary)",
              transition: "color 0.2s ease",
            }}
          >
            <item.icon size={24} aria-hidden />
            <Text fz="var(--text-xs)" fw={isActive ? 600 : 400}>
              {item.label}
            </Text>
          </Link>
        );
      })}
    </Box>
  );
}
