# PLAN DE REWORK — MUNDO MAGISTRAL · EXPERIENCIA 3D INMERSIVA

**Blueprint de diseño, motion y arquitectura para la nueva landing de Farmacia MundoMagistral S.R.L.**
_Juapite para Cbass — 29 de septiembre de 2026_
_Complementa (no reemplaza) a `REWORK_MUNDO_MAGISTRAL.md` (auditoría técnica). Donde ambos difieren, **manda este documento** (ver §2.3 Errata)._
_**Nota 2026-10-01:** la implementación migró de Astro a Vite + React SSG + React Three Fiber (`apps/site`, `packages/scene`); Astro se eliminó. Las menciones a Astro, `apps/web` y `ClientRouter` en este plan son históricas. Paleta vigente: blanco principal, morado de marca secundario (ver `apps/site/DESIGN.md`)._

---

## 0. Contexto y objetivo

La web actual (`mundomagistral.bo`, WordPress + Astra + Spectra + ZipWP) es un prototipo abandonado: plantilla con Lorem Ipsum, sin embudo de conversión, banners PNG de 1.4 MB y usuarios admin expuestos por la REST API. La auditoría ya está hecha en `REWORK_MUNDO_MAGISTRAL.md`.

Este documento define **el rework**: una landing multi-página con **experiencia visual única** —figuras 3D construidas a partir de la propia identidad de la marca, fondos animados que siguen el ritmo del scroll, transiciones cinemáticas entre páginas— donde **la filosofía y el propósito de la empresa son el hilo narrativo**, sin sacrificar lo que paga las cuentas: que un paciente o médico **cotice una receta en un tap** desde un Android de gama media en 4G boliviano.

**Resultado esperado:** sitio estático ultrarrápido (Astro) + un único escenario WebGL persistente (Three.js) coreografiado por GSAP + piezas de video renderizadas con Remotion + un endpoint serverless para recetas.

---

## 1. Principios no negociables (restricciones duras)

| #   | Principio                                | Regla concreta                                                                                                                                                                                                                                                                                                                                        |
| --- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | **Conversión > espectáculo**             | CTA "Cotizar receta" y WhatsApp accesibles en **1 tap desde cualquier posición de scroll y cualquier página**. Prohibido preloader o intro que bloquee el contenido.                                                                                                                                                                                  |
| P2  | **El 3D es decoración progresiva**       | Todo contenido vive en HTML estático. Nada con significado existe solo dentro del canvas. Si WebGL falla, el sitio funciona igual.                                                                                                                                                                                                                    |
| P3  | **LCP nunca es el canvas**               | El LCP es el **póster AVIF del hero** (`#stage-poster`, ≤ 60 KB en móvil, `fetchpriority="high"`) o el H1, **ambos pintados visibles desde el HTML**. Ninguna animación de entrada del H1 parte de `opacity: 0` (solo `transform`/`clip-path`). Three.js se inicializa en `requestIdleCallback` / tras primer paint y hace crossfade sobre el póster. |
| P4  | **Presupuestos de rendimiento medibles** | Ver §12. Se miden en CI; si un PR rompe presupuesto, no se mergea.                                                                                                                                                                                                                                                                                    |
| P5  | **Accesibilidad AA**                     | Contraste WCAG 2.2 AA (ver §4.1 — el turquesa de marca **no** pasa sobre blanco), `prefers-reduced-motion` con ruta propia, navegación por teclado completa.                                                                                                                                                                                          |
| P6  | **Contenido verificable**                | Todo copy está etiquetado `VERIFICADO` (existe en el sitio actual) o `PROPUESTO` (redacción nueva). Copy médico propuesto requiere visto bueno de **Dirección Técnica** antes de publicarse.                                                                                                                                                          |
| P7  | **Recetas = datos de salud**             | Almacenamiento privado, retención limitada, acceso restringido (ver §10.3).                                                                                                                                                                                                                                                                           |

---

## 2. Fuente de verdad del contenido

Contenido extraído el 2026-09-29 de la REST API públi><<<< (`/wp-json/wp/v2/pages`) + inspección visual de los 46 assets en `./assets/`.

### 2.1. Copy VERIFICADO (usar tal cual)

| Bloque               | Texto                                                                                                                                                                                                                                                                                                                                                                                                   | Origen                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Bienvenida (Home)    | "Bienvenido a Farmacia MundoMagistral SRL, donde la ciencia se convierte en soluciones personalizadas para tu bienestar. Innovamos cada fórmula pensando en ti y en tu salud"                                                                                                                                                                                                                           | `/home`               |
| Qué es               | "Una farmacia de preparados magistrales elabora medicamentos personalizados según prescripción médica, adaptados a las necesidades específicas de cada paciente"                                                                                                                                                                                                                                        | `/home`               |
| Historia             | "Desde nuestra fundación en 2019, hemos trabajado bajo la ideología de ofrecer una amplia gama de opciones a través de formulaciones magistrales. A lo largo de estos años, hemos consolidado un servicio diferenciado que combina rigor científico, empatía y compromiso, posicionándonos como aliados estratégicos de los profesionales médicos y como una alternativa confiable para los pacientes." | `/quienes-somos`      |
| Quiénes somos        | "…creada el 18 de octubre de 2019 con el propósito de brindar soluciones personalizadas y efectivas a cada paciente… acompañar al profesional médico en Bolivia, ofreciendo asesoramiento técnico continuo… Nos destacamos por la confianza, la calidad y la accesibilidad… **cada paciente es único, y su tratamiento también.**"                                                                      | `/quienes-somos`      |
| Misión               | "Facilitar al profesional médico diferentes formas farmacéuticas adecuadas según la necesidad de su paciente, garantizando tratamientos efectivos y satisfactorios. Ofrecer al paciente preparados magistrales en la dosis correcta, con calidad y precios accesibles, brindando una atención diferenciada."                                                                                            | `/quienes-somos`      |
| Visión               | "Ser reconocidos como una farmacia de confianza que ofrece un servicio de calidad, consolidándonos como referentes en formulaciones magistrales en Bolivia."                                                                                                                                                                                                                                            | `/quienes-somos`      |
| Filosofía            | "**Cada fórmula es única, como cada paciente.** Trabajamos con rigor científico, empatía y compromiso, asegurando que cada preparación magistral sea un reflejo de nuestra dedicación y responsabilidad."                                                                                                                                                                                               | `/quienes-somos`      |
| Servicios (lema)     | "Medicamentos y cuidados en manos confiables."                                                                                                                                                                                                                                                                                                                                                          | `/nuestros-servicios` |
| Especialidades       | Dermatología · Ginecología · Pediatría · Endocrinología · Medicina Interna · Gastroenterología · Neuropsiquiatría · Reumatología (solo nombres)                                                                                                                                                                                                                                                         | `/nuestros-servicios` |
| Formas farmacéuticas | "Cápsulas, cremas, geles, soluciones, supositorios, óvulos, jarabes, colirios, etc." + banners Cremas / Jabones / Óvulos                                                                                                                                                                                                                                                                                | `/nuestros-servicios` |
| Taglines de marca    | "Farmacia & Manipulación" (logo) · "Al servicio de la medicina personalizada" (banner) · "Expertos en formulaciones magistrales" (banners)                                                                                                                                                                                                                                                              | assets                |
| Sedes                | 8 sedes en 7 departamentos: tabla completa en `REWORK_MUNDO_MAGISTRAL.md §5.3` (direcciones, teléfonos, horarios verificados). Central: +591 721-51553                                                                                                                                                                                                                                                  | `/contactanos`        |

### 2.2. Identidad visual VERIFICADA (de los SVG)

