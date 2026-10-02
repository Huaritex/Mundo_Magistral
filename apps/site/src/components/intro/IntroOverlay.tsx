import { useEffect, useRef, type RefObject } from 'react';

interface Props {
  play: boolean;
  exit: RefObject<(() => void) | null>;
  onComplete: () => void;
  onSkip: () => void;
  debugAt?: number;
}

/** Composición visual; sesión, scroll y accesibilidad viven en IntroGate. */
export default function IntroOverlay({ play, exit, onComplete, onSkip, debugAt }: Props) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!play || !root.current) return;
    let alive = true;
    let dispose: (() => void) | undefined;
    let skipping = false;
    const overlay = root.current;
    // La capa usa la medida física del viewport, incluida el área del scrollbar oculto.
    overlay.style.width = `${window.innerWidth}px`;
    // Saltar funciona incluso si el runtime de movimiento todavía no terminó de cargar.
    exit.current = () => {
      if (skipping) return;
      skipping = true;
      document.documentElement.dataset.mmIntroExiting = '1';
      const animation = overlay.animate([{ clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(100% 0% 0% 0%)' }], { duration: 300, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
      animation.onfinish = onComplete;
      dispose = () => { animation.onfinish = null; animation.cancel(); };
    };
    import('../../motion/motion-intro').then(({ animateIntro }) => {
      if (!alive || skipping) return;
      const controller = animateIntro(overlay, onComplete, debugAt);
      dispose = controller.dispose;
      exit.current = controller.skip;
    }).catch(() => { if (alive) onComplete(); });
    return () => { alive = false; dispose?.(); exit.current = null; };
  }, [play, exit, onComplete, debugAt]);

  return (
    <section ref={root} className="intro-overlay" role="dialog" aria-modal="true" aria-label="Presentación de Mundo Magistral" data-intro-debug={debugAt !== undefined || undefined} data-lenis-prevent="">
      <div className="intro-visuals" aria-hidden="true">
        <div className="intro-science">
          <div className="intro-grid" />
          <p className="intro-corner intro-corner-top"><span className="intro-status-dot" /> Formulación magistral</p>
          <span className="intro-rule" />
          <div className="intro-word-mask"><p className="intro-word intro-science-word">CIENCIA<span className="intro-word-dot">.</span></p></div>
          <div className="intro-word-mask"><p className="intro-word intro-precision-word">PRECISIÓN<span className="intro-word-dot">.</span></p></div>
          <svg className="intro-target" viewBox="0 0 300 300" fill="none">
            <circle cx="150" cy="150" r="103" /><circle cx="150" cy="150" r="64" />
            <path d="M150 24v34m0 184v34M24 150h34m184 0h34M50 78V50h28m144 0h28v28M50 222v28h28m144 0h28v-28" />
            <path className="intro-target-accent" d="M128 121v-23h44v23l25 73a11 11 0 0 1-10 15h-74a11 11 0 0 1-10-15l25-73Z" /><path d="M118 167h64m-56 17h15m-15 12h15" />
          </svg>
          <p className="intro-corner intro-corner-bottom">Ciencia · Precisión · Cuidado</p>
          <span className="intro-chapter">01 — 05</span>
        </div>

        <div className="intro-editorial">
          <p className="intro-corner intro-corner-top">Preparación personalizada</p>
          <div className="intro-product"><img src={play ? '/media/intro/formulacion.webp' : undefined} srcSet={play ? '/media/intro/formulacion-720.webp 720w, /media/intro/formulacion.webp 1280w' : undefined} sizes="(max-width: 600px) 100vw, 60vw" width={1280} height={853} alt="" decoding="async" onError={onComplete} /></div>
          <div className="intro-personal-word">PERSONALI<span>ZACIÓN<span className="intro-word-dot">.</span></span></div>
          <div className="intro-formula-card">
            <p className="intro-card-label">Formulación magistral <span>↗</span></p>
            <div className="intro-card-rule" />
            <p>Dosis<br />Concentración<br />Presentación</p>
            <span className="intro-card-foot">Adaptada a cada paciente</span>
          </div>
          <span className="intro-chapter">03 — 05</span>
        </div>

        <div className="intro-brand">
          <div className="intro-brand-logo"><img src="/media/logo.svg" width={216} height={126} alt="" onError={onComplete} /></div>
          <p className="intro-brand-name">MUNDO MAGISTRAL</p>
          <p className="intro-corner intro-corner-bottom">Preparados para cada persona.</p>
        </div>
        <p className="intro-message">Tu tratamiento,<br />hecho para ti.</p>
        <div className="intro-hero-bridge home-hero" inert />
      </div>
      <button className="intro-skip" type="button" onClick={onSkip}>Saltar intro <span aria-hidden="true">↗</span></button>
    </section>
  );
}
