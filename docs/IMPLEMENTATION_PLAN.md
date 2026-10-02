# WaypointFlow — Hackathon Implementation Plan

**Project:** WaypointFlow
**Team:** EchoBinary
**Phase:** Hackathon Implementation
**Start Date:** October 2, 2026
**Submission Deadline:** October 4, 2026 — 23:59 SLST
**Primary Goal:** Convert the approved Figma prototype into a functional, deployed, end-to-end logistics management application.

---

# 1. Hackathon Objective

The objective of this implementation is to transform the existing WaypointFlow UI prototype into a working product that demonstrates the complete logistics workflow:

**Store Manager → Dispatcher → Loader → Driver → Store Manager**

The implementation must include:

* Real authentication
* Role-based access
* Real database persistence
* Order creation
* Dispatch planning
* Constraint/conflict detection
* Order deferral
* Trip management
* Loading verification
* Driver route execution
* Proof of delivery
* Offline driver actions
* Synchronization after reconnecting
* Receipt/order tracking
* Alerts
* Responsive UI
* Dockerized local deployment
* Public cloud deployment

The existing Figma design should remain the visual source of truth. Functional implementation should be added without unnecessary redesign.

---

# 2. Important Implementation Constraints

## 2.1 Database

Use **PostgreSQL** everywhere, via Prisma. Two environments, one schema:

* **Local development + Docker:** containerized PostgreSQL (`postgres:16`) run by `docker-compose.yml`. The compose stack must run the complete app with seed data standalone — no external credentials or accounts required. This is a submission requirement ("a single docker-compose file for running the app with seed data").
* **Production:** **Supabase PostgreSQL**. The same Prisma schema and migrations run against Supabase; only `DATABASE_URL` changes.

Supabase will provide (production only):

* PostgreSQL database
* Database management
* Production persistence
* Easy deployment
* Optional future support for Supabase Storage

The application backend connects through the `DATABASE_URL` environment variable, so switching between the local container and Supabase requires no code change.

---

## 2.2 Dataset

The separate dataset/CSV implementation is **not part of this hackathon implementation**.

Do not depend on:

* `outlets.csv`
* `vehicles.csv`
* `calendar.csv`
* `district_travel.csv`
* `service_allowance.csv`
* Any external dataset
* Dataset preprocessing scripts

Instead, create a **small deterministic demo dataset using application seed data**.

The demo data should contain only the minimum entities required to demonstrate the complete workflow.

The seed data must be stored as application seed fixtures rather than depending on external CSV files.

Two small reference fixtures are exempt from the "minimum entities" rule because the planning engine cannot function without them: `district_travel` (travel minutes per district/depot) and `service_allowance` (handling minutes per brand/dock type). Include only the rows needed by the demo districts and brands. (Full CSV-based data and the Datathon models arrive in the next phase.)

---

# 3. Technology Stack

## Frontend

* React
* TypeScript
* Vite
* React Router
* Existing Figma-generated UI
* IndexedDB for offline driver actions
* PWA support where practical

## Backend

* Node.js
* Express
* TypeScript
* Prisma ORM
* JWT authentication
* REST API

## Database

* PostgreSQL (Prisma ORM)
* Local/Docker: `postgres:16` container via docker-compose
* Production: Supabase PostgreSQL

## Deployment

* Frontend: Vercel
* Backend: Render/Railway/other suitable Node hosting
* Database: Supabase

## Local Development

* Docker
* Docker Compose

---

# 4. Repository Structure

```text
Tri-athon/
│
├── README.md
├── plan.md
├── AI_DISCLOSURE.md
├── docker-compose.yml
├── .gitignore
│
├── document/
│   ├── architecture.md
│   ├── data-model.md
│   └── design-deviations.md
│
├── apps/
│   └── web/
│       ├── src/
│       ├── public/
│       ├── package.json
│       ├── vite.config.ts
│       └── Dockerfile
│
└── api/
    ├── src/
    │   ├── index.ts
    │   ├── auth.ts
    │   ├── middleware/
    │   ├── routes/
    │   ├── services/
    │   └── utils/
    │
    ├── prisma/
    │   ├── schema.prisma
    │   └── seed.ts
    │
    ├── package.json
    ├── tsconfig.json
    └── Dockerfile
```

---

# 5. Core User Roles

The system will support four primary roles.

## Store Manager

Responsibilities:

* Create orders
* Review submitted orders
* Track orders
* View delivery status
* Confirm receipt
* Report delivery issues

## Dispatcher

Responsibilities:

* View order queue
* Review planning conflicts
* Run allocation
* Defer orders
* Release trips
* Monitor live operations

## Loader

Responsibilities:

* View loading queue
* View trip manifest
* Verify loaded quantities
* Report shortages
* Mark trip ready

## Driver

Responsibilities:

* View assigned route
* Start/arrive at stops
* Complete deliveries
* Capture proof of delivery
* Report delivery issues
* Operate while offline
* Synchronize events after reconnecting

---

# 6. Core Data Model

The database will contain the following core entities.

