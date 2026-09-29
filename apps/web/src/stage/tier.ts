export type StageTier = 1 | 2 | 3;

type Connection = { saveData?: boolean; effectiveType?: string };

export function reducedMotion(): boolean {
  const url = new URL(location.href);
  if (url.searchParams.get('rm') === '1') return true;
  if (url.searchParams.get('rm') === '0') return false;
  try {
    const saved = localStorage.getItem('mm-reduced-motion');
    if (saved === '1') return true;
    if (saved === '0') return false;
  } catch { /* storage can be denied */ }
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export async function detectStageTier(): Promise<StageTier> {
  if (reducedMotion()) return 1;
  const override = new URL(location.href).searchParams.get('tier');
  if (override === '1' || override === '2' || override === '3') return Number(override) as StageTier;
  const connection = (navigator as Navigator & { connection?: Connection }).connection;
  if (connection?.saveData || /^(2g|slow-2g|3g)$/.test(connection?.effectiveType ?? '')) return 1;
  try {
    const { getGPUTier } = await import('detect-gpu');
    const gpu = await getGPUTier({ benchmarksURL: '/benchmarks' });
    return gpu.tier >= 3 ? 3 : gpu.tier >= 2 ? 2 : 1;
  } catch {
    // A missing benchmark or blocked WebGL fails into the static poster route.
    return 1;
  }
}
