import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Head } from 'vite-react-ssg';
import outfitFont from '@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2?url';
import crimsonFont from '@fontsource-variable/crimson-pro/files/crimson-pro-latin-wght-normal.woff2?url';
import Header from './components/Header';
import Footer from './components/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import IntroGate from './components/intro/IntroGate';
import { MotionProvider, PageScope } from './motion/MotionProvider';
import { centralTel } from './content/data';
import { absoluteUrl } from './lib/site';
import { loadDisplayFont } from './lib/fonts';

// Solo cliente: nunca se renderiza en SSR (`stageReady` nace en false). StageHost (agente de stage, sin three) detecta
// el tier en idle, respeta reduced-motion (tier 1 = póster) y solo entonces descarga el chunk StageCanvas/three.
// StageCanvas fija id="stage" en su <canvas> (onCreated) dentro de .stage-backdrop.
const StageHost = lazy(() => import('./stage/StageHost'));

const organization = { '@context': 'https://schema.org', '@type': 'Organization', name: 'Farmacia MundoMagistral S.R.L.', url: absoluteUrl('/'), telephone: centralTel };

/** El Stage se descarga después de montar y de liberar la intro; no compite con sus 3,65 s. */
function useStageReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const update = () => setReady(document.documentElement.dataset.mmIntroActive !== '1');
    update();
    document.addEventListener('mm:intro-state', update);
    return () => document.removeEventListener('mm:intro-state', update);
  }, []);
  return ready;
}

export default function Layout() {
  const { pathname, hash } = useLocation();
  const stageReady = useStageReady();
  const main = useRef<HTMLElement>(null);

  // Fuente display fuera de la ruta crítica (ver lib/fonts.ts).
  useEffect(() => loadDisplayFont(crimsonFont), []);

  // Equivalente a astro:page-load: avisa al header (medidas, tono adaptativo) tras montar cada página.
  // El scroll arriba en cada navegación lo hace MotionProvider (Lenis o window.scrollTo, en layout effect).
  useEffect(() => {
    document.dispatchEvent(new Event('mm:page-load'));
  }, [pathname, hash]);

  return (
    <>
      <Head>
        <link rel="preload" href={outfitFont} as="font" type="font/woff2" crossOrigin="" />
        <script type="application/ld+json">{JSON.stringify(organization)}</script>
      </Head>
      <nav aria-label="Atajos de navegación">
        <a className="skip-link" href="#main">Ir al contenido</a>
        <Link className="skip-link skip-quote" to="/cotizar">Ir a cotizar receta</Link>
      </nav>
      <div className="stage-backdrop" aria-hidden="true">
        <img id="stage-poster" src="/media/poster-hero.avif" width={1080} height={486} alt="" fetchPriority={pathname === '/' ? 'low' : 'high'} />
        <video className="stage-loop" data-hero-loop="" muted loop playsInline preload="none" poster="/media/poster-hero.avif" aria-hidden="true" />
        {stageReady && <Suspense fallback={null}><StageHost /></Suspense>}
      </div>
      <Header />
      <MotionProvider scope={main} />
      <main id="main" ref={main}><PageScope key={pathname}><Outlet /></PageScope></main>
      <Footer />
      <aside aria-label="Contacto por WhatsApp"><FloatingWhatsApp /></aside>
      <IntroGate />
    </>
  );
}
