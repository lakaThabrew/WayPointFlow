# Phase 4 — Dispatcher Planning + Constraint Engine

**Branch:** `lakmana-phase-04`
**Target Day:** October 3, 2026
**Depends on:** Phase 3 (orders + queue close) ✅
**Status:** 🟢 Implemented (2026-10-03) — engine verified on seeded scenario (13 rules, idempotent re-run, manual-deferral parking); dispatcher screens wired; builds clean; awaiting commit approval

---

## Objective

Implement the heart of WaypointFlow — the deterministic, explainable allocation engine — and wire the dispatcher workspace to it:

```
CONFIRMED orders (+ carried-over DEFERRED)
  → Run allocation (POST /planning/allocate)
  → Trips + stops created (orders PLANNED) / orders DEFERRED with recorded reasons
  → Planning Workspace (live queue, trip board, constraint inspector)
  → Constraint Conflict (per-vehicle failure assessment)
  → Deferral Decision (manual defer with reason)
  → Final Dispatch Plan (summary + Release → trips RELEASED for loaders)
```

**Every allocation decision — served or deferred — carries a human-readable explanation.** (Booklet: "Help Waypoint make delivery decisions it can explain.")

---

## End-of-Phase Definition of Done

```
✅ POST /planning/allocate runs the full 13-rule engine and persists trips/stops/deferrals atomically
✅ Greedy strategy: previously-deferred first → Fresh first → tightest window; smallest feasible vehicle
✅ Every allocated and deferred order has an explanation (checks passed / per-vehicle failure table)
✅ Re-running allocation for the same day is safe (idempotent — replaces uncommitted plan)
✅ Manual deferral with reason (POST /orders/:id/defer) persists and notifies the store view
✅ Trip release (POST /trips/:id/release) moves trips PLANNED → RELEASED
✅ Planning Workspace, Constraint Conflict, Deferral Decision, Dispatch Plan wired to real data
✅ All TC-4.x test cases pass
```

---

## Key Design Decisions (read first)

| Decision | Rationale |
|---|---|
| **Deterministic greedy allocator, no optimization library** | Explainability beats optimality for the demo and the judges; every decision traces to a rule. Same philosophy as the Datathon Task 2B checker (`check_allocation.py`). |
| **`district_travel` gains km columns** | Fuel-quota rule (R12) needs distance, not minutes: `route_km = depot_to_district_km + (n−1)·inter_stop_km`. Migration adds `depot_to_district_km` / `inter_stop_km` (seed: Gampaha 12/4, Colombo 15/5). |
| **Departure anchors** | Fresh trips depart **03:30** (pre-dawn window), other brands depart **08:00** (daytime window) — mirrors the Task 2B checker. Stop i arrival = departure + freeflow + i·inter-stop + Σ allowances of earlier stops. |
| **Mall-window departure shift** | A daytime trip anchored at 08:00 would reach a mall outlet *before* its access window opens (Colombo freeflow 30 min → 08:30 < 10:00). Rule 8 implementation: if a trip contains a mall stop, shift departure later so the mall stop's arrival ≥ `mallWindowOpen` (and ≤ `mallWindowClose`); if no shift satisfies it, the mall order fails with "Mall access window cannot be met". |
| **Per-vehicle daily budget sums** | Per vehicle per day: Σ Fresh trip minutes ≤ 270, Σ other trip minutes ≤ 480 (matches the checker). |
| **Idempotent re-allocation** | Re-running for the same date deletes that date's PLANNED trips (orders revert to CONFIRMED) and its auto-created deferrals, then re-computes. **Manual** deferrals (created via `/defer`, marked with the dispatcher's user id) are never deleted. |
| **Carry-over deferrals** | Orders DEFERRED from a previous day whose `deliveryDate <= plan date` re-enter the queue at highest priority ("previously skipped outlets" visibility — booklet requirement). |
| **Conflict screen shows ORD-10491 live** | With the seeded fleet, ORD-10482 (van-only chilled) correctly allocates to VEH031 (reefer van) — the design's "no feasible vehicle" story for ORD-10482 only reproduces if VEH031 is inactive. Live conflict demo = ORD-10491 (3200 kg exceeds every vehicle). Optional demo toggle: set VEH031 `active=false` to re-enact the design's ORD-10482 scene. Document in deviations log. |
| **Trip IDs continue `TRIP-####`** | Same find-max pattern as orders (seed has TRIP-0001). |
| **Frontend re-fetches, not in-memory passing** | DispatchPlan / ConstraintConflict read via `GET /planning/plan` + `GET /planning/conflicts` so refresh is safe. |

