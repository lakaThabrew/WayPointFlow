import { useEffect, useState } from 'react';
import {
  CheckCircle, Package, Clock, ChevronRight, ArrowLeft,
  AlertTriangle, ShoppingCart, TrendingUp, Bell, MapPin, Navigation,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  C, Card, Badge, StatusBadge, BrandBadge, TempBadge, Btn,
  InfoRow, Timeline, Divider, Mono, SectionHeader, AlertCard,
  CapacityBar, Table, TableRow, Label, AnimatedNumber, Spinner, EmptyState,
} from '../ui';
import { ordersApi, STATUS_LABEL, TEMP_LABEL, formatDate, type ApiOrder, type ApiOrderDetailed } from '../../services/orders';
import type { OrderStatus, TempType } from '../../types';

// ─── shared fetch helpers ─────────────────────────────────────────────────────
function useMyOrders() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    ordersApi.list()
      .then((r) => setOrders(r.orders))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);
  return { orders, loading, error };
}

function FetchState({ loading, error }: { loading: boolean; error: string }) {
  if (loading) return <Card style={{ padding: 40, textAlign: 'center' }}><Spinner size={28} /><p style={{ margin: '12px 0 0', fontSize: 13, color: C.text3 }}>Loading orders…</p></Card>;
  if (error) return <AlertCard type="critical" title="Could not load orders" desc={error} />;
  return null;
}

