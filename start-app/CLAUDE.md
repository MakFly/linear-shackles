# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**CRITICAL: Always use `bun` (never pnpm/npm/yarn) as package manager.**

```bash
# Primary development
bun dev              # Dev server on port 3000 (usually already running)
bun run build        # Production build
bun run test         # Run Vitest tests
bun run check        # Prettier + ESLint fix
bun run lint         # ESLint only
bun add <pkg>        # Add dependency
bun add -D <pkg>     # Add dev dependency

# Database (Drizzle + SQLite)
bun run db:push      # Push schema to database (use during dev)
bun run db:generate  # Generate migrations
bun run db:migrate   # Run migrations
bun run db:seed      # Seed with mock data
bun run db:studio    # Open Drizzle Studio

# Makefile shortcuts (all use bun internally)
make dev            # Start development server
make setup          # Full setup: install + db:push + db:seed
make db-reset       # Reset database (push + seed)
make help           # Show all available commands
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
│   ├── __root.tsx         # Root layout with providers (Outfit, Theme, Query)
│   ├── index.tsx           # /
│   ├── _layout.tsx         # shared layout(s) - must render <Outlet />
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

- Prefer folder-based routes (e.g. `src/routes/sprints/index.tsx`) over file-based.
- Use `_layout.tsx` for nested layouts and ensure it renders `<Outlet />` for children.
- Route loaders should fetch data via `src/server/db` functions only.

**Server functions**

- Keep CRUD in `src/server/functions/<domain>.ts`.
- Use `createServerFn({ method })` + `.inputValidator(...)`.
- **IMPORTANT**: Use `.inputValidator()` NOT `.validator()` for input validation.
- **IMPORTANT**: Always use NAMED TYPES (not inline types) in inputValidator - inline types cause data to be undefined in the handler.
- Generate IDs and timestamps on the server (not in the client).

**UI + domain boundaries**

- Put domain-specific components in `src/features/<domain>/`.
- Keep `src/components/` for shared UI primitives only.
- Keep data transforms near the route loader (not inside UI components).

### Domain Models

Issues, Projects, Sprints, TeamMembers, Updates, Templates, Automations - each in `src/db/schema/<domain>.ts`

### Route Structure Overview

The app uses both top-level routes and project-scoped routes:

**Top-level routes:**

- `/` - Dashboard/home (`src/routes/index.tsx`)
- `/issues` - Issue management
- `/sprints` - Sprint planning
- `/projects` - Project list
- `/team` - Team management
- `/updates` - Updates/activity feed
- `/analytics` - Analytics dashboard
- `/settings` - App settings
- `/github`, `/gitlab` - Provider integrations

**Project-scoped routes (`/projects/$projectId/`):**

- `/projects/$projectId` - Project detail
- `/projects/$projectId/issues` - Project issues
- `/projects/$projectId/analytics` - Project analytics
- `/projects/$projectId/settings` - Project settings
- `/projects/$projectId/github`, `/gitlab` - Project provider integration

**Provider routes:**

- `/provider/github/$owner/$repo` - GitHub repo integration
- `/provider/gitlab/$projectId` - GitLab project integration

## Code Style

**Enforced conventions (via ESLint/Cursor rules):**

- **TypeScript arrays**: Use `Array<T>` not `T[]` (enforced by `@typescript-eslint/array-type`)
- **Formatting**: No semicolons, single quotes, trailing commas (Prettier)
- **Package manager**: Always use `bun`, never pnpm/npm/yarn (see `.cursor/rules/always-use-bun.mdc`)

**Common patterns:**

- **Icons**: Phosphor Icons (`@phosphor-icons/react`) and Lucide
- **Forms**: React Hook Form + Zod validation
- **Toasts**: Sonner
- **Drag & drop**: dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`)
- **Tables**: TanStack Table (`@tanstack/react-table`)
- **Charts**: Recharts
- **Date handling**: date-fns

## Important Notes

- **Dev server**: Typically already running - check before starting
- **DevTools**: TanStack Router DevTools and Query DevTools are enabled in development
- **Database**: SQLite file at `data/dev.db` - use `bun run db:push` for schema changes during dev
- **Route tree**: Auto-generated at `src/routeTree.gen.ts` - don't edit manually
- **Nitro**: Server functions run via Nitro under the hood in TanStack Start

## Critical Patterns to Avoid

### Race Condition with `window.confirm()` and Toasts

**NEVER use `window.confirm()` before showing toasts** - it causes a race condition where the toast notification may not appear.

❌ **Wrong:**

```typescript
const handleDelete = async (id: string) => {
  if (!confirm('Are you sure?')) return // Blocks the thread!
  await deleteItem({ data: id })
  toast.success('Deleted') // May not show!
}
```

✅ **Correct:**

```typescript
const [deleteConfirm, setDeleteConfirm] = useState<Item | null>(null)

const handleDelete = (id: string) => {
  const item = items.find((i) => i.id === id)
  setDeleteConfirm(item) // Open AlertDialog instead
}

const confirmDelete = async () => {
  if (!deleteConfirm) return
  await deleteItem({ data: deleteConfirm.id })
  toast.success('Deleted') // Now it works!
  setDeleteConfirm(null)
}
```

**Why?** `window.confirm()` is synchronous and blocks the browser's event loop, which can prevent toast notifications from rendering properly. Use `AlertDialog` from `@/components/ui/alert-dialog` instead.

**Pattern:**

1. Create state for the item to delete: `const [deleteConfirm, setDeleteConfirm] = useState(null)`
2. On delete click, set the state instead of calling `confirm()`
3. Show `AlertDialog` with the confirmation
4. Call the actual delete function from the `AlertDialogAction` onClick
5. Show toast AFTER the async operation completes
