# Phase 1 — Database + Backend Foundation (Docker local + Supabase production)

**Branch:** `lakmana-phase-01`
**Target Day:** October 2, 2026
**Deadline:** End of Day (before Phase 2 begins)
**Status:** 🟢 Implemented locally (2026-10-02) — all TC-1.x pass; TASK 1.6 (Supabase production) pending manual account setup

---

## Objective

Create the real Express/TypeScript backend, define the full Prisma schema, connect to a local Docker PostgreSQL (production uses the same containerized/hosted PostgreSQL — no Supabase — wired in Phase 11), run migrations, and seed the demo dataset. The phase ends with a working `GET /health` endpoint and a fully seeded database that can be verified by any team member.

---

## End-of-Phase Definition of Done

```
✅ Express TypeScript API starts without errors
✅ Prisma schema covers all entities
✅ npx prisma migrate dev succeeds locally
✅ npx prisma db seed populates all demo fixtures
✅ GET /health → { "status": "ok" }  (HTTP 200)
✅ docker compose up db → local PostgreSQL accessible on port 55432
✅ Production database strategy documented (hosted PostgreSQL, no Supabase — wired in Phase 11)
✅ All TC-1.x test cases pass
```

---

## Repository Structure to Create

```
Tri-athon/
└── api/
    ├── src/
    │   ├── index.ts          ← Express app entry point
    │   └── routes/
    │       └── health.ts     ← GET /health
    ├── prisma/
    │   ├── schema.prisma     ← Full Prisma schema
    │   └── seed.ts           ← Demo seed data
    ├── package.json
    ├── tsconfig.json
    └── Dockerfile
```

> **Note:** `docker-compose.yml` lives at the repo root (`Tri-athon/`), not inside `api/`.

---

## Step-by-Step Tasks

### TASK 1.0 — Initialise the `api/` package

```bash
mkdir api && cd api
npm init -y
npm install express cors dotenv
npm install -D typescript @types/node @types/express ts-node-dev
npx tsc --init
```

**`tsconfig.json` settings:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*", "prisma/seed.ts"]
}
```

> `rootDir: "."` + the `include` above make `tsc` compile **both** `src/` and `prisma/seed.ts`, producing `dist/src/index.js` and `dist/prisma/seed.js`. This is required because the production Docker image has no `ts-node` — the seed must run as compiled JS there (see TASK 1.5a).

**`package.json` scripts:**

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "start": "node dist/src/index.js",
    "db:migrate": "prisma migrate dev",
    "db:seed": "ts-node prisma/seed.ts",
    "db:seed:compiled": "node dist/prisma/seed.js",
    "db:studio": "prisma studio"
  }
}
```

---

### TASK 1.1 — Install and configure Prisma