// ─── SM01 — Store Home ────────────────────────────────────────────────────────
export function StoreHome() {
  const { navigate, setSelectedOrder } = useApp();
  const { orders, loading, error } = useMyOrders();

  const activeCount = orders.filter((o) => ['NEW', 'CONFIRMED', 'PLANNED', 'LOADING', 'IN_TRANSIT', 'AT_RISK'].includes(o.status)).length;
  const pendingCount = orders.filter((o) => o.status === 'NEW').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;

  return (
    <div className="p-4 md:p-7 max-w-[900px] mx-auto w-full">
      {/* Header */}
      <div
        className="mb-6 p-5 md:p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden gap-4"
        style={{
          background: 'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(12,18,32,0.6) 60%)',
          border: '1px solid rgba(52,211,153,0.15)',
        }}
      >
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'radial-gradient(circle, rgba(52,211,153,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 10, color: C.fresh, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Store Manager</p>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.025em' }}>Waypoint Fresh — OUT032</h2>
          <p style={{ margin: 0, fontSize: 13, color: C.text3 }}>14 Station Rd, Gampaha · Tuesday, 30 Sep 2026</p>
        </div>
        <div className="text-left md:text-right">
          <p style={{ margin: 0, fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>On-time Rate</p>
          <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, color: C.fresh, fontFamily: 'JetBrains Mono, monospace' }}><AnimatedNumber value={94} />%</p>
        </div>
      </div>

      {/* Delivery status — hero card */}
      <div style={{
        padding: '20px 24px',
        background: 'linear-gradient(135deg, rgba(14,165,233,0.10) 0%, rgba(12,18,32,0.7) 100%)',
        border: `1px solid ${C.accent}30`, borderRadius: 16,
        marginBottom: 20,
      }}>
        <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today's delivery</p>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.02em' }}>Arriving at 06:42 AM</h3>
            <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>VEH014 · Kasun Perera · 25 packages</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="status-dot active" />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>In Transit</span>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: C.text3 }}>Route progress</span>
            <span style={{ fontSize: 11, color: C.accent, fontWeight: 600 }}>70%</span>
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '70%', background: `linear-gradient(90deg, ${C.accent}, ${C.success})`, borderRadius: 3, boxShadow: `0 0 8px ${C.accent}50` }} className="progress-fill" />
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 11, color: C.text3 }}>Departed 04:13 · 1 of 2 stops completed</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 stagger-children">
        {[
          { label: 'Active orders', value: String(activeCount), color: C.accent, action: () => navigate('store/orders') },
          { label: 'Pending confirm.', value: String(pendingCount), color: C.warning, action: () => navigate('store/orders') },
          { label: 'Delivered', value: String(deliveredCount), color: C.success, action: () => navigate('store/orders') },
          { label: 'Open issues', value: '0', color: C.text3, action: () => {} },
        ].map(s => (
          <div
            key={s.label}
            onClick={s.action}
            style={{
              padding: '14px 16px', background: C.card, borderRadius: 12,
              border: `1px solid ${C.border}`, cursor: 'pointer',
              transition: 'all 0.22s', borderTop: `2px solid ${s.color}`,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = C.card2;
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = C.card;
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            <p style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: 11, color: C.text2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        {/* Recent orders */}
        <div>
          <SectionHeader title="Recent Orders" action={
            <Btn variant="text" size="sm" onClick={() => navigate('store/orders')}>View all <ChevronRight size={12} /></Btn>
          } />
          <FetchState loading={loading} error={error} />
          {!loading && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {orders.slice(0, 4).map((o) => (
                <Card
                  key={o.id}
                  hover
                  onClick={() => { setSelectedOrder(o.id); navigate('store/tracking'); }}
                  style={{ padding: '12px 16px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Mono color={C.accent}>{o.id}</Mono>
                    <StatusBadge status={STATUS_LABEL[o.status] as OrderStatus} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <TempBadge temp={TEMP_LABEL[o.temperatureRequirement] as TempType} />
                    <span style={{ fontSize: 12, color: C.text2 }}>{o.weightKg} kg · {o.units} pkgs</span>
                  </div>
                </Card>
              ))}
              {orders.length === 0 && (
                <Card style={{ padding: 0 }}>
                  <EmptyState icon={Package} title="No orders" desc="No orders yet — create your first order." />
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <SectionHeader title="Quick Actions" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Btn variant="primary" fullWidth size="lg" onClick={() => navigate('store/create-order')}>
              <ShoppingCart size={15} /> Create new order
            </Btn>
            <Btn variant="secondary" fullWidth onClick={() => navigate('store/tracking')}>
              <Package size={14} /> Track delivery
            </Btn>
            <Btn variant="ghost" fullWidth onClick={() => navigate('store/received')}>
              <CheckCircle size={14} /> Confirm receipt
            </Btn>
          </div>

          <Divider style={{ margin: '16px 0' }} />

          {/* Order cutoff notice */}
          <div style={{ padding: '12px 14px', background: C.warningDim, border: `1px solid ${C.warning}25`, borderRadius: 10 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Clock size={14} color={C.warning} style={{ marginTop: 1 }} />
              <div>
                <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 600, color: C.warning }}>Order cutoff: 4:00 PM today</p>
                <p style={{ margin: 0, fontSize: 11, color: C.text2 }}>Orders for tomorrow must be placed before 4:00 PM to be included in tomorrow's plan.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SM02 — Orders ────────────────────────────────────────────────────────────
const ACTIVE_STATUSES = ['NEW', 'CONFIRMED', 'PLANNED', 'LOADING', 'IN_TRANSIT', 'AT_RISK'];

export function StoreOrders() {
  const { navigate, setSelectedOrder } = useApp();
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Active', 'Delivered', 'Deferred'];
  const { orders, loading, error } = useMyOrders();

  const storeOrders = orders.filter((o) => {
    if (filter === 'All') return true;
    if (filter === 'Active') return ACTIVE_STATUSES.includes(o.status);
    if (filter === 'Delivered') return o.status === 'DELIVERED';
    if (filter === 'Deferred') return o.status === 'DEFERRED';
    return true;
  });

  return (
    <div className="p-4 md:p-7 max-w-[900px] mx-auto w-full">
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: C.text }}>Orders — OUT032</h2>
          <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>Waypoint Fresh Gampaha · {storeOrders.length} {filter === 'All' ? 'total' : filter.toLowerCase()} orders</p>
        </div>
        <Btn variant="primary" onClick={() => navigate('store/create-order')}>
          <ShoppingCart size={14} /> New order
        </Btn>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12,
              border: `1px solid ${filter === f ? C.accent : C.border}`,
              background: filter === f ? C.accentDim : 'transparent',
              color: filter === f ? C.accent : C.text2,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}
          >{f}</button>
        ))}
      </div>

      <FetchState loading={loading} error={error} />
      {!loading && !error && (
        <Card style={{ padding: 0 }}>
          <Table headers={['Order ID', 'Date', 'Delivery date', 'Type', 'Weight', 'Status', '']}>
            {storeOrders.map((o) => (
              <TableRow
                key={o.id}
                onClick={() => { setSelectedOrder(o.id); navigate('store/tracking'); }}
                cells={[
                  <Mono color={C.accent}>{o.id}</Mono>,
                  <span style={{ fontSize: 12, color: C.text2 }}>{formatDate(o.createdAt)}</span>,
                  <span style={{ fontSize: 12, color: C.text }}>{formatDate(o.deliveryDate)}</span>,
                  <div style={{ display: 'flex', gap: 6 }}>
                    <BrandBadge brand={o.brand as 'Fresh' | 'Style' | 'Tech'} />
                    <TempBadge temp={TEMP_LABEL[o.temperatureRequirement] as TempType} />
                  </div>,
                  <Mono>{o.weightKg} kg</Mono>,
                  <StatusBadge status={STATUS_LABEL[o.status] as OrderStatus} />,
                  <ChevronRight size={14} color={C.text3} />,
                ]}
              />
            ))}
          </Table>
          {storeOrders.length === 0 && (
            <EmptyState icon={Package} title="No orders found" desc={`No ${filter.toLowerCase()} orders.`} />
          )}
        </Card>
      )}
    </div>
  );
}

// ─── SM03 — Create Order ──────────────────────────────────────────────────────
export function CreateOrder() {
  const { navigate, setOrderDraft } = useApp();
  const [brand, setBrand] = useState('Fresh');
  const [date, setDate] = useState('2026-10-01');
  const [window, setWindow] = useState('05:00–07:30');
  const [temp, setTemp] = useState('Chilled');
  const [weight, setWeight] = useState('');
  const [volume, setVolume] = useState('');
  const [packages, setPackages] = useState('');
  const [notes, setNotes] = useState('');

  const isCutoffPassed = new Date().getHours() >= 16;

  return (
    <div className="p-4 md:p-7 max-w-[720px] mx-auto w-full">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate('store/home')}><ArrowLeft size={14} /> Store Home</Btn>
        <ChevronRight size={14} color={C.text3} />
        <span style={{ fontSize: 13, color: C.text }}>Create Order</span>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: C.text }}>New Delivery Order</h2>
        <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>OUT032 — Waypoint Fresh Gampaha</p>
      </div>

      {/* Cutoff warning */}
      {isCutoffPassed && (
        <AlertCard
          type="warning"
          title="Next-day ordering is closed"
          desc="Orders for tomorrow must be placed before 4:00 PM. This order will be scheduled for 2 October 2026."
        />
      )}

      <Card style={{ marginTop: 16 }}>
        {/* Brand */}
        <div style={{ marginBottom: 20 }}>
          <Label>Brand</Label>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {['Fresh', 'Style', 'Tech'].map(b => {
              const colors: Record<string, string> = { Fresh: C.fresh, Style: C.style, Tech: C.tech };
              return (
                <button
                  key={b}
                  onClick={() => setBrand(b)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8,
                    border: `1px solid ${brand === b ? colors[b] : C.border}`,
                    background: brand === b ? colors[b] + '15' : C.elevated,
                    color: brand === b ? colors[b] : C.text2,
                    fontSize: 13, fontWeight: brand === b ? 600 : 400,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  }}
                >{b}</button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: C.text2 }}>Delivery date <span style={{ color: C.danger }}>*</span></label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: C.text2 }}>Delivery window</label>
            <select value={window} onChange={e => setWindow(e.target.value)}>
              <option>05:00–07:30</option>
              <option>05:30–07:30</option>
              <option>06:00–08:00</option>
            </select>
          </div>
        </div>

        <Divider />

        {/* Temperature */}
        <div style={{ marginBottom: 20 }}>
          <Label>Temperature requirement</Label>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {['Chilled', 'Frozen', 'Ambient'].map(t => (
              <button
                key={t}
                onClick={() => setTemp(t)}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8,
                  border: `1px solid ${temp === t ? C.reefer : C.border}`,
                  background: temp === t ? C.reeferDim : C.elevated,
                  color: temp === t ? C.reefer : C.text2,
                  fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >{t === 'Chilled' ? '❄ Chilled' : t === 'Frozen' ? '🧊 Frozen' : '○ Ambient'}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: C.text2 }}>Weight (kg) <span style={{ color: C.danger }}>*</span></label>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 200" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: C.text2 }}>Volume (m³)</label>
            <input type="number" value={volume} onChange={e => setVolume(e.target.value)} placeholder="e.g. 0.9" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: C.text2 }}>Packages</label>
            <input type="number" value={packages} onChange={e => setPackages(e.target.value)} placeholder="e.g. 14" />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: C.text2 }}>Order notes</label>
          <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special handling, product categories…" style={{ resize: 'vertical' }} />
        </div>

        {/* Order cutoff note */}
        <div style={{ padding: '10px 12px', background: C.infoDim, border: `1px solid ${C.info}20`, borderRadius: 8, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Clock size={13} color={C.info} style={{ marginTop: 1 }} />
            <span style={{ fontSize: 12, color: C.info }}>Orders for next-day delivery close at 4:00 PM today.</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn
            variant="primary"
            size="lg"
            disabled={!weight}
            onClick={() => {
              setOrderDraft({
                brand: brand as 'Fresh' | 'Style' | 'Tech',
                deliveryDate: date,
                window,
                temp: temp as 'Chilled' | 'Frozen' | 'Ambient',
                weightKg: weight,
                volumeM3: volume,
                packages,
                notes,
              });
              navigate('store/order-review');
            }}
          >
            Review order
          </Btn>
          <Btn variant="secondary" onClick={() => navigate('store/home')}>Cancel</Btn>
        </div>
      </Card>
    </div>
  );
}

