import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
import SpecialtyCard from '../components/SpecialtyCard';
import { especialidades } from '../content/data';
// PROPUESTO: titulares y orientaciones generales. Nombres de especialidad importados son VERIFICADOS.

export function Component() {
  return (
    <>
      <Seo page="especialidades" title="Especialidades" description="Conoce las ocho especialidades atendidas por Farmacia MundoMagistral y solicita una cotización para tu receta magistral." ogImage="/media/og/especialidades.webp" />
      <section className="page-hero light" data-chapter="especialidades">
        <div className="container">
          <h1>¿Qué especialidades atendemos?</h1>
          <p className="lead">Las formulaciones magistrales se elaboran según prescripción médica y las necesidades específicas de cada paciente.</p>
        </div>
      </section>
      <section className="section light" data-chapter="especialidades">
        <div className="container">
          <div className="specialty-grid">{especialidades.map((item) => <SpecialtyCard key={item.id} item={item} />)}</div>
          <p className="grid-note">La disponibilidad de una formulación depende de la receta y de la evaluación técnica. Consulta con tu médico y con nuestra farmacia.</p>
        </div>
      </section>
      <section className="section section-tight white">
        <div className="container split">
          <h2>¿Ya tienes la receta?</h2>
          <div>
            <p className="lead">Envíala para recibir orientación sobre tu solicitud.</p>
            <Link className="button button-primary" to="/cotizar">Cotizar receta</Link>
          </div>
        </div>
      </section>
    </>
  );
}
