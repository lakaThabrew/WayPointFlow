# Phase 3 — Store Manager Order Flow

**Branch:** `lakmana-phase-03`
**Target Day:** October 3, 2026
**Depends on:** Phase 1 (DB + seed) ✅, Phase 2 (auth + roles) ✅
**Status:** 🟢 Implemented (2026-10-02) — backend TC-3.1–3.3, 3.5, 3.7–3.9 verified via API tests; frontend builds clean (0 TS errors); awaiting commit approval

---

## Objective

Implement the first complete business workflow end-to-end:

```
Store Manager login
  → Create Order (form)
  → Review Order (summary)
  → Place Order (POST /orders — validated, cutoff-enforced)
  → Confirmation (real order ID)
  → Orders list / Home stats / Tracking (real data, own outlet only)
  → Dispatcher closes the queue (POST /planning/close: NEW → CONFIRMED)
```

After this phase a store manager can place a real order that persists in PostgreSQL and lands in the dispatcher's planning queue — the backbone of the demo's end-to-end story.

---

## End-of-Phase Definition of Done

```
✅ POST /orders creates an order (status NEW) for the caller's own outlet only
✅ Cutoff enforced server-side (default 16:00 — matches the approved design banner)
✅ GET /orders and GET /orders/:id are scoped to the caller's outlet (store isolation)
✅ POST /planning/close (dispatcher) moves tomorrow's NEW orders → CONFIRMED
✅ Create → Review → Place → Confirmation wired to the real API (real order ID shown)
✅ Store orders list, home stats and tracking read live data (loading + error states)
✅ All TC-3.x test cases pass
```

---

## Key Design Decisions (read first)

| Decision | Rationale |
|---|---|
| **Cutoff = 16:00** | The approved design hardcodes "Orders for tomorrow must be placed before 4:00 PM" (`CreateOrder` banner). Design is the source of truth; the master plan's 18:00 default is superseded. Configurable via `ORDER_CUTOFF_HOUR` env var. |
| **Outlet derived from the JWT, never from the client** | `req.authUser.outletId` is the only outlet used. Client-sent `outletId` is ignored → store isolation (TC-3.5) is structural, not a UI filter. |
| **Brand/district/depot/window denormalized onto the order** | Copied from the outlet record at creation (brand may be overridden by the form — the design lets managers pick). Planning queries stay fast; outlet edits don't rewrite history. |
| **`notes` column added** | The Create Order form has an "Order notes" field; the Phase 1 schema lacks it. One tiny migration (`ALTER TABLE orders ADD COLUMN notes TEXT`). Log in `document/design-deviations.md`. |
| **UI "Packages" → `units`** | The schema's `units` column stores the package count shown in the UI. |
| **New order IDs continue the ORD-##### pattern** | `ORD-` + next number after the current max (seed max is **ORD-10491**; `ORD-10527` is the static ID on the design's confirmation screen and is only the empty-table fallback). Keeps the Mono-styled IDs consistent across the UI. Demo-scale find-then-create — a sequence table is a post-hackathon improvement. |
| **Delivery date validated server-side** | Must be ≥ earliest allowed date (cutoff rule) and an operating day (Mon–Sat). Violations → HTTP 400 with a clear message. |

---

## Repository Structure Updates

```
WayPoint/
├── api/
│   ├── prisma/
│   │   └── schema.prisma            ← + notes String? on Order (migration)
│   └── src/
│       ├── utils/
│       │   └── cutoff.ts            ← NEW: cutoff + operating-day logic
│       ├── controllers/
│       │   └── orderController.ts   ← NEW: create, listMine, getById
│       └── routes/
│           ├── orders.ts            ← NEW: /orders
│           └── planning.ts          ← + POST /planning/close
└── src/                             ← web app (repo root — NOT apps/web)
    ├── services/
    │   └── orders.ts                ← NEW: typed order API calls
    ├── context/
    │   └── AppContext.tsx           ← + orderDraft / lastCreatedOrder state
    └── components/store/
        └── StoreManagerScreens.tsx  ← wire Create/Review/Confirm/List/Home/Tracking
```

---

## Step-by-Step Tasks

### TASK 3.1 — Schema: add `notes` to Order

```prisma
model Order {
  // ...existing fields...
  notes String?
}
```

```bash
cd api
npx prisma migrate dev --name add_order_notes
```

Update `.env.example` (and `.env`) with the cutoff setting:

```env
# Hour of day (0–23, local server time) after which next-day ordering closes.
# The approved design shows 4:00 PM.
ORDER_CUTOFF_HOUR=16
```

**Also add a second store manager to `prisma/seed.ts`** (test fixture — TC-3.5/TC-3.8 store isolation needs a token from a *different* outlet):

