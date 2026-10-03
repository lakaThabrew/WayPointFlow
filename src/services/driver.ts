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

export async function getDriverActiveTrip(): Promise<DriverTrip | null> {
  return apiFetch<DriverTrip | null>('/driver/route');
}



export async function markStopArrival(stopId: string): Promise<any> {
  if (!navigator.onLine) {
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
  if (!navigator.onLine) {
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
  if (!navigator.onLine) {
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

export async function syncOfflineEvents(): Promise<void> {
  const events = await getSyncEvents();
  if (events.length === 0) return;
  
  try {
    await apiFetch('/driver/sync', {
      method: 'POST',
      body: JSON.stringify({ events })
    });
    
    // Clear successfully synced events
    for (const event of events) {
      await deleteSyncEvent(event.clientUuid);
    }
  } catch (error) {
    console.error('Failed to sync offline events', error);
  }
}
