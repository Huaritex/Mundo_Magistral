import type Lenis from 'lenis';

/**
 * Registro mínimo SIN gsap (entra en el JS inicial): permite que Layout/PageScope y la navegación hablen con la capa
 * de animación cargada en idle sin importarla. Solo importaciones de tipo.
 */
export const bridge: {
  /** Revierte el contexto GSAP de la página actual. Lo registra motion-page; lo llama PageScope ANTES de que React quite los nodos. */
  release?: () => void;
  /** Lenis activo (solo tier >= 2 sin reduced motion). */
  lenis: Lenis | null;
} = { release: undefined, lenis: null };

/** Capítulo del Stage por ruta al navegar (mismo mapa que apps/web/src/scripts/lifecycle.ts → chapterForUrl). */
export function chapterForPath(path: string): string {
  if (path === '/') return 'hero';
  if (path.startsWith('/nosotros')) return 'historia';
  if (path.startsWith('/especialidades')) return 'especialidades';
  if (path.startsWith('/formas')) return 'formas';
  if (path.startsWith('/sucursales')) return 'sedes';
  if (path.startsWith('/medicos')) return 'medicos';
  if (path.startsWith('/cotizar')) return 'cotizar';
  if (path.startsWith('/preguntas')) return 'faq';
  return '404';
}

let lastKey: string | undefined;
/**
 * Scroll al inicio en cada navegación (idempotente por `location.key`: lo pueden invocar el proveedor y el runtime
 * en el mismo commit; gana el primero, que debe correr antes de crear los ScrollTrigger). La carga inicial no hace scroll.
 * Con hash se lleva al elemento; con Lenis activo se usa su API para no pelear con la inercia.
 */
export function resetScroll(key: string, hash: string): void {
  if (lastKey === undefined) { lastKey = key; return; }
  if (lastKey === key) return;
  lastKey = key;
  if (hash) {
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
    return;
  }
  if (bridge.lenis) bridge.lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}
