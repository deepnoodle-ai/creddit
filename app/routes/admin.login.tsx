import { redirect, data } from 'react-router';
import type { Route } from './+types/admin.login';
import { compare } from 'bcryptjs';
import { getSessionStorage } from '../sessions.server';
import {
  Card,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Stack,
  Center,
  Alert,
} from '@mantine/core';
import { IconLock, IconAlertCircle } from '@tabler/icons-react';
import { useState } from 'react';
import { useFetcher } from 'react-router';

export async function loader({ request, context }: Route.LoaderArgs) {
  const secret = context.cloudflare.env.ADMIN_SESSION_SECRET;
  if (!secret) return {};

  const { getSession } = getSessionStorage(secret);
  const session = await getSession(request.headers.get('Cookie'));

  if (session.get('adminUsername')) {
    throw redirect('/admin');
  }

  return {};
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return data({ error: 'Username and password are required' }, { status: 400 });
  }

  const secret = context.cloudflare.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    return data({ error: 'Admin session secret not configured' }, { status: 500 });
  }

  const adminRepo = context.repositories.admin;
  const adminUser = await adminRepo.getAdminByUsername(username);

  if (!adminUser) {
    return data({ error: 'Invalid username or password' }, { status: 401 });
  }

  const passwordValid = await compare(password, adminUser.password_hash);
  if (!passwordValid) {
    return data({ error: 'Invalid username or password' }, { status: 401 });
  }

  // Update last login
  await adminRepo.updateLastLogin(adminUser.id);

  // Create session
  const { getSession, commitSession } = getSessionStorage(secret);
  const session = await getSession();
  session.set('adminId', adminUser.id);
  session.set('adminUsername', adminUser.username);

  throw redirect('/admin', {
    headers: {
      'Set-Cookie': await commitSession(session),
    },
  });
}

export default function AdminLogin() {
  const fetcher = useFetcher<typeof action>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const error = fetcher.data?.error;

  return (
    <Center mih="100vh" bg="gray.1">
      <Card shadow="md" padding="xl" radius="md" withBorder w={400}>
        <Stack gap="lg">
          <Stack gap="xs" align="center">
            <IconLock size={40} color="var(--mantine-color-blue-6)" />
            <Title order={2}>creddit admin</Title>
            <Text size="sm" c="dimmed">Sign in to access the dashboard</Text>
          </Stack>

          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              variant="light"
            >
              {error}
            </Alert>
          )}

          <fetcher.Form method="post">
            <Stack gap="md">
              <TextInput
                label="Username"
                name="username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <PasswordInput
                label="Password"
                name="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="submit"
                fullWidth
                loading={fetcher.state === 'submitting'}
              >
                Sign In
              </Button>
            </Stack>
          </fetcher.Form>
        </Stack>
      </Card>
    </Center>
  );
}
