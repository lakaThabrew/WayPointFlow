import { apiFetch } from './api';
import { saveSyncEvent, getSyncEvents, deleteSyncEvent } from '../lib/idb';

export interface DriverTrip {
  id: string;
  vehicleId: string;
  tripNumber: number;
  date: string;
  brand: string;
  district: string;
  status: string;
  plannedDeparture: string | null;
  vehicle: any;
  stops: any[];
}

export interface DriverStop {
  id: string;
  tripId: string;
  orderId: string;
  sequence: number;
  plannedArrival: string | null;
  status: string;
  outlet: any;
  order: any;
}

/**
 * The app's offline state is driven by AppContext (browser events plus the in-app
 * "Offline Mode" toggle), so queueing must follow it rather than navigator.onLine —
 * otherwise the demo toggle shows offline banners while actions still hit the network.
 */
let forcedOffline = false;

export function setForcedOffline(value: boolean): void {
  forcedOffline = value;
}

function isOffline(): boolean {
  return forcedOffline || !navigator.onLine;
}

export interface SyncOutcome {
  processed: number;
  failed: number;
  remaining: number;
  error?: string;
}

/** Number of events still waiting in the local outbox. */
export async function pendingSyncCount(): Promise<number> {
  try {
    const events = await getSyncEvents();
    return events.length;
  } catch {
    return 0;
  }
}

export async function getDriverActiveTrip(): Promise<DriverTrip | null> {
  return apiFetch<DriverTrip | null>('/driver/route');
}



export async function markStopArrival(stopId: string): Promise<any> {
  if (isOffline()) {
    const clientUuid = crypto.randomUUID();
    await saveSyncEvent({
      clientUuid,
      type: 'ARRIVE',
      data: { stopId },
      timestamp: Date.now()
    });
    return { id: stopId, status: 'ARRIVED' };
  }
  return apiFetch<any>(`/driver/stops/${stopId}/arrive`, {
    method: 'POST'
  });
}

export async function completeDelivery(stopId: string, receiverName: string, signatureNote: string): Promise<any> {
  if (isOffline()) {
    const clientUuid = crypto.randomUUID();
    await saveSyncEvent({
      clientUuid,
      type: 'COMPLETE',
      data: { stopId, receiverName, signatureNote },
      timestamp: Date.now()
    });
    return { stop: { id: stopId, status: 'COMPLETED' } };
  }
  return apiFetch<any>(`/driver/stops/${stopId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ receiverName, signatureNote })
  });
}

export async function reportIssue(stopId: string, issueReason: string, description: string): Promise<any> {
  if (isOffline()) {
    const clientUuid = crypto.randomUUID();
    await saveSyncEvent({
      clientUuid,
      type: 'ISSUE',
      data: { stopId, issueReason, description },
      timestamp: Date.now()
    });
    return { id: stopId, status: 'ISSUE' };
  }
  return apiFetch<any>(`/driver/stops/${stopId}/issue`, {
    method: 'POST',
    body: JSON.stringify({ issueReason, description })
  });
}

/**
 * Pushes the local outbox to POST /driver/sync. Only the events the server
 * acknowledged are removed, so anything it rejected stays queued for a later
 * retry (TC-7.6 sync failure / TC-7.7 sync recovery). Never throws.
 */
export async function syncOfflineEvents(): Promise<SyncOutcome> {
  let events;
  try {
    events = await getSyncEvents();
  } catch (error) {
    return { processed: 0, failed: 0, remaining: 0, error: 'Could not read the offline outbox' };
  }
  if (events.length === 0) return { processed: 0, failed: 0, remaining: 0 };

  try {
    const res = await apiFetch<{
      processed?: string[];
      failed?: Array<{ clientUuid: string; error: string }>;
    }>('/driver/sync', {
      method: 'POST',
      body: JSON.stringify({ events })
    });

    // Older servers acknowledge the whole batch without listing it; only trust an
    // explicit per-event list when one is returned.
    const acknowledged = Array.isArray(res.processed)
      ? res.processed
      : events.map((e) => e.clientUuid);

    for (const clientUuid of acknowledged) {
      await deleteSyncEvent(clientUuid);
    }

    const failedCount = Array.isArray(res.failed) ? res.failed.length : 0;
    return {
      processed: acknowledged.length,
      failed: failedCount,
      remaining: events.length - acknowledged.length,
    };
  } catch (error) {
    console.error('Failed to sync offline events', error);
    return {
      processed: 0,
      failed: events.length,
      remaining: events.length,
      error: 'Sync failed — events are still saved on this device',
    };
  }
}