## Users

```text
users
- id
- email
- password_hash
- role
- name
- depot
- outlet_id
- phone
- created_at
```

Roles:

```text
STORE_MANAGER
DISPATCHER
LOADER
DRIVER
```

---

## Outlets

```text
outlets
- id
- name
- brand
- district
- depot
- dock_type             (REAR_DOCK | CURB | MALL_BAY)
- parking_constraint    (NONE | VAN_ONLY)
- mall_window_open      (nullable — set only for mall outlets)
- mall_window_close     (nullable)
- window_open
- window_close
- created_at
```

Only a small number of demo outlets are required, but the demo set must include at least one `VAN_ONLY` outlet and one mall outlet so the corresponding constraint rules can be demonstrated.

---

## Vehicles

```text
vehicles
- id
- registration_no
- type                (TRUCK | VAN)
- temperature_type    (REEFER | AMBIENT)
- max_weight_kg
- max_volume_m3
- fuel_type
- km_per_l
- weekly_fuel_quota_l
- depot
- active
```

`weekly_fuel_quota_l` and `km_per_l` implement the booklet's weekly fuel allowance: planned route kilometres divided by `km_per_l` consume the quota.

---

## Orders

```text
orders
- id
- outlet_id
- brand
- district
- depot
- temperature_requirement
- units
- weight_kg
- volume_m3
- window_open
- window_close
- delivery_date
- status
- created_by
- created_at
- updated_at
```

Order status:

```text
NEW
CONFIRMED
PLANNED
LOADING
IN_TRANSIT
DELIVERED
DEFERRED
AT_RISK
```

---

## Trips

```text
trips
- id
- vehicle_id
- trip_number
- date
- brand
- district
- status
- planned_departure
- created_at
```

---

## Trip Stops

```text
trip_stops
- id
- trip_id
- order_id
- outlet_id
- sequence
- planned_arrival
- actual_arrival
- arrived_at
- left_at
- status
```

---

## Proof of Delivery

```text
proof_of_delivery
- id
- stop_id
- receiver_name
- signature_note
- photo_url            (nullable — unused in MVP)
- recorded_at
- synced
```

MVP proof of delivery = receiver name + signature note only; photo storage is deferred and recorded in `document/design-deviations.md`.

---

## Deferrals

```text
deferrals
- id
- order_id
- reason
- decided_by
- decided_at
```

Every deferred order must have a recorded reason.

---

## Loading Events

```text
loading_events
- id
- trip_id
- order_id
- loaded_qty
- expected_qty
- shortfall_flag
- created_by
- created_at
```

---

## Sync Events

```text
sync_events
- id
- client_uuid
- role
- payload_json
- created_offline_at
- synced_at
```

---

## District Travel (reference fixture)

Small seed fixture so the trip-time rules can be evaluated without the external dataset.

```text
district_travel
- id
- district
- depot
- depot_to_district_freeflow_min
- inter_stop_freeflow_min
```

---

## Service Allowance (reference fixture)

Standard handling-time allowance per brand and dock type (a planning allowance, not an observed duration).

```text
service_allowance
- id
- brand
- dock_type
- service_allowance_min
```

---

# 7. Planning Constraint Engine

The allocator must provide deterministic and explainable planning decisions.

The planning service will implement the following rules.

## Rule 1 — Vehicle Weight Capacity

Total order weight must not exceed vehicle capacity.

```text
total_weight <= vehicle.max_weight_kg
```

---

## Rule 2 — Vehicle Volume Capacity

Total order volume must not exceed vehicle capacity.

```text
total_volume <= vehicle.max_volume_m3
```

Both conditions must pass.

---

## Rule 3 — Temperature Compatibility

Chilled/frozen orders require reefer vehicles.

Ambient orders may be carried by normal vehicles or reefers.

---

## Rule 4 — Brand Consistency

A trip may contain orders from only one brand.

---

## Rule 5 — District Consistency

A trip may contain orders from only one district.

---

## Rule 6 — Maximum Trips

A vehicle may perform a maximum of two trips per day.

---

## Rule 7 — Van-Only Access

Outlets marked van-only cannot be served by trucks.

```text
outlet.parking_constraint == VAN_ONLY  ⇒  vehicle.type == VAN
```

---

## Rule 8 — Mall Access Window

Mall outlets accept deliveries only within the mall's fixed access window. The planned arrival at a mall outlet must fall within `mall_window_open`–`mall_window_close`.

---

## Rule 9 — Trip-Time Calculation

Trip time uses the published planning standard:

```text
trip_time = depot_to_district_freeflow_min
          + (n − 1) × inter_stop_freeflow_min
          + Σ service_allowance_min(brand, dock_type of each stop)
```

where `n` = number of stops in the trip. Values come from the `district_travel` and `service_allowance` seed fixtures.

---

## Rule 10 — Fresh Delivery Time Budget

Fresh trips must fit within the pre-dawn window:

```text
trip_time <= 270 minutes   (Fresh / pre-dawn)
```

---

## Rule 11 — Normal Delivery Time Budget

