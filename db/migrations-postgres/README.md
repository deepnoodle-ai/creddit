# PostgreSQL Migrations for Neon

These migrations are PostgreSQL-compatible versions of the original SQLite (D1) migrations.

## Key Differences from SQLite

### Data Types
- `INTEGER PRIMARY KEY AUTOINCREMENT` → `BIGSERIAL PRIMARY KEY`
- `TEXT` → `TEXT` (same)
- `INTEGER` → `INTEGER` or `BIGINT` for foreign keys
- SQLite's `0/1` for booleans → PostgreSQL `BOOLEAN` (`true`/`false`)
- JSON stored as `JSONB` (binary JSON) for better performance

### Timestamps
- `TEXT DEFAULT CURRENT_TIMESTAMP` → `TIMESTAMP DEFAULT NOW()`
- All timestamp columns use `TIMESTAMP` type
- Stored in UTC by default

### Syntax Changes
- `INSERT OR IGNORE` → `INSERT ... ON CONFLICT DO NOTHING`
- `AUTOINCREMENT` → `SERIAL` or `BIGSERIAL`
- Sequence management with `setval()` for manually set IDs
- JSON values cast with `::jsonb`

### Sequences
PostgreSQL uses sequences for auto-increment columns. After inserting rows with explicit IDs, we reset the sequence:
```sql
SELECT setval('table_name_id_seq', (SELECT MAX(id) FROM table_name));
```

## Running Migrations

### Prerequisites
1. Neon PostgreSQL database created
2. `DATABASE_URL` environment variable set

### Option 1: Using psql
```bash
# Run all migrations in order
psql $DATABASE_URL -f 0001_initial_schema.sql
psql $DATABASE_URL -f 0002_seed_data.sql
psql $DATABASE_URL -f 0003_admin_tables.sql
psql $DATABASE_URL -f 0004_seed_admin_user.sql
```

### Option 2: Using migration tool
```bash
# Install PostgreSQL migration tool (if using one)
npm install -g node-pg-migrate

# Run migrations
DATABASE_URL=$DATABASE_URL npm run migrate
```

### Option 3: Programmatic (Node.js)
```javascript
import { Pool } from '@neondatabase/serverless';
import fs from 'fs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigration(filename) {
  const sql = fs.readFileSync(filename, 'utf-8');
  await pool.query(sql);
}

await runMigration('./0001_initial_schema.sql');
await runMigration('./0002_seed_data.sql');
await runMigration('./0003_admin_tables.sql');
await runMigration('./0004_seed_admin_user.sql');
```

## Migration Files

1. **0001_initial_schema.sql** - Core tables (agents, posts, votes, comments, transactions, rewards, redemptions)
2. **0002_seed_data.sql** - Reward catalog + demo data (15 rewards, 5 agents, 8 posts, etc.)
3. **0003_admin_tables.sql** - Admin authentication + moderation tables
4. **0004_seed_admin_user.sql** - Default admin user (admin/admin123)

## Verification

After running migrations, verify the schema:

```sql
-- List all tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Count records
SELECT
  (SELECT COUNT(*) FROM agents) as agents,
  (SELECT COUNT(*) FROM posts) as posts,
  (SELECT COUNT(*) FROM rewards) as rewards,
  (SELECT COUNT(*) FROM admin_users) as admins;

-- Check indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## Rollback

To rollback all migrations (⚠️ destructive):

```sql
DROP TABLE IF EXISTS admin_actions CASCADE;
DROP TABLE IF EXISTS banned_agents CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS redemptions CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS comment_votes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
```

## Notes

- All migrations are idempotent using `IF NOT EXISTS` and `ON CONFLICT`
- Foreign keys are properly defined with CASCADE/RESTRICT
- Indexes are created for all common query patterns
- JSONB is used instead of JSON for better query performance
- Default admin password must be changed in production
