import { reducedMotion } from '../stage/tier';

/**
 * Núcleo del header SIN GSAP (mejora progresiva): menú <dialog>, compacto, barra de progreso,
 * tono adaptativo (claro/oscuro según la sección bajo la isla), aria-current y eventos mm:nav-preview.
 * El header vive en transition:persist, así que nada de esto pertenece al contexto de página:
 * los listeners globales se registran una sola vez y lo que depende del DOM de página se re-enlaza
 * en astro:page-load / astro:after-swap.
 */

export interface HeaderEnhancer {
  /** Corre justo después de dialog.showModal(). Devuelve una promesa que resuelve al terminar. */
  openMenu(dialog: HTMLDialogElement, trigger: HTMLElement): Promise<void> | void;
  /** Animación de salida; el núcleo llama dialog.close() DESPUÉS de que resuelva (o venza el timeout). */
  closeMenu(dialog: HTMLDialogElement, trigger: HTMLElement, opts: { fast: boolean }): Promise<void>;
}

/** Capítulo del Stage por ruta (contrato mm:nav-preview). */
const CHAPTERS: Record<string, string> = {
  '/': 'hero',
  '/nosotros': 'filosofia',
  '/especialidades': 'especialidades',
  '/formas-farmaceuticas': 'formas',
  '/sucursales': 'sedes',
  '/medicos': 'medicos',
};

const html = document.documentElement;
let enhancer: HeaderEnhancer | undefined;
let reduced = reducedMotion();
const reducedListeners = new Set<(reduce: boolean) => void>();

export const isReduced = (): boolean => reduced;
export function onReducedChange(cb: (reduce: boolean) => void): () => void {
  reducedListeners.add(cb);
  return () => reducedListeners.delete(cb);
}
export function setEnhancer(next: HeaderEnhancer | undefined): void { enhancer = next; }

let started = false;

