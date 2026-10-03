import { apiFetch } from './api';

export interface LoadingQueueItem {
  id: string;
  tripNumber: number;
  date: string;
  brand: string;
  district: string;
  status: string;
  plannedDeparture: string | null;
  vehicle: any;
  stopCount: number;
  totalQuantity: number;
}

export interface LoadingEventPayload {
  tripId: string;
  orderId: string;
  loadedQty: number;
  expectedQty: number;
}

export async function getLoadingQueue(): Promise<LoadingQueueItem[]> {
  return apiFetch<LoadingQueueItem[]>('/loading/queue');
}

export async function getTripManifest(tripId: string): Promise<any> {
  return apiFetch<any>(`/loading/trips/${tripId}/manifest`);
}

export async function submitLoadingEvent(payload: LoadingEventPayload): Promise<any> {
  return apiFetch<any>('/loading/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function markTripReady(tripId: string): Promise<any> {
  return apiFetch<any>(`/loading/trips/${tripId}/ready`, {
    method: 'POST',
  });
}