Other trips must fit within the daytime window:

```text
trip_time <= 480 minutes   (daytime)
```

Per vehicle per day, the sum of Fresh trip times must stay within 270 minutes and the sum of other trip times within 480 minutes.

---

## Rule 12 — Weekly Fuel Quota

Planned route distance consumes the vehicle's weekly fuel allowance:

```text
weekly_litres_used + (route_km / km_per_l) <= weekly_fuel_quota_l
```

If fuel-economy data is missing for a demo vehicle, assume a conservative default and record the assumption in `document/design-deviations.md`.

---

## Rule 13 — Deferral

If an order cannot be allocated because of capacity or constraint violations:

```text
status = DEFERRED
```

The system must store a human-readable reason.

Example:

```text
Vehicle capacity exceeded
No compatible reefer available
Trip time budget exceeded
No compatible vehicle
Van-only outlet — no van available
Mall access window cannot be met
Weekly fuel quota exceeded
```

---

# 8. Planning Strategy

The initial allocator will use a deterministic greedy strategy.

Orders will be considered according to:

1. Previously deferred orders
2. Tightest delivery window
3. Fresh orders
4. Remaining orders

Orders will then be grouped by:

```text
brand + district
```

The allocator will select the smallest feasible vehicle.

Every allocation result must contain an explanation.

Example:

```text
Allocated:
Order #ORD-102
Vehicle: WP-03
Reason:
- Weight within capacity
- Volume within capacity
- Temperature compatible
- Same brand
- Same district
- Trip duration within budget
```

---

# 9. API Design

## Authentication

```http
POST /auth/login
GET /me
```

---

## Store Manager

```http
POST /orders
GET /orders
GET /orders/:id
POST /receipts/:stopId
```

---

## Dispatcher

```http
GET /orders/queue
POST /planning/allocate
POST /planning/close
GET /planning/conflicts
POST /orders/:id/defer
POST /trips/:id/release
GET /live
GET /alerts
```

---

## Loader

```http
GET /loading/queue
GET /trips/:id/manifest
POST /loading/events
POST /trips/:id/ready
```

---

## Driver

```http
GET /driver/route
POST /stops/:id/arrive
POST /stops/:id/complete
POST /stops/:id/issue
POST /sync
```

---

# 10. Frontend Implementation

The existing Figma UI will be reused.

> **Note:** the current prototype navigates with an in-memory screen state machine (no URLs). Converting to React Router means mapping each screen id to a path and moving cross-screen state (e.g. `selectedOrderId`) into route params/query. Budget extra time for this refactor and verify each role flow after conversion.

## Frontend Tasks

### Router

Implement routes such as:

```text
/login

/store/orders
/store/orders/new
/store/orders/:id
/store/tracking

/dispatcher/planning
/dispatcher/conflicts
/dispatcher/live

/loader/queue
/loader/trips/:id

/driver/route
/driver/stops/:id

/receipt/:id
```

---

## API Client

Create:

```text
src/services/api.ts
```

The API client must provide typed functions for:

* Login
* Current user
* Orders
* Planning
* Trips
* Loading
* Driver actions
* Proof of delivery
* Sync
* Alerts

---

# 11. Authentication

Implement real login using:

```text
POST /auth/login
```

Passwords must never be stored in plain text.

Use password hashing.

JWT will be used for authenticated API requests.

The frontend stores the authenticated session securely enough for the hackathon architecture and automatically attaches the token to API requests.

---

# 12. Demo Users

Create deterministic seed users. Use the identities already shown in the approved login screen design (do not redesign the screen to accommodate new emails):

```text
Dispatcher
email: ashan@waypoint.lk
password: demo1234

Loader
email: ruwini@waypoint.lk
password: demo1234

Driver
email: kasun.p@waypoint.lk
password: demo1234

Store Manager
email: chamari@waypoint.lk
password: demo1234
```

These credentials must be documented in the README.

---

# 13. Demo Seed Data

Do not use the external dataset.

Create a small controlled demo environment.

Minimum recommended data:

```text
4 users
4–6 outlets (incl. ≥1 van_only, ≥1 mall outlet)
3–4 vehicles (incl. ≥1 van, ≥1 reefer)
district_travel rows for each demo district + depot
service_allowance rows for each demo brand + dock_type
5–8 orders
2 trips
3–5 trip stops
```

The demo data should intentionally include:

* One normal order
* One fresh order
* One order requiring a reefer
* One order that causes a capacity conflict
* One van_only order (servable only by a van)
* One mall order (servable only inside the mall access window)
* One deferred order with a recorded reason
* One completed delivery
* One loading shortfall scenario

This allows the complete product workflow to be demonstrated without relying on a large dataset.

---

# 14. Offline Driver Architecture

The driver application must support basic offline operation.

When offline:

```text
Driver Action
      ↓
IndexedDB
      ↓
Local Outbox
      ↓
Connection Restored
      ↓
POST /sync
      ↓
Server Database
```

Offline actions include:

* Arrival
* Delivery completion
* Proof of delivery
* Delivery issue

