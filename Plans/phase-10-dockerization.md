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
| **TC-10.1** | Web and API images build successfully | ✅ Passed |
| **TC-10.2** | `docker compose up --build` starts db, api and web | ✅ Passed |
| **TC-10.3** | API health endpoint responds | ✅ Passed |
| **TC-10.4** | Web application loads through Docker | ✅ Passed |
| **TC-10.5** | Standalone seed auto-populates demo credentials | ✅ Passed |
| **TC-10.6** | No external dependency required (Supabase isn't touched locally) | ✅ Passed |
