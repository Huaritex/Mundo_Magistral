import { Seo } from '../components/Seo';
import FormsExplorer from '../components/FormsExplorer';
// PROPUESTO: encabezados e indicaciones de navegación. Nombres de formas importados son VERIFICADOS.

export function Component() {
  return (
    <>
      <Seo page="formas" title="Formas farmacéuticas" description="Cápsulas, cremas, geles, soluciones, supositorios, óvulos, jarabes, colirios y otras formas farmacéuticas en MundoMagistral." ogImage="/media/og/formas.webp" />
      <section className="page-hero light" data-chapter="formas">
        <div className="container">
          <h1>¿Qué formas farmacéuticas preparamos?</h1>
          <p className="lead">La forma del preparado se define a partir de la prescripción médica y las necesidades de cada paciente.</p>
        </div>
      </section>
      <section className="section white forms-section" data-chapter="formas">
        <div className="container">
          <FormsExplorer>
            <div className="section-head">
              <h2>Elige una forma.</h2>
              <p>El sitio original enumera cápsulas, cremas, geles, soluciones, supositorios, óvulos, jarabes y colirios; también presenta jabones en sus productos.</p>
            </div>
          </FormsExplorer>
        </div>
      </section>
    </>
  );
}
