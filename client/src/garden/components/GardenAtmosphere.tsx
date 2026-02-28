import { useRef, useEffect, type RefObject } from 'react';
import { motion } from 'framer-motion';

// ─── Internal palette (used by vine/firefly components) ───────────────────────
const G = {
  sage:      '#6B8F71',
  sageLight: '#A8C4AB',
  rose:      '#C4848C',
  roseLight: '#E8B4B8',
  gold:      '#B8924A',
  goldDim:   'rgba(184,146,74,0.45)',
};

// ─── Floating Petals ──────────────────────────────────────────────────────────
// Petal animation names are defined as @keyframes in index.css
const PETAL_ANIMS = ['gdn-petal-1', 'gdn-petal-2', 'gdn-petal-3', 'gdn-petal-4'];

export interface PetalDef {
  left: string;
  delay: number;
  duration: number;
  size: number;
  color: string;
  anim: string;
}

export function generatePetals(count: number, colors: string[]): PetalDef[] {
  return Array.from({ length: count }, (_, i) => ({
    left:     `${(i * 97 + 7) % 100}%`,
    delay:    (i * 1.3) % 9,
    duration: 7 + (i * 1.7) % 8,
    size:     8 + (i * 3) % 12,
    color:    colors[i % colors.length],
    anim:     PETAL_ANIMS[i % PETAL_ANIMS.length],
  }));
}

function PetalSVG({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 20 28" fill="none" aria-hidden="true">
      <ellipse cx="10" cy="14" rx="7" ry="12" fill={color} opacity="0.75" transform="rotate(-15 10 14)" />
    </svg>
  );
}

export function FloatingPetals({ petals }: { petals: PetalDef[] }) {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 2 }}
    >
      {petals.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '-5%',
            left: p.left,
            animation: `${p.anim} ${p.duration}s ${p.delay}s ease-in infinite`,
            opacity: 0,
          }}
        >
          <PetalSVG size={p.size} color={p.color} />
        </div>
      ))}
    </div>
  );
}

