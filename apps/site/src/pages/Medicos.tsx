import { Seo } from '../components/Seo';
import ExplainerVideo from '../components/ExplainerVideo';
import { centralPhone, centralTel, centralWhatsapp } from '../content/data';
// PROPUESTO: titulares y oferta de contacto. El compromiso de asesoramiento continuo proviene del contenido VERIFICADO.
const vademecumLink = `${centralWhatsapp}?text=${encodeURIComponent('Hola MundoMagistral. Soy profesional médico y quisiera solicitar información sobre el vademécum y asesoramiento técnico.')}`;

export function Component() {
  return (
    <>
      <Seo page="medicos" title="Para profesionales médicos" description="MundoMagistral acompaña al profesional médico en Bolivia con asesoramiento técnico continuo sobre formulaciones magistrales." ogImage="/media/og/medicos.webp" />
      <section className="page-hero light" data-chapter="medicos">
        <div className="container">
          <h1>¿Eres médico?</h1>
          <p className="lead">Al servicio de la medicina personalizada. Desde 2019 trabajamos para acompañar al profesional médico en Bolivia, ofreciendo asesoramiento técnico continuo.</p>
          <div className="hero-actions"><a className="button button-primary" href={vademecumLink} target="_blank" rel="noopener noreferrer">Solicitar vademécum</a><a className="button button-outline-dark" href={`tel:${centralTel}`}>Llamar {centralPhone}</a></div>
        </div>
      </section>
      <section className="section white" data-chapter="medicos">
        <div className="container split">
          <h2 className="sticky-title">¿Cómo te acompañamos?</h2>
          <div className="prose">
            <p>Farmacia MundoMagistral S.R.L. fue creada con el propósito de brindar soluciones personalizadas y efectivas a cada paciente y acompañar al profesional médico en Bolivia.</p>
            <p>Nuestra misión es facilitar diferentes formas farmacéuticas adecuadas según la necesidad de cada paciente.</p>
            <ul className="values" aria-label="Valores"><li>Confianza</li><li>Calidad</li><li>Accesibilidad</li></ul>
          </div>
        </div>
      </section>
      <section className="section light" data-chapter="medicos">
        <div className="container split">
          <h2 className="sticky-title">¿Conversamos sobre una formulación?</h2>
          <div>
            <p className="lead">Consulta con nuestra línea central para solicitar asesoramiento técnico o información sobre el vademécum.</p>
            <a className="button button-primary" href={vademecumLink} target="_blank" rel="noopener noreferrer">Contactar por WhatsApp</a>
          </div>
        </div>
      </section>
      <ExplainerVideo />
    </>
  );
}
