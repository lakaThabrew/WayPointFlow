import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, CheckCircle, Mail, Lock, Shield, Truck, Package, Wifi } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { C, Btn, LogisticsBackground } from '../ui';
import type { Role } from '../../types';

const DEMO_ROLES: Array<{ role: Role; email: string; name: string; label: string; color: string; desc: string; icon: string }> = [
  { role: 'dispatcher', email: 'ashan@waypoint.lk', name: 'Ashan De Silva', label: 'Dispatcher', color: C.accent, desc: 'Operations command center', icon: '🎯' },
  { role: 'loader', email: 'ruwini@waypoint.lk', name: 'Ruwini Jayawardena', label: 'Loader', color: '#a78bfa', desc: 'Depot loading interface', icon: '📦' },
  { role: 'driver', email: 'kasun.p@waypoint.lk', name: 'Kasun Perera', label: 'Driver', color: C.fresh, desc: 'Mobile delivery companion', icon: '🚛' },
  { role: 'store-manager', email: 'chamari@waypoint.lk', name: 'Chamari Wickramasinghe', label: 'Store Manager', color: C.warning, desc: 'Store & order management', icon: 'ðŸª' },
];

function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: { logo: 34, text: 15, sub: 9 }, md: { logo: 42, text: 18, sub: 10 }, lg: { logo: 52, text: 22, sub: 11 } };
  const s = sizes[size];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: s.logo, height: s.logo, borderRadius: Math.round(s.logo * 0.27),
        background: `linear-gradient(135deg, ${C.accent}, #0369a1)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 6px 24px ${C.accent}40, 0 0 0 1px ${C.accent}30`,
      }}>
        <span style={{ fontSize: Math.round(s.logo * 0.48), fontWeight: 900, color: '#fff' }}>W</span>
      </div>
      <div>
        <p style={{ margin: 0, fontSize: s.text, fontWeight: 800, color: C.text, letterSpacing: '-0.025em' }}>WaypointFlow</p>
        <p style={{ margin: 0, fontSize: s.sub, color: C.text3, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
          Operations Platform
        </p>
      </div>
    </div>
  );
}

