# Infinity Barbers — Barbershop Booking & Queue Management System (Phase 1 MVP)

An installable, production-ready Progressive Web App (PWA) designed for modern barbershops. Features unified queue management for appointments and walk-ins, role-based dashboards, PostgreSQL Row Level Security, and Supabase Realtime synchronization. Optimized for mobile and flaky internet connections (Zimbabwe, `Africa/Harare` timezone).

---

## Key Features

- **Two Distinct Roles**:
  - **Admin / Receptionist**: Day schedule view across all barbers, create appointments, 1-click walk-in queue insertion, manage service catalog (duration, price), and provision/deactivate barber accounts.
  - **Barber**: Dedicated chair view ("Now Serving", "Up Next", "Later Today", "Completed Today") with one-handed tap actions: _Start Service_, _Complete_, and _No-show_.
- **Unified Fair Queue**: Appointments and walk-ins share one queue per barber. Walk-ins are placed automatically into the next available slot.
- **Database-Level Integrity**:
  - Overlap prevention using PostgreSQL exclusion constraints (`btree_gist` on `tstzrange`).
  - At most **one** client in `in_service` per barber at any given moment.
  - Strict status transition state machine validated by database triggers (`booked` → `waiting` → `in_service` → `done`, etc.).
- **Supabase Realtime**: Queue changes immediately reflect on active dashboards without page refresh.
- **Progressive Web App (PWA)**:
  - Installable on Android, iOS, Windows, macOS, and Linux.
  - Offline fallback showing cached queues with explicit read-only warnings and automatic re-sync upon reconnecting.
  - Custom install prompt (Android/desktop) and iOS Safari installation guide.
  - 1-click update prompt when a new release is deployed.
- **Strict Accessibility (WCAG 2.1 AA)**:
  - Semantic HTML, minimum 44×44px tap targets, high contrast ratios, visible focus outlines, labelled form fields, and `aria-live` queue announcements for screen readers.

---

## Tech Stack

| Layer                    | Technology                                                               |
| ------------------------ | ------------------------------------------------------------------------ |
| **Frontend Framework**   | React 18 + Vite (TypeScript strict mode)                                 |
| **Styling**              | Tailwind CSS 3 (mobile-first, dark/light theme tokens)                   |
| **Routing**              | React Router v6 with lazy route code splitting                           |
| **Server State & Cache** | TanStack Query v5 (`offlineFirst` read mode)                             |
| **Form Handling**        | React Hook Form + Zod schema validation                                  |
| **Backend / Database**   | Supabase: PostgreSQL, Auth, Row Level Security, Realtime                 |
| **Serverless Computing** | Supabase Edge Functions (Deno + Service Role Key security)               |
| **Service Worker & PWA** | `vite-plugin-pwa` + Workbox                                              |
| **Time & Date Handling** | `date-fns` + `date-fns-tz` (stored in UTC, displayed in `Africa/Harare`) |
| **Testing**              | Vitest + React Testing Library (automated unit & component tests)        |

---

## Project Structure

