import { gsap } from './motion-gsap';

/** Hover magnético en CTAs grandes: solo puntero fino, radio corto, gsap.quickTo. Devuelve cleanup. */
export function bindMagnetic(): () => void {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};
  const targets = [...document.querySelectorAll<HTMLElement>('main .button-teal, main .button-primary')]
    .filter((el) => !el.closest('.quote-shell, .step-actions, [data-no-magnet]'));
  const off: Array<() => void> = [];
  targets.forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3.out' });
    const y = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3.out' });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      x(dx * 14);
      y(dy * 10 - 2);
    };
    const enter = () => el.classList.add('mm-gsap');
    const leave = () => {
      x(0); y(0);
      gsap.delayedCall(.55, () => { if (!el.matches(':hover')) { el.classList.remove('mm-gsap'); gsap.set(el, { clearProps: 'transform' }); } });
    };
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    off.push(() => {
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      el.classList.remove('mm-gsap');
      gsap.set(el, { clearProps: 'transform' });
    });
  });
  return () => off.forEach((fn) => fn());
}