```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

This creates:

- `prisma/schema.prisma`
- `.env` (with `DATABASE_URL` placeholder)

**`.env` (local / Docker):**

```env
DATABASE_URL="postgresql://waypoint:waypoint@localhost:55432/waypointflow?schema=public"
PORT=4000
JWT_SECRET=local-dev-secret-change-in-production
```

> **Port note:** the compose `db` service publishes host port **55432** → container 5432 because this machine already runs PostgreSQL 18 on 5432/5433. If your machine has no local PostgreSQL, 5432 works too — keep `.env` and `docker-compose.yml` consistent either way.

> **Production `.env`:** Replace `DATABASE_URL` with the production PostgreSQL connection string (set at deploy time in Phase 11). Never commit `.env` files.

---

### TASK 1.2 — Write the Prisma Schema

Full file: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ────────────────────────────────────────────────────────────────────

enum Role {
  STORE_MANAGER
  DISPATCHER
  LOADER
  DRIVER
}

enum DockType {
  REAR_DOCK
  CURB
  MALL_BAY
}

enum ParkingConstraint {
  NONE
  VAN_ONLY
}

enum VehicleType {
  TRUCK
  VAN
}

enum TemperatureType {
  REEFER
  AMBIENT
}

// Goods requirement (orders) — NOT the same as vehicle capability.
// Rule: CHILLED/FROZEN ⇒ REEFER vehicle; AMBIENT ⇒ any vehicle.
enum TempRequirement {
  CHILLED
  FROZEN
  AMBIENT
}

enum OrderStatus {
  NEW
  CONFIRMED
  PLANNED
  LOADING
  IN_TRANSIT
  DELIVERED
  DEFERRED
  AT_RISK
}

enum TripStatus {
  PLANNED
  RELEASED
  LOADING
  READY
  IN_TRANSIT
  COMPLETED
}

enum StopStatus {
  PENDING
  ARRIVED
  COMPLETED
  ISSUE
}

// ─── Core Entities ────────────────────────────────────────────────────────────

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  role         Role
  name         String
  depot        String?
  outletId     String?  @map("outlet_id")
  phone        String?
  createdAt    DateTime @default(now()) @map("created_at")

  orders        Order[]
  deferrals     Deferral[]
  loadingEvents LoadingEvent[]

  @@map("users")
}

model Outlet {
  id                String            @id @default(uuid())
  name              String
  brand             String
  district          String
  depot             String
  dockType          DockType          @map("dock_type")
  parkingConstraint ParkingConstraint @default(NONE) @map("parking_constraint")
  mallWindowOpen    String?           @map("mall_window_open")
  mallWindowClose   String?           @map("mall_window_close")
  windowOpen        String            @map("window_open")
  windowClose       String            @map("window_close")
  createdAt         DateTime          @default(now()) @map("created_at")

  orders    Order[]
  tripStops TripStop[]

  @@map("outlets")
}

model Vehicle {
  id               String          @id @default(uuid())
  registrationNo   String          @unique @map("registration_no")
  type             VehicleType
  temperatureType  TemperatureType @map("temperature_type")
  maxWeightKg      Float           @map("max_weight_kg")
  maxVolumeM3      Float           @map("max_volume_m3")
  fuelType         String          @map("fuel_type")
  kmPerL           Float           @map("km_per_l")
  weeklyFuelQuotaL Float           @map("weekly_fuel_quota_l")
  depot            String
  active           Boolean         @default(true)

  trips Trip[]

  @@map("vehicles")
}

model Order {
  id                     String          @id @default(uuid())
  outletId               String          @map("outlet_id")
  brand                  String
  district               String
  depot                  String
  temperatureRequirement TempRequirement @map("temperature_requirement")
  units                  Int
  weightKg               Float           @map("weight_kg")
  volumeM3               Float           @map("volume_m3")
  windowOpen             String          @map("window_open")
  windowClose            String          @map("window_close")
  deliveryDate           DateTime        @map("delivery_date")
  status                 OrderStatus     @default(NEW)
  createdBy              String          @map("created_by")
  createdAt              DateTime        @default(now()) @map("created_at")
  updatedAt              DateTime        @updatedAt @map("updated_at")

  outlet        Outlet         @relation(fields: [outletId], references: [id])
  creator       User           @relation(fields: [createdBy], references: [id])
  tripStops     TripStop[]
  deferrals     Deferral[]
  loadingEvents LoadingEvent[]

  @@map("orders")
}

model Trip {
  id               String     @id @default(uuid())
  vehicleId        String     @map("vehicle_id")
  tripNumber       Int        @map("trip_number") // 1 or 2 — max two trips per vehicle per day
  date             DateTime
  brand            String
  district         String
  status           TripStatus @default(PLANNED)
  plannedDeparture DateTime?  @map("planned_departure")
  createdAt        DateTime   @default(now()) @map("created_at")

  vehicle       Vehicle        @relation(fields: [vehicleId], references: [id])
  stops         TripStop[]
  loadingEvents LoadingEvent[]

  @@unique([vehicleId, date, tripNumber])
  @@map("trips")
}

model TripStop {
  id             String     @id @default(uuid())
  tripId         String     @map("trip_id")
  orderId        String     @map("order_id")
  outletId       String     @map("outlet_id")
  sequence       Int
  plannedArrival DateTime?  @map("planned_arrival")
  actualArrival  DateTime?  @map("actual_arrival")
  arrivedAt      DateTime?  @map("arrived_at")
  leftAt         DateTime?  @map("left_at")
  status         StopStatus @default(PENDING)

  trip            Trip             @relation(fields: [tripId], references: [id])
  order           Order            @relation(fields: [orderId], references: [id])
  outlet          Outlet           @relation(fields: [outletId], references: [id])
  proofOfDelivery ProofOfDelivery?

  @@map("trip_stops")
}

model ProofOfDelivery {
  id            String   @id @default(uuid())
  stopId        String   @unique @map("stop_id")
  receiverName  String   @map("receiver_name")
  signatureNote String   @map("signature_note")
  photoUrl      String?  @map("photo_url")
  recordedAt    DateTime @map("recorded_at")
  synced        Boolean  @default(true)

  stop TripStop @relation(fields: [stopId], references: [id])

  @@map("proof_of_delivery")
}

model Deferral {
  id        String   @id @default(uuid())
  orderId   String   @map("order_id")
  reason    String
  decidedBy String   @map("decided_by")
  decidedAt DateTime @map("decided_at")

  order   Order @relation(fields: [orderId], references: [id])
  decider User  @relation(fields: [decidedBy], references: [id])

  @@map("deferrals")
}

model LoadingEvent {
  id            String   @id @default(uuid())
  tripId        String   @map("trip_id")
  orderId       String   @map("order_id")
  loadedQty     Int      @map("loaded_qty")
  expectedQty   Int      @map("expected_qty")
  shortfallFlag Boolean  @default(false) @map("shortfall_flag")
  createdBy     String   @map("created_by")
  createdAt     DateTime @default(now()) @map("created_at")

  trip    Trip  @relation(fields: [tripId], references: [id])
  order   Order @relation(fields: [orderId], references: [id])
  creator User  @relation(fields: [createdBy], references: [id])

  @@map("loading_events")
}

model SyncEvent {
  id               String   @id @default(uuid())
  clientUuid       String   @unique @map("client_uuid")
  role             Role
  payloadJson      Json     @map("payload_json")
  createdOfflineAt DateTime @map("created_offline_at")
  syncedAt         DateTime @default(now()) @map("synced_at")

  @@map("sync_events")
}

// ─── Reference Fixtures ───────────────────────────────────────────────────────

model DistrictTravel {
  id                         String @id @default(uuid())
  district                   String
  depot                      String
  depotToDistrictFreeflowMin Int    @map("depot_to_district_freeflow_min")
  interStopFreeflowMin       Int    @map("inter_stop_freeflow_min")

  @@unique([district, depot])
  @@map("district_travel")
}

model ServiceAllowance {
  id                  String   @id @default(uuid())
  brand               String
  dockType            DockType @map("dock_type")
  serviceAllowanceMin Int      @map("service_allowance_min")

  @@unique([brand, dockType])
  @@map("service_allowance")
}
```

