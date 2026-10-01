export const SITE = 'https://mundomagistral.bo';
export const absoluteUrl = (path: string): string => new URL(path, SITE).toString();
/** Ruta canónica sin barra final (trailingSlash: never), '/' se conserva. */
export const normalizePath = (path: string): string => (path.length > 1 ? path.replace(/\/+$/, '') : path) || '/';

/** Config de envío de recetas (mismas variables PUBLIC_* que en apps/web; ver envPrefix en vite.config.ts). */
const env = import.meta.env as Record<string, string | undefined>;
export const uploadEnabled = env.PUBLIC_RECETA_UPLOAD_ENABLED === 'true';
export const retentionDays = Number(env.PUBLIC_RECETAS_RETENTION_DAYS);
export const turnstileKey: string | undefined = uploadEnabled ? env.PUBLIC_TURNSTILE_SITE_KEY : undefined;
if (uploadEnabled && (!turnstileKey || !Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 365)) {
  throw new Error('El envío de recetas requiere PUBLIC_TURNSTILE_SITE_KEY y PUBLIC_RECETAS_RETENTION_DAYS (1–365).');
}