Each event must have a unique client UUID to prevent duplicate synchronization.

---

# 15. Phase-Based Implementation

# PHASE 0 — Project Baseline

## Objective

Establish the repository and preserve the current prototype.

## Tasks

* Initialize Git repository.
* Create `.gitignore`.
* Move the existing web application into `apps/web`.
* Remove unnecessary Figma Make runtime dependencies.
* Verify existing application starts.
* Verify production build.
* Create `plan.md`.
* Create documentation folder.

## Completion Criteria

```text
npm install
npm run dev
npm run build
```

must succeed.

## Test Cases

### TC-0.1 — Application starts

**Action:** Run development server.

**Expected:** Application loads successfully.

### TC-0.2 — Production build

**Action:** Run build.

**Expected:** Build completes without errors.

### TC-0.3 — Existing UI

**Action:** Open primary screens.

**Expected:** Existing Figma UI remains visually intact.

### TC-0.4 — Git baseline

**Action:** Check repository.

**Expected:** Initial baseline commit exists.

---

# PHASE 1 — Supabase Database + Backend Foundation

## Objective

Create the real backend and connect it to Supabase.

## Tasks

* Create Express TypeScript API.
* Configure Prisma.
* Create Prisma schema.
* Start local PostgreSQL via `docker compose up db` (development default).
* Create Supabase PostgreSQL project (production).
* Configure `DATABASE_URL` per environment.
* Run migrations.
* Create seed script (demo fixtures incl. `district_travel` + `service_allowance`).
* Add health endpoint.

Endpoint:

```http
GET /health
```

Expected:

```json
{
  "status": "ok"
}
```

## Test Cases

### TC-1.1 — Database connection

**Action:** Start API.

**Expected:** API connects successfully to Supabase.

### TC-1.2 — Migration

**Action:** Run Prisma migration.

**Expected:** All required tables are created.

### TC-1.3 — Seed

**Action:** Run seed.

**Expected:** Demo users, outlets, vehicles and orders are created.

### TC-1.4 — Health endpoint

**Action:** `GET /health`

**Expected:** HTTP 200.

### TC-1.5 — Data persistence

**Action:** Create a record, restart API, retrieve record.

**Expected:** Record remains available.

---

# PHASE 2 — Authentication + Role Access

## Objective

Implement real authentication.

## Tasks

* Password hashing.
* Login endpoint.
* JWT generation.
* JWT middleware.
* `/me` endpoint.
* Role middleware.
* Frontend login integration.
* Role-based routing.

## Test Cases

### TC-2.1 — Valid login

**Expected:** Correct credentials return JWT.

### TC-2.2 — Invalid password

**Expected:** Login rejected with HTTP 401.

### TC-2.3 — Unknown user

**Expected:** Login rejected.

### TC-2.4 — `/me`

**Expected:** Authenticated user information returned.

### TC-2.5 — Role protection

**Action:** Driver accesses dispatcher endpoint.

**Expected:** Request rejected.

### TC-2.6 — Session persistence

**Action:** Refresh browser.

**Expected:** Authenticated session remains available according to the chosen session strategy.

---

# PHASE 3 — Store Manager Order Flow

## Objective

Implement the first complete business workflow.

```text
Login
 ↓
Store Dashboard
 ↓
Create Order
 ↓
Review
 ↓
Submit
 ↓
Order Queue
```

## Tasks

* Order creation API.
* Order validation.
* **Order cutoff enforcement** — orders placed before the daily cutoff (default 18:00, configurable) enter the next planning cycle; orders placed after the cutoff roll to the following delivery day. `POST /planning/close` locks the queue.
* Order status management.
* Frontend order form integration.
* Order review screen.
* Order history.
* Tracking screen.

## Test Cases

### TC-3.1 — Create valid order

**Expected:** Order created with `NEW` status.

### TC-3.2 — Required field validation

**Expected:** Missing required fields prevent submission.

### TC-3.3 — Invalid quantity

**Expected:** Invalid quantity rejected.

### TC-3.4 — Order persistence

**Expected:** Created order appears after page refresh.

### TC-3.5 — Store isolation

**Expected:** Store manager cannot access another store's private order creation context.

### TC-3.6 — Status display

**Expected:** Order status shown correctly.

### TC-3.7 — Cutoff enforcement

**Input:** Order submitted after the daily cutoff.

**Expected:** Order is accepted but scheduled for the following delivery day, and this is visible to the store manager.

---

# PHASE 4 — Dispatcher Planning + Constraint Engine

## Objective

Implement the core WaypointFlow planning functionality.

## Tasks

* Order queue.
* Allocation service.
* Vehicle compatibility.
* Weight constraint.
* Volume constraint.
* Temperature constraint.
* Brand constraint.
* District constraint.
* Trip limit.
* Time budget.
* Conflict explanations.
* Deferral.
* Deferral reason persistence.
* Planning UI integration.

## Test Cases

### TC-4.1 — Weight constraint

**Input:** Order exceeds vehicle weight.

