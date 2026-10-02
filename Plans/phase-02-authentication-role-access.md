# Phase 2 — Authentication + Role Access

**Branch:** `lakmana-phase-02`
**Target Day:** October 2, 2026
**Status:** 🟢 Implemented (2026-10-02) — backend TC-2.1–2.5 verified via API tests; frontend builds clean (0 TS errors); awaiting commit approval

---

## Objective

Implement real authentication using JWT. This includes password hashing, login endpoints, JWT generation and middleware, a `/me` endpoint for session restoration, role-based middleware to protect API routes, frontend login integration, and role-based routing on the frontend.

---

## End-of-Phase Definition of Done

```
✅ Passwords are hashed in the database
✅ POST /auth/login returns a valid JWT for valid credentials
✅ GET /me (or /auth/me) returns the authenticated user's information
✅ API routes are protected by JWT and role middleware
✅ Frontend integrates with the login API
✅ Frontend implements role-based routing (e.g., driver cannot access dispatcher routes)
✅ All TC-2.x test cases pass
```

---

## Repository Structure Updates

```
Tri-athon/
├── api/
│   └── src/
│       ├── controllers/
│       │   └── authController.ts
│       ├── middleware/
│       │   ├── authMiddleware.ts
│       │   └── roleMiddleware.ts
│       └── routes/
│           └── auth.ts
└── apps/
    └── web/
        └── src/
            ├── context/
            │   └── AuthContext.tsx
            ├── services/
            │   └── api.ts
            └── App.tsx (Updated with React Router)
```

---

## Step-by-Step Tasks

### TASK 2.1 — Install Authentication Dependencies

```bash
cd api
npm install jsonwebtoken
npm install -D @types/jsonwebtoken
```
*(Note: `bcryptjs` was already installed in Phase 1)*

### TASK 2.2 — Authentication Utilities (JWT Generation)

Create utilities for generating JWTs and verifying them using the `JWT_SECRET` from `.env`.

### TASK 2.3 — Authentication API Endpoints

Create `POST /auth/login`:
- Look up user by email
- Compare provided password with `passwordHash` using `bcryptjs`
- Generate and return JWT
- Return user details (without password hash)

Create `GET /me` (or `GET /auth/me`):
- Extract JWT from `Authorization` header
- Verify JWT
- Return user details

### TASK 2.4 — Express Middleware

Create `authMiddleware`:
- Verify JWT in `Authorization` header
- Attach decoded user ID/Role to `req.user`

Create `roleMiddleware`:
- Check if `req.user.role` is in the allowed roles array.

### TASK 2.5 — Frontend API Client Setup

Setup `apps/web/src/services/api.ts`:
- Configure an axios instance or fetch wrapper.
- Automatically attach the JWT token (from `localStorage` or `sessionStorage`) to the `Authorization: Bearer <token>` header of every request.

### TASK 2.6 — Frontend Authentication Context

Create `AuthContext` to hold the current user state and provide `login` and `logout` functions to the application.
On mount, the context should attempt to fetch `GET /me` to restore a session if a token exists in storage.

### TASK 2.7 — Frontend Login Screen Integration

Update the existing Figma UI login screen to call the `login` function in `AuthContext` with the provided email and password.
Handle loading states and error messages (e.g., "Invalid credentials").

### TASK 2.8 — Role-based Routing

Implement React Router in the frontend to handle navigation.
Protect routes based on the authenticated user's role:
- Driver: `/driver/*`
- Dispatcher: `/dispatcher/*`
- Loader: `/loader/*`
- Store Manager: `/store/*`

---

## Test Cases

### TC-2.1 — Valid login

**Action:** Submit correct credentials to `POST /auth/login`.
**Expected:** Correct credentials return JWT and user details.

### TC-2.2 — Invalid password

**Action:** Submit valid email but incorrect password.
**Expected:** Login rejected with HTTP 401 Unauthorized.

### TC-2.3 — Unknown user

**Action:** Submit non-existent email.
**Expected:** Login rejected with HTTP 401 Unauthorized.

### TC-2.4 — `/me` endpoint

**Action:** Request `GET /me` with a valid JWT.
**Expected:** Authenticated user information returned.

### TC-2.5 — Role protection

**Action:** Send a request to a dispatcher-only endpoint using a driver's JWT.
**Expected:** Request rejected with HTTP 403 Forbidden.

### TC-2.6 — Session persistence

**Action:** Log in, then refresh the browser.
**Expected:** Authenticated session remains available according to the chosen session strategy (token from storage is used to fetch `/me`).

---

## Commit Sequence (get approval from user)

```bash
git add api/package.json api/package-lock.json
git commit -m "chore(api): add jsonwebtoken dependency"

git add api/src/controllers/authController.ts api/src/routes/auth.ts
git commit -m "feat(api): implement login and me endpoints"

git add api/src/middleware/
git commit -m "feat(api): add auth and role middleware"

git add apps/web/src/services/api.ts apps/web/src/context/AuthContext.tsx
git commit -m "feat(web): setup api client and auth context"

git add apps/web/
git commit -m "feat(web): integrate login screen and role-based routing"
```
