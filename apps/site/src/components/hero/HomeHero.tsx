import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { reducedMotion } from '../../lib/motion-pref';

const SLIDE_MS = 2500;
const TRANSITION_MS = 760;

const slides = [
  {
    image: '/media/hero/preparacion.webp',
    alt: 'Preparación farmacéutica con instrumentos de precisión y un frasco ámbar',
    title: 'Una fórmula para cada persona',
    detail: 'Dosis, concentración y presentación según la prescripción y las necesidades del paciente.',
    tag: 'Preparación personalizada',
    href: '/quienes-somos',
  },
  {
    image: '/media/hero/dermatologia.webp',
    alt: 'Preparación de una crema en un entorno farmacéutico',
    title: 'También en dermatología',
    detail: 'Preparaciones magistrales en formas tópicas indicadas por un profesional médico.',
    tag: 'Dermatología',
    href: '/especialidades/dermatologia',
  },
  {
    image: '/media/hero/capsulas.webp',
    alt: 'Preparación de cápsulas en una mesa de laboratorio',
    title: 'La forma que necesitas',
    detail: 'Explora las distintas formas farmacéuticas que puede tener un preparado magistral.',
    tag: 'Formas farmacéuticas',
    href: '/formas-farmaceuticas',
  },
  {
    image: '/media/hero/acompanamiento.webp',
    alt: 'Escena editorial de revisión de una preparación en un laboratorio farmacéutico',
    title: 'Junto al profesional médico',
    detail: 'Acompañamiento técnico y formas farmacéuticas adecuadas según la necesidad de cada paciente.',
    tag: 'Asesoramiento técnico',
    href: '/medicos',
  },
  {
    image: '/media/hero/atencion.webp',
    alt: 'Escena editorial de atención farmacéutica con teléfono y frascos ámbar',
    title: 'Atención en Bolivia',
    detail: 'Encuentra nuestras ocho sedes en siete departamentos y consulta el canal de atención más cercano.',
    tag: '8 sedes · 7 departamentos',
    href: '/contacto',
  },
] as const;