```
infinity-barbers/
├── public/
│   ├── favicon.ico
│   ├── manifest.webmanifest      # PWA manifest specification
│   └── icons/                    # 192x192, 512x512, maskable, apple-touch-icon
├── src/
│   ├── components/
│   │   ├── pages/                # 404 Not Found, 403 Forbidden
│   │   └── ui/                   # Button, Input, Card, Badge, ConfirmDialog, etc.
│   ├── features/
│   │   ├── auth/                 # Login, AuthProvider, AuthGuard, RoleGuard
│   │   ├── admin/                # Admin shell layout, dashboard tabs
│   │   ├── barber/               # Barber dashboard, Now Serving, Up Next, LiveIndicator
│   │   ├── bookings/             # Day view, modals, queue pure logic, useBookings
│   │   ├── barbers/              # Barber roster, Edge Function caller, modal
│   │   ├── services/             # Services catalog CRUD and pricing
│   │   └── pwa/                  # OfflineBanner, InstallBanner, UpdatePrompt, hooks
│   ├── lib/
│   │   ├── supabase.ts           # Typed Supabase client
│   │   ├── database.types.ts     # Schema TypeScript types
│   │   ├── dates.ts              # Africa/Harare timezone conversion & bounds
│   │   ├── phone.ts              # Phone normalisation (+263 E.164)
│   │   ├── constants.ts          # App configuration constants
│   │   └── utils.ts              # cn() Tailwind merger
│   ├── test/                     # Unit and component test suite
│   ├── App.tsx                   # QueryClient + PWA banners + Providers
│   ├── router.tsx                # Role-guarded route definitions
│   └── index.css                 # Base Tailwind styling & focus rings
├── supabase/
│   ├── config.toml               # Local Supabase configuration
│   ├── functions/
│   │   └── create-barber/        # Secure Deno Edge Function (service-role creation)
│   ├── migrations/               # Versioned PostgreSQL migrations
│   │   ├── 00001_extensions_and_types.sql
│   │   ├── 00002_tables.sql
│   │   ├── 00003_triggers.sql
│   │   ├── 00004_rls_policies.sql
│   │   └── 00005_queue_view_and_realtime.sql
│   ├── rls_tests.sql             # SQL verification suite for RLS
│   └── seed.sql                  # Seed data (1 admin, 2 barbers, 4 services, bookings)
├── vercel.json                   # Vercel SPA rewrites & security headers
├── netlify.toml                  # Netlify SPA redirects & security headers
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Local Setup & Development

### 1. Prerequisites

- **Node.js** 20+ and **pnpm** (or npm)
- **Supabase CLI** (`npm install -g supabase`)
- **Docker Desktop** (for running local Supabase)

### 2. Install dependencies

```bash
git clone <repo-url>
cd infinity-barbers
pnpm install
```

### 3. Configure environment variables

Copy the example environment configuration:

```bash
copy .env.example .env.local
```

Fill in your local or hosted Supabase project credentials:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_URL=http://localhost:5173
```

### 4. Start local Supabase and apply migrations

```bash
pnpm supabase start
pnpm supabase db reset
```

This runs all migrations in `supabase/migrations/` and seeds the database with:

- **Shop Admin**: `admin@infinitybarbers.local`
- 4 default services.

### 5. Start the local Edge Function

```bash
# Note: --no-verify-jwt is strictly for local testing. In production, JWT verification must always be ON.
pnpm supabase functions serve create-barber --no-verify-jwt
```

### 6. Run the Vite development server

```bash
pnpm dev
```

Open **`http://localhost:5173`** in your browser.

---

## Testing & Verification

### Run Automated Test Suite

```bash
# Run all unit and component tests
pnpm test

# Run tests with code coverage report
pnpm test:coverage

# TypeScript strict type checking
pnpm typecheck

# ESLint audit (enforces zero warnings)
pnpm lint
```

### Run Row Level Security (RLS) SQL Verification

To verify that barbers cannot read other barbers' clients or bookings, open **Supabase Studio SQL Editor** (`http://localhost:54323`) and execute:

```sql
-- Execute the contents of supabase/rls_tests.sql
```

Verify that all 9 tests report **`PASS`**:

- `TEST 1 — Barber reads own bookings: PASS`
- `TEST 2 — Barber cannot read other barber bookings: PASS`
- `TEST 3 — Admin reads all bookings: PASS`
- `TEST 4 — Barber cannot INSERT booking: PASS`
- `TEST 5 — Illegal transition booked→done blocked: PASS`
- `TEST 6 — Legal transition in_service→done: PASS`
- `TEST 7 — Barber cannot update start_time: PASS`
- `TEST 8 — Duplicate phone rejected: PASS`
- `TEST 9 — Terminal status cannot transition: PASS`

---

## Production Deployment

Never run `supabase/seed.sql` against a production database. Create the first administrator in the Supabase Dashboard, then promote that auth user from the SQL Editor:

```sql
update public.profiles
set role = 'admin', is_active = true
where id = (
  select id
  from auth.users
  where email = 'admin@infinitybarbers.local'
);
```

