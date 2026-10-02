import type { ReactNode } from 'react';

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  chapter: string;
  variant?: 'split' | 'wide' | 'compact';
  actions?: ReactNode;
}

/** Encabezado editorial compartido; la foto conserva una altura estable durante la carga. */
export default function PageHero({ eyebrow, title, description, image, imageAlt, chapter, variant = 'split', actions }: PageHeroProps) {
  return (
    <section className={`internal-hero internal-hero--${variant}`} data-chapter={chapter}>
      <div className="container internal-hero-grid">
        <div className="internal-hero-copy">
          <p className="internal-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="internal-hero-description">{description}</p>
          {actions && <div className="hero-actions">{actions}</div>}
        </div>
        <div className="internal-hero-media">
          <img src={image} alt={imageAlt} width="1600" height="800" fetchPriority="high" />
        </div>
      </div>
    </section>
  );
}
