# Phase 11 — Deployment

**Branch:** `lakmana-phase-11`
**Target Day:** October 4, 2026
**Depends on:** Phase 10 (Dockerization) ✅
**Status:** ⚪ Not Started

---

## Objective

Deploy the complete application publicly so judges can test it online without needing to pull the repository or run Docker themselves.

## Deployment Architecture

```text
                 Internet
                    │
                    ▼
             ┌─────────────┐
             │   Vercel    │
             │ React/Vite  │
             └──────┬──────┘
                    │
                    │ HTTPS API
                    ▼
             ┌─────────────┐
             │ Render/Fly  │
             │ Express API │
             └──────┬──────┘
                    │
                     │ PostgreSQL
                     ▼
              ┌─────────────┐
              │  Supabase   │
              │ PostgreSQL  │
              └─────────────┘
```

## Tasks

- [ ] **Provision Supabase Database:** Create a production Supabase project. Obtain the **direct connection** URI (port 5432) for running migrations, and the transaction connection pooler for API connections.
- [ ] **Deploy Backend API:** Deploy the Express API to a cloud provider (e.g. Render, Fly.io, or Railway).
  - Configure `DATABASE_URL` to point to Supabase.
  - Set `JWT_SECRET` for the production environment.
  - Expose a public HTTPS URL.
- [ ] **Run Migrations & Seeding:** Run `npx prisma migrate deploy` and seed the production database so demo accounts exist.
- [ ] **Configure CORS:** Ensure the backend Express API allows CORS origins from the upcoming Vercel frontend URL.
- [ ] **Deploy Frontend:** Deploy the React/Vite application to Vercel.
  - Set the environment variable `VITE_API_URL` to point to the deployed Express API HTTPS URL.
- [ ] **E2E Testing:** Verify the complete workflow works end-to-end on the live URLs.

## Test Cases

### TC-11.1 — Public frontend
**Expected:** Public Vercel URL loads perfectly.

### TC-11.2 — Public API
**Expected:** API `/health` endpoint is publicly accessible via HTTPS.

### TC-11.3 — Production login
**Expected:** Demo credentials supplied in the UI or README work flawlessly against the live server.

### TC-11.4 — Production database
**Expected:** Data persists correctly in Supabase.

### TC-11.5 — End-to-end production workflow
**Expected:** Store Order → Dispatcher Plan → Loader → Driver → Delivery → Receipt works successfully in production without console errors.