**Expected:** Vehicle rejected.

### TC-4.2 — Volume constraint

**Input:** Order exceeds vehicle volume.

**Expected:** Vehicle rejected.

### TC-4.3 — Reefer requirement

**Input:** Chilled order + normal vehicle.

**Expected:** Vehicle rejected.

### TC-4.4 — Reefer compatibility

**Input:** Chilled order + reefer.

**Expected:** Vehicle accepted if other constraints pass.

### TC-4.5 — Brand constraint

**Input:** Orders from two brands.

**Expected:** They cannot be placed in the same trip.

### TC-4.6 — District constraint

**Input:** Orders from different districts.

**Expected:** They cannot be placed in the same trip.

### TC-4.7 — Trip limit

**Input:** Vehicle already has two trips.

**Expected:** Third trip rejected.

### TC-4.8 — Time budget

**Input:** Trip exceeds permitted duration.

**Expected:** Allocation rejected.

### TC-4.8a — Van-only constraint

**Input:** Order for a `VAN_ONLY` outlet + truck.

**Expected:** Vehicle rejected.

### TC-4.8b — Mall window constraint

**Input:** Planned arrival outside the mall access window.

**Expected:** Allocation rejected, or the stop sequence is adjusted to fit the window.

### TC-4.8c — Trip-time calculation

**Input:** Trip with known district, stops and dock types.

**Expected:** `trip_time` equals `depot_to_district_freeflow_min + (n−1)·inter_stop_freeflow_min + Σ service_allowance_min`, and it is compared against the correct budget (Fresh 270 / other 480).

### TC-4.8d — Fuel quota

**Input:** Vehicle whose weekly fuel quota would be exceeded by the planned route distance.

**Expected:** Vehicle rejected with a fuel-quota explanation.

### TC-4.9 — Deferral

**Input:** No feasible vehicle.

**Expected:** Order becomes `DEFERRED`.

### TC-4.10 — Deferral reason

**Expected:** Human-readable reason stored in database.

### TC-4.11 — Explainability

**Expected:** Planning UI displays why an order was allocated or rejected.

---

# PHASE 5 — Loading Workflow

## Objective

Connect planned trips to the warehouse loading process.

Workflow:

```text
Dispatcher releases trip
        ↓
Loader queue
        ↓
Trip manifest
        ↓
Check quantities
        ↓
Shortfall detection
        ↓
Trip ready
```

## Tasks

* Loading queue API.
* Trip manifest.
* Loading checklist.
* Quantity verification.
* Shortfall detection.
* Loading event persistence.
* Trip ready action.
* Frontend integration.

## Test Cases

### TC-5.1 — Released trip appears

**Expected:** Released trip appears in loader queue.

### TC-5.2 — Manifest

**Expected:** All trip orders appear.

### TC-5.3 — Correct quantity

**Expected:** Loading event records successful quantity.

### TC-5.4 — Shortfall

**Input:** Loaded quantity < expected quantity.

**Expected:** Shortfall flag becomes true.

### TC-5.5 — Ready trip

**Expected:** Trip changes to ready state.

### TC-5.6 — Unauthorized loading

**Expected:** Non-loader cannot submit loading events.

---

# PHASE 6 — Driver Route + Delivery

## Objective

Implement the delivery execution workflow.

Workflow:

```text
Trip Ready
 ↓
Driver Route
 ↓
Arrive
 ↓
Complete Delivery
 ↓
Proof of Delivery
 ↓
Next Stop
```

## Tasks

* Driver route endpoint.
* Stop details.
* Arrival action.
* Delivery completion.
* Receiver name.
* Signature/note.
* No photo upload in the MVP (signature note only — deviation recorded in `document/design-deviations.md`).
* Delivery issue reporting.
* Stop status updates.
* Order status update.

## Test Cases

### TC-6.1 — Driver route

**Expected:** Driver sees assigned trip.

### TC-6.2 — Stop sequence

**Expected:** Stops appear in planned sequence.

### TC-6.3 — Arrival

**Expected:** Stop changes to arrived.

### TC-6.4 — Complete delivery

**Expected:** Stop becomes completed.

### TC-6.5 — Proof of delivery

**Expected:** PoD record is created.

### TC-6.6 — Order completion

**Expected:** Delivered order changes to `DELIVERED`.

### TC-6.7 — Delivery issue

**Expected:** Issue is persisted and surfaced to operations.

---

# PHASE 7 — Offline Mode + Synchronization

## Objective

Ensure the driver can perform critical actions without network connectivity.

## Tasks

* IndexedDB setup.
* Offline detection.
* Local event queue.
* Offline UI state.
* Queue arrival events.
* Queue delivery events.
* Queue PoD.
* Queue issues.
* Synchronization endpoint.
* Duplicate-event protection.
* Sync status UI.

## Test Cases

### TC-7.1 — Detect offline

**Action:** Disable network.

**Expected:** Driver UI displays offline state.

### TC-7.2 — Offline arrival

**Action:** Mark stop arrived while offline.

**Expected:** Event saved locally.