Use the email for the intended owner/admin account in the SQL query, and run it only in the Supabase project configured in the app's `VITE_SUPABASE_URL`. The signed-in account must have a matching row in `public.profiles` with `role = 'admin'` and `is_active = true`; after changing it, sign out and back in. Do not make a user an admin from the client app.

Turn off public signups in Supabase Authentication settings before deploying.

### 1. Supabase Cloud Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Link your local project:
   ```bash
   pnpm supabase link --project-ref <your-project-ref>
   ```
3. Push database migrations:
   ```bash
   pnpm supabase db push
   ```
4. Deploy the `create-barber` Edge Function:
   ```bash
   pnpm supabase functions deploy create-barber
   ```
   > **Security Requirement**: The `create-barber` Edge Function must be deployed with JWT verification **ON** (default in Supabase CLI; never pass `--no-verify-jwt` outside local development). Configure the `ALLOWED_ORIGINS` environment variable in your Supabase dashboard or secrets (`pnpm supabase secrets set ALLOWED_ORIGINS="https://your-domain.com"`) to enforce origin allowlisting.
   > _(The Edge Function automatically inherits `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` within the Supabase Cloud environment)._

### 2. Frontend Deployment (Vercel)

1. Import the repository into [Vercel](https://vercel.com).
2. Configure Environment Variables in the project settings:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key
3. Deploy!
   - `vercel.json` automatically configures SPA fallback routes and Content Security Policy headers.

### 3. Frontend Deployment (Netlify)

1. Import the repository into [Netlify](https://netlify.com).
2. Set Build Command: `pnpm build`
3. Set Publish Directory: `dist`
4. Add environment variables in Netlify UI:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy!
   - `netlify.toml` handles redirects and security headers.

---

## Security Model & Best Practices

- **Zero Client Secrets**: Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are sent to the client. The `SUPABASE_SERVICE_ROLE_KEY` is exclusively accessed inside the Edge Function.
- **Row Level Security (RLS)**: Enforced directly on PostgreSQL for all 4 tables (`profiles`, `services`, `clients`, `bookings`). UI hiding is never treated as security.
- **PII Minimization**: Only client names and phone numbers are collected. Phones are strictly validated and normalized to E.164.
- **No Console Logging of PII**: Production logger suppresses debug logs and never outputs client credentials.
- **Cache Isolation**: Calling `signOut()` immediately executes `queryClient.resetQueries()` and `queryClient.clear()` to prevent data exposure between user sessions.
- **HTTP Security Headers**:
  - `Content-Security-Policy`: Restricts script and connection domains.
  - `X-Frame-Options: DENY`: Protects against clickjacking.
  - `X-Content-Type-Options: nosniff`: Prevents MIME-sniffing exploits.

---

## PWA & Offline Standards

- **App Manifest**: Fully compliant with modern PWA criteria (`display: standalone`, `theme_color: #f59e0b`, standard + maskable icons).
- **Offline Fallback**: TanStack Query's `offlineFirst` mode serves previously loaded queues from disk when connectivity drops.
- **Write Guard**: Any write action attempted while offline displays an immediate warning banner rather than failing silently.
- **Automatic Re-sync**: When internet connectivity returns, Supabase Realtime automatically reconnects and synchronizes fresh queue state.

---

## Known Phase 1 Limitations

The following capabilities are deliberately excluded from Phase 1 (MVP) per project specifications:

1. **Client Self-Booking Web Portal**: Clients cannot currently book themselves online; all bookings are entered by the receptionist/admin. (Scheduled for Phase 2).
2. **Automated SMS & WhatsApp Reminders**: No automated notifications are sent upon appointment confirmation. (Scheduled for Phase 2 via Twilio/Africa's Talking integration).
3. **Payments & Cash Register**: Payment records and POS terminal integrations are not included. (Scheduled for Phase 2).
4. **Multi-Branch Support**: Phase 1 assumes a single shop location. (Phase 2 will introduce `branch_id` across tables).
5. **Client History & Barber Preference Notes**: Past haircut notes and preference logs are scheduled for Phase 2.
6. **Web Push Notifications**: Push notifications to offline devices are deferred to Phase 2 (Phase 1 uses in-app Realtime toasts and `aria-live` screen-reader announcements).
