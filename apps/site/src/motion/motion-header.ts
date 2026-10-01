import { gsap, SplitText, easeBrand } from './motion-gsap';
import { isReduced, onReducedChange, setEnhancer } from '../lib/header-core';

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
            tl.fromTo(dialog, { clipPath: circle(0, o) }, { clipPath: circle(R, o), duration: 0.9, ease: 'power3.inOut' }, 0)
              .from(split.lines, { yPercent: 118, duration: 0.95, stagger: 0.065 }, 0.2)
              .from(parts(), { opacity: 0, y: 14, duration: 0.6, stagger: 0.09 }, 0.34);
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
              tl.to(split.lines, { yPercent: -112, duration: fast ? 0.3 : 0.42, ease: 'power3.in', stagger: { each: 0.03, from: 'end' } }, 0);
            }
            tl.to(parts(), { opacity: 0, duration: 0.25, ease: 'power1.in' }, 0)
              .to(dialog, { clipPath: circle(0, o), duration: fast ? 0.45 : 0.62, ease: 'power3.inOut' }, fast ? 0.08 : 0.16);
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

  /* ---------- 3. CTA magnético (solo puntero fino, radio corto) ---------- */
  mm.add('(min-width: 1150px) and (hover: hover) and (pointer: fine)', () => {
    const cta = header.querySelector<HTMLElement>('.header-cta');
    const zone = header.querySelector<HTMLElement>('.cta-zone');
    if (!cta || !zone) return;
    const xTo = gsap.quickTo(cta, 'x', { duration: 0.55, ease: 'power3' });
    const yTo = gsap.quickTo(cta, 'y', { duration: 0.55, ease: 'power3' });
    const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));
    const move = (e: PointerEvent) => {
      if (isReduced()) return;
      const r = zone.getBoundingClientRect(); // la zona no se transforma: referencia estable
      xTo(clamp((e.clientX - (r.left + r.width / 2)) * 0.24, 8));
      yTo(clamp((e.clientY - (r.top + r.height / 2)) * 0.32, 5));
    };
    // El listener de pointermove solo existe mientras el puntero está dentro de la zona.
    const enter = () => zone.addEventListener('pointermove', move);
    const out = () => { zone.removeEventListener('pointermove', move); xTo(0); yTo(0); };
    zone.addEventListener('pointerenter', enter);
    zone.addEventListener('pointerleave', out);
    return () => {
      zone.removeEventListener('pointerenter', enter);
      zone.removeEventListener('pointerleave', out);
      zone.removeEventListener('pointermove', move);
      gsap.killTweensOf(cta);
      gsap.set(cta, { clearProps: 'transform' });
    };
  });

  /* ---------- 4. WhatsApp: pulso discreto cada ~5 s ---------- */
  const ring = document.querySelector<HTMLElement>('.floating-wa .wa-ring');
  const icon = document.querySelector<HTMLElement>('.floating-wa svg');
  if (ring) {
    ctx.add(() => {
      const pulse = gsap.timeline({ repeat: -1, paused: true });
      pulse.to({}, { duration: 3.6 })
        .fromTo(ring, { scale: 1, opacity: 0.6 }, { scale: 1.5, opacity: 0, duration: 1.3, ease: 'power2.out', immediateRender: false })
        .fromTo(icon, { scale: 1 }, { scale: 1.12, duration: 0.22, ease: 'power2.out', yoyo: true, repeat: 1, immediateRender: false }, '<');
      const sync = () => {
        if (isReduced() || document.hidden) pulse.progress(1).pause();
        else pulse.restart();
      };
      document.addEventListener('visibilitychange', sync);
      const offReduced = onReducedChange(sync);
      sync();
      cleanups.push(() => {
        document.removeEventListener('visibilitychange', sync);
        offReduced();
        pulse.kill();
        gsap.set([ring, icon], { clearProps: 'transform,opacity' });
      });
    });
  }

  return () => {
    cleanups.forEach((fn) => { try { fn(); } catch { /* nodo ya retirado */ } });
    mm.revert();
    ctx.revert();
  };
}
