# Despliegue de Mundo Magistral en Cloudflare Pages

Esta guía configura el sitio estático, la recepción de recetas y el panel interno. El endpoint rechaza subidas si faltan R2, Turnstile o el plazo de retención. El formulario permanece en modo WhatsApp hasta habilitarlo explícitamente en el build. No desplegar el formulario con un bucket público.

## Pages

- Conectar el repositorio en Cloudflare Pages. El repositorio Git local existe pero aún sin remoto; la conexión y las previews por PR empiezan cuando Cbass cree/indique el remoto. Directorio raíz del proyecto: `apps/site` (allí están `functions/` y `public/`). Directorio de salida: `dist`.
- Build System v3, `NODE_VERSION=24` (o 22 LTS), `PNPM_VERSION=12.6.0`. Para el workspace, ejecutar el build desde la raíz del repositorio: `cd ../.. && pnpm install --frozen-lockfile && pnpm build`. Confirmar en la primera preview que Pages publica `apps/site/dist` y detecta `/api/receta` y `/admin/receta` como Functions.
- Producción desde `main`; previews por pull request. Configurar bindings y variables para ambos entornos por separado. No publicar secretos en el repositorio.
- `_routes.json` limita la ejecución de Functions a `/api/*`, `/admin/*` y las rutas heredadas que responden 410. Las demás páginas y medios se sirven directamente desde el CDN. `_redirects` conserva los 301; probar ambos grupos en la primera preview.
- `PUBLIC_RECETA_UPLOAD_ENABLED` debe permanecer ausente o `false` hasta que se aprueben privacidad y flujo operativo. La Function también permanece cerrada por defecto. Para activar: fijar `PUBLIC_RECETA_UPLOAD_ENABLED=true`, `PUBLIC_TURNSTILE_SITE_KEY` y `PUBLIC_RECETAS_RETENTION_DAYS=N` en el **build**, más `RECETA_UPLOAD_ENABLED=true`, `TURNSTILE_SECRET` y `RECETAS_RETENTION_DAYS=N` en runtime. El build falla si se habilita el envío sin clave pública o sin plazo válido. Los valores de N de build, Function y regla lifecycle de R2 deben coincidir.
- La clave pública de Turnstile debe corresponder a un widget que admita cada hostname de despliegue. El secreto correspondiente va solo en variables runtime de Pages. Revisar y aprobar el texto final de `/privacidad` antes de cambiar el flag.

## R2, Turnstile y retención

