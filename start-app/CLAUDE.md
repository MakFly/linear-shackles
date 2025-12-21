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
- **Database**: SQLite + Drizzle ORM (schema in `src/db/schema.ts`, data in `data/dev.db`)
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
export const createIssue = createServerFn({ method: 'POST' })
  .inputValidator((issue: NewIssue) => issue)
  .handler(async ({ data: issue }) => { /* ... */ })

// Calling server functions with data - use { data: ... } wrapper if data is undefined
await myServerFn({ data: myInput })
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
├── db/              # Schema, seed, database instance
├── hooks/           # Custom hooks (useGitHub, useGitLab, etc.)
├── types/           # TypeScript interfaces
└── lib/             # Utilities (cn for Tailwind classes)
```

### Domain Models
Issues, Projects, Sprints, TeamMembers, Updates, IssueRelationships - all defined in `src/db/schema.ts`

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