- **Logo:** un **mortero violeta** con **mano de mortero** en diagonal, un **globo terráqueo turquesa** (América visible) dentro, y un **anillo orbital violeta** alrededor. Wordmark "MUNDO" violeta + "MAGISTRAL" turquesa. → _Es la semilla de todo el concepto 3D._
- **Colores confirmados en SVG:** `#00A8AC` (turquesa), `#6F4897` (violeta). En iconos: `#41BC52` / `#52C660` (verde WhatsApp), grises `#B2B2B2`, `#E5E5E5`, `#EDEDED`.
- **Iconos:** Misión = **montaña con bandera** · Visión = **bombilla** · Filosofía = **pieza de rompecabezas** · Email = sobre. Todos: pictograma blanco lineal sobre círculo violeta/turquesa.
- **Fotografía:** 8 fotos de especialidad (1–8.png, orden = lista de especialidades); **6.png (estómago) y 7.png (cerebro) ya tienen estética holográfica** → base para el tratamiento shader de §6.4. Banners de producto: frascos blancos con tapa violeta, jabones en rosa/lila, óvulos blancos, cápsulas en blíster azul, mortero con crema turquesa.
- **Fotos de equipo (`foto.png`, `doctor.png`, `Imag.png`, `iMAG*`)**: tienen aspecto de stock → no usarlas como "nuestro equipo" real (ver §17).

### 2.3. Errata de `REWORK_MUNDO_MAGISTRAL.md`

| En el doc anterior                                                                  | Realidad verificada                           | Acción                                                    |
| ----------------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------- |
| Misión = "diana", Visión = "telescopio", Filosofía = "ADN/engranes"                 | Montaña+bandera, bombilla, rompecabezas       | Corregir; las figuras 3D se basan en los iconos reales    |
| Descripciones detalladas por especialidad ("modulación hormonal bioidéntica", etc.) | **No existen en el sitio**                    | Tratarlas como `PROPUESTO`, validar con Dirección Técnica |
| Lista expandida de formas (microdosis, espumas, gotas óticas…)                      | El sitio solo lista las 8 formas + "etc."     | Idem                                                      |
| Emails de Cochabamba y Tarija (`info@mundomagistral.com`)                           | El sitio **no publica email** para esas sedes | Pedir al cliente                                          |
| Wireframe con badge "Laboratorio Certificado"                                       | Ninguna certificación mencionada en el sitio  | No afirmar sin documento (riesgo regulatorio)             |
| Tokens `#1E293B`, `#334155`, `#F0F5FA` como "oficiales"                             | Son **propuestas**, no están en el branding   | Se redefinen en §4                                        |
| Omitía el párrafo "Desde nuestra fundación en 2019…" y los taglines                 | Existen                                       | Incorporados en §2.1                                      |
| Inconsistencia `.bo` / `.com` en emails                                             | Ambos dominios aparecen en el sitio           | Confirmar cuál es el canónico                             |

---

## 3. Concepto creativo: **"Del mundo a tu fórmula"**

El logo ya cuenta la historia: **un mundo dentro de un mortero**. El sitio la anima.

> **Narrativa de scroll (Home):** empezamos en el espacio mirando el **globo** del logo → el globo gira hasta **Bolivia** y aparecen las **8 sedes** → la cámara desciende y el globo se asienta **dentro del mortero**, la mano de mortero lo "tritura" y el globo se disuelve en **partículas** → las partículas se recombinan en la **forma farmacéutica** (cápsula, crema, óvulo…) → la cápsula termina en la mano de **un paciente**. Macro → micro. Mundo → persona. _"Cada fórmula es única, como cada paciente."_

**Dualidad de color como lenguaje:**

- **Turquesa = ciencia / precisión / laboratorio.** Domina en capítulos técnicos (qué es, formas, proceso).
- **Violeta = cuidado / persona / empatía.** Domina en capítulos humanos (filosofía, pacientes, médicos).
- El fondo **interpola** entre ambos según el capítulo; la velocidad del scroll altera el flujo del fondo (§7).

**Tono visual:** "laboratorio nocturno clínico": hero y capítulos inmersivos en fondo profundo (`--mm-night`), secciones de lectura/conversión en blanco clínico. El paso oscuro → claro está coreografiado (no es un corte).

---

## 4. Sistema de diseño

### 4.1. Color — tokens verificados + variantes accesibles (contraste calculado WCAG 2.x)

| Token           | HEX                           | Estado         | Uso                                                         | Contraste medido                                                       |
| --------------- | ----------------------------- | -------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| `--mm-teal`     | `#00A8AC`                     | VERIFICADO     | Brand, 3D, decoración, iconos, **texto sobre fondo oscuro** | vs blanco **2.92:1 ❌** · vs `#0B1020` **6.49:1 ✅**                   |
| `--mm-teal-ink` | `#007C80`                     | PROPUESTO      | **Texto/links/botones turquesa sobre blanco**               | vs blanco **5.01:1 ✅**                                                |
| `--mm-violet`   | `#6F4897`                     | VERIFICADO     | Brand, títulos, botones sobre claro                         | vs blanco **6.89:1 ✅** · vs `#0B1020` **2.75:1 ❌**                   |
| `--mm-lilac`    | `#A98BD0`                     | PROPUESTO      | Violeta para texto sobre fondo oscuro                       | vs `#0B1020` **6.57:1 ✅**                                             |
| `--mm-night`    | `#0B1020`                     | PROPUESTO      | Fondo de capítulos inmersivos / escena 3D                   | —                                                                      |
| `--mm-ink`      | `#1E293B`                     | PROPUESTO      | Texto principal sobre claro; texto de botón sobre turquesa  | vs blanco 14.63:1 ✅ · sobre `#00A8AC` **5.01:1 ✅**                   |
| `--mm-clinic`   | `#F4F7FB`                     | PROPUESTO      | Fondo alterno claro                                         | —                                                                      |
| `--mm-wa`       | `#25D366`                     | Marca WhatsApp | Botón WA **con texto oscuro** (`#0B1B2B`)                   | blanco sobre verde **1.98:1 ❌** · `#0B1B2B` sobre verde **8.78:1 ✅** |
| Grises          | `#EDEDED` `#E5E5E5` `#B2B2B2` | VERIFICADO     | Bordes, divisores                                           | —                                                                      |

**Regla dura:** `#00A8AC` jamás como color de texto o fondo de botón con texto blanco sobre claro. Botón primario = violeta `#6F4897` con texto blanco (6.89:1) o turquesa con texto `--mm-ink`.

### 4.2. Tipografía (self-hosted, `font-display: swap`, subset latin + tildes/ñ)

- **Display:** _Outfit_ (600/700) — geométrica, redondeada, dialoga con el wordmark del logo. Titulares grandes con `SplitText`.
- **Texto:** _Inter_ variable — legibilidad en móvil.
- Escala fluida con `clamp()`: `--step-0: clamp(1rem, .95rem + .25vw, 1.125rem)` … `--step-6: clamp(2.8rem, 1.8rem + 5vw, 6rem)`.
- Máximo 2 familias, ≤ 2 archivos WOFF2 variables, preload solo del de display usado en H1.

### 4.3. Motion tokens (fuente única, compartida por GSAP, CSS y Remotion)

```ts
// packages/brand/motion.ts
export const ease = {
  magistral: "power3.inOut", // transiciones de capítulo / página
  enter: "expo.out", // entradas de texto y UI
  settle: "back.out(1.4)", // piezas 3D que "encajan" (puzzle, cápsulas)
  drift: "sine.inOut", // loops ambientales
};
export const dur = {
  micro: 0.18,
  ui: 0.35,
  reveal: 0.9,
  chapter: 1.4,
  page: 0.8,
};
export const stagger = { chars: 0.018, words: 0.06, cards: 0.08 };
```

Reglas: nada de UI > 0.4 s; transiciones de página ≤ 0.8 s totales (nunca bloquean input); loops ambientales ≥ 6 s (calma clínica, no ansiedad).

### 4.4. Layout

