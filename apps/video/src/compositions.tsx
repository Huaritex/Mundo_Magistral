import type { CSSProperties } from 'react';
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneShot, loopBg, loopT } from './scene-shot';
import { baseLuma, linearRgbToCss, sceneAt, type Segment } from './timeline';
import { chapterState } from '@mm/scene/blend';
import '@fontsource-variable/outfit/wght.css';
import '@fontsource-variable/inter/wght.css';

// Fondo blanco principal y morado secundario (como el sitio). `night` = tinta de la banda del CTA; `tealInk`/`ink2` = texto sobre claro (AA).
const colors = { night: '#22163a', ink: '#22163a', ink2: '#4b4263', teal: '#00a8ac', tealInk: '#007c80', violet: '#6f4897', lilac: '#a98bd0', white: '#ffffff' };
const display: CSSProperties = { fontFamily: 'Outfit Variable, Outfit, sans-serif', fontWeight: 700, letterSpacing: '-.05em' };
const body: CSSProperties = { fontFamily: 'Inter Variable, Inter, sans-serif', fontWeight: 400 };

// El fondo (shader + partículas) lo dibuja MMScene dentro del canvas; esto es solo el color base para lo que el canvas no cubre.
// Debe ser EXACTAMENTE la base del capítulo (SceneShot se desvanece contra él): por defecto la base del capítulo `hero` (blanco).
const heroBase = linearRgbToCss(chapterState('hero').base);
const Backdrop = ({ children, bg = heroBase, color = colors.ink }: { children: React.ReactNode; bg?: string; color?: string }) => (
  <AbsoluteFill style={{ background: bg, color, overflow: 'hidden' }}>{children}</AbsoluteFill>
);

/**
 * Primer fotograma del hero de la web (tier 3): capítulo `hero`, progreso 0, sin velocidad. HERO_T0/HERO_BG0 son el centro del
 * bucle de HeroBackdrop, así que el póster, el primer cuadro del vídeo y el arranque del canvas coinciden (sin salto al fundir).
 */
export const HERO_T0 = 1.5;
export const HERO_BG0 = 0.5;

export function HeroLoop() {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const portrait = height > width;
  return (
    <Backdrop>
      <SceneShot chapter="hero" t={loopT(frame, durationInFrames)} bgProgress={loopBg(frame, durationInFrames)}
        cx={.5} cy={.5} anchor={portrait ? 'top' : 'center'} canvasHeight={portrait ? Math.round(width * 1.2) : height} />
      <div style={{ position: 'absolute', left: portrait ? '8%' : '7%', bottom: portrait ? '13%' : '15%', width: portrait ? '84%' : '49%' }}>
        <div style={{ ...body, fontSize: portrait ? 25 : 28, color: colors.tealInk, marginBottom: 28 }}>Al servicio de la medicina personalizada</div>
        <div style={{ ...display, fontSize: portrait ? 98 : 105, lineHeight: .95 }}>Del mundo<br />a tu fórmula.</div>
        <div style={{ ...body, fontSize: portrait ? 27 : 27, marginTop: 36, maxWidth: 630, lineHeight: 1.4, color: colors.ink2 }}>Cada fórmula es única, como cada paciente.</div>
      </div>
      <div style={{ position: 'absolute', inset: 32, border: `1px solid ${colors.violet}33`, borderRadius: 40, pointerEvents: 'none' }} />
    </Backdrop>
  );
}

/** Video de fondo del hero en tier 1. El canvas ocupa todo el cuadro, como en la web: el objeto va a la derecha en apaisado (`cameraX`)
 *  y centrado arriba en vertical (`cameraY` + `fit`). */
export function HeroBackdrop() {
  const frame = useCurrentFrame();
  const { height, durationInFrames } = useVideoConfig();
  return <Backdrop>
    <SceneShot chapter="hero" t={loopT(frame, durationInFrames, { center: HERO_T0, amp: 2.5 })} bgProgress={loopBg(frame, durationInFrames, { center: HERO_BG0, amp: .25 })}
      cx={.5} cy={.5} canvasHeight={height} />
  </Backdrop>;
}