---

## The 13 Rules (engine contract — from the master plan §7)

| # | Rule | Check |
|---|---|---|
| 1 | Weight | `tripWeight + order.weightKg ≤ vehicle.maxWeightKg` |
| 2 | Volume | `tripVolume + order.volumeM3 ≤ vehicle.maxVolumeM3` |
| 3 | Temperature | `CHILLED/FROZEN ⇒ REEFER vehicle`; AMBIENT ⇒ any |
| 4 | Brand consistency | One brand per trip |
| 5 | District consistency | One district per trip |
| 6 | Trip limit | ≤ 2 trips per vehicle per day |
| 7 | Van-only access | `outlet.parkingConstraint = VAN_ONLY ⇒ vehicle.type = VAN` |
| 8 | Mall window | Mall outlet's planned arrival within `mallWindowOpen–Close` |
| 9 | Trip time | `depotFreeflow + (n−1)·interStop + Σ allowance(brand, dockType)` |
| 10 | Fresh budget | Σ Fresh trip min per vehicle ≤ **270** |
| 11 | Daytime budget | Σ other trip min per vehicle ≤ **480** |
| 12 | Fuel quota | `weekFuelL + routeKm / kmPerL ≤ weeklyFuelQuotaL` |
| 13 | Deferral | No feasible assignment ⇒ DEFERRED + recorded reason |

---

## Repository Structure Updates

```
WayPoint/
├── api/
│   ├── prisma/
│   │   └── schema.prisma              ← district_travel + km columns (migration)
│   └── src/
│       ├── services/
│       │   └── allocator.ts           ← NEW: the 13-rule engine + explanations
│       ├── controllers/
│       │   └── planningController.ts  ← NEW: allocate / plan / conflicts / defer / release
│       └── routes/
│           ├── planning.ts            ← + allocate, plan, conflicts
│           ├── orders.ts              ← + POST /orders/:id/defer (dispatcher override)
│           └── trips.ts               ← NEW: POST /trips/:id/release
└── src/
    ├── services/
    │   └── planning.ts                ← NEW: typed planning API client
    └── components/dispatcher/
        └── DispatcherScreens.tsx      ← wire D02, D04, D05, D06, D07
```

---

## Step-by-Step Tasks

### TASK 4.1 — Schema: km columns on `district_travel` + `source` on `deferrals`

```prisma
model DistrictTravel {
  // ...existing fields...
  depotToDistrictKm        Float @default(0) @map("depot_to_district_km")
  interStopKm              Float @default(0) @map("inter_stop_km")
}

model Deferral {
  // ...existing fields...
  // AUTO = written by the allocator (safe to replace on re-run);
  // MANUAL = written by a dispatcher via POST /planning/defer/:orderId (never auto-deleted).
  source    String   @default("AUTO") // AUTO | MANUAL
}
```

> ⚠️ **Why `source` is required:** both the allocator and the manual defer endpoint store a dispatcher id in `decidedBy`, so they are indistinguishable without it. The idempotent re-run (TASK 4.2 step 1) deletes **only `AUTO`** deferrals — without this column, re-running allocation would wipe a dispatcher's manual deferrals.

```bash
npx prisma migrate dev --name add_district_travel_km_and_deferral_source
```

Update the seed fixtures (upsert `update:` fills the new columns on re-run):

| District | Depot | Freeflow min | Inter-stop min | Depot→District km | Inter-stop km |
|---|---|---|---|---|---|
| Gampaha | Peliyagoda | 35 | 15 | 12 | 4 |
| Colombo | Peliyagoda | 30 | 15 | 15 | 5 |

> ⚠️ Existing seed uses `update: {}` — the km columns need real values in `update` too, or re-created rows keep 0.

---

### TASK 4.2 — The allocator service

File: `api/src/services/allocator.ts`

