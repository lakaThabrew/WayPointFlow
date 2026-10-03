/**
 * services/orders.ts — typed client for the store-manager order endpoints.
 * All endpoints are outlet-scoped server-side (the caller's JWT outlet).
 */

import { apiFetch } from './api';

export interface ApiOrder {
  id: string;
  outletId: string;
  brand: string;
  district: string;
  depot: string;
  temperatureRequirement: 'CHILLED' | 'FROZEN' | 'AMBIENT';
  units: number;
  weightKg: number;
  volumeM3: number;
  windowOpen: string;
  windowClose: string;
  deliveryDate: string;
  status: 'NEW' | 'CONFIRMED' | 'PLANNED' | 'LOADING' | 'IN_TRANSIT' | 'DELIVERED' | 'DEFERRED' | 'AT_RISK';
  notes: string | null;
  createdAt: string;
}

export interface CreateOrderInput {
  brand?: string;
  tempRequirement: 'CHILLED' | 'FROZEN' | 'AMBIENT';
  weightKg: number;
  volumeM3?: number;
  units?: number;
  windowOpen?: string;
  windowClose?: string;
  deliveryDate: string; // YYYY-MM-DD
  notes?: string;
}

/** GET /orders/:id response — includes trip/PoD/deferral relations. */
export interface ApiOrderDetailed extends ApiOrder {
  tripStops?: Array<{
    id: string;
    sequence: number;
    status: string;
    plannedArrival: string | null;
    actualArrival: string | null;
    trip?: { id: string; vehicleId: string; status: string; vehicle?: { registrationNo: string } };
    proofOfDelivery?: { receiverName: string; recordedAt: string } | null;
  }>;
  deferrals?: Array<{ id: string; reason: string; decidedAt: string }>;
}

export const ordersApi = {
  create: (input: CreateOrderInput) =>
    apiFetch<{ order: ApiOrder }>('/orders', { method: 'POST', body: JSON.stringify(input) }),
  list: () => apiFetch<{ orders: ApiOrder[] }>('/orders'),
  get: (id: string) => apiFetch<{ order: ApiOrderDetailed }>(`/orders/${id}`),
  confirmReceipt: (id: string) => apiFetch<{ order: ApiOrder }>(`/orders/${id}/receipt`, { method: 'POST' }),
};

/** API status → UI badge label (types.ts OrderStatus). */
export const STATUS_LABEL: Record<ApiOrder['status'], string> = {
  NEW: 'New',
  CONFIRMED: 'Confirmed',
  PLANNED: 'Planned',
  LOADING: 'Loading',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  DEFERRED: 'Deferred',
  AT_RISK: 'At Risk',
};

export const TEMP_LABEL: Record<ApiOrder['temperatureRequirement'], string> = {
  CHILLED: 'Chilled',
  FROZEN: 'Frozen',
  AMBIENT: 'Ambient',
};

/** "2026-10-10T00:00:00.000Z" → "10 October 2026" */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
