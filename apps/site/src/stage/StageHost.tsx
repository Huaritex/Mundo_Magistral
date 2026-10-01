/**
 * Punto de entrada ligero (sin three) para el layout: detecta el tier, enlaza los eventos DOM y solo si tier >= 2
 * descarga el chunk del Stage (React.lazy). Con tier 1 el póster (#stage-poster) queda visible.
 */
import { Suspense, lazy, useEffect, useSyncExternalStore } from 'react';
import { bindStageEvents } from './events';
import { store } from './store';
import { detectStageTier } from './tier';

const StageCanvas = lazy(() => import('./StageCanvas'));

export default function StageHost() {
  const tier = useSyncExternalStore(store.subscribe, () => store.getSnapshot().tier, () => 1);

  useEffect(() => bindStageEvents(), []);

  // Detección diferida para no competir con el LCP del póster.
  useEffect(() => {
    let alive = true;
    const run = () => { void detectStageTier().then((t) => { if (alive) store.setTier(t); }); };
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(run, { timeout: 1500 });
      return () => { alive = false; window.cancelIdleCallback(id); };
    }
    const id = setTimeout(run, 450);
    return () => { alive = false; clearTimeout(id); };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.stageTier = String(tier);
    if (tier === 1) document.getElementById('stage-poster')?.style.setProperty('opacity', '1');
  }, [tier]);

  return tier > 1 ? <Suspense fallback={null}><StageCanvas /></Suspense> : null;
}