// â”€â”€â”€ Login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function Login() {
  const { navigate, login } = useApp();
  const [email, setEmail] = useState('ashan@waypoint.lk');
  const [password, setPassword] = useState('demo1234');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRoleSelect, setShowRoleSelect] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    const found = DEMO_ROLES.find(r => r.email === email);
    if (found && password === 'demo1234') {
      login(found.role);
    } else {
      setShowRoleSelect(true);
    }
  };

  const quickLogin = (role: Role) => login(role);

  return (
    <div style={{
      minHeight: '100vh', background: '#030508',
      display: 'flex', alignItems: 'stretch',
      position: 'relative', overflow: 'hidden',
    }}>
      <LogisticsBackground variant="login" />

      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(14,165,233,0.07) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Left panel — Brand + Features */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          flex: 1.1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '56px 64px',
          background: 'linear-gradient(160deg, rgba(7,11,17,0.95) 0%, rgba(3,5,8,0.7) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          maxWidth: 560, position: 'relative', zIndex: 1,
        }}
      >
        {/* Decorative top-left glow */}
        <div style={{
          position: 'absolute', top: -80, left: -80, width: 300, height: 300,
          background: `radial-gradient(circle, ${C.accent}15 0%, transparent 60%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ marginBottom: 52 }}>
          <BrandMark size="lg" />
        </div>

        <div style={{ marginBottom: 44 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 18,
            padding: '5px 14px', borderRadius: 20,
            background: `${C.accent}10`, border: `1px solid ${C.accent}25`,
          }}>
            <span className="status-dot active" />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              One operation. One connected system.
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: C.text2, lineHeight: 1.7, maxWidth: 400 }}>
            Waypoint's unified operations platform connects dispatchers, loaders, drivers, and store managers across <span style={{ color: C.fresh }}>Fresh</span>, <span style={{ color: C.style }}>Style</span>, and <span style={{ color: C.tech }}>Tech</span> brands.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="stagger-children">
          {[
            { icon: <Package size={16} color={C.accent} />, text: 'Real-time delivery tracking across 120 outlets', color: C.accent },
            { icon: <Truck size={16} color={C.fresh} />, text: 'Fleet and refrigeration capacity management', color: C.fresh },
            { icon: <Shield size={16} color='#a78bfa' />, text: 'Constraint-aware AI route planning', color: '#a78bfa' },
            { icon: <Wifi size={16} color={C.warning} />, text: 'Offline-capable field operations', color: C.warning },
          ].map(item => (
            <div key={item.text} style={{
              display: 'flex', gap: 14, alignItems: 'flex-start',
              padding: '12px 16px', borderRadius: 12,
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.05)',
              transition: 'all 0.2s ease',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLElement).style.borderColor = `${item.color}30`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)';
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: `${item.color}15`, border: `1px solid ${item.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.icon}
              </div>
              <span style={{ fontSize: 13, color: C.text2, lineHeight: 1.5, paddingTop: 6 }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Tech Triathlon badge */}
        <div style={{ marginTop: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px',
            borderRadius: 10, background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <span style={{ fontSize: 16 }}>ðŸ†</span>
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.text3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Tech-Triathlon 2026
              </p>
              <p style={{ margin: 0, fontSize: 10, color: C.text3 }}>Intelligent Enterprise Â· Logistics Category</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right panel â€” Login form */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 48, position: 'relative', zIndex: 1,
        }}
      >
        <div style={{ width: '100%', maxWidth: 420 }}>
          <AnimatePresence mode="wait">
            {!showRoleSelect ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28 }}
              >
                <div style={{ marginBottom: 36 }}>
                  <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: '-0.025em' }}>
                    Sign in
                  </h1>
                  <p style={{ margin: 0, fontSize: 14, color: C.text3 }}>Access your operational workspace</p>
                </div>

                <form onSubmit={handleLogin}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 600, color: C.text2 }}>Work email</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.text3, pointerEvents: 'none' }} />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="name@waypoint.lk"
                        style={{ paddingLeft: 38 }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 600, color: C.text2 }}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.text3, pointerEvents: 'none' }} />
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                        style={{ paddingLeft: 38, paddingRight: 44 }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        style={{
                          position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', color: C.text3,
                          transition: 'color 0.15s', padding: 0,
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.text2; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.text3; }}
                      >
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                      <input type="checkbox" />
                      <span style={{ fontSize: 12, color: C.text3 }}>Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => navigate('forgot-password')}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 12, color: C.accent, fontFamily: 'Inter, sans-serif',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.accent2; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.accent; }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  {error && (
                    <div style={{
                      marginBottom: 16, padding: '11px 14px',
                      background: C.dangerDim, border: `1px solid ${C.danger}30`,
                      borderRadius: 10, fontSize: 13, color: C.danger,
                      display: 'flex', gap: 8, alignItems: 'center',
                    }}>
                      <span>âš </span> {error}
                    </div>
                  )}

                  <Btn variant="primary" fullWidth size="lg" loading={loading}>
                    {loading ? 'Authenticatingâ€¦' : 'Sign in'}
                    {!loading && <ArrowRight size={15} />}
                  </Btn>
                </form>

                {/* Quick access */}
                <div style={{ marginTop: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ flex: 1, height: 1, background: C.border }} />
                    <span style={{ fontSize: 11, color: C.text3, fontWeight: 500 }}>Quick demo access</span>
                    <div style={{ flex: 1, height: 1, background: C.border }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {DEMO_ROLES.map(r => (
                      <button
                        key={r.role}
                        onClick={() => quickLogin(r.role)}
                        style={{
                          padding: '10px 14px',
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid rgba(255,255,255,0.07)`,
                          borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                          transition: 'all 0.18s', fontFamily: 'Inter, sans-serif',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = `${r.color}40`;
                          (e.currentTarget as HTMLElement).style.background = `${r.color}08`;
                          (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
                          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                        }}
                      >
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: r.color }}>{r.icon} {r.label}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 10, color: C.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="role-select-login"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28 }}
              >
                <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Select your role</h2>
                <p style={{ margin: '0 0 24px', fontSize: 13, color: C.text3 }}>Choose the interface for your role</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {DEMO_ROLES.map(r => (
                    <button
                      key={r.role}
                      onClick={() => quickLogin(r.role)}
                      style={{
                        padding: '14px 18px', background: 'rgba(255,255,255,0.03)',
                        border: `1px solid rgba(255,255,255,0.08)`,
                        borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        fontFamily: 'Inter, sans-serif', transition: 'all 0.18s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = `${r.color}40`;
                        (e.currentTarget as HTMLElement).style.background = `${r.color}08`;
                        (e.currentTarget as HTMLElement).style.transform = 'translateX(3px)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                        (e.currentTarget as HTMLElement).style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 10,
                          background: `${r.color}15`, border: `1px solid ${r.color}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18,
                        }}>
                          {r.icon}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.text }}>{r.label}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: C.text3 }}>{r.desc}</p>
                        </div>
                      </div>
                      <ArrowRight size={16} color={r.color} />
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowRoleSelect(false)}
                  style={{
                    marginTop: 18, background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: C.text3, fontFamily: 'Inter, sans-serif',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.text2; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.text3; }}
                >
                  â† Back to login
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// â”€â”€â”€ Forgot Password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function ForgotPassword() {
  const { navigate } = useApp();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#030508', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <LogisticsBackground variant="default" />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(14,165,233,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%', maxWidth: 440, padding: 40,
          background: 'rgba(7,11,17,0.8)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, position: 'relative', zIndex: 1,
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ marginBottom: 36 }}>
          <BrandMark />
        </div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Forgot password</h1>
              <p style={{ margin: '0 0 28px', fontSize: 14, color: C.text3 }}>Enter your work email and we'll send a reset link.</p>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 600, color: C.text2 }}>Work email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@waypoint.lk" />
              </div>
              <Btn fullWidth onClick={() => setSent(true)}>Send reset link</Btn>
              <button
                onClick={() => navigate('login')}
                style={{ marginTop: 16, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: C.text3, fontFamily: 'Inter, sans-serif', display: 'block', transition: 'color 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.text2; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.text3; }}
              >
                â† Back to sign in
              </button>
            </motion.div>
          ) : (
            <motion.div key="sent" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: C.successDim, border: `1px solid ${C.success}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: `0 0 30px ${C.success}20`,
              }}>
                <Mail size={26} color={C.success} />
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: C.text }}>Check your inbox</h2>
              <p style={{ margin: '0 0 28px', fontSize: 13, color: C.text3, lineHeight: 1.6 }}>
                We've sent a password reset link to <strong style={{ color: C.text }}>{email || 'your email'}</strong>. The link expires in 30 minutes.
              </p>
              <Btn fullWidth onClick={() => navigate('reset-password')}>Continue to reset password</Btn>
              <button onClick={() => navigate('login')} style={{ marginTop: 14, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: C.text3, fontFamily: 'Inter, sans-serif' }}>
                Return to sign in
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// â”€â”€â”€ Reset Password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function ResetPassword() {
  const { navigate } = useApp();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);

  const strength = pw.length === 0 ? 0 : pw.length < 6 ? 1 : pw.length < 10 ? 2 : 3;
  const strengthColors = ['transparent', C.danger, C.warning, C.success];
  const strengthLabels = ['', 'Weak', 'Fair', 'Strong'];

  return (
    <div style={{ minHeight: '100vh', background: '#030508', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <LogisticsBackground variant="default" />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(14,165,233,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%', maxWidth: 440, padding: 40,
          background: 'rgba(7,11,17,0.8)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20,
          position: 'relative', zIndex: 1, boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ marginBottom: 36 }}><BrandMark /></div>
        <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Reset password</h1>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: C.text3 }}>Choose a strong password for your account.</p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 600, color: C.text2 }}>New password</label>
          <div style={{ position: 'relative' }}>
            <input type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="At least 8 characters" style={{ paddingRight: 44 }} />
            <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.text3, padding: 0 }}>
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {pw && (
            <div style={{ marginTop: 8, display: 'flex', gap: 4, alignItems: 'center' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColors[strength] : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
              ))}
              <span style={{ fontSize: 11, color: strengthColors[strength], fontWeight: 600, marginLeft: 6 }}>{strengthLabels[strength]}</span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 600, color: C.text2 }}>Confirm password</label>
          <input type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Repeat password" />
          {pw2 && pw !== pw2 && <p style={{ margin: '5px 0 0', fontSize: 12, color: C.danger }}>Passwords do not match</p>}
          {pw2 && pw === pw2 && pw.length > 0 && <p style={{ margin: '5px 0 0', fontSize: 12, color: C.success }}>âœ“ Passwords match</p>}
        </div>

        <Btn fullWidth disabled={!pw || pw !== pw2} onClick={() => navigate('reset-success')}>Reset password</Btn>
        <button onClick={() => navigate('login')} style={{ marginTop: 16, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: C.text3, fontFamily: 'Inter, sans-serif', display: 'block', transition: 'color 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.text2; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.text3; }}
        >
          â† Back to sign in
        </button>
      </motion.div>
    </div>
  );
}

// â”€â”€â”€ Reset Success â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function ResetSuccess() {
  const { navigate } = useApp();
  return (
    <div style={{ minHeight: '100vh', background: '#030508', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <LogisticsBackground variant="login" />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(14,165,233,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%', maxWidth: 440, padding: 48,
          background: 'rgba(7,11,17,0.8)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20,
          position: 'relative', zIndex: 1, textAlign: 'center',
          boxShadow: `0 24px 60px rgba(0,0,0,0.5), 0 0 40px ${C.success}08`,
        }}
      >
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}><BrandMark /></div>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: C.successDim, border: `1px solid ${C.success}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: `0 0 40px ${C.success}25`,
        }}>
          <CheckCircle size={32} color={C.success} />
        </div>
        <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Password updated</h1>
        <p style={{ margin: '0 0 36px', fontSize: 14, color: C.text3, lineHeight: 1.6 }}>
          Your password has been updated successfully. You can now sign in with your new password.
        </p>
        <Btn fullWidth size="lg" onClick={() => navigate('login')}>Return to sign in</Btn>
      </motion.div>
    </div>
  );
}

