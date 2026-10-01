import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
// PROPUESTO: microcopy editorial de error; frase de filosofía verificada.

export function Component() {
  return (
    <>
      <Seo page="404" title="Página no encontrada" description="La página que buscabas no está disponible. Visita nuestras sucursales o cotiza tu receta en MundoMagistral." />
      <section className="page-hero not-found light" data-chapter="404"><div className="container"><span className="not-found-number">404</span><h1>Este mundo tomó otro camino.</h1><p className="lead">La página que buscas no está aquí. Puedes volver al inicio, encontrar una sede o cotizar tu receta.</p><div className="hero-actions"><Link className="button button-primary" to="/">Volver al inicio</Link><Link className="button button-outline-dark" to="/sucursales">Buscar una sede</Link><Link className="button button-outline-dark" to="/cotizar">Cotizar receta</Link></div><p className="not-found-signature">Cada fórmula es única, como cada paciente.</p></div></section>
    </>
  );
}
