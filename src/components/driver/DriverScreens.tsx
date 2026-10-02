import { useState } from 'react';
import {
  CheckCircle, AlertTriangle, MapPin, Clock, Package, ChevronRight,
  ArrowLeft, Navigation, Play, Thermometer,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  C, Badge, StatusBadge, BrandBadge, TempBadge, Btn,
  InfoRow, Timeline, Divider, Mono, OfflineBanner,
} from '../ui';

// Mobile-first driver screens - all content sized for 390px phone frame

// ─── DR01 — Driver Home ───────────────────────────────────────────────────────
export function DriverHome() {
  const { navigate, isOffline } = useApp();

  return (
    <div style={{ flex: 1, background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Offline banner */}
      {isOffline && (
        <div style={{ padding: '10px 20px', background: `${C.warning}15`, borderBottom: `1px solid ${C.warning}30` }}>
          <OfflineBanner synced="03:52 AM" />
        </div>
      )}

      {/* Greeting */}
      <div style={{ padding: '24px 20px 16px', background: `linear-gradient(160deg, ${C.surface} 0%, ${C.bg} 100%)` }}>
        <p style={{ margin: '0 0 2px', fontSize: 13, color: C.text2 }}>Good morning,</p>
        <h1 style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 700, color: C.text }}>Kasun</h1>
        <p style={{ margin: 0, fontSize: 12, color: C.text3 }}>VEH014 · Peliyagoda Depot · {isOffline ? '⚠ Offline mode' : 'Connected'}</p>
      </div>

      {/* Trip card */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{
          background: C.card, border: `1px solid ${C.borderMd}`,
          borderRadius: 14, overflow: 'hidden',
          borderTop: `2px solid ${C.accent}`,
        }}>
          <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: C.text2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today's Route</p>
                <p style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 700, color: C.text }}>Trip 1 — 3 stops</p>
              </div>
              <StatusBadge status="On Route" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Distance', value: '42 km' },
                { label: 'Stops', value: '3 total' },
                { label: 'ETA done', value: '07:15' },
              ].map(m => (
                <div key={m.label} style={{ padding: '8px 10px', background: C.elevated, borderRadius: 8 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>{m.value}</p>
                  <p style={{ margin: 0, fontSize: 10, color: C.text3 }}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: C.text2 }}>Delivery progress</span>
              <span style={{ fontSize: 12, color: C.success }}>1 of 3 complete</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '33%', background: `linear-gradient(90deg, ${C.success}, ${C.accent})`, borderRadius: 3 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Current stop highlight */}
      <div style={{ padding: '0 20px 16px' }}>
        <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Next Stop</p>
        <div
          onClick={() => navigate('driver/stop')}
          style={{
            padding: '16px 18px', background: C.accentDim,
            border: `1px solid ${C.accent}40`, borderRadius: 12, cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.accent }}>OUT032</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: C.text }}>Waypoint Fresh Gampaha</p>
            </div>
            <Badge color={C.reefer}>❄ Chilled</Badge>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <Clock size={12} color={C.text3} />
              <span style={{ fontSize: 12, color: C.text2 }}>Window: 05:00–07:30</span>
            </div>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <Package size={12} color={C.text3} />
              <span style={{ fontSize: 12, color: C.text2 }}>25 packages</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '0 20px 24px', display: 'flex', gap: 10 }}>
        <Btn variant="primary" fullWidth onClick={() => navigate('driver/route')}>
          <Play size={14} /> View full route
        </Btn>
        <Btn variant="secondary" onClick={() => navigate('driver/stop')}>
          Stop
        </Btn>
      </div>
    </div>
  );
}