// â”€â”€â”€ Role Select â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function RoleSelect() {
  const { login } = useApp();
  return (
    <div style={{ minHeight: '100vh', background: '#030508', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <LogisticsBackground variant="ai" />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(14,165,233,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 560, padding: '0 24px', position: 'relative', zIndex: 1 }}
      >
        <div style={{ marginBottom: 40, textAlign: 'center' }}>
          <BrandMark />
          <h2 style={{ margin: '28px 0 6px', fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>
            Select your role
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: C.text3 }}>Each role has a dedicated operational interface</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="stagger-children">
          {DEMO_ROLES.map(r => (
            <button
              key={r.role}
              onClick={() => login(r.role)}
              style={{
                padding: 22,
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid rgba(255,255,255,0.08)`,
                borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                fontFamily: 'Inter, sans-serif', transition: 'all 0.22s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = `${r.color}40`;
                (e.currentTarget as HTMLElement).style.background = `${r.color}08`;
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 30px rgba(0,0,0,0.2), 0 0 0 1px ${r.color}20`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${r.color}15`, border: `1px solid ${r.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14, fontSize: 22,
                boxShadow: `0 0 20px ${r.color}15`,
              }}>
                {r.icon}
              </div>
              <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: C.text }}>{r.label}</p>
              <p style={{ margin: '0 0 4px', fontSize: 12, color: C.text3 }}>{r.desc}</p>
              <p style={{ margin: 0, fontSize: 11, color: r.color, fontWeight: 500 }}>{r.name}</p>
            </button>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: 32, fontSize: 11, color: C.text3 }}>
          Tech-Triathlon 2026 Â· Intelligent Enterprise Logistics Platform
        </p>
      </motion.div>
    </div>
  );
}
