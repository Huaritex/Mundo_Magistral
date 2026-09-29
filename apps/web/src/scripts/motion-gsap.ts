import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import { reducedMotion } from '../stage/tier';

/**
 * Único punto de entrada de GSAP en el sitio. Registra los plugins una sola vez para que
 * Rollup emita UN chunk `motion-gsap.*` compartido (los presupuestos lo cuentan como "motion").
 * Todo módulo de animación importa de aquí, nunca de 'gsap' directamente.
 */
gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);

/** Ease de marca: arranque decidido, aterrizaje largo (como una gota que asienta). */
export const easeBrand = CustomEase.create('mmBrand', '.16,1,.3,1');

export { gsap, ScrollTrigger, SplitText, reducedMotion };
