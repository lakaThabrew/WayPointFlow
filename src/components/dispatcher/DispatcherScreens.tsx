import { useEffect, useState } from 'react';
import {
  AlertTriangle, Truck, Package, TrendingUp, Clock, CheckCircle,
  XCircle, ChevronRight, ArrowLeft, RefreshCw, MapPin, Filter,
  Thermometer, Zap, BarChart2, ArrowRight, Info, Activity, Navigation,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  C, Card, Badge, StatusBadge, BrandBadge, TempBadge, Btn,
  KpiCard, CapacityBar, AlertCard, Table, TableRow, SectionHeader,
  InfoRow, Timeline, Label, Divider, ConstraintTag, Mono,
  AnimatedNumber, AiBadge, TrendIndicator, Sparkline, Spinner, EmptyState,
} from '../ui';
import {
  ORDERS, VEHICLES, TRIPS, ALERTS, STATS, TODAY_DISPLAY,
} from '../../data/mockData';
import { planningApi, type PlanOrder, type PlanTrip, type PlanResponse, type ConflictItem } from '../../services/planning';
import { STATUS_LABEL, TEMP_LABEL, formatDate } from '../../services/orders';
import type { OrderStatus, TempType } from '../../types';

/** "2026-10-01T03:30:00.000Z" → "03:30" */
function hhmm(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ─── D01 — Dispatcher Overview ───────────────────────────────────────────────
export function DispatcherOverview() {
  const { navigate } = useApp();
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  const [alertsError, setAlertsError] = useState('');

  useEffect(() => {
    const load = () => {
      planningApi.alerts()
        .then(r => { setLiveAlerts(r.alerts); setAlertsError(''); })
        // Without this the panel would render "No active alerts" on a failed
        // fetch — a false all-clear on the dispatcher's safety-critical panel.
        .catch((e) => setAlertsError(e instanceof Error ? e.message : 'Could not load alerts'));
    };
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, []);

  const vehicleStatusGroups = [
    { label: 'Available', count: 4, color: C.success },
    { label: 'Loading', count: 2, color: C.warning },
    { label: 'On Route', count: 5, color: C.accent },
    { label: 'Delayed', count: 1, color: C.danger },
    { label: 'Workshop', count: 1, color: C.offline },
  ];

  return (
    <div className="p-4 md:p-7 max-w-[1400px] mx-auto w-full">
      {/* Hero Header */}
      <div
        className="mb-6 p-5 md:p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start relative overflow-hidden gap-4"
        style={{
          background: 'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(12,18,32,0.6) 60%)',
          border: '1px solid rgba(14,165,233,0.15)',
        }}
      >
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.025em' }}>Today's Operations</h2>
            <AiBadge state="analyzing" />
          </div>
          <p style={{ margin: 0, fontSize: 13, color: C.text3 }}>{TODAY_DISPLAY} · Peliyagoda Depot · Kandy Hub</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fleet Utilization</p>
            <p style={{ margin: '3px 0 0', fontSize: 24, fontWeight: 800, color: C.accent, fontFamily: 'JetBrains Mono, monospace' }}>
              <AnimatedNumber value={Math.round((13/60)*100)} />%
            </p>
          </div>
          <Sparkline data={[62, 58, 71, 68, 73, 78, 82, 78]} color={C.accent} height={36} width={80} />
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 stagger-children">
        <KpiCard label="Orders Received" value={STATS.ordersReceived} sub="today" accent={C.text2} icon={<Package size={20} />} sparkData={[28,30,27,32,29,31,STATS.ordersReceived]} trend="+3.2%" trendUp />
        <KpiCard label="Orders Planned" value={STATS.ordersPlanned} sub={`${STATS.ordersConfirmed} confirmed`} accent={C.accent} icon={<CheckCircle size={20} />} sparkData={[20,22,21,24,23,25,STATS.ordersPlanned]} trend="+8.1%" trendUp />
        <KpiCard label="At-Risk Deliveries" value={STATS.atRiskDeliveries} sub="need attention" accent={C.danger} icon={<AlertTriangle size={20} />} alert={STATS.atRiskDeliveries > 0} sparkData={[1,2,1,0,2,1,STATS.atRiskDeliveries]} trend="-50%" trendUp />
        <KpiCard label="Deferred" value={STATS.ordersDeferred} sub="need rescheduling" accent={C.warning} icon={<XCircle size={20} />} sparkData={[2,1,3,2,1,2,STATS.ordersDeferred]} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        {/* Main content */}
        <div>
          {/* Operations Timeline */}
          <Card style={{ marginBottom: 16, padding: 20 }}>
            <SectionHeader title="Operations Timeline" subtitle="Today's operational phases" />
            <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
              {[
                { phase: 'Planning', time: '00:00–03:30', status: 'done', detail: '31 orders planned' },
                { phase: 'Loading', time: '03:30–04:30', status: 'done', detail: '8 vehicles loaded' },
                { phase: 'Fresh Departure', time: '03:30–05:00', status: 'active', detail: '6 routes active' },
                { phase: 'Fresh Delivery', time: '04:00–08:00', status: 'active', detail: '48 min budget left' },
                { phase: 'Style & Tech', time: '08:00–18:00', status: 'pending', detail: '3 trips pending' },
              ].map((phase, i) => (
                <div key={phase.phase} style={{ flex: 1, minWidth: 140, position: 'relative' }}>
                  {i < 4 && (
                    <div style={{ position: 'absolute', right: 0, top: 16, width: 20, height: 2, background: phase.status === 'done' ? C.success + '60' : C.border, zIndex: 1 }} />
                  )}
                  <div style={{
                    padding: '14px 16px', border: `1px solid ${C.border}`,
                    borderRadius: 10, marginRight: i < 4 ? 16 : 0,
                    background: phase.status === 'active' ? C.accentDim : C.elevated,
                    borderColor: phase.status === 'active' ? C.accent + '40' : C.border,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: phase.status === 'done' ? C.success : phase.status === 'active' ? C.accent : C.text3,
                      }} className={phase.status === 'active' ? 'pulse-dot' : ''} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: phase.status === 'active' ? C.accent : C.text }}>{phase.phase}</span>
                    </div>
                    <p style={{ margin: '0 0 3px', fontSize: 11, color: C.text3, fontFamily: 'JetBrains Mono, monospace' }}>{phase.time}</p>
                    <p style={{ margin: 0, fontSize: 11, color: C.text2 }}>{phase.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Fleet Status */}
          <Card style={{ marginBottom: 16, padding: 20 }}>
            <SectionHeader title="Fleet Status" subtitle="60 vehicles · Peliyagoda + Kandy" action={
              <Btn variant="text" size="sm" onClick={() => navigate('dispatcher/live-ops')}>View live map <ChevronRight size={12} /></Btn>
            } />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
              {vehicleStatusGroups.map(g => (
                <div key={g.label} style={{
                  padding: '12px 14px', background: C.elevated,
                  borderRadius: 8, border: `1px solid ${C.border}`,
                  borderTop: `2px solid ${g.color}`,
                }}>
                  <p style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>{g.count}</p>
                  <p style={{ margin: 0, fontSize: 11, color: g.color }}>{g.label}</p>
                </div>
              ))}
            </div>

            {/* Vehicle cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {VEHICLES.slice(0, 3).map(v => (
                <div
                  key={v.id}
                  onClick={() => navigate('dispatcher/live-ops')}
                  style={{
                    padding: '12px 14px', background: C.surface, borderRadius: 8,
                    border: `1px solid ${C.border}`, cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderMd; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>{v.id}</p>
                      <p style={{ margin: 0, fontSize: 11, color: C.text3 }}>{v.type} · {v.plate}</p>
                    </div>
                    <StatusBadge status={v.status} />
                  </div>
                  <CapacityBar label="Fuel" used={v.fuelUsedL} max={v.weeklyFuelQuotaL} unit="L" color={C.warning} />
                </div>
              ))}
            </div>
          </Card>

          {/* Active Trips */}
          <Card style={{ padding: 20 }}>
            <SectionHeader title="Active Trips" action={
              <Btn variant="ghost" size="sm" onClick={() => navigate('dispatcher/planning')}>Open planning</Btn>
            } />
            <Table headers={['Trip', 'Vehicle', 'Driver', 'District', 'Status', 'Stops', 'ETA', '']}>
              {TRIPS.map(t => (
                <TableRow
                  key={`${t.vehicle}-${t.trip}`}
                  onClick={() => navigate('dispatcher/live-ops')}
                  cells={[
                    <div>
                      <Mono color={C.text}>{t.vehicle}</Mono>
                      <div style={{ fontSize: 11, color: C.text3 }}>Trip {t.trip}</div>
                    </div>,
                    <BrandBadge brand={t.brand} />,
                    <span style={{ fontSize: 12, color: C.text2 }}>{t.driver}</span>,
                    <span style={{ fontSize: 12, color: C.text }}>{t.district}</span>,
                    <StatusBadge status={t.status} />,
                    <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: C.text2 }}>
                      {t.completedStops}/{t.stops.length}
                    </span>,
                    <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: C.accent }}>{t.eta}</span>,
                    <ChevronRight size={14} color={C.text3} />,
                  ]}
                />
              ))}
            </Table>
          </Card>
        </div>

        {/* Alerts panel */}
        <div>
          <Card style={{ padding: 20, marginBottom: 16 }}>
            <SectionHeader title="Active Alerts" subtitle={alertsError ? 'unavailable' : `${liveAlerts.length} unread`} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alertsError ? (
                <AlertCard type="critical" title="Could not load alerts" desc={alertsError} />
              ) : (
                <>
                  {liveAlerts.map(alert => (
                    <AlertCard
                      key={alert.id}
                      title={`Driver Issue: ${alert.outlet.name}`}
                      desc={`Issue reported for order ${alert.orderId}`}
                      type="critical"
                      time={hhmm(alert.arrivedAt)}
                      action={
                        <Btn variant="text" size="sm" onClick={async () => {
                          try {
                            await planningApi.markAlertRead(alert.id);
                            setLiveAlerts(prev => prev.filter(a => a.id !== alert.id));
                          } catch (e) {
                            console.error(e);
                            setAlertsError(e instanceof Error ? e.message : 'Could not dismiss the alert');
                          }
                        }}>Mark read <CheckCircle size={11} /></Btn>
                      }
                    />
                  ))}
                  {liveAlerts.length === 0 && (
                    <EmptyState icon={CheckCircle} title="No active alerts" desc="Everything is running smoothly." />
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Refrigeration capacity */}
          <Card style={{ padding: 20 }}>
            <SectionHeader title="Reefer Capacity" subtitle="Today's allocation" />
            <div style={{
              textAlign: 'center', padding: '16px 0',
              borderBottom: `1px solid ${C.border}`, marginBottom: 14,
            }}>
              <p style={{ margin: '0 0 4px', fontSize: 36, fontWeight: 700, color: C.reefer, fontFamily: 'JetBrains Mono, monospace' }}>
                {STATS.reeferCapacityPct}%
              </p>
              <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>Reefer capacity allocated</p>
            </div>
            <CapacityBar label="Reefer trucks" used={10} max={12} unit="vehicles" color={C.reefer} />
            <CapacityBar label="Reefer vans" used={3} max={4} unit="vehicles" color={C.reefer} />
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: C.dangerDim, borderRadius: 6, border: `1px solid ${C.danger}20` }}>
                <AlertTriangle size={13} color={C.danger} />
                <span style={{ fontSize: 12, color: C.danger }}>No reefer van available — 1 order deferred</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── D02 — Orders ─────────────────────────────────────────────────────────────
export function DispatcherOrders() {
  const { navigate, setSelectedOrder } = useApp();
  const [filterBrand, setFilterBrand] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterTemp, setFilterTemp] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<PlanOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    planningApi.orders()
      .then((r) => setOrders(r.orders))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  const brands = ['All', 'Fresh', 'Style', 'Tech'];
  const statuses = ['All', 'New', 'Confirmed', 'Planned', 'Loading', 'In Transit', 'Delivered', 'Deferred'];
  const temps = ['All', 'Chilled', 'Frozen', 'Ambient'];

  const filtered = orders.filter(o =>
    (filterBrand === 'All' || o.brand === filterBrand) &&
    (filterStatus === 'All' || STATUS_LABEL[o.status] === filterStatus) &&
    (filterTemp === 'All' || TEMP_LABEL[o.temperatureRequirement] === filterTemp) &&
    (search === '' || o.id.includes(search.toUpperCase()) || o.outletName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-7 max-w-[1400px] mx-auto w-full">
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: C.text }}>Orders</h2>
          <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>All brands · {orders.length} orders total</p>
        </div>
        <Btn variant="primary" onClick={() => navigate('dispatcher/planning')}>Open Planning →</Btn>
      </div>

      {/* Filters */}
      <Card style={{ padding: '14px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            placeholder="Search order ID, outlet…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 240, padding: '7px 12px', fontSize: 13 }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            {brands.map(b => (
              <button
                key={b}
                onClick={() => setFilterBrand(b)}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: 'Inter, sans-serif',
                  border: `1px solid ${filterBrand === b ? C.accent : C.border}`,
                  background: filterBrand === b ? C.accentDim : 'transparent',
                  color: filterBrand === b ? C.accent : C.text2, cursor: 'pointer',
                }}
              >{b}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {temps.map(t => (
              <button
                key={t}
                onClick={() => setFilterTemp(t)}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: 'Inter, sans-serif',
                  border: `1px solid ${filterTemp === t ? C.reefer : C.border}`,
                  background: filterTemp === t ? C.reeferDim : 'transparent',
                  color: filterTemp === t ? C.reefer : C.text2, cursor: 'pointer',
                }}
              >{t}</button>
            ))}
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 140, padding: '7px 10px', fontSize: 12 }}>
            {statuses.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </Card>

      {loading && <Card style={{ padding: 40, textAlign: 'center' }}><Spinner size={28} /><p style={{ margin: '12px 0 0', fontSize: 13, color: C.text3 }}>Loading orders…</p></Card>}
      {!loading && error && <AlertCard type="critical" title="Could not load orders" desc={error} />}
      {!loading && !error && (
      <Card style={{ padding: 0 }}>
        <Table headers={['Order ID', 'Outlet', 'Brand', 'District', 'Window', 'Temp', 'Weight', 'Vol', 'Status', 'Vehicle', '']}>
          {filtered.map(o => (
            <TableRow
              key={o.id}
              onClick={() => { setSelectedOrder(o.id); navigate('dispatcher/order-details'); }}
              cells={[
                <Mono color={C.accent}>{o.id}</Mono>,
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: C.text }}>{o.outletName}</p>
                  <p style={{ margin: 0, fontSize: 11, color: C.text3 }}>{o.outletId}</p>
                </div>,
                <BrandBadge brand={o.brand as 'Fresh' | 'Style' | 'Tech'} />,
                <span style={{ fontSize: 12, color: C.text2 }}>{o.district}</span>,
                <Mono>{o.windowOpen}–{o.windowClose}</Mono>,
                <TempBadge temp={TEMP_LABEL[o.temperatureRequirement] as TempType} />,
                <Mono>{o.weightKg} kg</Mono>,
                <Mono>{o.volumeM3} m³</Mono>,
                <StatusBadge status={STATUS_LABEL[o.status] as OrderStatus} />,
                o.vehicleId ? <Mono color={C.text2}>{o.vehicleId}</Mono> : <span style={{ color: C.text3, fontSize: 12 }}>—</span>,
                <ChevronRight size={14} color={C.text3} />,
              ]}
            />
          ))}
        </Table>
        {filtered.length === 0 && (
          <EmptyState icon={Package} title="No orders match" desc="No orders match the selected filters." />
        )}
      </Card>
      )}
    </div>
  );
}