export default function HomeHero() {
  const [active, setActive] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [interacted, setInteracted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [introActive, setIntroActive] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const touchStart = useRef<number | null>(null);
  const transitionTimer = useRef<number | null>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const progressAnimation = useRef<Animation | null>(null);
  const preloaded = useRef<HTMLImageElement[]>([]);
  useEffect(() => () => { if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current); }, []);
  const select = (index: number, manual = false) => {
    const next = (index + slides.length) % slides.length;
    if (next === active) return;
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current);
    setInteracted(true);
    setPrevious(active);
    setActive(next);
    if (manual) setAnnouncement(`Imagen ${next + 1} de ${slides.length}: ${slides[next].title}`);
    transitionTimer.current = window.setTimeout(() => setPrevious(null), TRANSITION_MS);
  };

  useEffect(() => {
    const update = () => setReduced(reducedMotion());
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    update();
    motionQuery.addEventListener('change', update);
    document.addEventListener('mm:motion-preference', update);
    return () => { motionQuery.removeEventListener('change', update); document.removeEventListener('mm:motion-preference', update); };
  }, []);

  useEffect(() => {
    const update = () => setHidden(document.hidden);
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    const update = () => setIntroActive(document.documentElement.dataset.mmIntroActive === '1');
    update();
    document.addEventListener('mm:intro-state', update);
    return () => document.removeEventListener('mm:intro-state', update);
  }, []);

  // Las imágenes siguientes se descargan después del primer pintado; el cambio manual no espera a la red.
  useEffect(() => {
    const preload = () => {
      const small = window.matchMedia('(max-width: 850px)').matches;
      preloaded.current = slides.slice(1).map(({ image }) => {
        const img = new Image();
        img.src = small ? image.replace('.webp', '-720.webp') : image;
        return img;
      });
    };
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(preload, { timeout: 2000 });
      return () => { window.cancelIdleCallback(id); preloaded.current = []; };
    }
    const id = globalThis.setTimeout(preload, 900);
    return () => { globalThis.clearTimeout(id); preloaded.current = []; };
  }, []);

  const canAdvance = !reduced && !focused && !hidden && !introActive;
  // Una sola animación gobierna tanto el indicador como el siguiente slide: nunca se desincronizan.
  useEffect(() => {
    if (reduced || !progressRef.current) return;
    const animation = progressRef.current.animate(
      [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
      { duration: SLIDE_MS, easing: 'linear', fill: 'forwards' },
    );
    progressAnimation.current = animation;
    animation.onfinish = () => select(active + 1);
    if (!canAdvance) animation.pause();
    return () => { animation.onfinish = null; animation.cancel(); progressAnimation.current = null; };
  }, [active, reduced]);
  useEffect(() => {
    if (canAdvance) progressAnimation.current?.play();
    else progressAnimation.current?.pause();
  }, [canAdvance, active]);

  return (
    <section className="home-hero light" data-chapter="hero" data-reduced={reduced} aria-label="Mundo Magistral: preparados personalizados">
      <div className="hero-shell" onFocusCapture={(event) => { if ((event.target as HTMLElement).matches(':focus-visible')) setFocused(true); }} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}>
        <div className="hero-copy-panel">
          <div className="home-hero-copy">
            <p className="hero-overline">Farmacia de preparados magistrales</p>
            <h1>Tu tratamiento,<br />hecho para ti.</h1>
            <p className="hero-description">Elaboramos preparados magistrales personalizados según prescripción médica y las necesidades de cada paciente.</p>
            <div className="hero-actions">
              <Link className="button hero-primary" to="/cotizar">Consultar una fórmula <span aria-hidden="true">↗</span></Link>
              <Link className="hero-secondary" to="/quienes-somos">Conocer Mundo Magistral</Link>
            </div>
          </div>
          <div className="hero-carousel-controls" aria-label="Imágenes de preparación farmacéutica" onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') { event.preventDefault(); select(active - 1, true); }
            if (event.key === 'ArrowRight') { event.preventDefault(); select(active + 1, true); }
          }}>
            <span className="hero-slide-count" aria-hidden="true">0{active + 1} <span>/</span> 0{slides.length}</span>
            <div className="hero-dots">
              {slides.map((slide, index) => (
                <button key={slide.image} type="button" aria-label={`Ver imagen ${index + 1}: ${slide.tag}`} aria-current={active === index ? 'true' : undefined} onClick={() => select(index, true)}><span /></button>
              ))}
            </div>
            <span className="hero-progress" aria-hidden="true"><span ref={progressRef} /></span>
            <span className="visually-hidden" role="status">{announcement}</span>
          </div>
        </div>
        <div className="hero-media" onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => {
          if (touchStart.current === null) return;
          const delta = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
          if (Math.abs(delta) > 45) select(active + (delta < 0 ? 1 : -1), true);
          touchStart.current = null;
        }}>
          {(previous === null ? [active] : [previous, active]).map((index) => {
            const slide = slides[index];
            return <img key={slide.image} className={`hero-photo${active === index ? ' is-active' : ' is-exiting'}${!interacted && index === 0 ? ' is-initial' : ''}`} src={slide.image} srcSet={`${slide.image.replace('.webp', '-720.webp')} 720w, ${slide.image} 1600w`} sizes="(max-width: 850px) 100vw, 52vw" alt={active === index ? slide.alt : ''} aria-hidden={active !== index} width={1600} height={900} fetchPriority={index === 0 ? 'high' : undefined} loading="eager" decoding="async" />;
          })}
          <div className="hero-media-shade" aria-hidden="true" />
          <div className="hero-info-card">
            <span className="hero-card-marker" aria-hidden="true"><span /></span>
            <div className="hero-card-stack">
              {(previous === null ? [active] : [previous, active]).map((index) => {
                const slide = slides[index];
                return <Link key={slide.image} className={`hero-card-copy${active === index ? ' is-active' : ' is-exiting'}${!interacted && index === 0 ? ' is-initial' : ''}`} to={slide.href} aria-hidden={active !== index} tabIndex={active === index ? 0 : -1}>
                  <p className="hero-card-tag">{slide.tag}</p>
                  <h2>{slide.title} <span aria-hidden="true">↗</span></h2>
                  <p className="hero-card-detail">{slide.detail}</p>
                </Link>;
              })}
            </div>
          </div>
          <span className="hero-media-caption">Ciencia hecha para cada paciente</span>
        </div>
      </div>
    </section>
  );
}
