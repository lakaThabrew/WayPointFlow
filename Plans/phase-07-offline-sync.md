# Phase 7 — Offline Mode + Synchronization

**Branch:** `lakmana-phase-07`
**Target Day:** October 4, 2026
**Depends on:** Phase 6 (driver route) ✅
**Status:** 🟢 Implemented (2026-10-04 audit) — IndexedDB outbox, `POST /driver/sync` with `clientUuid` idempotency, and app-level online/offline state all live; queueing now follows the app's offline state (previously `navigator.onLine`, so the in-app offline toggle never queued); sync returns per-event results and only acknowledged events leave the outbox, so failures are retried; api + web build clean (0 TS errors)

---

## Objective

Ensure the driver can perform critical actions without network connectivity. This provides a resilient experience in poor network areas by storing events locally and synchronizing them once connectivity is restored.

**Workflow:**
```text
Driver Action (Arrive, Complete, Issue)
        ↓
Offline Detection (Is network available?)
        ↓ (If offline)
IndexedDB (Store event locally in outbox)
        ↓
Offline UI State (Notify driver of pending sync)
        ↓
Connection Restored
        ↓
POST /sync (Push queued events to server)
        ↓
Server Database (Process events with duplicate protection)
```

---

## End-of-Phase Definition of Done

```
✅ IndexedDB is configured to queue local driver events (Arrival, Delivery, PoD, Issue)
✅ App context can accurately detect online/offline status and update UI globally
✅ Offline actions are saved to the local outbox successfully
✅ POST /sync endpoint is implemented to process queued events
✅ Backend successfully prevents duplicate event processing using client UUIDs
✅ Upon reconnect, the app automatically syncs the local outbox with the server
✅ All TC-7.x test cases pass
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **IndexedDB for Local Storage** | Provides robust, async client-side storage capable of holding complex payloads compared to localStorage. |
| **Client UUIDs for Idempotency** | Prevents duplicate records on the server in case of retries, poor connectivity drops, or redundant sync calls. |
| **Silent Sync with UI Indication** | Sync should happen automatically in the background when connection restores, but the UI must clearly show when data is "pending sync" so the driver knows not to close the app abruptly. |

---

## Backend Implementation Steps

### 1. API Endpoints
- **Synchronization Endpoint:** `POST /api/driver/sync` (or `POST /api/sync`)
  - Accept an array of sync events from the client.
  - Each event payload must include `clientUuid`, `type` (e.g., `ARRIVE`, `COMPLETE`), and associated data.
  - Verify `clientUuid` against `sync_events` table to ensure idempotency.
  - Process the event (update `trip_stops`, `orders`, create `proof_of_delivery`).
  - Store the processed `clientUuid` in `sync_events`.

### 2. Database & Models
- Ensure the `sync_events` table (or equivalent) is set up with `clientUuid` as a unique key to prevent duplicate processing.

---

## Frontend Implementation Steps

### 1. Offline Detection & UI
- Update `AppContext` (or create `SyncContext`) to listen for `online` and `offline` browser events.
- Display an offline banner or badge globally when disconnected.

### 2. Local Event Queue (IndexedDB)
- Set up a utility (using `idb` or raw IndexedDB) to manage a `sync_outbox` store.
- When offline, intercept `markStopArrival`, `completeDelivery`, and `reportIssue` API calls, generating a UUID and saving the payload to the local outbox instead of failing.

### 3. Sync Mechanism
- Implement a background sync function that triggers when the app comes back online.
- Read all pending events from IndexedDB, push them to `POST /sync`, and remove them from the local outbox upon success.

---

## Test Cases

### TC-7.1 — Detect offline
**Action:** Disable network.
**Expected:** Driver UI displays offline state.

### TC-7.2 — Offline arrival
**Action:** Mark stop arrived while offline.
**Expected:** Event saved locally in IndexedDB.

### TC-7.3 — Offline delivery
**Action:** Complete delivery while offline.
**Expected:** Event saved locally in IndexedDB.

### TC-7.4 — Reconnect
**Action:** Restore network.
**Expected:** Pending events are synchronized.

### TC-7.5 — Duplicate sync
**Action:** Send same client UUID twice to the sync API.
**Expected:** Event is processed the first time, but ignored (no duplicate records) the second time.

### TC-7.6 — Sync failure
**Action:** Simulate API failure during sync.
**Expected:** Event remains in local outbox to be retried later.

### TC-7.7 — Sync recovery
**Action:** Restore API functionality.
**Expected:** Pending event eventually synchronizes successfully.
