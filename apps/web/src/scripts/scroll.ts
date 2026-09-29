import { gsap, ScrollTrigger } from './motion-gsap';
import { bindReveals } from './motion-reveal';
import Lenis from 'lenis';
import type { Stage } from '../stage/Stage';
import { dur, ease } from '@mm/brand/motion';


export type MotionController = {
  bindPage: () => void;
  releasePage: () => void;
  scrollTop: () => void;
  /** Vista previa de un capítulo del Stage (p. ej. hover en nav); `endPreview` vuelve al capítulo activo por scroll. */
  previewChapter: (chapter: string) => void;
  endPreview: () => void;
  dispose: () => void;
};

/** One ticker owns Lenis, ScrollTrigger updates and the 3D renderer. */
export function createMotionController(stage: Stage): MotionController {
  const lenis = new Lenis({ duration: 1.08, smoothWheel: true, touchMultiplier: 1.2 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.lagSmoothing(0);
  const tick = (time: number) => {
    lenis.raf(time * 1000);
    stage.render(time, lenis.velocity);
  };
  gsap.ticker.add(tick);
  let pageCtx: gsap.Context | undefined;
  let revealCleanup: (() => void) | undefined;
  let activeChapter = 'hero';
  let observer: IntersectionObserver | undefined;
  const visible3D = new Set<Element>();

  function releasePage() {
    revealCleanup?.();
    revealCleanup = undefined;
    pageCtx?.revert();
    pageCtx = undefined;
    observer?.disconnect();
    observer = undefined;
    visible3D.clear();
  }

  function bindPage() {
    releasePage();
    const chapters = [...document.querySelectorAll<HTMLElement>('[data-chapter]')];
    if (!chapters.length) {
      stage.goTo(document.body.dataset.page || 'hero');
      stage.setViewportActive(true);
      return;
    }
    const active = chapters.find((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top <= innerHeight * .6 && rect.bottom >= innerHeight * .4;
    }) ?? chapters[0];
    activeChapter = active.dataset.chapter || 'hero';
    stage.goTo(activeChapter);
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target.hasAttribute('data-stage-off')) return;
        if (entry.isIntersecting) visible3D.add(entry.target);
        else visible3D.delete(entry.target);
      });
      stage.setViewportActive(visible3D.size > 0);
    }, { rootMargin: '20% 0px' });
    chapters.forEach((chapter) => observer?.observe(chapter));

    pageCtx = gsap.context(() => {
      const pinned = document.body.dataset.page === 'home' && matchMedia('(min-width: 760px)').matches
        ? chapters.filter((el) => el.hasAttribute('data-pin') || ['que-es', 'mortero', 'filosofia'].includes(el.dataset.chapter || '')).slice(0, 3)
        : [];
      pinned.forEach((element) => {
        const chapter = element.dataset.chapter;
        const distance = chapter === 'mortero' ? '+=150%' : '+=100%';
        ScrollTrigger.create({ trigger: element, start: 'top top', end: distance, pin: true, pinSpacing: true });
      });

      chapters.forEach((element) => {
        const chapter = element.dataset.chapter || 'hero';
        ScrollTrigger.create({
          trigger: element,
          start: 'top 60%',
          end: pinned.includes(element) ? (chapter === 'mortero' ? '+=150%' : '+=100%') : 'bottom 40%',
          onToggle: (self) => { if (self.isActive) { activeChapter = chapter; stage.goTo(chapter); } },
          onUpdate: (self) => stage.setProgress(chapter, self.progress),
        });
      });

      const hero = document.querySelector<HTMLElement>('[data-chapter="hero"] h1, .page-hero h1');
      if (hero && hero.getBoundingClientRect().top < innerHeight) {
        gsap.fromTo(hero, { yPercent: 5 }, { yPercent: 0, duration: dur.reveal, ease: ease.enter, clearProps: 'transform' });
      }

      // Reveals y escenas de scroll: después de los pins (posiciones con pinSpacing), antes del refresh.
      revealCleanup = bindReveals({ mode: 'full' });

      ScrollTrigger.create({
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => { stage.setProgress('global', self.progress); },
      });
    });
    ScrollTrigger.refresh();
  }

  return {
    bindPage,
    releasePage,
    scrollTop: () => { lenis.scrollTo(0, { immediate: true }); },
    previewChapter: (chapter) => { stage.goTo(chapter); },
    endPreview: () => { stage.goTo(activeChapter); },
    dispose: () => {
      releasePage();
      gsap.ticker.remove(tick);
      lenis.destroy();
    },
  };
}