| Role | Email | Password | outlet_id |
|---|---|---|---|
| STORE_MANAGER | `tharindu@waypoint.lk` | demo1234 | OUT041 (Waypoint Fresh Colombo 3) |

Upsert like the existing users. TC-1.3's expected output line becomes `✅ 5 users created`.

---

### TASK 3.2 — Cutoff utility

File: `api/src/utils/cutoff.ts`

```typescript
/** Waypoint operates Monday–Saturday. The daily order cutoff defaults to 16:00 (per the approved design). */

const CUTOFF_HOUR = Number(process.env.ORDER_CUTOFF_HOUR ?? 16);

export function isOperatingDay(d: Date): boolean {
  return d.getDay() !== 0; // no Sunday operations
}

/** Next operating day strictly after `d`. */
export function nextOperatingDay(d: Date): Date {
  const next = new Date(d);
  do {
    next.setDate(next.getDate() + 1);
  } while (!isOperatingDay(next));
  return next;
}

/**
 * Earliest delivery date an order placed at `now` may request.
 * Before cutoff today → tomorrow (next operating day).
 * At/after cutoff   → the operating day after that.
 */
export function earliestDeliveryDate(now = new Date()): Date {
  const base = nextOperatingDay(now);
  return now.getHours() >= CUTOFF_HOUR ? nextOperatingDay(base) : base;
}

/** True if `date` (YYYY-MM-DD) is allowed for an order placed now. */
export function isDeliveryDateAllowed(date: Date, now = new Date()): boolean {
  const earliest = earliestDeliveryDate(now);
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  return isOperatingDay(dayStart) && dayStart >= new Date(earliest.setHours(0, 0, 0, 0));
}
```

---

### TASK 3.3 — Order controller

File: `api/src/controllers/orderController.ts`

```typescript
import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { isDeliveryDateAllowed } from '../utils/cutoff';

const TEMP_MAP: Record<string, 'CHILLED' | 'FROZEN' | 'AMBIENT'> = {
  chilled: 'CHILLED', frozen: 'FROZEN', ambient: 'AMBIENT',
  CHILLED: 'CHILLED', FROZEN: 'FROZEN', AMBIENT: 'AMBIENT',
};

/** POST /orders — store manager creates an order for their own outlet. */
export async function createOrder(req: Request, res: Response) {
  const outletId = req.authUser!.outletId;
  if (!outletId) return res.status(400).json({ error: 'Your account is not linked to an outlet' });

  const { brand, tempRequirement, weightKg, volumeM3, units, windowOpen, windowClose, deliveryDate, notes } = req.body ?? {};

  // Validation (TC-3.2, TC-3.3)
  const weight = Number(weightKg);
  if (!Number.isFinite(weight) || weight <= 0) {
    return res.status(400).json({ error: 'weightKg must be a positive number' });
  }
  const temp = TEMP_MAP[String(tempRequirement)];
  if (!temp) return res.status(400).json({ error: 'tempRequirement must be CHILLED, FROZEN or AMBIENT' });
  const volume = volumeM3 === undefined ? 0 : Number(volumeM3);
  if (!Number.isFinite(volume) || volume < 0) return res.status(400).json({ error: 'volumeM3 must be ≥ 0' });
  const unitCount = units === undefined ? 0 : Number(units);
  if (!Number.isInteger(unitCount) || unitCount < 0) return res.status(400).json({ error: 'units must be a non-negative integer' });
  const date = new Date(`${deliveryDate}T00:00:00`);
  if (!deliveryDate || Number.isNaN(date.getTime())) return res.status(400).json({ error: 'deliveryDate must be YYYY-MM-DD' });
  if (!isDeliveryDateAllowed(date)) {
    return res.status(400).json({ error: 'Delivery date is before the cutoff or not an operating day (Mon–Sat). Choose a later date.' });
  }

  const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
  if (!outlet) return res.status(400).json({ error: 'Linked outlet not found' });

  // Continue the ORD-##### sequence for UI consistency.
  // Seed max is ORD-10491; 10527 is only the fallback for an empty table
  // (matches the ID shown on the design's confirmation screen).
  // Demo-scale: the find-then-create sequence can race under concurrent writes —
  // acceptable here; a serial sequence/sequence table is a post-hackathon improvement.
  // (Works because all ORD ids share the same 5-digit width, so id 'desc' is numeric-safe.)
  const last = await prisma.order.findFirst({ where: { id: { startsWith: 'ORD-' } }, orderBy: { id: 'desc' } });
  const nextNum = (last ? parseInt(last.id.slice(4), 10) : 10527) + 1;

  const order = await prisma.order.create({
    data: {
      id: `ORD-${nextNum}`,
      outletId,
      brand: typeof brand === 'string' && brand ? brand : outlet.brand,
      district: outlet.district,
      depot: outlet.depot,
      temperatureRequirement: temp,
      units: unitCount,
      weightKg: weight,
      volumeM3: volume,
      windowOpen: windowOpen || outlet.windowOpen,
      windowClose: windowClose || outlet.windowClose,
      deliveryDate: date,
      notes: typeof notes === 'string' ? notes : null,
      createdBy: req.authUser!.id,
      status: 'NEW',
    },
  });

  return res.status(201).json({ order });
}

/** GET /orders — the caller's own outlet only (TC-3.5 store isolation). */
export async function listMyOrders(req: Request, res: Response) {
  const orders = await prisma.order.findMany({
    where: { outletId: req.authUser!.outletId ?? '__none__' },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ orders });
}

/** GET /orders/:id — 404 unless the order belongs to the caller's outlet. */
export async function getMyOrder(req: Request, res: Response) {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, outletId: req.authUser!.outletId ?? '__none__' },
    include: {
      tripStops: { include: { trip: { include: { vehicle: true } }, proofOfDelivery: true } },
      deferrals: true,
    },
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  return res.json({ order });
}
```

