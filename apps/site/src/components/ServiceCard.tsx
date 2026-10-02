import { Link } from 'react-router-dom';

export default function ServiceCard({ number, title, description, image, imageSrcSet, to, linkLabel }: { number: string; title: string; description: string; image: string; imageSrcSet?: string; to: string; linkLabel: string }) {
  return <article className="internal-service-card"><div className="internal-service-image"><img src={image} srcSet={imageSrcSet} sizes={imageSrcSet ? '(min-width: 800px) 50vw, 100vw' : undefined} alt="" loading="lazy" width="1600" height="800" /></div><div className="internal-service-body"><span className="internal-index">{number}</span><div><h3>{title}</h3><p>{description}</p><Link className="text-link" to={to}>{linkLabel} <span aria-hidden="true">↗</span></Link></div></div></article>;
}