export function initHeaderCore(): void {
  if (started) return;
  const header = document.querySelector<HTMLElement>('#site-header');
  const trigger = document.querySelector<HTMLButtonElement>('#menu-trigger');
  const dialog = document.querySelector<HTMLDialogElement>('#menu-dialog');
  const closeBtn = document.querySelector<HTMLElement>('#menu-close');
  if (!header || !trigger || !dialog || !closeBtn) return;
  started = true;

  document.addEventListener('mm:motion-preference', (event) => {
    const detail = (event as CustomEvent<{ reduce?: boolean }>).detail;
    reduced = typeof detail?.reduce === 'boolean' ? detail.reduce : reducedMotion();
    reducedListeners.forEach((cb) => cb(reduced));
  });

  /* ---------- mm:nav-preview (el Stage lo conecta lifecycle.ts) ---------- */
  let current: string | null = null;
  let leaveTimer: number | undefined;
  const fire = (chapter: string, active: boolean) =>
    document.dispatchEvent(new CustomEvent('mm:nav-preview', { detail: { chapter, active } }));
  const preview = (chapter: string, active: boolean) => {
    if (active) {
      window.clearTimeout(leaveTimer);
      if (current === chapter) return; // pointerenter + focus del mismo link: un solo evento
      if (current) fire(current, false);
      current = chapter;
      fire(chapter, true);
    } else if (current === chapter) {
      window.clearTimeout(leaveTimer);
      // Coalesce: al pasar de un link a otro no emitimos un false intermedio de más.
      leaveTimer = window.setTimeout(() => { if (current === chapter) { fire(chapter, false); current = null; } }, 90);
    }
  };
  const clearPreview = () => {
    window.clearTimeout(leaveTimer);
    if (current) { fire(current, false); current = null; }
  };
  dialog.querySelectorAll<HTMLAnchorElement>('nav a').forEach((link) => {
    const chapter = CHAPTERS[new URL(link.href, location.href).pathname];
    if (!chapter) return;
    link.addEventListener('pointerenter', () => preview(chapter, true));
    link.addEventListener('pointerleave', () => preview(chapter, false));
    link.addEventListener('focus', () => preview(chapter, true));
    link.addEventListener('blur', () => preview(chapter, false));
  });

  /* ---------- Video opcional del menú (solo tier 1 sin reduce-motion) ---------- */
  const loop = dialog.querySelector<HTMLVideoElement>('[data-menu-loop]');
  const startLoop = () => {
    if (!loop || loop.hidden) return;
    if (!loop.getAttribute('src')) {
      if (html.dataset.stageTier !== '1' || reduced) return;
      const av1 = loop.canPlayType('video/mp4; codecs="av01.0.05M.08"') !== '';
      loop.addEventListener('error', () => { loop.hidden = true; }, { once: true });
      loop.src = av1 ? '/media/menu-backdrop-av1.mp4' : '/media/menu-backdrop.mp4';
    }
    void loop.play().catch(() => {});
  };

  /* ---------- Menú: abrir / cerrar ---------- */
  let closing: Promise<void> | null = null;

  const openMenu = () => {
    if (dialog.open) return;
    dialog.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    // Doble rAF: el ícono de barras necesita un frame en estado "hamburguesa" antes de morfar a X.
    requestAnimationFrame(() => requestAnimationFrame(() => { if (dialog.open) dialog.classList.add('is-open'); }));
    startLoop();
    const done = enhancer && !reduced ? Promise.resolve(enhancer.openMenu(dialog, trigger)) : Promise.resolve();
    // Con el menú totalmente abierto ocultamos la página para que el canvas persistente se vea detrás.
    void done.catch(() => {}).then(() => { if (dialog.open && !closing) html.classList.add('menu-open'); });
  };

  const requestClose = (fast = false): Promise<void> => {
    if (!dialog.open) return Promise.resolve();
    if (closing) return closing;
    html.classList.remove('menu-open');
    dialog.classList.remove('is-open');
    clearPreview();
    const anim = enhancer && !reduced ? enhancer.closeMenu(dialog, trigger, { fast }) : Promise.resolve();
    // Red de seguridad: si el tween falla o se cuelga, el dialog nunca queda abierto.
    const safety = new Promise<void>((resolve) => window.setTimeout(resolve, 1200));
    closing = Promise.race([Promise.resolve(anim).catch(() => {}), safety])
      .then(() => { if (dialog.open) dialog.close(); })
      .finally(() => { closing = null; });
    return closing;
  };

  dialog.addEventListener('close', () => {
    trigger.setAttribute('aria-expanded', 'false');
    dialog.classList.remove('is-open');
    html.classList.remove('menu-open');
    clearPreview();
    loop?.pause();
  });
  trigger.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', () => void requestClose());
  // Esc: si hay animación de salida la interceptamos; sin GSAP el cierre nativo funciona solo.
  dialog.addEventListener('cancel', (event) => {
    if (!enhancer || reduced) return;
    event.preventDefault();
    void requestClose();
  });
  const bypass = new WeakSet<HTMLAnchorElement>();
  dialog.addEventListener('click', (event) => {
    const target = event.target as Element;
    if (target === dialog || target.classList.contains('menu-dialog-inner')) { void requestClose(); return; }
    const link = target.closest('a');
    if (!link) return;
    if (bypass.has(link)) { bypass.delete(link); return; }
    if (link.target === '_blank' || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!enhancer || reduced) { dialog.close(); return; } // comportamiento original: cierra y deja navegar
    event.preventDefault();
    const samePage = link.pathname === location.pathname && link.search === location.search;
    void requestClose(true).then(() => {
      if (samePage) return;
      bypass.add(link);
      link.click(); // Astro (ClientRouter) intercepta este clic ya con el menú cerrado
    });
  });
  // Cambio de breakpoint con el menú abierto: cerrar sin animación.
  matchMedia('(min-width: 1150px)').addEventListener('change', (e) => { if (e.matches && dialog.open) dialog.close(); });

  /* ---------- Scroll: compacto + progreso ---------- */
  const bar = header.querySelector<HTMLElement>('.header-progress i');
  let maxScroll = 1;
  let ticking = false;
  const measure = () => { maxScroll = Math.max(1, html.scrollHeight - innerHeight); };
  const paint = () => {
    ticking = false;
    const y = window.scrollY;
    header.classList.toggle('is-compact', y > 80);
    if (bar) bar.style.transform = `scaleX(${Math.min(1, Math.max(0, y / maxScroll)).toFixed(4)})`;
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); onScroll(); }, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); onScroll(); }).observe(html);
  measure();
  paint();

  /* ---------- Tono adaptativo: qué sección hay bajo la isla ---------- */
  let toneObserver: IntersectionObserver | undefined;
  let resizeTimer: number | undefined;
  const LINE = 42; // y (px) del centro de la isla
  const toneOf = (el: Element) => (el.matches('.light, .white') ? 'light' : 'dark');
  const setTone = (tone: string) => { if (header.dataset.tone !== tone) header.dataset.tone = tone; };
  const observeTone = () => {
    toneObserver?.disconnect();
    const first = document.elementsFromPoint(innerWidth / 2, LINE).find((el) => el.matches('main section.dark, main section.light, main section.white, .site-footer'));
    if (first) setTone(toneOf(first));
    if (!('IntersectionObserver' in window)) return;
    // Franja de 2px a la altura del centro de la isla.
    toneObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setTone(toneOf(entry.target));
    }, { rootMargin: `-${LINE}px 0px -${Math.max(0, innerHeight - LINE - 2)}px 0px`, threshold: 0 });
    document.querySelectorAll('main section.dark, main section.light, main section.white, .site-footer').forEach((el) => toneObserver!.observe(el));
  };
  window.addEventListener('resize', () => { window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(observeTone, 200); }, { passive: true });

  /* ---------- aria-current ---------- */
  const updateActive = () => {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    header.parentElement?.querySelectorAll<HTMLAnchorElement>('.desktop-nav a, .menu-dialog nav a').forEach((link) => {
      const href = new URL(link.href, location.href).pathname.replace(/\/+$/, '') || '/';
      const on = href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);
      if (on) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    document.dispatchEvent(new CustomEvent('mm:header-active'));
  };

  /* ---------- Entrada única (los persistidos se re-insertan y reiniciarían la animación CSS) ---------- */
  const settle = (el: Element | null) => {
    if (!el || el.classList.contains('is-ready')) return;
    const done = () => el.classList.add('is-ready');
    el.addEventListener('animationend', done, { once: true });
    window.setTimeout(done, 2600);
  };

  const onPage = () => {
    measure();
    updateActive();
    observeTone();
    onScroll();
    settle(header);
    settle(document.querySelector('.floating-wa'));
  };
  document.addEventListener('astro:page-load', onPage);
  document.addEventListener('astro:after-swap', () => { updateActive(); observeTone(); });
  onPage();
}