---

### TASK 3.4 — Order routes

File: `api/src/routes/orders.ts`

```typescript
import { Router } from 'express';
import { createOrder, getMyOrder, listMyOrders } from '../controllers/orderController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

export const ordersRouter = Router();

ordersRouter.use(authMiddleware, requireRole('STORE_MANAGER'));
ordersRouter.post('/', createOrder);
ordersRouter.get('/', listMyOrders);
ordersRouter.get('/:id', getMyOrder);
```

Mount in `src/index.ts`: `app.use('/orders', ordersRouter);`

---

### TASK 3.5 — Queue close endpoint (dispatcher)

Append to `api/src/routes/planning.ts`:

```typescript
/** POST /planning/close — locks tomorrow's queue: NEW → CONFIRMED. */
planningRouter.post('/close', authMiddleware, requireRole('DISPATCHER'), async (_req, res) => {
  const tomorrow = nextOperatingDay(new Date());
  const start = new Date(tomorrow); start.setHours(0, 0, 0, 0);
  const end = new Date(tomorrow); end.setDate(end.getDate() + 1);

  const result = await prisma.order.updateMany({
    where: { status: 'NEW', deliveryDate: { gte: start, lt: end } },
    data: { status: 'CONFIRMED' },
  });
  res.json({ closed: result.count, deliveryDate: start });
});
```

(import `nextOperatingDay` from `../utils/cutoff`, and `authMiddleware` from `../middleware/authMiddleware`.)

> ⚠️ **Do not omit `authMiddleware`** — `requireRole` reads `req.authUser`, which only `authMiddleware` sets. Without it this route always returns 401. (The existing `/queue` route already shows the correct pattern: `authMiddleware, requireRole(...)`.)

---

### TASK 3.6 — Frontend order service

File: `src/services/orders.ts`

```typescript
import { apiFetch } from './api';

export interface ApiOrder {
  id: string;
  outletId: string;
  brand: string;
  district: string;
  depot: string;
  temperatureRequirement: 'CHILLED' | 'FROZEN' | 'AMBIENT';
  units: number;
  weightKg: number;
  volumeM3: number;
  windowOpen: string;
  windowClose: string;
  deliveryDate: string;
  status: 'NEW' | 'CONFIRMED' | 'PLANNED' | 'LOADING' | 'IN_TRANSIT' | 'DELIVERED' | 'DEFERRED' | 'AT_RISK';
  notes: string | null;
  createdAt: string;
}

export interface CreateOrderInput {
  brand?: string;
  tempRequirement: 'CHILLED' | 'FROZEN' | 'AMBIENT';
  weightKg: number;
  volumeM3?: number;
  units?: number;
  windowOpen?: string;
  windowClose?: string;
  deliveryDate: string; // YYYY-MM-DD
  notes?: string;
}

export const ordersApi = {
  create: (input: CreateOrderInput) =>
    apiFetch<{ order: ApiOrder }>('/orders', { method: 'POST', body: JSON.stringify(input) }),
  list: () => apiFetch<{ orders: ApiOrder[] }>('/orders'),
  get: (id: string) => apiFetch<{ order: ApiOrder }>(`/orders/${id}`),
};
```

---

### TASK 3.7 — Draft state in AppContext

Add to `AppContext` (create → review → place is a 3-screen flow; the draft lives in context, not the URL):

```typescript
export interface OrderDraft {
  brand: 'Fresh' | 'Style' | 'Tech';
  deliveryDate: string;      // YYYY-MM-DD
  window: string;            // "05:00–07:30"
  temp: 'Chilled' | 'Frozen' | 'Ambient';
  weightKg: string;
  volumeM3: string;
  packages: string;
  notes: string;
}

// context value additions:
orderDraft: OrderDraft | null;
setOrderDraft: (d: OrderDraft | null) => void;
lastCreatedOrder: ApiOrder | null;
placeOrder: () => Promise<ApiOrder>; // POSTs orderDraft, stores result, navigates to confirmation
```