Grid 12 col desktop / 4 col móvil, gutter `clamp(16px, 3vw, 32px)`, contenedor máx 1280 px. Mobile-first: la experiencia se diseña primero a 360×800.

---

## 5. Arquitectura técnica

### 5.1. Stack (versiones `latest` en npm al 2026-09-29 — fijar en lockfile)

| Capa            | Tecnología                                                       | Versión ref. | Por qué                                                                                                                                  |
| --------------- | ---------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | **Astro**                                                        | 7.3.x        | HTML estático por defecto, 0 JS salvo islas, `astro:assets` (AVIF/WebP), content collections, `ClientRouter` para transiciones SPA-like. |
| 3D              | **Three.js** (vanilla, `WebGLRenderer`)                          | r186         | Un solo escenario persistente; sin capa React → menos JS. WebGPU evaluable después, no bloquea.                                          |
| Animación       | **GSAP** + ScrollTrigger + SplitText (+ Flip, MorphSVG)          | 3.15.x       | Timeline/scroll estándar de la industria. gsap.com declara "GSAP is now 100% free for all users" (plugins incluidos).                    |
| Scroll suave    | **Lenis**                                                        | 1.3.x        | Scroll inercial que alimenta a ScrollTrigger y da `velocity` al shader del fondo.                                                        |
| Video           | **Remotion** (+ `@remotion/three`)                               | 4.0.x        | Render **offline** de videos/stills de marca (§9). **No** se usa para animación en runtime.                                              |
| Estilos         | CSS nativo con tokens (`@layer`, nesting, container queries)     | —            | Sin framework CSS pesado; Tailwind opcional si el equipo lo prefiere (decisión de DX, no de producto).                                   |
| GPU tiering     | `detect-gpu` (pmndrs)                                            | —            | Decide nivel de 3D por dispositivo (§6.6).                                                                                               |
| Assets 3D       | Blender → glTF → `gltf-transform` (Meshopt + KTX2)               | —            | Solo para lo que no se pueda hacer procedural (§6.5).                                                                                    |
| Backend recetas | Cloudflare Pages Functions / Worker + **R2 privado** + Turnstile | —            | Serverless, sin servidor que mantener.                                                                                                   |
| Hosting         | Cloudflare Pages (alternativa: Vercel)                           | —            | Estático en edge + funciones en el mismo proyecto.                                                                                       |
| Monorepo        | pnpm workspaces                                                  | —            | `web`, `video`, `brand` comparten tokens y geometrías.                                                                                   |

> **Nota de verificación:** la API de View Transitions (`<ClientRouter />` de `astro:transitions`, `transition:persist`, eventos `astro:before-preparation → after-preparation → before-swap → after-swap → page-load`) fue confirmada en docs.astro.build el 2026-09-29. Las content collections (`src/content.config.ts` + loaders `glob`/`file`) son la API de Astro 5 — **verificar contra la guía de migración de Astro 7** al iniciar.

### 5.2. Decisión clave: el canvas 3D debe sobrevivir entre páginas

Un fondo 3D continuo entre menús/páginas **exige routing del lado cliente**: con navegación tradicional (o View Transitions cross-document) el documento se recarga y el contexto WebGL muere → parpadeo + recompilar shaders.

**Solución:** `<ClientRouter />` de Astro + **un único `<canvas>` con `transition:persist`** en el layout raíz. El DOM de contenido se intercambia; el escenario 3D sigue vivo y **la cámara viaja** al capítulo de la nueva página.

```astro
---
// src/layouts/Base.astro
import { ClientRouter } from 'astro:transitions';
---
<html lang="es">
  <head><ClientRouter /></head>
  <body>
    <canvas id="stage" transition:persist="stage" aria-hidden="true"></canvas>
    <img id="stage-poster" transition:persist="poster" src="/poster-hero.avif" alt="" />
    <Header transition:persist="header" />   <!-- CTA "Cotizar receta" siempre visible -->
    <main><slot /></main>
    <FloatingWhatsApp transition:persist="wa" />
  </body>
</html>
```

```ts
// src/scripts/lifecycle.ts — un ciclo de vida, cero fugas
document.addEventListener("astro:before-swap", () => pageCtx?.revert()); // mata ScrollTriggers/tweens de la página saliente
document.addEventListener("astro:page-load", () => {
  pageCtx = gsap.context(() => initPage(document.body.dataset.page)); // capítulos de la página entrante
  stage.goTo(document.body.dataset.page); // cámara viaja al capítulo
});
```

### 5.3. Diagrama

```
                      ┌─────────────── packages/brand ───────────────┐
                      │ tokens.css · motion.ts · geometries/*.ts     │
                      │ (mortero, mano, globo, anillo, cápsula, …)   │
                      └──────────┬──────────────────────┬────────────┘
                                 │                      │
             ┌───────────────────▼─────────┐  ┌─────────▼──────────────────┐
             │ apps/web (Astro)            │  │ apps/video (Remotion)      │
             │  HTML estático + islas      │  │  @remotion/three + mismas  │
             │  Stage (Three) persistente  │  │  geometrías → MP4/WebM/AVIF│
             │  GSAP + Lenis + ScrollTrig. │  │  → public/media/ del web   │
             └──────┬───────────────┬──────┘  └────────────────────────────┘
                    │ build estático│ /api/receta
             ┌──────▼──────┐  ┌─────▼────────────────────────────┐
             │ CF Pages CDN│  │ CF Function: Turnstile → valida  │
             └─────────────┘  │ → R2 privado (TTL) → notifica    │
                              │ a la sede (email / WA Business)  │
                              └──────────────────────────────────┘
```

### 5.4. Estructura de carpetas

```
mundo-magistral/
├─ packages/brand/
│  ├─ tokens.css            # §4.1–4.4
│  ├─ motion.ts             # §4.3
│  └─ geometries/           # funciones puras que devuelven THREE.Object3D
│     ├─ mortar.ts  pestle.ts  globe.ts  orbit.ts
│     ├─ capsule.ts cream-jar.ts ovule.ts dropper.ts soap.ts
│     └─ icon-extrude.ts    # SVG de iconos → ExtrudeGeometry
├─ apps/web/
│  ├─ src/
│  │  ├─ content/           # sedes.json, especialidades.md, formas.md, faq.md
│  │  ├─ content.config.ts  # esquemas zod
│  │  ├─ layouts/Base.astro
│  │  ├─ pages/             # index, nosotros, especialidades/[slug], formas, sucursales/[slug], medicos, cotizar, 404
│  │  ├─ components/        # Header, Menu, ChapterSection, SedeCard, RecetaForm…
│  │  ├─ stage/             # Stage.ts, chapters/*.ts, shaders/*.glsl, tier.ts
│  │  └─ scripts/           # lifecycle.ts, scroll.ts (Lenis+ScrollTrigger), transitions.ts
│  ├─ functions/api/receta.ts
│  └─ public/media/         # salida de Remotion (versionada por hash)
└─ apps/video/src/          # Composiciones Remotion (§9)
```

### 5.5. Contenido como datos (sin CMS al inicio)

Content collections tipadas con zod. Ejemplo de esquema de sede:

```ts
sedes: { ciudad, departamento, nombre, direccion, telefono, whatsapp, email?, horarios: {lv, sab}, lat, lng, mapsUrl, slug }
```

Editar una sede = editar un JSON + push → deploy automático. Si el cliente necesita autonomía editorial, se añade **Keystatic** o **Decap CMS** (git-based, sin base de datos) en una fase posterior — decisión abierta (§17).

---

## 6. Motor 3D — "Stage"

### 6.1. Un escenario, muchos capítulos

