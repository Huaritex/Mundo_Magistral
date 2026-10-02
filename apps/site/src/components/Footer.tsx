import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { centralPhone, centralTel } from '../content/data';
import { reducedMotion } from '../lib/motion-pref';

export default function Footer() {
  // Estado inicial fijo (SSR = cliente); la preferencia guardada se aplica tras montar.
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    // Preferencia efectiva (?rm, guardada o SO): igual que la clase que aplica MotionProvider; sin pelear por ella.
    const effective = reducedMotion();
    setReduce(effective);
    document.documentElement.classList.toggle('reduce-motion', effective);
  }, []);

  const toggle = () => {
    const next = !reducedMotion();
    try { localStorage.setItem('mm-reduced-motion', next ? '1' : '0'); } catch { /* storage bloqueado */ }
    document.dispatchEvent(new CustomEvent('mm:motion-preference', { detail: { reduce: next } }));
    setReduce(next);
    document.documentElement.classList.toggle('reduce-motion', next);
  };

  return (
    <footer className="site-footer light">
      <div className="container footer-main">
        <div className="footer-brand">
          <img src="/media/logo.svg" width={202} height={56} alt="MundoMagistral" loading="lazy" />
          <p>Cada fórmula es única, como cada paciente.</p>
        </div>
        <nav aria-label="Enlaces del pie de página" className="footer-links">
          <Link to="/quienes-somos">Quiénes somos</Link>
          <Link to="/equipo">Equipo</Link>
          <Link to="/servicios">Servicios</Link>
          <Link to="/noticias">Noticias</Link>
          <Link to="/contacto">Contacto</Link>
          <Link to="/especialidades">Especialidades</Link>
          <Link to="/formas-farmaceuticas">Formas farmacéuticas</Link>
          <Link to="/sucursales">Sucursales</Link>
          <Link to="/medicos">Para médicos</Link>
          <Link to="/preguntas-frecuentes">Preguntas frecuentes</Link>
          <Link to="/privacidad">Privacidad</Link>
        </nav>
        <div className="footer-contact">
          <span>Atención central</span>
          <a href={`tel:${centralTel}`}>{centralPhone}</a>
          <Link className="button button-primary" to="/cotizar">Cotizar receta</Link>
        </div>
      </div>
      <div className="footer-base">
        <div className="container footer-bottom">
          <small>© <span suppressHydrationWarning>{new Date().getFullYear()}</span> Farmacia MundoMagistral S.R.L.</small>
          <button type="button" id="motion-toggle" className="motion-toggle" aria-pressed={reduce} onClick={toggle}>{reduce ? 'Activar animaciones' : 'Reducir animaciones'}</button>
        </div>
      </div>
    </footer>
  );
}
