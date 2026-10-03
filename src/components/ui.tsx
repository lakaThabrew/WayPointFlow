import type { ReactNode, CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';

// ─── Palette helpers ──────────────────────────────────────────────────────────
export const C = {
  bg: 'transparent',
  bgSolid: '#030508',
  surface: 'rgba(7, 11, 17, 0.75)',
  elevated: 'rgba(12, 18, 32, 0.90)',
  card: 'rgba(16, 24, 40, 0.70)',
  card2: 'rgba(22, 32, 51, 0.95)',
  border: 'rgba(255,255,255,0.06)',
  borderMd: 'rgba(255,255,255,0.12)',
  borderStrong: 'rgba(255,255,255,0.22)',
  accent: '#0ea5e9',
  accent2: '#38bdf8',
  accentDim: 'rgba(14, 165, 233, 0.10)',
  accentGlow: 'rgba(14, 165, 233, 0.20)',
  accentBright: '#7dd3fc',
  text: '#f1f5f9',
  text2: '#94a3b8',
  text3: '#64748b',
  textDisabled: '#475569',
  success: '#34d399',
  successDim: 'rgba(52, 211, 153, 0.10)',
  warning: '#fbbf24',
  warningDim: 'rgba(251, 191, 36, 0.10)',
  danger: '#f87171',
  dangerDim: 'rgba(248, 113, 113, 0.10)',
  info: '#38bdf8',
  infoDim: 'rgba(56, 189, 248, 0.10)',
  fresh: '#34d399',
  freshDim: 'rgba(52, 211, 153, 0.10)',
  style: '#c084fc',
  styleDim: 'rgba(192, 132, 252, 0.10)',
  tech: '#60a5fa',
  techDim: 'rgba(96, 165, 250, 0.10)',
  reefer: '#22d3ee',
  reeferDim: 'rgba(34, 211, 238, 0.10)',
  offline: '#64748b',
  violet: '#818cf8',
  violetDim: 'rgba(129, 140, 248, 0.10)',
  indigo: '#6366f1',
};

export const brandColor = (brand: string) =>
  brand === 'Fresh' ? C.fresh : brand === 'Style' ? C.style : C.tech;

export const brandDim = (brand: string) =>
  brand === 'Fresh' ? C.freshDim : brand === 'Style' ? C.styleDim : C.techDim;

export const statusColor = (status: string) => {
  switch (status) {
    case 'New': return C.text3;
    case 'Confirmed': return C.info;
    case 'Planned': return '#a78bfa';
    case 'Loading': return C.warning;
    case 'In Transit': return C.accent;
    case 'Delivered': return C.success;
    case 'At Risk': return C.danger;
    case 'Deferred': return '#fb7185';
    case 'Available': return C.success;
    case 'On Route': return C.accent;
    case 'On route': return C.accent;
    case 'Delayed': return C.danger;
    case 'Workshop': return C.offline;
    case 'Offline': return C.offline;
    default: return C.text2;
  }
};

// ─── Logistics Background System ──────────────────────────────────────────────
export type BgVariant = 'dashboard' | 'dispatch' | 'fleet' | 'analytics' | 'ai' | 'login' | 'offline' | 'default' | 'blue' | 'violet' | 'red';

interface NetworkNode {
  x: number; y: number; r: number;
  type: 'warehouse' | 'hub' | 'vehicle' | 'store';
  pulsePhase: number; pulseSpeed: number;
  color: string; glowColor: string;
  connections: number[];
}

interface NetworkParticle {
  routeIdx: number; t: number; speed: number;
  color: string; size: number; opacity: number;
}

interface FloatParticle {
  x: number; y: number; vx: number; vy: number;
  opacity: number; maxOpacity: number; fadeDir: number;
  size: number; color: string;
}

function buildNetwork(w: number, h: number, variant: BgVariant): { nodes: NetworkNode[]; routes: [number, number][] } {
  const isAI = variant === 'ai' || variant === 'analytics';
  const isOffline = variant === 'offline';
  const isLogin = variant === 'login';

  // Node count based on variant
  const warehouseCount = isAI ? 1 : isLogin ? 2 : 2;
  const hubCount = isAI ? 5 : isOffline ? 3 : isLogin ? 3 : 4;
  const vehicleCount = isAI ? 8 : isOffline ? 2 : isLogin ? 4 : 6;
  const storeCount = isAI ? 12 : isOffline ? 3 : isLogin ? 5 : 8;

  const nodeColors: Record<string, { color: string; glow: string }> = {
    warehouse: { color: '#0ea5e9', glow: 'rgba(14,165,233,0.5)' },
    hub:       { color: '#38bdf8', glow: 'rgba(56,189,248,0.4)' },
    vehicle:   { color: '#22d3ee', glow: 'rgba(34,211,238,0.45)' },
    store:     { color: '#818cf8', glow: 'rgba(129,140,248,0.35)' },
  };

  if (isOffline) {
    nodeColors.warehouse = { color: '#475569', glow: 'rgba(71,85,105,0.3)' };
    nodeColors.hub       = { color: '#475569', glow: 'rgba(71,85,105,0.25)' };
    nodeColors.vehicle   = { color: '#334155', glow: 'rgba(51,65,85,0.2)' };
    nodeColors.store     = { color: '#334155', glow: 'rgba(51,65,85,0.2)' };
  }
  if (isAI) {
    nodeColors.warehouse = { color: '#6366f1', glow: 'rgba(99,102,241,0.5)' };
    nodeColors.hub       = { color: '#818cf8', glow: 'rgba(129,140,248,0.45)' };
    nodeColors.vehicle   = { color: '#0ea5e9', glow: 'rgba(14,165,233,0.4)' };
    nodeColors.store     = { color: '#38bdf8', glow: 'rgba(56,189,248,0.35)' };
  }

  const nodes: NetworkNode[] = [];
  const addNode = (x: number, y: number, type: NetworkNode['type'], rBase: number) => {
    const nc = nodeColors[type];
    nodes.push({
      x: x * w, y: y * h,
      r: rBase + Math.random() * 2,
      type, color: nc.color, glowColor: nc.glow,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.4 + Math.random() * 0.6,
      connections: [],
    });
  };

  // Warehouses - large anchor nodes
  if (isAI) {
    addNode(0.5, 0.5, 'warehouse', 7);
  } else {
    addNode(0.18, 0.25, 'warehouse', 7);
    if (warehouseCount > 1) addNode(0.82, 0.70, 'warehouse', 6);
  }

  // Hubs
  const hubPositions = isAI
    ? [[0.25,0.2],[0.75,0.2],[0.85,0.55],[0.25,0.8],[0.75,0.8]]
    : [[0.42,0.18],[0.72,0.30],[0.30,0.60],[0.65,0.72],[0.85,0.25],[0.15,0.82]];
  for (let i = 0; i < hubCount; i++) {
    const [hx, hy] = hubPositions[i % hubPositions.length];
    const jitter = isAI ? 0 : 0.03;
    addNode(hx + (Math.random()-0.5)*jitter, hy + (Math.random()-0.5)*jitter, 'hub', 4);
  }

  // Vehicle nodes
  for (let i = 0; i < vehicleCount; i++) {
    addNode(0.08 + Math.random() * 0.84, 0.08 + Math.random() * 0.84, 'vehicle', 3);
  }

  // Store nodes
  for (let i = 0; i < storeCount; i++) {
    addNode(0.05 + Math.random() * 0.90, 0.05 + Math.random() * 0.90, 'store', 2);
  }

  // Build routes (connections)
  const routes: [number, number][] = [];
  const warehouseIdxs = nodes.map((n,i) => n.type === 'warehouse' ? i : -1).filter(i => i >= 0);
  const hubIdxs = nodes.map((n,i) => n.type === 'hub' ? i : -1).filter(i => i >= 0);
  const vehicleIdxs = nodes.map((n,i) => n.type === 'vehicle' ? i : -1).filter(i => i >= 0);
  const storeIdxs = nodes.map((n,i) => n.type === 'store' ? i : -1).filter(i => i >= 0);

  // Warehouse → hubs
  warehouseIdxs.forEach(wi => {
    hubIdxs.forEach(hi => {
      const dx = nodes[wi].x - nodes[hi].x;
      const dy = nodes[wi].y - nodes[hi].y;
      if (Math.sqrt(dx*dx+dy*dy) < w * 0.55) {
        routes.push([wi, hi]);
        nodes[wi].connections.push(hi);
      }
    });
  });

  // Hubs → vehicles / stores
  hubIdxs.forEach(hi => {
    const nearby = [...vehicleIdxs, ...storeIdxs]
      .map(ni => ({ ni, d: Math.hypot(nodes[hi].x-nodes[ni].x, nodes[hi].y-nodes[ni].y) }))
      .sort((a,b) => a.d - b.d)
      .slice(0, 3);
    nearby.forEach(({ ni }) => {
      routes.push([hi, ni]);
      nodes[hi].connections.push(ni);
    });
  });

  // AI: extra random connections for neural look
  if (isAI) {
    for (let i = 0; i < 10; i++) {
      const a = Math.floor(Math.random() * nodes.length);
      const b = Math.floor(Math.random() * nodes.length);
      if (a !== b) routes.push([a, b]);
    }
  }

  return { nodes, routes };
}

export function LogisticsBackground({ variant = 'dashboard' }: { variant?: BgVariant }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -999, y: -999 });
  const frameRef = useRef(0);
  const prefersReduced = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMouseMove);

    // Build network
    let { nodes, routes } = buildNetwork(canvas.width, canvas.height, variant);

    // Particles along routes
    const particles: NetworkParticle[] = [];
    const isOffline = variant === 'offline';
    const isAI = variant === 'ai' || variant === 'analytics';
    const particleCount = isOffline ? 4 : isAI ? 20 : 12;
    const particleColor = isAI ? '#818cf8' : isOffline ? '#334155' : '#38bdf8';

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        routeIdx: Math.floor(Math.random() * Math.max(routes.length, 1)),
        t: Math.random(),
        speed: (isOffline ? 0.0003 : 0.0008) + Math.random() * 0.0007,
        color: particleColor,
        size: 1.5 + Math.random() * 1.5,
        opacity: 0,
      });
    }

    // Floating ambient particles
    const floats: FloatParticle[] = [];
    const floatCount = isOffline ? 8 : isAI ? 25 : 18;
    const isMobile = window.innerWidth < 768;
    const effectiveFloats = isMobile ? Math.floor(floatCount * 0.5) : floatCount;
    for (let i = 0; i < effectiveFloats; i++) {
      floats.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        opacity: 0,
        maxOpacity: 0.15 + Math.random() * 0.2,
        fadeDir: Math.random() > 0.5 ? 1 : -1,
        size: 1 + Math.random() * 2,
        color: isAI
          ? (Math.random() > 0.5 ? '#818cf8' : '#6366f1')
          : isOffline ? '#334155'
          : (Math.random() > 0.5 ? '#0ea5e9' : '#22d3ee'),
      });
    }

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      time += prefersReduced.current ? 0 : 0.008;

      // Rebuild network on resize
      if (Math.abs(nodes[0]?.x - nodes[0]?.x * (w / w)) > 1) {
        const rebuilt = buildNetwork(w, h, variant);
        nodes = rebuilt.nodes;
      }

      // ── Layer 1: subtle technical grid ──────────────────────────────────
      const gridAlpha = isOffline ? 0.015 : isAI ? 0.025 : 0.018;
      ctx.strokeStyle = `rgba(14,165,233,${gridAlpha})`;
      ctx.lineWidth = 0.5;
      const gridSize = 40;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // AI mode: dot grid overlay
      if (isAI) {
        ctx.fillStyle = 'rgba(99,102,241,0.06)';
        for (let x = 20; x < w; x += 40) {
          for (let y = 20; y < h; y += 40) {
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // ── Layer 2: route lines ─────────────────────────────────────────────
      routes.forEach(([ai, bi]) => {
        const a = nodes[ai]; const b = nodes[bi];
        if (!a || !b) return;
        const dx = b.x - a.x; const dy = b.y - a.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // Subtle base line
        const lineAlpha = isOffline ? 0.06 : 0.10;
        ctx.strokeStyle = isAI
          ? `rgba(99,102,241,${lineAlpha})`
          : `rgba(14,165,233,${lineAlpha})`;
        ctx.lineWidth = 0.7;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated flowing line
        if (!isOffline && !prefersReduced.current) {
          const flowPhase = (time * 0.5 + ai * 0.3) % 1;
          const flowLen = 0.25;
          const startT = flowPhase - flowLen;
          const endT = flowPhase;
          if (endT > 0 && startT < 1) {
            const t0 = Math.max(0, startT);
            const t1 = Math.min(1, endT);
            const p0x = a.x + dx * t0; const p0y = a.y + dy * t0;
            const p1x = a.x + dx * t1; const p1y = a.y + dy * t1;
            const grad = ctx.createLinearGradient(p0x, p0y, p1x, p1y);
            const lineColor = isAI ? '99,102,241' : '14,165,233';
            grad.addColorStop(0, `rgba(${lineColor},0)`);
            grad.addColorStop(1, `rgba(${lineColor},0.35)`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p0x, p0y);
            ctx.lineTo(p1x, p1y);
            ctx.stroke();
          }
        }

        // Offline: disconnected pulse flash
        if (isOffline && Math.sin(time * 2 + ai) > 0.8) {
          ctx.strokeStyle = 'rgba(251,191,36,0.15)';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(a.x + dx * 0.3, a.y + dy * 0.3);
          ctx.stroke();
        }
      });

      // ── Layer 3: nodes ───────────────────────────────────────────────────
      nodes.forEach((node, i) => {
        const pulse = Math.sin(time * node.pulseSpeed + node.pulsePhase);
        const glowR = node.r * (2.5 + pulse * 0.8);
        const mouseD = Math.hypot(mouseRef.current.x - node.x, mouseRef.current.y - node.y);
        const mouseBoost = Math.max(0, 1 - mouseD / 200) * 0.4;

        // Glow halo
        const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowR * 2.5 + mouseBoost * 30);
        glow.addColorStop(0, node.glowColor.replace(/[\d.]+\)$/, `${0.35 + mouseBoost})`));
        glow.addColorStop(1, node.glowColor.replace(/[\d.]+\)$/, '0)'));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowR * 2.5 + mouseBoost * 30, 0, Math.PI * 2);
        ctx.fill();

        // Pulse ring (warehouse + hub only)
        if ((node.type === 'warehouse' || node.type === 'hub') && !prefersReduced.current) {
          const ringR = node.r * (3 + Math.abs(pulse) * 2);
          const ringAlpha = (0.3 - Math.abs(pulse) * 0.25) * (isOffline ? 0.3 : 1);
          ctx.strokeStyle = node.color.replace('#', 'rgba(').replace(/([0-9a-f]{2})/gi, (m) => parseInt(m, 16) + ',').slice(0,-1) + `${ringAlpha})`;
          // simpler approach:
          ctx.strokeStyle = isOffline
            ? `rgba(71,85,105,${ringAlpha})`
            : isAI ? `rgba(99,102,241,${ringAlpha})`
            : `rgba(14,165,233,${ringAlpha})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(node.x, node.y, ringR, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Core dot
        const coreAlpha = isOffline ? 0.45 : (0.8 + pulse * 0.2);
        ctx.fillStyle = node.color;
        ctx.globalAlpha = coreAlpha;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r * (1 + pulse * 0.15), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Inner bright highlight
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.4 + pulse * 0.1;
        ctx.beginPath();
        ctx.arc(node.x - node.r * 0.25, node.y - node.r * 0.25, node.r * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // ── Layer 4: route particles ─────────────────────────────────────────
      if (!prefersReduced.current && !isOffline) {
        particles.forEach(p => {
          if (p.routeIdx >= routes.length) { p.routeIdx = 0; return; }
          const [ai, bi] = routes[p.routeIdx];
          const a = nodes[ai]; const b = nodes[bi];
          if (!a || !b) return;

          p.t += p.speed;
          if (p.t > 1) {
            p.t = 0;
            p.routeIdx = Math.floor(Math.random() * routes.length);
          }

          const px = a.x + (b.x - a.x) * p.t;
          const py = a.y + (b.y - a.y) * p.t;

          // Fade in at start, fade out at end
          const edgeFade = p.t < 0.1 ? p.t / 0.1 : p.t > 0.9 ? (1 - p.t) / 0.1 : 1;
          const alpha = edgeFade * 0.8;

          // Particle glow
          const pGlow = ctx.createRadialGradient(px, py, 0, px, py, p.size * 4);
          const pc = isAI ? '129,140,248' : '56,189,248';
          pGlow.addColorStop(0, `rgba(${pc},${alpha * 0.6})`);
          pGlow.addColorStop(1, `rgba(${pc},0)`);
          ctx.fillStyle = pGlow;
          ctx.beginPath();
          ctx.arc(px, py, p.size * 4, 0, Math.PI * 2);
          ctx.fill();

          // Core particle
          ctx.fillStyle = `rgba(${pc},${alpha})`;
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // ── Layer 5: floating ambient particles ─────────────────────────────
      if (!prefersReduced.current) {
        floats.forEach(fp => {
          fp.x += fp.vx; fp.y += fp.vy;
          fp.opacity += fp.fadeDir * 0.002;
          if (fp.opacity > fp.maxOpacity) fp.fadeDir = -1;
          if (fp.opacity < 0) {
            fp.fadeDir = 1;
            fp.x = Math.random() * canvas.width;
            fp.y = Math.random() * canvas.height;
          }
          // Wrap
          if (fp.x < 0) fp.x = canvas.width;
          if (fp.x > canvas.width) fp.x = 0;
          if (fp.y < 0) fp.y = canvas.height;
          if (fp.y > canvas.height) fp.y = 0;

          ctx.fillStyle = fp.color;
          ctx.globalAlpha = Math.max(0, fp.opacity);
          ctx.beginPath();
          ctx.arc(fp.x, fp.y, fp.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        });
      }

      // ── Layer 6: mouse glow ──────────────────────────────────────────────
      if (!prefersReduced.current && mouseRef.current.x > 0) {
        const mx = mouseRef.current.x; const my = mouseRef.current.y;
        const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 180);
        const mc = isAI ? '99,102,241' : isOffline ? '71,85,105' : '14,165,233';
        mg.addColorStop(0, `rgba(${mc},0.05)`);
        mg.addColorStop(1, `rgba(${mc},0)`);
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.arc(mx, my, 180, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
      frameRef.current = animId;
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [variant]);

  // Palette for CSS layers
  const isOffline = variant === 'offline';
  const isAI = variant === 'ai' || variant === 'analytics';
  const isLogin = variant === 'login';
  const isFleet = variant === 'fleet';
  const isDispatch = variant === 'dispatch';

  const baseBg = isOffline
    ? '#020407'
    : isAI ? '#050711'
    : '#030608';

  const ambientColors = isOffline
    ? ['rgba(71,85,105,0.06)', 'rgba(51,65,85,0.04)', 'rgba(30,41,59,0.03)']
    : isAI
    ? ['rgba(99,102,241,0.12)', 'rgba(129,140,248,0.08)', 'rgba(56,189,248,0.06)']
    : isFleet
    ? ['rgba(34,211,238,0.10)', 'rgba(14,165,233,0.07)', 'rgba(99,102,241,0.04)']
    : isDispatch
    ? ['rgba(14,165,233,0.10)', 'rgba(34,211,238,0.06)', 'rgba(99,102,241,0.05)']
    : isLogin
    ? ['rgba(14,165,233,0.15)', 'rgba(56,189,248,0.09)', 'rgba(99,102,241,0.06)']
    : ['rgba(14,165,233,0.09)', 'rgba(34,211,238,0.05)', 'rgba(99,102,241,0.04)'];

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden', background: baseBg }}>
      {/* Layer 1: ambient radial gradients */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse 70% 55% at 12% 5%, ${ambientColors[0]} 0%, transparent 65%),
          radial-gradient(ellipse 55% 45% at 88% 92%, ${ambientColors[1]} 0%, transparent 60%),
          radial-gradient(ellipse 40% 50% at 55% 45%, ${ambientColors[2]} 0%, transparent 70%)
        `,
      }} />

      {/* Layer 2: slowly drifting ambient orbs */}
      <div className="logistics-orb-1" style={{
        position: 'absolute', top: '-8%', left: '-3%',
        width: '48%', height: '50%',
        background: `radial-gradient(ellipse, ${ambientColors[0]} 0%, transparent 70%)`,
        borderRadius: '50%',
      }} />
      <div className="logistics-orb-2" style={{
        position: 'absolute', bottom: '-12%', right: '-8%',
        width: '44%', height: '52%',
        background: `radial-gradient(ellipse, ${ambientColors[1]} 0%, transparent 70%)`,
        borderRadius: '50%',
      }} />
      <div className="logistics-orb-3" style={{
        position: 'absolute', top: '35%', left: '38%',
        width: '38%', height: '42%',
        background: `radial-gradient(ellipse, ${ambientColors[2]} 0%, transparent 70%)`,
        borderRadius: '50%',
      }} />

      {/* Layer 3: animated ambient light sweep */}
      <div className="logistics-sweep" style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(135deg,
          transparent 0%,
          ${ambientColors[0].replace(/[\d.]+\)$/, '0.04)')} 30%,
          transparent 60%,
          ${ambientColors[1].replace(/[\d.]+\)$/, '0.03)')} 80%,
          transparent 100%
        )`,
      }} />

      {/* Layer 4: canvas – network + particles */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: isOffline ? 0.5 : 0.85 }}
      />

      {/* Layer 5: vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 85% 85% at 50% 50%, transparent 50%, rgba(2,4,8,0.55) 100%)',
      }} />

      {/* Layer 6: offline disrupted signal effect */}
      {isOffline && (
        <div className="offline-static" style={{
          position: 'absolute', inset: 0,
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(251,191,36,0.012) 3px,
            rgba(251,191,36,0.012) 4px
          )`,
        }} />
      )}
    </div>
  );
}

