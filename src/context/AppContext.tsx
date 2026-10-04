import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate as useRouterNavigate } from 'react-router-dom';
import type { Screen, Role, AppUser } from '../types';
import { ALERTS } from '../data/mockData';
import { useAuth, type ApiRole, type AuthUser } from './AuthContext';
import { ordersApi, type ApiOrder } from '../services/orders';
import { pendingSyncCount, setForcedOffline, syncOfflineEvents } from '../services/driver';

/** Draft collected on the Create Order screen, carried through Review → Place. */
export interface OrderDraft {
  brand: 'Fresh' | 'Style' | 'Tech';
  deliveryDate: string; // YYYY-MM-DD
  window: string;       // "05:00–07:30" (en-dash)
  temp: 'Chilled' | 'Frozen' | 'Ambient';
  weightKg: string;
  volumeM3: string;
  packages: string;
  notes: string;
}
export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  screen: Screen;
  navigate: (s: Screen) => void;
  role: Role | null;
  user: AppUser | null;
  /** Real API login — throws with the server message on invalid credentials. */
  login: (email: string, password: string) => Promise<AuthUser>;
  /** Demo quick-login: signs in through the real API with the role's seeded demo credentials. */
  loginAsDemo: (role: Role) => Promise<void>;
  logout: () => void;
  /** True while a stored token is validated on startup (TC-2.6 session restore). */
  authRestoring: boolean;
  selectedOrderId: string | null;
  setSelectedOrder: (id: string | null) => void;
  selectedTripId: string | null;
  setSelectedTripId: (id: string | null) => void;
  selectedStopId: string | null;
  setSelectedStopId: (id: string | null) => void;
  isOffline: boolean;
  setOffline: (v: boolean) => void;
  /** Events sitting in the IndexedDB outbox awaiting sync (Phase 7). */
  pendingSync: number;
  refreshPendingSync: () => Promise<void>;
  /** Pushes the outbox to the server; resolves with how many events landed. */
  runSync: () => Promise<{ processed: number; failed: number; remaining: number; error?: string }>;
  showNotifications: boolean;
  showSearch: boolean;
  showProfile: boolean;
  setShowNotifications: (v: boolean) => void;
  setShowSearch: (v: boolean) => void;
  setShowProfile: (v: boolean) => void;
  alerts: typeof ALERTS;
  markAlertRead: (id: string) => void;
  orderDraft: OrderDraft | null;
  setOrderDraft: (d: OrderDraft | null) => void;
  lastCreatedOrder: ApiOrder | null;
  /** POSTs the current draft, stores the created order and navigates to the confirmation screen. Throws on API error. */
  placeOrder: () => Promise<ApiOrder>;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

const API_ROLE_TO_ROLE: Record<ApiRole, Role> = {
  DISPATCHER: 'dispatcher',
  LOADER: 'loader',
  DRIVER: 'driver',
  STORE_MANAGER: 'store-manager',
};

const DEMO_EMAIL_BY_ROLE: Record<Role, string> = {
  dispatcher: 'ashan@waypoint.lk',
  loader: 'ruwini@waypoint.lk',
  driver: 'kasun.p@waypoint.lk',
  'store-manager': 'chamari@waypoint.lk',
};

const HOME_SCREENS: Record<Role, Screen> = {
  dispatcher: 'dispatcher/overview',
  loader: 'loader/home',
  driver: 'driver/home',
  'store-manager': 'store/home',
};

function toAppUser(u: AuthUser): AppUser {
  return {
    id: u.id,
    name: u.name,
    role: API_ROLE_TO_ROLE[u.role],
    depot: u.depot ?? '',
    email: u.email,
    phone: u.phone ?? '',
    outlet: u.outletId ?? undefined,
    initials: u.name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase(),
  };
}

/** Every routable screen id (mirrors the Screen union in types.ts). */
const VALID_SCREENS = new Set<string>([
  'role-select', 'login', 'forgot-password', 'reset-password', 'reset-success',
  'dispatcher/overview', 'dispatcher/orders', 'dispatcher/order-details', 'dispatcher/planning',
  'dispatcher/constraint-conflict', 'dispatcher/deferral', 'dispatcher/dispatch-plan',
  'dispatcher/live-ops', 'dispatcher/exception', 'dispatcher/forecast',
  'loader/home', 'loader/queue', 'loader/run-details', 'loader/checklist', 'loader/shortfall', 'loader/ready',
  'driver/home', 'driver/route', 'driver/stop', 'driver/confirm', 'driver/issue',
  'store/home', 'store/orders', 'store/create-order', 'store/order-review', 'store/confirmation',
  'store/tracking', 'store/received',
  'degradation/offline', 'degradation/offline-route', 'degradation/offline-delivery',
  'degradation/restored', 'degradation/sync-complete', 'degradation/capacity-conflict',
  'shared/profile', 'shared/notifications', 'shared/search',
]);

