import { Link, useParams } from 'react-router-dom';
import { Seo, useCanonical } from '../components/Seo';
import { centralTel, sedes } from '../content/data';
import { absoluteUrl } from '../lib/site';
import SedeCard from '../components/SedeCard';
import { Component as NotFound } from './NotFound';
// PROPUESTO: encabezados e indicaciones. Dirección, teléfono y horario de sede importados son VERIFICADOS.

export function getStaticPaths() { return sedes.map((sede) => `sucursales/${sede.id}`); }

export function Component() {
  const { slug } = useParams();
  const canonical = useCanonical();
  const sede = sedes.find((entry) => entry.id === slug);
  if (!sede) return <NotFound />;
  const others = sedes.filter((entry) => entry.id !== sede.id).slice(0, 3);
  const pharmacySchema = {
    '@context': 'https://schema.org', '@type': 'Pharmacy',
    name: `Farmacia MundoMagistral — ${sede.ciudad} ${sede.nombre}`,
    address: { '@type': 'PostalAddress', streetAddress: sede.direccion, addressLocality: sede.ciudad, addressRegion: sede.departamento, addressCountry: 'BO' },
    telephone: sede.tel,
    hasMap: sede.mapsUrl,
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: sede.lv.split('–')[0], closes: sede.lv.split('–')[1] },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: sede.sab.split('–')[0], closes: sede.sab.split('–')[1] },
    ],
    parentOrganization: { '@type': 'Organization', name: 'Farmacia MundoMagistral S.R.L.', telephone: centralTel },
  };
  const schema = [pharmacySchema, {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Sucursales', item: absoluteUrl('/sucursales') },
      { '@type': 'ListItem', position: 3, name: `${sede.ciudad} ${sede.nombre}`, item: canonical },
    ],
  }];
  return (
    <>
      <Seo page="sedes" title={`Farmacia magistral en ${sede.ciudad} — ${sede.nombre}`} description={`Visita MundoMagistral en ${sede.ciudad}: ${sede.direccion}. Teléfono ${sede.telefono}. Horarios de atención y cotización de recetas.`} schema={schema} ogImage={`/media/og/sede-${sede.id}.webp`} />
      <section className="page-hero light" data-chapter="sedes">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Ruta de navegación"><ol><li><Link to="/">Inicio</Link></li><li><Link to="/sucursales">Sucursales</Link></li><li><span aria-current="page">{sede.ciudad}</span></li></ol></nav>
          <h1>{sede.ciudad}{sede.nombre !== sede.ciudad && <small>{sede.nombre}</small>}</h1>
          <p className="lead">Atención en nuestra sede de {sede.ciudad}.</p>
        </div>
      </section>
      <section className="section white" data-chapter="sedes">
        <div className="container split">
          <h2 className="sticky-title">¿Cuándo y dónde te atendemos?</h2>
          <div className="sede-detail">
            <SedeCard sede={sede} large />
          </div>
        </div>
      </section>
      <section className="section light">
        <div className="container split">
          <div className="sticky-title">
            <h2>¿Y las otras sedes?</h2>
            <Link className="text-link" to="/sucursales">Ver el directorio</Link>
          </div>
          <ul className="related-specialties">{others.map((other) => <li key={other.id}><Link to={`/sucursales/${other.id}`}>{other.ciudad}{other.nombre !== other.ciudad ? `, ${other.nombre}` : ''}</Link></li>)}</ul>
        </div>
      </section>
    </>
  );
}
