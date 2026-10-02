import { Suspense, lazy, useEffect, useLayoutEffect, useState, type ReactNode, type RefObject } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { bridge, resetScroll } from './bridge';
import { reducedMotion } from '../lib/motion-pref';

/**
 * Parte ligera del movimiento (entra en el JS inicial: SIN gsap, lenis ni stage/store). Mismo patrón que StageHost:
 * el runtime (motion-page: GSAP + ScrollTrigger + Lenis + reveals + puente al Stage) se descarga en idle, solo en
 * cliente y solo si no hay reduced motion. Con reduced motion NO se carga motion-page ni motion-header, pero el chunk
 * `motion-*` (núcleo gsap) sí se descarga igualmente: stage/store.ts (StageHost) lo importa. Es preexistente.
 */
const MotionPage = lazy(() => import('./motion-page'));

export function MotionProvider({ scope }: { scope: RefObject<HTMLElement | null> }) {
  const { key, hash } = useLocation();
  const navigationType = useNavigationType();
  const [reduce, setReduce] = useState(true); // SSR = hidratación = "sin movimiento"; la preferencia real se lee al montar
  const [idle, setIdle] = useState(false);

  // Scroll arriba en cada navegación aunque el runtime aún no exista (idempotente por location.key).
  useLayoutEffect(() => resetScroll(key, hash, navigationType), [key, hash, navigationType]);

  // Preferencia (?rm, toggle del footer, SO) → clase global .reduce-motion; mm:motion-preference la actualiza en vivo.
  useEffect(() => {
    const apply = (value: boolean) => { setReduce(value); document.documentElement.classList.toggle('reduce-motion', value); };
    apply(reducedMotion());
    const onPref = (event: Event) => {
      const detail = (event as CustomEvent<{ reduce?: boolean }>).detail;
      apply(typeof detail?.reduce === 'boolean' ? detail.reduce : reducedMotion());
    };
    document.addEventListener('mm:motion-preference', onPref);
    return () => document.removeEventListener('mm:motion-preference', onPref);
  }, []);

  // Carga diferida para no competir con el LCP del póster.
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setIdle(true), { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => setIdle(true), 450);
    return () => clearTimeout(id);
  }, []);

  return idle && !reduce ? <Suspense fallback={null}><MotionPage scope={scope} /></Suspense> : null;
}

/**
 * Envuelve el <Outlet/> con `key={pathname}`. Su cleanup de layout corre ANTES de que React retire los nodos de la
 * página: ScrollTrigger mueve las secciones con pin dentro de un `.pin-spacer`, y sin revertirlas antes,
 * `main.removeChild(section)` lanza NotFoundError. No añade DOM (mismo HTML en SSR).
 */
export function PageScope({ children }: { children: ReactNode }) {
  useLayoutEffect(() => () => bridge.release?.(), []);
  return <>{children}</>;
}