const AUTH_SCREENS: Screen[] = ['role-select', 'login', 'forgot-password', 'reset-password', 'reset-success'];

export const ROLE_PREFIX: Record<Role, string> = {
  dispatcher: 'dispatcher/',
  loader: 'loader/',
  driver: 'driver/',
  'store-manager': 'store/',
};

function pathToScreen(pathname: string): Screen {
  const id = pathname.replace(/^\//, '');
  return (VALID_SCREENS.has(id) ? id : 'login') as Screen;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const location = useLocation();
  const routerNavigate = useRouterNavigate();

  // URL is the source of truth for the current screen (refresh- and back-button-safe).
  const screen = pathToScreen(location.pathname);
  const navigate = (s: Screen) => routerNavigate('/' + s);

  const role: Role | null = auth.user ? API_ROLE_TO_ROLE[auth.user.role] : null;
  const user: AppUser | null = auth.user ? toAppUser(auth.user) : null;

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [alerts, setAlerts] = useState(ALERTS);
  const [orderDraft, setOrderDraft] = useState<OrderDraft | null>(null);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<ApiOrder | null>(null);
  const [pendingSync, setPendingSync] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const refreshPendingSync = useCallback(async () => {
    setPendingSync(await pendingSyncCount());
  }, []);

  const runSync = useCallback(async () => {
    const outcome = await syncOfflineEvents();
    setPendingSync(outcome.remaining);
    return outcome;
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const placeOrder = async (): Promise<ApiOrder> => {
    if (!orderDraft) throw new Error('No draft order — start from Create Order');
    const [windowOpen, windowClose] = orderDraft.window.split('–').map((s) => s.trim());
    const res = await ordersApi.create({
      brand: orderDraft.brand,
      tempRequirement: orderDraft.temp.toUpperCase() as 'CHILLED' | 'FROZEN' | 'AMBIENT',
      weightKg: Number(orderDraft.weightKg),
      volumeM3: orderDraft.volumeM3 ? Number(orderDraft.volumeM3) : undefined,
      units: orderDraft.packages ? Number(orderDraft.packages) : undefined,
      windowOpen,
      windowClose,
      deliveryDate: orderDraft.deliveryDate,
      notes: orderDraft.notes || undefined,
    });
    setLastCreatedOrder(res.order);
    setOrderDraft(null);
    navigate('store/confirmation');
    return res.order;
  };

  const login = async (email: string, password: string) => {
    const u = await auth.login(email, password); // throws on invalid credentials
    navigate(HOME_SCREENS[API_ROLE_TO_ROLE[u.role]]);
    return u;
  };

  const loginAsDemo = async (r: Role) => {
    await login(DEMO_EMAIL_BY_ROLE[r], 'demo1234');
  };

  const logout = () => {
    auth.logout();
    navigate('login');
  };

  const markAlertRead = (id: string) =>
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));

  // Role-based route guard: a role may only browse its own workspace prefix.
  useEffect(() => {
    if (!role) return;
    const isAuthScreen = AUTH_SCREENS.includes(screen);
    const isDegradation = screen.startsWith('degradation/');
    if (isAuthScreen || isDegradation) return;
    if (!screen.startsWith(ROLE_PREFIX[role])) {
      routerNavigate('/' + HOME_SCREENS[role], { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, screen]);

  // Logged-in users shouldn't sit on auth pages.
  useEffect(() => {
    if (role && AUTH_SCREENS.includes(screen)) {
      routerNavigate('/' + HOME_SCREENS[role], { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, screen]);

  useEffect(() => {
    // AppContext owns the offline flag (browser events + the in-app toggle), so the
    // driver service has to be told about it or offline actions would still hit the API.
    setForcedOffline(isOffline);
  }, [isOffline]);

  useEffect(() => {
    void refreshPendingSync();

    const handleOnline = () => {
      setIsOffline(false);
      void runSync().then(() => refreshPendingSync());
    };
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppContext.Provider
      value={{
        screen, navigate, role, user, login, loginAsDemo, logout,
        authRestoring: auth.restoring,
        selectedOrderId, setSelectedOrder: setSelectedOrderId,
        selectedTripId, setSelectedTripId,
        selectedStopId, setSelectedStopId,
        isOffline, setOffline: setIsOffline,
        pendingSync, refreshPendingSync, runSync,
        showNotifications, showSearch, showProfile,
        setShowNotifications, setShowSearch, setShowProfile,
        alerts, markAlertRead,
        orderDraft, setOrderDraft, lastCreatedOrder, placeOrder,
        toasts, showToast, removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
