function initFormTabs() {
  const tabs = [...document.querySelectorAll('.form-tab')];
  const label = document.querySelector('#selected-form');
  const product = document.querySelector('#form-product');
  tabs.forEach((tab) => {
    if (tab.dataset.ready) return;
    tab.dataset.ready = '1';
    tab.addEventListener('click', () => {
      tabs.forEach((other) => {
        other.classList.remove('active');
        other.setAttribute('aria-pressed', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-pressed', 'true');
      if (label) label.textContent = tab.textContent ?? '';
      if (product) {
        product.hidden = !tab.dataset.imagen;
        if (tab.dataset.imagen) product.src = tab.dataset.imagen;
        else product.removeAttribute('src');
      }
      document.dispatchEvent(new CustomEvent('mm:form-select', { detail: { forma: tab.dataset.forma } }));
    });
  });
}
document.addEventListener('astro:page-load', initFormTabs);
initFormTabs();
