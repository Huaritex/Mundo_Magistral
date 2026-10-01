import { dur, ease } from '@mm/brand/motion';
import { gsap, ScrollTrigger } from './motion-gsap';
import { bindReveals, type RevealMode } from './motion-reveals';
import { store } from '../stage/store';

export type PageOptions = {
  mode: RevealMode;
  /** Pathname normalizado de la página (NO body[data-page]: Helmet lo actualiza de forma asíncrona). */
  path: string;
  /** Capítulo del Stage cuando la página no declara [data-chapter]. */
  fallbackChapter: string;
  /** La página acaba de montarse por navegación (intro del eyebrow). */
  fresh: boolean;
};

const $$ = <T extends HTMLElement = HTMLElement>(sel: string) => [...document.querySelectorAll<T>(sel)];

/**
 * Enlace página → Stage + reveals (port de createMotionController.bindPage de apps/web/src/scripts/scroll.ts).
 * Se invoca DENTRO del contexto de useGSAP (motion-page): los ScrollTrigger/tweens los revierte `context.revert()`;
 * la función devuelta limpia lo demás (observers, listeners, SplitText).
 *
 *  - 'light' (tier 1): solo reveals ligeros; el Stage es un póster, no hay pins ni puente.
 *  - 'full'  (tier 2/3): pins de home, un ScrollTrigger por [data-chapter] (goTo al activarse, progreso del capítulo),
 *    otro global (progreso de página, segundo argumento obligatorio de setProgress), entrada del hero y reveals.
 */
export function bindPage({ mode, path, fallbackChapter, fresh }: PageOptions): () => void {
  if (mode === 'light') return bindReveals({ mode, fresh });

  const cleanups: Array<() => void> = [];
  const chapters = $$('[data-chapter]');
  let revealCleanup: (() => void) | undefined;

  if (!chapters.length) {
    store.goTo(fallbackChapter);
    store.setActive(!document.hidden);
  } else {
    const active = chapters.find((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top <= innerHeight * .6 && rect.bottom >= innerHeight * .4;
    }) ?? chapters[0];
    let currentEl: HTMLElement = active;
    let chapterP = 0;
    let pageP = 0;
    store.goTo(active.dataset.chapter || 'hero');
    // Semántica de store.setProgress(progress, pageProgress): progreso 0..1 del capítulo activo + progreso global de la página.
    const push = () => store.setProgress(chapterP, pageP);

    // Visibilidad del canvas: sin ningún capítulo cerca del viewport (o pestaña oculta) el Stage baja a 250 ms/frame.
    const visible = new Set<Element>();
    const sync = () => store.setActive(!document.hidden && visible.size > 0);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target.hasAttribute('data-stage-off')) return;
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      sync();
    }, { rootMargin: '20% 0px' });
    chapters.forEach((chapter) => observer.observe(chapter));
    document.addEventListener('visibilitychange', sync);
    cleanups.push(() => { observer.disconnect(); visible.clear(); document.removeEventListener('visibilitychange', sync); });

    // Fijados solo en escritorio alto y solo las secciones que lo piden con [data-pin] (home: pregunta, proceso, fórmula;
    // /nosotros: fórmula). En móvil no hay pins: cada escena usa su rango de respaldo.
    const pinned = matchMedia('(min-width: 760px) and (min-height: 620px)').matches
      ? chapters.filter((el) => el.hasAttribute('data-pin')).slice(0, 3)
      : [];
    const distance = (el: HTMLElement) => ({ mortero: '+=150%', formula: '+=240%' }[el.dataset.chapter || ''] ?? '+=100%');
    pinned.forEach((element) => {
      ScrollTrigger.create({ trigger: element, start: 'top top', end: distance(element), pin: true, pinSpacing: true });
    });

    chapters.forEach((element) => {
      const chapter = element.dataset.chapter || 'hero';
      ScrollTrigger.create({
        trigger: element,
        start: 'top 60%',
        end: pinned.includes(element) ? distance(element) : 'bottom 40%',
        onToggle: (self) => {
          if (!self.isActive) return;
          currentEl = element;
          chapterP = self.progress;
          store.goTo(chapter);
          push();
        },
        onUpdate: (self) => { if (element === currentEl) { chapterP = self.progress; push(); } },
      });
    });

    const hero = document.querySelector<HTMLElement>('[data-chapter="hero"] h1, .page-hero h1');
    // H1 = LCP: solo transform (yPercent), nunca opacity.
    if (hero && hero.getBoundingClientRect().top < innerHeight) {
      gsap.fromTo(hero, { yPercent: 5 }, { yPercent: 0, duration: dur.reveal, ease: ease.enter, clearProps: 'transform' });
    }

    // Reveals y escenas de scroll: después de los pins (posiciones con pinSpacing), antes del refresh.
    revealCleanup = bindReveals({ mode, fresh });

    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => { pageP = self.progress; push(); },
    });
  }

  if (!revealCleanup) revealCleanup = bindReveals({ mode, fresh });
  ScrollTrigger.refresh();

  return () => {
    revealCleanup?.();
    cleanups.forEach((fn) => fn());
  };
}
