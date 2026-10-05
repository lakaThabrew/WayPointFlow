# Phase 6 — Driver Route + Delivery

**Branch:** `lakmana-phase-06`
**Target Day:** October 3, 2026
**Depends on:** Phase 5 (loading workflow) ✅
**Status:** 🟢 Implemented (2026-10-04 audit) — route/arrive/complete/issue endpoints live and DRIVER-guarded; route scoped to the driver's depot; stop status guards stop re-delivery or arrival on an ISSUE stop; trips transition to COMPLETED when every stop resolves; receiver name is required for PoD; missing driver-trip wiring and error/empty states fixed; api + web build clean (0 TS errors)

---

## Objective

Implement the delivery execution workflow. Provide drivers with a clear, mobile-friendly interface for their assigned routes, allowing them to mark arrivals, complete deliveries, capture proof of delivery, and report issues.

**Workflow:**
```text
Trip Ready (Dispatcher/Loader)
        ↓
Driver Route (View assigned trip)
        ↓
Arrive (Mark stop arrived)
        ↓
Complete Delivery (or Report Issue)
        ↓
Proof of Delivery (Receiver name + signature note)
        ↓
Next Stop (Proceed to next destination)
```

---

## End-of-Phase Definition of Done

```
✅ GET /driver/route returns the assigned active trip for the logged-in driver
✅ POST /stops/:id/arrive successfully marks the driver as arrived at the stop
✅ POST /stops/:id/complete correctly updates the stop status and related order statuses to DELIVERED
✅ POST /stops/:id/issue allows drivers to report issues, persisting them to the database
✅ Proof of Delivery (receiver name + signature note) is captured on completion
✅ Driver screens (Route Overview, Stop Details, Delivery Confirmation) are functional
✅ Role Guarding verified (only DRIVER role can access these APIs)
✅ All TC-6.x test cases pass
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **No Photo Upload (MVP)** | To simplify the hackathon implementation and MVP scope, photo upload is deferred. Proof of delivery requires only receiver name and signature note. |
| **Atomic Status Updates** | Arriving, completing deliveries, and reporting issues are distinct atomic API calls to accurately track the timeline of events. |
| **Mobile-First Focus** | Drivers will primarily use mobile devices, so the frontend implementation must prioritize mobile responsiveness for these specific screens. |

---

## Backend Implementation Steps

### 1. API Endpoints
- **Driver Route:** `GET /api/driver/route`
  - Fetch active trip(s) assigned to the logged-in driver's vehicle.
  - Return the sequence of stops and related order details.
- **Stop Arrival:** `POST /api/stops/:id/arrive`
  - Update `trip_stops.status` to `ARRIVED`.
  - Record `actual_arrival` timestamp.
- **Complete Delivery:** `POST /api/stops/:id/complete`
  - Update `trip_stops.status` to `COMPLETED`.
  - Update corresponding `orders.status` to `DELIVERED`.
  - Accept payload for Proof of Delivery (receiver name, signature note) and create a `proof_of_delivery` record.
- **Report Issue:** `POST /api/stops/:id/issue`
  - Record delivery issues against the stop/order and surface them for operations.

### 2. Database & Models
- Use the existing `proof_of_delivery` model (receiver_name, signature_note).
- Ensure `trip_stops` status (`ARRIVED`, `COMPLETED`) and `orders` status (`DELIVERED`) are correctly managed.

---

## Frontend Implementation Steps

### 1. Driver Route View
- Display the assigned trip and the sequence of stops.
- Show clear navigation to the next pending stop.
- Optimize layout for mobile screens.

### 2. Stop Details
- Show delivery details (quantities, items) for the current stop.
- Provide a prominent CTA to mark "Arrive" once at the location.

### 3. Delivery Confirmation & Issues
- Provide a form to input Receiver Name and Signature Note.
- Provide a separate CTA/flow to report delivery issues (e.g., damaged goods, outlet closed).
- Use toast notifications for success/error feedback.

---

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
