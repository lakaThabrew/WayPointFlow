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

/** True if `date` is allowed for an order placed now. */
export function isDeliveryDateAllowed(date: Date, now = new Date()): boolean {
  const earliest = earliestDeliveryDate(now);
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  return isOperatingDay(dayStart) && dayStart >= new Date(earliest.setHours(0, 0, 0, 0));
}
