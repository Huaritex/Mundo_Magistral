import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

/**
 * Único punto de entrada de GSAP en el sitio. Se llama motion-gsap.ts (como en Astro) para que este módulo compartido
 * salga en un chunk `motion-gsap-*` y cuente como "motion" en scripts/check-budgets.mjs. Registra los plugins una sola
 * vez; todo módulo de animación importa de aquí, nunca de 'gsap' directamente. Nunca debe entrar en el JS inicial:
 * solo lo importan módulos cargados en idle (motion-page, motion-header).
 */
gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/**
 * Ease de marca cubic-bezier(.16, 1, .3, 1): arranque decidido, aterrizaje largo (como una gota que asienta).
 * Misma curva que `CustomEase.create('mmBrand', '.16,1,.3,1')` de Astro, resuelta con Newton + bisección (~0.3 KiB)
 * en vez de cargar el plugin CustomEase (~3 KiB gz), que sacaba a motion+scroll del presupuesto de 60 KiB gz.
 */
function cubicBezier(x1: number, y1: number, x2: number, y2: number): (p: number) => number {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const x = (t: number) => ((ax * t + bx) * t + cx) * t;
  const y = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (p) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    let t = p;
    for (let i = 0; i < 6; i++) {
      const err = x(t) - p;
      const d = dx(t);
      if (Math.abs(err) < 1e-5 || Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    if (t < 0 || t > 1 || Math.abs(x(t) - p) > 1e-4) { // Newton no convergió: bisección
      let lo = 0, hi = 1;
      t = p;
      for (let i = 0; i < 24; i++) { if (x(t) < p) lo = t; else hi = t; t = (lo + hi) / 2; }
    }
    return y(t);
  };
}
export const easeBrand = cubicBezier(.16, 1, .3, 1);

export { gsap, ScrollTrigger, SplitText, useGSAP };
