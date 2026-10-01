import { Link } from 'react-router-dom';

/** Placa de foto + nombre (VERIFICADO). Sin numeración (no es una secuencia) ni flecha. */
export default function SpecialtyCard({ item }: { item: { id: string; nombre: string; imagen: string } }) {
  return (
    <Link className="specialty-card" to={`/especialidades/${item.id}`}>
      {/* view-transition-name equivale al transition:name de Astro (elemento compartido lista → detalle). */}
      <span className="specialty-photo" style={{ viewTransitionName: `specialty-${item.id}` }}>
        <img src={`/media/especialidades/${item.imagen}.webp`} alt="" width={300} height={160} loading="lazy" decoding="async" />
      </span>
      <span className="specialty-name">{item.nombre}</span>
    </Link>
  );
}
