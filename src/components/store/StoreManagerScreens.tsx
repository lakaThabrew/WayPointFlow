import { useState } from 'react';
import {
  CheckCircle, Package, Clock, ChevronRight, ArrowLeft,
  AlertTriangle, ShoppingCart, TrendingUp, Bell, MapPin, Navigation,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  C, Card, Badge, StatusBadge, BrandBadge, TempBadge, Btn,
  InfoRow, Timeline, Divider, Mono, SectionHeader, AlertCard,
  CapacityBar, Table, TableRow, Label, AnimatedNumber,
} from '../ui';
import { ORDERS } from '../../data/mockData';

// ─── SM01 — Store Home ────────────────────────────────────────────────────────
export function StoreHome() {
  const { navigate } = useApp();

  return (
    <div style={{ padding: 28, maxWidth: 900 }}>
      {/* Header */}
      <div style={{
        marginBottom: 24, padding: '20px 24px',
        background: 'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(12,18,32,0.6) 60%)',
        borderRadius: 16, border: '1px solid rgba(52,211,153,0.15)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'radial-gradient(circle, rgba(52,211,153,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 10, color: C.fresh, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Store Manager</p>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: '-0.025em' }}>Waypoint Fresh — OUT032</h2>
          <p style={{ margin: 0, fontSize: 13, color: C.text3 }}>14 Station Rd, Gampaha · Tuesday, 30 Sep 2026</p>
        </div>
        <div style={{ textAlign: 'right' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }} className="stagger-children">
        {[
          { label: 'Active orders', value: '2', color: C.accent, action: () => navigate('store/orders') },
          { label: 'Pending confirm.', value: '1', color: C.warning, action: () => navigate('store/tracking') },
          { label: 'Delivered today', value: '1', color: C.success, action: () => navigate('store/orders') },
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        {/* Recent orders */}
        <div>
          <SectionHeader title="Recent Orders" action={
            <Btn variant="text" size="sm" onClick={() => navigate('store/orders')}>View all <ChevronRight size={12} /></Btn>
          } />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ORDERS.filter(o => o.outlet === 'OUT032').map(o => (
              <Card
                key={o.id}
                hover
                onClick={() => navigate('store/tracking')}
                style={{ padding: '12px 16px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Mono color={C.accent}>{o.id}</Mono>
                  <StatusBadge status={o.status} />
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <TempBadge temp={o.temp} />
                  <span style={{ fontSize: 12, color: C.text2 }}>{o.weightKg} kg · {o.packages} pkgs</span>
                  {o.vehicle && <Mono color={C.text3}>{o.vehicle}</Mono>}
                </div>
              </Card>
            ))}
          </div>
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
export function StoreOrders() {
  const { navigate } = useApp();
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Active', 'Delivered', 'Deferred'];
  const storeOrders = ORDERS.filter(o => o.outlet === 'OUT032');

  return (
    <div style={{ padding: 28, maxWidth: 900 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: C.text }}>Orders — OUT032</h2>
          <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>Waypoint Fresh Gampaha · {storeOrders.length} total orders</p>
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

      <Card style={{ padding: 0 }}>
        <Table headers={['Order ID', 'Date', 'Delivery date', 'Type', 'Weight', 'Status', '']}>
          {storeOrders.map(o => (
            <TableRow
              key={o.id}
              onClick={() => navigate('store/tracking')}
              cells={[
                <Mono color={C.accent}>{o.id}</Mono>,
                <span style={{ fontSize: 12, color: C.text2 }}>29 Sep 2026</span>,
                <span style={{ fontSize: 12, color: C.text }}>30 Sep 2026</span>,
                <div style={{ display: 'flex', gap: 6 }}>
                  <BrandBadge brand={o.brand} />
                  <TempBadge temp={o.temp} />
                </div>,
                <Mono>{o.weightKg} kg</Mono>,
                <StatusBadge status={o.status} />,
                <ChevronRight size={14} color={C.text3} />,
              ]}
            />
          ))}
        </Table>
      </Card>
    </div>
  );
}

// ─── SM03 — Create Order ──────────────────────────────────────────────────────
export function CreateOrder() {
  const { navigate } = useApp();
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
    <div style={{ padding: 28, maxWidth: 720 }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
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
          <Btn variant="primary" size="lg" disabled={!weight} onClick={() => navigate('store/order-review')}>Review order</Btn>
          <Btn variant="secondary" onClick={() => navigate('store/home')}>Cancel</Btn>
        </div>
      </Card>
    </div>
  );
}

// ─── SM04 — Order Review ──────────────────────────────────────────────────────
export function OrderReview() {
  const { navigate } = useApp();

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
        <InfoRow label="Brand" value={<BrandBadge brand="Fresh" />} />
        <InfoRow label="Delivery date" value="1 October 2026" />
        <InfoRow label="Delivery window" value="05:00–07:30" mono />
        <InfoRow label="Temperature" value={<TempBadge temp="Chilled" />} />
        <Divider />
        <InfoRow label="Weight" value="200 kg" mono />
        <InfoRow label="Volume" value="0.9 m³" mono />
        <InfoRow label="Packages" value="14" mono />
      </Card>

      <div style={{ padding: '12px 14px', background: C.infoDim, border: `1px solid ${C.info}20`, borderRadius: 10, marginBottom: 20 }}>
        <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 500, color: C.info }}>Planning status</p>
        <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>This order will be included in tomorrow's planning. The dispatcher will confirm assignment by 6:00 PM today.</p>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="primary" size="lg" fullWidth onClick={() => navigate('store/confirmation')}>Place order</Btn>
        <Btn variant="secondary" onClick={() => navigate('store/create-order')}>Edit</Btn>
      </div>
    </div>
  );
}

// ─── SM05 — Order Confirmation ────────────────────────────────────────────────
export function OrderConfirmation() {
  const { navigate } = useApp();

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
        <InfoRow label="Order ID" value={<Mono color={C.success}>ORD-10527</Mono>} />
        <InfoRow label="Outlet" value="OUT032 — Waypoint Fresh Gampaha" />
        <InfoRow label="Delivery date" value="1 October 2026" />
        <InfoRow label="Window" value="05:00–07:30" mono />
        <InfoRow label="Temperature" value={<TempBadge temp="Chilled" />} />
        <InfoRow label="Weight" value="200 kg" mono />
        <Divider />
        <InfoRow label="Planning status" value={<Badge color={C.text3}>Pending confirmation</Badge>} />
        <InfoRow label="Expected confirmation" value="By 6:00 PM today" />
      </Card>

      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="primary" fullWidth onClick={() => navigate('store/tracking')}>Track this order</Btn>
        <Btn variant="secondary" onClick={() => navigate('store/home')}>Back to home</Btn>
      </div>
    </div>
  );
}

// ─── SM06 — Delivery Tracking ─────────────────────────────────────────────────
export function DeliveryTracking() {
  const { navigate } = useApp();

  const steps = [
    { label: 'Order placed', time: '29 Sep, 2:30 PM', status: 'done' as const, note: 'Submitted by Chamari Wickramasinghe' },
    { label: 'Confirmed', time: '29 Sep, 4:15 PM', status: 'done' as const, note: 'Dispatcher confirmed — included in plan' },
    { label: 'Planned', time: '29 Sep, 8:00 PM', status: 'done' as const, note: 'Assigned to VEH014 Trip 1' },
    { label: 'Loaded', time: '30 Sep, 3:52 AM', status: 'done' as const, note: 'Loaded at Peliyagoda depot' },
    { label: 'In transit', time: '30 Sep, 4:13 AM', status: 'active' as const, note: 'VEH014 departed depot · Kasun Perera' },
    { label: 'Delivered', time: 'Est. 6:42 AM', status: 'pending' as const, note: 'Awaiting delivery confirmation' },
  ];

  return (
    <div style={{ padding: 28, maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Btn variant="ghost" size="sm" onClick={() => navigate('store/orders')}><ArrowLeft size={14} /> Orders</Btn>
        <ChevronRight size={14} color={C.text3} />
        <Mono color={C.accent}>ORD-10483</Mono>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        <div>
          <Card style={{ marginBottom: 16 }}>
            <SectionHeader title="Order ORD-10483" />
            <InfoRow label="Outlet" value="OUT032 — Gampaha" />
            <InfoRow label="Brand" value={<BrandBadge brand="Fresh" />} />
            <InfoRow label="Delivery date" value="30 Sep 2026" />
            <InfoRow label="Window" value="05:00–07:30" mono />
            <InfoRow label="Temperature" value={<TempBadge temp="Chilled" />} />
            <InfoRow label="Weight" value="200 kg" mono />
            <InfoRow label="Packages" value="14" mono />
          </Card>

          <Card>
            <SectionHeader title="Status Timeline" />
            <Timeline steps={steps} />
          </Card>
        </div>

        <div>
          <Card style={{ marginBottom: 14 }}>
            <SectionHeader title="Delivery Vehicle" />
            <InfoRow label="Vehicle" value={<Mono color={C.text}>VEH014</Mono>} />
            <InfoRow label="Driver" value="Kasun Perera" />
            <InfoRow label="Status" value={<StatusBadge status="In Transit" />} />
            <InfoRow label="ETA" value="06:42 AM" mono accent />
            <InfoRow label="Window closes" value="07:30 AM" mono />
            <div style={{ marginTop: 14, padding: '10px 12px', background: C.warningDim, borderRadius: 8, border: `1px solid ${C.warning}20` }}>
              <p style={{ margin: 0, fontSize: 12, color: C.warning }}>ETA is 22 minutes behind original plan. Window has 48 minutes remaining.</p>
            </div>
          </Card>

          <Btn variant="primary" fullWidth onClick={() => navigate('store/received')}>
            Confirm receipt
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── SM07 — Delivery Received ─────────────────────────────────────────────────
export function DeliveryReceived() {
  const { navigate } = useApp();
  const [qty, setQty] = useState(true);
  const [cond, setCond] = useState('Good');
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed) {
    return (
      <div style={{ padding: 28, maxWidth: 520, textAlign: 'center' }}>
        <div style={{ padding: '40px 32px', background: C.card, border: `1px solid ${C.success}30`, borderRadius: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.successDim, border: `1px solid ${C.success}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={26} color={C.success} />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: C.text }}>Delivery received</h2>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: C.text2 }}>Receipt confirmed for ORD-10483. This has been recorded and the driver and dispatcher have been notified.</p>
          <p style={{ margin: '0 0 24px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: C.text3 }}>Received: 06:47 AM, 30 Sep 2026</p>
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
        <p style={{ margin: 0, fontSize: 13, color: C.text2 }}>Confirm receipt of ORD-10483</p>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <SectionHeader title="Order Details" />
        <InfoRow label="Order ID" value={<Mono color={C.accent}>ORD-10483</Mono>} />
        <InfoRow label="Received time" value="06:47 AM" mono accent />
        <InfoRow label="Packages" value="14 packages" mono />
        <InfoRow label="Weight" value="200 kg" mono />
        <InfoRow label="Temperature" value={<TempBadge temp="Chilled" />} />
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
            Quantity verified — 14 packages, 200 kg received
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
        <Btn variant="primary" size="lg" fullWidth disabled={!qty} onClick={() => setConfirmed(true)}>Confirm receipt</Btn>
        <Btn variant="danger" onClick={() => {}}>Report discrepancy</Btn>
      </div>
    </div>
  );
}

const C_infoDim = 'rgba(96,165,250,0.10)';