`placeOrder` maps the draft to the API payload (`Chilled`→`CHILLED`, window `05:00–07:30` → `windowOpen`/`windowClose` split on `–`).

---

### TASK 3.8 — Wire the store screens

| Screen | Change |
|---|---|
| `CreateOrder` | Local state already exists → write to `orderDraft` on "Review order". Cutoff banner stays (now backed by the server rule). |
| `OrderReview` | Render the real `orderDraft` (all InfoRows). "Place order" → `placeOrder()` with loading + error states. |
| `OrderConfirmation` | Render `lastCreatedOrder` (real `ORD-#####`, delivery date, window). |
| `StoreOrders` | `ordersApi.list()` on mount; map `ApiOrder` → table rows; filters client-side (Active = NEW/CONFIRMED/PLANNED/LOADING/IN_TRANSIT/AT_RISK). Row click → `setSelectedOrder(id)` → `store/tracking`. |
| `StoreHome` | Stats + recent orders from `ordersApi.list()`; keep the hero delivery card mock until Phase 8 (note in deviations log). |
| `DeliveryTracking` | `ordersApi.get(selectedOrderId)`; render status timeline from real status. |

All lists show loading skeletons and a friendly error card on failure (per Phase 9 conventions — basic versions here).

---

## Test Cases

### TC-3.1 — Create valid order

**Action:** `POST /orders` with valid payload (store manager token).
**Expected:** HTTP 201, order has status `NEW`, outlet = caller's outlet, id matches `ORD-#####`.

### TC-3.2 — Required field validation

**Action:** Omit `weightKg` / `tempRequirement` / `deliveryDate`.
**Expected:** HTTP 400 with a field-specific message; nothing persisted.

### TC-3.3 — Invalid quantity

**Action:** `weightKg: -5`, `units: 1.5`.
**Expected:** HTTP 400; nothing persisted.

### TC-3.4 — Order persistence

**Action:** Create an order, restart the API, `GET /orders`.
**Expected:** The order is still listed.

### TC-3.5 — Store isolation

**Action:** Login as `tharindu@waypoint.lk` (OUT041 — the second manager seeded in TASK 3.1). `GET /orders` and `GET /orders/ORD-10483` (an OUT032 order).
**Expected:** List contains only OUT041 orders; the OUT032 order read → HTTP 404 (existence is not leaked).

### TC-3.6 — Status display

**Expected:** UI shows API statuses mapped to badges (NEW → New, etc.).

### TC-3.7 — Cutoff enforcement

**Action:** Set server clock past 16:00 (or temporarily set `ORDER_CUTOFF_HOUR=0`), then order for the nearest allowed day.
**Expected:** HTTP 400 explaining the cutoff; UI banner message matches the server rule.

### TC-3.8 — Cross-outlet read blocked

**Action:** Call `GET /orders/ORD-10455` (OUT032's order) as `tharindu@waypoint.lk` (OUT041).
**Expected:** HTTP 404 (existence is not leaked).

### TC-3.9 — Queue close

**Action:** Dispatcher calls `POST /planning/close`.
**Expected:** Tomorrow's NEW orders become CONFIRMED; response reports the count; store tracking shows "Confirmed".

---

## Commit Sequence (get approval from user)

> Paths use the real repo layout (`WayPoint/` root), not `apps/web/`.

```bash
git add api/prisma/schema.prisma api/prisma/migrations
git commit -m "feat(db): add notes column to orders"

git add api/.env.example api/src/utils/cutoff.ts
git commit -m "feat(api): add order cutoff utility (16:00 default per design)"

git add api/src/controllers/orderController.ts api/src/routes/orders.ts api/src/index.ts
git commit -m "feat(api): order creation and store-scoped order queries"

git add api/src/routes/planning.ts
git commit -m "feat(api): add planning queue close endpoint"

git add src/services/orders.ts src/context/AppContext.tsx
git commit -m "feat(web): order api client and order draft state"

git add src/components/store/
git commit -m "feat(web): wire store order flow to the real api"
```

---

## Phase 3 → Phase 4 Handoff Criteria

- [ ] TC-3.1 – TC-3.9 all pass
- [ ] A freshly placed order appears in `GET /planning/queue` for the dispatcher
- [ ] `POST /planning/close` confirms tomorrow's queue
- [ ] No mock `ORDERS` import remains in store screens (dispatcher screens still mock — Phase 4)
- [ ] `document/design-deviations.md` updated: cutoff 16:00 default, `notes` column added, store home hero card still mock
