# AGENTS.md

Guidelines for agents working in this repo.

## Best-practice TanStack Start Architecture

Use a route-first, domain-focused structure that scales:

```
src/
├── routes/                 # File-based routes (1 folder per route)
│   ├── index.tsx           # /
│   ├── _layout.tsx         # shared layout(s)
│   ├── sprints/
│   │   ├── index.tsx       # /sprints
│   │   └── $sprintId.tsx   # /sprints/:sprintId
│   └── ...
├── features/               # Domain modules (UI + hooks + utils)
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

## Routing conventions

- Prefer folder-based routes (`src/routes/<route>/index.tsx`).
- Use `_layout.tsx` for nested layouts, and render `<Outlet />`.
- Route loaders should use server functions from `src/server/db`.

## Server functions

- CRUD lives in `src/server/functions/<domain>.ts`.
- Use `createServerFn({ method })` and `.inputValidator(...)`.
- Generate IDs and timestamps on the server.

## UI & data flow

- Domain UI belongs in `src/features/<domain>/`.
- Shared UI primitives live in `src/components/`.
- Keep transforms near the route loader; keep components dumb.
