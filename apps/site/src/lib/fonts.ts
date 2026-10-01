/**
 * Fuente display (Crimson Pro) fuera de la ruta crítica. Solo cliente: se llama desde Layout tras hidratar.
 * Primera visita: espera a `load` + idle (los titulares ya están pintados con la cara de respaldo de métricas ajustadas).
 * Visitas repetidas: el archivo ya está en caché, se registra de inmediato para que no haya cambio de fuente visible.
 * Con la fuente añadida a document.fonts, el navegador vuelve a resolver font-family y reemplaza el respaldo (swap).
 */
const KEY = 'mm-serif';
let started = false;

export function loadDisplayFont(url: string): void {
  if (started || typeof window === 'undefined' || !('FontFace' in window)) return;
  started = true;
  const load = () => {
    const face = new FontFace('Crimson Pro', `url(${url}) format('woff2')`, { weight: '200 900', style: 'normal', display: 'swap' });
    face.load().then(() => {
      document.fonts.add(face);
      // Los titulares ya se midieron (pins, SplitText) con la cara de respaldo: motion-reveals re-mide al recibir esto.
      document.dispatchEvent(new Event('mm:fonts-loaded'));
      try { localStorage.setItem(KEY, '1'); } catch { /* storage bloqueado */ }
    }).catch(() => { /* sin la serif quedan el respaldo de métricas ajustadas y el resto del sitio intactos */ });
  };
  let warm = false;
  try { warm = localStorage.getItem(KEY) === '1'; } catch { /* storage bloqueado */ }
  if (warm) { load(); return; }
  const idle = () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(load, { timeout: 3000 });
    else setTimeout(load, 600);
  };
  if (document.readyState === 'complete') idle();
  else window.addEventListener('load', idle, { once: true });
}
