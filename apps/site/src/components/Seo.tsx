import { Head } from 'vite-react-ssg';
import { useLocation } from 'react-router-dom';
import { absoluteUrl, normalizePath } from '../lib/site';

type Schema = Record<string, unknown> | Record<string, unknown>[];
export interface SeoProps {
  title: string;
  description: string;
  /** Valor de body[data-page] (lo usan los estilos/motion por página). */
  page: string;
  ogImage?: string;
  schema?: Schema;
}

/** JSON-LD seguro para incrustar en <script>: escapa '<' para que nunca cierre el tag. */
const ld = (data: Schema) => JSON.stringify(data).replace(/</g, '\\u003c');

/** Head por página: mismo conjunto de etiquetas que layouts/Base.astro. */
export function Seo({ title, description, page, ogImage = '/media/og-default.webp', schema }: SeoProps) {
  const { pathname } = useLocation();
  const canonical = absoluteUrl(normalizePath(pathname));
  const imageUrl = absoluteUrl(ogImage);
  const full = `${title} | MundoMagistral`;
  return (
    <Head>
      <title>{full}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={full} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={imageUrl} />
      <meta name="twitter:title" content={full} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <body data-page={page} />
      {schema && <script type="application/ld+json">{ld(schema)}</script>}
    </Head>
  );
}

/** Ruta absoluta canónica de la página actual (para schemas con Astro.url). */
export function useCanonical(): string {
  return absoluteUrl(normalizePath(useLocation().pathname));
}