- **1 canvas, 1 `WebGLRenderer`, 1 escena, 1 cámara.** Cada sección del sitio es un **capítulo** (`data-chapter="hero|mundo|mortero|formas|filosofia|sedes|medicos|cta"`) que declara: posición/objetivo de cámara, objetos visibles, paleta del fondo, intensidad de partículas.
- `Stage.goTo(chapter)` interpola entre capítulos con GSAP (`dur.chapter`, `ease.magistral`); `Stage.setProgress(chapter, p)` scrubea animaciones internas con el scroll.
- **Un solo loop:** Lenis, GSAP y Three corren en `gsap.ticker` (sin múltiples `requestAnimationFrame`).

```ts
// src/scripts/scroll.ts
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => {
  lenis.raf(t * 1000);
  stage.render(t, lenis.velocity);
});
gsap.ticker.lagSmoothing(0);
```

```ts
// binding capítulo ↔ sección (dentro de gsap.context de la página)
document.querySelectorAll<HTMLElement>("[data-chapter]").forEach((el) =>
  ScrollTrigger.create({
    trigger: el,
    start: "top 60%",
    end: "bottom 40%",
    onToggle: (s) => s.isActive && stage.goTo(el.dataset.chapter!),
    onUpdate: (s) => stage.setProgress(el.dataset.chapter!, s.progress),
  }),
);
```

### 6.2. Fondo animado que sigue el ritmo del scroll

Plano a pantalla completa detrás de la escena con un fragment shader de **ruido de flujo** (simplex 3D):

| Uniform             | Fuente                                       | Efecto                                                                                              |
| ------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `uProgress`         | progreso global de la página (ScrollTrigger) | desplaza el campo de ruido → el fondo "avanza" con el lector                                        |
| `uVelocity`         | `lenis.velocity` suavizado (lerp 0.1)        | scroll rápido = flujo más rápido + estiramiento vertical; al parar, el fondo **respira** y se calma |
| `uColorA / uColorB` | paleta del capítulo activo (tween GSAP)      | turquesa↔violeta según §3                                                                           |
| `uBase`             | `--mm-night` → `--mm-clinic`                 | transición oscuro→claro coreografiada                                                               |
| `uPointer`          | mouse / giroscopio (móvil, opcional)         | halo sutil que sigue al cursor                                                                      |

```glsl
uniform float uTime, uProgress, uVelocity;
uniform vec3  uColorA, uColorB, uBase;
varying vec2  vUv;
// float snoise(vec3) — simplex noise (Ashima/Gustavson, MIT)
void main() {
  vec2  uv   = vUv * vec2(1.0, 1.0 + uVelocity * 0.02);                 // estiramiento por velocidad
  float n    = snoise(vec3(uv * 1.8, uTime * 0.04 + uProgress * 2.5));
  float flow = smoothstep(-0.3, 0.9, n + abs(uVelocity) * 0.08);
  vec3  tint = mix(uColorA, uColorB, uv.y + n * 0.2);
  gl_FragColor = vec4(mix(uBase, tint, flow * 0.38), 1.0);
}
```

Capa extra en tiers altos: **partículas "de polvo de laboratorio"** (`THREE.Points`, ≤ 4k en tier 3, ≤ 1.5k en tier 2) con parallax en profundidad proporcional al scroll.

### 6.3. Figuras 3D basadas en el contenido real

| #   | Figura                                    | Origen en assets                                    | Construcción                                                                                                                                                                                                                                                                                                                                                                               | Capítulo / comportamiento                                                                                                                                                                                                                                            |
| --- | ----------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | **Globo-Mortero** (logo 3D)               | `logomagistral-vf-01.svg`                           | **Procedural, 0 KB de GLB:** mortero `LatheGeometry` (perfil del logo) violeta satinado; mano `CapsuleGeometry` inclinada; globo `SphereGeometry` + continentes como **globo de puntos** turquesa (instancing desde máscara equirectangular de 2048×1024 en 1 bit); anillo `TorusGeometry` violeta con leve emisivo.                                                                       | **Hero:** orbita lento; el anillo gira con el scroll. **Mundo:** el globo rota a Bolivia (lat −16.5, lng −64.7). **Mortero:** el globo desciende al mortero, la mano "tritura", el globo se desintegra en partículas (F5).                                           |
| F2  | **8 pines de sede**                       | tabla de sedes                                      | Instanced meshes (esfera + haz de luz turquesa) posicionados por lat/lng sobre el globo                                                                                                                                                                                                                                                                                                    | Aparecen con stagger al llegar a Bolivia; click en pin = scroll a la sede (el pin es decorativo; el control accesible es la lista HTML).                                                                                                                             |
| F3  | **Rompecabezas de la Filosofía**          | `filosofia-05.svg`                                  | `SVGLoader` + `ExtrudeGeometry` del icono real → 4 piezas                                                                                                                                                                                                                                                                                                                                  | **Filosofía (pinned):** 3 piezas etiquetadas **Rigor científico · Empatía · Compromiso** (VERIFICADO) encajan una a una con `ease.settle`; la 4.ª pieza es **"Tú"** (el paciente) y completa la figura cuando aparece _"Cada fórmula es única, como cada paciente."_ |
| F4  | **Montaña + Bombilla**                    | `mision-05.svg`, `vision-05.svg`                    | `ExtrudeGeometry` de los iconos, material vidrio (`MeshPhysicalMaterial`, transmission solo tier 3)                                                                                                                                                                                                                                                                                        | **Misión:** bandera se clava en la cima. **Visión:** la bombilla se enciende (emisivo + bloom tier 3).                                                                                                                                                               |
| F5  | **Partículas-fórmula**                    | concepto "macro→micro"                              | `Points` con múltiples targets (globo → nube → cápsula → frasco) interpolados en vertex shader (`uMorph`)                                                                                                                                                                                                                                                                                  | Puente entre F1 y F6: el mundo **se convierte** en la fórmula.                                                                                                                                                                                                       |
| F6  | **Campo de formas farmacéuticas**         | banners Formas/Cremas/Jabones/Óvulos + blíster azul | Procedurales instanciados: **cápsula** bicolor turquesa/violeta; **pote de crema** blanco tapa violeta; **óvulo** perla blanca (`LatheGeometry`); **frasco gotero** ámbar (soluciones/colirios); **frasco dosificador** rosa/lila (jabones)                                                                                                                                                | **Formas:** flotan en órbita; al elegir una categoría (tabs HTML), GSAP `Flip` reordena las cards y el campo 3D **filtra y reagrupa** sus instancias; color del fondo toma la paleta del banner (Cremas = turquesa, Jabones = rosa/lila, Óvulos = perla).            |
| F7  | **Tarjetas holográficas de especialidad** | `1.png`–`8.png`                                     | **No se modelan 8 órganos.** Plano con la foto + shader: desplazamiento por mapa de profundidad + scanlines turquesa + RGB-shift al hover (retoma el estilo holográfico de 6.png y 7.png). Los 8 depth maps se generan **offline una vez** (modelo monocular de profundidad, p. ej. Depth Anything) → WebP escala de grises 300×160, ≤ 8 KB c/u (≈ 64 KB total, dentro del presupuesto 3D) | **Especialidades:** grid 4×2; hover/tap activa el holo; en móvil, se activa la card centrada en viewport.                                                                                                                                                            |
| F8  | **Cápsula-héroe CTA**                     | blíster azul (`banner.jpg`)                         | Reusa F6 (cápsula) a gran escala                                                                                                                                                                                                                                                                                                                                                           | **CTA final:** la cápsula se abre y libera partículas que forman el botón "Cotizar receta" (el botón real es HTML superpuesto).                                                                                                                                      |

**Criterio de unicidad:** ninguna figura es un asset genérico de stock 3D; todas derivan del logo, los iconos o los productos fotografiados de la marca.

### 6.4. Materiales y luz

- Iluminación: 1 `HemisphereLight` + 1 `DirectionalLight` + env map pequeño (`RoomEnvironment` generado con `PMREMGenerator` → 0 KB de HDR descargado).
- Materiales: `MeshStandardMaterial` por defecto; `MeshPhysicalMaterial` (clearcoat/transmission) solo tier 3.
- Post-proceso: solo tier 3 y solo bloom suave (o nada). Sin DOF, sin SSAO en móvil.

