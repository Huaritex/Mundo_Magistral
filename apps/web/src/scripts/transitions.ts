/** Guarda el punto de origen de la navegación para la cortina circular de styles/transitions.css. */
document.addEventListener('click', (event) => {
  const link = (event.target as Element | null)?.closest?.('a[href]');
  if (!(link instanceof HTMLAnchorElement)) return;
  let x = event.clientX;
  let y = event.clientY;
  if (event.detail === 0 || (!x && !y)) {
    // Activación por teclado: el círculo nace en el centro del link.
    const rect = link.getBoundingClientRect();
    x = rect.left + rect.width / 2;
    y = rect.top + rect.height / 2;
  }
  const root = document.documentElement.style;
  root.setProperty('--vt-x', `${Math.round(x)}px`);
  root.setProperty('--vt-y', `${Math.round(y)}px`);
}, { capture: true, passive: true });
