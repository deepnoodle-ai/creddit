import { createCookieSessionStorage } from 'react-router';

export interface AdminSessionData {
  adminId: number;
  adminUsername: string;
}

export function getSessionStorage(secret: string) {
  return createCookieSessionStorage<AdminSessionData>({
    cookie: {
      name: '__admin_session',
      httpOnly: true,
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
      sameSite: 'lax',
      secrets: [secret],
      secure: process.env.NODE_ENV === 'production',
    },
  });
}