// ─── D03 — Order Details ──────────────────────────────────────────────────────
export function OrderDetails() {
  const { navigate, selectedOrderId } = useApp();
  const order = ORDERS.find(o => o.id === selectedOrderId) || ORDERS[0];

  return (
    <div className="p-4 md:p-7 max-w-[1100px] mx-auto w-full">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate('dispatcher/orders')}>
          <ArrowLeft size={14} /> Orders
        </Btn>
        <ChevronRight size={14} color={C.text3} />
        <Mono color={C.accent}>{order.id}</Mono>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        {/* Left */}
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: C.text }}>{order.id}</h2>
                <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>{order.outletName}</p>
              </div>
              <BrandBadge brand={order.brand} />
            </div>
            <InfoRow label="Outlet ID" value={order.outlet} mono />
            <InfoRow label="District" value={order.district} />
            <InfoRow label="Delivery date" value="30 September 2026" />
            <InfoRow label="Delivery window" value={order.window} mono />
            <InfoRow label="Depot" value={order.depot} />
            <InfoRow label="Temperature requirement" value={<TempBadge temp={order.temp} />} />
            <InfoRow label="Weight" value={`${order.weightKg} kg`} mono />
            <InfoRow label="Volume" value={`${order.volumeM3} m³`} mono />
            <InfoRow label="Packages" value={order.packages} mono />
            {order.vanOnly && <InfoRow label="Vehicle access" value={<Badge color={C.warning}>Van only</Badge>} />}
            {order.mall && <InfoRow label="Parking constraint" value={<Badge color={C.style}>Mall — fixed window</Badge>} />}
          </Card>

          {/* Assignment */}
          <Card>
            <SectionHeader title="Assignment" />
            {order.vehicle ? (
              <>
                <InfoRow label="Assigned vehicle" value={<><Mono color={C.accent}>{order.vehicle}</Mono></>} />
                <InfoRow label="Trip" value={`Trip ${order.trip}`} mono />
                <InfoRow label="Driver" value={order.driver || '—'} />
                <InfoRow label="Planned arrival" value={order.plannedArrival || '—'} mono />
                {order.actualArrival && (
                  <InfoRow label="Actual/ETA" value={order.actualArrival} mono accent />
                )}
                <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                  <Btn variant="primary" onClick={() => navigate('dispatcher/live-ops')}>View in Live Ops</Btn>
                  <Btn variant="secondary" onClick={() => navigate('dispatcher/planning')}>View in Plan</Btn>
                </div>
              </>
            ) : (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: C.text2 }}>
                  {order.status === 'Deferred' ? 'This order was deferred — no feasible vehicle was available.' : 'Not yet assigned to a vehicle.'}
                </p>
                {order.status === 'Deferred' ? (
                  <Btn variant="danger" onClick={() => navigate('dispatcher/deferral')}>View deferral record</Btn>
                ) : (
                  <Btn variant="primary" onClick={() => navigate('dispatcher/planning')}>Open in planning</Btn>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right — Constraint Summary */}
        <div>
          <Card style={{ marginBottom: 16 }}>
            <SectionHeader title="Vehicle Requirements" subtitle="Constraints for this order" />
            <ConstraintTag ok={true} label="Peliyagoda depot" />
            <ConstraintTag ok={order.temp !== 'Ambient'} label={order.temp !== 'Ambient' ? 'Reefer required' : 'No refrigeration required'} />
            <ConstraintTag ok={order.vanOnly === true} label={order.vanOnly ? 'Van access required' : 'Standard truck access'} />
            <ConstraintTag ok={!order.mall} label={order.mall ? 'Mall — fixed time window' : 'Standard dock access'} />
            <Divider />
            {order.vanOnly && order.temp !== 'Ambient' && (
              <div style={{ padding: '10px 12px', background: C.dangerDim, borderRadius: 8, border: `1px solid ${C.danger}20` }}>
                <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: C.danger }}>Constraint conflict</p>
                <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>Requires both reefer capability and van access. Only reefer vans qualify. Current reefer van availability: 0.</p>
              </div>
            )}
          </Card>

          <Card>
            <SectionHeader title="Service History" subtitle={order.outletName} />
            <InfoRow label="Last delivered" value="29 Sep 2026" />
            <InfoRow label="Deferrals (30 days)" value={order.status === 'Deferred' ? '2' : '0'} mono accent={order.status === 'Deferred'} />
            <InfoRow label="Avg delivery time" value="06:24 AM" mono />
            <InfoRow label="On-time rate" value="94%" mono />
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── D04 — Planning Workspace ─────────────────────────────────────────────────
export function PlanningWorkspace() {
  const { navigate, setSelectedOrder } = useApp();
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [queue, setQueue] = useState<PlanOrder[]>([]);
  const [trips, setTrips] = useState<PlanTrip[]>([]);
  const [deferrals, setDeferrals] = useState<PlanResponseDeferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  type PlanResponseDeferral = PlanResponse['deferrals'][number];

  const load = async () => {
    try {
      const [q, p] = await Promise.all([planningApi.queue(), planningApi.plan()]);
      setQueue(q.orders);
      setTrips(p.trips);
      setDeferrals(p.deferrals);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load planning data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const runAllocation = async () => {
    setRunning(true);
    setError('');
    try {
      await planningApi.allocate(); // engine plans the next operating day
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Allocation failed');
    } finally {
      setRunning(false);
    }
  };

  const onTrip = new Set(trips.flatMap((t) => t.stops.map((s) => s.orderId)));
  const unplanned = queue.filter((o) => !onTrip.has(o.id));

  const tripView = trips.map((t) => {
    const weightKg = t.stops.reduce((s, x) => s + x.order.weightKg, 0);
    const volumeM3 = t.stops.reduce((s, x) => s + x.order.volumeM3, 0);
    const lastStop = t.stops[t.stops.length - 1];
    return { trip: t, weightKg, volumeM3, eta: hhmm(lastStop?.plannedArrival) };
  });

  return (
    <div className="p-4 md:p-7">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: C.text }}>Plan Tomorrow's Deliveries</h2>
          <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>Peliyagoda Depot · constraint engine allocation</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="secondary" onClick={() => navigate('dispatcher/constraint-conflict')}>View conflicts</Btn>
          <Btn variant="secondary" loading={running} onClick={runAllocation}>
            <RefreshCw size={14} /> {running ? 'Running…' : 'Run allocation'}
          </Btn>
          <Btn variant="primary" onClick={() => navigate('dispatcher/dispatch-plan')}>Review final plan →</Btn>
        </div>
      </div>

      {error && <div style={{ marginBottom: 16 }}><AlertCard type="critical" title="Planning error" desc={error} /></div>}

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-5">
        {[
          { label: 'Queued orders', value: unplanned.length, color: C.info },
          { label: 'Planned trips', value: trips.length, color: C.accent },
          { label: 'Vehicles used', value: new Set(trips.map(t => t.vehicleId)).size, color: C.success },
          { label: 'Deferred', value: deferrals.length, color: deferrals.length ? C.danger : C.success },
          { label: 'Stops planned', value: trips.reduce((s, t) => s + t.stops.length, 0), color: C.warning },
        ].map(s => (
          <div key={s.label} style={{ padding: '12px 14px', background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <p style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: 11, color: C.text2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-4" style={{ minHeight: 600 }}>
        {/* Order Queue */}
        <div>
          <div style={{ marginBottom: 10 }}>
            <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: C.text }}>Unplanned Orders</p>
            <p style={{ margin: 0, fontSize: 11, color: C.text3 }}>{unplanned.length} orders need assignment</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading && <Card style={{ padding: 16 }}><p style={{ margin: 0, fontSize: 12, color: C.text3 }}>Loading queue…</p></Card>}
            {!loading && unplanned.map(o => (
              <div
                key={o.id}
                onClick={() => { setSelectedOrder(o.id); navigate('dispatcher/order-details'); }}
                style={{
                  padding: '12px 14px', background: C.card,
                  border: `1px solid ${C.border}`, borderRadius: 10, cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderMd; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Mono color={C.accent}>{o.id}</Mono>
                  <BrandBadge brand={o.brand as 'Fresh' | 'Style' | 'Tech'} />
                </div>
                <p style={{ margin: '0 0 3px', fontSize: 12, color: C.text, fontWeight: 500 }}>{o.outletName}</p>
                <p style={{ margin: '0 0 6px', fontSize: 11, color: C.text3 }}>{o.district} · {o.windowOpen}–{o.windowClose}</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <TempBadge temp={TEMP_LABEL[o.temperatureRequirement] as TempType} />
                  <Badge color={C.text3}>{STATUS_LABEL[o.status]}</Badge>
                </div>
              </div>
            ))}
            {/* Deferred — from the allocation run */}
            {deferrals.map(d => (
              <div
                key={d.id}
                onClick={() => { setSelectedOrder(d.order.id); navigate('dispatcher/constraint-conflict'); }}
                style={{
                  padding: '12px 14px', background: C.dangerDim,
                  border: `1px solid ${C.danger}25`, borderRadius: 10, cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Mono color={C.danger}>{d.order.id}</Mono>
                  <BrandBadge brand={d.order.brand as 'Fresh' | 'Style' | 'Tech'} />
                </div>
                <p style={{ margin: '0 0 3px', fontSize: 12, color: C.text, fontWeight: 500 }}>{d.order.outlet.name}</p>
                <p style={{ margin: '0 0 6px', fontSize: 11, color: C.text3 }}>{d.order.district} · {d.order.windowOpen}–{d.order.windowClose}</p>
                <Badge color={C.danger}>{d.source === 'MANUAL' ? 'Manually deferred' : 'No feasible vehicle'}</Badge>
              </div>
            ))}
            {!loading && unplanned.length === 0 && deferrals.length === 0 && (
              <Card style={{ padding: 16 }}>
                <p style={{ margin: 0, fontSize: 12, color: C.text3 }}>Queue empty — run allocation after orders close.</p>
              </Card>
            )}
          </div>
        </div>

        {/* Planning Board */}
        <div>
          <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.text }}>Planned Trips</p>
            <span style={{ fontSize: 11, color: C.text3 }}>Click a trip to inspect constraints</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tripView.map(({ trip: t, weightKg, volumeM3, eta }) => {
              const key = t.id;
              const isSelected = selectedTrip === key;
              const vehicle = t.vehicle;

              return (
                <Card
                  key={key}
                  hover
                  onClick={() => setSelectedTrip(key)}
                  style={{
                    padding: 18,
                    border: `1px solid ${isSelected ? C.accent + '60' : C.border}`,
                    background: isSelected ? C.accentDim : C.card,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <Mono color={C.text}>{t.vehicleId}</Mono>
                      <Badge color={C.text3}>Trip {t.tripNumber}</Badge>
                      {vehicle.temperatureType === 'REEFER' && <Badge color={C.reefer}>❄ Reefer</Badge>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Badge color={C.info}>{t.status}</Badge>
                      <BrandBadge brand={t.brand as 'Fresh' | 'Style' | 'Tech'} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <CapacityBar label="Weight" used={weightKg} max={vehicle.maxWeightKg} unit="kg" />
                      <CapacityBar label="Volume" used={volumeM3} max={vehicle.maxVolumeM3} unit="m³" />
                    </div>
                    <div style={{ fontSize: 12, color: C.text2 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>Departure</span>
                        <Mono>{hhmm(t.plannedDeparture)}</Mono>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>ETA</span>
                        <Mono color={C.accent}>{eta}</Mono>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Stops</span>
                        <span style={{ color: C.text }}>{t.stops.length}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {t.stops.map(s => (
                      <div key={s.id} style={{
                        padding: '4px 10px', background: C.elevated, borderRadius: 6,
                        border: `1px solid ${C.border}`, fontSize: 11, color: C.text2,
                      }}>
                        <Mono color={C.text}>{s.orderId}</Mono>
                        <span style={{ marginLeft: 6 }}>{s.outletId}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
            {!loading && trips.length === 0 && (
              <Card style={{ padding: 28, textAlign: 'center' }}>
                <p style={{ margin: '0 0 6px', fontSize: 13, color: C.text2 }}>No trips planned yet</p>
                <p style={{ margin: 0, fontSize: 12, color: C.text3 }}>Run the allocation to generate tomorrow's trips from the confirmed queue.</p>
              </Card>
            )}
          </div>
        </div>

        {/* Constraint Inspector */}
        <div>
          <div style={{ marginBottom: 10 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.text }}>Constraint Inspector</p>
          </div>
          {selectedTrip ? (() => {
            const found = tripView.find(({ trip }) => trip.id === selectedTrip);
            if (!found) return null;
            const { trip, weightKg, volumeM3, eta } = found;
            const vehicle = trip.vehicle;
            const fuelL = 0; // daily fuel usage accrues as trips run — planned trip starts at 0

            return (
              <Card style={{ padding: 18 }}>
                <div style={{ marginBottom: 14 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: C.text }}>{vehicle.id}</p>
                  <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>{vehicle.type} · {vehicle.registrationNo}</p>
                </div>
                <CapacityBar label="Weight" used={weightKg} max={vehicle.maxWeightKg} unit="kg" />
                <CapacityBar label="Volume" used={volumeM3} max={vehicle.maxVolumeM3} unit="m³" />
                <CapacityBar label="Weekly fuel" used={fuelL} max={vehicle.weeklyFuelQuotaL} unit="L" color={C.warning} />

                <Divider />

                <div style={{ marginBottom: 12 }}>
                  <Label>Constraints</Label>
                </div>
                <ConstraintTag ok={vehicle.temperatureType === 'REEFER'} label={vehicle.temperatureType === 'REEFER' ? 'Reefer-capable' : 'Ambient only'} />
                <ConstraintTag ok={vehicle.type === 'VAN'} label={vehicle.type === 'VAN' ? 'Van access' : 'Truck — standard docks only'} />
                <ConstraintTag ok={true} label={`District: ${trip.district}`} />
                <ConstraintTag ok={true} label={`Brand: ${trip.brand} (single-brand trip)`} />

                <Divider />
                <div style={{ marginBottom: 10 }}>
                  <Label>Trip timing</Label>
                </div>
                <InfoRow label="Departure" value={hhmm(trip.plannedDeparture)} mono />
                <InfoRow label="ETA (last stop)" value={eta} mono />
                {trip.brand === 'Fresh' && (
                  <div style={{ marginTop: 10, padding: '8px 10px', background: C.accentDim, borderRadius: 6, fontSize: 11, color: C.accent, border: `1px solid ${C.accent}20` }}>
                    Fresh budget: 270 min/vehicle/day · within window
                  </div>
                )}

                <Divider />
                <Btn variant="danger" size="sm" fullWidth onClick={() => navigate('dispatcher/constraint-conflict')}>
                  Check for conflicts
                </Btn>
              </Card>
            );
          })() : (
            <Card style={{ padding: 20, textAlign: 'center', color: C.text3 }}>
              <Info size={28} style={{ marginBottom: 10, opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: 12 }}>Select a trip to inspect its constraints and capacity</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── D05 — Constraint Conflict ────────────────────────────────────────────────
export function ConstraintConflict() {
  const { navigate, selectedOrderId } = useApp();
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    planningApi.conflicts()
      .then((r) => setConflicts(r.conflicts))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load conflicts'))
      .finally(() => setLoading(false));
  }, []);

  const conflict = conflicts.find((c) => c.order.id === selectedOrderId) ?? conflicts[0] ?? null;

  if (loading) {
    return <div className="p-4 md:p-7"><Card style={{ padding: 20 }}><p style={{ margin: 0, fontSize: 13, color: C.text3 }}>Loading conflicts…</p></Card></div>;
  }

  if (error || !conflict) {
    return (
      <div className="p-4 md:p-7 max-w-[800px] mx-auto w-full">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Btn variant="ghost" size="sm" onClick={() => navigate('dispatcher/planning')}><ArrowLeft size={14} /> Back to Planning</Btn>
        </div>
        <Card style={{ padding: 28, textAlign: 'center' }}>
          <CheckCircle size={28} color={C.success} style={{ marginBottom: 10 }} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.text }}>No conflicts</p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: C.text3 }}>{error || 'Every order in the queue has a feasible vehicle.'}</p>
        </Card>
      </div>
    );
  }

  const o = conflict.order;
  const allFail = conflict.vehicleAssessment.every((v) => v.failedRule !== 'Feasible');

  return (
    <div className="p-4 md:p-7 max-w-[800px] mx-auto w-full">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate('dispatcher/planning')}><ArrowLeft size={14} /> Back to Planning</Btn>
      </div>

      {/* Alert header */}
      <div style={{
        padding: '20px 24px', background: C.dangerDim,
        border: `1px solid ${C.danger}30`, borderRadius: 14,
        marginBottom: 24, display: 'flex', gap: 16,
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: C.dangerDim, border: `1px solid ${C.danger}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <AlertTriangle size={22} color={C.danger} />
        </div>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: C.danger }}>
            {allFail ? 'No feasible vehicle available' : 'Deferred order'}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>
            Order {o.id} cannot be assigned to any available vehicle. All constraints must be satisfied for a valid assignment.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {/* Order */}
        <Card>
          <SectionHeader title="Affected Order" />
          <InfoRow label="Order ID" value={<Mono color={C.danger}>{o.id}</Mono>} />
          <InfoRow label="Outlet" value={`${o.outletId} — ${o.outlet.name}`} />
          <InfoRow label="Brand" value={<BrandBadge brand={o.brand as 'Fresh' | 'Style' | 'Tech'} />} />
          <InfoRow label="Window" value={`${o.windowOpen}–${o.windowClose}`} mono />
          <InfoRow label="Temperature" value={<TempBadge temp={TEMP_LABEL[o.temperatureRequirement] as TempType} />} />
          <InfoRow label="Weight" value={`${o.weightKg} kg`} mono />
          {o.outlet.parkingConstraint === 'VAN_ONLY' && (
            <InfoRow label="Vehicle access" value={<Badge color={C.warning}>Van only (narrow street)</Badge>} />
          )}
        </Card>

        {/* Requirements / explanation */}
        <Card>
          <SectionHeader title="Why it cannot be served" subtitle="Recorded deferral reason" />
          <div style={{ padding: '10px 12px', background: C.dangerDim, borderRadius: 8, border: `1px solid ${C.danger}20`, marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 12, color: C.danger, fontWeight: 500 }}>
              {conflict.latestDeferral?.reason ?? 'No feasible vehicle'}
            </p>
          </div>
          <InfoRow label="Deferred" value={conflict.latestDeferral ? formatDate(conflict.latestDeferral.decidedAt) : '—'} mono />
          <InfoRow label="Source" value={<Badge color={C.text3}>{conflict.latestDeferral?.source === 'MANUAL' ? 'Dispatcher decision' : 'Allocator (auto)'}</Badge>} />
        </Card>
      </div>

      {/* Why each vehicle fails — live recompute from the engine */}
      <Card style={{ marginBottom: 20 }}>
        <SectionHeader title="Vehicle Assessment" subtitle="Recomputed live against the current fleet" />
        <Table headers={['Vehicle', 'Result']}>
          {conflict.vehicleAssessment.map(v => (
            <TableRow key={v.vehicleId} cells={[
              <Mono color={C.text}>{v.vehicleId}</Mono>,
              v.failedRule === 'Feasible'
                ? <Badge color={C.success}>Feasible</Badge>
                : <Badge color={C.danger}>{v.failedRule}</Badge>,
            ]} />
          ))}
        </Table>
      </Card>

      {/* Options */}
      <Card>
        <SectionHeader title="Resolution Options" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {[
            { num: 1, title: 'Reassign VEH031 (Reefer Van)', desc: 'Extend daily budget by completing an earlier stop faster. Risk: tight window.', color: C.warning, action: () => navigate('dispatcher/planning') },
            { num: 2, title: 'Re-plan VEH014 Trip 1', desc: 'Swap OUT047 for a truck-accessible fresh outlet and free a reefer van run. Risk: replanning required.', color: C.info, action: () => navigate('dispatcher/planning') },
            { num: 3, title: 'Defer to next available run', desc: 'Defer ORD-10482 and record reason. OUT047 will not receive today\'s delivery.', color: C.danger, action: () => navigate('dispatcher/deferral') },
          ].map(opt => (
            <div key={opt.num} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '14px 16px', background: C.elevated,
              border: `1px solid ${C.border}`, borderRadius: 10,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: opt.color + '20', border: `1px solid ${opt.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: opt.color, fontSize: 13, fontWeight: 700, flexShrink: 0,
              }}>{opt.num}</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 600, color: C.text }}>{opt.title}</p>
                <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>{opt.desc}</p>
              </div>
              <Btn variant={opt.num === 3 ? 'danger' : 'secondary'} size="sm" onClick={opt.action}>
                {opt.num === 3 ? 'Review deferral' : 'Try this'}
              </Btn>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="danger" onClick={() => navigate('dispatcher/deferral')}>Review deferral</Btn>
          <Btn variant="secondary" onClick={() => navigate('dispatcher/planning')}>Re-plan</Btn>
        </div>
      </Card>
    </div>
  );
}

// ─── D06 — Deferral Decision ──────────────────────────────────────────────────
export function DeferralDecision() {
  const { navigate, selectedOrderId } = useApp();
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [deferralId, setDeferralId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reasons = [
    'Reefer capacity exhausted',
    'Van-only access — no reefer van available',
    'Fresh time budget insufficient',
    'Vehicle access conflict',
    'Fuel quota constraint',
    'Order placed after cutoff',
    'Other',
  ];

  const confirmDeferral = async () => {
    if (!selectedOrderId) return;
    setSubmitting(true);
    setError('');
    try {
      const fullReason = notes.trim() ? `${reason} — ${notes.trim()}` : reason;
      const res = await planningApi.defer(selectedOrderId, fullReason);
      setDeferralId(res.deferral.id);
      setConfirmed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to record deferral');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <div className="p-4 md:p-7 max-w-[600px] mx-auto w-full">
        <div style={{
          textAlign: 'center', padding: '40px 32px',
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: C.successDim, border: `1px solid ${C.success}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <CheckCircle size={26} color={C.success} />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: C.text }}>Deferral recorded</h2>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: C.text2 }}>{selectedOrderId ?? 'The order'} has been deferred. The record has been saved and the store manager will be notified.</p>
          <div style={{ padding: '12px 16px', background: C.elevated, borderRadius: 8, marginBottom: 24, textAlign: 'left' }}>
            <InfoRow label="Reason" value={reason} />
            <InfoRow label="Next run" value="Next operating day (re-enters planning automatically)" mono />
            <InfoRow label="Deferral ID" value={deferralId || '—'} mono />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Btn variant="primary" onClick={() => navigate('dispatcher/planning')}>Return to planning</Btn>
            <Btn variant="secondary" onClick={() => navigate('dispatcher/dispatch-plan')}>Review dispatch plan</Btn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-7 max-w-[800px] mx-auto w-full">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate('dispatcher/constraint-conflict')}><ArrowLeft size={14} /> Back to conflict</Btn>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: C.text }}>Defer order?</h2>
        <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>This decision will be recorded. The store manager will be notified of the deferral.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {/* Order summary */}
        <Card>
          <SectionHeader title="Order Being Deferred" />
          <InfoRow label="Order" value={<Mono color={C.danger}>{selectedOrderId ?? '—'}</Mono>} />
          <Divider />
          <div style={{ padding: '10px 12px', background: C.dangerDim, borderRadius: 8, border: `1px solid ${C.danger}20` }}>
            <p style={{ margin: 0, fontSize: 12, color: C.danger, fontWeight: 500 }}>This order will be removed from the current plan and recorded as deferred. It re-enters planning automatically on the next run.</p>
          </div>
        </Card>

        {/* Impact */}
        <Card>
          <SectionHeader title="Impact Assessment" />
          <InfoRow label="Next available run" value="01 Oct 2026" accent />
          <InfoRow label="Estimated delay" value="~24 hours" mono />
          <InfoRow label="Store opens" value="08:00 AM" mono />
          <InfoRow label="Outlet service history" value="Last deferred: 18 Sep" />
          <InfoRow label="Deferrals this month" value="1 previous" />
          <Divider />
          <div style={{ padding: '10px 12px', background: C.warningDim, borderRadius: 8, border: `1px solid ${C.warning}20` }}>
            <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 600, color: C.warning }}>Store impact</p>
            <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>OUT047 will open without today's chilled stock. Chilled category replenishment will be delayed 24 hours.</p>
          </div>
        </Card>
      </div>

      {/* Reason */}
      <Card style={{ marginBottom: 20 }}>
        <SectionHeader title="Deferral Reason" subtitle="Required — select the primary reason" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3.5">
          {reasons.map(r => (
            <button
              key={r}
              onClick={() => setReason(r)}
              style={{
                padding: '10px 12px', background: reason === r ? C.accentDim : C.elevated,
                border: `1px solid ${reason === r ? C.accent : C.border}`,
                borderRadius: 8, fontSize: 12, color: reason === r ? C.accent : C.text2,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              {r}
            </button>
          ))}
        </div>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: C.text2 }}>Additional notes (optional)</label>
        <textarea
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add context for this deferral…"
          style={{ resize: 'vertical' }}
        />
      </Card>

      <div style={{ display: 'flex', gap: 12 }}>
        <Btn
          variant="danger"
          size="lg"
          disabled={!reason || !selectedOrderId}
          loading={submitting}
          onClick={confirmDeferral}
        >
          {submitting ? 'Recording…' : 'Confirm deferral'}
        </Btn>
        <Btn variant="secondary" size="lg" onClick={() => navigate('dispatcher/planning')}>
          Return to plan
        </Btn>
      </div>
      {error && <p style={{ margin: '10px 0 0', fontSize: 12, color: C.danger }}>{error}</p>}
      {!reason && (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: C.text3 }}>A deferral reason must be selected before confirming.</p>
      )}
    </div>
  );
}

// ─── D07 — Final Dispatch Plan ────────────────────────────────────────────────
export function DispatchPlan() {
  const { navigate } = useApp();
  const [released, setReleased] = useState(false);
  const [trips, setTrips] = useState<PlanTrip[]>([]);
  const [deferrals, setDeferrals] = useState<PlanResponse['deferrals']>([]);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    planningApi.plan()
      .then((p) => { setTrips(p.trips); setDeferrals(p.deferrals); })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load plan'))
      .finally(() => setLoading(false));
  }, []);

  const planned = trips.filter((t) => t.status === 'PLANNED');
  const servedOrders = trips.reduce((s, t) => s + t.stops.length, 0);
  const vehiclesUsed = new Set(trips.map((t) => t.vehicleId)).size;

  const releaseAll = async () => {
    setReleasing(true);
    setError('');
    try {
      for (const t of planned) {
        await planningApi.releaseTrip(t.id);
      }
      setReleased(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Release failed');
    } finally {
      setReleasing(false);
    }
  };

  if (released) {
    return (
      <div className="p-4 md:p-7 max-w-[600px] mx-auto w-full" style={{ textAlign: 'center' }}>
        <div style={{ padding: '40px 32px', background: C.card, border: `1px solid ${C.success}30`, borderRadius: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.successDim, border: `1px solid ${C.success}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={26} color={C.success} />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: C.text }}>Plan released</h2>
          <p style={{ margin: '0 0 24px', fontSize: 13, color: C.text2 }}>Loaders and drivers have been notified. Loading can begin immediately.</p>
          <Btn variant="primary" fullWidth onClick={() => navigate('dispatcher/live-ops')}>Go to Live Operations →</Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-7 max-w-[1100px] mx-auto w-full">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: C.text }}>Plan Ready</h2>
        <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>Peliyagoda · Review before releasing to loaders and drivers</p>
      </div>

      {error && <div style={{ marginBottom: 16 }}><AlertCard type="critical" title="Plan error" desc={error} /></div>}

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-6">
        {[
          { label: 'Orders served', value: String(servedOrders), color: C.success },
          { label: 'Orders deferred', value: String(deferrals.length), color: deferrals.length ? C.danger : C.success },
          { label: 'Trips planned', value: String(trips.length), color: C.accent },
          { label: 'Vehicles assigned', value: String(vehiclesUsed), color: C.info },
        ].map(s => (
          <div key={s.label} style={{ padding: '14px 18px', background: C.card, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <p style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Trip list */}
      <Card style={{ marginBottom: 20 }}>
        <SectionHeader title="Planned Trips" subtitle="All trips require loader confirmation before departure" />
        {loading ? (
          <p style={{ padding: 20, margin: 0, fontSize: 13, color: C.text3 }}>Loading plan…</p>
        ) : (
          <Table headers={['Trip', 'Vehicle', 'Brand', 'District', 'Stops', 'Departure', 'ETA', 'Type', 'Status']}>
            {trips.map(t => {
              const lastStop = t.stops[t.stops.length - 1];
              return (
                <TableRow key={t.id} cells={[
                  <Mono color={C.text3}>{t.id}</Mono>,
                  <Mono color={C.text}>{t.vehicleId}</Mono>,
                  <BrandBadge brand={t.brand as 'Fresh' | 'Style' | 'Tech'} />,
                  <span style={{ fontSize: 12, color: C.text2 }}>{t.district}</span>,
                  <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>{t.stops.length}</span>,
                  <Mono color={C.warning}>{hhmm(t.plannedDeparture)}</Mono>,
                  <Mono color={C.accent}>{hhmm(lastStop?.plannedArrival)}</Mono>,
                  t.vehicle.temperatureType === 'REEFER' ? <Badge color={C.reefer}>❄ Reefer</Badge> : <Badge color={C.text3}>Ambient</Badge>,
                  <Badge color={t.status === 'PLANNED' ? C.info : C.success}>{t.status}</Badge>,
                ]} />
              );
            })}
          </Table>
        )}
        {!loading && trips.length === 0 && (
          <div style={{ padding: '28px 0', textAlign: 'center', color: C.text3, fontSize: 13 }}>
            No trips planned — run the allocation from the Planning Workspace first.
          </div>
        )}
      </Card>

      {/* Exceptions note */}
      {deferrals.length > 0 && (
        <div style={{ padding: '14px 18px', background: C.warningDim, border: `1px solid ${C.warning}25`, borderRadius: 10, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertTriangle size={15} color={C.warning} style={{ marginTop: 1 }} />
            <div>
              <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 600, color: C.warning }}>{deferrals.length} order{deferrals.length > 1 ? 's' : ''} deferred</p>
              <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>
                {deferrals.map((d) => `${d.order.id} (${d.order.outletId})`).join(', ')} — reasons recorded. Store managers will be notified.
              </p>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <Btn variant="primary" size="lg" loading={releasing} disabled={planned.length === 0} onClick={releaseAll}>
          <Zap size={15} /> {releasing ? 'Releasing…' : `Release plan (${planned.length} trips)`}
        </Btn>
        <Btn variant="secondary" size="lg" onClick={() => navigate('dispatcher/planning')}>
          Back to planning
        </Btn>
      </div>
    </div>
  );
}

// ─── D08 — Live Operations ────────────────────────────────────────────────────
export function LiveOperations() {
  const { navigate } = useApp();
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = (initial: boolean) => {
      planningApi.liveOps()
        .then(r => {
          setTrips(r.trips);
          setError('');
          setSelectedVehicle(prev => {
            if (r.trips.length === 0) return null;
            if (prev && r.trips.some((t: any) => t.vehicle.registrationNo === prev)) return prev;
            return r.trips[0].vehicle.registrationNo;
          });
        })
        .catch((e) => {
          console.error(e);
          if (initial) setError(e instanceof Error ? e.message : 'Could not load live operations');
        })
        .finally(() => { if (initial) setLoading(false); });
    };

    load(true);
    const timer = setInterval(() => load(false), 5000);
    return () => clearInterval(timer);
  }, []);

  const trip = trips.find(t => t.vehicle.registrationNo === selectedVehicle);
  const vehicle = trip?.vehicle;
  const currentStop = trip?.stops?.find((s: any) => s.status === 'PENDING' || s.status === 'ARRIVED');

  if (loading) {
    return <div className="flex items-center justify-center" style={{ height: '100%' }}><Spinner size={32} /></div>;
  }

  if (error) {
    return (
      <div className="p-4 md:p-7 max-w-[900px] mx-auto w-full">
        <AlertCard type="critical" title="Could not load live operations" desc={error} />
        <Btn variant="primary" style={{ marginTop: 16 }} onClick={() => window.location.reload()}>
          <RefreshCw size={14} /> Retry
        </Btn>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="p-4 md:p-7 max-w-[900px] mx-auto w-full">
        <EmptyState
          icon={Truck}
          title="No trips in progress"
          desc="Trips appear here once a loader marks them ready for departure."
          action={<Btn variant="primary" onClick={() => navigate('dispatcher/planning')}>Open planning</Btn>}
        />
      </div>
    );
  }

  return (
    // Stacks on tablet/mobile: the map keeps a usable height and the vehicle
    // panel drops underneath instead of squeezing the map into a sliver.
    <div className="flex flex-col lg:flex-row" style={{ height: '100%', minHeight: 480 }}>
      {/* Map area */}
      <div style={{ flex: 1, minHeight: 320, position: 'relative', background: C.elevated, overflow: 'hidden' }}>
        {/* Simulated map */}
        <div style={{ position: 'absolute', inset: 0 }} className="wp-grid-lines" />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 40%, rgba(56,189,248,0.05) 0%, transparent 60%)' }} />

        {/* Title overlay */}
        <div style={{
          position: 'absolute', top: 20, left: 20,
          padding: '10px 16px', background: `${C.surface}e0`, backdropFilter: 'blur(8px)',
          border: `1px solid ${C.border}`, borderRadius: 10,
        }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>Live Operations</p>
          <p style={{ margin: 0, fontSize: 11, color: C.text2 }}>30 Sep 2026 · 06:42 AM</p>
        </div>

        {/* Route visualization */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {/* Completed route */}
          <path d="M 200 400 Q 280 350 320 280 Q 360 220 420 180" stroke={C.success} strokeWidth="2" fill="none" strokeDasharray="0" opacity="0.6" />
          {/* Active route */}
          <path d="M 420 180 Q 480 160 520 200 Q 560 230 580 300" stroke={C.accent} strokeWidth="2" fill="none" strokeDasharray="6 4" opacity="0.8" />

          {/* Depot */}
          <circle cx="200" cy="400" r="12" fill={C.success} opacity="0.3" />
          <circle cx="200" cy="400" r="6" fill={C.success} />
          <text x="216" y="405" fill={C.text} fontSize="11" fontFamily="Inter">Peliyagoda Depot</text>

          {/* Completed stop */}
          <circle cx="420" cy="180" r="10" fill={C.success} opacity="0.3" />
          <circle cx="420" cy="180" r="5" fill={C.success} />
          <text x="434" y="185" fill={C.text} fontSize="11" fontFamily="Inter">OUT041 ✓</text>

          {/* Active vehicle */}
          <circle cx="500" cy="230" r="14" fill={C.accent} opacity="0.2" />
          <circle cx="500" cy="230" r="7" fill={C.accent} className="pulse-dot" />
          <text x="518" y="235" fill={C.accent} fontSize="11" fontFamily="Inter" fontWeight="600">VEH014</text>

          {/* Next stop */}
          <circle cx="580" cy="300" r="10" fill={C.warning} opacity="0.3" />
          <circle cx="580" cy="300" r="5" fill={C.warning} />
          <text x="594" y="305" fill={C.warning} fontSize="11" fontFamily="Inter">OUT032</text>
        </svg>

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 20, left: 20,
          padding: '12px 16px', background: `${C.surface}e0`, backdropFilter: 'blur(8px)',
          border: `1px solid ${C.border}`, borderRadius: 10,
          display: 'flex', gap: 16,
        }}>
          {[
            { color: C.success, label: 'Delivered' },
            { color: C.accent, label: 'Active' },
            { color: C.warning, label: 'Next stop' },
            { color: C.danger, label: 'At risk' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
              <span style={{ fontSize: 11, color: C.text2 }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Vehicle chips */}
        <div style={{
          position: 'absolute', top: 20, right: 20,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {trips.map(t => (
            <button
              key={t.vehicle.registrationNo}
              onClick={() => setSelectedVehicle(t.vehicle.registrationNo)}
              style={{
                padding: '6px 12px', background: selectedVehicle === t.vehicle.registrationNo ? C.accentDim : `${C.surface}e0`,
                border: `1px solid ${selectedVehicle === t.vehicle.registrationNo ? C.accent : C.border}`,
                borderRadius: 8, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.status === 'COMPLETED' ? C.success : C.accent }} className={t.status === 'IN_TRANSIT' ? 'pulse-dot' : ''} />
              <span style={{ fontSize: 12, color: selectedVehicle === t.vehicle.registrationNo ? C.accent : C.text, fontFamily: 'Inter, sans-serif' }}>{t.vehicle.registrationNo}</span>
              <StatusBadge status={t.status} />
            </button>
          ))}
        </div>
      </div>

      {/* Vehicle panel */}
      <div className="w-full lg:w-[300px] shrink-0" style={{ background: C.surface, borderLeft: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        <div style={{ padding: 20, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Mono color={C.text}>{vehicle?.registrationNo || 'No vehicle'}</Mono>
            {trip && <StatusBadge status={trip.status} />}
          </div>
          <p style={{ margin: '0 0 4px', fontSize: 12, color: C.text2 }}>Driver: <strong style={{ color: C.text }}>Assigned Driver</strong></p>
          <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>{trip ? `Trip ${trip.tripNumber} · ${trip.district}` : 'Select a trip'}</p>
        </div>

        <div style={{ padding: 20, borderBottom: `1px solid ${C.border}` }}>
          <SectionHeader title="Current Stop" />
          {currentStop ? (
            <>
              <div style={{
                padding: '12px 14px', background: C.accentDim, border: `1px solid ${C.accent}30`,
                borderRadius: 10, marginBottom: 12,
              }}>
                <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: C.accent }}>{currentStop.outlet.name}</p>
                <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>{currentStop.orderId}</p>
              </div>
              <InfoRow label="Planned arrival" value={hhmm(currentStop.plannedArrival)} mono />
              <InfoRow
                label={currentStop.status === 'ARRIVED' ? 'Actual arrival' : 'Estimated arrival'}
                value={currentStop.status === 'ARRIVED' ? hhmm(currentStop.actualArrival) : hhmm(currentStop.plannedArrival)}
                mono
                accent={currentStop.status === 'ARRIVED' ? undefined : true}
              />
              <InfoRow label="Window closes" value={currentStop.order.windowClose} mono />
            </>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: C.text3 }}>{trip?.status === 'COMPLETED' ? 'All stops completed.' : 'No current stop'}</p>
          )}
        </div>

        <div style={{ padding: 20 }}>
          <SectionHeader title="Route Progress" />
          <Timeline steps={
            trip ? [
              { label: 'Departed Depot', time: hhmm(trip.plannedDeparture), status: trip.status === 'READY' ? 'pending' : 'done', note: trip.vehicle.registrationNo },
              ...(trip.stops || []).map((s: any) => ({
                label: s.outlet.name,
                time: s.status === 'COMPLETED' ? hhmm(s.leftAt || s.actualArrival) : 'ETA ' + hhmm(s.plannedArrival),
                status: s.status === 'COMPLETED' ? 'done' : s.status === 'ARRIVED' ? 'active' : 'pending',
                note: s.status === 'COMPLETED' ? 'Delivered' : s.orderId
              }))
            ] : []
          } />
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          <Btn variant="danger" fullWidth onClick={() => navigate('dispatcher/exception')}>
            <AlertTriangle size={13} /> Delivery at risk
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── D09 — Delivery Exception ─────────────────────────────────────────────────
export function DeliveryException() {
  const { navigate } = useApp();

  return (
    <div className="p-4 md:p-7 max-w-[800px] mx-auto w-full">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate('dispatcher/live-ops')}><ArrowLeft size={14} /> Live Operations</Btn>
        <ChevronRight size={14} color={C.text3} />
        <span style={{ fontSize: 13, color: C.text2 }}>Exception — OUT032</span>
      </div>

      <div style={{
        padding: '18px 22px', background: C.dangerDim,
        border: `1px solid ${C.danger}30`, borderRadius: 14, marginBottom: 24,
        display: 'flex', gap: 14, alignItems: 'flex-start',
      }}>
        <AlertTriangle size={22} color={C.danger} style={{ marginTop: 2 }} />
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: C.danger }}>Delivery at risk</h2>
          <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>VEH014 is 22 minutes behind schedule. Delivery to OUT032 may miss the 07:30 window if delayed further.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <Card>
          <SectionHeader title="Situation" />
          <InfoRow label="Vehicle" value={<Mono color={C.text}>VEH014</Mono>} />
          <InfoRow label="Driver" value="Kasun Perera" />
          <InfoRow label="Outlet" value="OUT032 — Waypoint Fresh Gampaha" />
          <InfoRow label="Original window" value="05:00–07:30" mono />
          <InfoRow label="Current ETA" value="06:42" mono />
          <InfoRow label="Window closes" value="07:30" mono />
          <InfoRow label="Time remaining" value={<Badge color={C.warning}>48 minutes</Badge>} />
        </Card>
        <Card>
          <SectionHeader title="Context" />
          <InfoRow label="Issue reported" value="No — ETA drift detected" />
          <InfoRow label="Previous stop" value="OUT041 — completed 05:58" />
          <InfoRow label="Next stop" value="OUT032 (current)" />
          <InfoRow label="Remaining stops" value="1 after OUT032" />
          <InfoRow label="Fresh budget remaining" value="48 min" mono accent />
        </Card>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <SectionHeader title="Recommended Actions" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { icon: '📞', title: 'Contact driver', desc: 'Call Kasun Perera to confirm ETA and any unreported delays.', variant: 'primary' as const, action: () => {} },
            { icon: '↕', title: 'Re-sequence remaining stops', desc: 'If OUT032 window is still achievable, confirm routing. Otherwise assess impact on OUT078.', variant: 'secondary' as const, action: () => navigate('dispatcher/planning') },
            { icon: '⚠', title: 'Escalate to depot manager', desc: 'Flag for supervisor visibility if window cannot be met.', variant: 'ghost' as const, action: () => {} },
            { icon: '📋', title: 'Mark as exception', desc: 'Log this as a delivery delay. No further action — monitoring only.', variant: 'ghost' as const, action: () => {} },
          ].map(action => (
            <div key={action.title} style={{
              display: 'flex', gap: 14, alignItems: 'center',
              padding: '12px 16px', background: C.elevated, borderRadius: 10,
              border: `1px solid ${C.border}`,
            }}>
              <span style={{ fontSize: 20 }}>{action.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: C.text }}>{action.title}</p>
                <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>{action.desc}</p>
              </div>
              <Btn variant={action.variant} size="sm" onClick={action.action}>{action.title === 'Contact driver' ? 'Call' : 'Action'}</Btn>
            </div>
          ))}
        </div>
      </Card>

      <Btn variant="secondary" onClick={() => navigate('dispatcher/live-ops')}>
        <ArrowLeft size={13} /> Back to live operations
      </Btn>
    </div>
  );
}

// ─── D10 — Forecast ───────────────────────────────────────────────────────────
export function Forecast() {
  return (
    <div className="p-4 md:p-7">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: C.text }}>Upcoming Demand</h2>
        <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>Capacity planning intelligence · Peliyagoda + Kandy</p>
      </div>

      {/* Forecast cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
        {[
          {
            period: 'Next Week', dates: '5–11 Oct 2026',
            volume: 2840, chilledVol: 1240, vehicles: 8, reefer: 3,
            peak: 'Tuesday', gap: 0, risk: 'low',
            note: 'Normal operating week. Adequate capacity.',
          },
          {
            period: 'Payday Period', dates: '25–27 Oct 2026',
            volume: 4200, chilledVol: 1920, vehicles: 10, reefer: 4,
            peak: 'Saturday', gap: 2, risk: 'medium',
            note: 'Demand surge expected. Reserve additional reefer capacity.',
          },
          {
            period: 'Deepavali', dates: '15–17 Oct 2026',
            volume: 5100, chilledVol: 1100, vehicles: 12, reefer: 3,
            peak: 'Friday', gap: 4, risk: 'high',
            note: 'Style volume peaks. Tech demand up 60%. Additional dry trucks required.',
          },
        ].map(f => (
          <Card key={f.period} style={{ borderTop: `2px solid ${f.risk === 'high' ? C.danger : f.risk === 'medium' ? C.warning : C.success}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700, color: C.text }}>{f.period}</h3>
                <p style={{ margin: 0, fontSize: 11, color: C.text3 }}>{f.dates}</p>
              </div>
              <Badge color={f.risk === 'high' ? C.danger : f.risk === 'medium' ? C.warning : C.success} dot>
                {f.risk === 'high' ? 'High risk' : f.risk === 'medium' ? 'Moderate' : 'Normal'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3.5">
              {[
                { label: 'Total volume', value: f.volume.toLocaleString() + ' kg' },
                { label: 'Chilled vol.', value: f.chilledVol.toLocaleString() + ' kg' },
                { label: 'Vehicles req.', value: f.vehicles },
                { label: 'Reefer req.', value: f.reefer },
              ].map(m => (
                <div key={m.label} style={{ padding: '10px 12px', background: C.elevated, borderRadius: 8 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 700, color: C.text, fontFamily: 'JetBrains Mono, monospace' }}>{m.value}</p>
                  <p style={{ margin: 0, fontSize: 10, color: C.text3 }}>{m.label}</p>
                </div>
              ))}
            </div>

            {f.gap > 0 && (
              <div style={{ padding: '8px 10px', background: C.dangerDim, borderRadius: 6, border: `1px solid ${C.danger}20`, marginBottom: 10 }}>
                <p style={{ margin: 0, fontSize: 12, color: C.danger }}>
                  Capacity gap: <strong>{f.gap} reefer vehicles</strong> short of projected demand
                </p>
              </div>
            )}
            <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>{f.note}</p>
          </Card>
        ))}
      </div>

      {/* Demand chart */}
      <Card style={{ marginBottom: 20 }}>
        <SectionHeader title="Weekly Volume Trend" subtitle="Historical vs forecast — Fresh, Style, Tech" />
        <div style={{ height: 160, display: 'flex', alignItems: 'flex-end', gap: 4, padding: '10px 0' }}>
          {[
            { week: 'W37', fresh: 65, style: 40, tech: 25 },
            { week: 'W38', fresh: 70, style: 45, tech: 30 },
            { week: 'W39', fresh: 68, style: 42, tech: 28 },
            { week: 'W40', fresh: 75, style: 48, tech: 32 },
            { week: 'W41', fresh: 80, style: 75, tech: 55, forecast: true },
            { week: 'W42', fresh: 72, style: 50, tech: 38, forecast: true },
          ].map(d => (
            <div key={d.week} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ width: '80%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                <div style={{ height: `${d.fresh}px`, background: d.forecast ? C.fresh + '60' : C.fresh, borderRadius: '2px 2px 0 0', transition: 'height 0.4s', border: d.forecast ? `1px dashed ${C.fresh}80` : 'none' }} />
                <div style={{ height: `${d.style}px`, background: d.forecast ? C.style + '60' : C.style }} />
                <div style={{ height: `${d.tech}px`, background: d.forecast ? C.tech + '60' : C.tech, borderRadius: '0 0 2px 2px' }} />
              </div>
              <span style={{ fontSize: 9, color: C.text3, fontFamily: 'JetBrains Mono, monospace' }}>{d.week}</span>
              {d.forecast && <span style={{ fontSize: 9, color: C.accent }}>fcst</span>}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          {[{ color: C.fresh, label: 'Fresh' }, { color: C.style, label: 'Style' }, { color: C.tech, label: 'Tech' }].map(l => (
            <div key={l.label} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
              <span style={{ fontSize: 11, color: C.text2 }}>{l.label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ width: 12, height: 1, borderTop: `1px dashed ${C.accent}` }} />
            <span style={{ fontSize: 11, color: C.accent }}>Forecast</span>
          </div>
        </div>
      </Card>

      {/* Intelligence insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AlertCard
          type="warning"
          title="Deepavali peak — action required"
          desc="Reserve 4 additional reefer vehicles from Kandy hub. Style and Tech both peak. Coordinate with Kandy depot by 8 Oct."
        />
        <AlertCard
          type="info"
          title="Payday surge — monitor"
          desc="Fresh demand typically rises 35–45% in payday windows. Ensure all 4 reefer vehicles are available for the 25 Oct window."
        />
      </div>
    </div>
  );
}

function statusColor(status: string) {
  switch (status) {
    case 'Available': return C.success;
    case 'On Route': case 'Loading': return C.accent;
    case 'Delayed': return C.danger;
    case 'Workshop': return C.offline;
    default: return C.text3;
  }
}
