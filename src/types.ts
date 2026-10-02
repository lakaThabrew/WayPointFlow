export type Role = 'dispatcher' | 'loader' | 'driver' | 'store-manager';
export type Brand = 'Fresh' | 'Style' | 'Tech';
export type TempType = 'Chilled' | 'Frozen' | 'Ambient';
export type VehicleType = 'Reefer Truck' | 'Dry Truck' | 'Reefer Van' | 'Ambient Van';
export type Depot = 'Peliyagoda' | 'Kandy';

export type OrderStatus =
  | 'New' | 'Confirmed' | 'Planned' | 'Loading'
  | 'In Transit' | 'Delivered' | 'At Risk' | 'Deferred';

export type VehicleStatus =
  | 'Available' | 'Loading' | 'On Route' | 'Delayed' | 'Workshop' | 'Offline';

export type Screen =
  | 'login' | 'forgot-password' | 'reset-password' | 'reset-success' | 'role-select'
  | 'dispatcher/overview' | 'dispatcher/orders' | 'dispatcher/order-details'
  | 'dispatcher/planning' | 'dispatcher/constraint-conflict'
  | 'dispatcher/deferral' | 'dispatcher/dispatch-plan'
  | 'dispatcher/live-ops' | 'dispatcher/exception' | 'dispatcher/forecast'
  | 'loader/home' | 'loader/queue' | 'loader/run-details'
  | 'loader/checklist' | 'loader/shortfall' | 'loader/ready'
  | 'driver/home' | 'driver/route' | 'driver/stop'
  | 'driver/confirm' | 'driver/issue'
  | 'store/home' | 'store/orders' | 'store/create-order'
  | 'store/order-review' | 'store/confirmation'
  | 'store/tracking' | 'store/received'
  | 'degradation/offline' | 'degradation/offline-route'
  | 'degradation/offline-delivery' | 'degradation/restored'
  | 'degradation/sync-complete' | 'degradation/capacity-conflict'
  | 'shared/profile' | 'shared/notifications' | 'shared/search';

export interface Order {
  id: string;
  outlet: string;
  outletName: string;
  brand: Brand;
  district: string;
  deliveryDate: string;
  window: string;
  temp: TempType;
  weightKg: number;
  volumeM3: number;
  status: OrderStatus;
  vehicle?: string;
  trip?: number;
  driver?: string;
  plannedArrival?: string;
  actualArrival?: string;
  vanOnly?: boolean;
  depot: Depot;
  packages?: number;
  mall?: boolean;
}

export interface Vehicle {
  id: string;
  type: VehicleType;
  reefer: boolean;
  maxWeightKg: number;
  maxVolumeM3: number;
  depot: Depot;
  driver?: string;
  status: VehicleStatus;
  fuelType: string;
  kmPerLitre: number;
  weeklyFuelQuotaL: number;
  fuelUsedL: number;
  plate: string;
}

export interface Driver {
  id: string;
  name: string;
  vehicle: string;
  depot: Depot;
  phone: string;
  status: 'On duty' | 'Off duty' | 'On route' | 'Available';
}

export interface Outlet {
  id: string;
  name: string;
  brand: Brand;
  district: string;
  address: string;
  vanOnly: boolean;
  mall: boolean;
  depot: Depot;
  openTime: string;
  windowStart: string;
  windowEnd: string;
}

export interface Trip {
  vehicle: string;
  trip: number;
  depot: Depot;
  district: string;
  brand: Brand;
  orders: string[];
  departure: string;
  eta: string;
  driver: string;
  status: 'Planned' | 'Loading' | 'Departed' | 'On Route' | 'Complete' | 'Delayed';
  weightKg: number;
  volumeM3: number;
  reefer: boolean;
  stops: string[];
  currentStop?: string;
  completedStops?: number;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'operational';
  title: string;
  description: string;
  screen?: Screen;
  time: string;
  read: boolean;
}

export interface AppUser {
  id: string;
  name: string;
  role: Role;
  depot: Depot | string;
  email: string;
  phone: string;
  outlet?: string;
  initials: string;
}