```typescript
import { prisma } from '../lib/prisma';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AllocationExplanation {
  orderId: string;
  result: 'ALLOCATED' | 'DEFERRED';
  tripId?: string;
  vehicleId?: string;
  checks: string[];              // human-readable pass/fail lines
  vehicleAssessment?: Array<{ vehicleId: string; failedRule: string }>; // for the conflict screen
}

interface CandidateOrder {
  id: string; outletId: string; brand: string; district: string;
  temperatureRequirement: 'CHILLED' | 'FROZEN' | 'AMBIENT';
  weightKg: number; volumeM3: number;
  windowOpen: string; windowClose: string;
  previouslyDeferred: boolean;
  // joined outlet fields
  dockType: 'REAR_DOCK' | 'CURB' | 'MALL_BAY';
  vanOnly: boolean;
  mallWindowOpen: string | null; mallWindowClose: string | null;
}

interface WorkingTrip {
  vehicleId: string; tripNumber: 1 | 2; brand: string; district: string;
  orders: CandidateOrder[];
  weightKg: number; volumeM3: number;
}

const FRESH_DEPARTURE = '03:30';
const OTHER_DEPARTURE = '08:00';
const FRESH_BUDGET_MIN = 270;
const OTHER_BUDGET_MIN = 480;

// ── Entry point ──────────────────────────────────────────────────────────────

export async function allocate(date: Date, dispatcherId: string) {
  // 1. Idempotency: drop this date's uncommitted (PLANNED) trips and auto deferrals.
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date); dayEnd.setDate(dayEnd.getDate() + 1);

  await prisma.$transaction(async (tx) => {
    const staleTrips = await tx.trip.findMany({
      where: { date: { gte: dayStart, lt: dayEnd }, status: 'PLANNED' },
      include: { stops: { select: { orderId: true } } },
    });
    const staleTripIds = staleTrips.map(t => t.id);
    const staleOrderIds = staleTrips.flatMap(t => t.stops.map(s => s.orderId));
    await tx.tripStop.deleteMany({ where: { tripId: { in: staleTripIds } } });
    await tx.trip.deleteMany({ where: { id: { in: staleTripIds } } });
    // Orders from the discarded plan go back to CONFIRMED so they re-enter the queue.
    await tx.order.updateMany({ where: { id: { in: staleOrderIds } }, data: { status: 'CONFIRMED' } });
    // Auto-deferrals from prior runs of this date are removed; MANUAL ones stay.
    await tx.deferral.deleteMany({ where: { source: 'AUTO', order: { deliveryDate: { gte: dayStart, lt: dayEnd } } } });
    await tx.order.updateMany({
      where: { status: 'DEFERRED', deliveryDate: { gte: dayStart, lt: dayEnd }, deferrals: { none: { source: 'MANUAL' } } },
      data: { status: 'CONFIRMED' },
    });
  });
  // ... full implementation below
}
```

**Algorithm (greedy, explainable):**

```
load candidates =
  orders where status=CONFIRMED and deliveryDate=date
  + orders where status=DEFERRED and deliveryDate<=date   (carry-over, highest priority)
load vehicles where active=true
load districtTravel, serviceAllowance fixtures
load trips already RELEASED/LOADING/etc for date          (count toward trip limit + budgets)

sort candidates: previouslyDeferred desc, brand=Fresh first, windowClose asc
group by (brand, district)

for each group:
  openTrips: WorkingTrip[] = []
  for each order:
    failures: Map<vehicleId, failedRule> = {}

    // pass 1 — append to an open trip (best-fit packing)
    for trip of openTrips:
      rule = firstFailedRule(order, trip, trip.vehicle)
      if (!rule) { trip.add(order); placed; break }
      failures[trip.vehicleId] = rule

    // pass 2 — open a new trip on the smallest feasible vehicle
    if (!placed):
      for vehicle of vehicles (asc by maxWeightKg):
        if tripsUsedToday(vehicle) ≥ 2 → failures[v]='Trip limit (2/day)'; continue
        rule = firstFailedRule(order, null, vehicle)
        if (!rule) { openTrips.push(newTrip(vehicle, order)); placed; break }
        failures[vehicle.id] = rule

    if (!placed): defer(order, reason = summarize(failures), vehicleAssessment = failures)

firstFailedRule(order, trip|null, vehicle):
  temp:      order needs reefer && !vehicle.reefer           → 'No reefer capability'
  vanOnly:   order.vanOnly && vehicle.type != VAN            → 'Not a van (van-only outlet)'
  capacity:  (trip?.weightKg ?? 0) + order.weightKg > maxKg  → 'Weight capacity exceeded'
             (trip?.volumeM3 ?? 0) + order.volumeM3 > maxM3  → 'Volume capacity exceeded'
  time:      tripMinutesWith(order, trip) > budget(brand)    → 'Trip time budget exceeded'
  dailySum:  dailyMinutes(vehicle, brand) + trip > budget    → 'Daily budget exhausted'
  mall:      mallArrivalWith(order, trip) outside window     → 'Mall access window cannot be met'
  fuel:      weekFuelL(vehicle) + routeKm/kmPerL > quota     → 'Weekly fuel quota exceeded'
  else null

summarize(failures): pick the most frequent failed rule; format:
  "No compatible reefer van available — VEH031: Daily budget exhausted; VEH014: Not a van"
```