### 6.5. Pipeline de assets 3D

1. Preferir **procedural** (F1–F6, F8 lo son).
2. Si se modela algo en Blender (p. ej. un mortero más detallado o el frasco real): exportar glTF → `gltf-transform optimize --compress meshopt --texture-compress ktx2` → **≤ 250 KB por modelo**.
3. Cargadores: `GLTFLoader` + `MeshoptDecoder` + `KTX2Loader` (transcoder Basis servido desde el propio dominio, no CDN externo).

### 6.6. Niveles de calidad (tiers) y fallbacks

| Tier      | Detección                                                        | Experiencia                                                                                                                                          |
| --------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **T3**    | `detect-gpu` tier 3, desktop/tablet potente                      | Todo: DPR ≤ 1.75, 4k partículas, physical materials, bloom                                                                                           |
| **T2**    | tier 2 / móviles medios                                          | DPR ≤ 1.25, 1.5k partículas, standard materials, sin post                                                                                            |
| **T1**    | tier ≤ 1, `navigator.connection.saveData`, `effectiveType` 2g/3g | **Sin WebGL.** Video loop de Remotion (§9, ≤ 1.2 MB, AV1 + H.264) en hero + pósters AVIF por capítulo; fondo = gradiente CSS animado con `@property` |
| **RM**    | `prefers-reduced-motion: reduce`                                 | Sin Lenis, sin pinning, sin video autoplay. Pósters estáticos + fades de opacidad ≤ 200 ms. El contenido es idéntico.                                |
| **Fallo** | WebGL no disponible / `webglcontextlost`                         | Cae a T1 en caliente, sin error visible                                                                                                              |

Extras obligatorios: pausar render cuando `document.hidden` o el canvas está fuera de viewport (IntersectionObserver en secciones sin 3D); `?tier=1|2|3` y `?rm=1` como overrides para QA.

---

## 7. Coreografía de scroll — Storyboard de la Home

| #   | Sección (HTML)                       | Capítulo 3D                                                 | Fondo (§6.2)                   | Timeline GSAP                                                                                                                                                                                                                                                                   | Copy                                                                              |
| --- | ------------------------------------ | ----------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1   | **Hero**                             | F1 orbitando, cámara lejana (crossfade sobre el póster LCP) | `night`, turquesa→violeta 30 % | H1 **visible desde el HTML**; su entrada es solo `clip-path`/`yPercent` por líneas (nunca opacity 0 → protege LCP). `SplitText` por caracteres en el eyebrow "Al servicio de la medicina personalizada" y el subtítulo. CTAs visibles desde el primer paint. **Sin preloader.** | H1 PROPUESTO: _"Tu medicamento, hecho a tu medida."_ · Sub VERIFICADO: bienvenida |
| 2   | **Qué es una farmacia magistral**    | Cámara se acerca; F1 gira                                   | turquesa (ciencia)             | Pinned 1 viewport: definición palabra por palabra scrubeada                                                                                                                                                                                                                     | VERIFICADO: "Qué es"                                                              |
| 3   | **Mundo → Bolivia**                  | Globo rota a Bolivia; F2 pines con stagger                  | turquesa + halo                | Contadores: **2019 · 7 departamentos · 8 sedes · 8 especialidades** (solo cifras verificables)                                                                                                                                                                                  | VERIFICADO                                                                        |
| 4   | **Del mundo a tu fórmula (proceso)** | Globo cae al mortero → F5 partículas → cápsula              | transición turquesa→violeta    | Pinned 250 vh, 3 pasos: _Tu médico prescribe → Preparamos tu fórmula → La recibes_                                                                                                                                                                                              | PROPUESTO (validar)                                                               |
| 5   | **Filosofía (manifiesto)**           | F3 rompecabezas se arma                                     | violeta dominante              | Pinned 200 vh; cada pieza = una palabra; al encajar "Tú", la frase manifiesto a pantalla completa                                                                                                                                                                               | VERIFICADO: Filosofía                                                             |
| 6   | **Especialidades**                   | Stage en reposo (partículas)                                | `night`→`clinic` empieza       | Cards F7 con stagger; hover holo                                                                                                                                                                                                                                                | VERIFICADO (nombres)                                                              |
| 7   | **Formas farmacéuticas**             | F6 campo de formas                                          | paleta por categoría           | Tabs + `Flip`; campo 3D se reagrupa                                                                                                                                                                                                                                             | VERIFICADO (lista)                                                                |
| 8   | **Sucursales (preview)**             | Globo pequeño en esquina con pin activo                     | `clinic`                       | Selector de ciudad → card con dirección/horario/WA/mapa                                                                                                                                                                                                                         | VERIFICADO                                                                        |
| 9   | **Para médicos**                     | F4 bombilla (Visión) encendida                              | violeta suave                  | Split layout; CTA vademécum                                                                                                                                                                                                                                                     | Quiénes somos (VERIFICADO) + CTA PROPUESTO                                        |
| 10  | **CTA final**                        | F8 cápsula → partículas → botón                             | violeta→turquesa               | Botón magnético (sigue cursor ±8 px)                                                                                                                                                                                                                                            | PROPUESTO                                                                         |
| 11  | **Footer**                           | Stage se apaga (fade)                                       | `night`                        | —                                                                                                                                                                                                                                                                               | Firma: _"Cada paciente es único, y su tratamiento también."_                      |

**Regla de pinning:** máximo 3 secciones pinned por página y ≤ 250 vh cada una — más que eso cansa y castiga al usuario que solo quiere cotizar.

---

## 8. Navegación, menú y transiciones entre páginas

### 8.1. Sitemap

```
/                       Home (storyboard §7)
/nosotros               Historia 2019 · Quiénes somos · Misión · Visión · Filosofía · Valores
/especialidades         Índice → /especialidades/[slug] (8 páginas)
/formas-farmaceuticas   Catálogo por forma (cápsulas, cremas, geles, soluciones, supositorios, óvulos, jarabes, colirios, jabones)
/sucursales             Directorio → /sucursales/[slug] (8 páginas, 1 por sede, SEO local)
/medicos                Portal profesional: asesoramiento técnico, vademécum, contacto Dirección Técnica
/cotizar                Funnel de receta (§10)
/preguntas-frecuentes   FAQ (reemplaza blog basura)
/404                    Página propia (globo "perdido" + buscador de sedes)
```

Redirecciones 301 desde WP: `/quienes-somos→/nosotros`, `/nuestros-servicios→/especialidades`, `/contactanos→/sucursales`. `410 Gone`: `/pagina-ejemplo`, `/nuestro-equipo` (hasta tener equipo real), `/noticias`, `/blog`, posts "Hola mundo"/"Otro gato"/"Lorem Ipsuim".

### 8.2. Header y menú

- Header fijo, compacto al hacer scroll down, reaparece al scroll up. **Botón "Cotizar receta" siempre visible** (P1).
- Menú overlay full-screen: links en `Outfit` gigante con stagger; **al hover de cada link, el Stage de fondo previsualiza la figura de esa página** (Nosotros → rompecabezas, Formas → cápsulas, Sucursales → globo con pines). Accesible: `<nav>` real, focus trap, `Esc` cierra, `aria-expanded`.

### 8.3. Transición entre páginas (secuencia)

**Un solo mecanismo de salida:** la View Transition nativa del `ClientRouter` anima el **contenido**; GSAP solo mueve la **cámara 3D** y anima la **entrada** de la página nueva. No hay tween GSAP de salida compitiendo con el wipe (sin tomar control del loader, `astro:before-preparation` no retrasa el swap).

**El canvas no se congela:** una View Transition sobre `root` muestra un _snapshot estático_ de la página vieja —canvas incluido—. Para que la cámara se vea viajar durante el wipe:

```css
#stage {
  view-transition-name: stage;
}
::view-transition-group(stage),
::view-transition-old(stage) {
  animation: none;
}
::view-transition-old(stage) {
  display: none;
} /* solo se ve la captura "new", que es en vivo */
::view-transition-new(stage) {
  animation: none;
}
/* la "cortina líquida" solo afecta al contenido */
main {
  view-transition-name: content;
}
::view-transition-old(content) {
  animation: var(--dur-page) var(--ease-magistral) wipe-out;
}
::view-transition-new(content) {
  animation: var(--dur-page) var(--ease-magistral) wipe-in;
} /* clip-path circle desde el click */
```

```
click link
 ├─ astro:before-preparation → Stage.goTo(destino) arranca (cámara viaja; el canvas vive fuera del snapshot)
 ├─ astro:before-swap        → pageCtx.revert() (limpia ScrollTriggers/tweens de la página saliente)
 │                              View Transition: wipe del grupo `content` (teal→violet)
 ├─ astro:after-swap         → lenis.scrollTo(0, { immediate: true })
 └─ astro:page-load          → entrada del H1 (transform/clip) · ScrollTrigger.refresh()
```

_Hipótesis a verificar en la Fase 2:_ que `::view-transition-new(stage)` muestre el canvas en vivo en Chrome y Safari. Si algún navegador lo congela, plan B: desactivar la View Transition nativa para ese navegador y hacer el wipe del contenido con GSAP tomando control del swap (hook de `astro:before-swap`), dejando el canvas fuera de cualquier snapshot. Test de Playwright: muestrear 3 frames del canvas durante la navegación y comprobar que difieren.

### 8.4. Estado del Stage por página (destino de `Stage.goTo`)

| Página                   | Estado 3D al aterrizar                                                                     | Fondo / paleta                      | Notas                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------- |
| `/`                      | Storyboard completo §7                                                                     | night → clinic                      | Única página con 3+ capítulos pinned                                                        |
| `/nosotros`              | F3 rompecabezas + F4 montaña/bombilla; timeline 2019 con F1 pequeño                        | violeta dominante                   | Capítulos: Historia → Misión (F4) → Visión (F4) → Filosofía (F3) → Pilares                  |
| `/especialidades`        | Partículas en reposo; grid F7 holográfico                                                  | night suave                         | Sin pinning                                                                                 |
| `/especialidades/[slug]` | F7 de esa especialidad ampliada (shared element `transition:name`)                         | tono del color dominante de la foto | Copy PROPUESTO por especialidad, validado                                                   |
| `/formas-farmaceuticas`  | F6 campo de formas con filtros                                                             | paleta por categoría (banners)      | Tabs + `Flip`                                                                               |
| `/sucursales`            | F1 globo en Bolivia con 8 pines F2                                                         | clinic                              | Lista HTML es el control; globo decorativo                                                  |
| `/sucursales/[slug]`     | Globo con pin de esa sede resaltado, cámara cercana                                        | clinic                              | Mapa como fachada estática → iframe solo tras click                                         |
| `/medicos`               | F4 bombilla encendida                                                                      | violeta suave                       | CTA vademécum                                                                               |
| `/cotizar`               | **Stage en calma o pausado**: fondo shader a velocidad mínima, sin partículas, sin objetos | clinic                              | P1: el funnel no compite con animaciones; render pausado mientras hay foco en el formulario |
| `/preguntas-frecuentes`  | Partículas en reposo                                                                       | clinic                              | Sin pinning                                                                                 |
| `/404`                   | F1 globo "a la deriva" girando lento                                                       | night                               | Buscador de sedes + CTA cotizar                                                             |

- Elementos compartidos con `transition:name` (p. ej. la card de una especialidad morphea en el hero de su página de detalle).
- Duración total ≤ 0.8 s; el input nunca se bloquea. Con `prefers-reduced-motion`: crossfade 150 ms.
- Navegadores sin View Transitions: `ClientRouter` hace fallback (animación simulada o swap directo) — el Stage sigue persistiendo igual.

---

## 9. Remotion — el trabajo correcto para la herramienta

Remotion **renderiza videos a partir de React**; no es un motor de animación en runtime y **no** se usa para scroll ni transiciones. Su valor aquí: **coherencia total de marca** entre web, redes y fallbacks, reutilizando `packages/brand` (tokens, easings y geometrías vía `@remotion/three`).

| Pieza                                             | Formato                                                             | Uso                                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Hero loop "Del mundo a tu fórmula"**            | 1920×1080 y 1080×1920, 8–10 s, loop perfecto, AV1 + H.264, ≤ 1.2 MB | Fallback T1 del hero (§6.6) y póster en movimiento                                                      |
| **Pósters por capítulo**                          | `renderStill` → AVIF                                                | LCP/fallback estático de cada capítulo                                                                  |
| **Explainer "Cómo funciona la receta magistral"** | 30–45 s, subtítulos quemados + VTT                                  | Página `/cotizar` y `/medicos` (carga con `preload="none"`, click-to-play)                              |
| **Reels por especialidad y forma**                | 9:16, 15 s, 16 piezas                                               | Instagram/TikTok/WhatsApp Status — misma estética que la web                                            |
| **Intro de logo 3D**                              | 3 s                                                                 | Redes y cierre de videos                                                                                |
| **OG images por página**                          | `renderStill` 1200×630                                              | Vista previa al compartir por WhatsApp (canal central del negocio: ventas y cotización ya pasan por WA) |

- **Parametrización:** cada composición lee los mismos JSON de `content/` (ej. reel de sede genera automáticamente las 8 versiones con dirección y teléfono) — nada se edita dos veces.
- **Pipeline:** `pnpm --filter video render` → salida a `apps/web/public/media/` con hash en el nombre → el build web los referencia.
- **Licencia (verificada en el LICENSE del repo de Remotion):** gratis para individuos, empresas con fines de lucro **de hasta 3 empleados** y organizaciones sin fines de lucro; en otro caso se requiere **Company License** (remotion.pro). Depende de **quién ejecuta Remotion** (Cbass como individuo vs. una agencia o la propia farmacia). Resolver antes de la Fase 4 (§17).

---

## 10. Conversión: el embudo que paga el proyecto

### 10.1. Puntos de entrada (todos a ≤ 1 tap)

- Header "Cotizar receta" (persistente) · Botón flotante WhatsApp (persistente, texto oscuro sobre verde) · CTA hero · CTA final · CTA en cada página de sede y especialidad.

### 10.2. Flujo `/cotizar` (3 pasos, barra de progreso)

1. **¿Dónde estás?** — selector de sede (8 opciones; preselección por `?sede=` o por la última sede vista, en `localStorage`).
2. **Tu receta** — **dos controles separados**: "📷 Tomar foto" (`accept="image/*" capture="environment"`) y "📎 Subir archivo" (`accept="image/*,application/pdf"` **sin** `capture`, para elegir de la galería o un PDF — en muchos Android `capture` fuerza la cámara y bloquea la galería) + nombre + WhatsApp + observaciones (alergias, sabor preferido en pediátricos). Compresión de la foto en cliente (canvas → WebP ≤ 2 MB) antes de subir para redes 4G.
3. **Confirmación** — número de solicitud + botón "Continuar por WhatsApp" con mensaje prellenado a la sede elegida.

**Honestidad técnica:** un enlace `wa.me` **no puede adjuntar archivos**. Por eso hay dos rutas complementarias:

- **Ruta A (recomendada):** la receta se sube al endpoint serverless (§10.3); el mensaje de WhatsApp incluye el **número de solicitud** y la farmacia ve el archivo en su panel/email.
- **Ruta B (sin backend, fase 0):** abrir WhatsApp con el texto prellenado e **instruir al usuario a adjuntar la foto** en el chat. Cero infraestructura, más fricción.

