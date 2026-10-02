import { Seo } from '../components/Seo';
import PageHero from '../components/PageHero';
import InternalCta from '../components/InternalCta';
import { verifiedCopy } from '../content/data';

export function Component() {
  return <>
    <Seo page="equipo" title="Nuestro equipo" description="Conoce la manera de trabajar del equipo de MundoMagistral: rigor científico, atención diferenciada y acompañamiento al profesional médico." />
    <PageHero eyebrow="Nuestro equipo / Cuidado humano" title="Personas detrás de cada preparación." description="La formulación magistral reúne precisión técnica, atención a cada paciente y colaboración con profesionales médicos." image="/media/internal/equipo.webp" imageAlt="Profesionales trabajando juntos en una preparación farmacéutica" chapter="equipo" variant="wide" />
    <section className="section white" data-chapter="equipo"><div className="container internal-team-intro"><p className="internal-eyebrow">Cómo trabajamos</p><h2>El cuidado está en los detalles.</h2><p className="internal-lead">{verifiedCopy.philosophy}</p></div></section>
    <section className="section light" data-chapter="equipo"><div className="container"><div className="internal-section-head"><p className="internal-eyebrow">Nuestro trabajo</p><h2>Técnica y cercanía, en una misma dirección.</h2></div><div className="internal-team-areas"><article><span>01</span><h3>Formulación magistral</h3><p>Preparaciones adaptadas a la prescripción médica y a las necesidades específicas de cada paciente.</p></article><article><span>02</span><h3>Asesoramiento técnico</h3><p>Acompañamiento al profesional médico con información sobre las formas farmacéuticas disponibles.</p></article><article><span>03</span><h3>Atención diferenciada</h3><p>Escucha y orientación para encontrar el canal de atención adecuado en nuestras sedes.</p></article></div></div></section>
    <section className="section white" data-chapter="filosofia"><div className="container internal-image-statement"><img src="/media/internal/quienes-somos.webp" alt="Preparación cuidadosa sobre una mesa de laboratorio" width="1600" height="800" loading="lazy" /><div><p className="internal-eyebrow">Nuestra filosofía</p><h2>Una preparación pensada alrededor de la persona.</h2><p>{verifiedCopy.what}</p></div></div></section>
    <InternalCta title="Habla con nuestro equipo." description="Elige la sede o el canal de contacto que te quede más cómodo." />
  </>;
}
