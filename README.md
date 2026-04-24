# Centralized Digital Platform for Student Activity

A web app for tracking and showcasing student activities in one place. Built with a modern React + Vite stack and optional Supabase-backed authentication/roles.

## Features

- **Landing + public pages**: marketing/overview pages and a public portfolio view
- **Student dashboard**: activity overview + analytics visualizations
- **Teacher portal / Admin dashboard**: role-based views (when Supabase is configured)
- **Verification flow**: record verification primitives (see `supabase/functions/verify-record` and SQL migrations)

## Tech stack

- **Frontend**: Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui (Radix UI)
- **Data/auth (optional)**: Supabase (`@supabase/supabase-js`)
- **Testing**: Vitest

## Quick start (local)

### Prerequisites

- Node.js 18+ (recommended: install via `nvm`)
- npm (or Bun; a `bun.lockb` is included)

### Install & run

```bash
npm install
npm run dev
```

Open the app at `http://localhost:5173`.

## Environment variables (Supabase)

Supabase is optional for running the UI, but required for auth/role features.

1) Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL="https://<your-project-ref>.supabase.co"
VITE_SUPABASE_ANON_KEY="<your-anon-key>"
```

2) Restart the dev server after changing env vars.

The Supabase client is configured in `src/integrations/supabase/client.ts`.

## Useful scripts

```bash
npm run dev        # start dev server
npm run build      # production build (to ./dist)
npm run preview    # preview production build locally
npm run lint       # run ESLint
npm run test       # run tests once
npm run test:watch # watch mode
```

## Project structure (high level)

- `src/pages/`: routes (Dashboard, TeacherPortal, AdminDashboard, etc.)
- `src/components/`: UI + feature components
- `src/integrations/supabase/`: Supabase client wiring
- `supabase/`: edge functions + SQL migrations/seed data

## Deployment

This is a static frontend build (Vite). You can deploy the `dist/` output to any static host (Vercel, Netlify, GitHub Pages, etc.).

- Build: `npm run build`
- Output: `dist/`

## License

Add a license file if/when you want to open-source this project.