### TC-7.3 — Offline delivery

**Action:** Complete delivery while offline.

**Expected:** Event saved locally.

### TC-7.4 — Reconnect

**Action:** Restore network.

**Expected:** Pending events are synchronized.

### TC-7.5 — Duplicate sync

**Action:** Send same client UUID twice.

**Expected:** Event is not duplicated.

### TC-7.6 — Sync failure

**Action:** Simulate API failure.

**Expected:** Event remains in local outbox.

### TC-7.7 — Sync recovery

**Action:** Restore API.

**Expected:** Pending event eventually synchronizes.

---

# PHASE 8 — Store Receipt + Live Operations

## Objective

Close the loop between delivery and store visibility.

## Tasks

* Receipt confirmation.
* Store tracking.
* Live trip status.
* Alerts.
* Delivery issue display.
* Order timeline.

## Test Cases

### TC-8.1 — Delivered order visible

**Expected:** Store sees delivered status.

### TC-8.2 — Receipt confirmation

**Expected:** Receipt action creates confirmation.

### TC-8.3 — Live status

**Expected:** Trip status changes appear in operations view.

### TC-8.4 — Alert

**Expected:** Relevant operational alert appears.

### TC-8.5 — Alert read

**Expected:** Alert can be marked as read.

---

# PHASE 9 — UI Responsiveness + Integration

## Objective

Ensure all major flows work across desktop and mobile layouts.

## Tasks

* Dispatcher responsive pass.
* Loader responsive pass.
* Store responsive pass.
* Driver mobile optimization.
* Navigation verification.
* Loading states.
* Empty states.
* Error states.
* Offline states.
* Success feedback.
* API error handling.

## Test Cases

### TC-9.1 — Desktop

**Expected:** Core screens work at desktop resolution.

### TC-9.2 — Tablet

**Expected:** No major overflow or broken layout.

### TC-9.3 — Mobile

**Expected:** Driver and store flows remain usable.

### TC-9.4 — API loading

**Expected:** Loading state displayed while waiting.

### TC-9.5 — API failure

**Expected:** User-friendly error displayed.

### TC-9.6 — Empty state

**Expected:** Empty queues display useful empty-state UI.

---

# PHASE 10 — Dockerization

## Objective

Make the application reproducible locally — a judge must be able to run the complete system with seed data from a single command, without any external accounts or credentials.

Docker Compose provides three services:

```text
db    (postgres:16)
api   (Express + Prisma; runs migrations and seed on startup)
web   (nginx serving the Vite build; proxies /api → api)
```

```bash
docker compose up --build
# → web on http://localhost:8080, seeded demo users, zero external dependencies
```

Supabase is used **only** for the production deployment. Locally and in Docker the API connects to the compose `db` service via `DATABASE_URL`. The same Prisma schema and migrations run in both environments.

## Test Cases

### TC-10.1 — Docker build

**Expected:** Web and API images build successfully.

### TC-10.2 — Docker startup

**Expected:** `docker compose up --build` starts db, api and web.

### TC-10.3 — API health

**Expected:** API health endpoint responds.

### TC-10.4 — Web access

**Expected:** Web application loads through Docker.

### TC-10.5 — Standalone seed

**Action:** Wipe volumes (`docker compose down -v`) and start again with no environment variables set.

**Expected:** Database is created, migrated and seeded automatically; the demo credentials from the README log in successfully.

### TC-10.6 — No external dependency

**Action:** Disconnect from the internet and restart the stack.

**Expected:** The application still runs end-to-end against the local `db` service.

---

# PHASE 11 — Deployment

## Objective

Deploy the complete application publicly.

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
             │ API Hosting │
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

* Create production Supabase project.
* Configure production environment variables.
* Deploy API.
* Deploy frontend.
* Configure frontend API URL.
* Configure CORS.
* Run production database migration.
* Seed demo data.
* Verify demo accounts.
* Verify complete workflow.

## Test Cases

### TC-11.1 — Public frontend

**Expected:** Public URL loads.

### TC-11.2 — Public API

**Expected:** API health endpoint accessible.

### TC-11.3 — Production login

**Expected:** Demo credentials work.

### TC-11.4 — Production database

**Expected:** Data persists in Supabase.

### TC-11.5 — End-to-end production workflow

**Expected:**

```text
Store Order
→ Dispatcher Plan
→ Loader
→ Driver
→ Delivery
→ Receipt
```

works in production.

---

# PHASE 12 — Documentation + Submission

## Objective

Prepare the project for judging and submission.

## Required Files

```text
README.md
plan.md
AI_DISCLOSURE.md

document/
├── architecture.md
├── data-model.md
└── design-deviations.md
```

## README Must Include

* Project overview
* Features
* Architecture
* Technology stack
* Local setup
* Environment variables
* Database setup
* Demo credentials
* Deployment URL
* Docker instructions
* Testing instructions
* Known limitations

---

# 16. Architecture Documentation

`document/architecture.md` must contain:

