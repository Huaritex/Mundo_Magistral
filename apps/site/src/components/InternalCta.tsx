import { Link } from 'react-router-dom';

export default function InternalCta({ title, description, label = 'Contáctanos', to = '/contacto' }: { title: string; description: string; label?: string; to?: string }) {
  return <section className="internal-cta" aria-label="Siguiente paso"><div className="container internal-cta-grid"><div><p className="internal-eyebrow">Hablemos</p><h2>{title}</h2><p>{description}</p></div><Link className="button button-outline-light" to={to}>{label} <span aria-hidden="true">↗</span></Link></div></section>;
}
