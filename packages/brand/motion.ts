/** Shared durations and easing names for the web stage and offline video. */
export const ease = {
  magistral: 'power3.inOut',
  enter: 'expo.out',
  settle: 'back.out(1.4)',
  drift: 'sine.inOut',
} as const;

export const dur = { micro: 0.18, ui: 0.35, reveal: 0.9, chapter: 1.4, page: 0.8 } as const;
export const stagger = { chars: 0.018, words: 0.06, cards: 0.08 } as const;