// Keep AmbientBackground as alias for backward compat
export function AmbientBackground({ variant = 'default' }: { variant?: 'default' | 'blue' | 'violet' | 'red' }) {
  const map: Record<string, BgVariant> = {
    default: 'dashboard', blue: 'dispatch', violet: 'ai', red: 'default',
  };
  return <LogisticsBackground variant={map[variant] ?? 'dashboard'} />;
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
export function AnimatedNumber({ value, duration = 1200, suffix = '' }: {
  value: number | string; duration?: number; suffix?: string;
}) {
  const [display, setDisplay] = useState<number | string>(0);
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
  const isNumeric = !isNaN(numericValue);

  useEffect(() => {
    if (!isNumeric) { setDisplay(value); return; }
    let start = 0;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (numericValue - start) * eased);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [numericValue, duration, isNumeric, value]);

  return <>{isNumeric ? display : value}{suffix}</>;
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
export function Sparkline({ data, color = C.accent, height = 28, width = 64 }: {
  data: number[]; color?: string; height?: number; width?: number;
}) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`).join(' ');

  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`${pts} ${(data.length-1)*step},${height} 0,${height}`}
        fill={`url(#sg-${color.replace('#','')})`}
        stroke="none"
      />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      <circle
        cx={(data.length - 1) * step}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="2.5"
        fill={color}
        stroke="rgba(3,5,8,0.8)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

// ─── Trend Indicator ──────────────────────────────────────────────────────────
export function TrendIndicator({ value, positive = true }: { value: string; positive?: boolean }) {
  const isPositive = positive;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 11, fontWeight: 600,
      color: isPositive ? C.success : C.danger,
      background: isPositive ? C.successDim : C.dangerDim,
      padding: '2px 7px', borderRadius: 20,
      border: `1px solid ${isPositive ? C.success : C.danger}25`,
    }}>
      <span style={{ fontSize: 9 }}>{isPositive ? '▲' : '▼'}</span>
      {value}
    </span>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  accent?: string;
  glow?: boolean;
}

export function Card({ children, style, className = '', onClick, hover, accent, glow }: CardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      className={className}
      onMouseEnter={() => (hover || onClick) && setHovered(true)}
      onMouseLeave={() => (hover || onClick) && setHovered(false)}
      style={{
        background: hovered ? C.card2 : C.card,
        border: `1px solid ${hovered ? C.borderMd : C.border}`,
        borderRadius: 16,
        padding: 20,
        boxShadow: hovered
          ? `0 16px 40px rgba(0,0,0,0.25), 0 0 0 1px ${accent ? accent + '20' : 'rgba(14,165,233,0.08)'}`
          : `0 4px 20px rgba(0,0,0,0.12)`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        cursor: onClick ? 'pointer' : undefined,
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered && (hover || onClick) ? 'translateY(-3px)' : 'translateY(0)',
        borderLeft: accent ? `3px solid ${accent}` : undefined,
        ...(glow && { boxShadow: `0 0 30px ${C.accentGlow}, 0 4px 20px rgba(0,0,0,0.15)` }),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: ReactNode;
  color?: string;
  bg?: string;
  dot?: boolean;
  style?: CSSProperties;
  pulse?: boolean;
}

export function Badge({ children, color = C.text2, bg, dot, style, pulse }: BadgeProps) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.03em',
      color, background: bg || `${color}16`,
      border: `1px solid ${color}28`,
      ...style,
    }}>
      {dot && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0,
          boxShadow: `0 0 6px ${color}80`,
        }} className={pulse ? 'pulse-dot' : ''} />
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const color = statusColor(status);
  const isActive = ['In Transit', 'On Route', 'On route', 'Loading'].includes(status);
  return <Badge color={color} dot pulse={isActive}>{status}</Badge>;
}