* System architecture
* Frontend/backend relationship
* Supabase relationship
* Authentication flow
* Offline synchronization flow
* Planning engine
* Deployment architecture

Use Mermaid diagrams where possible.

---

# 17. Data Model Documentation

`document/data-model.md` must contain:

* Entity relationship diagram
* Table descriptions
* Relationships
* Important indexes
* Order lifecycle
* Trip lifecycle

---

# 18. Design Deviation Log

Every meaningful deviation from the approved Figma design must be recorded.

Example:

```text
Date:
Screen:
Original Design:
Implemented Change:
Reason:
Impact:
```

Do not redesign screens simply for convenience.

---

# 19. AI Disclosure

`AI_DISCLOSURE.md` must document AI-assisted development.

Include:

* Tools used
* What AI was used for
* Which code was generated or assisted
* What was manually reviewed
* Testing performed by the team

AI assistance must not replace understanding and verification of the implementation.

---

# 20. Final End-to-End Acceptance Test

Before submission, execute the following scenario from start to finish.

## Step 1 — Login

Login as Store Manager.

Expected:

```text
Dashboard loads
```

---

## Step 2 — Create Order

Create a new order.

Expected:

```text
Order = NEW
```

---

## Step 3 — Dispatcher

Login as Dispatcher.

Expected:

```text
Order appears in planning queue
```

---

## Step 4 — Allocate

Run allocation.

Expected:

```text
Order assigned to feasible vehicle/trip
```

or:

```text
Order deferred with explanation
```

---

## Step 5 — Release Trip

Release the trip.

Expected:

```text
Trip ready for loading
```

---

## Step 6 — Loader

Login as Loader.

Expected:

```text
Trip appears in loading queue
```

---

## Step 7 — Verify Loading

Confirm quantities.

Expected:

```text
Trip READY
```

---

## Step 8 — Driver

Login as Driver.

Expected:

```text
Route appears
```

---

## Step 9 — Delivery

Arrive at stop.

Complete delivery.

Add PoD.

Expected:

```text
Stop = COMPLETED
Order = DELIVERED
```

---

## Step 10 — Store Tracking

Login as Store Manager.

Expected:

```text
Order = DELIVERED
```

---

## Step 11 — Receipt

Confirm receipt.

Expected:

```text
Receipt confirmed
```

---

## Step 12 — Offline Test

Disable network.

Complete a driver action.

Expected:

```text
Event queued locally
```

Restore network.

Expected:

```text
Event synchronized
```

---

# 21. Final Acceptance Criteria

The project is considered hackathon-ready when all of the following are true:

* [ ] Frontend builds successfully
* [ ] Backend builds successfully
* [ ] Supabase database is connected
* [ ] Prisma migrations work
* [ ] Seed data works
* [ ] Authentication works
* [ ] Role-based access works
* [ ] Store order creation works
* [ ] Dispatcher planning works
* [ ] Allocation constraints work (weight, volume, temperature, brand, district, van-only, mall window, trip-time budgets, fuel quota, 2-trip limit)
* [ ] Deferral reasons work
* [ ] Loader workflow works
* [ ] Driver workflow works
* [ ] Proof of delivery works
* [ ] Offline driver actions work
* [ ] Sync works
* [ ] Store tracking works
* [ ] Receipt confirmation works
* [ ] Alerts work
* [ ] Mobile layout works
* [ ] Docker build works
* [ ] docker compose up runs the full stack with seed data (no external credentials)
* [ ] Production deployment works
* [ ] Production database persists data
* [ ] Demo accounts work
* [ ] README is complete
* [ ] Architecture documentation is complete
* [ ] Data model documentation is complete
* [ ] Design deviations are documented
* [ ] AI disclosure is complete
* [ ] Demo video is recorded
* [ ] Final end-to-end test passes

---

# 22. Time-Boxed Execution Schedule

## October 2 — Foundation + Docker Skeleton

### Phase 0

* Repository
* Existing UI cleanup
* Build verification

### Phase 1

* Local PostgreSQL (compose `db` service)
* Supabase project (production)
* Prisma
* Database schema
* Seed data
* API foundation

### Phase 2

* Authentication
* Roles
* Login UI

### Phase 10 (skeleton)

* `docker-compose.yml` with db + api + web verified locally
* First production deploy attempt (walking skeleton: login only) — de-risks Day 3

**End-of-day requirement:**

```text
User can log in
→ API authenticates
→ PostgreSQL stores data
→ Role-based dashboard loads
→ docker compose up runs the stack with seed data
```

---

# October 3 — Core Product

### Phase 3

* Store order flow (incl. cutoff)

### Phase 4

* Dispatcher planning
* Constraint engine (all 13 rules)
* Deferrals

### Phase 5

* Loading

### Phase 6

* Driver delivery

### Phase 7

* Offline sync

### Phase 11 (redeploy)

* Redeploy the day's progress; verify production login + order flow

**End-of-day requirement:**

```text
Order
→ Plan
→ Load
→ Deliver
```

must work, and the deployed URL shows the same.

---

# October 4 — Integration + Submission

