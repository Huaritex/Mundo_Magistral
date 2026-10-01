import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
import SedeCard from '../components/SedeCard';
import SpecialtyCard from '../components/SpecialtyCard';
import Formula from '../components/Formula';
import { centralWhatsapp, especialidades, formas, sedes, verifiedCopy } from '../content/data';
// PROPUESTO: titulares (cada uno responde una pregunta), textos de proceso e instrucciones de interfaz.
// VERIFICADO: verifiedCopy, nombres y datos importados, cifras (2019, 7 departamentos, 8 sedes, 8 especialidades).

export function Component() {
  return (
    <>
      <Seo page="home" title="Preparados magistrales en Bolivia" description="Farmacia MundoMagistral: preparados magistrales personalizados según prescripción médica. Conoce nuestras 8 sedes en Bolivia y cotiza tu receta." ogImage="/media/og/home.webp" />

      {/* Hero: el Stage 3D (globo dentro del mortero) es la imagen; aquí solo texto sobre un velo de tinta. */}
      <section className="home-hero light" data-chapter="hero">
        <video className="hero-loop" data-hero-loop="" muted loop playsInline preload="none" poster="/media/poster-hero.avif" aria-hidden="true"></video>
        <div className="container">
          <div className="home-hero-copy">
            {/* PROPUESTO: titular editorial; requiere aprobación antes de publicación. */}
            <h1>Del mundo<br />a tu fórmula.</h1>
            <p className="lead">{verifiedCopy.welcome}</p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/cotizar">Cotizar receta</Link>
              <a className="button button-outline-dark" href={centralWhatsapp} target="_blank" rel="noopener noreferrer">Escribir por WhatsApp</a>
            </div>
            <ul className="hero-paths" aria-label="Elige tu camino">
              <li><a href="#que-es">Soy paciente</a></li>
              <li><Link to="/medicos">Soy médico</Link></li>
            </ul>
          </div>
        </div>
      </section>

      <section id="que-es" className="section section-question light" data-chapter="que-es" data-pin="">
        <div className="container split">
          <h2>¿Qué es una farmacia magistral?</h2>
          <div className="question-answer">
            <p>{verifiedCopy.what}.</p>
            <Link className="text-link" to="/preguntas-frecuentes">Ver preguntas frecuentes</Link>
          </div>
        </div>
      </section>

      <section className="section section-facts white" data-chapter="mundo">
        <div className="container split">
          <div>
            <h2>¿Desde cuándo estamos en Bolivia?</h2>
            <p className="lead">Farmacia MundoMagistral S.R.L. fue creada el 18 de octubre de 2019.</p>
          </div>
          <dl className="leaders facts">
            <div><dt>Fundación</dt><dd><span className="num">2019</span></dd></div>
            <div><dt>Departamentos</dt><dd><span className="num">7</span></dd></div>
            <div><dt>Sedes</dt><dd><span className="num">8</span></dd></div>
            <div><dt>Especialidades</dt><dd><span className="num">8</span></dd></div>
          </dl>
        </div>
      </section>

      <section className="section process-section light" data-chapter="mortero" data-pin="">
        <div className="container">
          <div className="section-head">
            <h2>¿Cómo funciona?</h2>
            <p>Tu receta inicia el camino. Una preparación magistral comienza con una prescripción para las necesidades de una persona.</p>
          </div>
          {/* PROPUESTO: secuencia de servicio sujeta a validación operativa y técnica. Es la única lista numerada: codifica una secuencia. */}
          <ol className="process-list" role="list">
            <li><span className="step-n" aria-hidden="true">1</span><h3>Tu médico prescribe</h3><p>La receta indica la formulación para tu caso.</p></li>
            <li><span className="step-n" aria-hidden="true">2</span><h3>Preparamos tu fórmula</h3><p>Revisamos la solicitud y elaboramos el preparado magistral.</p></li>
            <li><span className="step-n" aria-hidden="true">3</span><h3>La recibes</h3><p>Coordinamos contigo la atención en la sede correspondiente.</p></li>
          </ol>
        </div>
      </section>

      <Formula>
        <Link className="text-link" to="/nosotros">Conoce MundoMagistral</Link>
      </Formula>

      <section className="section section-specialties light" data-chapter="especialidades">
        <div className="container">
          <div className="section-head section-head-link">
            <h2>¿En qué especialidades trabajamos?</h2>
            <Link className="text-link" to="/especialidades">Ver todas las especialidades</Link>
          </div>
          <div className="specialty-grid">{especialidades.map((item) => <SpecialtyCard key={item.id} item={item} />)}</div>
        </div>
      </section>

      <section className="section forms-preview white" data-chapter="formas">
        <div className="container split">
          <div>
            <h2>¿Qué formas puede tener tu preparado?</h2>
            <p>Entre nuestras formas farmacéuticas se encuentran cápsulas, cremas, geles, soluciones, supositorios, óvulos, jarabes y colirios.</p>
            <Link className="button button-primary" to="/formas-farmaceuticas">Explorar formas</Link>
          </div>
          <ul className="forms-list" aria-label="Formas farmacéuticas">{formas.map((forma) => <li key={forma.id}>{forma.nombre}</li>)}</ul>
        </div>
      </section>

      <section className="section section-sedes light" data-chapter="sedes">
        <div className="container">
          <div className="section-head section-head-link">
            <h2>¿Dónde estamos?</h2>
            <Link className="text-link" to="/sucursales">Ver las 8 sedes</Link>
          </div>
          <div className="sede-grid">{sedes.slice(0, 4).map((sede) => <SedeCard key={sede.id} sede={sede} />)}</div>
        </div>
      </section>

      <section className="section doctor-preview white" data-chapter="medicos">
        <div className="container split">
          <h2>¿Eres médico?</h2>
          <div>
            <p className="lead">Desde 2019 buscamos acompañar al profesional médico en Bolivia, ofreciendo asesoramiento técnico continuo.</p>
            <Link className="button button-primary" to="/medicos">Conocer el espacio médico</Link>
          </div>
        </div>
      </section>

      <section className="section final-cta dark" data-chapter="cta">
        <div className="container split">
          <h2>¿Tienes una receta?</h2>
          <div>
            <p className="lead">Envíala para solicitar una cotización.</p>
            <Link className="button button-teal" to="/cotizar">Cotizar receta</Link>
          </div>
        </div>
      </section>
    </>
  );
}
