import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Bell, Search, LogOut, ChevronRight, Package, Truck, AlertTriangle,
  CheckCircle, Shield, Settings, MapPin, Clock, Activity, Star,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  C, Card, Badge, StatusBadge, Btn, InfoRow, Divider, Mono,
  SectionHeader, AlertCard,
} from '../ui';
import { ALERTS, USERS } from '../../data/mockData';
import type { Screen } from '../../types';

// ─── Profile Overlay ──────────────────────────────────────────────────────────
export function ProfileOverlay() {
  const { user, role, logout, navigate, setShowProfile } = useApp();
  if (!user) return null;

  const roleLabels: Record<string, string> = {
    dispatcher: 'Dispatcher',
    loader: 'Loader',
    driver: 'Driver',
    'store-manager': 'Store Manager',
  };

  const roleColors: Record<string, string> = {
    dispatcher: C.accent,
    loader: '#a78bfa',
    driver: C.fresh,
    'store-manager': C.warning,
  };

  const roleColor = roleColors[role!] || C.accent;

  const stats = [
    { label: 'Orders Today', value: '12', icon: <Package size={14} /> },
    { label: 'On-time Rate', value: '94%', icon: <CheckCircle size={14} /> },
    { label: 'Active Alerts', value: ALERTS.filter(a => !a.read).length.toString(), icon: <Bell size={14} /> },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={() => setShowProfile(false)}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: 340, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 340, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.38 }}
        style={{
          position: 'relative', width: 340,
          height: '100vh',
          background: 'rgba(5, 8, 14, 0.95)',
          backdropFilter: 'blur(30px)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column',
          overflow: 'auto',
        }}
      >
        {/* Role-colored top accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${roleColor}, ${roleColor}80)`,
        }} />

        {/* Header */}
        <div style={{ padding: '22px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Profile</h3>
          <button
            onClick={() => setShowProfile(false)}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', color: C.text2, width: 30, height: 30, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)'; (e.currentTarget as HTMLElement).style.color = C.text; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = C.text2; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Avatar + name */}
        <div style={{ padding: '24px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: `linear-gradient(135deg, ${roleColor}35, ${roleColor}12)`,
              border: `2px solid ${roleColor}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800, color: roleColor,
              boxShadow: `0 0 24px ${roleColor}25, 0 4px 16px rgba(0,0,0,0.3)`,
            }}>
              {user.initials}
            </div>
            <div>
              <h4 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: C.text }}>{user.name}</h4>
              <Badge color={roleColor} dot>{roleLabels[role!]}</Badge>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 18 }}>
            {stats.map(s => (
              <div key={s.label} style={{
                padding: '10px', borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                textAlign: 'center',
              }}>
                <div style={{ color: roleColor, display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{s.icon}</div>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: 9, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Account Details</p>
          <InfoRow label="User ID" value={<Mono>{user.id}</Mono>} />
          <InfoRow label="Role" value={roleLabels[role!]} />
          <InfoRow label="Depot / Outlet" value={user.depot} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Phone" value={user.phone} />
        </div>

        {/* Notifications */}
        <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Notification Preferences</p>
          {[
            { label: 'Critical alerts', enabled: true },
            { label: 'Delivery updates', enabled: true },
            { label: 'Planning changes', enabled: role === 'dispatcher' },
            { label: 'Loading updates', enabled: role === 'loader' },
          ].filter(n => n.enabled !== false).map(n => (
            <div key={n.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
              <span style={{ fontSize: 13, color: C.text2 }}>{n.label}</span>
              <div style={{
                width: 38, height: 21, borderRadius: 11,
                background: `linear-gradient(90deg, ${roleColor}, ${roleColor}cc)`,
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                padding: '2px 3px', boxShadow: `0 0 10px ${roleColor}30`,
                cursor: 'pointer',
              }}>
                <div style={{ width: 17, height: 17, borderRadius: '50%', background: '#fff' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Security */}
        <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Security</p>
          {[
            { label: 'Change password', icon: <Shield size={14} /> },
            { label: 'Session history', icon: <Clock size={14} /> },
            { label: 'Device management', icon: <Settings size={14} /> },
          ].map(item => (
            <button
              key={item.label}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                width: '100%', padding: '9px 12px', background: 'transparent',
                border: 'none', cursor: 'pointer', color: C.text2, fontSize: 13,
                fontFamily: 'Inter, sans-serif', borderRadius: 8,
                transition: 'all 0.15s', marginBottom: 2,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                (e.currentTarget as HTMLElement).style.color = C.text;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = C.text2;
              }}
            >
              <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {item.icon} {item.label}
              </span>
              <ChevronRight size={14} />
            </button>
          ))}
        </div>

        {/* Sign out */}
        <div style={{ padding: '18px 22px', marginTop: 'auto' }}>
          <Btn variant="danger" fullWidth onClick={() => { logout(); setShowProfile(false); }} icon={<LogOut size={14} />}>
            Sign out
          </Btn>
          <p style={{ margin: '10px 0 0', fontSize: 10, color: C.text3, textAlign: 'center', letterSpacing: '0.03em' }}>
            WaypointFlow v2.4.1 · Tech-Triathlon 2026
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Notifications Overlay ────────────────────────────────────────────────────
export function NotificationsOverlay() {
  const { navigate, setShowNotifications } = useApp();
  const [category, setCategory] = useState('All');

  const categories = ['All', 'Critical', 'Operational', 'Informational'];
  const filtered = category === 'All' ? ALERTS : ALERTS.filter(a => {
    if (category === 'Critical') return a.type === 'critical';
    if (category === 'Operational') return a.type === 'operational';
    if (category === 'Informational') return a.type === 'info';
    return true;
  });

  const typeIcons: Record<string, string> = {
    critical: '🔴',
    warning: '🟠',
    operational: '🔵',
    info: '🔵',
    success: '🟢',
  };

  const typeColors: Record<string, string> = {
    critical: C.danger,
    warning: C.warning,
    operational: C.text2,
    info: C.info,
    success: C.success,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={() => setShowNotifications(false)}
      />

      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.38 }}
        style={{
          position: 'relative', width: 400, height: '100vh',
          background: 'rgba(5, 8, 14, 0.95)',
          backdropFilter: 'blur(30px)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Top accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.danger}, ${C.warning})` }} />

        {/* Header */}
        <div style={{ padding: '22px 22px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>Notifications</h3>
              <p style={{ margin: '3px 0 0', fontSize: 11, color: C.text3 }}>
                {ALERTS.filter(a => !a.read).length} unread · {ALERTS.length} total
              </p>
            </div>
            <button
              onClick={() => setShowNotifications(false)}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer', color: C.text2, width: 30, height: 30, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 6 }}>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 11, fontFamily: 'Inter, sans-serif',
                  border: `1px solid ${category === c ? C.accent : 'rgba(255,255,255,0.08)'}`,
                  background: category === c ? C.accentDim : 'transparent',
                  color: category === c ? C.accent : C.text3, cursor: 'pointer',
                  transition: 'all 0.15s', fontWeight: category === c ? 600 : 500,
                }}
              >{c}</button>
            ))}
          </div>
        </div>

        {/* Notification list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {filtered.map((alert, idx) => {
            const color = typeColors[alert.type];
            return (
              <div
                key={alert.id}
                onClick={() => { if (alert.screen) { navigate(alert.screen); setShowNotifications(false); } }}
                style={{
                  padding: '14px 22px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: !alert.read ? `${color}06` : 'transparent',
                  cursor: alert.screen ? 'pointer' : undefined,
                  transition: 'background 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={e => { if (alert.screen) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = !alert.read ? `${color}06` : 'transparent'; }}
              >
                {!alert.read && (
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                    background: color, borderRadius: '0 2px 2px 0',
                  }} />
                )}
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: `${color}15`, border: `1px solid ${color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14,
                  }}>
                    {typeIcons[alert.type]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: alert.read ? 500 : 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {alert.title}
                      </p>
                      {!alert.read && (
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 4, boxShadow: `0 0 8px ${color}60` }} className="pulse-dot" />
                      )}
                    </div>
                    <p style={{ margin: '0 0 5px', fontSize: 12, color: C.text3, lineHeight: 1.5 }}>{alert.description}</p>
                    <span style={{ fontSize: 10, color: C.text3, fontFamily: 'JetBrains Mono, monospace' }}>{alert.time}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <button style={{ fontSize: 12, color: C.text3, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'color 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.text2; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.text3; }}
          >
            Mark all as read
          </button>
          <span style={{ fontSize: 10, color: C.text3 }}>Tech-Triathlon 2026</span>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Global Search Overlay ────────────────────────────────────────────────────
export function GlobalSearchOverlay() {
  const { navigate, setShowSearch } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowSearch(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setShowSearch]);

  const results = query.length < 2 ? [] : [
    { type: 'Order', id: 'ORD-10482', detail: 'OUT047 · Fresh · Deferred', screen: 'dispatcher/order-details' as Screen, color: C.danger },
    { type: 'Order', id: 'ORD-10483', detail: 'OUT032 · Fresh · In Transit', screen: 'dispatcher/order-details' as Screen, color: C.accent },
    { type: 'Order', id: 'ORD-10527', detail: 'OUT032 · Fresh · Delivered', screen: 'store/tracking' as Screen, color: C.success },
    { type: 'Outlet', id: 'OUT032', detail: 'Waypoint Fresh Gampaha · Peliyagoda depot', screen: 'dispatcher/orders' as Screen, color: C.fresh },
    { type: 'Vehicle', id: 'VEH014', detail: 'Reefer Truck · Kasun Perera · On Route', screen: 'dispatcher/live-ops' as Screen, color: C.reefer },
    { type: 'Trip', id: 'Trip 1', detail: 'VEH014 · Gampaha / Colombo · 3 stops', screen: 'dispatcher/live-ops' as Screen, color: C.accent },
  ].filter(r =>
    r.id.toLowerCase().includes(query.toLowerCase()) ||
    r.detail.toLowerCase().includes(query.toLowerCase())
  );

  const typeIcons: Record<string, React.ReactNode> = {
    Order: <Package size={14} color={C.accent} />,
    Outlet: <MapPin size={14} color={C.fresh} />,
    Vehicle: <Truck size={14} color={C.reefer} />,
    Trip: <Activity size={14} color={C.info} />,
  };

  const recentSearches = ['ORD-10482', 'VEH014', 'OUT032', 'Gampaha'];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80 }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={() => setShowSearch(false)}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -8 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        style={{
          position: 'relative', width: '100%', maxWidth: 600,
          background: 'rgba(5, 8, 14, 0.97)',
          borderRadius: 18,
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(14,165,233,0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 14,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <Search size={18} color={C.text3} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search orders, outlets, vehicles, drivers…"
            style={{
              flex: 1, background: 'transparent', border: 'none',
              color: C.text, fontSize: 15, outline: 'none', padding: 0,
              fontFamily: 'Inter, sans-serif',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: C.text3, borderRadius: 6, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
            >
              <X size={12} />
            </button>
          )}
          <div style={{
            padding: '3px 8px', background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
            fontSize: 11, color: C.text3, fontFamily: 'JetBrains Mono, monospace',
            cursor: 'pointer',
          }} onClick={() => setShowSearch(false)}>
            ESC
          </div>
        </div>

        {/* Results / Recent */}
        <div style={{ maxHeight: 440, overflowY: 'auto' }}>
          {query.length < 2 ? (
            <div style={{ padding: '16px 20px' }}>
              <p style={{ margin: '0 0 12px', fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                Recent searches
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {recentSearches.map(s => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    style={{
                      padding: '6px 14px', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      borderRadius: 20, cursor: 'pointer', color: C.text2,
                      fontSize: 12, fontFamily: 'JetBrains Mono, monospace',
                      display: 'flex', gap: 8, alignItems: 'center',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.16)';
                      (e.currentTarget as HTMLElement).style.color = C.text;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)';
                      (e.currentTarget as HTMLElement).style.color = C.text2;
                    }}
                  >
                    <Search size={10} />
                    {s}
                  </button>
                ))}
              </div>

              {/* Quick nav */}
              <p style={{ margin: '20px 0 10px', fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                Quick access
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Live Operations', icon: <Activity size={14} color={C.success} />, screen: 'dispatcher/live-ops' as Screen },
                  { label: 'Dispatch Plan', icon: <Package size={14} color={C.accent} />, screen: 'dispatcher/dispatch-plan' as Screen },
                  { label: 'Fleet Status', icon: <Truck size={14} color={C.reefer} />, screen: 'dispatcher/live-ops' as Screen },
                  { label: 'Active Alerts', icon: <AlertTriangle size={14} color={C.danger} />, screen: 'dispatcher/exception' as Screen },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={() => { navigate(item.screen); setShowSearch(false); }}
                    style={{
                      padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif',
                      display: 'flex', gap: 10, alignItems: 'center',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                    }}
                  >
                    {item.icon}
                    <span style={{ fontSize: 12, color: C.text2 }}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 14, color: C.text2 }}>No results for</p>
              <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>"{query}"</p>
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              <p style={{ padding: '0 20px 8px', margin: 0, fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                {results.length} results
              </p>
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => { navigate(r.screen); setShowSearch(false); }}
                  style={{
                    width: '100%', padding: '12px 20px', background: 'transparent',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', gap: 14, alignItems: 'center', textAlign: 'left',
                    fontFamily: 'Inter, sans-serif', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 9,
                    background: `${r.color}15`, border: `1px solid ${r.color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {typeIcons[r.type]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>{r.id}</span>
                      <Badge color={r.color}>{r.type}</Badge>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: C.text3 }}>{r.detail}</p>
                  </div>
                  <ChevronRight size={14} color={C.text3} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', gap: 18, alignItems: 'center',
        }}>
          {[
            { key: '↵', label: 'Open' },
            { key: '↑↓', label: 'Navigate' },
            { key: 'ESC', label: 'Close' },
          ].map(k => (
            <span key={k.key} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{
                fontSize: 9, color: C.text3, background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4,
                fontFamily: 'JetBrains Mono, monospace',
              }}>{k.key}</span>
              <span style={{ fontSize: 11, color: C.text3 }}>{k.label}</span>
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
