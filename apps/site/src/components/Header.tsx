import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { centralWhatsapp } from '../content/data';
import { initHeaderCore, isReduced, onReducedChange } from '../lib/header-core';
import { normalizePath } from '../lib/site';

const links = [
  { href: '/', label: 'Inicio' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/especialidades', label: 'Especialidades' },
  { href: '/formas-farmaceuticas', label: 'Formas farmacéuticas' },
  { href: '/sucursales', label: 'Sucursales' },
  { href: '/medicos', label: 'Para médicos' },
];

const isActive = (href: string, pathname: string) => {
  const path = normalizePath(pathname);
  return href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);
};

/** Header persistente: vive en Layout y no se remonta al navegar. aria-current sigue a la ruta (SSR incluido). */
export default function Header() {
  const { pathname } = useLocation();
  const current = (href: string) => (isActive(href, pathname) ? ('page' as const) : undefined);

  const root = useRef<HTMLDivElement>(null);

  // Núcleo sin GSAP: el menú funciona aunque la capa de animación falle o no exista.
  // La capa GSAP (isla líquida, roll de labels, menú circular + SplitText, CTA magnético, pulso de WhatsApp) se importa
  // en idle y solo sin reduced motion (con reduced motion no descarga GSAP hasta que se desactive la preferencia).
  useEffect(() => {
    const offCore = initHeaderCore();
    let alive = true;
    let stop: (() => void) | undefined;
    let cancelIdle: (() => void) | undefined;
    let offPref: (() => void) | undefined;
    const load = () => {
      offPref?.();
      offPref = undefined;
      import('../motion/motion-header')
        .then((mod) => { if (alive && root.current && !stop) stop = mod.enhanceHeader(root.current); })
        .catch((error) => console.warn('[motion] header sin animación', error));
    };
    if (isReduced()) {
      offPref = onReducedChange((reduce) => { if (!reduce) load(); });
    } else if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(load, { timeout: 2000 });
      cancelIdle = () => window.cancelIdleCallback(id);
    } else {
      const id = setTimeout(load, 600);
      cancelIdle = () => clearTimeout(id);
    }
    return () => {
      alive = false;
      cancelIdle?.();
      offPref?.();
      stop?.();
      offCore();
    };
  }, []);

  // React ya actualizó aria-current: la píldora líquida se recoloca sobre el link activo.
  useEffect(() => { document.dispatchEvent(new Event('mm:header-active')); }, [pathname]);

  return (
    <div id="header-persist" ref={root}>
      <header className="site-header" id="site-header" data-tone="light">
        <div className="header-shell">
          <span className="island-glass" aria-hidden="true"></span>
          <Link className="brand" to="/" aria-label="MundoMagistral, ir al inicio">
            <img src="/media/logo.svg" width={178} height={49} alt="MundoMagistral" />
          </Link>
          <nav className="desktop-nav" aria-label="Navegación principal">
            <span className="nav-pill" aria-hidden="true"></span>
            {links.slice(1).map((link) => (
              <Link key={link.href} to={link.href} aria-current={current(link.href)}><span className="lbl"><span className="lbl-a">{link.label}</span><span className="lbl-b" aria-hidden="true">{link.label}</span></span></Link>
            ))}
          </nav>
          <div className="cta-zone"><Link className="button button-primary header-cta" to="/cotizar">Cotizar receta</Link></div>
          <button className="menu-trigger" type="button" id="menu-trigger" aria-haspopup="dialog" aria-controls="menu-dialog" aria-expanded="false" aria-label="Abrir menú">
            <span className="bars" aria-hidden="true"><i></i><i></i></span>
          </button>
          <span className="header-progress" aria-hidden="true"><i></i></span>
        </div>
      </header>
      <dialog className="menu-dialog" id="menu-dialog" aria-label="Menú principal" data-lenis-prevent="">
        <video className="menu-loop" data-menu-loop="" muted loop playsInline preload="none" aria-hidden="true"></video>
        <div className="menu-dialog-inner">
          <div className="menu-dialog-top menu-anim">
            <span className="menu-brand"><img src="/media/logo.svg" width={178} height={49} alt="" /></span>
            <button type="button" className="menu-close" id="menu-close" aria-label="Cerrar menú">
              <span className="menu-close-label">Cerrar</span>
              <span className="bars" aria-hidden="true"><i></i><i></i></span>
            </button>
          </div>
          <nav aria-label="Navegación móvil">
            {links.map((link) => <Link key={link.href} to={link.href} aria-current={current(link.href)}>{link.label}</Link>)}
          </nav>
          <div className="menu-foot menu-anim">
            <Link className="button button-primary" to="/cotizar">Cotizar receta</Link>
            <a className="menu-wa" href={centralWhatsapp} target="_blank" rel="noopener noreferrer">Escribir por WhatsApp</a>
          </div>
        </div>
      </dialog>
    </div>
  );
}
