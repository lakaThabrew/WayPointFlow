# Phase 10 — Dockerization

**Branch:** `lakmana-phase-10`
**Target Day:** October 4, 2026
**Status:** ✅ Done

---

## Objective

Make the application reproducible locally. A judge must be able to run the complete system with seed data from a single command, without any external accounts or credentials.

---

## Implementation Steps Completed

### 1. Web Service Dockerfile
- Created a multi-stage Dockerfile in the project root to build the Vite frontend using Node and serve it with Nginx.
- Set `VITE_API_URL=/api` during the build step so that the production build routes all API calls to the `/api` path.

### 2. Nginx Configuration
- Added `nginx.conf` to serve the static SPA files.
- Configured a reverse proxy under `location /api/` that strips the `/api` prefix and forwards requests to `http://api:4000`.

### 3. Docker Compose Orchestration
- Updated `docker-compose.yml` to include the `web` service.
- Linked `web` to depend on `api`.
- Exposed the application on port `8080`.

### 4. Docker Ignore Rules
- Created `.dockerignore` files for both the frontend and the backend to exclude `node_modules`, `.env`, and build outputs, ensuring a clean and fast Docker build process.

---

## Test Cases Addressed

| Test Case | Description | Status |
|---|---|---|
| **TC-10.1** | Web and API images build successfully | ✅ `docker compose build` → `waypoint-web:latest` (93.5 MB), `waypoint-api:latest` (852 MB) |
| **TC-10.2** | `docker compose up --build` starts db, api and web | ✅ Health-gated order observed: db Healthy → api Healthy → web Started |
| **TC-10.3** | API health endpoint responds | ✅ `GET :4000/health` → `{"status":"ok"}` |
| **TC-10.4** | Web application loads through Docker | ✅ `GET :8080/` → HTTP 200, `<title>WaypointFlow`; `GET :8080/api/health` → `{"status":"ok"}` |
| **TC-10.5** | Standalone seed auto-populates demo credentials | ✅ Entrypoint ran `dist/prisma/seed.js`; `POST :8080/api/auth/login` as `ashan@waypoint.lk` / `demo1234` → 200, DISPATCHER token |
| **TC-10.6** | No external dependency required (Supabase isn't touched locally) | ✅ Only db/api/web services; `DATABASE_URL` points at the compose `db` service |

### Defects found and fixed during the audit

| Defect | Fix |
|---|---|
| `vite.config.ts` statically imported the generated `./.figma/make/site.json`, so `tsc`/Vite build failed whenever that artifact was absent | Optional runtime load with a WaypointFlow fallback (title, description, language, bypass links) |
| The tracked `.figma/make/*` files (9, incl. `site.json`) were missing from the working tree, leaving the build broken and staging deletions | Restored from `HEAD`; the web build now works whether the config is present or absent |
| `prisma` was a devDependency, so `npm ci --omit=dev` omitted the CLI and the container entrypoint's `prisma migrate deploy` would fail | `prisma` moved to production dependencies; `api/package-lock.json` regenerated so all 8 prisma-tree entries are non-dev |
| `@prisma/client` postinstall ran before `schema.prisma` existed in the runtime stage | `COPY prisma ./prisma` moved ahead of `npm ci --omit=dev` |
| Alpine images lack OpenSSL/libc needed by the Prisma query engine | `apk add --no-cache openssl libc6-compat` in both API stages |
| `web` started before the API was serving, and nothing detected a dead API | API healthcheck added; `web` now depends on `api: condition: service_healthy` |
| Root Docker context shipped the whole repo | `.dockerignore` extended (`api`, `Plans`, `docs`, `*.md`, `.github`, `.mise.toml`, …) |
| CI never type-checked, and `npm run build` skipped `tsc` | `build` is now `tsc --noEmit && vite build`; CI runs `npm run typecheck` |
