# WaypointFlow

WaypointFlow is a comprehensive logistics and delivery operations web application built for the **Tech-Triathlon 2026** hackathon. It is designed to handle multiple roles and scenarios in a supply chain, ensuring smooth operations from dispatch to delivery.

## Overview

This project provides tailored interfaces for different user roles within the supply chain:
- **Dispatcher:** Overview, planning workspace, live operations, constraint conflict management, deferral decisions, and forecasting.
- **Loader:** Loading queues, checklists, shortfall management, and departure readiness.
- **Driver:** Mobile-friendly interfaces for route overviews, stop details, delivery confirmations, and issue reporting.
- **Store Manager:** Store overview, order creation and review, delivery tracking, and receiving.
- **Degradation/Offline Mode:** Specialized screens handling offline scenarios, connection loss, syncing, and capacity conflicts.

## Features
- Complete multi-role workflow: Store Order → Dispatcher Plan → Loader → Driver → Delivery → Receipt.
- Offline-ready driver capabilities utilizing Service Workers and local storage sync.
- Interactive constraint validation and planning workspace.
- Production-ready Docker orchestrations with Express API and Postgres.
- Responsive design tailored for mobile (Drivers) to desktop (Dispatchers).

## Tech Stack & Architecture

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4, Framer Motion, Lucide React
- **Backend API:** Node.js, Express, TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Containerization:** Docker, Docker Compose, Nginx (frontend proxy)

## Running Locally via Docker (Recommended)

The easiest way to run the entire stack locally with no external dependencies (or credentials) is through Docker Compose. This boot up includes the PostgreSQL database, applies Prisma migrations, seeds the database with demo users/data, and spins up the Nginx-hosted Vite frontend and Express backend.

1. Clone the repository and navigate into it.
2. Start the services using Docker Compose:
   ```bash
   docker compose up --build -d
   ```
3. Open your browser to the web frontend:
   **http://localhost:8080**
4. To stop the containers, run:
   ```bash
   docker compose down
   ```

## Demo Credentials

You can test the application using the following seeded demo accounts. All accounts use the same password:

**Password:** `demo1234`

| Role | Email |
| :--- | :--- |
| **Dispatcher** | ashan@waypoint.lk |
| **Loader** | ruwini@waypoint.lk |
| **Driver** | kasun.p@waypoint.lk |
| **Store Manager** | chamari@waypoint.lk |

## Manual Local Setup (Without Docker)

### 1. Database Setup
Ensure you have a PostgreSQL server running locally.
Create a `.env` file in the `./api` directory with your database connection URL:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/waypointflow?schema=public"
JWT_SECRET="local-secret"
PORT=4000
```

### 2. Backend (API)
```bash
cd api
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

### 3. Frontend (Web)
```bash
# In the root project directory
npm install
npm run dev
```
Navigate to `http://localhost:5173` in your browser.

## Documentation & Assets
For detailed implementation plans and design deviations, check out the `docs/` and `Plans/` directory in the repository.

---
*Built for the Tech-Triathlon 2026 Hackathon.*
