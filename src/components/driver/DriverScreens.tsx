import { useState, useEffect } from 'react';
import {
  CheckCircle, AlertTriangle, MapPin, Clock, Package, ChevronRight,
  ArrowLeft, Navigation, Play, Thermometer,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  C, Badge, StatusBadge, BrandBadge, TempBadge, Btn,
  InfoRow, Timeline, Divider, Mono, OfflineBanner,
} from '../ui';
import { getDriverActiveTrip, getTripStops, markStopArrival, completeDelivery, reportIssue, type DriverTrip, type DriverStop } from '../../services/driver';
import dayjs from 'dayjs';

// Mobile-first driver screens - all content sized for 390px phone frame

// ─── DR01 — Driver Home ───────────────────────────────────────────────────────
export function DriverHome() {
  const { navigate, isOffline, user, setSelectedTripId, setSelectedStopId } = useApp();
  const [trip, setTrip] = useState<DriverTrip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDriverActiveTrip().then(t => {
      setTrip(t);
      if (t) setSelectedTripId(t.id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [setSelectedTripId]);

  const stops = trip?.stops || [];
  const completedStops = stops.filter(s => s.status === 'COMPLETED').length;
  const nextStop = stops.find(s => s.status === 'PENDING' || s.status === 'ARRIVED');

  const handleNextStop = () => {
    if (nextStop) {
      setSelectedStopId(nextStop.id);
      navigate('driver/stop');
    }
  };

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
        <h1 style={{ margin: '0 0 2px', fontSize: 22, fontWeight: 700, color: C.text }}>{user?.name?.split(' ')[0] || 'Driver'}</h1>
        <p style={{ margin: 0, fontSize: 12, color: C.text3 }}>{trip?.vehicle?.registrationNo || 'No vehicle'} · {isOffline ? '⚠ Offline mode' : 'Connected'}</p>
      </div>

      {!trip && !loading && (
        <div style={{ padding: 20, textAlign: 'center', color: C.text2 }}>
          No active trips assigned.
        </div>
      )}

      {trip && (
      <>
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
                  <p style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 700, color: C.text }}>Trip {trip.tripNumber} — {stops.length} stops</p>
                </div>
                <StatusBadge status={trip.status === 'IN_TRANSIT' ? 'On Route' : 'Ready'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Stops', value: `${stops.length} total` },
                  { label: 'Completed', value: `${completedStops} done` },
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
                <span style={{ fontSize: 12, color: C.success }}>{completedStops} of {stops.length} complete</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${stops.length ? Math.round((completedStops / stops.length) * 100) : 0}%`, background: `linear-gradient(90deg, ${C.success}, ${C.accent})`, borderRadius: 3 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Current stop highlight */}
        {nextStop && (
          <div style={{ padding: '0 20px 16px' }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Next Stop</p>
            <div
              onClick={handleNextStop}
              style={{
                padding: '16px 18px', background: C.accentDim,
                border: `1px solid ${C.accent}40`, borderRadius: 12, cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.accent }}>{nextStop.outlet.id}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: C.text }}>{nextStop.outlet.name}</p>
                </div>
                {nextStop.order?.temperatureRequirement === 'CHILLED' && <Badge color={C.reefer}>❄ Chilled</Badge>}
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  <Clock size={12} color={C.text3} />
                  <span style={{ fontSize: 12, color: C.text2 }}>Window: {nextStop.order?.windowOpen}–{nextStop.order?.windowClose}</span>
                </div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  <Package size={12} color={C.text3} />
                  <span style={{ fontSize: 12, color: C.text2 }}>{nextStop.order?.units} packages</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: '0 20px 24px', display: 'flex', gap: 10 }}>
          <Btn variant="primary" fullWidth onClick={() => navigate('driver/route')}>
            <Play size={14} /> View full route
          </Btn>
          {nextStop && (
            <Btn variant="secondary" onClick={handleNextStop}>
              Stop details
            </Btn>
          )}
        </div>
      </>
      )}
    </div>
  );
}

// ─── DR02 — Route Overview ────────────────────────────────────────────────────
export function RouteOverview() {
  const { navigate, isOffline, setSelectedStopId } = useApp();
  const [stops, setStops] = useState<DriverStop[]>([]);
  const [trip, setTrip] = useState<DriverTrip | null>(null);

  useEffect(() => {
    getDriverActiveTrip().then(t => {
      setTrip(t);
      if (t) getTripStops(t.id).then(setStops);
    });
  }, []);

  if (!trip) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ flex: 1, background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: C.surface, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('driver/home')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text2 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>Today's Route</h2>
          <p style={{ margin: 0, fontSize: 11, color: C.text3 }}>{trip.vehicle?.registrationNo} · Trip {trip.tripNumber} · {stops.length} stops</p>
        </div>
        {isOffline && (
          <div style={{ marginLeft: 'auto', padding: '3px 10px', background: `${C.warning}15`, border: `1px solid ${C.warning}30`, borderRadius: 12 }}>
            <span style={{ fontSize: 10, color: C.warning }}>OFFLINE DATA</span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px 24px' }}>
        {stops.map((stop, i) => {
          const isActive = stop.status === 'PENDING' || stop.status === 'ARRIVED';
          const isDone = stop.status === 'COMPLETED';
          const statusColor = isDone ? C.success : isActive ? C.accent : C.text3;

          return (
            <div
              key={stop.id}
              onClick={() => {
                setSelectedStopId(stop.id);
                navigate('driver/stop');
              }}
              style={{ display: 'flex', gap: 14, cursor: 'pointer' }}
            >
              {/* Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                  background: statusColor,
                  boxShadow: isActive ? `0 0 10px ${C.accent}80` : undefined,
                }} className={isActive ? 'pulse-dot' : ''} />
                {i < stops.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 40, background: isDone ? C.success + '40' : C.border, margin: '4px 0' }} />
                )}
              </div>

              {/* Content */}
              <div style={{
                flex: 1, paddingBottom: i < stops.length - 1 ? 16 : 0,
              }}>
                <div style={{
                  padding: '12px 14px', background: isActive ? C.accentDim : C.card,
                  border: `1px solid ${isActive ? C.accent + '40' : C.border}`,
                  borderRadius: 10,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? C.accent : C.text }}>{stop.outlet.name}</p>
                    <Mono color={isDone ? C.success : isActive ? C.warning : C.text3}>{stop.plannedArrival ? dayjs(stop.plannedArrival).format('HH:mm') : '--:--'}</Mono>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>{stop.order?.id} · {stop.status}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DR03 — Stop Details ──────────────────────────────────────────────────────
export function StopDetails() {
  const { navigate, isOffline, selectedTripId, selectedStopId } = useApp();
  const [stops, setStops] = useState<DriverStop[]>([]);
  const [arriving, setArriving] = useState(false);

  useEffect(() => {
    if (selectedTripId) getTripStops(selectedTripId).then(setStops);
  }, [selectedTripId]);

  const stop = stops.find(s => s.id === selectedStopId);
  const stopIndex = stops.findIndex(s => s.id === selectedStopId);

  if (!stop) return <div style={{ padding: 20 }}>Loading stop...</div>;

  const handleArrive = async () => {
    setArriving(true);
    try {
      if (stop.status === 'PENDING') {
        await markStopArrival(stop.id);
      }
      navigate('driver/confirm');
    } catch (e) {
      console.error(e);
    } finally {
      setArriving(false);
    }
  };

  return (
    <div style={{ flex: 1, background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: C.surface, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('driver/route')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text2 }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text }}>Stop Details</h2>
          <p style={{ margin: 0, fontSize: 11, color: C.text3 }}>Stop {stopIndex + 1} of {stops.length}</p>
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
            <Mono color={C.text3}>{stop.outlet.id}</Mono>
            <BrandBadge brand={stop.order?.brand as any} />
          </div>
          <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: C.text }}>{stop.outlet.name}</h2>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: C.text2 }}>{stop.outlet.address}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { icon: <Clock size={13} />, label: 'Window', value: `${stop.order?.windowOpen}–${stop.order?.windowClose}` },
              { icon: <Thermometer size={13} />, label: 'Temp', value: stop.order?.temperatureRequirement === 'CHILLED' ? 'Chilled' : 'Ambient' },
              { icon: <Package size={13} />, label: 'Packages', value: `${stop.order?.units} total` },
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
          <div style={{
            padding: '12px 14px', background: C.card, borderRadius: 10,
            border: `1px solid ${C.border}`, marginBottom: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Mono color={C.accent}>{stop.order?.id}</Mono>
              <StatusBadge status={stop.order?.status} />
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: C.text2 }}>{stop.order?.units} packages · {stop.order?.weightKg} kg</p>
          </div>
        </div>

        {/* ETA info */}
        <div style={{
          padding: '12px 14px', background: C.warningDim,
          border: `1px solid ${C.warning}30`, borderRadius: 10, marginBottom: 16,
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <Clock size={16} color={C.warning} />
          <div>
            <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: C.warning }}>Target arrival: {stop.plannedArrival ? dayjs(stop.plannedArrival).format('HH:mm') : '--:--'}</p>
            <p style={{ margin: 0, fontSize: 12, color: C.text2 }}>Window closes {stop.order?.windowClose}</p>
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div style={{ padding: '16px 20px', background: C.surface, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 10 }}>
        <Btn variant="secondary" fullWidth onClick={() => {}}>
          <Navigation size={14} /> Navigate
        </Btn>
        <Btn variant="primary" fullWidth onClick={handleArrive} disabled={arriving}>
          {stop.status === 'ARRIVED' ? 'Start delivery' : 'Mark Arrival'}
        </Btn>
      </div>
    </div>
  );
}

// ─── DR04 — Delivery Confirmation ─────────────────────────────────────────────
export function DeliveryConfirmation() {
  const { navigate, isOffline, selectedTripId, selectedStopId } = useApp();
  const [stops, setStops] = useState<DriverStop[]>([]);
  const [qtyVerified, setQtyVerified] = useState(false);
  const [condition, setCondition] = useState('Good');
  const [receiverName, setReceiverName] = useState('');
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectedTripId) getTripStops(selectedTripId).then(setStops);
  }, [selectedTripId]);

  const stop = stops.find(s => s.id === selectedStopId);

  if (!stop) return <div style={{ padding: 20 }}>Loading...</div>;

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // Mock receiver name if left empty for MVP testing ease
      await completeDelivery(stop.id, receiverName || 'Store Manager', `${condition} - ${note}`);
      setConfirmed(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

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
            : `Delivery to ${stop.outlet.id} confirmed. Dispatcher has been notified.`}
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
          <p style={{ margin: 0, fontSize: 11, color: C.text3 }}>{stop.outlet.id} — {stop.outlet.name}</p>
        </div>
      </div>

      {isOffline && (
        <div style={{ padding: '10px 20px', background: `${C.warning}12`, borderBottom: `1px solid ${C.warning}25` }}>
          <OfflineBanner synced="03:52 AM" />
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {/* Orders to confirm */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ padding: '14px 16px', background: C.card, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <Mono color={C.accent}>{stop.order?.id}</Mono>
              <span style={{ fontSize: 12, color: C.text2 }}>{stop.order?.units} pkgs · {stop.order?.weightKg} kg</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setQtyVerified(!qtyVerified)}
                style={{
                  flex: 1, padding: '9px 12px',
                  background: qtyVerified ? C.successDim : C.elevated,
                  border: `1px solid ${qtyVerified ? C.success + '50' : C.border}`,
                  borderRadius: 8, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  color: qtyVerified ? C.success : C.text2,
                  fontSize: 12, fontFamily: 'Inter, sans-serif',
                }}
              >
                {qtyVerified ? <CheckCircle size={13} /> : <div style={{ width: 13, height: 13, borderRadius: '50%', border: `1px solid ${C.text3}` }} />}
                Quantity verified
              </button>
            </div>
          </div>
        </div>

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

        {/* Proof of Delivery Details */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, color: C.text2 }}>Receiver Name</p>
          <input
            value={receiverName}
            onChange={e => setReceiverName(e.target.value)}
            placeholder="Name of person receiving..."
            style={{ width: '100%', marginBottom: 10, padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.elevated, color: C.text }}
          />
          <p style={{ margin: '0 0 6px', fontSize: 12, color: C.text2 }}>Note (optional)</p>
          <textarea
            rows={2}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Any delivery notes or signature placeholder…"
            style={{ width: '100%', resize: 'none', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.elevated, color: C.text }}
          />
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
          disabled={!qtyVerified || submitting}
          onClick={handleConfirm}
        >
          {isOffline ? 'Save offline' : 'Confirm delivery'}
        </Btn>
      </div>
    </div>
  );
}

// ─── DR05 — Delivery Issue ─────────────────────────────────────────────────────
export function DeliveryIssue() {
  const { navigate, isOffline, selectedTripId, selectedStopId } = useApp();
  const [stops, setStops] = useState<DriverStop[]>([]);
  const [issueType, setIssueType] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectedTripId) getTripStops(selectedTripId).then(setStops);
  }, [selectedTripId]);

  const stop = stops.find(s => s.id === selectedStopId);

  const issues = [
    'Outlet closed',
    'Access blocked',
    'Damaged goods',
    'Quantity mismatch',
    'Unable to contact outlet',
    'Other',
  ];

  if (!stop) return <div style={{ padding: 20 }}>Loading...</div>;

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await reportIssue(stop.id, issueType, notes);
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

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
          <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 600, color: C.danger }}>{stop.outlet.id} — {stop.outlet.name}</p>
          <p style={{ margin: 0, fontSize: 11, color: C.text2 }}>{stop.order?.id}</p>
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
            style={{ width: '100%', resize: 'none', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.elevated, color: C.text }}
          />
        </div>
      </div>

      <div style={{ padding: '16px 20px', background: C.surface, borderTop: `1px solid ${C.border}` }}>
        <Btn
          variant="danger"
          fullWidth
          size="lg"
          disabled={!issueType || submitting}
          onClick={handleSubmit}
        >
          Submit issue
        </Btn>
      </div>
    </div>
  );
}