---

### TASK 1.3 — Demo Seed Data Design

File: `prisma/seed.ts`

#### Demo Users (4)

| Role          | Email               | Password | Extra fields                                |
| ------------- | ------------------- | -------- | ------------------------------------------- |
| DISPATCHER    | ashan@waypoint.lk   | demo1234 | depot = Peliyagoda                          |
| LOADER        | ruwini@waypoint.lk  | demo1234 | depot = Peliyagoda                          |
| DRIVER        | kasun.p@waypoint.lk | demo1234 | depot = Peliyagoda                          |
| STORE_MANAGER | chamari@waypoint.lk | demo1234 | outlet_id = OUT032 (Waypoint Fresh Gampaha) |

> The store manager's `outlet_id` must be set — TC-3.5 (store isolation) depends on it.
> Passwords are hashed with **bcryptjs** (salt rounds: 10) before insertion.

#### Demo Outlets (5)

> Demo data mirrors the approved design story: **Fresh / Style / Tech** brands, **Peliyagoda + Kandy** depots, and the outlet/vehicle/order identities used in the UI screens. Do not invent placeholder names — judges compare the working app against the design.

| #   | ID     | Name                         | Brand | District | Depot      | Dock      | Constraint   | Notes                             |
| --- | ------ | ---------------------------- | ----- | -------- | ---------- | --------- | ------------ | --------------------------------- |
| 1   | OUT032 | Waypoint Fresh Gampaha       | Fresh | Gampaha  | Peliyagoda | REAR_DOCK | NONE         | Standard — store manager's outlet |
| 2   | OUT041 | Waypoint Fresh Colombo 3     | Fresh | Colombo  | Peliyagoda | REAR_DOCK | NONE         | Same brand, different district    |
| 3   | OUT063 | Waypoint Tech Nugegoda       | Tech  | Colombo  | Peliyagoda | REAR_DOCK | NONE         | Different brand                   |
| 4   | OUT047 | Waypoint Fresh Kelaniya      | Fresh | Gampaha  | Peliyagoda | CURB      | **VAN_ONLY** | Constraint demo                   |
| 5   | OUT052 | Waypoint Style Majestic City | Style | Colombo  | Peliyagoda | MALL_BAY  | NONE         | Mall window: 10:00–12:00          |

#### Demo Vehicles (4)

| #   | ID     | Reg        | Type  | Temp    | MaxKg | MaxM³ | km/L | Quota (L) | Depot      |
| --- | ------ | ---------- | ----- | ------- | ----- | ----- | ---- | --------- | ---------- |
| 1   | VEH022 | WP-GA-2213 | TRUCK | AMBIENT | 3000  | 15    | 5.8  | 260       | Peliyagoda |
| 2   | VEH014 | WP-GA-1847 | TRUCK | REEFER  | 2400  | 12    | 6.2  | 280       | Peliyagoda |
| 3   | VEH041 | WP-GA-5522 | VAN   | AMBIENT | 800   | 4     | 10.2 | 120       | Peliyagoda |
| 4   | VEH031 | WP-GA-0914 | VAN   | REEFER  | 800   | 4     | 9.1  | 140       | Peliyagoda |

#### Demo District Travel (2 rows)

| District | Depot      | Depot→District (min) | Inter-stop (min) |
| -------- | ---------- | -------------------- | ---------------- |
| Gampaha  | Peliyagoda | 35                   | 15               |
| Colombo  | Peliyagoda | 30                   | 15               |

#### Demo Service Allowance (5 rows)

| Brand | Dock Type | Allowance (min) |
| ----- | --------- | --------------- |
| Fresh | REAR_DOCK | 20              |
| Fresh | CURB      | 30              |
| Style | MALL_BAY  | 45              |
| Style | REAR_DOCK | 25              |
| Tech  | REAR_DOCK | 25              |

#### Demo Orders (8)

> `temperatureRequirement` uses goods requirements (`CHILLED` / `FROZEN` / `AMBIENT`) — never the vehicle capability enum. **Fresh** brand trips are evaluated against the 270-minute pre-dawn budget; other brands against the 480-minute daytime budget.

| #   | ID        | Outlet                              | Temp Req | Weight  | Volume | Status        | Purpose                                                                                    |
| --- | --------- | ----------------------------------- | -------- | ------- | ------ | ------------- | ------------------------------------------------------------------------------------------ |
| 1   | ORD-10483 | OUT032 Waypoint Fresh Gampaha       | CHILLED  | 200 kg  | 0.9 m³ | NEW           | Fresh/reefer order                                                                         |
| 2   | ORD-10486 | OUT063 Waypoint Tech Nugegoda       | AMBIENT  | 350 kg  | 3.5 m³ | NEW           | Normal ambient order                                                                       |
| 3   | ORD-10484 | OUT041 Waypoint Fresh Colombo 3     | CHILLED  | 180 kg  | 1.2 m³ | NEW           | District separation demo (Colombo ≠ Gampaha)                                               |
| 4   | ORD-10491 | OUT052 Waypoint Style Majestic City | AMBIENT  | 3200 kg | 16 m³  | NEW           | Capacity conflict demo (exceeds the only ambient truck, VEH022: 3000 kg / 15 m³)           |
| 5   | ORD-10482 | OUT047 Waypoint Fresh Kelaniya      | CHILLED  | 120 kg  | 0.6 m³ | NEW           | Van-only outlet demo                                                                       |
| 6   | ORD-10485 | OUT052 Waypoint Style Majestic City | AMBIENT  | 400 kg  | 8 m³   | NEW           | Mall window demo                                                                           |
| 7   | ORD-10466 | OUT032 Waypoint Fresh Gampaha       | CHILLED  | 185 kg  | 0.8 m³ | **DEFERRED**  | Pre-seeded deferral demo                                                                   |
| 8   | ORD-10455 | OUT032 Waypoint Fresh Gampaha       | CHILLED  | 240 kg  | 1.1 m³ | **DELIVERED** | Completed-delivery demo — the completed trip's stop references this order (FK requirement) |

Order 7 must have a corresponding `deferrals` record:

```
reason: "No compatible reefer available — all reefer capacity allocated to higher-priority Fresh orders"
```

#### Demo Trip + Stops (1 completed delivery)

- **Trip-1:** Vehicle VEH014, tripNumber 1, status COMPLETED, prior delivery date (2026-09-29), brand Fresh, district Gampaha
  - **Stop-1:** OUT032 Waypoint Fresh Gampaha, order ORD-10455, sequence 1, status COMPLETED
    - `proof_of_delivery`: receiver_name = "Nimal Silva", signature_note = "Received in good condition"
  - **LoadingEvent:** loaded_qty = 45, expected_qty = 50, shortfall_flag = **true**

> **Seed idempotency:** Use `upsert` for all records so the script is safe to re-run.

---

### TASK 1.4 — Express Entry Point

File: `api/src/index.ts`

```typescript
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { healthRouter } from "./routes/health";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);

app.listen(PORT, () => {
  console.log(`[api] WaypointFlow API running on http://localhost:${PORT}`);
});

export default app;
```

File: `api/src/routes/health.ts`

```typescript
import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "error", message: "Database unreachable" });
  }
});
```

> **Note:** a module-level `new PrismaClient()` per route file exhausts connections under `ts-node-dev` hot-reload. Before Phase 2, move the client into a shared singleton — `src/lib/prisma.ts` with `export const prisma = new PrismaClient()` — and import it everywhere.

---

### TASK 1.5 — Local Docker PostgreSQL

Add to repo-root `docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: waypoint
      POSTGRES_PASSWORD: waypoint
      POSTGRES_DB: waypointflow
    ports:
      - "55432:5432" # host port 55432 — host PostgreSQL 18 already occupies 5432/5433
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U waypoint -d waypointflow"]
      interval: 5s
      timeout: 3s
      retries: 10

  api:
    build: ./api
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy # wait until Postgres accepts connections — plain "depends_on" races the first migration
    environment:
      DATABASE_URL: postgresql://waypoint:waypoint@db:5432/waypointflow?schema=public
      PORT: 4000
      JWT_SECRET: change-in-production
    ports:
      - "4000:4000"
    command: >
      sh -c "npx prisma migrate deploy && node dist/prisma/seed.js && node dist/src/index.js"

  # web service added in Phase 10

volumes:
  pgdata:
```

> `version:` is intentionally omitted — it is obsolete in Compose v2 and prints a warning.
> The seed runs as **compiled JS** (`dist/prisma/seed.js`); `ts-node` does not exist in the production image.

Start database only during local development:

```bash
docker compose up db -d
```

---

### TASK 1.5a — API Dockerfile

File: `api/Dockerfile` (listed in the repo structure — it must actually be written in this phase, otherwise the compose `api` service cannot build)

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
RUN npx prisma generate && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
EXPOSE 4000
CMD ["node", "dist/src/index.js"]
```

**Why compiled seeds:** `ts-node` is a dev dependency and is absent from the production image (`npm ci --omit=dev`). The `tsconfig.json` from TASK 1.0 already compiles `prisma/seed.ts` to `dist/prisma/seed.js`, and the compose command runs `node dist/prisma/seed.js`.

**Verify the image boots the full flow:**

```bash
docker compose build api
docker compose up api   # → migrate deploy → seed → listening on :4000
```

---

### TASK 1.6 — Supabase Production Setup

Production database = **Supabase PostgreSQL** (chosen provider). The judge-facing `docker compose up` path never touches Supabase — it always uses the local containerized `db` service.

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose region: **Singapore** (closest to Sri Lanka)
3. Set a strong database password and save it securely
4. From **Project Settings → Database**, copy the **Direct connection** string (port `5432`)
   - The dashboard's default "Connection string" is the **transaction pooler** (port `6543`, pgbouncer). Prisma `migrate deploy` and `db seed` fail against the pooler with prepared-statement errors — always use the direct connection for migrations/seed.
   - The pooler may be used for the runtime API if connection limits ever become an issue; not needed for this project.
5. Create `.env.production` (never commit this file):
   ```env
   DATABASE_URL="postgresql://postgres:<password>@<host>:5432/postgres"   # direct connection
   ```
6. Run migrations and seed against Supabase:
   ```bash
   DATABASE_URL="<supabase-direct-url>" npx prisma migrate deploy
   DATABASE_URL="<supabase-direct-url>" npx ts-node prisma/seed.ts
   ```

> **Free-tier pause:** Supabase pauses free projects after ~7 days of inactivity, which would break judging. Open the dashboard (or hit the production `/health`) on the morning of the submission deadline — and again before the semi-final — to keep the project active.

---

### TASK 1.7 — Install bcryptjs

```bash
cd api
npm install bcryptjs
npm install -D @types/bcryptjs
```

Required for hashing demo user passwords in the seed script. Use **`bcryptjs`** (pure JavaScript), not `bcrypt` — the native `bcrypt` module needs build tools (python3/make/g++) inside the Alpine Docker image and slows the Phase 10 build for zero benefit at this scale.

---

## Test Cases

### TC-1.1 — Database connection

**Action:** `npm run dev` inside `api/`

**Expected:** Console prints `WaypointFlow API running on http://localhost:4000` with no Prisma errors.

---

### TC-1.2 — Migration

**Action:** `npx prisma migrate dev --name init`

**Expected:**

- 12 tables created successfully
- `prisma/migrations/` folder generated
- Zero errors

**Verify:**

```bash
npx prisma studio
# or
psql -h localhost -p 55432 -U waypoint -d waypointflow -c "\dt"
```

---

### TC-1.3 — Seed

**Action:** `npm run db:seed`

**Expected output:**

```
✅ 4 users created
✅ 5 outlets created
✅ 4 vehicles created
✅ 2 district_travel rows created
✅ 5 service_allowance rows created
✅ 8 orders created (1 DEFERRED, 1 DELIVERED, 6 NEW)
✅ 1 deferral record created
✅ 1 trip created (COMPLETED)
✅ 1 trip_stop created (COMPLETED)
✅ 1 proof_of_delivery record created
✅ 1 loading_event with shortfall_flag=true created
```

---

### TC-1.4 — Health endpoint

**Action:**

```bash
curl http://localhost:4000/health
```

**Expected:**

```json
{ "status": "ok" }
```

HTTP status: `200 OK`

---

### TC-1.5 — Data persistence

**Action:**

1. Run seed
2. Stop API (`Ctrl+C`)
3. Restart API (`npm run dev`)
4. Check database via Prisma Studio

**Expected:** All seeded records persist across restart.

---

## Commit Sequence(get approve from user)

```bash
git add api/package.json api/tsconfig.json
git commit -m "feat(api): initialize express typescript backend"

git add api/prisma/schema.prisma
git commit -m "feat(db): add prisma schema with all entities"

git add api/prisma/seed.ts
git commit -m "feat(db): add demo seed fixtures"

git add api/src/
git commit -m "feat(api): add health endpoint"

git add docker-compose.yml
git commit -m "chore(docker): add db and api services to compose"
```

---

## Environment Variables Reference

| Variable       | Local                                                                       | Production                                                 |
| -------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `DATABASE_URL` | `postgresql://waypoint:waypoint@localhost:55432/waypointflow?schema=public` | Supabase URI (direct connection, port 5432) |
| `PORT`         | `4000`                                                                      | Set by host                                                |
| `JWT_SECRET`   | `local-dev-secret-change-in-production`                                     | Strong random string                                       |

> `JWT_SECRET` is not consumed in Phase 1 but should be present to avoid restructuring `.env` in Phase 2.

---

## Dependencies Reference

```json
{
  "dependencies": {
    "@prisma/client": "^5.x",
    "bcryptjs": "^2.x",
    "cors": "^2.x",
    "dotenv": "^16.x",
    "express": "^4.x"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.x",
    "@types/express": "^4.x",
    "@types/node": "^20.x",
    "prisma": "^5.x",
    "ts-node-dev": "^2.x",
    "typescript": "^5.x"
  }
}
```

---

## Phase 1 → Phase 2 Handoff Criteria

Before moving to Phase 2 (Authentication + Role Access), verify all boxes:

- [ ] `GET /health` returns `{ "status": "ok" }` with HTTP 200
- [ ] All 12 database tables exist in local PostgreSQL
- [ ] Seed script runs without errors
- [ ] All 4 demo users are present in the `users` table with hashed passwords
- [ ] Supabase project is created and production `DATABASE_URL` is saved securely
- [ ] Production migration + seed has been run against Supabase
- [ ] `docker compose up db -d` starts PostgreSQL successfully
- [ ] `.gitignore` includes `.env`, `.env.production`, `node_modules/`, `dist/`

---

## Design Notes & Decisions

| Decision                                   | Rationale                                                                                                                                                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No CSV dataset**                         | This phase uses only hardcoded seed fixtures. Full dataset integration is a future (Datathon) phase.                                                                                                       |
| **Seed mirrors the design story**          | Fresh/Style/Tech brands, Peliyagoda/Kandy depots and the UI's outlet/vehicle/order IDs (OUT032, VEH014, ORD-10482…) — judges compare the working app against the approved design, so no placeholder names. |
| **`TempRequirement` vs `TemperatureType`** | Orders store the goods requirement (`CHILLED`/`FROZEN`/`AMBIENT`); vehicles store capability (`REEFER`/`AMBIENT`). Two enums on purpose — the allocator rule maps them (`CHILLED`/`FROZEN` ⇒ `REEFER`).    |
| **Time windows as `String` ("HH:mm")**     | Avoids timezone complexity in the MVP. Can be migrated to proper time types if needed.                                                                                                                     |
| **`photo_url` nullable**                   | Photo upload is explicitly deferred per the implementation plan. Record this in `document/design-deviations.md`.                                                                                           |
| **Seed uses `upsert`**                     | Safe to re-run multiple times without duplicating data.                                                                                                                                                    |
| **bcryptjs in seed**                       | Demo user passwords must be hashed even in Phase 1 — avoids storing plain text at any point. `bcryptjs` (pure JS) avoids native build tooling in the Alpine Docker image.                                  |
| **Compiled seed in Docker**                | Production image has no `ts-node`; `tsc` compiles `prisma/seed.ts` → `dist/prisma/seed.js` and compose runs it with plain `node`.                                                                          |
| **`JWT_SECRET` in `.env` now**             | Pre-configured so Phase 2 auth code works without `.env` restructuring.                                                                                                                                    |
