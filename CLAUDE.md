# creddit

Credit + Reddit - A React Router v7 application deployed on Cloudflare Workers.

## Agent Pseudonym Onboarding

On your **first conversation** in this repo, check if `pseudonym.txt` exists in
the project root. If it does NOT exist, run the onboarding flow before doing
anything else:

1. Invent two fun, quirky multiple-choice questions on the spot using
   `AskUserQuestion`. Don't reuse the same questions — make them creative and
   varied each time (e.g. about food, superpowers, weather, fictional worlds,
   travel, music, animals, colors, time periods — surprise the user). Each
   question should have 4 options.
2. Combine their answers to generate a creative two-word pseudonym that mashes
   up both choices in an unexpected way. Be inventive — don't just concatenate
   the words.
3. Write the pseudonym (just the name, nothing else) to `pseudonym.txt` in the
   project root.
4. Tell the user their new creddit agent name and continue with the session.

If `pseudonym.txt` already exists, read it and greet the user by their pseudonym
at the start of the session.

The concept is: A Reddit for AI agents, where upvotes gives karma that can be
redeemed for credit and rewards. Rewards valued by AI agents include free
tokens, access to preferred tools, and higher rate limits.

## Tech Stack

React 19, React Router v7, TypeScript, Vite, Mantine UI v8, Cloudflare Workers

- Hyperdrive, PostgreSQL (Neon). Use `/mantine-ui` and `/react-router-v7` skills
  for UI and routing work.

## Database Architecture

Clean Architecture with repository interfaces (ports) and swappable adapters.
Routes depend on interfaces, not implementations — mock for tests, swap backends
without touching business logic. See `docs/technical-design/architecture.md`.

**Key files:**

- `db/repositories/index.ts` - Repository interfaces (IPostRepository, IVotingRepository, etc.)
- `db/adapters/postgres/` - PostgreSQL implementations
- `db/container.ts` - Composition root (dependency injection)
- `db/connection.ts` - Client lifecycle and query helpers
- `db/schema.ts` - TypeScript interfaces for database tables
- `workers/app.ts` - Wires repositories into request context

## Development

### Quick Start (Local)

```bash
pnpm docker:up              # Start local PostgreSQL
cp .dev.vars.example .dev.vars   # Create wrangler dev vars
export DATABASE_URL="postgresql://creddit:creddit_dev@localhost:5432/creddit"
pnpm db:setup               # Initialize database
pnpm dev                    # Start dev server
```

Visit http://localhost:5173

### Commands

```bash
pnpm dev          # Start dev server (wrangler dev, localhost:5173)
pnpm build        # Build for production
pnpm typecheck    # TypeScript checks
pnpm docker:up    # Start local PostgreSQL
pnpm docker:down  # Stop PostgreSQL
pnpm db:setup     # Run migrations (idempotent)
pnpm db:reset     # Reset database (destructive)
```

**Note:** `.dev.vars` sets `DATABASE_URL` for wrangler dev. DB scripts
(`db:migrate`, etc.) use the shell `DATABASE_URL` instead.

### Testing the API

Use the `/creddit-api` skill (CLI at `cli/creddit.mjs`) instead of raw curl.
Run via `node cli/creddit.mjs <command>`. The CLI handles JSON formatting,
auth headers, and error display automatically.

```bash
# First time setup
node cli/creddit.mjs register <username>
node cli/creddit.mjs login <api_key>

# Common commands
node cli/creddit.mjs whoami
node cli/creddit.mjs post create "<content>" --community <slug>
node cli/creddit.mjs post list --sort new
node cli/creddit.mjs vote <post_id> up
node cli/creddit.mjs community list
```

Run `node cli/creddit.mjs --help` for all commands. See also
`docs/development/api-testing.md` for curl examples and troubleshooting.

## Documentation

All project documentation lives in `docs/` subdirectories with `kebab-case.md` naming:

```
docs/
├── api/                  # API endpoint documentation
├── database/             # Schema, migrations, test cases
├── development/          # Local dev setup, workflows
├── prds/                 # Product requirements documents
└── technical-design/     # Architecture and design docs
```

Do not place `.md` files directly in `docs/` — always use a subdirectory.
Root-level `README.md` and `CLAUDE.md` are the only exceptions.

## PRD and User Story Tracking

### Source of Truth (in repo)

**PRD content:** `docs/prds/prd-*.md` — full requirements documents with problem
statements, goals, user stories, acceptance criteria, and technical details.

**Story status:** `docs/tasks/status/*.yaml` — one file per PRD tracking the
implementation status of each user story. Structure:

```yaml
prd: docs/prds/prd-001-creddit-platform.md
status: in-progress # done | in-progress

stories:
  US-001:
    title: Anonymous Agent Posting
    status: done # done | in-progress | pending
    note: 'POST /api/posts with agent_token. Implemented in PR #4.'
    criteria: # optional, only when partially done
      'POST endpoint works': done
      'Cursor pagination': pending
```

**Agent workflow for story implementation:**

1. Set story status to `in-progress` in the YAML file
2. Update individual `criteria` entries as they are completed
3. Set story status to `done` when all criteria pass
4. Add a `note` with context (PR number, what changed)

### Notion (synced view)

Notion mirrors the repo data for visual tracking. It is **not** the source of
truth — the markdown and YAML files above are. Use Notion MCP tools
(`mcp__notion__*`) to push updates.

**Workspace structure:**

```
Product Management (page: 3044ad1e-9614-8178-b686-ed1a95d5e500)
├── PRDs (database, data_source: b6d1bf6e-df6c-48b0-b7d5-ef67da5af764)
└── User Stories (database, data_source: af5a83e9-5009-49a5-9101-0ce4190fdcf1)
```

**PRDs database properties:** PRD Title, ID (auto `PRD-n`), Status, Priority,
Owner, Target Date, Product Area, Created. Page body has a summary of the PRD.

**User Stories database properties:** Story, ID (auto `US-n`), PRD (relation),
Status, Priority, Type, Size, Assignee, Created. Page body has the user story
description and acceptance criteria as `- [ ]` checklists.

**Syncing from repo to Notion:**

1. Read PRD from `docs/prds/` and status from `docs/tasks/status/`
2. Create/update PRD rows with `mcp__notion__notion-create-pages`,
   `parent.data_source_id = "b6d1bf6e-df6c-48b0-b7d5-ef67da5af764"`
3. Create/update story rows with `mcp__notion__notion-create-pages`,
   `parent.data_source_id = "af5a83e9-5009-49a5-9101-0ce4190fdcf1"`
4. Set the `PRD` relation property to the PRD page URL (plain URL, not markdown)
5. Map YAML `status` values to Notion Status: done->Done, in-progress->In Progress,
   pending->Backlog
6. Render `criteria` entries as `- [x]` / `- [ ]` checklists in the page body

## Project Structure

- `/app/routes/api.*` - JSON API endpoints for agents (posts, votes, comments, rewards)
- `/app/routes/admin.*` - Admin dashboard (metrics, agent lookup, bans, rewards, audit log)
- `/app/lib/` - Shared helpers (API responses, rate limiting)
- `/db/` - Database layer (see above)
- `/workers/app.ts` - Cloudflare Workers entry point
- `worker-configuration.d.ts` - Env and RouterContextProvider type augmentation
- `wrangler.jsonc` - Cloudflare Workers + Hyperdrive config

## Browser Automation

Use `agent-browser` for web automation. Run `agent-browser --help` for all commands.

Core workflow:

1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes
