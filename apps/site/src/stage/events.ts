/** Puente DOM -> store. Mismos eventos que apps/web/src/scripts/lifecycle.ts. Devuelve la función de limpieza. */
import { detectStageTier } from './tier';
import { store } from './store';
import type { ProductKind } from '@mm/scene/types';

const FORMS = /^(capsula|crema|ovulo|gotero|jabon)$/;

export function bindStageEvents(): () => void {
  const on = <T,>(name: string, handler: (detail: T | undefined) => void) => {
    const listener = (event: Event) => handler((event as CustomEvent<T>).detail);
    document.addEventListener(name, listener);
    return () => document.removeEventListener(name, listener);
  };
  const offs = [
    // Selector de formas.
    on<{ forma?: string }>('mm:form-select', (detail) => {
      const kind = detail?.forma;
      if (kind && FORMS.test(kind)) store.selectForm(kind as ProductKind);
    }),
    // Hover/focus en el menú overlay.
    on<{ chapter?: string; active?: boolean }>('mm:nav-preview', (detail) => {
      if (detail?.active && detail.chapter) store.previewChapter(detail.chapter);
      else store.endPreview();
    }),
    // Preferencia de movimiento reducido: tier 1 (póster) o re-detección.
    on<{ reduce?: boolean }>('mm:motion-preference', (detail) => {
      if (detail?.reduce === undefined) return;
      if (detail.reduce) store.setTier(1);
      else void detectStageTier().then((tier) => store.setTier(tier));
    }),
    // Contexto WebGL perdido (lo dispara StageCanvas): cae a tier 1. Solo escucha, no re-emite.
    on('mm:stage-lost', () => store.setTier(1)),
  ];
  return () => offs.forEach((off) => off());
}
