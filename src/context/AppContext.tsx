import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Screen, Role, AppUser } from '../types';
import { USERS } from '../data/mockData';

interface AppContextType {
  screen: Screen;
  role: Role | null;
  user: AppUser | null;
  selectedOrderId: string | null;
  isOffline: boolean;
  showNotifications: boolean;
  showSearch: boolean;
  showProfile: boolean;
  navigate: (s: Screen) => void;
  login: (role: Role) => void;
  logout: () => void;
  setSelectedOrder: (id: string | null) => void;
  setOffline: (v: boolean) => void;
  setShowNotifications: (v: boolean) => void;
  setShowSearch: (v: boolean) => void;
  setShowProfile: (v: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>('login');
  const [role, setRole] = useState<Role | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isOffline, setOffline] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const navigate = (s: Screen) => {
    setShowNotifications(false);
    setShowSearch(false);
    setShowProfile(false);
    setScreen(s);
  };

  const login = (r: Role) => {
    setRole(r);
    setUser(USERS[r]);
    const homeScreens: Record<Role, Screen> = {
      dispatcher: 'dispatcher/overview',
      loader: 'loader/home',
      driver: 'driver/home',
      'store-manager': 'store/home',
    };
    setScreen(homeScreens[r]);
  };

  const logout = () => {
    setRole(null);
    setUser(null);
    setScreen('login');
  };

  const setSelectedOrder = (id: string | null) => setSelectedOrderId(id);

  return (
    <AppContext.Provider value={{
      screen, role, user, selectedOrderId, isOffline,
      showNotifications, showSearch, showProfile,
      navigate, login, logout, setSelectedOrder,
      setOffline, setShowNotifications, setShowSearch, setShowProfile,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
