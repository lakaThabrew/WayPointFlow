import { useState } from 'react';
import {
  WifiOff, Wifi, RefreshCw, CheckCircle, ArrowLeft,
  AlertTriangle, Package, MapPin, Clock as LucideClock, Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  C, Card, Badge, StatusBadge, BrandBadge, Btn,
  InfoRow, Timeline, Divider, Mono, SectionHeader,
  AlertCard, OfflineBanner, ConstraintTag, CapacityBar,
} from '../ui';

// ─── DG01 — Connection Lost ───────────────────────────────────────────────────
export function ConnectionLost() {
  const { navigate, setOffline, pendingSync } = useApp();

  const handleGoOffline = () => {
    setOffline(true);
    navigate('degradation/offline-route');
  };

  return (
    <div style={{ flex: 1, background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Persistent offline banner */}
      <div style={{
        padding: '14px 20px',
        background: `${C.warning}20`,
        borderBottom: `2px solid ${C.warning}40`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <WifiOff size={18} color={C.warning} />
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.warning }}>You're offline</p>
            <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>Connection to Waypoint Operations lost · 06:29 AM</p>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Last sync */}
        <Card style={{ borderLeft: `3px solid ${C.warning}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: C.text }}>Last synced</p>
              <Mono color={C.text2}>06:29 AM — 13 minutes ago</Mono>
            </div>
            <Badge color={C.offline} dot>Offline</Badge>
          </div>
        </Card>

        {/* What's available */}
        <Card>
          <SectionHeader title="Available offline" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: <MapPin size={14} />, label: "Today's route", detail: '3 stops · all loaded', ok: true },
              { icon: <Package size={14} />, label: 'Delivery orders', detail: 'ORD-10483, ORD-10527', ok: true },
              { icon: <LucideClock size={14} />, label: 'Delivery windows', detail: 'Saved locally', ok: true },
              { icon: <Wifi size={14} />, label: 'Live dispatch updates', detail: 'Not available offline', ok: false },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '9px 12px',
                background: item.ok ? C.successDim : C.elevated,
                border: `1px solid ${item.ok ? C.success + '25' : C.border}`,
                borderRadius: 8,
              }}>
                <span style={{ color: item.ok ? C.success : C.text3 }}>{item.icon}</span>
                <div>
                  <p style={{ margin: 0, fontSize: 13, color: item.ok ? C.text : C.text3, fontWeight: 500 }}>{item.label}</p>
                  <p style={{ margin: 0, fontSize: 11, color: C.text3 }}>{item.detail}</p>
                </div>
                {item.ok && <CheckCircle size={13} color={C.success} style={{ marginLeft: 'auto' }} />}
              </div>
            ))}
          </div>
        </Card>

        {/* Pending actions */}
        <Card>
          <SectionHeader title="Pending local actions" subtitle="Will sync when connection returns" />
          {pendingSync > 0 ? (
            <div style={{ padding: '10px 12px', background: C.warningDim, borderRadius: 8, border: `1px solid ${C.warning}20` }}>
              <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>
                {pendingSync} action{pendingSync === 1 ? '' : 's'} saved on this device — waiting for connection.
              </p>
            </div>
          ) : (
            <div style={{ padding: '10px 12px', background: C.warningDim, borderRadius: 8, border: `1px solid ${C.warning}20` }}>
              <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>No pending local actions yet. Deliveries you complete offline will appear here.</p>
            </div>
          )}
        </Card>

        <div style={{ padding: '12px 14px', background: C.accentDim, borderRadius: 10, border: `1px solid ${C.accent}20` }}>
          <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: C.accent }}>You can continue working</p>
          <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>Your route and today's assigned deliveries are available offline. Continue to your next stop — all confirmations will sync automatically.</p>
        </div>
      </div>

      <div style={{ padding: '16px 20px', background: C.surface, borderTop: `1px solid ${C.border}` }}>
        <Btn variant="primary" fullWidth onClick={handleGoOffline}>
          Continue to route (offline)
        </Btn>
      </div>
    </div>
  );
}

// ─── DG02 — Offline Route ─────────────────────────────────────────────────────
export function OfflineRoute() {
  const { navigate } = useApp();

  const stops = [
    { id: 'OUT041', label: 'Fresh Colombo 3', time: '05:58', status: 'done' as const, note: 'ORD-10484 · Delivered' },
    { id: 'OUT032', label: 'Fresh Gampaha', time: '~06:45', status: 'active' as const, note: 'ORD-10483, ORD-10527 · Current stop' },
  ];

  return (
    <div style={{ flex: 1, background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Header with offline indicator */}
      <div style={{
        padding: '14px 20px',
        background: `${C.warning}12`,
        borderBottom: `1px solid ${C.warning}25`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <WifiOff size={15} color={C.warning} />
        <span style={{ fontSize: 13, fontWeight: 600, color: C.warning }}>You're offline</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: C.text3 }}>Synced 06:29 AM</span>
      </div>

      {/* Offline data badge */}
      <div style={{
        padding: '8px 20px',
        background: C.elevated,
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.warning }} />
        <span style={{ fontSize: 11, color: C.text3 }}>OFFLINE DATA — Last synced route shown below</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px 24px' }}>
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: C.text }}>Today's Route — Trip 1</p>
          <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>VEH014 · 3 stops · Offline data available</p>
        </div>

        {stops.map((stop, i) => (
          <div
            key={stop.id}
            onClick={() => navigate('degradation/offline-delivery')}
            style={{ display: 'flex', gap: 14, cursor: 'pointer', marginBottom: i < stops.length - 1 ? 0 : 0 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                background: stop.status === 'done' ? C.success : C.warning,
              }} className={stop.status === 'active' ? 'pulse-dot' : ''} />
              {i < stops.length - 1 && (
                <div style={{ width: 2, flex: 1, minHeight: 40, background: stop.status === 'done' ? C.success + '40' : C.border, margin: '4px 0' }} />
              )}
            </div>
            <div style={{ flex: 1, paddingBottom: 16 }}>
              <div style={{
                padding: '12px 14px', background: stop.status === 'active' ? C.warningDim : C.card,
                border: `1px solid ${stop.status === 'active' ? C.warning + '40' : C.border}`,
                borderRadius: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text }}>{stop.label}</p>
                  <Mono color={stop.status === 'done' ? C.success : C.warning}>{stop.time}</Mono>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>{stop.note}</p>
                {stop.status === 'active' && (
                  <div style={{ marginTop: 8 }}>
                    <Badge color={C.warning} dot>Current stop — tap to deliver</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 8, padding: '12px 14px', background: C.elevated, borderRadius: 10, border: `1px solid ${C.border}` }}>
          <p style={{ margin: '0 0 2px', fontSize: 12, color: C.text3 }}>Still in route</p>
          <p style={{ margin: 0, fontSize: 13, color: C.text }}>Depot return — estimated 07:30 AM</p>
        </div>
      </div>
    </div>
  );
}

// ─── DG03 — Offline Delivery ──────────────────────────────────────────────────
export function OfflineDelivery() {
  const { navigate } = useApp();
  const [saved, setSaved] = useState(false);

  if (saved) {
    return (
      <div style={{ flex: 1, background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: C.warningDim, border: `1px solid ${C.warning}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <Upload size={28} color={C.warning} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: C.text, textAlign: 'center' }}>Saved on device</h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: C.text2, textAlign: 'center' }}>Your delivery confirmation will sync when connection returns.</p>
        <div style={{ padding: '8px 16px', background: C.warningDim, border: `1px solid ${C.warning}30`, borderRadius: 20, marginBottom: 24 }}>
          <span style={{ fontSize: 12, color: C.warning, fontWeight: 600 }}>● PENDING SYNC — 1 record</span>
        </div>
        <Btn variant="secondary" fullWidth onClick={() => navigate('degradation/offline-route')}>Back to route</Btn>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Offline header */}
      <div style={{ padding: '12px 20px', background: `${C.warning}12`, borderBottom: `1px solid ${C.warning}25`, display: 'flex', gap: 8, alignItems: 'center' }}>
        <WifiOff size={13} color={C.warning} />
        <span style={{ fontSize: 12, color: C.warning }}>Offline — saving locally</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: C.text }}>Complete delivery</h2>
        <p style={{ margin: '0 0 20px', fontSize: 12, color: C.text3 }}>OUT032 — Waypoint Fresh Gampaha · Offline</p>

        {[
          { id: 'ORD-10483', packages: '14 pkgs · 200 kg' },
          { id: 'ORD-10527', packages: '11 pkgs · 160 kg' },
        ].map(o => (
          <div key={o.id} style={{ padding: '12px 14px', background: C.card, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Mono color={C.accent}>{o.id}</Mono>
              <Badge color={C.success} dot>Verified</Badge>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: C.text2 }}>{o.packages}</p>
          </div>
        ))}

        <div style={{ marginTop: 16, padding: '12px 14px', background: C.warningDim, border: `1px solid ${C.warning}25`, borderRadius: 10 }}>
          <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: C.warning }}>Offline mode</p>
          <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>This confirmation will be saved on your device with a timestamp and automatically synced when connectivity is restored.</p>
        </div>
      </div>

      <div style={{ padding: '16px 20px', background: C.surface, borderTop: `1px solid ${C.border}` }}>
        <Btn variant="primary" fullWidth size="lg" onClick={() => setSaved(true)}>
          Save delivery offline
        </Btn>
      </div>
    </div>
  );
}

