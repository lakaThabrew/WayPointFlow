/**
 * context/AuthContext.tsx — real authentication state backed by the API.
 * Holds the JWT-backed session, restores it on load via GET /auth/me,
 * and exposes login/logout to the app.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiFetch, getToken, setToken } from '../services/api';

export type ApiRole = 'DISPATCHER' | 'LOADER' | 'DRIVER' | 'STORE_MANAGER';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: ApiRole;
  depot: string | null;
  outletId: string | null;
  phone: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  /** True while a stored token is being validated on startup — render a splash, not the login screen. */
  restoring: boolean;
  /** Throws Error with the server message on invalid credentials. Returns the authenticated user on success. */
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    // Session restore: a stored token is validated against the API (TC-2.6).
    if (!getToken()) {
      setRestoring(false);
      return;
    }
    apiFetch<{ user: AuthUser }>('/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => setToken(null)) // token invalid/expired — drop it
      .finally(() => setRestoring(false));
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const res = await apiFetch<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, restoring, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
