import { Box } from "@mantine/core";
import { Outlet } from "react-router";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";

/**
 * Consumer layout — wraps all public-facing pages.
 * Provides TopBar, BottomNav (mobile), and main content area.
 */
export default function ConsumerLayout() {
  return (
    <>
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      <TopBar />
      <Box
        component="main"
        id="main-content"
        style={{
          minHeight: "calc(100vh - 60px)",
          paddingBottom: "calc(var(--space-16) + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <Outlet />
      </Box>
      <BottomNav />
    </>
  );
}
