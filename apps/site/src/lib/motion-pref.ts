/** Preferencia de movimiento reducido (query ?rm, toggle del footer o SO). Igual que apps/web/src/stage/tier.ts. Solo cliente. */
export function reducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  const rm = new URL(window.location.href).searchParams.get('rm');
  if (rm === '1') return true;
  if (rm === '0') return false;
  try {
    const saved = window.localStorage.getItem('mm-reduced-motion');
    if (saved === '1') return true;
    if (saved === '0') return false;
  } catch { /* storage bloqueado */ }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
