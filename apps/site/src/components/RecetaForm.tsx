import { useEffect, useRef } from 'react';
import { Head } from 'vite-react-ssg';
import { centralWhatsapp, sedes } from '../content/data';
import { turnstileKey } from '../lib/site';

// PROPUESTO: microcopy del flujo de cotización y mensaje de WhatsApp; requiere validación de negocio y privacidad.
// Activar únicamente tras aprobar privacidad, retención y probar todos los bindings en preview.

type TurnstileApi = { render: (element: HTMLElement, options: { sitekey: string }) => unknown };

/**
 * Mejora progresiva del formulario (misma lógica que el <script> de RecetaForm.astro).
 * El marcado se renderiza estático y sin estado de React; el flujo por pasos es imperativo sobre ese DOM
 * (React no re-renderiza este componente, así que no pisa los atributos hidden/aria que fija el script).
 */
function enhanceRecetaForm(shell: HTMLElement, form: HTMLFormElement): () => void {
  const ac = new AbortController();
  const { signal } = ac;
  shell.classList.add('enhanced');
  let turnstileTimer: number | undefined;

  const renderTurnstile = () => {
    const widget = form.querySelector<HTMLElement>('.cf-turnstile');
    if (!widget || widget.dataset.rendered) return;
    const turnstile = (window as Window & { turnstile?: TurnstileApi }).turnstile;
    if (!turnstile || !widget.dataset.sitekey) return;
    turnstile.render(widget, { sitekey: widget.dataset.sitekey });
    widget.dataset.rendered = '1';
  };
  renderTurnstile();
  if (shell.dataset.turnstile === 'enabled' && !form.querySelector('.cf-turnstile[data-rendered]')) {
    let attempts = 0;
    turnstileTimer = window.setInterval(() => {
      renderTurnstile();
      attempts += 1;
      if (form.querySelector('.cf-turnstile[data-rendered]') || attempts >= 40) window.clearInterval(turnstileTimer);
    }, 150);
  }

  const steps = Array.from(form.querySelectorAll<HTMLElement>('.quote-step'));
  const progress = Array.from(shell.querySelectorAll<HTMLElement>('.quote-progress span'));
  const sede = form.querySelector<HTMLSelectElement>('#sede')!;
  const nombre = form.querySelector<HTMLInputElement>('#nombre')!;
  const telefono = form.querySelector<HTMLInputElement>('#telefono')!;
  const camera = form.querySelector<HTMLInputElement>('#receta-camera')!;
  const upload = form.querySelector<HTMLInputElement>('#receta-file')!;
  const consentimiento = form.querySelector<HTMLInputElement>('#consentimiento')!;
  let selectedFile: File | undefined;
  const querySede = new URLSearchParams(window.location.search).get('sede');
  const storedSede = localStorage.getItem('mm-last-sede');
  if (querySede && Array.from(sede.options).some((option) => option.value === querySede)) sede.value = querySede;
  else if (storedSede && Array.from(sede.options).some((option) => option.value === storedSede)) sede.value = storedSede;
  sede.addEventListener('change', () => localStorage.setItem('mm-last-sede', sede.value), { signal });
  [camera, upload].forEach((input) => input.addEventListener('change', () => {
    selectedFile = input.files?.[0];
    if (input === camera) upload.value = ''; else camera.value = '';
    showError('receta', '');
  }, { signal }));
  // `scroll` solo al cambiar de paso por acción de la persona: al montar, la página debe quedar arriba (antes saltaba al formulario y tapaba el titular).
  const showStep = (step: number, scroll = true) => {
    steps.forEach((item) => { item.hidden = Number(item.dataset.step) !== step; });
    progress.forEach((item, index) => item.classList.toggle('active', index < step));
    if (!scroll) return;
    if (step > 1) steps[step - 1]?.querySelector<HTMLElement>('input, select, button')?.focus();
    shell.scrollIntoView({ behavior: 'instant', block: 'start' });
  };
  const showError = (id: string, message: string) => {
    const target = form.querySelector<HTMLElement>(`#${id}-error`);
    const field = form.querySelector<HTMLElement>(`#${id}`);
    if (target) { target.textContent = message; target.hidden = !message; }
    if (field) { field.setAttribute('aria-invalid', message ? 'true' : 'false'); field.setAttribute('aria-describedby', message ? `${id}-error` : ''); }
    if (id === 'receta') [camera, upload].forEach((input) => { input.setAttribute('aria-invalid', message ? 'true' : 'false'); input.setAttribute('aria-describedby', message ? 'receta-error' : ''); });
  };
  const validStep = (step: number) => {
    if (step === 1) {
      const valid = Boolean(sede.value);
      showError('sede', valid ? '' : 'Elige una sede para continuar.');
      if (!valid) sede.focus();
      return valid;
    }
    if (step === 2) {
      const nameOk = nombre.value.trim().length >= 2;
      const phoneOk = /^[+\d\s()-]{7,24}$/.test(telefono.value.trim());
      const fileOk = Boolean(selectedFile && selectedFile.size <= 10 * 1024 * 1024);
      showError('nombre', nameOk ? '' : 'Escribe tu nombre completo.');
      showError('telefono', phoneOk ? '' : 'Escribe un número de teléfono válido.');
      showError('receta', fileOk ? '' : selectedFile ? 'El archivo debe pesar 10\u00a0MB o menos.' : 'Elige una foto o PDF de la receta.');
      if (!nameOk) nombre.focus(); else if (!phoneOk) telefono.focus(); else if (!fileOk) upload.focus();
      return nameOk && phoneOk && fileOk;
    }
    const valid = consentimiento.checked;
    showError('consentimiento', valid ? '' : 'Marca la casilla de autorización para continuar.');
    if (!valid) consentimiento.focus();
    return valid;
  };
  form.querySelectorAll<HTMLButtonElement>('[data-next]').forEach((button) => button.addEventListener('click', () => {
    const next = Number(button.dataset.next);
    if (!validStep(next - 1)) return;
    if (next === 3) {
      const summary = form.querySelector<HTMLElement>('#quote-summary')!;
      summary.replaceChildren();
      const entries = [['Sede', sede.selectedOptions[0]?.textContent ?? ''], ['Nombre', nombre.value.trim()], ['Teléfono', telefono.value.trim()], ['Archivo', selectedFile?.name ?? '']];
      entries.forEach(([label, value]) => { const row = document.createElement('p'); const strong = document.createElement('strong'); strong.textContent = `${label}: `; row.append(strong, document.createTextNode(value)); summary.append(row); });
      const fallback = form.querySelector<HTMLAnchorElement>('#fallback-submit');
      if (fallback) fallback.href = `${centralWhatsapp}?text=${encodeURIComponent(`Hola MundoMagistral. Soy ${nombre.value.trim()}, estoy en ${sede.selectedOptions[0]?.textContent ?? ''} y quiero cotizar una receta. La adjuntaré en este chat.`)}`;
    }
    showStep(next);
  }, { signal }));
  form.querySelectorAll<HTMLButtonElement>('[data-back]').forEach((button) => button.addEventListener('click', () => showStep(Number(button.dataset.back)), { signal }));
  form.querySelector<HTMLAnchorElement>('#fallback-submit')?.addEventListener('click', (event) => { if (!validStep(3)) event.preventDefault(); }, { signal });
  async function compressImage(file: File): Promise<File> {
    if (!file.type.startsWith('image/') || file.size <= 2 * 1024 * 1024) return file;
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      let blob: Blob | null = null;
      for (const quality of [.82, .72, .62, .52]) {
        blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
        if (blob && blob.size <= 2 * 1024 * 1024) break;
      }
      return blob ? new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp' }) : file;
    } catch { return file; }
  }
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validStep(1) || !validStep(2) || !validStep(3) || !selectedFile) return;
    const token = form.querySelector<HTMLInputElement>('[name="cf-turnstile-response"]')?.value;
    if (!token) { showError('quote', 'Completa la verificación para enviar la receta.'); return; }
    const submit = form.querySelector<HTMLButtonElement>('[type="submit"]');
    if (submit) { submit.disabled = true; submit.textContent = 'Enviando…'; }
    try {
      const payload = new FormData(form);
      payload.set('receta', await compressImage(selectedFile));
      const response = await fetch('/api/receta', { method: 'POST', body: payload });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'No se pudo enviar la receta.');
      const id = String(result.id ?? '');
      const success = shell.querySelector<HTMLElement>('#quote-success')!;
      success.hidden = false; form.hidden = true;
      shell.querySelector<HTMLElement>('#quote-id')!.textContent = id;
      const wa = shell.querySelector<HTMLAnchorElement>('#quote-whatsapp')!;
      wa.href = `${centralWhatsapp}?text=${encodeURIComponent(`Hola MundoMagistral. Soy ${nombre.value.trim()}. Envié mi receta para cotización, solicitud #${id}.`)}`;
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo enviar la receta.';
      showError('quote', `${message} Puedes continuar por WhatsApp y adjuntar allí la receta.`);
      const fallback = document.createElement('a'); fallback.className = 'button button-outline-dark'; fallback.href = `${centralWhatsapp}?text=${encodeURIComponent(`Hola MundoMagistral. Soy ${nombre.value.trim()} y quiero cotizar una receta. La adjuntaré en este chat.`)}`; fallback.target = '_blank'; fallback.rel = 'noopener noreferrer'; fallback.textContent = 'Continuar por WhatsApp';
      const actions = form.querySelector('.quote-step[data-step="3"] .step-actions');
      if (actions && !actions.querySelector('[data-fallback]')) { fallback.dataset.fallback = '1'; actions.append(fallback); }
    } finally { if (submit) { submit.disabled = false; submit.textContent = 'Enviar receta'; } }
  }, { signal });
  showStep(1, false);

  return () => {
    ac.abort();
    window.clearInterval(turnstileTimer);
    shell.classList.remove('enhanced');
  };
}

