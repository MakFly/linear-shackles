# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Always use `bun` (not pnpm/npm/yarn):**

```bash
bun dev              # Dev server on port 3000 (usually already running)
bun run build        # Production build
bun run test         # Run Vitest tests
bun run check        # Prettier + ESLint fix
bun run lint         # ESLint only

# Database (Drizzle + SQLite)
bun run db:push      # Push schema to database
bun run db:generate  # Generate migrations
bun run db:migrate   # Run migrations
bun run db:seed      # Seed with mock data
bun run db:studio    # Open Drizzle Studio

# Full setup
make setup           # Install + db:push + db:seed
```

## Architecture

**Linear Shackles** - A Linear-like issue tracking SaaS with GitHub/GitLab integration.

### Stack

- **Frontend**: React 19 + TanStack Router (file-based routing) + TanStack Query
- **Backend**: TanStack Start with Nitro server functions
- **Database**: SQLite + Drizzle ORM (schema in `src/db/schema/`, data in `data/dev.db`)
- **UI**: shadcn/ui (radix-mira style) + Tailwind CSS 4 + Radix UI primitives

### Key Patterns

**File-based routing** (`src/routes/`):

- `index.tsx` → `/`
- `$projectId.tsx` → dynamic segment `/:projectId`
- `_layout.tsx` → pathless layout wrapper
- Parent layouts MUST have `<Outlet />` for children to render

**Server functions** (`src/server/functions/`):

```typescript
import { createServerFn } from '@tanstack/react-start'

export const getIssues = createServerFn({ method: 'GET' }).handler(async () => {
  return db.select().from(issues)
})

// IMPORTANT: Use .inputValidator() NOT .validator() for input validation
// IMPORTANT: Always use NAMED TYPES (not inline types) in inputValidator
// Inline types cause data to be undefined in the handler!
export const createIssue = createServerFn({ method: 'POST' })
  .inputValidator((issue: NewIssue) => issue) // NewIssue is imported from schema
  .handler(async ({ data: issue }) => {
    /* ... */
  })
```

**Path aliases**: `@/` maps to `src/`

### Directory Structure

```
src/
├── routes/          # File-based routing
├── components/      # React components (ui/ for shadcn)
├── server/
│   ├── db.ts        # Re-exports all functions
│   └── functions/   # Server functions by domain
│       ├── issues.ts
│       ├── projects.ts
│       ├── sprints.ts
│       ├── team.ts
│       ├── updates.ts
│       ├── relationships.ts
│       └── analytics.ts
├── db/
│   ├── index.ts     # Database instance + re-exports
│   ├── seed.ts      # Seed data
│   └── schema/      # Drizzle schemas by domain
│       ├── issues.ts
│       ├── projects.ts
│       ├── sprints.ts
│       ├── team.ts
│       ├── updates.ts
│       ├── templates.ts
│       ├── automations.ts
│       └── analytics.ts
├── hooks/           # Custom hooks (useGitHub, useGitLab, etc.)
├── types/           # TypeScript interfaces
└── lib/             # Utilities (cn for Tailwind classes)
```

### Recommended TanStack Start Architecture (General)

Use this layout for any TanStack Start app to keep routing, data, and UI cleanly separated:

```
src/
├── routes/                 # File-based routes (1 folder per route)
│   ├── index.tsx           # /
│   ├── _layout.tsx         # shared layout(s)
│   ├── sprints/
│   │   ├── index.tsx       # /sprints
│   │   └── $sprintId.tsx   # /sprints/:sprintId
│   └── ...                # more routes
├── features/               # Domain modules (UI + hooks + utils per domain)
│   ├── issues/
│   ├── projects/
│   └── sprints/
├── components/             # Shared UI (ui/ for shadcn)
├── server/
│   ├── db.ts               # Re-export server functions
│   └── functions/          # Server functions per domain
├── db/
│   ├── index.ts            # Drizzle client + exports
│   └── schema/             # Tables per domain
├── hooks/                  # Cross-domain hooks
├── types/                  # Cross-domain types
└── lib/                    # Shared utilities
```

**Routing conventions**

- Prefer folder-based routes (e.g. `src/routes/sprints/index.tsx`).
- Use `_layout.tsx` for nested layouts and ensure it renders `<Outlet />`.
- Route loaders should fetch data via `src/server/db` functions only.

**Server functions**

- Keep CRUD in `src/server/functions/<domain>.ts`.
- Use `createServerFn({ method })` + `.inputValidator(...)`.
- Generate IDs and timestamps on the server (not in the client).

**UI + domain boundaries**

- Put domain-specific components in `src/features/<domain>/`.
- Keep `src/components/` for shared UI primitives only.
- Keep data transforms near the route loader (not inside UI components).

### Domain Models

Issues, Projects, Sprints, TeamMembers, Updates, Templates, Automations - each in `src/db/schema/<domain>.ts`

## Code Style

- **TypeScript arrays**: Use `Array<T>` not `T[]`
- **Formatting**: No semicolons, single quotes, trailing commas (Prettier)
- **Icons**: Phosphor Icons (`@phosphor-icons/react`) and Lucide
- **Forms**: React Hook Form + Zod validation
- **Toasts**: Sonner
- **Drag & drop**: dnd-kit

## Important Notes

- Dev server is typically already running - don't start it
- DevTools (Router + Query) are enabled in development
- Database file at `data/dev.db` - use `db:push` for schema changes during dev