export function BrandBadge({ brand }: { brand: string }) {
  const color = brandColor(brand);
  return <Badge color={color} bg={brandDim(brand)}>{brand}</Badge>;
}

export function TempBadge({ temp }: { temp: string }) {
  const color = temp === 'Chilled' ? C.reefer : temp === 'Frozen' ? '#818cf8' : C.text2;
  return (
    <Badge color={color}>
      {temp === 'Chilled' ? '❄ Chilled' : temp === 'Frozen' ? '🧊 Frozen' : '○ Ambient'}
    </Badge>
  );
}

export function VehicleBadge({ id, reefer }: { id: string; reefer?: boolean }) {
  return (
    <Badge color={reefer ? C.reefer : C.text2}>
      {reefer ? '🚛❄' : '🚛'} {id}
    </Badge>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
interface BtnProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'text' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  loading?: boolean;
  style?: CSSProperties;
}

export function Btn({ children, onClick, variant = 'primary', size = 'md', fullWidth, disabled, icon, loading, style }: BtnProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const sizes = { sm: '7px 14px', md: '10px 20px', lg: '13px 28px' };
  const fontSizes = { sm: 12, md: 13, lg: 14 };
  const radii = { sm: 9, md: 11, lg: 12 };

  const variantStyles: Record<string, CSSProperties & { _hover?: CSSProperties }> = {
    primary: {
      background: hovered
        ? 'linear-gradient(135deg, #0369a1, #0284c7)'
        : 'linear-gradient(135deg, #0284c7, #0ea5e9)',
      color: '#ffffff', fontWeight: 600, border: 'none',
      boxShadow: hovered
        ? '0 8px 25px rgba(14, 165, 233, 0.4), 0 0 0 1px rgba(14,165,233,0.3)'
        : '0 4px 15px rgba(14, 165, 233, 0.25)',
    },
    secondary: {
      background: hovered ? C.elevated : C.card2,
      color: C.text, border: `1px solid ${hovered ? C.borderStrong : C.borderMd}`, fontWeight: 500,
    },
    ghost: {
      background: hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
      color: hovered ? C.text : C.text2, border: `1px solid ${hovered ? C.borderMd : 'transparent'}`, fontWeight: 500,
    },
    danger: {
      background: hovered ? 'rgba(248,113,113,0.18)' : C.dangerDim,
      color: C.danger, border: `1px solid ${hovered ? 'rgba(248,113,113,0.4)' : 'rgba(248,113,113,0.25)'}`, fontWeight: 600,
    },
    success: {
      background: hovered ? 'rgba(52,211,153,0.18)' : C.successDim,
      color: C.success, border: `1px solid ${hovered ? 'rgba(52,211,153,0.4)' : 'rgba(52,211,153,0.25)'}`, fontWeight: 600,
    },
    text: { background: 'transparent', color: hovered ? C.accent2 : C.accent, fontWeight: 500, padding: '0', border: 'none' },
  };

  const vs = variantStyles[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: variant === 'text' ? '0' : sizes[size],
        borderRadius: radii[size],
        cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
        fontSize: fontSizes[size], fontFamily: 'Inter, sans-serif',
        width: fullWidth ? '100%' : undefined,
        justifyContent: fullWidth ? 'center' : undefined,
        opacity: disabled ? 0.45 : 1,
        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: pressed ? 'scale(0.97)' : hovered && variant === 'primary' ? 'translateY(-1px)' : 'none',
        letterSpacing: '-0.01em',
        ...vs,
        ...style,
      }}
    >
      {loading ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="spin-slow">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : icon}
      {children}
    </button>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, action, subtitle }: { title: string; action?: ReactNode; subtitle?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>{title}</h3>
        {subtitle && <p style={{ margin: '3px 0 0', fontSize: 12, color: C.text3 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  icon?: ReactNode;
  alert?: boolean;
  trend?: string;
  trendUp?: boolean;
  sparkData?: number[];
}

export function KpiCard({ label, value, sub, accent = C.accent, icon, alert, trend, trendUp, sparkData }: KpiProps) {
  const [hovered, setHovered] = useState(false);
  const accentColor = alert ? C.danger : accent;
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: `linear-gradient(145deg, ${C.card}, rgba(22,32,51,0.8))`,
        border: `1px solid ${hovered ? accentColor + '30' : (alert ? C.danger + '35' : C.border)}`,
        borderRadius: 16, padding: '18px 20px',
        borderTop: `2px solid ${accentColor}`,
        boxShadow: hovered
          ? `0 12px 30px rgba(0,0,0,0.2), 0 0 0 1px ${accentColor}20`
          : '0 4px 20px rgba(0,0,0,0.1)',
        position: 'relative', overflow: 'hidden',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Radial glow */}
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 100, height: 100,
        background: accentColor, filter: 'blur(50px)',
        opacity: hovered ? 0.18 : 0.1, borderRadius: '50%', pointerEvents: 'none',
        transition: 'opacity 0.3s',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <div style={{ flex: 1 }}>
          <p style={{
            margin: 0, fontSize: 10, fontWeight: 700, color: C.text3,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>{label}</p>
          <p style={{
            margin: '8px 0 0', fontSize: 30, fontWeight: 800,
            color: alert ? C.danger : C.text,
            fontFamily: 'JetBrains Mono, monospace', lineHeight: 1,
            letterSpacing: '-0.02em',
          }}>
            {!isNaN(numValue) ? <AnimatedNumber value={numValue} /> : value}
          </p>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            {sub && <p style={{ margin: 0, fontSize: 11, color: C.text3 }}>{sub}</p>}
            {trend && <TrendIndicator value={trend} positive={trendUp !== false} />}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          {icon && <div style={{ color: alert ? C.danger : accentColor, opacity: 0.8 }}>{icon}</div>}
          {sparkData && <Sparkline data={sparkData} color={accentColor} />}
        </div>
      </div>
    </div>
  );
}

// ─── Capacity Bar ─────────────────────────────────────────────────────────────
export function CapacityBar({ label, used, max, unit, color = C.accent }: {
  label: string; used: number; max: number; unit: string; color?: string;
}) {
  const pct = Math.min(100, (used / max) * 100);
  const isHigh = pct > 85;
  const isDanger = pct > 95;
  const c = isDanger ? C.danger : isHigh ? C.warning : color;

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
        <span style={{ fontSize: 12, color: C.text2, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: isDanger ? C.danger : isHigh ? C.warning : C.text3, fontWeight: 600 }}>
          {used.toLocaleString()} / {max.toLocaleString()} {unit}
        </span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${c}cc, ${c})`,
          borderRadius: 3,
          boxShadow: `0 0 8px ${c}50`,
          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }} className="progress-fill" />
      </div>
    </div>
  );
}

// ─── Alert Card ───────────────────────────────────────────────────────────────
interface AlertCardProps {
  title: string;
  desc: string;
  type?: 'critical' | 'warning' | 'info' | 'operational' | 'success';
  action?: ReactNode;
  time?: string;
}

export function AlertCard({ title, desc, type = 'warning', action, time }: AlertCardProps) {
  const [hovered, setHovered] = useState(false);
  const colors = { critical: C.danger, warning: C.warning, info: C.accent, operational: C.text2, success: C.success };
  const icons: Record<string, string> = { critical: '🔴', warning: '🟠', info: '🔵', operational: '⚪', success: '🟢' };
  const c = colors[type];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={type === 'critical' ? 'priority-glow' : ''}
      style={{
        background: `linear-gradient(to right, ${c}12, ${C.card})`,
        border: `1px solid ${c}${hovered ? '40' : '25'}`,
        borderLeft: `3px solid ${c}`,
        borderRadius: 12, padding: '14px 16px',
        boxShadow: hovered ? `0 8px 24px rgba(0,0,0,0.15), 0 0 20px ${c}10` : `0 2px 10px rgba(0,0,0,0.08)`,
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-1px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>{icons[type]}</span>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text, letterSpacing: '-0.01em' }}>{title}</p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: C.text2, lineHeight: 1.4 }}>{desc}</p>
          </div>
        </div>
        {time && <span style={{ fontSize: 10, color: C.text3, marginLeft: 12, whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace' }}>{time}</span>}
      </div>
      {action && <div style={{ marginTop: 10 }}>{action}</div>}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({ headers, children, style }: { headers: string[]; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      overflowX: 'auto',
      background: C.card, borderRadius: 16,
      border: `1px solid ${C.border}`,
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      ...style,
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'rgba(12, 18, 32, 0.8)' }}>
            {headers.map(h => (
              <th key={h} style={{
                padding: '13px 16px', textAlign: 'left',
                color: C.text3, fontWeight: 700, fontSize: 10,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                borderBottom: `1px solid ${C.borderMd}`, whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

interface TableRowProps {
  cells: ReactNode[];
  onClick?: () => void;
  highlight?: boolean;
}

export function TableRow({ cells, onClick, highlight }: TableRowProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: onClick ? 'pointer' : undefined,
        transition: 'background 0.15s ease',
        background: hovered
          ? 'rgba(14, 165, 233, 0.04)'
          : highlight ? 'rgba(251,191,36,0.04)' : 'transparent',
      }}
    >
      {cells.map((cell, i) => (
        <td key={i} style={{
          padding: '13px 16px', borderBottom: `1px solid ${C.border}`,
          verticalAlign: 'middle', color: C.text,
          fontSize: 13,
        }}>
          {cell}
        </td>
      ))}
    </tr>
  );
}

// ─── Label ────────────────────────────────────────────────────────────────────
export function Label({ children }: { children: ReactNode }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
      {children}
    </span>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
export function InfoRow({ label, value, mono, accent }: { label: string; value: ReactNode; mono?: boolean; accent?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: `1px solid ${C.border}`,
    }}>
      <span style={{ fontSize: 12, color: C.text3 }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: 500,
        color: accent ? C.accent : C.text,
        fontFamily: mono ? 'JetBrains Mono, monospace' : undefined,
      }}>{value}</span>
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
interface TimelineStep {
  label: string;
  time?: string;
  status: 'done' | 'active' | 'pending';
  note?: string;
}

export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div style={{ position: 'relative', paddingLeft: 8 }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: 12, height: 12, borderRadius: '50%', flexShrink: 0, marginTop: 4,
              background: step.status === 'done' ? C.success : step.status === 'active' ? C.accent : 'rgba(100,116,139,0.3)',
              boxShadow: step.status === 'active' ? `0 0 16px ${C.accent}60` : step.status === 'done' ? `0 0 10px ${C.success}40` : undefined,
              border: step.status === 'pending' ? `2px solid ${C.text3}40` : 'none',
              zIndex: 1, transition: 'all 0.3s',
            }} className={step.status === 'active' ? 'pulse-dot' : ''} />
            {i < steps.length - 1 && (
              <div style={{
                width: 2, flex: 1, minHeight: 32,
                background: step.status === 'done'
                  ? `linear-gradient(to bottom, ${C.success}50, ${C.success}20)`
                  : C.border,
                marginTop: 4, marginBottom: 4,
              }} />
            )}
          </div>
          <div style={{ paddingBottom: i < steps.length - 1 ? 20 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                fontSize: 13, fontWeight: step.status === 'active' ? 700 : 500,
                color: step.status === 'pending' ? C.text3 : step.status === 'active' ? C.text : C.text2,
              }}>{step.label}</span>
              {step.time && <span style={{ fontSize: 11, color: C.text3, fontFamily: 'JetBrains Mono, monospace' }}>{step.time}</span>}
            </div>
            {step.note && <p style={{ margin: '4px 0 0', fontSize: 12, color: C.text2 }}>{step.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Offline Banner ───────────────────────────────────────────────────────────
export function OfflineBanner({ synced }: { synced?: string }) {
  return (
    <div style={{
      background: `${C.warning}12`, border: `1px solid ${C.warning}30`,
      borderRadius: 10, padding: '10px 14px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span className="status-dot warning" />
      <div>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.warning }}>Offline Mode Active</span>
        {synced && <span style={{ fontSize: 11, color: C.text2, marginLeft: 8 }}>Last synced {synced}</span>}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, desc }: { icon?: ReactNode; title: string; desc?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 20px', color: C.text3 }}>
      {icon && (
        <div style={{
          marginBottom: 20, opacity: 0.3,
          display: 'flex', justifyContent: 'center',
        }}>
          {icon}
        </div>
      )}
      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.text2 }}>{title}</p>
      {desc && <p style={{ margin: '6px 0 0', fontSize: 13, color: C.text3 }}>{desc}</p>}
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
export function Divider({ style }: { style?: CSSProperties }) {
  return <div style={{ height: 1, background: C.border, margin: '14px 0', ...style }} />;
}

// ─── Input Field ──────────────────────────────────────────────────────────────
export function Field({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', marginBottom: 7, fontSize: 12, fontWeight: 600, color: C.text2, letterSpacing: '0.01em' }}>
        {label}{required && <span style={{ color: C.danger, marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Constraint Tag ───────────────────────────────────────────────────────────
export function ConstraintTag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
      background: ok ? C.successDim : C.dangerDim,
      borderRadius: 8, border: `1px solid ${ok ? C.success : C.danger}20`,
      marginBottom: 4,
    }}>
      <span style={{
        fontSize: 11, color: ok ? C.success : C.danger,
        fontWeight: 700, width: 14, textAlign: 'center',
      }}>{ok ? '✓' : '✗'}</span>
      <span style={{ fontSize: 12, color: ok ? C.text : C.danger }}>{label}</span>
    </div>
  );
}

// ─── Section Pill ─────────────────────────────────────────────────────────────
export function Pill({ children, active, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '6px 14px', borderRadius: 20,
        border: `1px solid ${active ? C.accent : hovered ? C.borderMd : C.border}`,
        background: active ? C.accentDim : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        color: active ? C.accent : hovered ? C.text : C.text2,
        fontSize: 12, fontWeight: active ? 600 : 500, cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
        transition: 'all 0.15s ease',
        boxShadow: active ? `0 0 10px ${C.accent}20` : 'none',
      }}
    >
      {children}
    </button>
  );
}

// ─── Mono Span ────────────────────────────────────────────────────────────────
export function Mono({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: color || C.text2 }}>
      {children}
    </span>
  );
}

// ─── Status Dot (standalone) ──────────────────────────────────────────────────
export function StatusDot({ status }: { status: 'active' | 'warning' | 'danger' | 'offline' }) {
  return <span className={`status-dot ${status}`} />;
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
export function SkeletonLine({ width = '100%', height = 14, style }: { width?: string | number; height?: number; style?: CSSProperties }) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius: 6, ...style }} />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ padding: 20, background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
      <SkeletonLine width="60%" height={16} style={{ marginBottom: 12 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 ? '40%' : '100%'} style={{ marginBottom: 8 }} />
      ))}
    </div>
  );
}

// ─── AI Status Badge ──────────────────────────────────────────────────────────
export function AiBadge({ state = 'idle' }: { state?: 'analyzing' | 'ready' | 'idle' }) {
  const configs = {
    analyzing: { label: 'AI ANALYZING', color: C.accent, pulse: true },
    ready: { label: 'PLAN READY', color: C.success, pulse: false },
    idle: { label: 'AI STANDBY', color: C.text3, pulse: false },
  };
  const config = configs[state];

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '6px 14px', borderRadius: 20,
      background: `${config.color}12`,
      border: `1px solid ${config.color}30`,
    }} className={config.pulse ? 'ai-pulse' : ''}>
      <span className={`status-dot ${config.pulse ? 'active' : state === 'ready' ? 'active' : 'offline'}`}
        style={{ background: config.color, boxShadow: `0 0 6px ${config.color}60` }} />
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: config.color }}>
        {config.label}
      </span>
    </div>
  );
}

// ─── Connection Status ────────────────────────────────────────────────────────
export function ConnectionStatus({ online }: { online: boolean }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 20,
      background: online ? C.successDim : C.warningDim,
      border: `1px solid ${online ? C.success : C.warning}30`,
    }}>
      <span className={`status-dot ${online ? 'active' : 'warning'}`} />
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: online ? C.success : C.warning }}>
        {online ? 'LIVE' : 'OFFLINE'}
      </span>
    </div>
  );
}

// ─── Metric Row ───────────────────────────────────────────────────────────────
export function MetricRow({ label, value, color, max }: { label: string; value: string | number; color?: string; max?: number }) {
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: C.text3 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {max && (
          <div style={{ width: 64, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${(num / max) * 100}%`,
              background: color || C.accent, borderRadius: 2,
              transition: 'width 0.5s ease',
            }} />
          </div>
        )}
        <span style={{ fontSize: 13, fontWeight: 600, color: color || C.text, fontFamily: 'JetBrains Mono, monospace', minWidth: 40, textAlign: 'right' }}>
          {value}
        </span>
      </div>
    </div>
  );
}

// ─── Loading & Empty States ───────────────────────────────────────────────────

export function Spinner({ size = 24, color = C.accent }: { size?: number; color?: string }) {
  return (
    <div
      className="spin-slow"
      style={{
        width: size, height: size,
        border: `2px solid ${color}30`,
        borderTopColor: color,
        borderRadius: '50%',
        display: 'inline-block'
      }}
    />
  );
}

export function EmptyState({ icon: Icon, title, desc, action }: { icon: any; title: string; desc: string; action?: ReactNode }) {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: 48, height: 48, borderRadius: 24, background: C.elevated, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Icon size={24} color={C.text3} />
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: C.text }}>{title}</h3>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: C.text2, maxWidth: 300 }}>{desc}</p>
      {action}
    </div>
  );
}
