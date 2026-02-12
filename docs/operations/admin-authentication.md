# Admin Authentication

The admin dashboard (`/admin`) is protected by cookie-based session authentication. Admin users must log in at `/admin/login` before accessing any admin routes.

## How It Works

1. **Login** — The admin submits username/password at `/admin/login`. The server verifies the password against a bcrypt hash stored in the `admin_users` table. On success, a signed session cookie (`__admin_session`) is set containing the admin's ID and username.

2. **Session validation** — The admin layout middleware reads the session cookie on every request. If the cookie is missing, expired (8-hour max age), or has an invalid signature, the user is redirected to `/admin/login`.

3. **Cookie signing** — The session cookie is HMAC-signed using `ADMIN_SESSION_SECRET`. This prevents tampering — without the secret, a valid cookie cannot be forged.

4. **Logout** — A POST to `/admin/logout` destroys the session cookie and redirects to the login page.

## Architecture

```text
Request → admin layout middleware
           ├── ENABLE_ADMIN !== 'true' → 403 Forbidden
           ├── No ADMIN_SESSION_SECRET → redirect /admin/login
           ├── No valid session cookie → redirect /admin/login
           └── Valid session → set adminUserContext, continue to route
```

Key files:

| File | Purpose |
|------|---------|
| `app/sessions.server.ts` | Cookie session storage factory |
| `app/routes/admin.tsx` | Layout middleware (`requireAdminSession`) |
| `app/routes/admin.login.tsx` | Login page and credential verification |
| `app/routes/admin.logout.tsx` | Session destruction |
| `app/context.ts` | `adminUserContext` (carries admin identity to child routes) |
| `db/adapters/postgres/admin-repository.ts` | `getAdminByUsername`, `updateLastLogin` |

## Setup

### 1. Generate a session secret

```bash
npx -y uuid
```

Or for a longer random string:

```bash
npx -y generate-password --length 64 --numbers --symbols
```

### 2. Configure the secret

**Local development** — Add to `.dev.vars`:

```dotenv
ADMIN_SESSION_SECRET=<paste-your-secret-here>
```

**Production (Cloudflare Workers)** — Set as a Workers secret:

```bash
npx wrangler secret put ADMIN_SESSION_SECRET
```

Paste the secret when prompted. This stores it encrypted and makes it available as `env.ADMIN_SESSION_SECRET` at runtime.

### 3. Ensure ENABLE_ADMIN is set

The admin dashboard requires both `ENABLE_ADMIN=true` and a valid session. Add to `.dev.vars` for local dev:

```dotenv
ENABLE_ADMIN=true
```

For production, set via wrangler:

```bash
npx wrangler secret put ENABLE_ADMIN
```

### 4. Seed the admin user

The default admin user is created by the seed migration:

- **Username:** `admin`
- **Password:** `admin123`

To apply it:

```bash
pnpm db:setup
```

Change the password immediately in production by updating the `password_hash` in the `admin_users` table. Generate a new hash with:

```bash
npx -y bcryptjs admin123
```

Replace `admin123` with your desired password. Then update the database:

```sql
UPDATE admin_users SET password_hash = '<new-hash>' WHERE username = 'admin';
```

## Session Details

| Property | Value |
|----------|-------|
| Cookie name | `__admin_session` |
| Max age | 8 hours |
| HttpOnly | Yes |
| SameSite | Lax |
| Secure | Yes (production only) |
| Session data | `adminId` (number), `adminUsername` (string) |

## Secret Rotation

To rotate the session secret:

1. Generate a new secret (see step 1 above).
2. Update the secret in `.dev.vars` or via `npx wrangler secret put ADMIN_SESSION_SECRET`.
3. All existing sessions are immediately invalidated — admin users will need to log in again.

There is no grace period or multi-secret support, so plan rotations during low-traffic windows.