Mensaje prellenado (PROPUESTO): `Hola Mundo Magistral (Sede {sede}). Soy {nombre}. Envié mi receta para cotización, solicitud #{id}.`

### 10.3. Backend de recetas (datos de salud)

- **Cloudflare Function `/api/receta`:** verifica **Turnstile** → valida tipo MIME real (magic bytes) y tamaño (≤ 10 MB; JPEG/PNG/WebP/HEIC/PDF) → nombre de archivo aleatorio (UUID) → **R2 bucket privado** (sin acceso público, sin listado).
- **Acceso:** la sede recibe email con **URL firmada de expiración corta** (p. ej. 72 h) o un panel protegido por Cloudflare Access; nada de adjuntar la receta en texto plano a listas de correo.
- **Retención:** regla de ciclo de vida en R2 que borra archivos a los **N días** (propuesta: 30) — el cliente define N.
- **Rate-limit** por IP, logs sin PII, CORS solo al dominio propio.
- **Consentimiento explícito** en el formulario + página de **Política de privacidad** (qué se guarda, cuánto tiempo, quién accede). _No tengo certeza sobre la normativa boliviana vigente de protección de datos personales/salud → validar con asesoría legal del cliente antes del lanzamiento._
- Opcional fase posterior: **WhatsApp Business Cloud API** para notificar a cada sede automáticamente (requiere cuenta Meta Business verificada).

### 10.4. Portal médico (`/medicos`)

Asesoramiento técnico continuo (VERIFICADO como compromiso), solicitud de vademécum (PDF tras formulario), contacto directo con Dirección Técnica, formulario de alta de médico prescriptor. Medición: eventos `cta_click`, `receta_submit`, `wa_open` por sede.

---

## 11. La filosofía y el propósito como protagonistas

No es "una sección de Misión/Visión al fondo": es la **columna vertebral narrativa**.

1. **Frase-ancla recurrente** — _"Cada fórmula es única, como cada paciente."_ aparece en: hero (sub), manifiesto pinned (pantalla completa), footer (firma), 404 y cierre de cada video Remotion. Tipografía display, siempre con la misma animación de entrada (reconocible).
2. **La tríada de valores es interactiva** — Rigor científico · Empatía · Compromiso son las piezas físicas del rompecabezas 3D (F3). El usuario **completa** la filosofía con su scroll; la última pieza es él.
3. **Los dos públicos del propósito** — el texto verificado declara dos compromisos: _soluciones personalizadas para cada paciente_ y _acompañar al profesional médico_. El sitio tiene **dos caminos visibles** desde el hero: "Soy paciente" / "Soy médico".
4. **Pilares de marca** — Confianza · Calidad · Accesibilidad (VERIFICADO) como trío de chips en Nosotros y en la sección médicos.
5. **Misión y Visión con sus iconos reales en 3D** (F4): la bandera en la cima = misión cumplida paso a paso; la bombilla = visión de ser referentes en Bolivia.
6. **Línea de tiempo desde el 18/10/2019** en `/nosotros`: hitos reales (fundación, apertura de cada sede — **fechas a pedir al cliente**), scrub horizontal con ScrollTrigger.
7. **Microcopy coherente** — botones y estados hablan en segunda persona y en singular ("tu fórmula", "tu sede"), reforzando la personalización.

---

## 12. Rendimiento — presupuestos

| Métrica                      | Presupuesto                                                                                                           | Medición                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| LCP (móvil 4G, gama media)   | ≤ 2.5 s                                                                                                               | Lighthouse CI + WebPageTest perfil Moto G |
| INP                          | ≤ 200 ms                                                                                                              | CrUX / web-vitals en producción           |
| CLS                          | ≤ 0.05                                                                                                                | Lighthouse CI                             |
| JS inicial (sin 3D)          | ≤ 90 KB gz                                                                                                            | `astro build` + size-limit                |
| Three.js + Stage (diferido)  | ~150–200 KB gz _(estimación; medir en build real)_                                                                    | size-limit, alerta si crece > 10 %        |
| GSAP + plugins usados        | ≤ 60 KB gz (importar solo lo usado)                                                                                   | size-limit                                |
| Peso 3D total (GLB/texturas) | ≤ 600 KB (la mayoría es procedural)                                                                                   | CI                                        |
| Imágenes                     | AVIF/WebP responsivas vía `astro:assets`; banners actuales de 1.4 MB → ≤ 80 KB                                        | build                                     |
| Video hero T1                | ≤ 1.2 MB                                                                                                              | CI                                        |
| Póster hero (elemento LCP)   | ≤ 60 KB AVIF móvil / ≤ 120 KB desktop                                                                                 | CI                                        |
| Google Maps                  | **0 KB en carga inicial**: fachada estática (imagen + botón "Cómo llegar" → deep link a Maps); iframe solo tras click | Lighthouse                                |
| Lighthouse Performance móvil | ≥ 90 (Home con 3D diferido)                                                                                           | Lighthouse CI en cada PR                  |

Técnicas: fuentes self-hosted con subset; `fetchpriority="high"` en póster/H1; `loading="lazy"` y `decoding="async"` en todo lo demás; prefetch de links al hover (`prefetch` de Astro); shaders precompilados en idle (`renderer.compile`); `renderer.setPixelRatio(Math.min(devicePixelRatio, tierCap))`; `dispose()` estricto al salir de capítulos pesados.

---

## 13. Accesibilidad

- Contraste AA (§4.1) verificado con herramienta automática en CI (axe) + revisión manual de estados hover/focus.
- `prefers-reduced-motion` = experiencia RM completa (§6.6); además un **toggle visible "Reducir animaciones"** en el footer (persistido en `localStorage`).
- Canvas `aria-hidden="true"`; toda interacción 3D tiene equivalente HTML (tabs, listas, botones).
- Pinned sections: el contenido sigue en el orden del DOM; lectores de pantalla no "se quedan atrapados".
- Foco visible de marca (outline 3 px `--mm-violet` / `--mm-lilac` en oscuro); skip-link "Ir a cotizar receta".
- Formularios: labels reales, errores asociados con `aria-describedby`, sin CAPTCHA visual (Turnstile es invisible).
- Videos: subtítulos VTT, sin autoplay con sonido.

---

## 14. SEO y compartibilidad

- **Todo el contenido en HTML estático** renderizado en build (P2).
- `<title>` + meta description únicos por página, orientados a intención local: "farmacia magistral en Santa Cruz", "preparados magistrales Bolivia", "receta magistral La Paz", etc.
- **Schema.org:** `Organization` (raíz) + **un `Pharmacy` por sede** (en `/sucursales/[slug]`) con `address`, `geo`, `telephone`, `openingHoursSpecification`, `parentOrganization`. `FAQPage` en FAQ. `BreadcrumbList`.
- **Open Graph + Twitter cards** con OG images generadas por Remotion (§9) — crítico porque WhatsApp es el canal de difusión principal.
- `sitemap.xml` (`@astrojs/sitemap`), `robots.txt`, canónicos, `hreflang` no necesario (solo es-BO).
- Google Business Profile: una ficha por sede enlazando a su página `/sucursales/[slug]` (tarea del cliente, documentada).

---

## 15. Seguridad

- Sitio estático → superficie de ataque mínima (adiós plugins WP y `/wp-json/wp/v2/users`).
- **CSP estricta con allowlist explícita** vía headers de Cloudflare. Todo lo propio va empaquetado (GSAP, Three, Lenis; transcoders KTX2/Meshopt servidos desde el dominio; **benchmarks de `detect-gpu` self-hosted** usando su opción `benchmarksURL` — verificar el nombre exacto en su README). Solo se abren los orígenes que el propio plan exige:
  ```
  default-src 'self';
  script-src  'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com;
  frame-src   https://challenges.cloudflare.com https://www.google.com;   # Turnstile + Maps (solo tras click)
  connect-src 'self' https://cloudflareinsights.com;
  img-src     'self' data: blob:;
  media-src   'self';
  worker-src  'self' blob:;          # decoders KTX2/Meshopt en workers
  style-src   'self' 'unsafe-inline'; # GSAP escribe estilos inline; revisar si se puede endurecer con hashes
  frame-ancestors 'none'; base-uri 'self'; form-action 'self';
  ```
  Si se elige Plausible en lugar de Cloudflare Web Analytics, se sustituye su origen en `script-src`/`connect-src`.