// ─── SM04 — Order Review ──────────────────────────────────────────────────────
export function OrderReview() {
  const { navigate, orderDraft, placeOrder } = useApp();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  // No draft (e.g. direct navigation / refresh) — send the manager back to the form.
  useEffect(() => {
    if (!orderDraft) navigate('store/create-order');
  }, [orderDraft, navigate]);

  if (!orderDraft) return null;

  const handlePlace = async () => {
    setPlacing(true);
    setError('');
    try {
      await placeOrder(); // POSTs to the API and navigates to the confirmation screen
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to place order');
      setPlacing(false);
    }
  };

  return (
    <div style={{ padding: 28, maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate('store/create-order')}><ArrowLeft size={14} /> Edit order</Btn>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: C.text }}>Review order</h2>
        <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>Confirm the details before placing</p>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <SectionHeader title="Order Summary" />
        <InfoRow label="Outlet" value="OUT032 — Waypoint Fresh Gampaha" />
        <InfoRow label="Brand" value={<BrandBadge brand={orderDraft.brand} />} />
        <InfoRow label="Delivery date" value={formatDate(orderDraft.deliveryDate)} />
        <InfoRow label="Delivery window" value={orderDraft.window} mono />
        <InfoRow label="Temperature" value={<TempBadge temp={orderDraft.temp} />} />
        <Divider />
        <InfoRow label="Weight" value={`${orderDraft.weightKg} kg`} mono />
        <InfoRow label="Volume" value={`${orderDraft.volumeM3 || '0'} m³`} mono />
        <InfoRow label="Packages" value={orderDraft.packages || '—'} mono />
        {orderDraft.notes ? <InfoRow label="Notes" value={orderDraft.notes} /> : null}
      </Card>

      <div style={{ padding: '12px 14px', background: C.infoDim, border: `1px solid ${C.info}20`, borderRadius: 10, marginBottom: 20 }}>
        <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 500, color: C.info }}>Planning status</p>
        <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>This order will be included in the next planning cycle. The dispatcher confirms assignments after the 4:00 PM cutoff.</p>
      </div>

      {error && (
        <AlertCard type="critical" title="Order not placed" desc={error} />
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="primary" size="lg" fullWidth loading={placing} onClick={handlePlace}>
          {placing ? 'Placing order…' : 'Place order'}
        </Btn>
        <Btn variant="secondary" onClick={() => navigate('store/create-order')}>Edit</Btn>
      </div>
    </div>
  );
}

