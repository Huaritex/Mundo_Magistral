import { Link } from 'react-router-dom';

export interface Sede { id: string; ciudad: string; departamento: string; nombre: string; direccion: string; telefono: string; tel: string; lv: string; sab: string; email?: string }

/**
 * Etiqueta de preparado de una sede: marco fino, esquina recta, dato pequeño. Ciudad, dirección, teléfono y horario
 * visibles sin hover. Los datos son VERIFICADOS (sedes.json); no hay WhatsApp por sede ni coordenadas (pendientes del cliente).
 * `large` = etiqueta de la página de detalle (la ciudad es el H1 de la página, no un enlace).
 */
export default function SedeCard({ sede, large = false }: { sede: Sede; large?: boolean }) {
  const sub = sede.nombre !== sede.ciudad ? sede.nombre : `Departamento de ${sede.departamento}`;
  return (
    <article className={large ? 'sede-tag sede-tag-lg' : 'sede-tag'} aria-label={`Sede ${sede.ciudad}${sede.nombre !== sede.ciudad ? `, ${sede.nombre}` : ''}`}>
      <header className="sede-tag-head">
        {large ? <p className="sede-tag-city">{sede.ciudad}</p> : <h3><Link to={`/sucursales/${sede.id}`}>{sede.ciudad}</Link></h3>}
        <p className="sede-tag-sub">{sub}</p>
      </header>
      <address className="sede-tag-address">{sede.direccion}</address>
      <dl className="leaders">
        <div><dt>Teléfono</dt><dd><a href={`tel:${sede.tel}`}>{sede.telefono}</a></dd></div>
        <div><dt>Lunes a viernes</dt><dd>{sede.lv}</dd></div>
        <div><dt>Sábados</dt><dd>{sede.sab}</dd></div>
        {large && sede.email && <div><dt>Correo</dt><dd><a href={`mailto:${sede.email}`}>{sede.email}</a></dd></div>}
      </dl>
      <div className="sede-tag-actions">
        <Link className="button button-outline-dark button-sm" to={`/cotizar?sede=${sede.id}`}>Cotizar en esta sede</Link>
        {large && <a className="button button-outline-dark button-sm" href={`tel:${sede.tel}`}>Llamar</a>}
      </div>
    </article>
  );
}