/** Póster del hero (LCP): fotograma 0 de HeroBackdrop con el mismo encuadre que el canvas de la web. Apaisado 2.22:1 y vertical 0.8:1:
 *  `object-fit: cover` los escala por la altura del viewport, que es lo que fija la cámara (fov vertical): el objeto coincide con el canvas. */
export function HeroPoster({ t = HERO_T0, bg = HERO_BG0 }: { t?: number; bg?: number }) {
  const { height } = useVideoConfig();
  return <Backdrop>
    <SceneShot chapter="hero" t={t} bgProgress={bg} cx={.5} cy={.5} canvasHeight={height} />
  </Backdrop>;
}

// The three-step service wording is PROPUESTO and needs Dirección Técnica approval.
const explainerSteps = [
  { title: 'Tu médico prescribe', body: 'La receta indica la formulación para tu caso.' },
  { title: 'Preparamos tu fórmula', body: 'Revisamos la solicitud y elaboramos el preparado magistral.' },
  { title: 'La recibes', body: 'Coordinamos contigo la atención en la sede correspondiente.' },
];

// Capítulo de @mm/scene por paso: mundo (receta llega) -> mortero (preparación) -> cta (cápsula entregada).
const explainerSegments: Segment[] = [
  { chapter: 'mundo', start: 0, end: 360 },
  { chapter: 'mortero', start: 360, end: 720 },
  { chapter: 'cta', start: 720, end: 1080 },
];

export function Explainer() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stepIndex = Math.min(2, Math.floor(frame / 360));
  const step = explainerSteps[stepIndex];
  const local = frame % 360;
  const opacity = interpolate(local, [0, 18, 330, 359], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const shot = sceneAt(frame, explainerSegments);
  const luma = baseLuma(shot.state);
  const ink = interpolateColors(luma, [.05, .6], [colors.white, colors.ink]);
  const kicker = interpolateColors(luma, [.05, .6], ['#9ce7e8', colors.tealInk]);
  return (
    <Backdrop bg={linearRgbToCss(shot.state.base)} color={ink}>
      <SceneShot chapter={shot.chapter} progress={shot.progress} blend={shot.blend} t={frame / fps} cx={.8} cy={.5} canvasHeight={1080} />
      <div style={{ position: 'absolute', left: '7%', top: '12%', ...body, fontSize: 24, color: kicker }}>Cómo funciona una receta magistral</div>
      <div style={{ position: 'absolute', left: '7%', top: '32%', width: '58%', opacity }}>
        <div style={{ ...display, fontSize: 112, lineHeight: 1 }}>{step.title}</div>
        <div style={{ ...body, fontSize: 39, lineHeight: 1.35, marginTop: 44 }}>{step.body}</div>
      </div>
      <div style={{ position: 'absolute', left: '7%', bottom: '10%', display: 'flex', gap: 18 }}>
        {explainerSteps.map((_, i) => <span key={i} style={{ height: 8, width: 110, borderRadius: 4, background: i <= stepIndex ? colors.teal : `${ink}44` }} />)}
      </div>
    </Backdrop>
  );
}

// Reel: logo de marca y, tras 3 s, transición al mortero mientras avanza su progreso (preparación magistral).
const reelSegments: Segment[] = [
  { chapter: 'hero', start: 0, end: 90 },
  { chapter: 'mortero', start: 90, end: 450 },
];

export function Reel({ title, subtitle }: { title: string; subtitle: string }) {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const appear = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  const shot = sceneAt(frame, reelSegments);
  return (
    <Backdrop>
      <SceneShot chapter={shot.chapter} progress={shot.progress} blend={shot.blend} t={frame / fps} cx={.5} anchor="top" canvasHeight={Math.round(width * .8)} />
      <div style={{ position: 'absolute', top: '7%', left: '8%', ...body, fontSize: 28, color: colors.tealInk }}>MundoMagistral</div>
      <div style={{ position: 'absolute', bottom: '12%', left: '8%', right: '8%', opacity: appear }}>
        <div style={{ ...display, fontSize: 109, lineHeight: 1 }}>{title}</div>
        <div style={{ ...body, fontSize: 34, marginTop: 36, color: colors.ink2 }}>{subtitle}</div>
      </div>
    </Backdrop>
  );
}

