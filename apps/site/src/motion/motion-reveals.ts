import { gsap, ScrollTrigger, SplitText, easeBrand } from './motion-gsap';
import { bindMagnetic } from './motion-interactions';
import { reducedMotion } from '../lib/motion-pref';
import { store } from '../stage/store';

/**
 * Coreografía de scroll de la marca. Una sola función (`bindReveals`) con dos modos:
 *  - 'full'  (tier 2/3): SplitText, scrub, parallax, escenas firma.
 *  - 'light' (tier 1, sin WebGL): solo revelados con clip-path (sin opacidad, sin scrub).
 * Debe llamarse DENTRO del contexto activo de useGSAP (motion-page): todo tween/ScrollTrigger creado aquí lo revierte
 * `context.revert()` al cambiar de ruta; `bindReveals` devuelve además la limpieza de lo que GSAP no revierte
 * (SplitText, textos del count-up, clases).
 *
 * Criterio de diseño (apps/site/DESIGN.md): no hay fade-up genérico. Cada movimiento pertenece a su contenido:
 *   la cifra que cuenta, el trazo de puntos que se dibuja, la línea del proceso, las palabras de la respuesta y de la
 *   filosofía que se iluminan, la etiqueta de sede que se imprime, la foto que se abre, el titular que sube en su máscara.
 *   El texto corrido no se anima.
 * Reglas: ningún estado oculto vive en CSS (los pone GSAP; sin JS / reduced motion / tier 1 todo queda visible) y el texto
 * iluminado por scroll nunca baja de opacidad .6 (texto grande, 3:1 incluso con el peor fondo que calcula axe: sección translúcida
 * sobre el cuerpo claro, porque no ve el canvas). SplitText sobre <p> va con aria:'none' (aria-label está prohibido en párrafos).
 */

export type RevealMode = 'full' | 'light';
/** `fresh`: la página acaba de montarse por navegación (el titular del hero sube en su máscara solo entonces). */
export type RevealOptions = { mode: RevealMode; fresh?: boolean };

const START = 'clamp(top 88%)';
/** Bloques con escena propia o que no deben llevar el titular animado genérico (hero = LCP, fórmula, formulario). */
const EXCLUDE = '.home-hero, .page-hero, .question-answer, .formula, .quote-shell, [data-no-reveal]';

const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];
const inView = (el: Element, ratio = .92) => el.getBoundingClientRect().top < innerHeight * ratio;
const gsapClass = (els: Element[], on: boolean) => els.forEach((el) => el.classList.toggle('mm-gsap', on));
/** El pin de motion-scroll para esta sección, si existe (en móvil no hay pins). */
const pinOf = (el: Element) => ScrollTrigger.getAll().find((st) => st.pin === el);

