import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
import Formula from '../components/Formula';
import { verifiedCopy } from '../content/data';
import missionIcon from '../../../../assets/icons/mision-05.svg?url';
import visionIcon from '../../../../assets/icons/vision-05.svg?url';
// PROPUESTO: titulares (preguntas) y transiciones narrativas. La historia, misión, visión y filosofía importadas son VERIFICADAS.

export function Component() {
  return (
    <>
      <Seo page="nosotros" title="Nosotros: historia y filosofía" description="Conoce la historia de MundoMagistral desde 2019, nuestra misión, visión y filosofía de formulación magistral en Bolivia." ogImage="/media/og/nosotros.webp" />
      <section className="page-hero light" data-chapter="historia">
        <div className="container">
          {/* PROPUESTO: titular. */}
          <h1>Una idea hecha para cada persona.</h1>
          <p className="lead">{verifiedCopy.history}</p>
        </div>
      </section>

      <section className="section white" data-chapter="historia">
        <div className="container split">
          <h2 className="sticky-title">¿Cómo empezó todo?</h2>
          <div className="prose">
            <p>Farmacia MundoMagistral S.R.L. fue creada el 18 de octubre de 2019 con el propósito de brindar soluciones personalizadas y efectivas a cada paciente.</p>
            <p>Desde entonces, trabajamos para acompañar al profesional médico en Bolivia, ofreciendo asesoramiento técnico continuo.</p>
            <ul className="values" aria-label="Valores"><li>Confianza</li><li>Calidad</li><li>Accesibilidad</li></ul>
          </div>
        </div>
      </section>

      <section className="section light" data-chapter="mision">
        <div className="container split">
          <div className="sticky-title heading-icon">
            <img className="brand-icon" src={missionIcon} width={56} height={56} alt="" loading="lazy" />
            <h2>¿Cuál es nuestra misión?</h2>
          </div>
          <p className="prose">{verifiedCopy.mission}</p>
        </div>
      </section>

      <section className="section white" data-chapter="vision">
        <div className="container split">
          <div className="sticky-title heading-icon">
            <img className="brand-icon" src={visionIcon} width={56} height={56} alt="" loading="lazy" />
            <h2>¿Hacia dónde vamos?</h2>
          </div>
          <p className="prose">{verifiedCopy.vision}</p>
        </div>
      </section>

      <Formula>
        <Link className="button button-primary" to="/cotizar">Cotizar receta</Link>
      </Formula>
    </>
  );
}