// ─── DR02 — Route Overview ────────────────────────────────────────────────────
export function RouteOverview() {
  const { navigate, isOffline } = useApp();

  const stops = [
    { id: 'DEPOT', label: 'Peliyagoda Depot', time: '04:10', status: 'done' as const, note: 'Departed 04:13 AM', brand: null },
    { id: 'OUT041', label: 'Fresh Colombo 3', time: '05:58', status: 'done' as const, note: 'ORD-10484 · Delivered', brand: 'Fresh' },
    { id: 'OUT032', label: 'Fresh Gampaha', time: '06:42', status: 'active' as const, note: 'ORD-10483, ORD-10527 · ETA', brand: 'Fresh' },
  ];

  return (
    <div style={{ flex: 1, background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: C.surface, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('driver/home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text2 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>Today's Route</h2>
          <p style={{ margin: 0, fontSize: 11, color: C.text3 }}>VEH014 · Trip 1 · 3 stops</p>
        </div>
        {isOffline && (
          <div style={{ marginLeft: 'auto', padding: '3px 10px', background: `${C.warning}15`, border: `1px solid ${C.warning}30`, borderRadius: 12 }}>
            <span style={{ fontSize: 10, color: C.warning }}>OFFLINE DATA</span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px 24px' }}>
        {stops.map((stop, i) => (
          <div
            key={stop.id}
            onClick={() => stop.id !== 'DEPOT' && navigate('driver/stop')}
            style={{ display: 'flex', gap: 14, cursor: stop.id !== 'DEPOT' ? 'pointer' : undefined }}
          >
            {/* Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                background: stop.status === 'done' ? C.success : stop.status === 'active' ? C.accent : C.text3,
                boxShadow: stop.status === 'active' ? `0 0 10px ${C.accent}80` : undefined,
              }} className={stop.status === 'active' ? 'pulse-dot' : ''} />
              {i < stops.length - 1 && (
                <div style={{ width: 2, flex: 1, minHeight: 40, background: stop.status === 'done' ? C.success + '40' : C.border, margin: '4px 0' }} />
              )}
            </div>

            {/* Content */}
            <div style={{
              flex: 1, paddingBottom: i < stops.length - 1 ? 16 : 0,
              padding: stop.id !== 'DEPOT' ? '0 0 16px' : '0 0 16px',
            }}>
              <div style={{
                padding: '12px 14px', background: stop.status === 'active' ? C.accentDim : C.card,
                border: `1px solid ${stop.status === 'active' ? C.accent + '40' : C.border}`,
                borderRadius: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: stop.status === 'active' ? 700 : 500, color: stop.status === 'active' ? C.accent : C.text }}>{stop.label}</p>
                  <Mono color={stop.status === 'done' ? C.success : stop.status === 'active' ? C.warning : C.text3}>{stop.time}</Mono>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>{stop.note}</p>
                {stop.status === 'active' && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <Badge color={C.warning}>ETA: 06:42 AM</Badge>
                    <Badge color={C.danger}>+22 min delay</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DR03 — Stop Details ──────────────────────────────────────────────────────
export function StopDetails() {
  const { navigate, isOffline } = useApp();

  return (
    <div style={{ flex: 1, background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: C.surface, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('driver/route')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text2 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>Stop Details</h2>
          <p style={{ margin: 0, fontSize: 11, color: C.text3 }}>Stop 2 of 3</p>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {/* Outlet header */}
        <div style={{
          padding: '18px 20px', background: C.card, borderRadius: 14,
          border: `1px solid ${C.border}`, marginBottom: 16,
          borderTop: `2px solid ${C.fresh}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Mono color={C.text3}>OUT032</Mono>
            <BrandBadge brand="Fresh" />
          </div>
          <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: C.text }}>Waypoint Fresh Gampaha</h2>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: C.text2 }}>14 Station Rd, Gampaha</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { icon: <Clock size={13} />, label: 'Window', value: '05:00–07:30' },
              { icon: <Thermometer size={13} />, label: 'Temp', value: 'Chilled' },
              { icon: <MapPin size={13} />, label: 'Dock', value: 'Rear dock' },
              { icon: <Package size={13} />, label: 'Packages', value: '25 total' },
            ].map(m => (
              <div key={m.label} style={{ padding: '10px 12px', background: C.elevated, borderRadius: 8 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3, color: C.text3 }}>
                  {m.icon}
                  <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Orders */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Orders</p>
          {[
            { id: 'ORD-10483', desc: '14 packages · 200 kg · Chilled', status: 'In Transit' as const },
            { id: 'ORD-10527', desc: '11 packages · 160 kg · Chilled', status: 'In Transit' as const },
          ].map(o => (
            <div key={o.id} style={{
              padding: '12px 14px', background: C.card, borderRadius: 10,
              border: `1px solid ${C.border}`, marginBottom: 8,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Mono color={C.accent}>{o.id}</Mono>
                <StatusBadge status={o.status} />
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: C.text2 }}>{o.desc}</p>
            </div>
          ))}
        </div>

        {/* ETA warning */}
        <div style={{
          padding: '12px 14px', background: C.warningDim,
          border: `1px solid ${C.warning}30`, borderRadius: 10, marginBottom: 16,
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <Clock size={16} color={C.warning} />
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: C.warning }}>Window closing in 48 min</p>
            <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>ETA 06:42 · Window closes 07:30</p>
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div style={{ padding: '16px 20px', background: C.surface, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10 }}>
        <Btn variant="secondary" fullWidth onClick={() => {}}>
          <Navigation size={14} /> Navigate
        </Btn>
        <Btn variant="primary" fullWidth onClick={() => navigate('driver/confirm')}>
          Start delivery
        </Btn>
      </div>
    </div>
  );
}

// ─── DR04 — Delivery Confirmation ─────────────────────────────────────────────
export function DeliveryConfirmation() {
  const { navigate, isOffline } = useApp();
  const [qty1, setQty1] = useState(true);
  const [qty2, setQty2] = useState(true);
  const [condition, setCondition] = useState('Good');
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed) {
    return (
      <div style={{ flex: 1, background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: isOffline ? C.warningDim : C.successDim,
          border: `1px solid ${isOffline ? C.warning : C.success}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <CheckCircle size={28} color={isOffline ? C.warning : C.success} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: C.text, textAlign: 'center' }}>
          {isOffline ? 'Saved on device' : 'Delivery confirmed'}
        </h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, color: C.text2, textAlign: 'center' }}>
          {isOffline
            ? 'Your delivery confirmation will sync when connection returns.'
            : 'Delivery to OUT032 confirmed. Dispatcher has been notified.'}
        </p>
        {isOffline && (
          <div style={{ padding: '6px 14px', background: C.warningDim, border: `1px solid ${C.warning}30`, borderRadius: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 12, color: C.warning }}>Status: Pending sync</span>
          </div>
        )}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn variant="primary" fullWidth onClick={() => navigate('driver/route')}>
            Next stop
          </Btn>
          {isOffline && (
            <Btn variant="ghost" fullWidth onClick={() => navigate('degradation/restored')}>
              Check connectivity
            </Btn>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: C.surface, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('driver/stop')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text2 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>Complete delivery</h2>
          <p style={{ margin: 0, fontSize: 11, color: C.text3 }}>OUT032 — Gampaha</p>
        </div>
      </div>

      {isOffline && (
        <div style={{ padding: '10px 20px', background: `${C.warning}12`, borderBottom: `1px solid ${C.warning}25` }}>
          <OfflineBanner synced="03:52 AM" />
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {/* Orders to confirm */}
        {[
          { id: 'ORD-10483', packages: 14, weight: '200 kg' },
          { id: 'ORD-10527', packages: 11, weight: '160 kg' },
        ].map((o, i) => (
          <div key={o.id} style={{ marginBottom: 12 }}>
            <div style={{ padding: '14px 16px', background: C.card, borderRadius: 12, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <Mono color={C.accent}>{o.id}</Mono>
                <span style={{ fontSize: 12, color: C.text2 }}>{o.packages} pkgs · {o.weight}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => i === 0 ? setQty1(v => !v) : setQty2(v => !v)}
                  style={{
                    flex: 1, padding: '9px 12px',
                    background: (i === 0 ? qty1 : qty2) ? C.successDim : C.elevated,
                    border: `1px solid ${(i === 0 ? qty1 : qty2) ? C.success + '50' : C.border}`,
                    borderRadius: 8, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    color: (i === 0 ? qty1 : qty2) ? C.success : C.text2,
                    fontSize: 12, fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {(i === 0 ? qty1 : qty2) ? <CheckCircle size={13} /> : <div style={{ width: 13, height: 13, borderRadius: '50%', border: `1px solid ${C.text3}` }} />}
                  Quantity verified
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Condition */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 500, color: C.text2 }}>Goods condition</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {['Good', 'Minor damage', 'Damaged'].map(c => (
              <button
                key={c}
                onClick={() => setCondition(c)}
                style={{
                  padding: '10px 8px', borderRadius: 8, fontSize: 12,
                  border: `1px solid ${condition === c ? (c === 'Good' ? C.success : c === 'Damaged' ? C.danger : C.warning) : C.border}`,
                  background: condition === c ? (c === 'Good' ? C.successDim : c === 'Damaged' ? C.dangerDim : C.warningDim) : C.elevated,
                  color: condition === c ? (c === 'Good' ? C.success : c === 'Damaged' ? C.danger : C.warning) : C.text2,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >{c}</button>
            ))}
          </div>
        </div>

        {/* Optional note */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, color: C.text2 }}>Note (optional)</p>
          <textarea rows={2} placeholder="Any delivery notes…" style={{ width: '100%', resize: 'none' }} />
        </div>

        {isOffline && (
          <div style={{ padding: '10px 12px', background: C.warningDim, borderRadius: 8, border: `1px solid ${C.warning}25`, marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 12, color: C.warning }}>Offline — confirmation will be saved locally and synced when connection returns.</p>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div style={{ padding: '16px 20px', background: C.surface, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10 }}>
        <Btn variant="danger" fullWidth onClick={() => navigate('driver/issue')}>
          Report issue
        </Btn>
        <Btn
          variant="primary"
          fullWidth
          disabled={!qty1 || !qty2}
          onClick={() => setConfirmed(true)}
        >
          {isOffline ? 'Save offline' : 'Confirm delivery'}
        </Btn>
      </div>
    </div>
  );
}

// ─── DR05 — Delivery Issue ─────────────────────────────────────────────────────
export function DeliveryIssue() {
  const { navigate, isOffline } = useApp();
  const [issueType, setIssueType] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const issues = [
    'Outlet closed',
    'Access blocked',
    'Damaged goods',
    'Quantity mismatch',
    'Unable to contact outlet',
    'Other',
  ];

  if (submitted) {
    return (
      <div style={{ flex: 1, background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.warningDim, border: `1px solid ${C.warning}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <AlertTriangle size={26} color={C.warning} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: C.text, textAlign: 'center' }}>Issue submitted</h2>
        <p style={{ margin: '0 0 8px', fontSize: 13, color: C.text2, textAlign: 'center' }}>
          {isOffline
            ? 'Your issue report has been saved locally and will sync when connection returns.'
            : 'Dispatcher has been notified. They will contact you with guidance.'}
        </p>
        {isOffline && <Badge color={C.warning} style={{ marginBottom: 20 }}>Pending sync</Badge>}
        <Btn variant="primary" fullWidth onClick={() => navigate('driver/route')}>Back to route</Btn>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: C.surface, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('driver/stop')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text2 }}>
          <ArrowLeft size={18} />
        </button>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>Report an issue</h2>
      </div>

      {isOffline && (
        <div style={{ padding: '10px 20px', background: `${C.warning}12`, borderBottom: `1px solid ${C.warning}25` }}>
          <OfflineBanner synced="03:52 AM" />
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <div style={{ padding: '12px 14px', background: C.dangerDim, border: `1px solid ${C.danger}25`, borderRadius: 10, marginBottom: 20 }}>
          <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 600, color: C.danger }}>OUT032 — Waypoint Fresh Gampaha</p>
          <p style={{ margin: 0, fontSize: 11, color: C.text2 }}>ORD-10483, ORD-10527</p>
        </div>

        <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: C.text }}>What went wrong?</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {issues.map(issue => (
            <button
              key={issue}
              onClick={() => setIssueType(issue)}
              style={{
                padding: '12px 16px', background: issueType === issue ? C.dangerDim : C.card,
                border: `1px solid ${issueType === issue ? C.danger + '50' : C.border}`,
                borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                fontSize: 13, color: issueType === issue ? C.danger : C.text,
                fontFamily: 'Inter, sans-serif', fontWeight: issueType === issue ? 600 : 400,
              }}
            >
              {issue}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: C.text2 }}>Additional notes</p>
          <textarea
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Describe what happened…"
            style={{ width: '100%', resize: 'none' }}
          />
        </div>
      </div>

      <div style={{ padding: '16px 20px', background: C.surface, borderTop: `1px solid ${C.border}` }}>
        <Btn
          variant="danger"
          fullWidth
          size="lg"
          disabled={!issueType}
          onClick={() => setSubmitted(true)}
        >
          Submit issue
        </Btn>
      </div>
    </div>
  );
}
