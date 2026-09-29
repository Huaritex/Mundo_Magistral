import { gsap, ScrollTrigger, SplitText, easeBrand, reducedMotion } from './motion-gsap';
import { bindMagnetic } from './motion-interactions';

/**
 * Coreografía de scroll de la marca. Una sola función (`bindReveals`) con dos modos:
 *  - 'full'  (tier 2/3, dentro de bindPage → gsap.context): SplitText, scrub, parallax, escenas firma.
 *  - 'light' (tier 1, sin WebGL): solo fade/translate/clip con ScrollTrigger.batch.
 * Regla: ningún estado oculto vive en CSS. Los estados iniciales los pone GSAP y `cleanup` los revierte;
 * con reduced motion no se crea nada y el contenido queda en su estado final.
 */

export type RevealMode = 'full' | 'light';
export type RevealOptions = { mode: RevealMode };

declare global { interface Window { __mmPageAt?: number } }

const START = 'clamp(top 88%)';
/** Bloques con escena propia o que no deben animarse de forma genérica (hero = LCP, formulario). */
const EXCLUDE = '.home-hero, .page-hero, .question-answer, .manifesto-main, .quote-shell, .process-list, .world-facts, .specialty-grid, .sede-grid, .forms-orbit, [data-no-reveal]';
const GENERIC = [
  '.section-kicker', '.section-head > p', '.prose p', '.split > div > p', '.split > p', '.split > .prose',
  '.manifesto .container > p', '.final-cta .container > p', '.grid-note', '.faq-list details', '.faq-contact',
  '.related-specialties a', '.hours-panel', '.sede-detail address', '.sede-detail .hero-actions', '[data-reveal]',
].join(',');

const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];
const inView = (el: Element, ratio = .92) => el.getBoundingClientRect().top < innerHeight * ratio;
const gsapClass = (els: Element[], on: boolean) => els.forEach((el) => el.classList.toggle('mm-gsap', on));
/** El pin de scroll.ts para esta sección, si existe (en móvil no hay pins). */
const pinOf = (el: Element) => ScrollTrigger.getAll().find((st) => st.pin === el);

