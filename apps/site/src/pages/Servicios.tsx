import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
import PageHero from '../components/PageHero';
import InternalCta from '../components/InternalCta';
import ServiceCard from '../components/ServiceCard';
import { especialidades, formas, verifiedCopy } from '../content/data';

export function Component() {
  return <>
    <Seo page="servicios" title="Servicios" description="Explora las especialidades y formas farmacéuticas de los preparados magistrales de MundoMagistral en Bolivia." />
    <PageHero eyebrow="Servicios / Formulación magistral" title="Soluciones magistrales adaptadas a cada necesidad." description="La formulación magistral permite preparar medicamentos personalizados según prescripción médica y las necesidades de cada paciente." image="/media/internal/servicios.webp" imageAlt="Preparación de una formulación en un laboratorio farmacéutico" chapter="servicios" actions={<Link className="button button-primary" to="/cotizar">Cotizar receta <span aria-hidden="true">↗</span></Link>} />
    <section className="section white" data-chapter="servicios"><div className="container"><div className="internal-section-head"><p className="internal-eyebrow">Explora lo que hacemos</p><h2>El cuidado toma distintas formas.</h2><p>Conoce las especialidades y las formas farmacéuticas que ya forman parte de nuestro catálogo.</p></div><div className="internal-services-grid"><ServiceCard number="01 / Especialidades" title="Especialidades" description="Opciones de formulación magistral para distintas áreas de atención médica." image="/media/internal/quienes-somos.webp" to="/especialidades" linkLabel="Explorar especialidades" /><ServiceCard number="02 / Presentaciones" title="Formas farmacéuticas" description="Preparaciones en distintas formas para ajustarse a la prescripción y necesidad del paciente." image="/media/internal/servicios.webp" to="/formas-farmaceuticas" linkLabel="Ver formas farmacéuticas" /></div></div></section>
    <section className="section light" data-chapter="formas"><div className="container internal-catalog-grid"><div><p className="internal-eyebrow">Áreas de atención</p><h2>Especialidades</h2><p>Estas son las áreas presentes en nuestro catálogo. Cada preparación depende de la prescripción correspondiente.</p><Link className="text-link" to="/especialidades">Ver todas las especialidades ↗</Link></div><ul>{especialidades.map((item) => <li key={item.id}><Link to={`/especialidades/${item.id}`}>{item.nombre}<span aria-hidden="true">↗</span></Link></li>)}</ul></div></section>
    <section className="section white" data-chapter="formas"><div className="container internal-catalog-grid"><div><p className="internal-eyebrow">Formas farmacéuticas</p><h2>Una fórmula, distintas posibilidades.</h2><p>{verifiedCopy.mission}</p><Link className="text-link" to="/formas-farmaceuticas">Conocer las formas ↗</Link></div><ul>{formas.map((item) => <li key={item.id}><Link to="/formas-farmaceuticas">{item.nombre}<span aria-hidden="true">↗</span></Link></li>)}</ul></div></section>
    <InternalCta title="Consulta sobre una formulación magistral." description="Nuestro equipo puede orientarte por nuestros canales de atención." label="Contactar" />
  </>;
}