// ─── DG04 — Connection Restored ───────────────────────────────────────────────
export function ConnectionRestored() {
  const { navigate, setOffline, pendingSync, runSync, showToast } = useApp();
  const [syncing, setSyncing] = useState(false);
  const [syncedCount, setSyncedCount] = useState<number | null>(null);
  const [failedCount, setFailedCount] = useState(0);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const outcome = await runSync();
      if (outcome.error) {
        showToast(outcome.error, 'error');
        return;
      }
      if (outcome.processed === 0 && outcome.remaining === 0) {
        showToast('Nothing pending sync', 'info');
      } else if (outcome.failed > 0) {
        showToast(`${outcome.processed} synced, ${outcome.failed} still pending`, 'error');
      } else {
        showToast(`${outcome.processed} record${outcome.processed === 1 ? '' : 's'} synced`, 'success');
      }
      setSyncedCount(outcome.processed);
      setFailedCount(outcome.remaining);
      if (outcome.remaining === 0) setOffline(false);
    } finally {
      setSyncing(false);
    }
  };

  const synced = syncedCount !== null && failedCount === 0;
  const pendingLabel = pendingSync === 1 ? '1 update' : `${pendingSync} updates`;

  return (
    <div style={{ flex: 1, background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Connection banner */}
      <div style={{
        padding: '14px 20px',
        background: synced ? `${C.success}15` : `${C.accent}12`,
        borderBottom: `1px solid ${synced ? C.success + '30' : C.accent + '30'}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {synced
          ? <><CheckCircle size={18} color={C.success} /><span style={{ fontSize: 14, fontWeight: 700, color: C.success }}>All synced</span></>
          : <><Wifi size={18} color={C.accent} /><span style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>Connection restored</span></>}
      </div>

      <div style={{ flex: 1, padding: 24 }}>
        {!synced ? (
          <>
            <div style={{
              textAlign: 'center', padding: '24px 0 20px',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: C.accentDim, border: `1px solid ${C.accent}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Wifi size={26} color={C.accent} />
              </div>
              <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: C.text }}>Connection restored</h2>
              <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>
                {pendingSync > 0 ? `${pendingLabel} ready to sync with Waypoint Operations` : 'No updates are waiting to sync'}
              </p>
            </div>

            {pendingSync > 0 && (
            <Card style={{ marginBottom: 16 }}>
              <SectionHeader title="Pending updates" subtitle="Recorded offline — ready to sync" />
              {Array.from({ length: pendingSync }).map((_, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: `1px solid ${C.border}`,
                }}>
                  <CheckCircle size={14} color={C.success} />
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: C.text }}>Offline driver action</p>
                    <p style={{ margin: 0, fontSize: 11, color: C.text3 }}>Stored in IndexedDB with a client UUID</p>
                  </div>
                </div>
              ))}
            </Card>
            )}

            <Btn
              variant="primary"
              fullWidth
              size="lg"
              onClick={handleSync}
              disabled={syncing || pendingSync === 0}
            >
              {syncing ? <><RefreshCw size={14} className="animate-spin" /> Syncing…</> : <><Upload size={14} /> {pendingSync === 0 ? 'Nothing to sync' : `Sync ${pendingLabel}`}</>}
            </Btn>
          </>
        ) : (
          /* Sync complete */
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: C.successDim, border: `1px solid ${C.success}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <CheckCircle size={28} color={C.success} />
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: C.text }}>All updates synced</h2>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: C.text2 }}>
              {syncedCount} record{syncedCount === 1 ? '' : 's'} synchronized. Dispatcher can now see your updated delivery status.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Btn variant="primary" fullWidth onClick={() => navigate('driver/route')}>Continue route</Btn>
              <Btn variant="secondary" fullWidth onClick={() => navigate('dispatcher/live-ops')}>Dispatcher sees update</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DG05 — Sync Complete (standalone) ───────────────────────────────────────
export function SyncComplete() {
  const { navigate } = useApp();
  return (
    <div style={{ flex: 1, background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.successDim, border: `1px solid ${C.success}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <CheckCircle size={28} color={C.success} />
      </div>
      <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: C.text, textAlign: 'center' }}>All updates synced</h2>
      <p style={{ margin: '0 0 8px', fontSize: 13, color: C.text2, textAlign: 'center' }}>3 records synchronized. Dispatcher now sees updated delivery information.</p>
      <div style={{ padding: '10px 16px', background: C.card, borderRadius: 8, marginBottom: 24, fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: C.success }}>3 records · 06:51 AM</div>
      <Btn variant="primary" fullWidth onClick={() => navigate('driver/route')}>Continue route</Btn>
    </div>
  );
}