export function OgCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Backdrop>
      <SceneShot chapter="hero" t={HERO_T0} bgProgress={HERO_BG0} cx={.5} cy={.5} canvasHeight={630} />
      <div style={{ position: 'absolute', left: 72, top: 72, ...body, fontSize: 25, color: colors.tealInk }}>MundoMagistral</div>
      <div style={{ position: 'absolute', left: 72, bottom: 90, maxWidth: 640 }}>
        <div style={{ ...display, fontSize: 74, lineHeight: .99 }}>{title}</div>
        <div style={{ ...body, fontSize: 27, marginTop: 26, color: colors.ink2 }}>{subtitle}</div>
      </div>
    </Backdrop>
  );
}

// SceneTour: recorrido de los capítulos del sitio (hero -> mundo -> mortero -> filosofía -> formas -> cta), 12 s, vertical.
// Textos tomados tal cual de Home.tsx (kicker + titular de cada sección).
const tourChapters = [
  { chapter: 'hero', kicker: 'Al servicio de la medicina personalizada', title: 'Del mundo a tu fórmula.' },
  { chapter: 'mundo', kicker: 'En Bolivia, desde 2019', title: 'Una mirada amplia. Una atención cercana.' },
  { chapter: 'mortero', kicker: 'Del mundo a tu fórmula', title: 'Tu receta inicia el camino.' },
  { chapter: 'filosofia', kicker: 'Nuestra filosofía', title: 'Cada fórmula es única, como cada paciente.' },
  { chapter: 'formas', kicker: 'Formas farmacéuticas', title: 'La forma también importa.' },
  { chapter: 'cta', kicker: 'Tu fórmula comienza aquí', title: '¿Tienes una receta?' },
];
export const TOUR_SEGMENT = 60;
const tourSegments: Segment[] = tourChapters.map(({ chapter }, i) => ({ chapter, start: i * TOUR_SEGMENT, end: (i + 1) * TOUR_SEGMENT }));

export function SceneTour() {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const shot = sceneAt(frame, tourSegments, 30);
  const item = tourChapters[shot.index];
  const last = shot.index === tourChapters.length - 1;
  // Fondo claro (formas): el texto pasa de blanco a night según la luminancia del fondo ya mezclado.
  const luma = baseLuma(shot.state);
  const ink = interpolateColors(luma, [.05, .6], [colors.white, colors.night]);
  const kicker = interpolateColors(luma, [.05, .6], ['#9ce7e8', '#00797c']);
  const opacity = interpolate(shot.local, [4, 18, TOUR_SEGMENT - 10, TOUR_SEGMENT - 1], [0, 1, 1, last ? 1 : 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Backdrop bg={linearRgbToCss(shot.state.base)}>
      <SceneShot chapter={shot.chapter} progress={shot.progress} blend={shot.blend} t={frame / fps} cx={.5} anchor="top" canvasHeight={Math.round(width * .8)} />
      <div style={{ position: 'absolute', top: '6%', left: '8%', ...body, fontSize: 28, color: kicker }}>MundoMagistral</div>
      <div style={{ position: 'absolute', bottom: '12%', left: '8%', right: '8%', opacity, color: ink }}>
        <div style={{ ...body, fontSize: 30, color: kicker, marginBottom: 26 }}>{item.kicker}</div>
        <div style={{ ...display, fontSize: 96, lineHeight: 1 }}>{item.title}</div>
      </div>
      <div style={{ position: 'absolute', left: '8%', bottom: '6%', display: 'flex', gap: 12 }}>
        {tourChapters.map((_, i) => <span key={i} style={{ height: 8, width: 56, borderRadius: 4, background: i <= shot.index ? colors.teal : `${ink}44` }} />)}
      </div>
    </Backdrop>
  );
}
