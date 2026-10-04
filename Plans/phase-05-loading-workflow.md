# Phase 5 — Loading Workflow

**Branch:** `lakmana-phase-05`
**Target Day:** October 3, 2026
**Depends on:** Phase 4 (dispatcher planning) ✅
**Status:** 🟢 Implemented (2026-10-04 audit) — queue/manifest/events/ready endpoints live and role-guarded; checklist now captures real loaded quantities with shortfall flags and the "dispatch with shortfalls" confirmation; `markTripReady` enforces the atomic ready gate; loading/error/empty states added; api + web build clean (0 TS errors)

---

## Objective

Connect planned trips to the warehouse loading process. Provide the warehouse loaders with a clear, step-by-step workflow for reviewing trip manifests, verifying quantities as items are loaded into vehicles, handling shortfalls, and marking trips as ready for dispatch.

**Workflow:**
```text
Dispatcher releases trip (PLANNED -> RELEASED)
        ↓
Loader queue (sees RELEASED trips)
        ↓
Trip manifest (view orders for a trip)
        ↓
Check quantities (verify expected vs actual)
        ↓
Shortfall detection (flag discrepancies)
        ↓
Trip ready (RELEASED -> READY)
```

---

## End-of-Phase Definition of Done

```
✅ GET /loading/queue returns all trips with `status = RELEASED`
✅ GET /loading/trips/:id/manifest returns the full manifest of orders for the trip
✅ POST /loading/events successfully records the loaded quantity for each order/item
✅ Shortfall flag is correctly set to `true` when loaded quantity < expected quantity
✅ POST /loading/trips/:id/ready transitions trip status from `RELEASED` to `READY`
✅ Non-loader roles cannot access or submit to loading APIs (Role Guarding verified)
✅ Loading Queue, Trip Manifest, and Loading Checklist screens are wired and functional
✅ All TC-5.x test cases pass
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Shortfall Handling without Trip Cancellation** | The MVP allows shortfalls to be recorded, flagging them for operations, but doesn't necessarily block the trip from proceeding if the business logic allows partial deliveries. This keeps the physical flow moving even if warehouse inventory was slightly off. |
| **Atomic Ready Action** | Transitioning a trip to `READY` should happen only after the manifest has been completely checked or acknowledged, preventing accidental early dispatches. |
| **Separation of Loading Events** | Keeping a separate "Loading Event" record (instead of just overwriting order quantities) gives a clear audit trail of what happened during the loading process vs. what was planned vs. what was delivered. |

---

## Backend Implementation Steps

### 1. API Endpoints
- **Loader Queue:** `GET /api/loading/queue`
  - Fetch trips where `status === 'RELEASED'`.
  - Include summary stats (number of stops, total quantity, vehicle ID, driver info).
- **Trip Manifest:** `GET /api/loading/trips/:id/manifest`
  - Fetch trip details, sequence of stops, and the list of orders to load.
- **Loading Checklist / Events:** `POST /api/loading/events`
  - Accept payload containing `tripId`, `orderId`, and `loadedQuantity`.
  - Check if `loadedQuantity < expectedQuantity`. If so, set a `shortfall` flag on the order/trip.
  - Optionally validate that the user has `LOADER` or `ADMIN` role.
- **Mark Trip Ready:** `POST /api/loading/trips/:id/ready`
  - Update trip status to `READY`.
  - Verify that all necessary checklist items/events are submitted before allowing this transition.

### 2. Database & Models
- Ensure the `Trip` and `Order` models have the necessary status fields (`RELEASED`, `READY`).
- Define a `LoadingEvent` model or equivalent table/fields to persist actual quantities loaded vs expected quantities, tied to the user (loader) recording it.

---

## Frontend Implementation Steps

### 1. Loader Queue View
- Display a list/grid of `RELEASED` trips awaiting loading.
- Add clear identifiers: Trip ID, Vehicle, Target departure time, total items.

### 2. Trip Manifest & Loading Checklist
- Detailed view when clicking a trip in the queue.
- Show a checklist UI containing all items grouped by order or stop.
- Input fields or stepper controls for loaders to input actual `loadedQuantity`.
- Real-time UI indicator (e.g., color change to yellow/red) if a shortfall is entered.

### 3. Action Buttons & Feedback
- A "Complete Loading" or "Mark as Ready" CTA button.
- Confirmation dialog if a shortfall was detected: "You are dispatching this trip with shortfalls. Continue?"
- Toast notifications for successful event submission and status updates.
- Redirect back to the Loader Queue upon marking a trip as `READY`.

---

## Test Cases

### TC-5.1 — Released trip appears
**Expected:** Released trip appears in loader queue.

### TC-5.2 — Manifest
**Expected:** All trip orders appear in the manifest accurately.

### TC-5.3 — Correct quantity
**Expected:** Submitting a loading event with the matching expected quantity records successfully and flags no shortfall.

### TC-5.4 — Shortfall
**Input:** Loaded quantity < expected quantity.
**Expected:** Shortfall flag becomes true.

### TC-5.5 — Ready trip
**Expected:** Trip changes to ready state (`READY`).

### TC-5.6 — Unauthorized loading
**Expected:** Non-loader (e.g., STORE or DRIVER) cannot submit loading events via API.