- Headers: HSTS, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (cámara solo en `/cotizar`).
- Endpoint de recetas: §10.3. Secretos (Turnstile secret, API keys de email) solo en variables de entorno de Cloudflare, nunca en el repo; `secrets-scan` en pre-commit.
- Dependencias: lockfile commiteado, `pnpm audit` en CI, Renovate con merge manual.
- **Desmantelar WordPress** tras el cutover: backup completo, luego dar de baja; mientras conviva, bloquear `/wp-json/wp/v2/users` y sitemaps de autor. Reemitir el certificado con CN `mundomagistral.bo` (hoy es `cpcalendars.…`).

---

## 16. Testing, QA y despliegue

### 16.1. QA

- **Lighthouse CI** en cada PR (Home, Nosotros, Formas, Sucursal, Cotizar) con presupuestos de §12.
- **Playwright:** smoke de navegación (el canvas persiste: mismo `WebGLRenderingContext` tras 3 navegaciones), flujo completo de `/cotizar` (con Turnstile en modo test), tests visuales por página en `?tier=1` y `?rm=1`.
- **axe-core** en Playwright para a11y.
- **Dispositivo real:** Android gama media (≈ Snapdragon 6xx / Helio G) en 4G real en Bolivia + iPhone con Safari; medir FPS (objetivo ≥ 50 fps en T2) y temperatura tras 3 min de scroll.
- **Prueba de estrés de memoria:** 20 navegaciones seguidas → heap estable (sin fugas de ScrollTrigger/geometrías).

### 16.2. Despliegue

- Cloudflare Pages conectado al repo: preview por PR, producción desde `main`.
- DNS de `mundomagistral.bo` (NIC Bolivia) → Cloudflare. Plan de cutover: TTL bajo 48 h antes, redirecciones 301 probadas en preview, rollback = revertir DNS al hosting actual.
- _Latencia desde Bolivia:_ Cloudflare tiene presencia en Sudamérica, pero **no he verificado el PoP que atiende a Bolivia** → medir TTFB desde Santa Cruz/La Paz en la preview antes del cutover.
- Analítica respetuosa de privacidad (Cloudflare Web Analytics o Plausible) + eventos de conversión de §10.4.

---

## 17. Riesgos y preguntas abiertas para el cliente

| Riesgo / pregunta                                                                             | Impacto                    | Mitigación / acción                                                                        |
| --------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------ |
| Copy médico propuesto sin validar                                                             | Regulatorio / reputacional | Revisión de Dirección Técnica antes de publicar; etiquetas VERIFICADO/PROPUESTO en el repo |
| Fotos de "equipo" son stock                                                                   | Credibilidad               | Sesión de fotos real del laboratorio y las sedes (también alimenta Remotion)               |
| Emails de Cochabamba/Tarija ausentes; dominio `.bo` vs `.com`                                 | Contacto roto              | Cliente confirma emails y dominio canónico                                                 |
| Coordenadas exactas de las 8 sedes y WhatsApp por sede (¿es el mismo número que el teléfono?) | Mapa y CTA incorrectos     | Cliente confirma; se guardan en `sedes.json`                                               |
| Fechas de apertura de cada sede                                                               | Timeline de `/nosotros`    | Cliente provee                                                                             |
| Licencia Remotion                                                                             | Costo                      | Determinar entidad que renderiza (§9)                                                      |
| ¿Necesitan editar contenido sin desarrollador?                                                | Arquitectura               | Si sí → Keystatic/Decap en fase 6                                                          |
| Retención de recetas (N días) y quién accede                                                  | Legal / privacidad         | Definir con el cliente + asesoría legal                                                    |
| Uso del logo en 3D / reinterpretación                                                         | Marca                      | Aprobación del cliente sobre el modelo F1 antes de producir el resto                       |
| Sobrecarga de animación en gama baja                                                          | Rebote                     | Tiers + RM + presupuestos en CI (§6.6, §12)                                                |
| Certificaciones del laboratorio                                                               | No se pueden afirmar hoy   | Si existen, cliente entrega documentación → sección de calidad                             |

---

## 18. Roadmap por fases

_Estimación orientativa para 1 dev senior full-time; se recalibra al cerrar la Fase 0._

| Fase                               | Duración est. | Entregables                                                                                                                                                          | Criterio de salida                                                  |
| ---------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **0. Validación**                  | 1 sem         | Respuestas de §17, copy PROPUESTO aprobado, `sedes.json` completo, moodboard + prueba del modelo F1                                                                  | Cliente firma contenido y concepto                                  |
| **1. Fundaciones**                 | 1 sem         | Monorepo, `packages/brand` (tokens, motion), Astro + `ClientRouter`, layout con canvas persistente, header/menú, HTML de todas las páginas **sin 3D**, redirecciones | Lighthouse ≥ 95 sin 3D; navegación completa                         |
| **2. Motor Stage**                 | 2 sem         | Stage + tiers + fondo shader (§6.2) + F1/F2/F5 + binding de capítulos + transiciones de página (§8.3)                                                                | Canvas persiste en Playwright; ≥ 50 fps T2 en dispositivo real      |
| **3. Capítulos y páginas**         | 2 sem         | F3/F4/F6/F7/F8, storyboard Home completo, Nosotros, Especialidades (+8), Formas, Sucursales (+8), Médicos, FAQ, 404                                                  | Storyboard §7 implementado; RM y T1 revisados                       |
| **4. Remotion**                    | 1 sem         | Hero loop, pósters, OG images, explainer, plantillas de reels                                                                                                        | Assets bajo presupuesto y cableados al build                        |
| **5. Conversión**                  | 1 sem         | `/cotizar` + Function + R2 + Turnstile + notificación a sedes + política de privacidad + analítica                                                                   | Flujo end-to-end probado por cada sede                              |
| **6. QA y lanzamiento**            | 1 sem         | §16 completo, cutover DNS, baja de WordPress, fichas de Google Business                                                                                              | Presupuestos en verde en producción; 0 errores 404 de URLs antiguas |
| **7. Post-lanzamiento (opcional)** | —             | CMS git-based, WhatsApp Business API, reels mensuales automatizados desde `content/`                                                                                 | —                                                                   |

---

## 19. Verificación de este plan

- Copy: cada bloque VERIFICADO se contrasta contra el volcado de `/wp-json/wp/v2/pages` (script de comparación en `scripts/verify-copy.ts` que falla si un texto marcado VERIFICADO no aparece en la fuente).
- Contraste: los ratios de §4.1 fueron calculados con la fórmula de luminancia relativa WCAG; se re-verifican con axe en CI.
- Versiones de §5.1: `npm view <pkg> version` al iniciar la Fase 1 y fijar en lockfile.
- Experiencia: checklist por capítulo del storyboard (§7) en T3, T2, T1 y RM, grabado en video para aprobación del cliente.

---

## 20. Ejecución inmediata (tras aprobar este plan)

1. Guardar este documento como **`/home/huaritex/Escritorio/Mundo_Magistral/PLAN_REWORK_EXPERIENCIA_3D.md`** (archivo nuevo; `REWORK_MUNDO_MAGISTRAL.md` queda intacto como auditoría, con la errata documentada en §2.3).
2. No se instala ni se crea código todavía: el scaffolding del monorepo arranca en la Fase 1, previa confirmación de Cbass.
