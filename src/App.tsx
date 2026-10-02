import { AppProvider, useApp, ROLE_PREFIX } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import Shell from './components/Shell';

// Auth
import { Login, ForgotPassword, ResetPassword, ResetSuccess, RoleSelect } from './components/auth/AuthScreens';

// Dispatcher
import {
  DispatcherOverview, DispatcherOrders, OrderDetails,
  PlanningWorkspace, ConstraintConflict, DeferralDecision,
  DispatchPlan, LiveOperations, DeliveryException, Forecast,
} from './components/dispatcher/DispatcherScreens';

// Loader
import {
  LoaderHome, LoadingQueue, RunDetails, LoadingChecklist,
  LoadingShortfall, ReadyForDeparture,
} from './components/loader/LoaderScreens';

// Driver
import {
  DriverHome, RouteOverview, StopDetails,
  DeliveryConfirmation, DeliveryIssue,
} from './components/driver/DriverScreens';

// Store Manager
import {
  StoreHome, StoreOrders, CreateOrder, OrderReview,
  OrderConfirmation, DeliveryTracking, DeliveryReceived,
} from './components/store/StoreManagerScreens';

// Degradation
import {
  ConnectionLost, OfflineRoute, OfflineDelivery,
  ConnectionRestored, SyncComplete, CapacityConflict,
} from './components/degradation/DegradationScreens';

// Shared
import { ProfileOverlay, NotificationsOverlay, GlobalSearchOverlay } from './components/shared/SharedScreens';

// Screen title map
const SCREEN_TITLES: Record<string, { title: string; subtitle?: string }> = {
  'dispatcher/overview': { title: "Today's Operations", subtitle: 'Peliyagoda + Kandy · 30 Sep 2026' },
  'dispatcher/orders': { title: 'Orders', subtitle: 'All brands · 30 Sep 2026' },
  'dispatcher/order-details': { title: 'Order Details', subtitle: 'ORD-10482' },
  'dispatcher/planning': { title: 'Planning Workspace', subtitle: '1 Oct 2026 — Tomorrow' },
  'dispatcher/constraint-conflict': { title: 'Constraint Conflict', subtitle: 'ORD-10482 · No feasible vehicle' },
  'dispatcher/deferral': { title: 'Deferral Decision', subtitle: 'ORD-10482 · OUT047' },
  'dispatcher/dispatch-plan': { title: 'Final Dispatch Plan', subtitle: '30 Sep 2026 — Ready for release' },
  'dispatcher/live-ops': { title: 'Live Operations', subtitle: 'Real-time delivery monitoring' },
  'dispatcher/exception': { title: 'Delivery Exception', subtitle: 'VEH014 — OUT032 at risk' },
  'dispatcher/forecast': { title: 'Forecast & Capacity Planning', subtitle: 'Demand intelligence' },
  'loader/home': { title: "Today's Loading", subtitle: 'Peliyagoda Depot · Dock activity' },
  'loader/queue': { title: 'Loading Queue', subtitle: 'All runs for today' },
  'loader/run-details': { title: 'Run Details', subtitle: 'VEH014 — Trip 1' },
  'loader/checklist': { title: 'Loading Checklist', subtitle: 'VEH014 — Trip 1' },
  'loader/shortfall': { title: 'Loading Shortfall', subtitle: 'ORD-10489 — Hold departure' },
  'loader/ready': { title: 'Ready for Departure', subtitle: 'VEH014 — Trip 1' },
  'store/home': { title: 'Store Overview', subtitle: 'OUT032 — Waypoint Fresh Gampaha' },
  'store/orders': { title: 'Orders', subtitle: 'OUT032 — Waypoint Fresh Gampaha' },
  'store/create-order': { title: 'Create Order', subtitle: 'OUT032' },
  'store/order-review': { title: 'Review Order', subtitle: 'OUT032' },
  'store/confirmation': { title: 'Order Submitted', subtitle: 'ORD-10527' },
  'store/tracking': { title: 'Delivery Tracking', subtitle: 'ORD-10483 — In Transit' },
  'store/received': { title: 'Delivery Received', subtitle: 'OUT032' },
  'degradation/capacity-conflict': { title: 'Plan Cannot Be Released', subtitle: '4 constraint violations' },
};