**Persist (single transaction):**
- create `Trip` (status PLANNED, tripNumber 1|2, brand, district, plannedDeparture = anchor) + `TripStop`s (sequence, plannedArrival computed)
- allocated orders → `PLANNED`
- deferred orders → `DEFERRED` + `Deferral(reason, decidedBy: dispatcherId)` (marked auto via same-day re-run cleanup)

**Return:** `{ date, trips: [...with stops + capacity], deferred: [...], explanations: AllocationExplanation[] }`

---

### TASK 4.3 — Planning controller + routes

File: `api/src/controllers/planningController.ts`

| Endpoint | Role | Behaviour |
|---|---|---|
| `POST /planning/allocate` `{ date? }` | DISPATCHER | Runs the allocator (default: next operating day), returns result + explanations |
| `GET /planning/plan?date=` | DISPATCHER | Trips (with stops, orders, vehicle) + deferrals for the date |
| `GET /planning/conflicts?date=` | DISPATCHER | Deferred orders with full per-vehicle assessment (for D05). **Recompute failures live** (run `firstFailedRule` for the order against every active vehicle) — deterministic and never stale; do not store explanation JSON on the deferral row. |
| `POST /orders/:id/defer` `{ reason, notes? }` | DISPATCHER | Manual deferral: order → DEFERRED + Deferral row (validated non-empty reason) |
| `POST /trips/:id/release` | DISPATCHER | Trip PLANNED → RELEASED (404 unless PLANNED) |

`orders.ts` is currently `requireRole('STORE_MANAGER')` at router level — move `/defer` to the planning router instead (`POST /planning/defer/:orderId`) to avoid role conflict. **Do not loosen the store router.**

Validation: `reason` required, min 5 chars; order must be CONFIRMED/NEW (not already PLANNED-on-released-trip etc.).

---

### TASK 4.4 — Frontend planning client

File: `src/services/planning.ts`

```typescript
import { apiFetch } from './api';

export const planningApi = {
  queue: () => apiFetch<{ orders: any[] }>('/planning/queue'),
  allocate: (date?: string) => apiFetch('/planning/allocate', { method: 'POST', body: JSON.stringify({ date }) }),
  plan: (date?: string) => apiFetch(`/planning/plan${date ? `?date=${date}` : ''}`),
  conflicts: (date?: string) => apiFetch(`/planning/conflicts${date ? `?date=${date}` : ''}`),
  defer: (orderId: string, reason: string, notes?: string) =>
    apiFetch(`/planning/defer/${orderId}`, { method: 'POST', body: JSON.stringify({ reason, notes }) }),
  releaseTrip: (tripId: string) => apiFetch(`/trips/${tripId}/release`, { method: 'POST' }),
};
```

(Define proper `AllocationResult` / `PlanTrip` / `ConflictDetail` interfaces matching the API responses.)

---

### TASK 4.5 — Wire the dispatcher screens

| Screen | Change |
|---|---|
| `DispatcherOrders` (D02) | `planningApi.queue()` — real queue (NEW/CONFIRMED) + deferred section from `planningApi.conflicts()`. Row click → `setSelectedOrder(id)` → `dispatcher/order-details`. |
| `PlanningWorkspace` (D04) | "Run allocation" primary action → `allocate()`; queue column = unallocated/conflict cards from result; trip board + constraint inspector read from the result (`weightPct`, `volPct`, fuel, rule tags from explanations). Deferred card → `setSelectedOrder` → `dispatcher/constraint-conflict`. |
| `ConstraintConflict` (D05) | `planningApi.conflicts()` → selected order's `vehicleAssessment` rows replace the hardcoded VEH table; requirement tags from the failed rules. |
| `DeferralDecision` (D06) | Reason dropdown + notes → `planningApi.defer(selectedOrderId, reason, notes)`; success panel shows the real `DEF-####` id returned. |
| `DispatchPlan` (D07) | `planningApi.plan()` → summary stats (served/deferred/trips/vehicles) + trip table from real trips; "Release plan" → `releaseTrip()` for each PLANNED trip → success state. |
| `DispatcherOverview`, `LiveOperations`, `DeliveryException`, `Forecast` | Stay mock — LiveOps is Phase 8, Forecast is Datathon-fed. Note in deviations log. |