export function bindReveals({ mode, fresh = false }: RevealOptions): () => void {
  if (reducedMotion()) return () => {};
  const full = mode === 'full';
  const restores: Array<() => void> = [];
  let disposed = false;

  const safe = (name: string, fn: () => void) => {
    try { fn(); } catch (error) { console.warn(`[motion] escena "${name}" omitida`, error); }
  };

  /** Rango de scrub de una sección: el mismo del pin si lo hay, si no una ventana de entrada. */
  const range = (section: Element, fallbackStart = 'top 75%', fallbackEnd = 'top 15%') => {
    // Funciones: se reevalúan en cada refresh (el pin de motion-scroll ya se refrescó antes, fue creado primero).
    return pinOf(section)
      ? { start: () => pinOf(section)?.start ?? 0, end: () => pinOf(section)?.end ?? 0 }
      : { start: fallbackStart, end: fallbackEnd };
  };

  /** Titular que sube dentro de su máscara de línea (solo transform: nunca opacidad). */
  const lineReveal = (el: HTMLElement, vars: gsap.TweenVars = {}, aria: 'auto' | 'none' = 'auto') => {
    const split = SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'mm-line', autoSplit: true, aria,
      onSplit: (self) => gsap.from(self.lines, { yPercent: 115, duration: 1.1, ease: easeBrand, stagger: .09, ...vars }),
    });
    restores.push(() => split.revert());
  };

  /* ---- a. Hero: el titular sube en su máscara al navegar; salida con profundidad al hacer scroll (solo full) ---- */
  safe('hero', () => {
    if (!full) return;
    const hero = $('.home-hero');
    const copy = $('.home-hero-copy');
    if (hero && copy) {
      const h1 = $('h1', copy);
      // Solo si la página acaba de montarse: en la primera carga el bind llega tras el idle y el H1 ya se pintó (LCP).
      if (h1 && fresh) lineReveal(h1, { delay: .1, clearProps: 'transform' });
      gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
        .to(copy, { yPercent: -14, scale: .94, opacity: 0, transformOrigin: '0% 60%', ease: 'power1.in' }, 0);
      return;
    }
    const pageHero = $('.page-hero > .container');
    if (pageHero) {
      const h1 = $('h1', pageHero);
      if (h1 && fresh) lineReveal(h1, { delay: .1, clearProps: 'transform' });
      gsap.timeline({ scrollTrigger: { trigger: pageHero.parentElement, start: 'top top', end: 'bottom top', scrub: true } })
        .to(pageHero, { yPercent: -8, opacity: .15, ease: 'power1.in' }, 0);
    }
  });

  /* ---- b. ¿Qué es una farmacia magistral?: la respuesta se ilumina palabra por palabra ---- */
  safe('pregunta', () => {
    const section = $('.section-question');
    const answer = section && $('.question-answer p', section);
    if (!section || !answer || !full) return;
    const split = SplitText.create(answer, { type: 'words', aria: 'none' });
    restores.push(() => split.revert());
    gsap.timeline({ scrollTrigger: { trigger: section, ...range(section), scrub: .5 } })
      .fromTo(split.words, { opacity: .6 }, { opacity: 1, ease: 'none', stagger: .06, duration: .3 })
      .to({}, { duration: .5 });
  });

  /* ---- c. Cifras con puntos guía: la cifra cuenta y el trazo de puntos se dibuja hasta ella (el HTML ya trae el valor final) ---- */
  safe('cifras', () => {
    const facts = $('.facts');
    if (!facts || !full || inView(facts)) return;
    $$('.num', facts).forEach((el) => {
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
          gsap.fromTo(el, { scale: 1.06 }, { scale: 1, duration: .6, ease: 'back.out(3)', transformOrigin: '100% 100%', clearProps: 'transform' });
        },
        scrollTrigger: { trigger: el, start: START, once: true },
      });
    });
    $$('div', facts).forEach((row) => {
      gsap.fromTo(row, { '--leader': 0 }, { '--leader': 1, duration: 1.3, ease: easeBrand, clearProps: '--leader', scrollTrigger: { trigger: row, start: START, once: true } });
    });
  });

  /* ---- d. ¿Cómo funciona?: la línea se dibuja y cada paso se enciende en secuencia (única lista numerada) ---- */
  safe('proceso', () => {
    const list = $('.process-list');
    if (!list || !full) return;
    const section = list.closest('.process-section');
    const r = section ? range(section, 'top 70%', 'top 10%') : { start: 'top 75%', end: 'bottom 60%' };
    const tl = gsap.timeline({ scrollTrigger: { trigger: section ?? list, ...r, scrub: .6 } });
    tl.fromTo(list, { '--line': 0 }, { '--line': 1, duration: 2.6, ease: 'none' }, 0);
    $$('li', list).forEach((li, i) => {
      tl.fromTo(li, { '--node': 0, y: 22 }, { '--node': 1, y: 0, duration: .6, ease: easeBrand }, .1 + i * .9);
    });
    tl.to({}, { duration: .4 });
  });

  /* ---- e. La fórmula de la filosofía (único momento memorable) ----
     Rp/ → cada ingrediente se "pesa" (su término y su cantidad se imprimen y el trazo de puntos los une) → la raya y el "="
     → las palabras de la frase ancla se iluminan. Al llegar el resultado el Stage pasa de 'formula' (mortero) a 'filosofia'. */
  safe('formula', () => {
    const section = $('.formula');
    const h2 = section && $('.formula-result h2', section);
    if (!section || !h2 || !full) return;
    const rows = $$('.formula-terms > div', section);
    // Líneas con máscara (el resultado sube línea a línea, también en móvil) y palabras que se iluminan dentro.
    const split = SplitText.create(h2, { type: 'lines,words', mask: 'lines', linesClass: 'mm-line' });
    restores.push(() => split.revert());
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section, ...range(section, 'top 75%', 'bottom 55%'), scrub: .6,
        // Solo con la sección activa: fuera de ella manda el [data-chapter] de motion-scroll.
        onUpdate: (self) => { if (self.isActive) store.goTo(self.progress > .58 ? 'filosofia' : 'formula'); },
      },
    });
    const print = 'inset(0% 100% 0% 0%)';
    rows.forEach((row, i) => {
      const at = i * .75;
      tl.fromTo($('dt', row), { clipPath: print }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .55, ease: 'power2.out' }, at)
        .fromTo(row, { '--leader': 0 }, { '--leader': 1, duration: .6, ease: 'none' }, at + .3)
        .fromTo($('dd', row), { clipPath: print }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .45, ease: 'power2.out' }, at + .55);
    });
    tl.fromTo($('.formula-result', section), { '--rule': 0 }, { '--rule': 1, duration: .6, ease: 'power2.inOut' }, 2.4)
      .fromTo($('.formula-equals', section), { scale: 0, transformOrigin: '50% 60%' }, { scale: 1, duration: .5, ease: 'back.out(2.4)' }, 2.6)
      .fromTo(split.lines, { yPercent: 115 }, { yPercent: 0, duration: .55, ease: 'power2.out', stagger: .14 }, 2.7)
      .fromTo(split.words, { opacity: .6 }, { opacity: 1, ease: 'none', stagger: .12, duration: .35 }, 2.9)
      .to({}, { duration: .5 });
  });

  /* ---- f. Especialidades: clip-path desde abajo + foto 1.15 → 1 ---- */
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

  /* ---- g. Formas: los nombres se "imprimen" de izquierda a derecha ---- */
  safe('formas', () => {
    const items = $$('.forms-list li').filter((el) => !inView(el));
    if (!items.length) return;
    gsap.set(items, { clipPath: 'inset(0% 100% 0% 0%)' });
    ScrollTrigger.batch(items, {
      start: START, once: true, interval: .1, batchMax: 4,
      onEnter: (batch) => gsap.to(batch, { clipPath: 'inset(0% 0% 0% 0%)', duration: .9, ease: easeBrand, stagger: .07, overwrite: true, clearProps: 'clipPath' }),
    });
  });

  /* ---- h. Sedes: la etiqueta de preparado se imprime de arriba abajo y sus trazos de puntos se dibujan ---- */
  safe('sedes', () => {
    const tags = $$('.sede-tag').filter((el) => !inView(el));
    if (!tags.length) return;
    gsap.set(tags, { clipPath: 'inset(0% 0% 100% 0%)', willChange: 'clip-path' });
    if (full) tags.forEach((tag) => gsap.set($$('.leaders > div', tag), { '--leader': 0 }));
    ScrollTrigger.batch(tags, {
      start: START, once: true, interval: .1, batchMax: 4,
      onEnter: (batch) => {
        gsap.to(batch, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: easeBrand, stagger: .1, overwrite: true, clearProps: 'clipPath,willChange' });
        if (full) batch.forEach((tag, i) => gsap.to($$('.leaders > div', tag), { '--leader': 1, duration: .9, ease: easeBrand, stagger: .12, delay: .35 + i * .1, clearProps: '--leader' }));
      },
    });
  });

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

  /* ---- Titulares: cada h2 sube en líneas con máscara (solo full; el texto corrido no se anima) ---- */
  safe('titulos', () => {
    if (!full) return;
    $$('main h2').filter((el) => !el.closest(EXCLUDE) && !inView(el, .85)).forEach((h2) => {
      lineReveal(h2, { scrollTrigger: { trigger: h2, start: START, once: true } });
    });
  });

  /* ---- m. Pie: la frase de marca sube en su máscara ---- */
  safe('footer', () => {
    const phrase = $('.footer-brand p');
    if (!phrase || !full || inView(phrase, .9)) return;
    lineReveal(phrase, { duration: 1, scrollTrigger: { trigger: phrase, start: 'clamp(top 92%)', once: true } }, 'none');
  });

  if (full) safe('magnetico', () => { restores.push(bindMagnetic()); });
  ScrollTrigger.sort();

  // Los saltos de línea de SplitText/fuentes cambian posiciones: un refresh cuando las fuentes estén listas y otro cuando lib/fonts.ts
  // registre la serif display (se carga tras `load`, después de que estas escenas se midieran con la cara de respaldo).
  void document.fonts?.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });
  const onFonts = () => { if (!disposed) ScrollTrigger.refresh(); };
  document.addEventListener('mm:fonts-loaded', onFonts);
  restores.push(() => document.removeEventListener('mm:fonts-loaded', onFonts));

  return () => {
    disposed = true;
    restores.forEach((fn) => { try { fn(); } catch { /* nodo ya retirado */ } });
  };
}