export default function RecetaForm() {
  const shellRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!shellRef.current || !formRef.current) return;
    return enhanceRecetaForm(shellRef.current, formRef.current);
  }, []);

  return (
    <div className="quote-shell" id="quote-shell" data-turnstile={turnstileKey ? 'enabled' : 'disabled'} ref={shellRef}>
      {turnstileKey && (
        <Head>
          <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer />
        </Head>
      )}
      <div className="quote-progress" role="group" aria-label="Progreso de la cotización"><span className="active">1. Tu sede</span><span>2. Tu receta</span><span>3. Confirmación</span></div>
      <form id="receta-form" method="post" action="/api/receta" encType="multipart/form-data" noValidate ref={formRef}>
        <fieldset className="quote-step" data-step="1">
          <legend>¿Dónde estás?</legend>
          <p>Selecciona la sede que atenderá tu solicitud.</p>
          <label htmlFor="sede">Tu sede <span aria-hidden="true">*</span></label>
          <select id="sede" name="sede" required defaultValue="">
            <option value="">Selecciona una sede</option>
            {sedes.map((sede) => <option key={sede.id} value={sede.id}>{sede.nombre !== sede.ciudad ? `${sede.ciudad} (${sede.nombre})` : sede.ciudad}</option>)}
          </select>
          <p id="sede-error" className="field-error" role="alert" hidden></p>
          <div className="step-actions"><button className="button button-primary" type="button" data-next="2">Continuar</button></div>
        </fieldset>
        <fieldset className="quote-step" data-step="2">
          <legend>Tu receta</legend>
          <p>Una foto clara o un PDF nos ayuda a revisar tu solicitud.</p>
          <div className="field-grid">
            <div><label htmlFor="nombre">Nombre completo <span aria-hidden="true">*</span></label><input id="nombre" name="nombre" autoComplete="name" required maxLength={120} /><p id="nombre-error" className="field-error" role="alert" hidden></p></div>
            <div><label htmlFor="telefono">Tu WhatsApp o teléfono <span aria-hidden="true">*</span></label><input id="telefono" name="telefono" type="tel" inputMode="tel" autoComplete="tel" required maxLength={24} /><p id="telefono-error" className="field-error" role="alert" hidden></p></div>
          </div>
          <div className="file-choices">
            <div><label htmlFor="receta-camera">Tomar foto de la receta</label><input id="receta-camera" type="file" accept="image/*" capture="environment" /></div>
            <div><label htmlFor="receta-file">Subir foto o PDF</label><input id="receta-file" type="file" accept="image/*,application/pdf,.heic,.heif" /></div>
          </div>
          <p className="field-hint">Máximo 10 MB. Si seleccionas ambos, se usará el último archivo elegido.</p>
          <p id="receta-error" className="field-error" role="alert" hidden></p>
          <label htmlFor="observaciones">Observaciones <span className="optional">(opcional)</span></label>
          <textarea id="observaciones" name="observaciones" rows={4} maxLength={2000} placeholder="Indica aquí información relevante para la cotización…" autoComplete="off"></textarea>
          <div className="step-actions"><button className="button button-outline-dark" type="button" data-back="1">Volver</button><button className="button button-primary" type="button" data-next="3">Revisar solicitud</button></div>
        </fieldset>
        <fieldset className="quote-step" data-step="3">
          <legend>Confirma tu solicitud</legend>
          <div id="quote-summary" className="quote-summary"></div>
          <label className="check-label" htmlFor="consentimiento"><input id="consentimiento" name="consentimiento" type="checkbox" value="true" required /><span>Autorizo el uso de los datos y la receta para responder esta cotización. Leí la <a href="/privacidad" target="_blank" rel="noopener noreferrer">información de privacidad</a>.</span></label>
          <p id="consentimiento-error" className="field-error" role="alert" hidden></p>
          {turnstileKey && <div className="cf-turnstile" data-sitekey={turnstileKey}></div>}
          <p id="quote-error" className="form-error" role="alert" hidden></p>
          <div className="step-actions">
            <button className="button button-outline-dark" type="button" data-back="2">Volver</button>
            {turnstileKey
              ? <button className="button button-primary" type="submit">Enviar receta</button>
              : <a id="fallback-submit" className="button button-primary" href={centralWhatsapp} target="_blank" rel="noopener noreferrer">Continuar por WhatsApp</a>}
          </div>
          {!turnstileKey && <p className="fallback-note">El envío seguro de archivos aún no está disponible. Abre WhatsApp y adjunta allí la foto o el PDF de tu receta. El enlace no adjunta archivos automáticamente.</p>}
        </fieldset>
      </form>
      <div id="quote-success" className="quote-success" hidden><h2>Solicitud enviada. Ya recibimos tu receta.</h2><p>Tu número de solicitud: <strong id="quote-id"></strong></p><p>Guarda este número para consultar por WhatsApp.</p><a className="button button-primary" id="quote-whatsapp" href={centralWhatsapp} target="_blank" rel="noopener noreferrer">Continuar por WhatsApp</a></div>
    </div>
  );
}
