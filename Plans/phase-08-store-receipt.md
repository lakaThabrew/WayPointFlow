# Phase 8 — Store Receipt + Live Operations

**Branch:** `lakmana-phase-08`
**Target Day:** October 4, 2026
**Depends on:** Phase 7 (offline mode) ✅
**Status:** 🟢 Implemented (2026-10-04 audit) — `POST /orders/:id/receipt`, `GET /planning/live-ops`, `GET /planning/alerts`, and alert acknowledge all live and role-guarded; alerts are scoped by trip date (the old `arrivedAt` filter silently dropped issues reported from a PENDING stop) and mark-read returns 404 for an unknown stop; store tracking hero and live-ops read real API data with loading/error/empty states; api + web build clean (0 TS errors)

---

## Objective

Close the loop between delivery execution and store visibility. This phase provides the store manager with a mechanism to acknowledge receipt of goods and equips the dispatcher with live operational tracking and real-time alerts.

---

## End-of-Phase Definition of Done

```text
✅ Store managers can view the live status of their active deliveries.
✅ Store managers can click "Confirm Receipt" on a DELIVERED order.
✅ Dispatchers have a Live Operations dashboard powered by real backend data.
✅ Driver-reported issues (like damaged goods) trigger live alerts for the Dispatcher.
✅ Dispatchers can mark alerts as "Read".
✅ All TC-8.x test cases pass.
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Dynamic Alerts (No DB Table)** | Instead of creating a separate `Alert` database table, we can generate alerts dynamically by querying `TripStop` records with `status = ISSUE` and `Order` records with `status = AT_RISK`. This ensures data stays perfectly in sync without duplicating state. |
| **Receipt Confirmation Flag** | Adding a `receiptConfirmedAt` timestamp to the `Order` model provides a clear audit trail of exactly when the Store Manager acknowledged the delivery, without needing a massive state machine overhaul. |

---

## Database & Schema Updates

1. **Order Model Update:**
   - Add `receiptConfirmedAt DateTime?` to the `Order` model in `schema.prisma`.
2. **Alert Acknowledgement (Optional):**
   - Add `issueAcknowledged Boolean @default(false)` to `TripStop` to track whether the dispatcher has "read" the issue alert.

---

## Backend Implementation Steps

### 1. Store Manager Endpoints
- **POST /api/orders/:id/receipt**:
  - Verify the order belongs to the caller's outlet.
  - Verify the order status is `DELIVERED`.
  - Set `receiptConfirmedAt` to `now()`.

### 2. Dispatcher Live Operations Endpoints
- **GET /api/planning/live-ops**:
  - Fetch all active trips for today.
  - Include `vehicle` and `stops` (with actual vs planned arrival times) to allow the frontend to render the progress bars.
- **GET /api/planning/alerts**:
  - Query stops where `status = ISSUE` and `issueAcknowledged = false`.
  - Format these records into the alert structure expected by the frontend UI.
- **POST /api/planning/alerts/:stopId/read**:
  - Mark a specific issue/alert as acknowledged (`issueAcknowledged = true`).

---

## Frontend Implementation Steps

### 1. Store Manager Integration
- Update `src/components/store/Tracking.tsx` to display real delivery ETAs based on the active trip's progress.
- Implement the "Confirm Receipt" button logic to hit the new POST endpoint.

### 2. Dispatcher Live Ops Integration
- Update `src/components/dispatcher/LiveOps.tsx` to poll (or fetch on mount) `GET /api/planning/live-ops`.
- Replace the mocked `alerts` state with live data from `GET /api/planning/alerts`.
- Wire up the "Mark as read" button.

---

## Test Cases

### TC-8.1 — Delivered order visible
**Expected:** Store manager sees the order change to `DELIVERED` status once the driver completes it.

### TC-8.2 — Receipt confirmation
**Expected:** Clicking "Confirm Receipt" successfully updates the database and removes the order from the active tracking queue.

### TC-8.3 — Live status
**Expected:** Trip status changes (Arrived, Completed) appear in the Dispatcher's Live Operations view.

### TC-8.4 — Alert
**Expected:** A driver reporting an issue (e.g., Damaged Goods) instantly surfaces an Alert card on the Dispatcher dashboard.

### TC-8.5 — Alert read
**Expected:** Dispatcher can click "Mark as read" on the alert, successfully dismissing it from the unread queue.
