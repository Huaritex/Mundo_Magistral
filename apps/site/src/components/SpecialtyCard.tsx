import { Link } from 'react-router-dom';

/** Placa de foto + nombre (VERIFICADO). Sin numeración (no es una secuencia) ni flecha. */
export default function SpecialtyCard({ item }: { item: { id: string; nombre: string; imagen: string } }) {
  return (
    <Link className="specialty-card" to={`/especialidades/${item.id}`}>
      {/* view-transition-name equivale al transition:name de Astro (elemento compartido lista → detalle). */}
      <span className="specialty-photo" style={{ viewTransitionName: `specialty-${item.id}` }}>
        <img src={`/media/especialidades/${item.imagen}.webp`} srcSet={`/media/especialidades/${item.imagen}-720.webp 720w, /media/especialidades/${item.imagen}.webp 1600w`} sizes="(min-width: 700px) 25vw, 50vw" alt="" width={1600} height={1067} loading="lazy" decoding="async" />
      </span>
      <span className="specialty-name">{item.nombre}</span>
    </Link>
  );
}
