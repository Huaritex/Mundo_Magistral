import { Seo } from '../components/Seo';
import PageHero from '../components/PageHero';
import InternalCta from '../components/InternalCta';

export function Component() {
  return <>
    <Seo page="noticias" title="Noticias" description="Espacio de novedades e información de MundoMagistral. Próximamente compartiremos contenido de la farmacia." />
    <PageHero eyebrow="Noticias / MundoMagistral" title="Un espacio para seguir aprendiendo." description="Aquí compartiremos novedades, información y contenidos de MundoMagistral." image="/media/internal/noticias.webp" imageAlt="Cuaderno y material de laboratorio preparados para una publicación editorial" chapter="noticias" variant="compact" />
    <section className="section white" data-chapter="noticias"><div className="container internal-news-empty"><div className="internal-news-mark" aria-hidden="true">MM.</div><div><p className="internal-eyebrow">Próximamente</p><h2>Estamos preparando este espacio.</h2><p>Aún no hay noticias publicadas. Cuando tengamos novedades verificadas, aparecerán aquí.</p></div></div></section>
    <InternalCta title="¿Quieres saber más de MundoMagistral?" description="Nuestro equipo puede atender tus consultas por los canales de contacto disponibles." />
  </>;
}
