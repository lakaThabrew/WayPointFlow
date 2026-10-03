import { apiFetch } from './api';

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
  return apiFetch<any>(`/driver/stops/${stopId}/arrive`, {
    method: 'POST'
  });
}

export async function completeDelivery(stopId: string, receiverName: string, signatureNote: string): Promise<any> {
  return apiFetch<any>(`/driver/stops/${stopId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ receiverName, signatureNote })
  });
}

export async function reportIssue(stopId: string, issueReason: string, description: string): Promise<any> {
  return apiFetch<any>(`/driver/stops/${stopId}/issue`, {
    method: 'POST',
    body: JSON.stringify({ issueReason, description })
  });
}
