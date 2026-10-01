import type { createBrowserRouter } from 'react-router-dom';
import { chapterForPath } from './bridge';

type DataRouter = ReturnType<typeof createBrowserRouter>;
const installed = new WeakSet<object>();
const normalize = (path: string) => (path.length > 1 ? path.replace(/\/+$/, '') : path) || '/';
const historyIdx = (): number => (window.history.state as { idx?: number } | null)?.idx ?? 0;

/**
 * Navegación del cliente (sin ClientRouter): View Transitions nativas vía react-router y bus de eventos ligero.
 * SIN gsap ni store: vive en el JS inicial (se instala desde main.tsx con el router ya creado).
 *
 *  - `router.navigate` se envuelve para que TODA navegación entre páginas (Link, NavLink, menú, footer, navigate())
 *    pida `viewTransition: true`; así no hay que tocar cada <Link>. Mismo pathname (query/hash) → sin transición.
 *    react-router 6.30 cae solo a un swap directo si el navegador no tiene document.startViewTransition, y en POP
 *    (atrás/adelante) repite la transición de la navegación original (appliedViewTransitions, persistido en sessionStorage).
 *  - Al completarse una navegación fija `html[data-vt]` = forward|back y, si cambia el pathname, `html[data-vt-run]`
 *    (1,8 s; transitions.css los usa) y emite `mm:nav-start` {pathname, chapter, back} para que el runtime de movimiento
 *    lleve el Stage al capítulo destino (equivale a astro:before-preparation).
 *  - El clic (capture) guarda el origen del círculo en --vt-x/--vt-y (sustituye a scripts/transitions.ts).
 */
export function installNavigation(router: DataRouter): void {
  if (typeof window === 'undefined' || installed.has(router)) return;
  installed.add(router);

  const navigate = router.navigate.bind(router) as DataRouter['navigate'];
  router.navigate = ((to: unknown, opts?: { viewTransition?: boolean }) => {
    if (typeof to === 'number') return navigate(to as never);
    let viewTransition = opts?.viewTransition;
    if (viewTransition === undefined) {
      const path = typeof to === 'string' ? to : `${(to as { pathname?: string }).pathname ?? ''}${(to as { search?: string }).search ?? ''}`;
      viewTransition = normalize(new URL(path, window.location.href).pathname) !== normalize(window.location.pathname);
    }
    return navigate(to as never, { ...opts, viewTransition } as never);
  }) as DataRouter['navigate'];

  let lastPath = normalize(router.state.location.pathname);
  let lastKey = router.state.location.key;
  let lastIdx = historyIdx();
  let runTimer: number | undefined;
  // Se registra ANTES de envolver router.subscribe: corre antes que el RouterProvider, o sea antes de startViewTransition.
  router.subscribe((state) => {
    if (state.navigation.state !== 'idle' || state.location.key === lastKey) return;
    lastKey = state.location.key;
    const idx = historyIdx();
    const back = state.historyAction === 'POP' && idx < lastIdx;
    lastIdx = idx;
    const root = document.documentElement;
    const pathname = normalize(state.location.pathname);
    root.dataset.vt = back ? 'back' : 'forward';
    if (pathname !== lastPath) {
      // Header y WhatsApp solo llevan view-transition-name mientras dura la transición (transitions.css): con el nombre
      // puesto siempre, el elemento pasa a ser "backdrop root" y su backdrop-filter (vidrio de la isla) deja de difuminar.
      root.setAttribute('data-vt-run', '');
      window.clearTimeout(runTimer);
      runTimer = window.setTimeout(() => root.removeAttribute('data-vt-run'), 1800);
      document.dispatchEvent(new CustomEvent('mm:nav-start', { detail: { pathname, chapter: chapterForPath(pathname), back } }));
    }
    lastPath = pathname;
  });

  // react-router repite la transición en POP si esa ruta la tuvo antes (appliedViewTransitions va por pathname), así que
  // un clic en un ancla #hash de la misma página lanzaba la cortina sobre sí misma: sin transición si el pathname no cambia.
  const subscribe = router.subscribe.bind(router);
  router.subscribe = ((fn: Parameters<DataRouter['subscribe']>[0]) => subscribe((state, opts) => {
    const vt = opts.viewTransitionOpts;
    fn(state, vt && normalize(vt.currentLocation.pathname) === normalize(vt.nextLocation.pathname) ? { ...opts, viewTransitionOpts: undefined } : opts);
  })) as DataRouter['subscribe'];

  document.addEventListener('click', (event) => {
    if (!event.isTrusted) return; // clic sintético del menú (link.click() tras cerrar): conserva el origen real
    const link = (event.target as Element | null)?.closest?.('a[href]');
    if (!(link instanceof HTMLAnchorElement)) return;
    let x = event.clientX;
    let y = event.clientY;
    if (event.detail === 0 || (!x && !y)) {
      // Activación por teclado: el círculo nace en el centro del link.
      const rect = link.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }
    const root = document.documentElement.style;
    root.setProperty('--vt-x', `${Math.round(x)}px`);
    root.setProperty('--vt-y', `${Math.round(y)}px`);
  }, { capture: true, passive: true });
}
