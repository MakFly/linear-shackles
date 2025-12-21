# TanStack Start - Routing Conventions

## 📂 File Structure (`src/routes/`)

TanStack Start follows TanStack Router's file-based routing conventions.

### 🏠 Index Routes
- `index.tsx` ➡ `/`
- `projects.index.tsx` (or `projects/index.tsx`) ➡ `/projects`

### 🌳 Nested Routes & Layouts
- `projects.tsx` ➡ Parent Layout for all `/projects/*` routes. **MUST** contain an `<Outlet />`.
- `projects.index.tsx` ➡ The specific page for `/projects`.
- `projects.$projectId.tsx` ➡ Parent Layout for a specific project `/projects/:projectId/*`.

### 🔡 Dynamic Segments
- Use `$` prefix for dynamic segments: `$projectId.tsx` ➡ `/:projectId`.
- Access in components with `useParams({ from: '...' })`.

### 🕵️ Pathless / Layout-only Routes
- Use `_` prefix for segments that shouldn't appear in the URL.
- `_layout.tsx` or `projects._layout.tsx`.

## 🛠 Fix for the Routing Issue

When you have both `projects.tsx` and `projects/$projectId/...`, `projects.tsx` acts as a mandatory parent layout. If it doesn't have an `<Outlet />`, children like `$projectId` will never render.

**Recommended Fix:**
1. Rename `projects.tsx` to `projects.index.tsx` to make it a standalone page for `/projects`.
2. Move project-specific layouts to `projects.$projectId.tsx`.
