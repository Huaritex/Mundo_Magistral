import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sedes } from '../content/data';

const cities = [...new Set(sedes.map((sede) => sede.ciudad))];

export default function LocationSelector() {
  const [city, setCity] = useState('Todas');
  const visible = city === 'Todas' ? sedes : sedes.filter((sede) => sede.ciudad === city);

  return <div className="internal-locator">
    <div className="internal-city-list" aria-label="Filtrar sedes por ciudad">
      {['Todas', ...cities].map((option) => <button key={option} type="button" aria-pressed={city === option} onClick={() => setCity(option)}>{option}</button>)}
    </div>
    <p className="internal-result-count" aria-live="polite">{visible.length} {visible.length === 1 ? 'sede disponible' : 'sedes disponibles'}{city !== 'Todas' ? ` en ${city}` : ''}</p>
    <div className="internal-location-grid">
      {visible.map((sede) => <article className="internal-location-card" key={sede.id}>
        <div className="internal-location-top"><span>{sede.departamento}</span><span>{sede.nombre}</span></div>
        <h3>{sede.ciudad}</h3>
        <address>{sede.direccion}</address>
        <dl><div><dt>Teléfono</dt><dd><a href={`tel:${sede.tel}`}>{sede.telefono}</a></dd></div><div><dt>Lunes a viernes</dt><dd>{sede.lv}</dd></div><div><dt>Sábados</dt><dd>{sede.sab}</dd></div>{sede.email && <div><dt>Correo</dt><dd><a href={`mailto:${sede.email}`}>{sede.email}</a></dd></div>}</dl>
        <Link className="text-link" to={`/sucursales/${sede.id}`}>Ver detalles <span aria-hidden="true">↗</span></Link>
      </article>)}
    </div>
  </div>;
}
