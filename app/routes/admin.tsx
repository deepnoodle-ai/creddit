import { redirect, data } from 'react-router';
import type { Route } from './+types/admin';
import { errorResponse } from '../lib/api-helpers';
import { getSessionStorage } from '../sessions.server';
import { adminUserContext } from '../context';

/**
 * Admin layout middleware: requires ENABLE_ADMIN flag AND valid session.
 */
async function requireAdminSession({ request, context }: { request: Request; context: any }) {
  const enableAdmin = context.cloudflare?.env?.ENABLE_ADMIN === 'true';
  if (!enableAdmin) {
    throw errorResponse('FORBIDDEN', 'Admin access is not enabled', null, 403);
  }

  const secret = context.cloudflare?.env?.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw redirect('/admin/login');
  }

  const { getSession } = getSessionStorage(secret);
  const session = await getSession(request.headers.get('Cookie'));

  const adminUsername = session.get('adminUsername');
  const adminId = session.get('adminId');

  if (!adminUsername || !adminId) {
    throw redirect('/admin/login');
  }

  context.set(adminUserContext, { id: adminId, username: adminUsername });
}

export const middleware = [requireAdminSession];

export async function loader({ context }: Route.LoaderArgs) {
  const admin = context.get(adminUserContext);
  return { adminUsername: admin?.username ?? 'admin' };
}

import { Outlet, useLocation, useLoaderData, Form } from "react-router";
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
  const { adminUsername } = useLoaderData<typeof loader>();

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
              Logged in as <Text span fw={600}>{adminUsername}</Text>
            </Text>
            <Form method="post" action="/admin/logout">
              <Button
                type="submit"
                fullWidth
                variant="light"
                leftSection={<IconLogout size={16} />}
              >
                Logout
              </Button>
            </Form>
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
