import { Link, useParams } from 'react-router-dom';
import { Seo, useCanonical } from '../components/Seo';
import { especialidades } from '../content/data';
import { absoluteUrl } from '../lib/site';
import { Component as NotFound } from './NotFound';
// PROPUESTO: descripción editorial general; solo el nombre de la especialidad y la definición magistral son VERIFICADOS.

export function getStaticPaths() { return especialidades.map((item) => `especialidades/${item.id}`); }

export function Component() {
  const { slug } = useParams();
  const canonical = useCanonical();
  const item = especialidades.find((entry) => entry.id === slug);
  if (!item) return <NotFound />;
  const others = especialidades.filter((entry) => entry.id !== item.id).slice(0, 3);
  const schema = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Especialidades', item: absoluteUrl('/especialidades') },
      { '@type': 'ListItem', position: 3, name: item.nombre, item: canonical },
    ],
  };
  return (
    <>
      <Seo page="especialidades" title={`${item.nombre}: preparados magistrales`} description={`MundoMagistral atiende consultas de ${item.nombre.toLowerCase()} relacionadas con preparados magistrales bajo prescripción médica en Bolivia.`} schema={schema} ogImage={`/media/og/especialidad-${item.id}.webp`} />
      <section className="page-hero specialty-detail-hero light" data-chapter="especialidades">
        <div className="container specialty-detail-grid">
          <div>
            <nav className="breadcrumbs" aria-label="Ruta de navegación"><ol><li><Link to="/">Inicio</Link></li><li><Link to="/especialidades">Especialidades</Link></li><li><span aria-current="page">{item.nombre}</span></li></ol></nav>
            <h1>{item.nombre}</h1>
            <p className="lead">Preparados magistrales personalizados según prescripción médica.</p>
            <div className="hero-actions"><Link className="button button-primary" to="/cotizar">Cotizar receta</Link><Link className="button button-outline-dark" to="/especialidades">Ver especialidades</Link></div>
          </div>
          <img className="specialty-detail-image" data-parallax="0.04" src={`/media/especialidades/${item.imagen}.webp`} width={300} height={160} alt={`Imagen ilustrativa de ${item.nombre.toLowerCase()}`} style={{ viewTransitionName: `specialty-${item.id}` }} />
        </div>
      </section>
      <section className="section white">
        <div className="container split">
          <h2 className="sticky-title">¿Qué define el preparado?</h2>
          <div className="prose">
            <p className="prose-answer">La receta define el preparado.</p>
            <p>Una farmacia de preparados magistrales elabora medicamentos personalizados según prescripción médica, adaptados a las necesidades específicas de cada paciente.</p>
            <p>Envíanos tu receta para revisar la solicitud. No se puede confirmar una formulación únicamente por la especialidad.</p>
            <Link className="text-link" to="/cotizar">Enviar receta para cotización</Link>
          </div>
        </div>
      </section>
      <section className="section light">
        <div className="container split">
          <div className="sticky-title">
            <h2>¿Qué otras especialidades hay?</h2>
            <Link className="text-link" to="/especialidades">Ver las 8</Link>
          </div>
          <ul className="related-specialties">{others.map((other) => <li key={other.id}><Link to={`/especialidades/${other.id}`}>{other.nombre}</Link></li>)}</ul>
        </div>
      </section>
    </>
  );
}
