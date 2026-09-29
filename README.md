# Mundo Magistral — rework 3D

Implementación del [plan de experiencia 3D](./PLAN_REWORK_EXPERIENCIA_3D.md): Astro estático, un Stage Three.js progresivo, medios offline con Remotion y Cloudflare Pages Functions para recetas privadas. El contenido sigue disponible sin WebGL. Este workspace no está publicado ni conectado a un repositorio Git.

## Desarrollo

Requiere Node 24, pnpm 12.6.0, FFmpeg y Chromium para QA/render.

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

`verify:copy` consulta el WordPress actual: ejecutarlo mientras siga accesible. Las pruebas E2E levantan un servidor local. El benchmark de Lighthouse usa Chrome local; la prueba de Android/Safari real sigue siendo necesaria.

## Medios

Las composiciones están en `apps/video/src`. `pnpm video:og` genera 24 tarjetas para compartir; `pnpm video:assets` regenera los fondos H.264/AV1 y el explainer a partir de Remotion. `explainer.vtt` se mantiene como archivo editorial. Los videos hero se cargan solo en tier 1 y con movimiento permitido. Antes de renderizar/publicar piezas comerciales, comprobar la licencia de Remotion aplicable al equipo.

## Publicación

Consultar [la guía de Cloudflare Pages](./docs/DESPLIEGUE_CLOUDFLARE.md). El formulario de recetas está en modo WhatsApp por defecto y la Function también rechaza subidas por defecto. La subida privada exige aprobación de privacidad/operación, bindings R2/Access/Turnstile, `PUBLIC_RECETA_UPLOAD_ENABLED=true` en build y `RECETA_UPLOAD_ENABLED=true` en runtime, con un plazo de retención coherente en build, Function y R2. No hay autorización para cambiar DNS ni retirar WordPress.