function AppContent() {
  const {
    screen, role, authRestoring, showNotifications, showSearch, showProfile,
  } = useApp();

  // Session restore in progress — hold a splash instead of flashing the login screen (TC-2.6).
  if (authRestoring) {
    return (
      <div style={{ minHeight: '100vh', background: '#030508', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'linear-gradient(135deg, #0ea5e9, #0369a1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 900, color: '#fff',
        }}>
          W
        </div>
      </div>
    );
  }

  // Auth screens (no shell)
  const noShellScreens = ['login', 'forgot-password', 'reset-password', 'reset-success', 'role-select'];
  if (noShellScreens.includes(screen)) {
    return (
      <>
        {screen === 'login' && <Login />}
        {screen === 'forgot-password' && <ForgotPassword />}
        {screen === 'reset-password' && <ResetPassword />}
        {screen === 'reset-success' && <ResetSuccess />}
        {screen === 'role-select' && <RoleSelect />}
      </>
    );
  }

  if (!role) return <Login />;

  // Role guard: render nothing while AppContext redirects to this role's home —
  // e.g. a driver cannot open dispatcher routes (TC: role-based routing).
  if (!screen.startsWith(ROLE_PREFIX[role]) && !screen.startsWith('degradation/')) {
    return null;
  }

  // Driver screens use mobile frame
  const isDriver = role === 'driver';
  const isDegradation = screen.startsWith('degradation/');
  const useMobileFrame = isDriver || isDegradation;

  const screenInfo = SCREEN_TITLES[screen] || { title: 'WaypointFlow' };

  // Screens that render in the shell normally (desktop)
  const renderScreen = () => {
    switch (screen) {
      // Dispatcher
      case 'dispatcher/overview': return <DispatcherOverview />;
      case 'dispatcher/orders': return <DispatcherOrders />;
      case 'dispatcher/order-details': return <OrderDetails />;
      case 'dispatcher/planning': return <PlanningWorkspace />;
      case 'dispatcher/constraint-conflict': return <ConstraintConflict />;
      case 'dispatcher/deferral': return <DeferralDecision />;
      case 'dispatcher/dispatch-plan': return <DispatchPlan />;
      case 'dispatcher/live-ops': return <LiveOperations />;
      case 'dispatcher/exception': return <DeliveryException />;
      case 'dispatcher/forecast': return <Forecast />;

      // Loader
      case 'loader/home': return <LoaderHome />;
      case 'loader/queue': return <LoadingQueue />;
      case 'loader/run-details': return <RunDetails />;
      case 'loader/checklist': return <LoadingChecklist />;
      case 'loader/shortfall': return <LoadingShortfall />;
      case 'loader/ready': return <ReadyForDeparture />;

      // Driver (mobile frame)
      case 'driver/home': return <DriverHome />;
      case 'driver/route': return <RouteOverview />;
      case 'driver/stop': return <StopDetails />;
      case 'driver/confirm': return <DeliveryConfirmation />;
      case 'driver/issue': return <DeliveryIssue />;

      // Store Manager
      case 'store/home': return <StoreHome />;
      case 'store/orders': return <StoreOrders />;
      case 'store/create-order': return <CreateOrder />;
      case 'store/order-review': return <OrderReview />;
      case 'store/confirmation': return <OrderConfirmation />;
      case 'store/tracking': return <DeliveryTracking />;
      case 'store/received': return <DeliveryReceived />;

      // Degradation (mobile frame)
      case 'degradation/offline': return <ConnectionLost />;
      case 'degradation/offline-route': return <OfflineRoute />;
      case 'degradation/offline-delivery': return <OfflineDelivery />;
      case 'degradation/restored': return <ConnectionRestored />;
      case 'degradation/sync-complete': return <SyncComplete />;
      case 'degradation/capacity-conflict': return <CapacityConflict />;

      default: return <DispatcherOverview />;
    }
  };

  return (
    <>
      <Shell
        title={screenInfo.title}
        subtitle={screenInfo.subtitle}
        mobileFrame={useMobileFrame}
      >
        {renderScreen()}
      </Shell>

      {/* Overlays */}
      {showProfile && <ProfileOverlay />}
      {showNotifications && <NotificationsOverlay />}
      {showSearch && <GlobalSearchOverlay />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
