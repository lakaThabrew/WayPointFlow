# WaypointFlow (Tri-athon)

WaypointFlow is a comprehensive logistics and delivery operations web application. It is designed to handle multiple roles and scenarios in a supply chain, ensuring smooth operations from dispatch to delivery.

## Overview

This project provides tailored interfaces for different user roles within the supply chain:
- **Dispatcher:** Overview, planning workspace, live operations, constraint conflict management, deferral decisions, and forecasting.
- **Loader:** Loading queues, checklists, shortfall management, and departure readiness.
- **Driver:** Mobile-friendly interfaces for route overviews, stop details, delivery confirmations, and issue reporting.
- **Store Manager:** Store overview, order creation and review, delivery tracking, and receiving.
- **Degradation/Offline Mode:** specialized screens handling offline scenarios, connection loss, syncing, and capacity conflicts.

## Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4, `clsx`, `tailwind-merge`
- **Animations:** Framer Motion, GSAP
- **Icons:** Lucide React
- **Language:** TypeScript

## Folder Structure

- `src/`: Contains the React application code.
  - `components/`: UI components organized by role (auth, dispatcher, loader, driver, store, degradation, shared).
  - `context/`: React context for app state management (e.g., `AppContext`).
  - `data/`: Mock data for the application.
- `data/`: Contains datasets for the Tri-athon tasks, including general data, training/test data, and submission templates.

## Getting Started

### Prerequisites
Make sure you have Node.js and a package manager like npm, pnpm, or yarn installed.

### Installation

1. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

3. Build for production:
   ```bash
   npm run build
   # or
   pnpm build
   ```

## Scripts

- `dev`: Start the Vite development server.
- `build`: Build the application for production.
- `preview`: Preview the production build locally.
- `format`: Format code using `oxfmt`.