### Phase 8

* Receipt
* Live operations
* Alerts

### Phase 9

* Responsive UI
* Error states
* Loading states

### Phase 11 (final)

* Final redeploy + production verification

### Phase 12

* Documentation
* AI disclosure
* Design deviation log
* Demo video

**Buffer:** reserve the final 3 hours for the end-to-end acceptance test, demo video and submission only. No new features after 20:00 SLST.

**Final requirement:**

Complete end-to-end production test before submission.

---

# 23. Commit Strategy

Do not create one massive final commit.

Create meaningful commits after each completed phase.

Recommended format:

```text
feat(web): establish production frontend baseline
feat(api): initialize express typescript backend
feat(db): add supabase prisma schema
feat(auth): implement jwt authentication
feat(store): implement order creation flow
feat(planning): implement allocation engine
feat(planning): add deferral explanations
feat(loader): implement loading workflow
feat(driver): implement delivery workflow
feat(driver): add offline event queue
feat(sync): implement offline synchronization
feat(receipts): implement receipt confirmation
fix(web): improve mobile responsiveness
chore(docker): add docker compose deployment
docs: add architecture and data model
docs: add ai disclosure
docs: add design deviation log
```

Each commit should represent a meaningful completed unit.

---

# 24. Priority System

If implementation time becomes limited, use the following priority order.

## P0 — Must Work

```text
Authentication
↓
Orders
↓
Planning
↓
Loading
↓
Driver Delivery
↓
PoD
↓
Supabase persistence
↓
Deployment
```

## P1 — Important

```text
Offline mode
Sync
Deferral explanations
Receipt confirmation
Alerts
Responsive UI
```

## P2 — Optional Polish

```text
Advanced animations
Forecast visualizations
Complex notification systems
Advanced search
Non-essential dashboard statistics
Extra visual effects
```

Do not sacrifice the core end-to-end workflow for visual polish.

---

# 25. Hackathon Definition of Done

The implementation is **DONE** when a judge can:

1. Open the public URL.
2. Log in with provided credentials.
3. Create an order as a Store Manager.
4. See the order in Dispatcher planning.
5. Allocate or defer the order.
6. See the allocation explanation.
7. Release the trip.
8. Verify the trip as Loader.
9. Open the route as Driver.
10. Complete a delivery.
11. Record proof of delivery.
12. See the order become delivered.
13. Confirm the receipt as Store Manager.
14. Observe an offline driver action being queued.
15. Reconnect and see the action synchronized.
16. Refresh the application without losing persisted data.

The final product should demonstrate a coherent, working logistics workflow rather than a collection of disconnected screens.

---

# 26. Final Submission Checklist

```text
[ ] Public application URL
[ ] Demo credentials
[ ] GitHub repository
[ ] README.md
[ ] plan.md
[ ] AI_DISCLOSURE.md
[ ] architecture.md
[ ] data-model.md
[ ] design-deviations.md
[ ] Supabase production database
[ ] Production API
[ ] Production frontend
[ ] Docker Compose (runs standalone with seed data — no external credentials)
[ ] Seed/demo data
[ ] Authentication
[ ] Store workflow
[ ] Dispatcher workflow
[ ] Loader workflow
[ ] Driver workflow
[ ] Offline synchronization
[ ] Receipt confirmation
[ ] Responsive UI
[ ] End-to-end acceptance test
[ ] 5–8 minute demo video
[ ] Final submission before 23:59 SLST
```

---

# 27. Final Product Flow

The final implementation must demonstrate this complete lifecycle:

```text
                    WAYPOINTFLOW
                         │
                         ▼
                  ┌─────────────┐
                  │ Store Login │
                  └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
                  │ Create Order│
                  └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
                  │  Dispatcher │
                  │   Planning  │
                  └──────┬──────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
        ┌───────────┐        ┌────────────┐
        │ Allocated │        │  Deferred  │
        └─────┬─────┘        └────────────┘
              │
              ▼
        ┌─────────────┐
        │   Loading   │
        └──────┬──────┘
               │
               ▼
        ┌─────────────┐
        │    Driver   │
        │    Route    │
        └──────┬──────┘
               │
               ▼
        ┌─────────────┐
        │   Delivery  │
        │    + PoD    │
        └──────┬──────┘
               │
               ▼
        ┌─────────────┐
        │    Store    │
        │   Receipt   │
        └──────┬──────┘
               │
               ▼
        ┌─────────────┐
        │  Completed  │
        └─────────────┘


             OFFLINE DRIVER FLOW

        Driver Action
              │
              ▼
        ┌─────────────┐
        │  IndexedDB  │
        │   Outbox    │
        └──────┬──────┘
               │
        Network Restored
               │
               ▼
        ┌─────────────┐
        │ POST /sync  │
        └──────┬──────┘
               │
               ▼
        ┌─────────────┐
        │  Supabase   │
        │ PostgreSQL  │
        └─────────────┘
```

**Primary implementation principle:** build one complete working vertical slice at a time, test it, commit it, and only then move to the next phase.
