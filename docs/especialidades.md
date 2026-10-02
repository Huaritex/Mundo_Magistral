# Especialidades — contenido y fotografías

Las ocho páginas conservan sus rutas `/especialidades/:slug`. Los enlaces del listado de Servicios y del catálogo llevan a la misma página de cada especialidad. El contenido de `especialidades.json` aporta un resumen propio, el nombre de la foto y su texto alternativo.

Los resúmenes son información general sobre las áreas médicas. No son recomendaciones de tratamiento ni describen una consulta médica ofrecida por MundoMagistral. El bloque farmacéutico conserva la definición verificada y la preparación según prescripción. No se añaden medicamentos, dosis ni resultados terapéuticos.

## Fuentes del contenido

- [MedlinePlus — Tipos de proveedores de atención médica](https://medlineplus.gov/ency/article/001933.htm): alcance general de Dermatología, Ginecología, Endocrinología, Gastroenterología y Reumatología.
- [MedlinePlus — Elección de un proveedor de atención primaria](https://medlineplus.gov/ency/article/001939.htm): Pediatría y Medicina Interna.
- [Royal College of Psychiatrists — Neuropsychiatrist](https://www.rcpsych.ac.uk/become-a-psychiatrist/choose-psychiatry/what-is-psychiatry/types-of-psychiatrist/neuropsychiatry): relación entre neurología, psiquiatría y salud mental.

## Integración

`EspecialidadDetalle.tsx` utiliza `PageHero` con una variante para nombres largos, breadcrumbs, foto responsive y acciones. Reutiliza las transiciones internas existentes y su política de movimiento reducido. La imagen reserva su espacio antes de cargar.

Las fotografías son ilustrativas y generadas; no representan pacientes, trabajadores ni instalaciones reales. Se guardan en `apps/site/public/media/especialidades/` con el nombre de la especialidad y una variante de 720 px. La foto nueva de la tarjeta Especialidades de Servicios se guarda como `apps/site/public/media/internal/servicios-especialidades.webp`. Los prompts están en `docs/image-prompts.md`.

## Verificación

- Ocho detalles revisados en navegador a 360, 390, 430, 768, 1024, 1280 y 1440 px: título, fotografía, acciones y ausencia de desborde horizontal en el layout estable.
- Navegación real comprobada desde Servicios al detalle y entre catálogo y detalle. La foto repetida de la tarjeta de Especialidades usa ahora un archivo propio.
- HTML de producción verificado: ocho enlaces desde Servicios, ocho resúmenes distintos, ocho páginas estáticas y sus fotografías de escritorio/móvil disponibles.
- `pnpm check`, `pnpm build` y `pnpm budgets`: correctos. No hay script de lint configurado.
- Tres pruebas E2E existentes correctas: entradas internas con GSAP, movimiento reducido y auditoría axe de las páginas principales. La auditoría axe existente no incluye los ocho detalles de especialidad.
- Las nueve fotografías y sus variantes suman **952 754 bytes**, aproximadamente **930 KiB**. Cada página solicita su foto; las imágenes del catálogo usan carga diferida.
- JS inicial máximo: **103,4 KiB gzip / 110 KiB**. Motion: **58,5 / 60 KiB**. No se añadieron dependencias.
- Captura de ejemplo: `artifacts/specialties-shots/neuropsiquiatria-1440.png`.