1. Crear un bucket R2 exclusivo para recetas y mantener deshabilitados el dominio público y `r2.dev`. Vincularlo a Pages con el nombre exacto `RECETAS_BUCKET`. Cloudflare documenta el [binding R2 para Pages Functions](https://developers.cloudflare.com/pages/functions/bindings/).
2. Configurar el secreto runtime `TURNSTILE_SECRET`. El servidor verifica cada token con Siteverify y comprueba que el hostname firmado sea el de la solicitud; [la validación del lado servidor es obligatoria](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
3. Acordar con el cliente y asesoría legal el plazo `N` (propuesta: 30 días). Configurar `RECETAS_RETENTION_DAYS=N` como variable runtime, en producción y preview. Se acepta un entero entre 1 y 365. El panel deja de servir solicitudes vencidas.
4. Configurar además una regla de [lifecycle de R2](https://developers.cloudflare.com/r2/buckets/object-lifecycles/) que elimine el prefijo `recetas/` a los mismos `N` días. Verificarla antes de habilitar el formulario. Ejemplo para un bucket *nuevo* con Wrangler instalado: `wrangler r2 bucket lifecycle add NOMBRE_BUCKET vencimiento-recetas recetas/ --expire-days 30`; luego `wrangler r2 bucket lifecycle list NOMBRE_BUCKET`. Ajustar 30 al plazo aprobado. La eliminación física puede demorar hasta 24 h después del vencimiento.
5. Si se configura rate limiting a nivel de Cloudflare/WAF o se dispone de un binding compatible, la Function acepta opcionalmente `RECETA_RATE_LIMITER` y limita por `CF-Connecting-IP`. Turnstile sigue siendo obligatorio. Confirmar la disponibilidad del binding en Pages antes de depender de él; aplicar una regla WAF al POST `/api/receta` si no está disponible.

El almacenamiento usa `recetas/<UUID>` como clave aleatoria. Los datos de contacto y observaciones se guardan como metadatos privados del mismo objeto. El bucket no debe tener acceso público, índices públicos ni CORS de lectura. Los logs de la Function no registran nombre, teléfono, observaciones, token ni contenido del archivo.

## Panel del personal

Crear una aplicación de Cloudflare Access que cubra `https://mundomagistral.bo/admin/receta*` y los hostnames preview habilitados. Permitir solo las identidades del personal designado. Configurar en Pages:

- `ACCESS_TEAM_DOMAIN=https://<equipo>.cloudflareaccess.com`
- `ACCESS_AUD=<Audience Tag de la aplicación Access>`

La Function verifica criptográficamente el JWT de Access con las claves públicas del equipo, además de exigir el `aud` de esa aplicación. La sola presencia de un header no abre el panel; ver [validación oficial de JWT de Access](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/).

El personal entra a `/admin/receta`, introduce el número de solicitud y descarga el archivo como adjunto. No hay listado público. Por ahora no hay email ni notificación automática: después de subir, el paciente debe tocar “Continuar por WhatsApp” para comunicar el ID a la sede. Si abandona antes de enviar ese mensaje, la sede no se entera de la solicitud. El equipo debe decidir si este proceso basta o si necesita una cola/notificación interna antes del lanzamiento. No activar `PUBLIC_RECETA_UPLOAD_ENABLED` hasta cerrar esa decisión y hacer la prueba completa por sede.

## Contrato y verificación

`POST /api/receta` acepta `multipart/form-data`: `sede`, `nombre`, `telefono`, `observaciones` (opcional), `consentimiento=true`, `receta` (JPEG/PNG/WebP/HEIC/PDF, hasta 10 MiB) y `cf-turnstile-response`. Responde `201 {"id":"<UUID>"}`. Errores: `{ "error":"<codigo>", "message":"<texto>" }`; `503 service_unavailable` indica que la recepción segura no está configurada o está caída. El cliente debe ofrecer WhatsApp con instrucción de adjuntar el archivo manualmente.

Ejecutar `node scripts/test-receta.mjs` para los tests de validación, Turnstile, R2 y acceso. En la preview, probar una subida real con las claves de prueba de Turnstile y confirmar que: (a) la respuesta solo contiene el ID, (b) un visitante sin Access no puede abrir `/admin/receta`, (c) un miembro autorizado sí puede descargar, (d) un archivo vencido deja de estar accesible, (e) la regla lifecycle está activa. La configuración de [headers de Pages](https://developers.cloudflare.com/pages/configuration/headers/) cubre estáticos; las Functions adjuntan sus propios headers porque `_headers` no se aplica a sus respuestas.

## Cutover

Mantener WordPress activo hasta aprobar contenido, Dirección Técnica, política de privacidad, QA en Android 4G y Safari, y prueba completa de las ocho sedes. Reducir TTL DNS con 48 h de anticipación. Probar las redirecciones 301 de `_redirects` y los 410 de Functions en preview. Medir TTFB desde Santa Cruz y La Paz; no asumir un PoP local. Tras cambiar DNS, verificar TLS/certificado del dominio canónico, conversiones y 404. Rollback: volver DNS al hosting anterior mientras el backup de WordPress siga disponible. La baja de WordPress requiere una orden separada y backup comprobado.

## Pendiente antes de publicación

- Cbass confirma coordenadas y WhatsApp de las ocho sedes, correos ausentes y dominio/email canónico.
- Dirección Técnica aprueba el copy médico `PROPUESTO`; el cliente aprueba reinterpretación 3D del logo y reemplaza fotografías de stock por material propio si quiere mostrar equipo real.
- Cliente y asesoría legal aprueban texto de privacidad, plazo de retención y perfiles autorizados para Access.
- Decidir si la notificación por WhatsApp manual basta o se necesita una cola/aviso interno; configurar Turnstile, R2, Access y la regla lifecycle en preview antes de habilitar subidas.
- Verificar la [licencia aplicable de Remotion](https://www.remotion.dev/docs/license/pricing) según la entidad/equipo que renderiza y publica las piezas.
- Realizar QA en Android 4G boliviano e iPhone/Safari, prueba de memoria y FPS, además de medir TTFB desde Bolivia; estos resultados no se pueden sustituir por Lighthouse local.
