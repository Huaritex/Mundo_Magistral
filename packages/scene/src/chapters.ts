import type { SceneKey } from './types';

/**
 * Paleta de marca duplicada a propósito: este módulo (y blend.ts) no puede importar
 * @mm/brand/geometries/logo porque arrastraría three al bundle inicial del sitio.
 * rig.ts comprueba en tipos que coincide con BRAND.
 */
export const PALETTE = { teal: 0x00a8ac, violet: 0x6f4897, lilac: 0xa98bd0, pearl: 0xf4f7fb, night: 0x22163a, white: 0xffffff } as const;

export type ChapterPreset = { scene: SceneKey; base: number; a: number; b: number; cameraZ: number; cameraX?: number; cameraY?: number; fit?: number; particles?: number };

const { teal, violet, lilac, night, white } = PALETTE;

/**
 * Jerarquía de color (decisión de producto): BLANCO es el fondo dominante y el morado de marca es secundario.
 * Solo un capítulo usa la tinta violeta profunda como base: la banda del CTA final (`cta`, solo en la home). El pie es porcelana con una línea de cierre
 * en tinta y NO es un capítulo: el Stage conserva el del último bloque (así la banda del CTA no se aclara al llegar al pie).
 * Todo lo demás es blanco con un flujo suave de lila/violeta/turquesa (el shader atenúa el flujo según la luminancia
 * de la base: ver shaders/background.ts). La fórmula (`formula`, `filosofia`) también es clara: /nosotros solo tiene
 * ~2100 px de contenido claro y una fórmula oscura fijada (340 % de pantalla) lo dejaba en 35 % de recorrido claro.
 * `cameraX` desplaza la cámara sin reorientarla: negativo = el objeto aparece a la derecha, positivo = a la izquierda. Solo en pantallas anchas.
 * En vertical (teléfono) `cameraX` se anula, `cameraY` (negativo = el objeto sube) se aplica y `fit` aleja la cámara hasta que quepa
 * esa semianchura: el logo del hero entero en la mitad alta y el texto debajo.
 */
const LIGHT = white;
const NIGHT = night;

export const CHAPTERS: Record<string, ChapterPreset> = {
  hero: { scene: 'logo', base: LIGHT, a: teal, b: violet, cameraZ: 6.7, cameraX: -1.7, cameraY: -1, fit: 1.4, particles: .5 },
  'que-es': { scene: 'logo', base: LIGHT, a: teal, b: lilac, cameraZ: 4.6, particles: .45 },
  mundo: { scene: 'globe', base: LIGHT, a: teal, b: violet, cameraZ: 3.9, particles: .5 },
  mortero: { scene: 'mortar', base: LIGHT, a: teal, b: violet, cameraZ: 4.45, particles: .7 },
  formula: { scene: 'mortar', base: LIGHT, a: teal, b: violet, cameraZ: 4.2, particles: .8 },
  filosofia: { scene: 'puzzle', base: LIGHT, a: violet, b: lilac, cameraZ: 4.7, particles: .4 },
  historia: { scene: 'globe', base: LIGHT, a: violet, b: teal, cameraZ: 5.3, particles: .4 },
  mision: { scene: 'mission', base: LIGHT, a: violet, b: teal, cameraZ: 4.7, particles: .35 },
  vision: { scene: 'vision', base: LIGHT, a: violet, b: teal, cameraZ: 4.5, particles: .4 },
  especialidades: { scene: 'none', base: LIGHT, a: teal, b: violet, cameraZ: 5, particles: .35 },
  formas: { scene: 'products', base: LIGHT, a: teal, b: violet, cameraZ: 5.8, particles: .3 },
  sedes: { scene: 'globe', base: LIGHT, a: teal, b: lilac, cameraZ: 5.4, cameraX: 1.1, particles: .3 },
  medicos: { scene: 'vision', base: LIGHT, a: violet, b: lilac, cameraZ: 5.2, particles: .3 },
  cta: { scene: 'capsule', base: NIGHT, a: violet, b: teal, cameraZ: 4.45, particles: .6 },
  cotizar: { scene: 'none', base: LIGHT, a: teal, b: violet, cameraZ: 5, particles: 0 },
  faq: { scene: 'none', base: LIGHT, a: teal, b: violet, cameraZ: 5, particles: .1 },
  '404': { scene: 'globe', base: LIGHT, a: violet, b: teal, cameraZ: 5.5, particles: .4 },
};

/** Página (data-page) -> capítulo por defecto cuando la página no declara [data-chapter]. */
export const PAGE_CHAPTER: Record<string, string> = {
  home: 'hero', nosotros: 'historia', especialidades: 'especialidades',
  formas: 'formas', sucursales: 'sedes', medicos: 'medicos', cotizar: 'cotizar',
  faq: 'faq', '404': '404',
};

export function getPreset(chapter: string): ChapterPreset {
  return CHAPTERS[chapter] ?? CHAPTERS[PAGE_CHAPTER[chapter] ?? 'hero'];
}
