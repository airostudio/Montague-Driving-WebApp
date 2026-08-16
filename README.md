# Montague

**Safer routes for heavy vehicles.**

Montague is an Australian heavy-vehicle route planning and route-safety platform. Drivers,
dispatchers, fleet managers and company admins enter a truck's dimensions and operating
characteristics, choose an origin and destination, and get a trucking-aware route that has been
checked against known clearance, weight, and access restriction data.

Montague never claims a route is guaranteed safe or legally compliant. Every route is labelled
**Checked**, **Warning**, **Restricted**, or **Unknown**, and drivers/operators remain responsible
for complying with road signage, permits and transport authority requirements.

## Architecture

- **Next.js 16 (App Router) + TypeScript + React 19** — server components by default, client
  components only where interactivity is required (forms, the map, the planner).
- **Tailwind CSS v4** with CSS-variable design tokens (`app/globals.css`) for the visual system.
- **Supabase** — Postgres database, Auth (SSR cookie-based sessions), and Row Level Security for
  all authorization. PostGIS powers route/restriction geospatial matching.
- **Google Maps JavaScript API + Places Autocomplete** on the client for the map and address
  search; **Google Routes API** (`ComputeRoutes`) called only from the server.

```
app/
  (public)/          Marketing site, login, register, forgot password
  (app)/              Authenticated shell: dashboard, planner, trucks, routes, locations, …
  admin/               Platform-admin restriction & data source management
  api/                 Route handlers: routes/calculate, routes/save, trucks, restrictions
components/
  app-shell/ map/ planner/ trucks/ routes/ dashboard/ marketing/ ui/
lib/
  auth/ google/ permissions/ restrictions/ routing/ supabase/ utils/ validation/
supabase/
  migrations/          SQL migrations (extensions, schema, RLS, geospatial matching function)
  seed.sql             Development seed data (companies, trucks, mock restrictions)
types/                 Shared TypeScript types mirroring the database schema
```

### Routing provider abstraction

`lib/routing/google-routes.ts` implements the `RoutingProvider` interface defined in
`lib/routing/types.ts`. All Google Routes API calls are isolated behind this interface so another
commercial truck-routing provider can be added later without touching the calculation pipeline or
API routes.

### Route calculation pipeline

`POST /api/routes/calculate` (see `app/api/routes/calculate/route.ts`) implements:

```
Authenticate → validate request → load truck → verify company ownership →
build vehicle routing profile → request Google trucking route(s) →
decode polyline → find nearby restrictions (PostGIS corridor query) →
validate route against restrictions (lib/routing/validate-route.ts) →
score & rank candidates (lib/routing/score-candidates.ts) →
return best viable route + issues
```

The fastest route is never chosen automatically if it has a confirmed hard restriction — see
`scoreCandidates`/`selectBestCandidate`.

## Prerequisites

- Node.js 20+
- A Supabase project (Postgres 15+, with the `postgis` extension available)
- A Google Cloud project with the **Maps JavaScript API**, **Places API**, and **Routes API**
  enabled, and billing configured

## Supabase setup

1. Create a new Supabase project.
2. In the SQL editor (or via the CLI), run the migrations in `supabase/migrations/` **in order**
   (`0001_...` through `0008_...`). Each file is idempotent-safe to run once on a fresh database.
   Using the Supabase CLI:

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

3. Optionally load development seed data (clearly marked `DEVELOPMENT DATA — NOT FOR OPERATIONAL
   USE`):

   ```bash
   npx supabase db execute --file supabase/seed.sql
   ```

4. Copy your project's **Project URL** and **anon/publishable key** from Project Settings → API
   into `.env.local` (see below). The **service role key** is only needed for privileged
   server-side operations (e.g. future scheduled data imports) — never expose it to the browser.
5. Row Level Security is enabled on every user/company-scoped table by migration `0007_rls.sql`.
   Verify RLS is **on** for all tables in the Supabase dashboard before going to production.

## Google Cloud setup