export function bindReveals({ mode }: RevealOptions): () => void {
  if (reducedMotion()) return () => {};
  const full = mode === 'full';
  const restores: Array<() => void> = [];
  let disposed = false;

  const ctx = gsap.context(() => {
    const safe = (name: string, fn: () => void) => {
      try { fn(); } catch (error) { console.warn(`[motion] escena "${name}" omitida`, error); }
    };

    /** Rango de scrub de una sección: el mismo del pin si lo hay, si no una ventana de entrada. */
    const range = (section: Element, fallbackStart = 'top 75%', fallbackEnd = 'top 15%') => {
      // Funciones: se reevalúan en cada refresh (el pin de scroll.ts ya se refrescó antes, fue creado primero).
      return pinOf(section)
        ? { start: () => pinOf(section)?.start ?? 0, end: () => pinOf(section)?.end ?? 0 }
        : { start: fallbackStart, end: fallbackEnd };
    };

    /** Entrada contenida y en lote (gramática base para párrafos, listas y tarjetas). */
    const batchIn = (targets: HTMLElement[], vars: gsap.TweenVars = {}, from: gsap.TweenVars = { y: 28 }) => {
      const pending = targets.filter((el) => !inView(el));
      if (!pending.length) return;
      gsap.set(pending, { opacity: 0, ...from });
      ScrollTrigger.batch(pending, {
        start: START, once: true, interval: .1, batchMax: 6,
        onEnter: (batch) => gsap.to(batch, {
          opacity: 1, x: 0, y: 0, scale: 1, duration: .9, ease: easeBrand, stagger: .08,
          overwrite: true, clearProps: 'transform,opacity,willChange', ...vars,
        }),
      });
    };

    /* ---- a. Hero: eyebrow + salida con profundidad (solo full) ---- */
    safe('hero', () => {
      if (!full) return;
      const hero = $('.home-hero');
      const copy = $('.home-hero-copy');
      if (hero && copy) {
        const eyebrow = $('.hero-line', copy);
        // Solo si la página acaba de montarse: en la primera carga el bind llega tras el idle y el eyebrow ya se pintó.
        const fresh = performance.now() - (window.__mmPageAt ?? 0) < 700;
        if (eyebrow && fresh) {
          const split = SplitText.create(eyebrow, { type: 'words' });
          restores.push(() => split.revert());
          gsap.from(split.words, { opacity: .25, yPercent: 35, duration: .9, ease: easeBrand, stagger: .06, delay: .1, clearProps: 'transform,opacity' });
        }
        gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
          .to(copy, { yPercent: -14, scale: .94, opacity: 0, transformOrigin: '0% 60%', ease: 'power1.in' }, 0);
        return;
      }
      const pageHero = $('.page-hero > .container');
      if (pageHero) {
        gsap.timeline({ scrollTrigger: { trigger: pageHero.parentElement, start: 'top top', end: 'bottom top', scrub: true } })
          .to(pageHero, { yPercent: -8, opacity: .15, ease: 'power1.in' }, 0);
      }
    });

    /* ---- b. ¿Qué es una farmacia magistral?: la respuesta se ilumina palabra por palabra ---- */
    safe('pregunta', () => {
      const section = $('.section-question');
      const answer = section && $('.question-answer p', section);
      if (!section || !answer) return;
      if (!full) return;
      const split = SplitText.create(answer, { type: 'words' });
      restores.push(() => split.revert());
      gsap.timeline({ scrollTrigger: { trigger: section, ...range(section), scrub: .5 } })
        .fromTo(split.words, { opacity: .25 }, { opacity: 1, ease: 'none', stagger: .06, duration: .3 })
        .to({}, { duration: .5 });
    });

    /* ---- c. Cifras: count-up con rebote (el HTML ya trae el valor final) ---- */
    safe('cifras', () => {
      const facts = $('.world-facts');
      if (!facts) return;
      const items = $$('div', facts);
      if (!full) { batchIn(items, {}, { y: 24 }); return; }
      const numbers = $$('strong', facts);
      if (inView(facts)) return;
      gsap.set(items, { opacity: 0, y: 24 });
      numbers.forEach((el) => {
        const end = parseInt(el.textContent || '', 10);
        if (Number.isNaN(end)) return;
        const finalText = el.textContent || '';
        const from = end > 1900 ? 1990 : 0;
        const state = { v: from };
        el.textContent = String(from);
        restores.push(() => { el.textContent = finalText; });
        gsap.to(state, {
          v: end, duration: end > 1900 ? 1.6 : 1.2, ease: 'power2.out', snap: { v: 1 },
          onUpdate: () => { el.textContent = String(Math.round(state.v)); },
          onComplete: () => {
            el.textContent = finalText;
            gsap.fromTo(el, { scale: 1.07 }, { scale: 1, duration: .6, ease: 'back.out(3)', transformOrigin: '0% 100%', clearProps: 'transform' });
          },
          scrollTrigger: { trigger: el, start: START, once: true },
        });
      });
      ScrollTrigger.create({
        trigger: facts, start: START, once: true,
        onEnter: () => gsap.to(items, { opacity: 1, y: 0, duration: .8, ease: easeBrand, stagger: .1, clearProps: 'transform,opacity' }),
      });
    });

    /* ---- d. Proceso: línea que se dibuja + pasos que se activan en secuencia ---- */
    safe('proceso', () => {
      const list = $('.process-list');
      const section = list && list.closest('.process-section');
      if (!list) return;
      const steps = $$('li', list);
      if (!full) { batchIn(steps, {}, { y: 28 }); return; }
      const r = section ? range(section, 'top 70%', 'top 10%') : { start: 'top 75%', end: 'bottom 60%' };
      const tl = gsap.timeline({ scrollTrigger: { trigger: section ?? list, ...r, scrub: .6 } });
      list.classList.add('is-drawing');
      restores.push(() => list.classList.remove('is-drawing'));
      tl.fromTo(list, { '--line': 0 }, { '--line': 1, duration: 2.6, ease: 'none' }, 0);
      steps.forEach((li, i) => {
        tl.fromTo(li, { opacity: .35, y: 18 }, { opacity: 1, y: 0, duration: .6, ease: easeBrand }, .1 + i * .9);
      });
      tl.to({}, { duration: .4 });
    });

    /* ---- e. Manifiesto: palabras con scrub + pastillas que encajan (back.out) ---- */
    safe('manifiesto', () => {
      const section = $('.manifesto');
      const main = section && $('.manifesto-main', section);
      const pills = section ? $$('.manifesto-values span, .value-words span', section) : [];
      if (!section) return;
      if (main && full) {
        const split = SplitText.create(main, { type: 'words' });
        restores.push(() => split.revert());
        const tl = gsap.timeline({ scrollTrigger: { trigger: section, ...range(section, 'top 70%', 'top 10%'), scrub: .5 } });
        tl.fromTo(split.words, { opacity: .2 }, { opacity: 1, ease: 'none', stagger: .12, duration: .4 });
        if (pills.length) {
          tl.fromTo(pills, { opacity: 0, y: 46, scale: .7, rotation: -5 },
            { opacity: 1, y: 0, scale: 1, rotation: 0, duration: .5, ease: 'back.out(1.8)', stagger: .12 }, '-=.1');
        }
        tl.to({}, { duration: .3 });
        return;
      }
      if (pills.length) batchIn(pills, { ease: full ? 'back.out(1.8)' : easeBrand, stagger: .1 }, { y: 30, scale: full ? .75 : 1 });
    });

    /* ---- f. Especialidades: clip-path desde abajo + imagen 1.15 → 1 ---- */
    safe('especialidades', () => {
      const cards = $$('.specialty-card').filter((el) => !inView(el));
      if (!cards.length) return;
      const imgs = (batch: Element[]) => batch.map((c) => $('img', c)).filter(Boolean) as HTMLElement[];
      gsap.set(cards, { clipPath: 'inset(100% 0% 0% 0%)', willChange: 'clip-path' });
      if (full) gsap.set(imgs(cards), { scale: 1.15 });
      ScrollTrigger.batch(cards, {
        start: START, once: true, interval: .1, batchMax: 4,
        onEnter: (batch) => {
          const pics = full ? imgs(batch) : [];
          gsapClass(pics, true);
          gsap.to(batch, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: easeBrand, stagger: .09, overwrite: true, clearProps: 'clipPath,willChange' });
          if (pics.length) {
            gsap.to(pics, { scale: 1, duration: 1.3, ease: easeBrand, stagger: .09, overwrite: true, clearProps: 'transform', onComplete: () => gsapClass(pics, false) });
          }
        },
      });
      restores.push(() => gsapClass($$('.specialty-card img'), false));
    });

    /* ---- g. Formas: núcleo que rota + píldoras con parallax desigual (solo full) ---- */
    safe('formas', () => {
      const orbit = $('.forms-orbit');
      if (!orbit || !full) return;
      const trigger = { trigger: orbit, start: 'top bottom', end: 'bottom top', scrub: .6 };
      const core = $('.forms-core', orbit);
      if (core) gsap.fromTo(core, { rotation: -75 }, { rotation: 105, ease: 'none', scrollTrigger: trigger });
      const speeds = [-46, 60, -84];
      $$('.form-pill', orbit).forEach((pill, i) => {
        const d = speeds[i % speeds.length];
        gsap.fromTo(pill, { y: -d }, { y: d, ease: 'none', scrollTrigger: { ...trigger, scrub: true } });
      });
    });

    /* ---- h. Sedes y tarjetas: entrada contenida en lote ---- */
    safe('sedes', () => batchIn($$('.sede-card'), {}, { y: 34 }));

    /* ---- i. CTA final: el botón se asienta con un brillo que barre ---- */
    safe('cta', () => {
      const button = $('.final-cta .button');
      if (!button || !full || inView(button)) return;
      gsap.set(button, { scale: .94, transformOrigin: '50% 50%' });
      gsapClass([button], true);
      restores.push(() => gsapClass([button], false));
      ScrollTrigger.create({
        trigger: button, start: START, once: true,
        onEnter: () => {
          gsap.to(button, { scale: 1, duration: 1.1, ease: 'back.out(2.2)', clearProps: 'transform', onComplete: () => gsapClass([button], false) });
          gsap.fromTo(button, { '--sheen': -130 }, { '--sheen': 130, duration: 1.2, ease: 'power2.inOut', delay: .15, clearProps: '--sheen' });
        },
      });
    });

    /* ---- k. Páginas internas: parallax suave por data-parallax ---- */
    safe('parallax', () => {
      if (!full) return;
      $$('[data-parallax]').forEach((el) => {
        const v = (parseFloat(el.dataset.parallax || '') || .06) * 100;
        gsap.fromTo(el, { yPercent: -v }, { yPercent: v, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    });

    /* ---- l. Borde oscuro → claro: una cúpula clara que se abre con el scroll ---- */
    safe('borde', () => {
      const sections = $$('main > .section, main > .pin-spacer > .section');
      sections.forEach((el) => {
        const holder = el.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el;
        const prev = holder.previousElementSibling;
        const prevSection = prev?.classList.contains('pin-spacer') ? prev.firstElementChild : prev;
        if (!prevSection?.classList.contains('dark') || !(el.classList.contains('light') || el.classList.contains('white'))) return;
        el.classList.add('has-seam');
        restores.push(() => el.classList.remove('has-seam'));
        if (full) {
          gsap.fromTo(el, { '--seam': 0 }, { '--seam': 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 55%', scrub: true } });
        }
      });
    });

    /* ---- Gramática base: h2 en líneas con máscara; párrafos y listas en lote ---- */
    safe('titulos', () => {
      const headings = $$('main h2').filter((el) => !el.closest(EXCLUDE) && !inView(el, .85));
      if (full) {
        headings.forEach((h2) => {
          const split = SplitText.create(h2, {
            type: 'lines', mask: 'lines', linesClass: 'mm-line', autoSplit: true,
            onSplit: (self) => gsap.from(self.lines, {
              yPercent: 115, duration: 1.1, ease: easeBrand, stagger: .09,
              scrollTrigger: { trigger: h2, start: START, once: true },
            }),
          });
          restores.push(() => split.revert());
        });
      } else {
        batchIn(headings, {}, { y: 30 });
      }
    });
    safe('texto', () => {
      const seen = new Set<HTMLElement>();
      const items = $$(GENERIC).filter((el) => !el.closest(EXCLUDE) && !seen.has(el) && seen.add(el));
      batchIn(items);
    });

    /* ---- m. Footer: revelado escalonado sobrio ---- */
    safe('footer', () => {
      const footer = $('.site-footer');
      if (!footer) return;
      const parts = $$('.footer-brand, .footer-links a, .footer-contact > *, .footer-bottom', footer);
      if (inView(footer, .8)) return;
      gsap.set(parts, { opacity: 0, y: 18 });
      ScrollTrigger.create({
        trigger: footer, start: 'clamp(top 92%)', once: true,
        onEnter: () => gsap.to(parts, { opacity: 1, y: 0, duration: .8, ease: easeBrand, stagger: .045, clearProps: 'transform,opacity' }),
      });
    });

    if (full) safe('magnetico', () => { restores.push(bindMagnetic()); });
    ScrollTrigger.sort();
  });

  // Los saltos de línea de SplitText/fuentes cambian posiciones: un único refresh cuando las fuentes estén listas.
  void document.fonts?.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });

  return () => {
    disposed = true;
    restores.forEach((fn) => { try { fn(); } catch { /* nodo ya retirado */ } });
    ctx.revert();
  };
}

/* ---------- Modo ligero (tier 1): ciclo de vida propio ---------- */
let lightCleanup: (() => void) | undefined;

export function releaseLight() {
  lightCleanup?.();
  lightCleanup = undefined;
}

export function bindLight() {
  releaseLight();
  lightCleanup = bindReveals({ mode: 'light' });
  ScrollTrigger.refresh();
}
