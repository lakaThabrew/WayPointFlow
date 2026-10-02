import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, Map, Truck, Box, AlertTriangle,
  TrendingUp, Bell, Wifi, WifiOff,
  ClipboardList, Route, History, ShoppingCart, Search, ChevronRight,
  LogOut, PanelLeft, Zap, Activity,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Screen, Role } from '../types';
import { C, LogisticsBackground, ConnectionStatus } from './ui';
import type { BgVariant } from './ui';
import { ALERTS } from '../data/mockData';

function getBgVariant(screen: string, role: string): BgVariant {
  if (screen.includes('degradation/offline') || screen.includes('degradation/restored') || screen.includes('degradation/sync')) return 'offline';
  if (screen.includes('planning') || screen.includes('forecast')) return 'ai';
  if (screen.includes('constraint') || screen.includes('deferral')) return 'analytics';
  if (screen.includes('live-ops') || screen.includes('exception')) return 'dispatch';
  if (role === 'loader') return 'fleet';
  if (role === 'driver') return 'fleet';
  if (role === 'dispatcher' && screen.includes('overview')) return 'dashboard';
  if (role === 'store-manager') return 'default';
  return 'dashboard';
}


interface NavItem {
  icon: React.ReactNode;
  label: string;
  screen: Screen;
  badge?: number;
  accentColor?: string;
}

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  dispatcher: [
    { icon: <LayoutDashboard size={17} />, label: 'Overview', screen: 'dispatcher/overview', accentColor: C.accent },
    { icon: <Package size={17} />, label: 'Orders', screen: 'dispatcher/orders' },
    { icon: <Zap size={17} />, label: 'Planning', screen: 'dispatcher/planning', accentColor: '#a78bfa' },
    { icon: <Map size={17} />, label: 'Live Operations', screen: 'dispatcher/live-ops', accentColor: C.success },
    { icon: <Truck size={17} />, label: 'Fleet', screen: 'dispatcher/live-ops' },
    { icon: <AlertTriangle size={17} />, label: 'Exceptions', screen: 'dispatcher/exception', badge: 2, accentColor: C.danger },
    { icon: <TrendingUp size={17} />, label: 'Forecast', screen: 'dispatcher/forecast', accentColor: C.style },
  ],
  loader: [
    { icon: <LayoutDashboard size={17} />, label: "Today's Loads", screen: 'loader/home', accentColor: C.accent },
    { icon: <ClipboardList size={17} />, label: 'Loading Queue', screen: 'loader/queue' },
    { icon: <AlertTriangle size={17} />, label: 'Exceptions', screen: 'loader/shortfall', badge: 1, accentColor: C.danger },
  ],
  driver: [
    { icon: <Route size={17} />, label: "Today's Route", screen: 'driver/home', accentColor: C.accent },
    { icon: <Map size={17} />, label: 'Stops', screen: 'driver/route' },
    { icon: <History size={17} />, label: 'Delivery History', screen: 'driver/home' },
    { icon: <AlertTriangle size={17} />, label: 'Issues', screen: 'driver/issue', accentColor: C.danger },
  ],
  'store-manager': [
    { icon: <LayoutDashboard size={17} />, label: 'Store Home', screen: 'store/home', accentColor: C.accent },
    { icon: <ShoppingCart size={17} />, label: 'New Order', screen: 'store/create-order', accentColor: C.success },
    { icon: <Package size={17} />, label: 'Orders', screen: 'store/orders' },
    { icon: <Truck size={17} />, label: 'Delivery Status', screen: 'store/tracking', accentColor: C.accent },
    { icon: <History size={17} />, label: 'History', screen: 'store/orders' },
  ],
};

const ROLE_LABELS: Record<Role, string> = {
  dispatcher: 'Dispatcher',
  loader: 'Loader',
  driver: 'Driver',
  'store-manager': 'Store Manager',
};

const ROLE_COLORS: Record<Role, string> = {
  dispatcher: C.accent,
  loader: '#a78bfa',
  driver: C.fresh,
  'store-manager': C.warning,
};

interface ShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  mobileFrame?: boolean;
}

