import { Seo } from '../components/Seo';
import SedeCard from '../components/SedeCard';
import { sedes } from '../content/data';
// PROPUESTO: encabezados y microcopy; datos de sedes importados son VERIFICADOS.

export function Component() {
  return (
    <>
      <Seo page="sedes" title="Sucursales en Bolivia" description="Encuentra las 8 sedes de Farmacia MundoMagistral en 7 departamentos: direcciones, teléfonos y horarios de atención verificados." ogImage="/media/og/sucursales.webp" />
      <section className="page-hero light" data-chapter="sedes">
        <div className="container">
          <h1>¿Cuál es tu sede?</h1>
          <p className="lead">8 sedes en 7 departamentos. Comunícate directamente por teléfono: dirección, horarios y número de cada sede figuran a continuación.</p>
        </div>
      </section>
      <section className="section section-sedes light" data-chapter="sedes">
        <div className="container">
          <h2 className="visually-hidden">Directorio de sedes</h2>
          <p className="sedes-note">Las direcciones y horarios provienen del directorio de MundoMagistral. Confirma la atención antes de trasladarte.</p>
          <div className="sede-grid">{sedes.map((sede) => <SedeCard key={sede.id} sede={sede} />)}</div>
        </div>
      </section>
    </>
  );
}
