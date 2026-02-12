import { redirect } from 'react-router';
import type { Route } from './+types/admin.logout';
import { getSessionStorage } from '../sessions.server';

export async function action({ request, context }: Route.ActionArgs) {
  const secret = context.cloudflare.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw redirect('/admin/login');
  }

  const { getSession, destroySession } = getSessionStorage(secret);
  const session = await getSession(request.headers.get('Cookie'));

  throw redirect('/admin/login', {
    headers: {
      'Set-Cookie': await destroySession(session),
    },
  });
}

export async function loader() {
  throw redirect('/admin/login');
}
