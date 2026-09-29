import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from 'remotion';

const c = { night: '#0B1020', teal: '#00A8AC', violet: '#6F4897', lilac: '#A98BD0' };
const TAU = Math.PI * 2;

// Cada blob orbita con frecuencia ENTERA (k) sobre phase = frame/duration*2π: loop exacto.
const blobs = [
  { color: c.teal, x: 0.42, y: 0.46, r: 0.62, ax: 0.09, ay: 0.07, kx: 1, ky: 1, p: 0.0, a: 0.34, kb: 1 },
  { color: c.violet, x: 0.60, y: 0.55, r: 0.66, ax: 0.10, ay: 0.08, kx: 1, ky: 2, p: 2.1, a: 0.5, kb: 1 },
  { color: c.teal, x: 0.55, y: 0.30, r: 0.38, ax: 0.07, ay: 0.06, kx: 2, ky: 1, p: 4.0, a: 0.2, kb: 2 },
  { color: c.lilac, x: 0.48, y: 0.66, r: 0.3, ax: 0.06, ay: 0.05, kx: 1, ky: 1, p: 1.0, a: 0.12, kb: 1 },
];

// Polvo: pocas partículas, deriva vertical de n vueltas enteras (wrap) + balanceo periódico.
const dust = Array.from({ length: 34 }, (_, i) => ({
  x: 0.2 + random(`dx${i}`) * 0.6, // concentradas al centro (tolera recorte lateral)
  y: random(`dy${i}`),
  size: 1.5 + random(`ds${i}`) * 2.2,
  laps: 1 + Math.floor(random(`dl${i}`) * 2),
  sway: 8 + random(`dw${i}`) * 22,
  ph: random(`dp${i}`) * TAU,
  base: 0.10 + random(`do${i}`) * 0.16,
  lilac: random(`dc${i}`) > 0.6,
}));

export function MenuBackdrop() {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const phase = (frame / durationInFrames) * TAU;
  const portrait = height > width;
  const m = Math.max(width, height);
  return (
    <AbsoluteFill style={{ background: c.night, overflow: 'hidden' }}>
      {blobs.map((b, i) => {
        const cx = (b.x + b.ax * Math.cos(b.kx * phase + b.p)) * width;
        const cy = (b.y + b.ay * Math.sin(b.ky * phase + b.p)) * height;
        const r = b.r * m * (portrait ? 0.8 : 0.72) * (1 + 0.05 * Math.sin(b.kb * phase + b.p));
        return <div key={i} style={{ position: 'absolute', left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: '50%', opacity: b.a, background: `radial-gradient(circle, ${b.color} 0%, ${b.color}00 68%)` }} />;
      })}
      {dust.map((d, i) => {
        const y = (((d.y - d.laps * (frame / durationInFrames)) % 1) + 1) % 1;
        const px = d.x * width + d.sway * Math.sin(phase * d.laps + d.ph);
        const edge = Math.min(y, 1 - y) * 8; // fade en el wrap: sin saltos visibles
        const o = d.base * Math.min(1, edge) * (0.85 + 0.15 * Math.sin(phase + d.ph)); // amplitud mínima, sin destellos
        return <div key={i} style={{ position: 'absolute', left: px, top: y * height, width: d.size, height: d.size, borderRadius: '50%', background: d.lilac ? c.lilac : '#DDF7F7', opacity: o }} />;
      })}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(11,16,32,0) 35%, rgba(11,16,32,.55) 100%)' }} />
    </AbsoluteFill>
  );
}