// ─── Botanical vine corners ───────────────────────────────────────────────────
export function VineCornerTL({ inView }: { inView: boolean }) {
  return (
    <svg
      width="160" height="160" viewBox="0 0 160 160"
      style={{ position: 'absolute', top: 0, left: 0, width: 'min(160px, 25vw)', height: 'min(160px, 25vw)' }}
      aria-hidden="true"
    >
      <motion.path
        d="M8 8 C 20 30, 15 60, 30 90 C 45 120, 60 130, 80 140"
        fill="none" stroke={G.sage} strokeWidth="1.5" strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={inView ? { pathLength: 1, opacity: 0.7 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d="M20 40 C 35 30, 50 28, 60 20"
        fill="none" stroke={G.sage} strokeWidth="1" strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={inView ? { pathLength: 1, opacity: 0.6 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 1.1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d="M28 65 C 45 55, 60 50, 75 45"
        fill="none" stroke={G.sage} strokeWidth="1" strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={inView ? { pathLength: 1, opacity: 0.6 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 1.0, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
      {[
        { d: 'M60 20 C 55 12, 68 10, 65 18 Z', delay: 1.2 },
        { d: 'M75 45 C 72 37, 84 38, 80 46 Z', delay: 1.5 },
        { d: 'M30 90 C 20 84, 22 74, 32 80 Z', delay: 1.0 },
      ].map((leaf, i) => (
        <motion.path
          key={i}
          d={leaf.d}
          fill={G.sage}
          initial={{ opacity: 0, scale: 0 }}
          animate={inView ? { opacity: 0.65, scale: 1 } : { opacity: 0, scale: 0 }}
          transition={{ duration: 0.5, delay: leaf.delay }}
          style={{ transformOrigin: 'center' }}
        />
      ))}
      <motion.circle
        cx="62" cy="19" r="4"
        fill={G.rose}
        initial={{ opacity: 0, scale: 0 }}
        animate={inView ? { opacity: 0.8, scale: 1 } : { opacity: 0, scale: 0 }}
        transition={{ duration: 0.5, delay: 1.4, type: 'spring' }}
      />
    </svg>
  );
}

export function VineCornerBR({ inView }: { inView: boolean }) {
  return (
    <svg
      width="160" height="160" viewBox="0 0 160 160"
      style={{
        position: 'absolute', bottom: 0, right: 0,
        transform: 'rotate(180deg)',
        width: 'min(160px, 25vw)', height: 'min(160px, 25vw)',
      }}
      aria-hidden="true"
    >
      <motion.path
        d="M8 8 C 20 30, 15 60, 30 90 C 45 120, 60 130, 80 140"
        fill="none" stroke={G.sage} strokeWidth="1.5" strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={inView ? { pathLength: 1, opacity: 0.7 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 1.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d="M20 40 C 35 30, 50 28, 60 20"
        fill="none" stroke={G.sage} strokeWidth="1" strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={inView ? { pathLength: 1, opacity: 0.6 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 1.1, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d="M28 65 C 45 55, 60 50, 75 45"
        fill="none" stroke={G.sageLight} strokeWidth="1" strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={inView ? { pathLength: 1, opacity: 0.55 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 1.0, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
      />
      {[
        { d: 'M60 20 C 55 12, 68 10, 65 18 Z', delay: 1.3 },
        { d: 'M75 45 C 72 37, 84 38, 80 46 Z', delay: 1.6 },
      ].map((leaf, i) => (
        <motion.path
          key={i}
          d={leaf.d}
          fill={G.sageLight}
          initial={{ opacity: 0, scale: 0 }}
          animate={inView ? { opacity: 0.6, scale: 1 } : { opacity: 0, scale: 0 }}
          transition={{ duration: 0.5, delay: leaf.delay }}
          style={{ transformOrigin: 'center' }}
        />
      ))}
      <motion.circle
        cx="62" cy="19" r="3.5"
        fill={G.roseLight}
        initial={{ opacity: 0, scale: 0 }}
        animate={inView ? { opacity: 0.75, scale: 1 } : { opacity: 0, scale: 0 }}
        transition={{ duration: 0.5, delay: 1.5, type: 'spring' }}
      />
    </svg>
  );
}

// ─── Firefly particle system ──────────────────────────────────────────────────
export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number; opacity: number;
  color: string; glowR: number;
  layer: 0 | 1 | 2;
}

export const FF_LAYERS = [
  { count: 22, rMin: 0.35, rMax: 0.85, opMin: 0.05, opMax: 0.14, glowMult: 1.5,  goldPct: 0.35, scrollParallax: 0.04, mouseParallax: 3,  speedMult: 0.35, scrollBoost: 0.002, connectDist: 45, connectOp: 0.12, speedCap: 0.45, wrap: false },
  { count: 33, rMin: 0.75, rMax: 1.80, opMin: 0.14, opMax: 0.36, glowMult: 3.0,  goldPct: 0.55, scrollParallax: 0.14, mouseParallax: 9,  speedMult: 0.70, scrollBoost: 0.005, connectDist: 68, connectOp: 0.24, speedCap: 0.90, wrap: false },
  { count: 25, rMin: 1.40, rMax: 3.20, opMin: 0.28, opMax: 0.65, glowMult: 5.5,  goldPct: 0.75, scrollParallax: 0.30, mouseParallax: 18, speedMult: 1.00, scrollBoost: 0.010, connectDist: 95, connectOp: 0.40, speedCap: 1.40, wrap: true  },
] as const;

export function SideVinesFirefly({ wrapRef }: { wrapRef?: RefObject<HTMLDivElement> }) {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const mouseOffsetRef = useRef({ x: 0, y: 0 });
  const mouseRepelRef  = useRef({ x: -9999, y: -9999 });
  const prevScrollRef  = useRef(0);
  const scrollYRef     = useRef([0, 0, 0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const rnd = (min: number, max: number) => min + Math.random() * (max - min);

    const W = () => canvas.width;
    const H = () => canvas.height;
    const allParticles: Particle[] = FF_LAYERS.flatMap((L, li) =>
      Array.from({ length: L.count }, () => {
        const r = rnd(L.rMin, L.rMax);
        return {
          x: rnd(0, W()), y: rnd(0, H()),
          vx: rnd(-0.12, 0.12) * L.speedMult,
          vy: rnd(-0.12, 0.12) * L.speedMult,
          r, opacity: rnd(L.opMin, L.opMax),
          color: Math.random() < L.goldPct ? '#B8924A' : '#6B8F71',
          glowR: r * L.glowMult,
          layer: li as 0 | 1 | 2,
        };
      })
    );

    const byLayer: Particle[][] = [[], [], []];
    for (const p of allParticles) byLayer[p.layer].push(p);

    const onMouseMove = (e: MouseEvent) => {
      mouseRepelRef.current = { x: e.clientX, y: e.clientY };
      mouseOffsetRef.current = {
        x: (e.clientX - window.innerWidth  / 2) / 100,
        y: (e.clientY - window.innerHeight / 2) / 100,
      };
    };
    window.addEventListener('mousemove', onMouseMove);

    let rafId: number;

    const draw = () => {
      const w = W(), h = H();
      // Support both custom scroll containers (snap pages) and window scroll
      const scrollTop = wrapRef != null
        ? (wrapRef.current?.scrollTop ?? 0)
        : document.documentElement.scrollTop;
      const scrollDelta = Math.abs(scrollTop - prevScrollRef.current);
      prevScrollRef.current = scrollTop;

      FF_LAYERS.forEach((L, li) => {
        scrollYRef.current[li] = -scrollTop * L.scrollParallax;
      });

      const { x: mox, y: moy } = mouseOffsetRef.current;
      const { x: mrx, y: mry } = mouseRepelRef.current;

      ctx.clearRect(0, 0, w, h);

      for (let li = 0; li < 3; li++) {
        const L = FF_LAYERS[li];
        const layerScrollY = scrollYRef.current[li];
        const layerMX = mox * L.mouseParallax;
        const layerMY = moy * L.mouseParallax;
        const pts = byLayer[li];

        for (const p of pts) {
          const nudge = 0.014 * L.speedMult;
          p.vx = (p.vx + (Math.random() - 0.5) * nudge * 2) * 0.992;
          p.vy = (p.vy + (Math.random() - 0.5) * nudge * 2) * 0.992;

          if (scrollDelta > 2) {
            p.vx += (Math.random() - 0.5) * scrollDelta * L.scrollBoost;
            p.vy += (Math.random() - 0.5) * scrollDelta * L.scrollBoost;
          }

          const rdx = p.x - mrx, rdy = p.y - mry;
          const repD = Math.sqrt(rdx * rdx + rdy * rdy);
          if (repD < 110 && repD > 0) {
            const force = (1 - repD / 110) * 0.35 * L.speedMult;
            p.vx += (rdx / repD) * force;
            p.vy += (rdy / repD) * force;
          }

          const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (spd > L.speedCap) {
            p.vx = (p.vx / spd) * L.speedCap;
            p.vy = (p.vy / spd) * L.speedCap;
          }

          if (L.wrap) {
            if (p.x < -p.r * 2) p.x = w + p.r * 2;
            if (p.x > w + p.r * 2) p.x = -p.r * 2;
            if (p.y < -p.r * 2) p.y = h + p.r * 2;
            if (p.y > h + p.r * 2) p.y = -p.r * 2;
          } else {
            if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
            if (p.x > w) { p.x = w; p.vx = -Math.abs(p.vx); }
            if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); }
            if (p.y > h) { p.y = h; p.vy = -Math.abs(p.vy); }
          }

          p.x += p.vx;
          p.y += p.vy;
        }

        for (const p of pts) {
          const dx = p.x + layerMX;
          const dy = p.y + layerScrollY + layerMY;
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.shadowBlur  = p.glowR;
          ctx.shadowColor = p.color;
          ctx.fillStyle   = p.color;
          ctx.beginPath();
          ctx.arc(dx, dy, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        ctx.save();
        for (let a = 0; a < pts.length - 1; a++) {
          for (let b = a + 1; b < pts.length; b++) {
            const pa = pts[a], pb = pts[b];
            const ddx = pa.x - pb.x, ddy = pa.y - pb.y;
            const dist = Math.sqrt(ddx * ddx + ddy * ddy);
            if (dist < L.connectDist) {
              const lineOp = (1 - dist / L.connectDist) * L.connectOp;
              ctx.globalAlpha = lineOp;
              ctx.strokeStyle = 'rgba(184,146,74,1)';
              ctx.lineWidth   = li === 2 ? 0.7 : li === 1 ? 0.45 : 0.25;
              ctx.beginPath();
              ctx.moveTo(pa.x + layerMX, pa.y + layerScrollY + layerMY);
              ctx.lineTo(pb.x + layerMX, pb.y + layerScrollY + layerMY);
              ctx.stroke();
            }
          }
        }
        ctx.restore();
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none' }}
    />
  );
}
