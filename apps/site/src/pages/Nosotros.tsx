import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
import PageHero from '../components/PageHero';
import InternalCta from '../components/InternalCta';
import { verifiedCopy } from '../content/data';

export function Component() {
  return <>
    <Seo page="nosotros" title="Quiénes somos" description="Conoce la historia, misión y filosofía de MundoMagistral, farmacia boliviana de formulaciones magistrales fundada en 2019." canonicalPath="/quienes-somos" ogImage="/media/og/nosotros.webp" />
    <PageHero eyebrow="Quiénes somos / MundoMagistral" title="Ciencia, precisión y cuidado en cada fórmula." description="Desde 2019, trabajamos para ofrecer preparados magistrales adaptados a las necesidades de cada paciente y acompañar al profesional médico." image="/media/internal/quienes-somos.webp" imageAlt="Preparación cuidadosa en un entorno de farmacia magistral" chapter="historia" actions={<Link className="button button-primary" to="/contacto">Conócenos mejor <span aria-hidden="true">↗</span></Link>} />
    <section className="section white" data-chapter="historia"><div className="container internal-story"><div><p className="internal-eyebrow">Nuestra historia</p><strong className="internal-year">2019</strong><p className="internal-caption">Año de fundación</p></div><div><h2>Una farmacia pensada para cada persona.</h2><p className="internal-lead">{verifiedCopy.history}</p></div></div></section>
    <section className="section internal-quote" data-chapter="filosofia"><div className="container"><p className="internal-eyebrow">Nuestra filosofía</p><blockquote>“Cada fórmula es única, como cada paciente.”</blockquote><p>{verifiedCopy.philosophy}</p></div></section>
    <section className="section white" data-chapter="mision"><div className="container"><div className="internal-section-head"><p className="internal-eyebrow">Lo que nos guía</p><h2>Un propósito que se prepara todos los días.</h2></div><div className="internal-principles"><article><span>01 / Misión</span><h3>Atender la necesidad individual.</h3><p>{verifiedCopy.mission}</p></article><article><span>02 / Visión</span><h3>Construir confianza.</h3><p>{verifiedCopy.vision}</p></article></div></div></section>
    <section className="section light" data-chapter="vision"><div className="container"><div className="internal-section-head"><p className="internal-eyebrow">Nuestros valores</p><h2>Rigor humano.</h2></div><ul className="internal-value-list"><li>Rigor científico</li><li>Empatía</li><li>Compromiso</li><li>Calidad</li><li>Confianza</li><li>Accesibilidad</li></ul></div></section>
    <InternalCta title="¿Necesitas una preparación personalizada?" description="Estamos disponibles para ayudarte a encontrar el canal de atención adecuado." />
  </>;
}
