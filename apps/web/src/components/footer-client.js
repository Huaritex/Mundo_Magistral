function initMotionToggle() {
  const toggle = document.querySelector('#motion-toggle');
  if (!toggle || toggle.dataset.ready) return;
  toggle.dataset.ready = '1';
  const sync = () => {
    const reduce = localStorage.getItem('mm-reduced-motion') === '1';
    toggle.setAttribute('aria-pressed', String(reduce));
    toggle.textContent = reduce ? 'Activar animaciones' : 'Reducir animaciones';
    document.documentElement.classList.toggle('reduce-motion', reduce);
  };
  sync();
  toggle.addEventListener('click', () => {
    const reduce = localStorage.getItem('mm-reduced-motion') !== '1';
    localStorage.setItem('mm-reduced-motion', reduce ? '1' : '0');
    document.dispatchEvent(new CustomEvent('mm:motion-preference', { detail: { reduce } }));
    sync();
  });
}
document.addEventListener('astro:page-load', initMotionToggle);
initMotionToggle();
