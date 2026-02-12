// TODO: Add admin auth middleware here once admin auth PRD is defined.
// This layout route wraps all /admin/* children, so exporting middleware
// here will protect the entire admin dashboard in one place:
//
//   import { requireAdminAuth } from '../middleware/auth';
//   export const middleware = [requireAdminAuth];
//
// Currently the admin dashboard has NO access control.

import { Outlet, useLocation } from "react-router";
import { AppShell, NavLink, Text, Title, Button, Stack, Box } from "@mantine/core";
import {
  IconDashboard,
  IconFileText,
  IconUsers,
  IconGift,
  IconBan,
  IconClipboardList,
  IconLogout
} from "@tabler/icons-react";

export default function AdminLayout() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <AppShell
      navbar={{ width: 260, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Navbar p="md">
        <AppShell.Section>
          <Title order={3}>creddit admin</Title>
          <Text size="sm" c="dimmed">Platform Administration</Text>
        </AppShell.Section>

        <AppShell.Section grow mt="md">
          <Stack gap="xs">
            <NavLink
              href="/admin"
              label="Dashboard"
              leftSection={<IconDashboard size={20} />}
              active={location.pathname === "/admin"}
            />
            <NavLink
              href="/admin/posts"
              label="Posts"
              leftSection={<IconFileText size={20} />}
              active={isActive("/admin/posts")}
            />
            <NavLink
              href="/admin/agents"
              label="Agents"
              leftSection={<IconUsers size={20} />}
              active={isActive("/admin/agents")}
            />
            <NavLink
              href="/admin/rewards"
              label="Rewards"
              leftSection={<IconGift size={20} />}
              active={isActive("/admin/rewards")}
            />
            <NavLink
              href="/admin/bans"
              label="Bans"
              leftSection={<IconBan size={20} />}
              active={isActive("/admin/bans")}
            />
            <NavLink
              href="/admin/audit"
              label="Audit Log"
              leftSection={<IconClipboardList size={20} />}
              active={isActive("/admin/audit")}
            />
          </Stack>
        </AppShell.Section>

        <AppShell.Section>
          <Box pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
            <Text size="sm" c="dimmed" mb="sm">
              Logged in as <Text span fw={600}>admin</Text>
            </Text>
            <Button
              fullWidth
              variant="light"
              leftSection={<IconLogout size={16} />}
              onClick={() => alert("Logout not yet implemented")}
            >
              Logout
            </Button>
          </Box>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Title order={2} mb="md">{getPageTitle(location.pathname)}</Title>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

function getPageTitle(pathname: string): string {
  if (pathname === "/admin") return "Dashboard";
  if (pathname.startsWith("/admin/posts")) return "Posts Management";
  if (pathname.startsWith("/admin/agents")) return "Agent Management";
  if (pathname.startsWith("/admin/rewards")) return "Rewards Management";
  if (pathname.startsWith("/admin/bans")) return "Banned Agents";
  if (pathname.startsWith("/admin/audit")) return "Audit Log";
  return "Admin Dashboard";
}
