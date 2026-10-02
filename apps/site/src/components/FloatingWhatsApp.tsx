import { centralWhatsapp } from '../content/data';

export default function FloatingWhatsApp() {
  return (
    <a className="floating-wa" href={centralWhatsapp} target="_blank" rel="noopener noreferrer" aria-label="Escribir a la línea central por WhatsApp">
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0 11.9 11.9 0 0 0 1.8 17.9L0 24l6.2-1.7A11.9 11.9 0 0 0 24 11.9a11.8 11.8 0 0 0-3.5-8.4ZM12.1 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.6 1 1-3.5-.2-.4A9.9 9.9 0 1 1 12 21.8Zm5.5-7.4c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2c-.2.3-.8 1-1 1.1-.2.2-.4.2-.7.1a8 8 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2c-.2-.3 0-.5.2-.7l.5-.6.3-.5c.1-.2 0-.4 0-.5l-1-2.3c-.2-.5-.4-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1 2.9 1.2 3.1c.1.2 2 3.1 5 4.3.7.3 1.3.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.8-.8 2.1-1.5.3-.7.3-1.3.2-1.5-.1-.1-.3-.2-.6-.4Z"/></svg>
      <span>WhatsApp</span>
    </a>
  );
}
