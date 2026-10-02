import { gsap, easeBrand } from './motion-gsap';

/** Timeline única de 3,65 s. El puente final usa el DOM real, no coordenadas inventadas. */
export function animateIntro(root: HTMLElement, complete: () => void, debugAt?: number) {
  const find = (selector: string) => root.querySelector<HTMLElement>(selector)!;
  const hero = document.querySelector<HTMLElement>('main .hero-shell');
  const heading = hero?.querySelector<HTMLElement>('h1');
  if (!hero || !heading) { complete(); return { skip: complete, dispose: () => {} }; }
  const bridge = find('.intro-hero-bridge');
  const message = find('.intro-message');
  const clone = hero.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
  clone.querySelectorAll('[aria-current]').forEach((node) => node.removeAttribute('aria-current'));
  bridge.appendChild(clone);
  const bounds = hero.getBoundingClientRect();
  const titleBounds = heading.getBoundingClientRect();
  const type = getComputedStyle(heading);
  Object.assign(bridge.style, { left: `${bounds.left}px`, top: `${bounds.top}px`, width: `${bounds.width}px`, height: `${bounds.height}px` });
  Object.assign(message.style, { left: `${titleBounds.left}px`, top: `${titleBounds.top}px`, width: `${titleBounds.width}px`, fontFamily: type.fontFamily, fontSize: type.fontSize, fontWeight: type.fontWeight, lineHeight: type.lineHeight, letterSpacing: type.letterSpacing });
  const mobile = window.innerWidth <= 850;
  const science = find('.intro-science-word');
  const precision = find('.intro-precision-word');
  const target = find('.intro-target');
  const editorial = find('.intro-editorial');
  const personal = find('.intro-personal-word');
  const product = find('.intro-product');
  const card = find('.intro-formula-card');
  const brand = find('.intro-brand');
  const logo = find('.intro-brand-logo');
  const name = find('.intro-brand-name');
  const cloneHeading = clone.querySelector('h1');
  const cloneSupport = clone.querySelectorAll('.hero-description, .hero-actions, .hero-carousel-controls');
  const cloneCard = clone.querySelector('.hero-info-card');
  let closing = false;
  const context = gsap.context(() => {}, root);
  const timeline = gsap.timeline({ defaults: { ease: easeBrand }, onComplete: complete });
  context.add(() => {
    gsap.set(precision, { yPercent: 115, opacity: 1 });
    gsap.set(science, { yPercent: 105 });
    gsap.set(target, { opacity: .25, scale: .86 });
    gsap.set(editorial, { visibility: 'visible', clipPath: 'inset(0% 0% 0% 100%)' });
    gsap.set([personal, product, card, logo, name, message, bridge], { opacity: 0 });
    gsap.set(brand, { visibility: 'visible', clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set(message, { x: (mobile ? 24 : window.innerWidth * .08) - titleBounds.left, y: window.innerHeight * (mobile ? .49 : .43) - titleBounds.top, scale: mobile ? 1.04 : 1.16, transformOrigin: 'left top' });
    gsap.set(cloneHeading, { opacity: 0 });
    gsap.set(cloneSupport, { opacity: 0 });
    gsap.set(cloneCard, { opacity: 0, y: 18 });
    timeline.to(science, { yPercent: 0, duration: .42 }, 0)
      .to(find('.intro-rule'), { scaleX: 1, duration: .5 }, .05)
      .to(science, { yPercent: -110, duration: .32 }, .55)
      .to(precision, { yPercent: 0, duration: .4 }, .61)
      .to(target, { opacity: .68, scale: 1, duration: .5 }, .58)
      .to(editorial, { clipPath: 'inset(0% 0% 0% 0%)', duration: .32 }, 1.14)
      .fromTo(product, { x: 28, scale: 1.07 }, { x: 0, scale: 1, opacity: 1, duration: .45 }, 1.23)
      .fromTo(personal, { y: 36 }, { y: 0, opacity: 1, duration: .35 }, 1.28)
      .fromTo(card, { y: 28, scale: .96 }, { y: 0, scale: 1, opacity: 1, duration: .4 }, 1.47)
      .to([card, personal], { y: -16, opacity: 0, duration: .25 }, 2.02)
      .to(product, { scale: 1.03, duration: .55 }, 1.72)
      .to(brand, { clipPath: 'inset(0% 0% 0% 0%)', duration: .34 }, 2.06)
      .fromTo(logo, { y: 16, scale: .96 }, { y: 0, scale: 1, opacity: 1, duration: .32 }, 2.16)
      .fromTo(name, { y: 12 }, { y: 0, opacity: 1, duration: .3 }, 2.28)
      .to(message, { opacity: 1, duration: .25 }, 2.48)
      .to([logo, name], { y: -12, opacity: 0, duration: .25 }, 2.79)
      .to([find('.intro-science'), editorial, brand], { opacity: 0, duration: .28 }, 2.9)
      .to(root, { backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--paper').trim(), duration: .35 }, 2.9)
      .fromTo(bridge, { scale: 1.025, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: .5 }, 2.89)
      .to(message, { x: 0, y: 0, scale: 1, duration: .56 }, 2.91)
      .to(cloneCard, { y: 0, opacity: 1, duration: .33 }, 3.13)
      .to(cloneSupport, { opacity: 1, duration: .33, stagger: .03 }, 3.17)
      .call(() => { document.documentElement.dataset.mmIntroExiting = '1'; }, [], 3.15)
      .to(cloneHeading, { opacity: 1, duration: .05 }, 3.47)
      .to(message, { opacity: 0, duration: .05 }, 3.47)
      .to(root, { clipPath: 'inset(100% 0% 0% 0%)', duration: .4, ease: 'power2.inOut' }, 3.25);
  });
  if (debugAt !== undefined) {
    timeline.pause(debugAt);
    if (debugAt >= 3.15) document.documentElement.dataset.mmIntroExiting = '1';
  }
  const skip = () => {
    if (closing) return;
    closing = true;
    timeline.kill();
    document.documentElement.dataset.mmIntroExiting = '1';
    context.add(() => { gsap.to(root, { clipPath: 'inset(100% 0% 0% 0%)', duration: .3, ease: easeBrand, overwrite: true, onComplete: complete }); });
  };
  return { skip, dispose: () => { timeline.kill(); context.revert(); clone.remove(); } };
}