// ─── DG06 — Planning Capacity Conflict ───────────────────────────────────────
export function CapacityConflict() {
  const { navigate } = useApp();

  return (
    <div style={{ padding: 28, maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate('dispatcher/planning')}><ArrowLeft size={14} /> Planning</Btn>
      </div>

      {/* Header */}
      <div style={{
        padding: '20px 24px', background: C.dangerDim,
        border: `1px solid ${C.danger}30`, borderRadius: 14, marginBottom: 24,
        display: 'flex', gap: 16,
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: C.dangerDim, border: `1px solid ${C.danger}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <AlertTriangle size={22} color={C.danger} />
        </div>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: C.danger }}>Plan cannot be released</h2>
          <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>The current plan has 4 constraint violations. These must be resolved or orders must be deferred before the plan can be finalized.</p>
        </div>
      </div>

      {/* Issues list */}
      <Card style={{ marginBottom: 20 }}>
        <SectionHeader title="Constraint Violations" subtitle="Resolve before releasing plan" />
        {[
          { order: 'ORD-10482', issue: 'No feasible vehicle — reefer van required', type: 'critical' as const, action: 'Defer' },
          { order: 'ORD-10491', issue: 'VEH022 over volume capacity (11.8/15 m³)', type: 'warning' as const, action: 'Reassign' },
          { order: 'ORD-10491', issue: 'Mall window conflict — OUT091 access 08:00–10:00 requires 09:00 departure', type: 'warning' as const, action: 'Re-plan' },
          { order: 'ORD-10489', issue: 'Fresh time budget exceeded — VEH014 Trip 2 requires 290 min (max 270)', type: 'critical' as const, action: 'Defer' },
        ].map((v, i) => {
          const colors = { critical: C.danger, warning: C.warning };
          const c = colors[v.type];
          return (
            <div key={i} style={{
              padding: '12px 14px', background: v.type === 'critical' ? C.dangerDim : C.warningDim,
              border: `1px solid ${c}25`, borderRadius: 10, marginBottom: 8,
              display: 'flex', gap: 12, alignItems: 'center',
            }}>
              <AlertTriangle size={14} color={c} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 2px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: c }}>{v.order}</p>
                <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>{v.issue}</p>
              </div>
              <Btn variant={v.type === 'critical' ? 'danger' : 'secondary'} size="sm" onClick={() => navigate('dispatcher/deferral')}>{v.action}</Btn>
            </div>
          );
        })}
      </Card>

      <div style={{ display: 'flex', gap: 12 }}>
        <Btn variant="primary" onClick={() => navigate('dispatcher/planning')}>Re-plan</Btn>
        <Btn variant="danger" onClick={() => navigate('dispatcher/deferral')}>Review deferrals</Btn>
        <Btn variant="ghost" onClick={() => navigate('dispatcher/dispatch-plan')}>Override and release</Btn>
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 12, color: C.text3 }}>Releasing with violations will create exception records and notify affected outlets.</p>
    </div>
  );
}