The existing mock `TRIPS`/`ORDERS`/`VEHICLES` imports leave the four wired screens; other dispatcher screens keep them for now.

---

## Test Cases (engine — run against seeded demo data)

Scenario: after Phase 3's close, 6 CONFIRMED orders dated 2026-10-01 exist. `POST /planning/allocate {"date":"2026-10-01"}`.

### TC-4.1 — Weight constraint
ORD-10491 (3200 kg Style) exceeds VEH022 (3000 kg). **Expected:** deferred with "Weight capacity exceeded".

### TC-4.2 — Volume constraint
Same order (16 m³ > 15 m³). **Expected:** volume listed among failed rules.

### TC-4.3 — Reefer requirement
CHILLED orders never appear on VEH022/VEH041 (ambient). **Expected:** allocation shows only reefer vehicles for chilled.

### TC-4.4 — Reefer compatibility
ORD-10483 (CHILLED) → VEH014 or VEH031. **Expected:** allocated, explanation lists "Temperature compatible".

### TC-4.5 — Brand consistency
**Expected:** no trip mixes Fresh/Style/Tech.

### TC-4.6 — District consistency
**Expected:** no trip mixes Colombo/Gampaha.

### TC-4.7 — Trip limit
Create enough Fresh/Gampaha volume that the group needs 3+ trips (e.g. add orders totalling > 2× reefer-truck capacity). **Expected:** no vehicle receives a 3rd trip; overflow defers with "Trip limit (2/day)".

### TC-4.8 — Time budget
Fresh trip time = 35 + (n−1)·15 + Σ allowances ≤ 270. **Expected:** over-budget additions rejected with "Trip time budget exceeded".

### TC-4.8a — Van-only constraint
ORD-10482 (OUT047 VAN_ONLY) must land on a VAN. **Expected:** allocated to VEH031; assessment shows trucks failing "Not a van".

### TC-4.8b — Mall window
ORD-10485 (Majestic City, 10:00–12:00): daytime trip departing 08:00 → arrival 08:30 + allowance… **Expected:** if computed arrival < 10:00, the stop is rejected/re-sequenced with "Mall access window cannot be met" (or the allocator departs later — document the chosen behaviour).

### TC-4.8c — Trip-time calculation
Unit-check one trip by hand against the formula. **Expected:** exact match.

### TC-4.8d — Fuel quota
Set a vehicle's weekly quota near-zero in the DB → re-run. **Expected:** deferral with "Weekly fuel quota exceeded".

### TC-4.9 — Deferral
ORD-10491. **Expected:** status DEFERRED + `Deferral` row with reason.

### TC-4.10 — Deferral reason
**Expected:** reason is human-readable and specific (not "no vehicle").

### TC-4.11 — Explainability
**Expected:** `explanations[]` covers every candidate; Planning UI shows pass/fail checks.

### TC-4.12 — Idempotent re-run
Run allocate twice for the same date. **Expected:** identical trip set; no duplicate trips/stops/deferrals; manual deferrals untouched.

### TC-4.13 — Manual deferral
`POST /planning/defer/ORD-10483 { reason: "Customer requested next week" }`. **Expected:** order DEFERRED, deferral persisted, `decidedBy` = dispatcher.

### TC-4.14 — Release
**Expected:** `POST /trips/:id/release` → RELEASED; second call → 409/400; released trips excluded from re-allocation.

---

## Commit Sequence (get approval from user)

```bash
git add api/prisma/schema.prisma api/prisma/migrations api/prisma/seed.ts
git commit -m "feat(db): add district travel km columns for fuel rule"

git add api/src/services/allocator.ts
git commit -m "feat(planning): implement 13-rule allocation engine with explanations"

git add api/src/controllers/planningController.ts api/src/routes/
git commit -m "feat(api): planning allocate, plan, conflicts, defer, release endpoints"

git add src/services/planning.ts
git commit -m "feat(web): planning api client"

git add src/components/dispatcher/
git commit -m "feat(web): wire dispatcher planning workspace to allocation engine"
```

---

## Phase 4 → Phase 5 Handoff Criteria

- [ ] TC-4.1 – TC-4.14 all pass
- [ ] `GET /planning/plan` returns trips with stops + deferrals for the demo date
- [ ] RELEASED trips exist for the loader queue (Phase 5 reads `status = RELEASED`)
- [ ] Deferral reasons visible from both dispatcher and store views
- [ ] `document/design-deviations.md` updated (ORD-10491 as live conflict, departure anchors 03:30/08:00)
