import { gsap, SplitText, easeBrand } from './motion-gsap';
import { isReduced, setEnhancer } from '../lib/header-core';

/**
 * Capa GSAP del header (port de apps/web/src/scripts/motion-header.ts). Se importa dinámicamente en idle desde
 * Header.tsx y se ENGANCHA al núcleo (lib/header-core): si este import falla, el menú y el resto siguen funcionando
 * sin animación. Contexto propio (gsap.context + gsap.matchMedia, scope = raíz del header), independiente del de
 * página: PageScope no lo revierte al navegar (el header es persistente). Devuelve la limpieza (HMR / desmontaje).
 */
export function enhanceHeader(root: HTMLElement): () => void {
  const header = root.querySelector<HTMLElement>('#site-header');
  if (!header) return () => {};
  const ctx = gsap.context(() => {}, root);
  const mm = gsap.matchMedia(root);
  const cleanups: Array<() => void> = [];

  /* ---------- 1. Menú overlay: círculo desde el trigger + líneas con máscara ---------- */
  const dialog = root.querySelector<HTMLDialogElement>('#menu-dialog');
  if (dialog) {
    let split: SplitText | null = null;
    let running: gsap.core.Timeline | null = null;
    const parts = () => [...dialog.querySelectorAll<HTMLElement>('.menu-anim')];
    const origin = (trigger: HTMLElement) => {
      const r = trigger.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    const circle = (r: number, o: { x: number; y: number }) => `circle(${r.toFixed(1)}px at ${o.x.toFixed(1)}px ${o.y.toFixed(1)}px)`;
    const radius = (o: { x: number; y: number }) => Math.hypot(Math.max(o.x, innerWidth - o.x), Math.max(o.y, innerHeight - o.y)) + 8;
    const reset = () => {
      running?.kill();
      running = null;
      split?.revert();
      split = null;
      gsap.set([dialog, ...parts()], { clearProps: 'clipPath,opacity,transform' });
    };
    dialog.addEventListener('close', reset);
    cleanups.push(() => { dialog.removeEventListener('close', reset); reset(); });

    setEnhancer({
      openMenu(_dlg, trigger) {
        reset();
        const o = origin(trigger);
        const R = radius(o);
        const links = [...dialog.querySelectorAll<HTMLElement>('nav a')];
        return new Promise<void>((resolve) => {
          // ctx.add: los tweens creados aquí (tras el montaje) también los revierte ctx.revert().
          ctx.add(() => {
            split = SplitText.create(links, { type: 'lines', mask: 'lines', linesClass: 'menu-line' });
            const tl = gsap.timeline({
              defaults: { ease: easeBrand },
              onComplete: () => { gsap.set(dialog, { clearProps: 'clipPath' }); resolve(); },
              onInterrupt: resolve,
            });
            running = tl;
            tl.fromTo(dialog, { clipPath: circle(0, o) }, { clipPath: circle(R, o), duration: 0.58, ease: 'power3.inOut' }, 0)
              .from(split.lines, { yPercent: 105, duration: 0.55, stagger: 0.035 }, 0.1)
              .from(parts(), { opacity: 0, y: 8, duration: 0.4 }, 0.2);
          });
        });
      },
      closeMenu(_dlg, trigger, { fast }) {
        running?.kill();
        const o = origin(trigger);
        // Si la apertura ya terminó el clip-path fue limpiado: lo restauramos a "todo visible".
        if (!dialog.style.clipPath) gsap.set(dialog, { clipPath: circle(radius(o), o) });
        return new Promise<void>((resolve) => {
          ctx.add(() => {
            const tl = gsap.timeline({ onComplete: resolve, onInterrupt: resolve });
            running = tl;
            if (split?.lines.length) {
              tl.to(split.lines, { yPercent: -105, duration: fast ? 0.22 : 0.3, ease: 'power3.in', stagger: { each: 0.02, from: 'end' } }, 0);
            }
            tl.to(parts(), { opacity: 0, duration: 0.2, ease: 'power1.in' }, 0)
              .to(dialog, { clipPath: circle(0, o), duration: fast ? 0.32 : 0.42, ease: 'power3.inOut' }, fast ? 0.04 : 0.1);
          });
        });
      },
    });
    cleanups.push(() => setEnhancer(undefined));
  }

  /* ---------- 2. Indicador líquido de la nav de escritorio ---------- */
  mm.add('(min-width: 1150px)', () => {
    const nav = header.querySelector<HTMLElement>('.desktop-nav');
    const pill = nav?.querySelector<HTMLElement>('.nav-pill');
    if (!nav || !pill) return;
    const links = [...nav.querySelectorAll<HTMLAnchorElement>('a')];
    const box = { l: 0, r: 0 };
    let focused: HTMLElement | null = null; // link bajo hover/foco
    let leaveTimer: number | undefined;
    const paint = () => { pill.style.clipPath = `inset(0px ${box.r}px 0px ${box.l}px round 999px)`; };
    const edges = (a: HTMLElement) => ({ l: a.offsetLeft, r: nav.offsetWidth - a.offsetLeft - a.offsetWidth });
    const activeLink = () => links.find((a) => a.getAttribute('aria-current') === 'page') ?? null;

    const moveTo = (a: HTMLElement | null, instant = false) => {
      gsap.killTweensOf([box, pill]);
      if (!a) { gsap.to(pill, { opacity: 0, duration: isReduced() ? 0 : 0.25 }); return; }
      const t = edges(a);
      const hidden = Number(gsap.getProperty(pill, 'opacity')) < 0.05;
      if (instant || hidden || isReduced()) {
        Object.assign(box, t);
        paint();
        gsap.to(pill, { opacity: 1, duration: isReduced() || instant ? 0 : 0.22 });
        return;
      }
      // Efecto "líquido": el borde delantero llega rápido y el trasero se estira detrás.
      const right = t.l > box.l;
      const lead = right ? 'r' : 'l';
      const trail = right ? 'l' : 'r';
      gsap.to(box, { [lead]: t[lead], duration: 0.36, ease: easeBrand, onUpdate: paint });
      gsap.to(box, { [trail]: t[trail], duration: 0.6, ease: easeBrand, onUpdate: paint });
      gsap.to(pill, { opacity: 1, duration: 0.2 });
    };

    const enter = (a: HTMLElement) => { window.clearTimeout(leaveTimer); focused = a; moveTo(a); };
    const leave = () => {
      window.clearTimeout(leaveTimer);
      leaveTimer = window.setTimeout(() => { focused = null; moveTo(activeLink()); }, 140);
    };
    const offs: Array<() => void> = [];
    const on = <T extends EventTarget>(t: T, type: string, fn: EventListener) => { t.addEventListener(type, fn); offs.push(() => t.removeEventListener(type, fn)); };
    links.forEach((a) => {
      on(a, 'pointerenter', () => enter(a));
      on(a, 'focus', () => { if (a.matches(':focus-visible')) enter(a); });
    });
    on(nav, 'pointerleave', leave);
    on(nav, 'focusout', (e) => { if (!nav.contains((e as FocusEvent).relatedTarget as Node | null)) leave(); });
    // Header.tsx emite mm:header-active tras cada navegación (aria-current ya actualizado por React).
    on(document, 'mm:header-active', () => { if (!focused) moveTo(activeLink()); });

    const place = () => moveTo(focused ?? activeLink(), true);
    const ro = new ResizeObserver(place);
    ro.observe(nav);
    let alive = true;
    void document.fonts?.ready.then(() => { if (alive) place(); });
    place();

    return () => {
      alive = false;
      window.clearTimeout(leaveTimer);
      offs.forEach((off) => off());
      ro.disconnect();
      gsap.killTweensOf([box, pill]);
      gsap.set(pill, { clearProps: 'opacity,clipPath' });
    };
  });

  return () => {
    cleanups.forEach((fn) => { try { fn(); } catch { /* nodo ya retirado */ } });
    mm.revert();
    ctx.revert();
  };
}