1. Create (or reuse) a Google Cloud project and enable **billing**.
2. Enable these APIs: **Maps JavaScript API**, **Places API**, **Routes API**.
3. Create two API keys:
   - A **browser key** (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) restricted by **HTTP referrer** to your
     app's domain(s) (and `localhost` for development), and restricted to the Maps JavaScript API
     and Places API.
   - A **server key** (`GOOGLE_MAPS_SERVER_API_KEY`) restricted by **API** to the Routes API only,
     and ideally by server IP if your deployment has a static egress IP. This key is only ever
     read server-side (`app/api/routes/calculate`) and must never be sent to the browser.

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Base URL of the app (used for auth email redirects) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — server-only, never exposed to the client |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Browser-restricted Google Maps key |
| `GOOGLE_MAPS_SERVER_API_KEY` | Server-only Google Routes API key |
| `DEFAULT_HEIGHT_SAFETY_MARGIN_MM` | Default extra clearance required above a restriction's stated height limit (mm) |
| `ROUTE_RESTRICTION_BUFFER_METRES` | Corridor distance used when matching restrictions to a route (metres) |

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the values above
npm run dev
```

Visit `http://localhost:3000`. Register an account, create a company on the onboarding screen, add
a truck, and plan a route.

### Useful commands

```bash
npm run dev      # start the dev server
npm run build    # production build
npm run start    # run the production build
npm run lint     # ESLint
npm run test     # Vitest unit tests (validation engine, scoring, unit conversion, schemas)
npx tsc --noEmit # TypeScript type check
```

## Deployment (Vercel)

1. Import the repository into Vercel.
2. Add all environment variables from `.env.example` in the Vercel project settings.
3. Deploy. The app is a standard Next.js App Router project — no special build configuration is
   required.
4. Update your Supabase Auth **Site URL** and **Redirect URLs** to your production domain, and add
   the production domain to the browser Google Maps key's HTTP referrer restrictions.

## Security notes

- **Row Level Security** is enabled on every company/user-scoped table. Access is always resolved
  server-side from the authenticated user's `profiles` row (via `current_company_id()` /
  `current_role()` SQL helpers) — client-supplied company or user IDs are never trusted.
- The **Supabase service role key** and **Google Maps server key** are read only in server-only
  modules (`lib/supabase/admin.ts`, `lib/routing/google-routes.ts`) and are never included in any
  client bundle.
- `middleware.ts` refreshes the Supabase session and redirects unauthenticated requests away from
  private routes.
- API routes validate all input with Zod, return sanitised error messages (`lib/utils/api-response.ts`),
  and log technical details server-side only.
- A basic in-memory rate limiter (`lib/utils/rate-limit.ts`) protects route calculation from abuse;
  swap it for a shared store (Redis/Upstash) before running multiple server instances.

## Restriction data strategy

The `road_restrictions` table is designed to hold real, sourced restriction data (NHVR datasets,
state transport authority bridge/clearance datasets, council data, closure feeds) with explicit
`source_name`, `source_url`, `verification_status`, and `verified_at` fields, plus a
`data_sources` / `data_import_jobs` pair to track provenance and support scheduled ingestion later.

**No government data is fabricated or bundled with this repository.** `supabase/seed.sql` loads a
small set of illustrative restrictions around Melbourne, explicitly flagged
`is_development_data = true` and labelled `DEVELOPMENT DATA — NOT FOR OPERATIONAL USE` in the UI
and their `source_name`. Replace/supplement this with verified datasets via
`/admin/restrictions` and `/admin/data-sources` (platform admin only) before any operational use.

## Known limitations

- Automated ingestion from government data sources is not implemented — `/admin/data-sources`
  provides the schema and a manual "Run import" action that records a job but performs no
  scraping, per the project's data-integrity requirements.
- Multi-truck/trailer combination building (prime mover + separate trailer records) is modelled in
  the schema (`trailers` table) but the planner currently uses combined truck-profile dimensions.
- The rate limiter is in-memory and per-instance; it resets on restart and isn't shared across
  multiple server instances.
- PWA icons are placeholders (`public/icons/icon.svg`); replace with generated PNG icon sets for
  production app-install support.
- Offline navigation is intentionally out of scope for this MVP.

## Recommended next steps

- Load a verified restriction dataset (e.g. state bridge clearance registers) via
  `/admin/restrictions`, or build an import job against `data_import_jobs`.
- Add automated E2E tests for the full planning journey (Playwright) alongside the existing Vitest
  unit tests.
- Move rate limiting to a shared store for multi-instance deployments.
- Build out trailer-combination selection in the planner (prime mover + trailer → combined profile).
- Add PDF route report export and route-restriction change notifications (see product roadmap in
  the original brief for the full future-architecture list).
