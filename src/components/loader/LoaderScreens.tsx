import { useState } from 'react';
import {
  CheckCircle, AlertTriangle, Clock, Package, Truck, ChevronRight,
  ArrowLeft, Phone, Activity, Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  C, Card, Badge, StatusBadge, BrandBadge, TempBadge, Btn,
  KpiCard, CapacityBar, AlertCard, Table, TableRow, SectionHeader,
  InfoRow, Divider, ConstraintTag, Mono, Label,
  AnimatedNumber, AiBadge, Sparkline,
} from '../ui';
import { ORDERS, VEHICLES, TRIPS, TODAY_DISPLAY } from '../../data/mockData';

// ─── L01 — Loader Home ─────────────────────────────────────────────────────
export function LoaderHome() {
  const { navigate } = useApp();

  const statusCounts = [
    { label: 'Waiting', count: 3, color: C.text3, action: () => navigate('loader/queue') },
    { label: 'Loading', count: 2, color: C.warning, action: () => navigate('loader/queue') },
    { label: 'Ready', count: 1, color: C.success, action: () => navigate('loader/ready') },
    { label: 'Shortfall', count: 1, color: C.danger, action: () => navigate('loader/shortfall') },
    { label: 'Departed', count: 3, color: C.text2, action: () => {} },
  ];

  return (
    <div style={{ padding: 28, maxWidth: 1100 }}>
      {/* Hero Header */}
      <div style={{
        marginBottom: 24, padding: '20px 24px',
        background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(12,18,32,0.6) 60%)',
        borderRadius: 16, border: '1px solid rgba(251,191,36,0.15)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'radial-gradient(circle, rgba(251,191,36,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.025em' }}>Today's Loading</h2>
          <p style={{ margin: 0, fontSize: 13, color: C.text3 }}>{TODAY_DISPLAY} · Peliyagoda Depot · Dock activity</p>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Loads Today</p>
            <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, color: C.warning, fontFamily: 'JetBrains Mono, monospace' }}>
              <AnimatedNumber value={10} />
            </p>
          </div>
          <Sparkline data={[6, 8, 7, 9, 8, 10, 10]} color={C.warning} height={36} width={70} />
        </div>
      </div>

      {/* Status cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }} className="stagger-children">
        {statusCounts.map(s => (
          <div
            key={s.label}
            onClick={s.action}
            style={{
              padding: '16px 18px', background: C.card, borderRadius: 14,
              border: `1px solid ${C.border}`, cursor: 'pointer',
              borderTop: `2px solid ${s.color}`, transition: 'all 0.22s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = C.card2;
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 30px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = C.card;
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }}
          >
            <p style={{ margin: '0 0 6px', fontSize: 30, fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}><AnimatedNumber value={s.count} /></p>
            <p style={{ margin: 0, fontSize: 12, color: C.text2, fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Shortfall alert */}
      <AlertCard
        type="critical"
        title="Loading shortfall detected — ORD-10489"
        desc="VEH014 Trip 2 — OUT078. Expected 240 kg, loaded 160 kg. Shortfall of 80 kg. Departure on hold."
        action={<Btn variant="danger" size="sm" onClick={() => navigate('loader/shortfall')}>Resolve shortfall</Btn>}
        time="03:48 AM"
      />

      {/* Active dock */}
      <div style={{ marginTop: 20 }}>
        <SectionHeader title="Current Dock Activity" subtitle="Active loading runs" action={
          <Btn variant="primary" size="sm" onClick={() => navigate('loader/queue')}>Open loading queue</Btn>
        } />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {TRIPS.map(t => {
            const vehicle = VEHICLES.find(v => v.id === t.vehicle)!;
            const runStatus = t.status === 'On Route' ? 'Departed' : t.status === 'Loading' ? 'Loading' : 'Waiting';
            const statusColor = runStatus === 'Departed' ? C.success : runStatus === 'Loading' ? C.warning : C.text3;

            return (
              <Card
                key={`${t.vehicle}-${t.trip}`}
                hover
                onClick={() => navigate('loader/run-details')}
                style={{ padding: 16 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <Mono color={C.text}>{t.vehicle}</Mono>
                    <span style={{ marginLeft: 8, fontSize: 11, color: C.text3 }}>Trip {t.trip}</span>
                  </div>
                  <Badge color={statusColor} dot>{runStatus}</Badge>
                </div>
                <p style={{ margin: '0 0 4px', fontSize: 12, color: C.text, fontWeight: 500 }}>{t.district}</p>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <BrandBadge brand={t.brand} />
                  {t.reefer && <Badge color={C.reefer}>❄</Badge>}
                </div>
                <CapacityBar label="Weight" used={t.weightKg} max={vehicle.maxWeightKg} unit="kg" />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: C.text3 }}>Departs</span>
                  <Mono color={C.warning}>{t.departure}</Mono>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── L02 — Loading Queue ────────────────────────────────────────────────────
export function LoadingQueue() {
  const { navigate } = useApp();

  const runs = [
    { vehicle: 'VEH031', trip: 1, brand: 'Fresh' as const, district: 'Gampaha', departure: '04:20', orders: 6, loaded: 4, departure_actual: false, status: 'Loading', reefer: true },
    { vehicle: 'VEH014', trip: 1, brand: 'Fresh' as const, district: 'Gampaha / Colombo', departure: '04:10', orders: 3, loaded: 3, departure_actual: true, status: 'Departed', reefer: true },
    { vehicle: 'VEH014', trip: 2, brand: 'Fresh' as const, district: 'Gampaha', departure: '05:30', orders: 2, loaded: 1, departure_actual: false, status: 'Shortfall', reefer: true },
    { vehicle: 'VEH022', trip: 1, brand: 'Style' as const, district: 'Colombo', departure: '09:00', orders: 2, loaded: 0, departure_actual: false, status: 'Waiting', reefer: false },
    { vehicle: 'VEH041', trip: 1, brand: 'Tech' as const, district: 'Colombo', departure: '08:00', orders: 1, loaded: 1, departure_actual: false, status: 'Ready', reefer: false },
  ];

  const statusColor = (s: string) => {
    if (s === 'Loading') return C.warning;
    if (s === 'Ready') return C.success;
    if (s === 'Departed') return C.text2;
    if (s === 'Shortfall') return C.danger;
    return C.text3;
  };

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: C.text }}>Loading Queue</h2>
          <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>All runs for today · Peliyagoda Depot</p>
        </div>
      </div>

      <Card style={{ padding: 0 }}>
        <Table headers={['Vehicle', 'Trip', 'Brand', 'District', 'Departure', 'Orders', 'Progress', 'Status', '']}>
          {runs.map(r => {
            const pct = Math.round((r.loaded / r.orders) * 100);
            return (
              <TableRow
                key={`${r.vehicle}-${r.trip}`}
                onClick={() => navigate(r.status === 'Shortfall' ? 'loader/shortfall' : r.status === 'Ready' ? 'loader/ready' : 'loader/run-details')}
                cells={[
                  <div>
                    <Mono color={C.text}>{r.vehicle}</Mono>
                    {r.reefer && <span style={{ marginLeft: 6, fontSize: 10, color: C.reefer }}>❄</span>}
                  </div>,
                  <span style={{ fontSize: 12, color: C.text2 }}>Trip {r.trip}</span>,
                  <BrandBadge brand={r.brand} />,
                  <span style={{ fontSize: 12, color: C.text }}>{r.district}</span>,
                  <Mono color={r.departure_actual ? C.success : C.warning}>{r.departure}</Mono>,
                  <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>{r.orders}</span>,
                  <div style={{ minWidth: 100 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 10, color: C.text3 }}>{r.loaded}/{r.orders}</span>
                      <span style={{ fontSize: 10, color: pct === 100 ? C.success : C.text3 }}>{pct}%</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? C.success : C.warning, borderRadius: 2 }} />
                    </div>
                  </div>,
                  <Badge color={statusColor(r.status)} dot>{r.status}</Badge>,
                  <Btn variant={r.status === 'Shortfall' ? 'danger' : r.status === 'Departed' ? 'ghost' : 'secondary'} size="sm">
                    {r.status === 'Shortfall' ? 'Resolve' : r.status === 'Departed' ? 'View' : 'Open run'}
                  </Btn>,
                ]}
              />
            );
          })}
        </Table>
      </Card>
    </div>
  );
}

// ─── L03 — Run Details ─────────────────────────────────────────────────────
export function RunDetails() {
  const { navigate } = useApp();

  const runOrders = ORDERS.filter(o => o.vehicle === 'VEH014' && o.trip === 1);

  return (
    <div style={{ padding: 28, maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate('loader/queue')}><ArrowLeft size={14} /> Queue</Btn>
        <ChevronRight size={14} color={C.text3} />
        <span style={{ fontSize: 13, color: C.text }}>VEH014 — Trip 1</span>
      </div>

      {/* Run header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 20 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: C.text }}>VEH014 — Trip 1</h2>
              <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>WP-GA-1847 · Reefer Truck · Kasun Perera</p>
            </div>
            <Badge color={C.reefer}>❄ Reefer active</Badge>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <InfoRow label="District" value="Gampaha / Colombo" />
            <InfoRow label="Brand" value={<BrandBadge brand="Fresh" />} />
            <InfoRow label="Departure" value={<Mono color={C.warning}>04:10 AM</Mono>} />
          </div>
        </Card>

        <Card>
          <SectionHeader title="Capacity" />
          <CapacityBar label="Weight" used={540} max={2400} unit="kg" />
          <CapacityBar label="Volume" used={2.8} max={12} unit="m³" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '7px 10px', background: C.reeferDim, borderRadius: 6, border: `1px solid ${C.reefer}20` }}>
            <span style={{ color: C.reefer, fontSize: 13 }}>❄</span>
            <span style={{ fontSize: 12, color: C.reefer }}>Refrigeration active</span>
          </div>
        </Card>
      </div>

      {/* Orders */}
      <Card style={{ marginBottom: 16 }}>
        <SectionHeader title="Orders" subtitle="Confirm loading for each order" action={
          <Btn variant="primary" size="sm" onClick={() => navigate('loader/checklist')}>Open checklist</Btn>
        } />
        <Table headers={['Order ID', 'Outlet', 'Packages', 'Weight', 'Temp', 'Status']}>
          {runOrders.map(o => (
            <TableRow key={o.id} cells={[
              <Mono color={C.accent}>{o.id}</Mono>,
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: C.text }}>{o.outletName}</p>
                <p style={{ margin: 0, fontSize: 11, color: C.text3 }}>{o.outlet} · {o.window}</p>
              </div>,
              <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>{o.packages}</span>,
              <Mono>{o.weightKg} kg</Mono>,
              <TempBadge temp={o.temp} />,
              <StatusBadge status={o.status} />,
            ]} />
          ))}
        </Table>
      </Card>

      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="primary" onClick={() => navigate('loader/checklist')}>Start loading checklist</Btn>
        <Btn variant="secondary" onClick={() => navigate('loader/queue')}>Back to queue</Btn>
      </div>
    </div>
  );
}

// ─── L04 — Loading Checklist ────────────────────────────────────────────────
export function LoadingChecklist() {
  const { navigate } = useApp();
  const [checked, setChecked] = useState<Record<string, Record<string, boolean>>>({});

  const orders = [
    { id: 'ORD-10483', outlet: 'OUT032', outletName: 'Waypoint Fresh Gampaha', packages: 14, weight: 200, chilled: true },
    { id: 'ORD-10484', outlet: 'OUT041', outletName: 'Waypoint Fresh Colombo 3', packages: 12, weight: 180, chilled: false },
    { id: 'ORD-10527', outlet: 'OUT032', outletName: 'Waypoint Fresh Gampaha', packages: 11, weight: 160, chilled: true },
  ];

  const steps = ['Picked', 'Verified', 'Loaded'];

  const toggle = (orderId: string, step: string) => {
    setChecked(c => ({
      ...c,
      [orderId]: { ...(c[orderId] || {}), [step]: !(c[orderId]?.[step]) },
    }));
  };

  const totalLoaded = orders.reduce((acc, o) =>
    (checked[o.id]?.Loaded ? o.weight : 0) + acc, 0
  );
  const allComplete = orders.every(o => steps.every(s => checked[o.id]?.[s]));

  return (
    <div style={{ padding: 28, maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate('loader/run-details')}><ArrowLeft size={14} /> Run Details</Btn>
        <ChevronRight size={14} color={C.text3} />
        <span style={{ fontSize: 13, color: C.text }}>Loading Checklist — VEH014 Trip 1</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        <div>
          {orders.map(order => {
            const orderChecked = checked[order.id] || {};
            const allStepsDone = steps.every(s => orderChecked[s]);
            return (
              <Card
                key={order.id}
                style={{
                  marginBottom: 14, padding: 18,
                  borderLeft: `3px solid ${allStepsDone ? C.success : C.border}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <Mono color={C.accent}>{order.id}</Mono>
                    <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 500, color: C.text }}>{order.outletName}</p>
                    <p style={{ margin: 0, fontSize: 11, color: C.text3 }}>{order.outlet} · {order.packages} packages · {order.weight} kg</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    {order.chilled && <Badge color={C.reefer}>❄ Chilled</Badge>}
                    {allStepsDone && <Badge color={C.success} dot>Complete</Badge>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {steps.map(step => (
                    <button
                      key={step}
                      onClick={() => toggle(order.id, step)}
                      style={{
                        flex: 1, padding: '10px 8px',
                        background: orderChecked[step] ? C.successDim : C.elevated,
                        border: `1px solid ${orderChecked[step] ? C.success + '50' : C.border}`,
                        borderRadius: 8, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        fontFamily: 'Inter, sans-serif', fontSize: 12,
                        color: orderChecked[step] ? C.success : C.text2,
                        transition: 'all 0.15s',
                      }}
                    >
                      {orderChecked[step]
                        ? <CheckCircle size={13} />
                        : <div style={{ width: 13, height: 13, borderRadius: '50%', border: `1px solid ${C.text3}` }} />}
                      {step}
                    </button>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        <div>
          <Card style={{ marginBottom: 14 }}>
            <SectionHeader title="Load Summary" />
            <CapacityBar label="Weight loaded" used={totalLoaded} max={540} unit="kg" />
            <InfoRow label="Total weight" value="540 kg" mono />
            <InfoRow label="Vehicle max" value="2,400 kg" mono />
            <InfoRow label="Packages" value="37 total" mono />
            <Divider />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: C.reeferDim, borderRadius: 6, border: `1px solid ${C.reefer}20` }}>
              <span style={{ color: C.reefer }}>❄</span>
              <span style={{ fontSize: 12, color: C.reefer }}>Reefer temp: –2°C</span>
            </div>
          </Card>

          <Card>
            <SectionHeader title="Checklist Status" />
            {orders.map(o => {
              const done = steps.every(s => checked[o.id]?.[s]);
              return (
                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
                  <Mono color={C.text3}>{o.id}</Mono>
                  {done
                    ? <CheckCircle size={14} color={C.success} />
                    : <div style={{ width: 14, height: 14, borderRadius: '50%', border: `1px solid ${C.text3}` }} />}
                </div>
              );
            })}
          </Card>

          <div style={{ marginTop: 16 }}>
            {allComplete ? (
              <Btn variant="primary" fullWidth onClick={() => navigate('loader/ready')}>
                <CheckCircle size={14} /> Mark loading complete
              </Btn>
            ) : (
              <Btn variant="danger" fullWidth onClick={() => navigate('loader/shortfall')}>
                Report shortfall
              </Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── L05 — Loading Shortfall ─────────────────────────────────────────────────
export function LoadingShortfall() {
  const { navigate } = useApp();
  const [action, setAction] = useState<'none' | 'reported' | 'hold'>('none');

  return (
    <div style={{ padding: 28, maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate('loader/checklist')}><ArrowLeft size={14} /> Checklist</Btn>
      </div>

      {action === 'reported' ? (
        <Card style={{ textAlign: 'center', padding: '40px 32px', border: `1px solid ${C.success}30` }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.successDim, border: `1px solid ${C.success}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={26} color={C.success} />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: C.text }}>Shortfall reported</h2>
          <p style={{ margin: '0 0 24px', fontSize: 13, color: C.text2 }}>Dispatcher has been notified. Departure for VEH014 Trip 2 is on hold pending resolution.</p>
          <Btn variant="secondary" onClick={() => navigate('loader/queue')}>Return to queue</Btn>
        </Card>
      ) : (
        <>
          {/* Alert */}
          <div style={{
            padding: '20px 24px', background: C.dangerDim,
            border: `1px solid ${C.danger}30`, borderRadius: 14, marginBottom: 24,
            display: 'flex', gap: 16, alignItems: 'flex-start',
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: C.dangerDim, border: `1px solid ${C.danger}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={22} color={C.danger} />
            </div>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: C.danger }}>Loading shortfall detected</h2>
              <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>The quantity loaded for this order does not match the planned quantity. Vehicle cannot depart until this is resolved.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <Card>
              <SectionHeader title="Affected Order" />
              <InfoRow label="Order ID" value={<Mono color={C.danger}>ORD-10489</Mono>} />
              <InfoRow label="Outlet" value="OUT078 — Negombo" />
              <InfoRow label="Brand" value={<BrandBadge brand="Fresh" />} />
              <InfoRow label="Temperature" value={<TempBadge temp="Chilled" />} />
              <InfoRow label="Vehicle" value={<Mono>VEH014 · Trip 2</Mono>} />
            </Card>

            <Card style={{ border: `1px solid ${C.danger}30` }}>
              <SectionHeader title="Shortfall Detail" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[
                  { label: 'Expected', value: '240 kg', color: C.text2 },
                  { label: 'Loaded', value: '160 kg', color: C.warning },
                ].map(m => (
                  <div key={m.label} style={{ padding: '12px 14px', background: C.elevated, borderRadius: 8 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 700, color: m.color, fontFamily: 'JetBrains Mono, monospace' }}>{m.value}</p>
                    <p style={{ margin: 0, fontSize: 11, color: C.text3 }}>{m.label}</p>
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px 12px', background: C.dangerDim, borderRadius: 8, border: `1px solid ${C.danger}20` }}>
                <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: C.danger }}>Shortfall: 80 kg (33%)</p>
                <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>18 packages missing. Chilled goods — time-sensitive.</p>
              </div>
            </Card>
          </div>

          <Card style={{ marginBottom: 20 }}>
            <SectionHeader title="System Note" />
            <div style={{ padding: '12px 14px', background: C.accentDim, borderRadius: 8, border: `1px solid ${C.accent}20`, marginBottom: 12 }}>
              <p style={{ margin: 0, fontSize: 13, color: C.accent }}>
                This shortfall was detected <strong>before departure</strong>. The vehicle has not yet left the depot — the issue can be resolved without a failed delivery.
              </p>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>
              Previous system: shortfalls were discovered on arrival at the outlet. WaypointFlow detects shortfalls at the loading dock.
            </p>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Btn variant="danger" fullWidth onClick={() => setAction('reported')}>
              <AlertTriangle size={14} /> Report shortfall to dispatcher
            </Btn>
            <Btn variant="secondary" fullWidth onClick={() => {}}>
              <Phone size={14} /> Contact dispatcher directly
            </Btn>
            <Btn variant="ghost" fullWidth onClick={() => setAction('hold')}>
              Hold departure — locate missing stock
            </Btn>
          </div>
        </>
      )}
    </div>
  );
}

// ─── L06 — Ready for Departure ────────────────────────────────────────────
export function ReadyForDeparture() {
  const { navigate } = useApp();
  const [confirmed, setConfirmed] = useState(false);

  const checks = [
    { label: 'All orders verified', done: true },
    { label: 'Temperature requirements checked', done: true },
    { label: 'Weight within vehicle capacity', done: true },
    { label: 'Volume within vehicle capacity', done: true },
    { label: 'Loading complete — all items stowed', done: true },
    { label: 'Driver (Kasun Perera) confirmed assigned', done: true },
    { label: 'Route plan released by dispatcher', done: true },
    { label: 'No active shortfall flags', done: false },
  ];

  const allOk = checks.every(c => c.done);

  if (confirmed) {
    return (
      <div style={{ padding: 28, maxWidth: 600, textAlign: 'center' }}>
        <Card style={{ padding: '40px 32px', border: `1px solid ${C.success}30` }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.successDim, border: `1px solid ${C.success}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={26} color={C.success} />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: C.text }}>Departure confirmed</h2>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: C.text2 }}>VEH014 Trip 1 is cleared for departure at 04:10 AM. Driver and dispatcher have been notified.</p>
          <p style={{ margin: '0 0 24px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: C.success }}>DEP-20260930-014-1</p>
          <Btn variant="secondary" fullWidth onClick={() => navigate('loader/queue')}>Return to queue</Btn>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 28, maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate('loader/checklist')}><ArrowLeft size={14} /> Checklist</Btn>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: C.text }}>Run Ready</h2>
        <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>VEH014 · Trip 1 · Departure 04:10 AM</p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <SectionHeader title="Pre-Departure Checklist" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {checks.map(c => (
            <div key={c.label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', background: c.done ? C.successDim : C.dangerDim,
              border: `1px solid ${c.done ? C.success + '25' : C.danger + '25'}`,
              borderRadius: 8,
            }}>
              {c.done
                ? <CheckCircle size={16} color={C.success} />
                : <AlertTriangle size={16} color={C.danger} />}
              <span style={{ fontSize: 13, color: c.done ? C.text : C.danger, fontWeight: c.done ? 400 : 500 }}>{c.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {!allOk && (
        <AlertCard
          type="critical"
          title="Cannot confirm departure"
          desc="1 active shortfall flag (ORD-10489). Resolve the shortfall before confirming departure."
        />
      )}

      <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
        {allOk
          ? <Btn variant="primary" fullWidth size="lg" onClick={() => setConfirmed(true)}>Confirm departure readiness</Btn>
          : <Btn variant="ghost" fullWidth size="lg" onClick={() => navigate('loader/shortfall')}>Resolve shortfall first</Btn>
        }
      </div>
    </div>
  );
}
