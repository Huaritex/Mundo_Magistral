# Mundo Magistral — rework 3D

Implementación del [plan de experiencia 3D](./PLAN_REWORK_EXPERIENCIA_3D.md): sitio estático Vite + React (vite-react-ssg: un HTML por ruta), un Stage persistente React Three Fiber compartido con Remotion (`packages/scene`), movimiento con GSAP + Lenis y Cloudflare Pages Functions para recetas privadas. El contenido sigue disponible sin WebGL. Git local inicializado (commit base `8fc7d5c` conserva la versión Astro anterior); sin remoto ni publicación.

## Desarrollo

Requiere Node ≥ 22, pnpm 12.6.0, FFmpeg y Chromium para QA/render.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

```sh
pnpm check
pnpm build
pnpm test:backend
pnpm test:e2e
pnpm test:perf
node scripts/check-budgets.mjs
pnpm verify:copy
```

`verify:copy` consulta el WordPress actual: ejecutarlo mientras siga accesible. Las pruebas E2E levantan `vite preview` en :4324 (hacer `pnpm build` antes). `pnpm test:perf` sirve `dist` con gzip como Cloudflare. El benchmark de Lighthouse usa Chrome local; la prueba de Android/Safari real sigue siendo necesaria.

## Medios

Estructura: `apps/site` (sitio), `apps/video` (Remotion), `packages/scene` (escena 3D pura), `packages/brand` (tokens y geometrías). Las composiciones están en `apps/video/src`; los medios se escriben en `apps/site/public/media`. `pnpm video:poster` genera el póster del hero; `pnpm video:assets` regenera los fondos H.264/AV1 y el explicativo; `pnpm video:menu` genera el fondo del menú; `pnpm video:og` genera 24 tarjetas y el OG por defecto. `explainer.vtt` se mantiene como archivo editorial. Los videos hero se cargan solo en tier 1 y con movimiento permitido. Antes de renderizar/publicar piezas comerciales, comprobar la licencia de Remotion aplicable al equipo.

## Publicación

Consultar [la guía de Cloudflare Pages](./docs/DESPLIEGUE_CLOUDFLARE.md). El formulario de recetas está en modo WhatsApp por defecto y la Function también rechaza subidas por defecto. La subida privada exige aprobación de privacidad/operación, bindings R2/Access/Turnstile, `PUBLIC_RECETA_UPLOAD_ENABLED=true` en build y `RECETA_UPLOAD_ENABLED=true` en runtime, con un plazo de retención coherente en build, Function y R2. No hay autorización para cambiar DNS ni retirar WordPress.