// ─── SM05 — Order Confirmation ────────────────────────────────────────────────
export function OrderConfirmation() {
  const { navigate, lastCreatedOrder, setSelectedOrder } = useApp();

  // Direct visit without a fresh order — go to the orders list instead.
  useEffect(() => {
    if (!lastCreatedOrder) navigate('store/orders');
  }, [lastCreatedOrder, navigate]);

  if (!lastCreatedOrder) return null;
  const o = lastCreatedOrder;

  return (
    <div style={{ padding: 28, maxWidth: 560 }}>
      <div style={{ textAlign: 'center', padding: '20px 0 32px' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: C.successDim, border: `1px solid ${C.success}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <CheckCircle size={28} color={C.success} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: C.text }}>Order submitted</h2>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: C.text2 }}>Your order has been received and is pending dispatcher confirmation.</p>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <InfoRow label="Order ID" value={<Mono color={C.success}>{o.id}</Mono>} />
        <InfoRow label="Outlet" value={`${o.outletId} — ${o.district}`} />
        <InfoRow label="Delivery date" value={formatDate(o.deliveryDate)} />
        <InfoRow label="Window" value={`${o.windowOpen}–${o.windowClose}`} mono />
        <InfoRow label="Temperature" value={<TempBadge temp={TEMP_LABEL[o.temperatureRequirement] as TempType} />} />
        <InfoRow label="Weight" value={`${o.weightKg} kg`} mono />
        <Divider />
        <InfoRow label="Planning status" value={<Badge color={C.text3}>Pending confirmation</Badge>} />
        <InfoRow label="Expected confirmation" value="After the 4:00 PM cutoff" />
      </Card>

      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="primary" fullWidth onClick={() => { setSelectedOrder(o.id); navigate('store/tracking'); }}>Track this order</Btn>
        <Btn variant="secondary" onClick={() => navigate('store/home')}>Back to home</Btn>
      </div>
    </div>
  );
}

// ─── SM06 — Delivery Tracking ─────────────────────────────────────────────────
const FLOW_STEPS: Array<{ status: ApiOrder['status']; label: string; note: string }> = [
  { status: 'NEW', label: 'Order placed', note: 'Submitted by the store manager' },
  { status: 'CONFIRMED', label: 'Confirmed', note: 'Dispatcher confirmed — queue closed' },
  { status: 'PLANNED', label: 'Planned', note: 'Assigned to a vehicle and trip' },
  { status: 'LOADING', label: 'Loaded', note: 'Loaded at the depot' },
  { status: 'IN_TRANSIT', label: 'In transit', note: 'Vehicle departed the depot' },
  { status: 'DELIVERED', label: 'Delivered', note: 'Awaiting delivery confirmation' },
];

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export function DeliveryTracking() {
  const { navigate, selectedOrderId } = useApp();
  const [order, setOrder] = useState<ApiOrderDetailed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedOrderId) {
      navigate('store/orders');
      return;
    }
    setLoading(true);
    ordersApi.get(selectedOrderId)
      .then((r) => setOrder(r.order))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load order'))
      .finally(() => setLoading(false));
  }, [selectedOrderId, navigate]);

  if (loading || error || !order) {
    return (
      <div style={{ padding: 28, maxWidth: 700 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Btn variant="ghost" size="sm" onClick={() => navigate('store/orders')}><ArrowLeft size={14} /> Orders</Btn>
        </div>
        <FetchState loading={loading} error={error} />
      </div>
    );
  }

  const isDeferred = order.status === 'DEFERRED';
  const currentIdx = FLOW_STEPS.findIndex((s) => s.status === order.status);
  const stepTimes: Partial<Record<ApiOrder['status'], string>> = {
    NEW: fmtTime(order.createdAt),
    DELIVERED: fmtTime(order.tripStops?.[0]?.proofOfDelivery?.recordedAt),
  };
  const steps = FLOW_STEPS.map((s, i) => ({
    label: s.label,
    time: stepTimes[s.status] ?? '',
    status: isDeferred ? ('pending' as const) : i < currentIdx ? ('done' as const) : i === currentIdx ? ('active' as const) : ('pending' as const),
    note: s.note,
  }));
  const stop = order.tripStops?.[0];
  const vehicleReg = stop?.trip?.vehicle?.registrationNo ?? stop?.trip?.vehicleId;

  return (
    <div style={{ padding: 28, maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate('store/orders')}><ArrowLeft size={14} /> Orders</Btn>
        <ChevronRight size={14} color={C.text3} />
        <Mono color={C.accent}>{order.id}</Mono>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        <div>
          <Card style={{ marginBottom: 16 }}>
            <SectionHeader title={`Order ${order.id}`} />
            <InfoRow label="Outlet" value={`${order.outletId} — ${order.district}`} />
            <InfoRow label="Brand" value={<BrandBadge brand={order.brand as 'Fresh' | 'Style' | 'Tech'} />} />
            <InfoRow label="Delivery date" value={formatDate(order.deliveryDate)} />
            <InfoRow label="Window" value={`${order.windowOpen}–${order.windowClose}`} mono />
            <InfoRow label="Temperature" value={<TempBadge temp={TEMP_LABEL[order.temperatureRequirement] as TempType} />} />
            <InfoRow label="Weight" value={`${order.weightKg} kg`} mono />
            <InfoRow label="Packages" value={`${order.units}`} mono />
          </Card>

          <Card>
            <SectionHeader title="Status Timeline" />
            {isDeferred && order.deferrals?.[0] ? (
              <AlertCard type="warning" title="Order deferred" desc={order.deferrals[0].reason} />
            ) : (
              <Timeline steps={steps} />
            )}
          </Card>
        </div>

        <div>
          <Card style={{ marginBottom: 14 }}>
            <SectionHeader title="Delivery Vehicle" />
            {stop ? (
              <>
                <InfoRow label="Vehicle" value={<Mono color={C.text}>{vehicleReg}</Mono>} />
                <InfoRow label="Status" value={<StatusBadge status={STATUS_LABEL[order.status] as OrderStatus} />} />
                {stop.plannedArrival && <InfoRow label="Planned arrival" value={fmtTime(stop.plannedArrival)} mono accent />}
                <InfoRow label="Window closes" value={order.windowClose} mono />
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 12, color: C.text3 }}>
                {isDeferred ? 'Not assigned — see the deferral reason.' : 'Awaiting planning — a vehicle is assigned when the dispatcher plans this order.'}
              </p>
            )}
          </Card>

          {order.status === 'DELIVERED' && (
            <Btn variant="primary" fullWidth onClick={() => navigate('store/received')}>
              Confirm receipt
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SM07 — Delivery Received ─────────────────────────────────────────────────
export function DeliveryReceived() {
  const { navigate, selectedOrderId } = useApp();
  const [order, setOrder] = useState<ApiOrderDetailed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(true);
  const [cond, setCond] = useState('Good');
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!selectedOrderId) {
      navigate('store/orders');
      return;
    }
    ordersApi.get(selectedOrderId)
      .then((r) => setOrder(r.order))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load order'))
      .finally(() => setLoading(false));
  }, [selectedOrderId, navigate]);

  const handleConfirm = async () => {
    if (!selectedOrderId) return;
    try {
      setConfirming(true);
      await ordersApi.confirmReceipt(selectedOrderId);
      setConfirmed(true);
    } catch (e) {
      alert('Failed to confirm receipt: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setConfirming(false);
    }
  };

  if (loading || error || !order) {
    return (
      <div style={{ padding: 28, maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Btn variant="ghost" size="sm" onClick={() => navigate('store/tracking')}><ArrowLeft size={14} /> Tracking</Btn>
        </div>
        <FetchState loading={loading} error={error} />
      </div>
    );
  }

  if (confirmed || order.receiptConfirmedAt) {
    return (
      <div style={{ padding: 28, maxWidth: 520, textAlign: 'center' }}>
        <div style={{ padding: '40px 32px', background: C.card, border: `1px solid ${C.success}30`, borderRadius: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.successDim, border: `1px solid ${C.success}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={26} color={C.success} />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: C.text }}>Delivery received</h2>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: C.text2 }}>Receipt confirmed for {order.id}. This has been recorded and the dispatcher has been notified.</p>
          <p style={{ margin: '0 0 24px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: C.text3 }}>Received: {order.receiptConfirmedAt ? fmtTime(order.receiptConfirmedAt) : 'Just now'}</p>
          <Btn variant="secondary" fullWidth onClick={() => navigate('store/home')}>Return to home</Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 28, maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate('store/tracking')}><ArrowLeft size={14} /> Tracking</Btn>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: C.text }}>Delivery received</h2>
        <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>Confirm receipt of {order.id}</p>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <SectionHeader title="Order Details" />
        <InfoRow label="Order ID" value={<Mono color={C.accent}>{order.id}</Mono>} />
        <InfoRow label="Received time" value={fmtTime(order.tripStops?.[0]?.proofOfDelivery?.recordedAt || new Date().toISOString())} mono accent />
        <InfoRow label="Packages" value={`${order.units} packages`} mono />
        <InfoRow label="Weight" value={`${order.weightKg} kg`} mono />
        <InfoRow label="Temperature" value={<TempBadge temp={TEMP_LABEL[order.temperatureRequirement] as TempType} />} />
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <SectionHeader title="Verification" />
        <div style={{ marginBottom: 14 }}>
          <button
            onClick={() => setQty(v => !v)}
            style={{
              width: '100%', padding: '12px 16px',
              background: qty ? C.successDim : C.elevated,
              border: `1px solid ${qty ? C.success + '50' : C.border}`,
              borderRadius: 10, cursor: 'pointer',
              display: 'flex', gap: 10, alignItems: 'center',
              fontFamily: 'Inter, sans-serif', fontSize: 13,
              color: qty ? C.success : C.text2,
            }}
          >
            {qty ? <CheckCircle size={16} /> : <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1px solid ${C.text3}` }} />}
            Quantity verified — {order.units} packages, {order.weightKg} kg received
          </button>
        </div>

        <Label>Goods condition</Label>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {['Good', 'Minor damage', 'Damaged'].map(c => (
            <button
              key={c}
              onClick={() => setCond(c)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 12,
                border: `1px solid ${cond === c ? (c === 'Good' ? C.success : c === 'Damaged' ? C.danger : C.warning) : C.border}`,
                background: cond === c ? (c === 'Good' ? C.successDim : c === 'Damaged' ? C.dangerDim : C.warningDim) : C.elevated,
                color: cond === c ? (c === 'Good' ? C.success : c === 'Damaged' ? C.danger : C.warning) : C.text2,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >{c}</button>
          ))}
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="primary" size="lg" fullWidth disabled={!qty} loading={confirming} onClick={handleConfirm}>
          {confirming ? 'Confirming...' : 'Confirm receipt'}
        </Btn>
        <Btn variant="danger" onClick={() => {}}>Report discrepancy</Btn>
      </div>
    </div>
  );
}

const C_infoDim = 'rgba(96,165,250,0.10)';
