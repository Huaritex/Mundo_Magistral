import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { reducedMotion } from '../../lib/motion-pref';
import IntroOverlay from './IntroOverlay';

const SESSION_KEY = 'mundo-magistral-intro-seen';

function rememberIntro() {
  try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* El sitio sigue disponible con storage bloqueado. */ }
}

/** La página se renderiza siempre. Este gate solo controla la capa de presentación. */
export default function IntroGate() {
  const { pathname, search } = useLocation();
  const initialHome = useRef(pathname === '/').current;
  const params = new URLSearchParams(search);
  const force = import.meta.env.DEV && params.get('intro') === '1';
  const debugValue = force && params.has('introAt') ? Number(params.get('introAt')) : undefined;
  const debugAt = debugValue !== undefined && Number.isFinite(debugValue) ? Math.max(0, Math.min(3.64, debugValue)) : undefined;
  // SSR e hidratación comparten el mismo HTML. El script temprano oculta las visitas ya vistas.
  const [visible, setVisible] = useState(initialHome);
  const [play, setPlay] = useState(false);
  const exit = useRef<(() => void) | null>(null);
  const completed = useRef(false);

  const finish = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    rememberIntro();
    document.documentElement.dataset.mmIntroSeen = '1';
    delete document.documentElement.dataset.mmIntroActive;
    delete document.documentElement.dataset.mmIntroExiting;
    delete document.documentElement.dataset.mmIntroStarted;
    document.dispatchEvent(new Event('mm:intro-state'));
    setVisible(false);
  }, []);

  const skip = useCallback(() => {
    rememberIntro();
    if (exit.current) exit.current();
    else finish();
  }, [finish]);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(SESSION_KEY) === '1'; } catch { /* Sin persistencia, una sola reproducción por montaje. */ }
    if (!initialHome || (!force && seen) || reducedMotion()) { finish(); return; }
    setPlay(true);
  }, [force, finish, initialHome]);

  useEffect(() => {
    if (!play || !visible) return;
    const html = document.documentElement;
    const previous = { htmlOverflow: html.style.overflow, bodyOverflow: document.body.style.overflow, gutter: html.style.scrollbarGutter, padding: document.body.style.paddingRight };
    const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const background = Array.from(document.querySelectorAll<HTMLElement>('#header-persist, #main, .site-footer, body > #root > nav, aside[aria-label="Contacto por WhatsApp"]'));
    const inertStates = background.map((element) => element.inert);
    const scrollbarGap = window.innerWidth - html.clientWidth;
    html.style.setProperty('--intro-scrollbar-gap', `${scrollbarGap}px`);
    html.style.scrollbarGutter = 'auto';
    if (scrollbarGap > 0) document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + scrollbarGap}px`;
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    html.dataset.mmIntroActive = '1';
    background.forEach((element) => { element.inert = true; });
    document.querySelector<HTMLButtonElement>('.intro-skip')?.focus({ preventScroll: true });
    document.dispatchEvent(new Event('mm:intro-state'));
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); skip(); }
      if (event.key === 'Tab') { event.preventDefault(); document.querySelector<HTMLButtonElement>('.intro-skip')?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    window.addEventListener('resize', skip);
    const preference = () => { if (reducedMotion()) finish(); };
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    media.addEventListener('change', preference);
    document.addEventListener('mm:motion-preference', preference);
    // Fallo de importación, pestaña lenta o asset fallido nunca deben bloquear la portada.
    const started = Number(html.dataset.mmIntroStarted) || Date.now();
    const timeout = debugAt === undefined ? window.setTimeout(finish, Math.max(0, 4200 - (Date.now() - started))) : undefined;
    return () => {
      if (timeout !== undefined) window.clearTimeout(timeout);
      document.removeEventListener('keydown', keydown);
      window.removeEventListener('resize', skip);
      media.removeEventListener('change', preference);
      document.removeEventListener('mm:motion-preference', preference);
      background.forEach((element, index) => { element.inert = inertStates[index]; });
      html.style.overflow = previous.htmlOverflow;
      html.style.scrollbarGutter = previous.gutter;
      html.style.removeProperty('--intro-scrollbar-gap');
      document.body.style.overflow = previous.bodyOverflow;
      document.body.style.paddingRight = previous.padding;
      delete html.dataset.mmIntroActive;
      delete html.dataset.mmIntroExiting;
      delete html.dataset.mmIntroStarted;
      document.dispatchEvent(new Event('mm:intro-state'));
      if (activeElement && activeElement !== document.body && activeElement.isConnected) activeElement.focus({ preventScroll: true });
    };
  }, [play, visible, skip, finish, debugAt]);

  return visible ? <IntroOverlay play={play} exit={exit} onComplete={finish} onSkip={skip} debugAt={debugAt} /> : null;
}