export default function Shell({ children, title, subtitle, mobileFrame }: ShellProps) {
  const { role, user, screen, navigate, logout, isOffline, setOffline,
    setShowNotifications, setShowSearch, setShowProfile } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  if (!role) return null;
  const navItems = NAV_BY_ROLE[role];
  const unread = ALERTS.filter(a => !a.read).length;
  const roleColor = ROLE_COLORS[role];

  const sidebarW = collapsed ? 68 : 240;

  // ─── Mobile frame (driver / degradation) ───────────────────────────────────
  if (mobileFrame) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#020407',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, position: 'relative', overflow: 'hidden',
      }}>
        <LogisticsBackground variant="fleet" />

        {/* Subtle background grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(14, 165, 233, 0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }} />

        {/* Mobile device frame */}
        <div className="mobile-frame" style={{
          width: 390, minHeight: 844, maxHeight: 900,
          borderRadius: 46, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          position: 'relative', zIndex: 1,
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {/* Notch / Status bar */}
          <div style={{
            height: 46,
            background: 'rgba(3, 6, 12, 0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 24px', flexShrink: 0,
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>9:41</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {isOffline
                ? <WifiOff size={13} color={C.warning} />
                : <Wifi size={13} color={C.success} />}
              {/* Battery bars */}
              <div style={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                {[10, 13, 16, 19].map(h => (
                  <div key={h} style={{ width: 3, height: h, background: C.text2, borderRadius: 1 }} />
                ))}
              </div>
              {/* Battery */}
              <div style={{
                width: 22, height: 11, borderRadius: 2,
                border: `1.5px solid ${C.text3}`,
                display: 'flex', alignItems: 'center',
                padding: '1.5px', gap: 1,
                position: 'relative',
              }}>
                <div style={{ width: '70%', height: '100%', background: C.success, borderRadius: 1 }} />
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={screen}
                initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }}
                transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Home indicator */}
          <div style={{
            height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            background: 'rgba(3, 6, 12, 0.8)',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{ width: 128, height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 2 }} />
          </div>
        </div>

        {/* Role toggle */}
        <div style={{ position: 'fixed', bottom: 28, right: 28 }}>
          <button
            onClick={() => navigate('role-select')}
            style={{
              background: C.card2, border: `1px solid ${C.borderMd}`, borderRadius: 10,
              padding: '8px 16px', color: C.text2, fontSize: 12, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.2s',
              backdropFilter: 'blur(12px)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = C.text;
              (e.currentTarget as HTMLElement).style.borderColor = C.borderStrong;
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = C.text2;
              (e.currentTarget as HTMLElement).style.borderColor = C.borderMd;
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            Switch Role
          </button>
        </div>
      </div>
    );
  }

  // ─── Desktop Shell ──────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#030508', position: 'relative' }}>
      <LogisticsBackground variant={getBgVariant(screen, role)} />

      {/* ── Sidebar ── */}
      <aside style={{
        width: sidebarW, flexShrink: 0,
        background: 'rgba(5, 8, 14, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        zIndex: 40,
        position: 'relative',
      }}>
        {/* Sidebar glow */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 200,
          background: `radial-gradient(ellipse at top, ${roleColor}08 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        {/* Logo area */}
        <div style={{
          padding: '18px 14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
          position: 'relative',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11, flexShrink: 0,
            background: `linear-gradient(135deg, ${C.accent}, #0369a1)`,
            boxShadow: `0 4px 16px ${C.accent}40, 0 0 0 1px ${C.accent}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 17, fontWeight: 900, color: '#ffffff', fontFamily: 'Inter, sans-serif' }}>W</span>
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.2 }}
            >
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text, letterSpacing: '-0.025em' }}>WaypointFlow</p>
              <p style={{ margin: 0, fontSize: 10, color: roleColor, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {ROLE_LABELS[role]}
              </p>
            </motion.div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
          {/* Role indicator */}
          {!collapsed && (
            <div style={{
              padding: '7px 10px', marginBottom: 10,
              background: `${roleColor}08`,
              border: `1px solid ${roleColor}15`,
              borderRadius: 8,
            }}>
              <p style={{ margin: 0, fontSize: 10, color: roleColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {ROLE_LABELS[role]} Console
              </p>
            </div>
          )}

          {navItems.map(item => {
            const isActive = screen === item.screen;
            const isHovered = hoveredNav === item.label;
            const accent = item.accentColor || C.accent;

            return (
              <button
                key={item.label}
                onClick={() => navigate(item.screen)}
                onMouseEnter={() => setHoveredNav(item.label)}
                onMouseLeave={() => setHoveredNav(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11,
                  width: '100%', padding: collapsed ? '11px' : '9px 12px',
                  borderRadius: 10, border: 'none', cursor: 'pointer', marginBottom: 2,
                  background: isActive
                    ? `${accent}12`
                    : isHovered ? 'rgba(255,255,255,0.04)' : 'transparent',
                  color: isActive ? accent : isHovered ? C.text : C.text2,
                  fontSize: 13, fontWeight: isActive ? 600 : 500,
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.18s ease',
                  textAlign: 'left',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  position: 'relative',
                  outline: 'none',
                  boxShadow: isActive ? `inset 0 0 0 1px ${accent}20` : 'none',
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <div style={{
                    position: 'absolute', left: 0, top: '20%', bottom: '20%',
                    width: 3, background: accent, borderRadius: '0 2px 2px 0',
                    boxShadow: `0 0 8px ${accent}60`,
                  }} />
                )}

                <div style={{
                  color: isActive ? accent : isHovered ? C.text : C.text3,
                  transition: 'all 0.18s',
                  transform: isHovered && !isActive ? 'translateX(2px)' : 'translateX(0)',
                  display: 'flex', alignItems: 'center', flexShrink: 0,
                }}>
                  {item.icon}
                </div>

                {!collapsed && (
                  <span style={{ flex: 1, letterSpacing: '-0.01em' }}>{item.label}</span>
                )}

                {!collapsed && item.badge && (
                  <span style={{
                    background: C.danger, color: '#fff', fontSize: 10,
                    padding: '1px 7px', borderRadius: 20, fontWeight: 700,
                    boxShadow: `0 0 10px ${C.danger}50`,
                    minWidth: 18, textAlign: 'center',
                  }} className="badge-pulse">
                    {item.badge}
                  </span>
                )}

                {collapsed && item.badge && (
                  <div style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 7, height: 7, borderRadius: '50%',
                    background: C.danger, boxShadow: `0 0 8px ${C.danger}60`,
                  }} className="pulse-dot" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 10px' }}>
          {/* Connection status */}
          <button
            onClick={() => setOffline(!isOffline)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: collapsed ? '10px' : '9px 12px',
              borderRadius: 10, marginBottom: 4,
              background: isOffline ? `${C.warning}10` : 'transparent',
              border: `1px solid ${isOffline ? C.warning + '25' : 'transparent'}`,
              cursor: 'pointer', justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'all 0.2s',
            }}
          >
            {isOffline
              ? <WifiOff size={15} color={C.warning} />
              : <Wifi size={15} color={C.success} />}
            {!collapsed && (
              <span style={{ fontSize: 12, fontWeight: 600, color: isOffline ? C.warning : C.success, fontFamily: 'Inter, sans-serif' }}>
                {isOffline ? 'Offline Mode' : 'System Online'}
              </span>
            )}
            {!collapsed && !isOffline && (
              <span className="status-dot active" style={{ marginLeft: 'auto' }} />
            )}
          </button>

          {/* Profile */}
          <button
            onClick={() => setShowProfile(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 11,
              width: '100%', padding: collapsed ? '10px' : '9px 12px', borderRadius: 10,
              border: 'none', cursor: 'pointer', background: 'transparent',
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'background 0.18s',
              marginBottom: 2,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${roleColor}35, ${roleColor}12)`,
              border: `1.5px solid ${roleColor}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: roleColor,
              boxShadow: `0 0 12px ${roleColor}25`,
            }}>
              {user?.initials}
            </div>
            {!collapsed && (
              <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name}
                </p>
                <p style={{ margin: 0, fontSize: 10, color: C.text3 }}>{ROLE_LABELS[role]}</p>
              </div>
            )}
          </button>

          {/* Sign out */}
          <button
            onClick={() => navigate('role-select')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: collapsed ? '10px' : '9px 12px', borderRadius: 10,
              border: 'none', cursor: 'pointer', background: 'transparent',
              color: C.text3, fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 500,
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${C.danger}08`; (e.currentTarget as HTMLElement).style.color = C.danger; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = C.text3; }}
          >
            <LogOut size={15} />
            {!collapsed && 'Sign Out'}
          </button>
        </div>

        {/* Footer tag */}
        {!collapsed && (
          <div style={{
            padding: '10px 14px 14px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}>
            <p style={{ margin: 0, fontSize: 10, color: C.text3, textAlign: 'center', letterSpacing: '0.04em' }}>
              Tech-Triathlon 2026 · Intelligent Enterprise
            </p>
          </div>
        )}
      </aside>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {/* Top bar */}
        <header style={{
          height: 58,
          background: 'rgba(3, 5, 8, 0.80)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', flexShrink: 0, gap: 16,
          zIndex: 30,
        }}>
          {/* Left: Collapse + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={() => setCollapsed(c => !c)}
              style={{
                background: 'transparent', border: '1px solid transparent',
                cursor: 'pointer', color: C.text3,
                padding: 7, borderRadius: 9,
                transition: 'all 0.18s', display: 'flex', alignItems: 'center',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLElement).style.color = C.text;
                (e.currentTarget as HTMLElement).style.borderColor = C.border;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = C.text3;
                (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
              }}
            >
              <PanelLeft size={17} />
            </button>

            {/* Separator */}
            <div style={{ width: 1, height: 20, background: C.border }} />

            <div>
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>{title}</h1>
              {subtitle && <p style={{ margin: '1px 0 0', fontSize: 11, color: C.text3, letterSpacing: '0.01em' }}>{subtitle}</p>}
            </div>
          </div>

          {/* Right: Search + Date + Notifs + Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Search */}
            <button
              onClick={() => setShowSearch(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, padding: '7px 16px', cursor: 'pointer',
                color: C.text3, fontSize: 13, fontFamily: 'Inter, sans-serif',
                transition: 'all 0.18s', minWidth: 220,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)';
                (e.currentTarget as HTMLElement).style.color = C.text2;
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLElement).style.color = C.text3;
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
              }}
            >
              <Search size={13} />
              <span style={{ flex: 1, textAlign: 'left' }}>Search operations...</span>
              <span style={{
                fontSize: 10, color: C.text3,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '2px 7px', borderRadius: 5,
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.02em',
              }}>⌘K</span>
            </button>

            {/* Connection indicator */}
            <ConnectionStatus online={!isOffline} />

            {/* Date */}
            <div style={{
              padding: '6px 14px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)',
              fontSize: 12, color: C.text2, whiteSpace: 'nowrap', fontWeight: 500,
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              Tue 30 Sep 2026
            </div>

            {/* Notifications */}
            <button
              onClick={() => setShowNotifications(true)}
              style={{
                position: 'relative', width: 38, height: 38,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C.text3, transition: 'all 0.18s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)';
                (e.currentTarget as HTMLElement).style.color = C.text;
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLElement).style.color = C.text3;
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
              }}
            >
              <Bell size={16} />
              {unread > 0 && (
                <span style={{
                  position: 'absolute', top: 7, right: 7,
                  width: 8, height: 8, background: C.danger, borderRadius: '50%',
                  border: `2px solid #030508`,
                  boxShadow: `0 0 8px ${C.danger}80`,
                }} className="pulse-dot" />
              )}
            </button>

            {/* Avatar */}
            <button
              onClick={() => setShowProfile(true)}
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: `linear-gradient(135deg, ${roleColor}35, ${roleColor}12)`,
                border: `1.5px solid ${roleColor}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: roleColor, cursor: 'pointer',
                transition: 'all 0.18s',
                boxShadow: `0 0 16px ${roleColor}20`,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = `linear-gradient(135deg, ${roleColor}50, ${roleColor}22)`;
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${roleColor}35`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = `linear-gradient(135deg, ${roleColor}35, ${roleColor}12)`;
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 16px ${roleColor}20`;
              }}
            >
              {user?.initials}
            </button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -14, filter: 'blur(8px)' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.42 }}
              style={{ minHeight: '100%' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
