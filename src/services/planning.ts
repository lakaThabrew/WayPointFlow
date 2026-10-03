/**
 * services/planning.ts — typed client for the dispatcher planning endpoints.
 */

import { apiFetch } from './api';
import type { ApiOrder } from './orders';

export interface PlanTripStop {
  orderId: string;
  outletId: string;
  sequence: number;
}

export interface AllocationTrip {
  id: string;
  vehicleId: string;
  registrationNo: string;
  tripNumber: number;
  brand: string;
  district: string;
  status: string;
  departure: string;
  tripMinutes: number;
  routeKm: number;
  weightKg: number;
  volumeM3: number;
  maxWeightKg: number;
  maxVolumeM3: number;
  temperatureType: 'REEFER' | 'AMBIENT';
  vehicleType: 'TRUCK' | 'VAN';
  stops: PlanTripStop[];
}

export interface AllocationExplanation {
  orderId: string;
  result: 'ALLOCATED' | 'DEFERRED';
  tripId?: string;
  vehicleId?: string;
  checks: string[];
  vehicleAssessment?: Array<{ vehicleId: string; failedRule: string }>;
}

export interface AllocationResult {
  date: string;
  trips: AllocationTrip[];
  deferred: Array<{ orderId: string; outletId: string; reason: string; vehicleAssessment: Array<{ vehicleId: string; failedRule: string }> }>;
  explanations: AllocationExplanation[];
  summary: { candidates: number; allocated: number; deferred: number; trips: number; vehiclesUsed: number };
}

export interface PlanOrder extends ApiOrder {
  outletName: string;
  vehicleId: string | null;
}

export interface PlanTrip {
  id: string;
  vehicleId: string;
  tripNumber: number;
  date: string;
  brand: string;
  district: string;
  status: 'PLANNED' | 'RELEASED' | 'LOADING' | 'READY' | 'IN_TRANSIT' | 'COMPLETED';
  plannedDeparture: string | null;
  vehicle: { id: string; registrationNo: string; type: 'TRUCK' | 'VAN'; temperatureType: 'REEFER' | 'AMBIENT'; maxWeightKg: number; maxVolumeM3: number; kmPerL: number; weeklyFuelQuotaL: number };
  stops: Array<{ id: string; sequence: number; orderId: string; outletId: string; plannedArrival: string | null; status: string; order: ApiOrder }>;
}

export interface PlanResponse {
  date: string;
  trips: PlanTrip[];
  deferrals: Array<{ id: string; reason: string; source: string; decidedAt: string; order: ApiOrder & { outlet: { id: string; name: string; district: string } } }>;
}

export interface ConflictItem {
  order: ApiOrder & { outlet: { id: string; name: string; district: string; parkingConstraint: string; mallWindowOpen: string | null; mallWindowClose: string | null } };
  latestDeferral: { id: string; reason: string; decidedAt: string; source: string } | null;
  vehicleAssessment: Array<{ vehicleId: string; failedRule: string }>;
}

function qs(date?: string): string {
  return date ? `?date=${date}` : '';
}

export const planningApi = {
  queue: () => apiFetch<{ orders: PlanOrder[] }>('/planning/queue'),
  orders: () => apiFetch<{ orders: PlanOrder[] }>('/planning/orders'),
  allocate: (date?: string) =>
    apiFetch<AllocationResult>('/planning/allocate', { method: 'POST', body: JSON.stringify({ date }) }),
  plan: (date?: string) => apiFetch<PlanResponse>(`/planning/plan${qs(date)}`),
  conflicts: (date?: string) => apiFetch<{ date: string; conflicts: ConflictItem[] }>(`/planning/conflicts${qs(date)}`),
  defer: (orderId: string, reason: string, notes?: string) =>
    apiFetch<{ deferral: { id: string; reason: string } }>(`/planning/defer/${orderId}`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes }),
    }),
  releaseTrip: (tripId: string) =>
    apiFetch<{ trip: { id: string; status: string } }>(`/trips/${tripId}/release`, { method: 'POST' }),
  liveOps: () => apiFetch<{ trips: any[] }>('/planning/live-ops'),
  alerts: () => apiFetch<{ alerts: any[] }>('/planning/alerts'),
  markAlertRead: (stopId: string) => apiFetch<{ success: boolean }>(`/planning/alerts/${stopId}/read`, { method: 'POST' }),
};
