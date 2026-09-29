import type { CSSProperties } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { BrandScene } from './brand-scene';
import '@fontsource-variable/outfit/wght.css';
import '@fontsource-variable/inter/wght.css';

const colors = { night: '#0b1020', teal: '#00a8ac', violet: '#6f4897', lilac: '#a98bd0', white: '#f4f7fb' };
const display: CSSProperties = { fontFamily: 'Outfit Variable, Outfit, sans-serif', fontWeight: 700, letterSpacing: '-.05em' };
const body: CSSProperties = { fontFamily: 'Inter Variable, Inter, sans-serif', fontWeight: 400 };

const Backdrop = ({ children }: { children: React.ReactNode }) => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at 65% 50%, #163b4b 0%, ${colors.night} 70%)`, color: colors.white, overflow: 'hidden' }}>{children}</AbsoluteFill>
);

export function HeroLoop() {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const portrait = height > width;
  const phase = frame / durationInFrames * Math.PI * 2;
  const quietGlow = .28 + .1 * Math.cos(phase);
  const size = portrait ? Math.round(width * .95) : Math.round(height * .95);
  return (
    <Backdrop>
      <div style={{ position: 'absolute', width: size * 1.15, height: size * 1.15, borderRadius: '50%', background: colors.teal, filter: 'blur(120px)', opacity: quietGlow, top: portrait ? '15%' : '5%', right: portrait ? '-8%' : '10%' }} />
      <div style={{ position: 'absolute', right: portrait ? '1%' : '6%', top: portrait ? '14%' : '6%' }}><BrandScene size={size} /></div>
      <div style={{ position: 'absolute', left: portrait ? '8%' : '7%', bottom: portrait ? '13%' : '15%', width: portrait ? '84%' : '49%' }}>
        <div style={{ ...body, fontSize: portrait ? 25 : 28, color: '#9ce7e8', marginBottom: 28 }}>Al servicio de la medicina personalizada</div>
        <div style={{ ...display, fontSize: portrait ? 98 : 105, lineHeight: .95 }}>Del mundo<br />a tu fórmula.</div>
        <div style={{ ...body, fontSize: portrait ? 27 : 27, marginTop: 36, maxWidth: 630, lineHeight: 1.4 }}>Cada fórmula es única, como cada paciente.</div>
      </div>
      <div style={{ position: 'absolute', inset: 32, border: `1px solid ${colors.teal}55`, borderRadius: 40, pointerEvents: 'none' }} />
    </Backdrop>
  );
}

export function HeroBackdrop() {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const portrait = height > width;
  const phase = frame / durationInFrames * Math.PI * 2;
  const size = portrait ? Math.round(width * 1.06) : Math.round(height * 1.04);
  return <Backdrop>
    <div style={{ position: 'absolute', width: size * 1.2, height: size * 1.2, borderRadius: '50%', background: colors.teal, filter: 'blur(130px)', opacity: .23 + .08 * Math.cos(phase), top: portrait ? '20%' : '4%', right: portrait ? '-10%' : '8%' }} />
    <div style={{ position: 'absolute', right: portrait ? '-2%' : '7%', top: portrait ? '23%' : '3%' }}><BrandScene size={size} /></div>
  </Backdrop>;
}

// The three-step service wording is PROPUESTO and needs Dirección Técnica approval.
const explainerSteps = [
  { title: 'Tu médico prescribe', body: 'La receta indica la formulación para tu caso.' },
  { title: 'Preparamos tu fórmula', body: 'Revisamos la solicitud y elaboramos el preparado magistral.' },
  { title: 'La recibes', body: 'Coordinamos contigo la atención en la sede correspondiente.' },
];

export function Explainer() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const stepIndex = Math.min(2, Math.floor(frame / 360));
  const step = explainerSteps[stepIndex];
  const local = frame % 360;
  const opacity = interpolate(local, [0, 18, 330, 359], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const size = Math.round(Math.min(height * .8, width * .46));
  return (
    <Backdrop>
      <div style={{ position: 'absolute', right: '3%', top: '12%' }}><BrandScene size={size} /></div>
      <div style={{ position: 'absolute', left: '7%', top: '12%', ...body, fontSize: 24, color: '#9ce7e8' }}>Cómo funciona una receta magistral</div>
      <div style={{ position: 'absolute', left: '7%', top: '32%', width: '58%', opacity }}>
        <div style={{ ...display, fontSize: 112, lineHeight: 1 }}>{step.title}</div>
        <div style={{ ...body, fontSize: 39, lineHeight: 1.35, marginTop: 44 }}>{step.body}</div>
      </div>
      <div style={{ position: 'absolute', left: '7%', bottom: '10%', display: 'flex', gap: 18 }}>
        {explainerSteps.map((_, i) => <span key={i} style={{ height: 8, width: 110, borderRadius: 4, background: i <= stepIndex ? colors.teal : '#ffffff44' }} />)}
      </div>
    </Backdrop>
  );
}

export function Reel({ title, subtitle }: { title: string; subtitle: string }) {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const appear = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <Backdrop>
      <div style={{ position: 'absolute', top: '7%', left: '8%', ...body, fontSize: 28, color: '#9ce7e8' }}>MundoMagistral</div>
      <div style={{ position: 'absolute', top: '14%', right: '-2%' }}><BrandScene size={Math.round(width * 1.02)} /></div>
      <div style={{ position: 'absolute', bottom: '12%', left: '8%', right: '8%', opacity: appear }}>
        <div style={{ ...display, fontSize: 109, lineHeight: 1 }}>{title}</div>
        <div style={{ ...body, fontSize: 34, marginTop: 36 }}>{subtitle}</div>
      </div>
    </Backdrop>
  );
}

export function OgCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Backdrop>
      <div style={{ position: 'absolute', right: 24, top: 0 }}><BrandScene size={550} /></div>
      <div style={{ position: 'absolute', left: 72, top: 72, ...body, fontSize: 25, color: '#9ce7e8' }}>MundoMagistral</div>
      <div style={{ position: 'absolute', left: 72, bottom: 90, maxWidth: 750 }}>
        <div style={{ ...display, fontSize: 79, lineHeight: .99 }}>{title}</div>
        <div style={{ ...body, fontSize: 27, marginTop: 26, color: '#d9e4f4' }}>{subtitle}</div>
      </div>
    </Backdrop>
  );
}
