# Dirección de diseño — MundoMagistral (Fase C)

Idea rectora: **la fórmula magistral**. El sitio se lee como una receta bien escrita: ingredientes claros, cantidades precisas, una persona al final. Todo lo visual sale de ese mundo (etiqueta de preparado, "Rp/", lista de ingredientes con puntos guía, mortero, globo del logo). Nada de "SaaS oscuro con degradé".

## Qué no hacemos (marcadores de plantilla generada)
- Kicker en mayúsculas sobre cada h2; etiquetas ALL-CAPS; "A · B · C" con puntos medios; "→" en cada enlace.
- Una palabra del titular en otro color/cursiva.
- Tarjetas idénticas con el mismo radio y la misma sombra gris; degradés como decoración.
- Fondo azul marino casi negro (#0B1020) con acento neón; fondo crema con serif + terracota.
- Fade-up genérico en cada sección y hover decorativo en cada tarjeta. El cliente pidió explícitamente transiciones al scroll, fondo que acompaña, interacciones únicas y animación profesional: **no se elimina movimiento**; se reemplaza el genérico por movimiento propio del contenido (la cifra que cuenta, la línea del proceso que se dibuja, las palabras de la filosofía que se iluminan, el Stage 3D que sigue el scroll, el indicador líquido del menú, la transición circular de página). Las escenas de la capa motion (motion-reveals, bridge al Stage, header/menú) se conservan y se adaptan al nuevo markup; nunca se borran sin reemplazo. Motion + scroll está en 57.8 de 60 KiB: escenas nuevas deben caber o declararse.
- Números 01/02/03 salvo en el proceso (ahí sí es una secuencia).

## Sistema
**Color** (marca intacta: turquesa #00A8AC, violeta #6F4897)
- Porcelana `#F2F5F6` (base clara, fría, clínica) y blanco para superficies de lectura.
- Tinta violeta `#22163A` (derivada del violeta de marca) para capítulos inmersivos y el fondo 3D, en lugar del azul marino. Cambio único en `packages/brand` (BRAND.night y tokens.css) y luego re-render de póster hero, videos y OG por el pipeline Remotion, para que no haya costura entre póster y canvas. Contraste calculado: blanco 16.9, turquesa 5.8, lila 5.9 sobre tinta (violeta #6F4897 sobre tinta solo 2.45: NO usar como texto); tinta sobre porcelana 15.4, violeta 6.3, turquesa-tinta 4.57 sobre porcelana (mínimo AA, solo texto normal ≥ 16 px).
- Turquesa = lo activo y lo "químico" (acciones, medidas, foco). Violeta = lo humano (títulos, paciente, filosofía).
- Turquesa-tinta `#007C80` para texto sobre claro; lila `#A98BD0` para texto violeta sobre oscuro; WhatsApp `#25D366` con texto `#0B1B2B`. Recalcular contraste AA de todo par nuevo con la fórmula WCAG y dejar la tabla en este archivo.

**Tipografía** (2 familias, una clara voz editorial + una funcional)
- Display/titulares/citas: **Crimson Pro** variable (serif humanista de contraste medio; `@fontsource-variable/crimson-pro` 5.3.0, latin wght, 48.2 KB). Se eligió en lugar de Newsreader porque la variante wght de Newsreader pesa 58.1 KB (> 50 KB) y su eje óptico solo existe en el archivo opsz de 132 KB; Crimson Pro mantiene el mismo carácter (humanista, oficio, dialoga con mortero y wordmark) dentro del presupuesto. Transmite confianza y oficio.
- UI y texto: Outfit (geométrica como el logo). Inter deja de usarse en el sitio (-48 KB de fuente crítica; la dependencia `@fontsource-variable/inter` queda sin uso en apps/site/package.json).
- Carga: Outfit precargada (Layout.tsx). Crimson Pro NO va en la ruta crítica: `lib/fonts.ts` la registra con la API FontFace tras `load` + idle (inmediata en visitas repetidas). Motivo medido (Lighthouse simulado, COMPRESS=1, mediana de 4 a 5 corridas): con la fuente en la ruta crítica el LCP de / subía de 2106 a ~2254 ms y el de /cotizar se quedaba en ~2480 (sin mejora); fuera de ella queda en 1960 y 2331 ms. Mientras carga, los titulares usan `Crimson Fallback` (Times/Liberation Serif con size-adjust 100.1 %, ascent 89.5 %, descent 21.5 %, medidos), `Crimson Fallback Noto` para Android y otros sin Times (Noto Serif: 84.46 %, 106.08 %, 25.45 %) y el texto `Outfit Fallback` (Arial/Liberation Sans: 98.13 %, 101.9 %, 26.49 %). Medición reproducible con `node artifacts/design-shots/_metrics.mjs`. CLS 0 durante el cambio de fuente medido en Chromium/Linux (Liberation Serif); el respaldo Noto (Android) está calculado pero NO probado en un dispositivo Android real. Al registrar la fuente, `lib/fonts.ts` emite `mm:fonts-loaded` y motion-reveals re-mide con `ScrollTrigger.refresh()`. Consecuencia visible: en la PRIMERA visita el H1 del hero y todos los titulares se pintan 1 a 3 s con la serif de respaldo y luego cambian a Crimson Pro (sin mover el layout); en visitas repetidas se registra de inmediato.
- Escala fluida con `clamp()`, interlineado serif +.05 sobre sans, medida de línea < 70 caracteres en cuerpo.

**Estructura como información**
- Puntos guía de receta ("Rigor científico ····· en cada fórmula") para listas de atributos y valores.
- Etiqueta de preparado (marco fino, esquinas rectas, dato pequeño) solo donde hay datos reales: sedes, horario, cantidades.
- Bordes y numeración solo donde codifican algo (secuencia del proceso, jerarquía).

## Momento memorable (uno solo)
**La fórmula de la filosofía.** En la home y en /nosotros, "Rigor científico + Empatía + Compromiso" se "pesan" en el mortero 3D y el resultado es la frase "Cada fórmula es única, como cada paciente." El resto de la página es silencioso y legible.

## Hero
Lo más característico del mundo de la marca: el globo dentro del mortero (logo 3D) grande a la derecha/fondo, titular "Del mundo a tu fórmula." a la izquierda con la frase de bienvenida verificada, dos caminos claros: *Cotizar receta* (primario) y *Escribir por WhatsApp*, y abajo "Soy paciente / Soy médico". Se elimina la decoración CSS falsa (órbitas/planeta) que duplica el 3D.

## Información clara (prioridad 1)
- Cada sección responde una pregunta en su titular (sin titulares crípticos): ¿Qué es una farmacia magistral?, ¿Cómo funciona?, ¿En qué especialidades?, ¿Dónde estamos?, ¿Eres médico?
- Un solo CTA primario por pantalla; "Cotizar receta" y WhatsApp accesibles siempre.
- Sedes: ciudad, dirección, teléfono y horario visibles sin hover; el número de WhatsApp por sede y las coordenadas siguen pendientes del cliente (no inventar).
- Copy VERIFICADO no se altera; el PROPUESTO mantiene su etiqueta.

## Invariantes técnicos (no negociables)
- Contenido visible sin JS y con `?rm=1`/tier 1; ningún estado oculto inicial en CSS; H1 solo con transform; header nunca oculto.
- Conservar los atributos y clases que usa la capa de motion (`data-chapter`, `data-pin`, `data-reveal`, `data-parallax`, clases `.lbl`, `.nav-pill`, `.site-header`, etc.) o actualizar la capa de motion a la vez.
- Contraste AA, foco visible, objetivos táctiles ≥ 44 px, móvil 360 px primero.
- Presupuestos aprobados por Cbass: JS inicial ≤ 110 KiB, Stage ≤ 300 KiB gz, fuente display ≤ 50 KB y póster ≤ 60 KB; Lighthouse móvil ≥ 90, LCP ≤ 2.5 s medido con `COMPRESS=1`.

---

# Implementación Fase C (estado al cierre)

## Tokens (apps/site/src/styles/tokens.css)
| Grupo | Valores |
|---|---|
| Color | `--ink` #22163A (= `--mm-night`), `--porcelain` #F2F5F6, `--paper` #FFF, `--violet` #6F4897, `--violet-deep` #583479, `--teal` #00A8AC, `--teal-ink` #007C80, `--lilac` #A98BD0, `--ink-2` #4B4263, `--ink-3` #5A5170, `--on-dark-2` #E3DCF0, `--line-strong` #8A8299, `--error` #9D1B32 |
| Tipografía fluida | micro .8125rem · small .9375rem · body 1 a 1.0625rem · lead 1.1875 a 1.4375rem · h3 1.5 a 2rem · h2 2.25 a 4.1rem · h1 2.6 a 5.4rem · display 3.25 a 7.4rem · fórmula 2.2 a 4.9rem. Interlineado: UI 1.55, serif en texto corrido 1.6, display 1.04. Medida de línea 62ch. |
| Espaciado | base 4 px: `--s-1` .25rem a `--s-9` 6.5rem; ritmo de sección `--section-y` clamp(4.5rem, 3rem + 7vw, 8.5rem) |
| Radios | regla: **redondeado = se puede pulsar; recto = es un dato**. `--r-action` 999px (botones, pestañas), `--r-field` 6px (campos), `--r-media` 6px (fotos, vídeo), `--r-data` 2px (etiquetas de sede, resumen) |
| Elevaciones | solo dos, teñidas de tinta: `--e-float` (isla, WhatsApp, formulario) y `--e-paper` (etiqueta sobre claro) |
| Foco | anillo 3 px con separación 3 px: violeta sobre claro, lila sobre oscuro |

## Tabla de contraste WCAG 2.x (calculada con artifacts/design-shots/_contrast.mjs; reproducir con `node artifacts/design-shots/_contrast.mjs --md`)
Texto normal >= 4.5:1; texto grande (>= 24 px) y elementos gráficos >= 3:1. "Peor caso" = capa translúcida sobre el píxel más claro posible del Stage (blanco), porque axe no evalúa texto sobre `<canvas>`.

| Par (texto / fondo) | Hex | Razón | Mínimo | Resultado |
|---|---|---|---|---|
| Texto principal sobre porcelana | #22163A / #F2F5F6 | 15.41 | 4.5 | pasa |
| Texto principal sobre blanco | #22163A / #FFFFFF | 16.88 | 4.5 | pasa |
| Texto secundario sobre porcelana | #4B4263 / #F2F5F6 | 8.49 | 4.5 | pasa |
| Texto secundario sobre blanco | #4B4263 / #FFFFFF | 9.30 | 4.5 | pasa |
| Leyendas sobre porcelana | #5A5170 / #F2F5F6 | 6.74 | 4.5 | pasa |
| Leyendas sobre blanco | #5A5170 / #FFFFFF | 7.38 | 4.5 | pasa |
| Violeta (titulares, enlaces) sobre porcelana | #6F4897 / #F2F5F6 | 6.28 | 4.5 | pasa |
| Violeta sobre blanco | #6F4897 / #FFFFFF | 6.89 | 4.5 | pasa |
| Turquesa-tinta sobre porcelana (solo >= 16 px) | #007C80 / #F2F5F6 | 4.57 | 4.5 | pasa (justo) |
| Turquesa-tinta sobre blanco (solo >= 16 px) | #007C80 / #FFFFFF | 5.01 | 4.5 | pasa |
| Turquesa profundo sobre porcelana (texto pequeño) | #006B6F / #F2F5F6 | 5.75 | 4.5 | pasa |
| Error sobre blanco | #9D1B32 / #FFFFFF | 7.97 | 4.5 | pasa |
| Borde de campo sobre blanco (no texto) | #8A8299 / #FFFFFF | 3.66 | 3 | pasa |
| Anillo de foco violeta sobre porcelana (no texto) | #6F4897 / #F2F5F6 | 6.28 | 3 | pasa |
| Botón primario claro: blanco sobre violeta | #FFFFFF / #6F4897 | 6.89 | 4.5 | pasa |
| Botón primario claro, hover: blanco sobre violeta profundo | #FFFFFF / #583479 | 9.62 | 4.5 | pasa |
| Botón primario oscuro: tinta sobre turquesa | #22163A / #00A8AC | 5.79 | 4.5 | pasa |
| WhatsApp: texto sobre verde | #0B1B2B / #25D366 | 8.78 | 4.5 | pasa |
| Blanco sobre tinta opaca | #FFFFFF / #22163A | 16.88 | 4.5 | pasa |
| Texto secundario oscuro sobre tinta opaca (pie) | #E3DCF0 / #22163A | 12.67 | 4.5 | pasa |
| Leyenda oscura sobre tinta opaca | #C9BEE0 / #22163A | 9.59 | 4.5 | pasa |
| Turquesa sobre tinta opaca | #00A8AC / #22163A | 5.79 | 4.5 | pasa |
| Lila sobre tinta opaca | #A98BD0 / #22163A | 5.86 | 4.5 | pasa |
| Violeta de marca sobre tinta | #6F4897 / #22163A | 2.45 | 3 | NO usar (ni texto ni gráfico) |
| Enlace actual del menú/nav oscura | #7EE3E4 / #22163A | 11.25 | 4.5 | pasa |
| Texto de apoyo del menú | #F0E9FA / #22163A | 14.26 | 4.5 | pasa |
| Paso activo del formulario: violeta profundo sobre blanco | #583479 / #FFFFFF | 9.62 | 4.5 | pasa |
| Hover de pestañas/preguntas: violeta profundo sobre porcelana | #583479 / #F2F5F6 | 8.78 | 4.5 | pasa |
| Peor caso velo .74: blanco | #FFFFFF / #5B536D | 7.23 | 4.5 | pasa |
| Peor caso velo .74: texto secundario oscuro | #E3DCF0 / #5B536D | 5.43 | 4.5 | pasa |
| Peor caso velo .74: leyenda oscura | #C9BEE0 / #5B536D | 4.11 | 4.5 | NO usar sobre velo < .86 |
| Peor caso velo .74: lila | #A98BD0 / #5B536D | 2.51 | 4.5 | NO usar como texto |
| Peor caso velo .74: turquesa | #00A8AC / #5B536D | 2.48 | 3 | solo decoración aria-hidden |
| Peor caso velo .86: blanco | #FFFFFF / #413756 | 11.02 | 4.5 | pasa |
| Peor caso velo .86: texto secundario oscuro | #E3DCF0 / #413756 | 8.27 | 4.5 | pasa |
| Peor caso velo .86: turquesa (texto >= 24 px) | #00A8AC / #413756 | 3.78 | 3 | pasa |
| Velo real de mundo/cifras (.62): blanco | #FFFFFF / #766F85 | 4.79 | 4.5 | pasa |
| Velo real de fórmula (.66): blanco | #FFFFFF / #6D657D | 5.51 | 4.5 | pasa |
| Velo real de heroes de página (.70): blanco | #FFFFFF / #645C75 | 6.31 | 4.5 | pasa |
| Velo real de proceso (.72): blanco | #FFFFFF / #605771 | 6.78 | 4.5 | pasa |
| Velo real de "¿Qué es?" (.76): blanco | #FFFFFF / #574E69 | 7.78 | 4.5 | pasa |
| Velo real de heroes sedes/formas (.80): blanco | #FFFFFF / #4E4561 | 8.94 | 4.5 | pasa |
| Velo real de CTA final (.82): blanco | #FFFFFF / #4A405D | 9.62 | 4.5 | pasa |
| Velo real de hero faq (.94): blanco | #FFFFFF / #2F2446 | 14.37 | 4.5 | pasa |
| Hero, borde derecho del lead a 1440 px (velo .78): blanco | #FFFFFF / #524965 | 8.40 | 4.5 | pasa |
| Hero, borde derecho del H1 a 1440 px (velo .53, texto grande): blanco | #FFFFFF / #8A8396 | 3.64 | 3 | pasa (margen corto: si el H1 crece, endurecer el gradiente) |
| Hero, botones (velo .89): blanco | #FFFFFF / #3B3050 | 12.18 | 4.5 | pasa |

Reglas derivadas: sobre capas translúcidas (`.dark`, `--veil` < .86) el texto va en blanco puro; turquesa y lila solo sobre tinta opaca (pie, menú) o como decoración `aria-hidden` (el "+" y el "=" de la fórmula, los trazos de puntos). El texto iluminado por scroll (respuesta de "¿Qué es?" y frase de la fórmula) nunca baja de opacidad .6: es texto grande y con ese piso pasa 3:1 incluso con el peor fondo que calcula axe (sección translúcida sobre el cuerpo claro, sin ver el canvas).

## Velos por capítulo (`--veil`, opacidad de la tinta sobre el Stage)
hero 0 (más velo de gradiente detrás del texto) · que-es .76 · mundo .62 · mortero .72 · fórmula .66 · cta .82 · heroes de página .7 (faq .94, sedes y formas .8). Las secciones claras son opacas salvo dos "ventanas" en escritorio con Stage 2/3: sedes (globo a la izquierda, etiquetas a la derecha con velo de porcelana solo detrás del texto) y /formas-farmaceuticas (panel opaco a la izquierda, el objeto 3D de la forma elegida a la derecha).

## Mapa de movimiento (motion-reveals.ts; presupuesto motion+scroll 57.5 de 60 KiB)
| Contenido | Movimiento propio | Modo |
|---|---|---|
| Titular del hero y de páginas | sube dentro de su máscara de línea al navegar (solo transform; primera carga sin animación para no mover el LCP) | full |
| Salida del hero | la copia se aleja y se atenúa (scrub) | full |
| "¿Qué es una farmacia magistral?" | la respuesta se ilumina palabra a palabra (scrub, fijada) | full |
| Cifras con puntos guía | la cifra cuenta (2019 desde 1990) y el trazo de puntos se dibuja hasta ella | full |
| "¿Cómo funciona?" | la línea se dibuja y cada paso se enciende en secuencia (scrub, fijada) | full |
| La fórmula de la filosofía (nueva) | Rp/ > cada término y cantidad se "imprimen" y su guía de puntos se une > raya y "=" > la frase ancla sube por líneas y se ilumina por palabras. Fijada 240 % en escritorio; al llegar el resultado el Stage pasa de `formula` (mortero) a `filosofia` vía `store.goTo` | full |
| Especialidades | clip-path desde abajo + foto 1.15 a 1 | full, light |
| Formas (lista) | los nombres se imprimen de izquierda a derecha | full, light |
| Sedes | la etiqueta se imprime de arriba abajo y dibuja sus trazos de puntos | full (trazos), light (clip) |
| CTA final | el botón se asienta con un brillo que barre | full |
| Bordes oscuro a claro, parallax de foto de detalle, footer (frase de marca en máscara), CTA magnético, header/menú, transición circular de página | conservados sin cambios de comportamiento | full |
| Texto corrido | no se anima (antes: fade-up en cada párrafo) | |
Sin JS, con `?rm=1` y en tier 1 todo queda en su estado final: ningún estado oculto vive en CSS.

## Coordinación pendiente con otros paquetes
- packages/brand: `BRAND.night` (logo.ts) y `--mm-night` (tokens.css) pasan de #0B1020 a #22163A. Forzado: `PALETTE.night` de packages/scene/src/chapters.ts (rig.ts exige paridad de tipos literales con BRAND).
- Bases propias de preset en scene que siguen navy: `especialidades` 0x172437 y `medicos` 0x29243c (y el `b` de `que-es`/`mundo`); conviene alinearlas con la tinta.
- El hero asume el logo 3D a la derecha; el preset `hero` no tiene `cameraX`, así que hoy el logo queda centrado y parte de él tras el velo del texto.
- Los binarios de video, menú, OG y póster se regeneran con `pnpm video:assets`, `pnpm video:menu`, `pnpm video:og` y `pnpm video:poster`. Los scripts escriben directamente en `apps/site/public/media`.

## Verificación final (cifras reales al cierre)
| Chequeo | Resultado |
|---|---|
| `pnpm --filter @mm/site check` (tsc) y `pnpm --filter @mm/scene check` | sin errores |
| `SITE=site node scripts/check-budgets.mjs` | JS inicial 99.9 / 110 KiB (peor: cotizar), Stage+three+detect-gpu 244.8 / 300, Motion+scroll 57.5 / 60 (antes 57.8), póster 3.8 / 60 |
| `SITE=site pnpm verify:copy` | 6 de 6 (compara el JSON con WP; además `_check-dist.mjs` exige cada valor de verifiedCopy literal en `index.html` y `nosotros.html`) |
| `pnpm test:e2e:site` | 7 de 7 (3 corridas seguidas estables) |
| `pnpm test:perf:site` (COMPRESS=1) | `/` 98 · LCP 1.96 a 2.11 s; `/nosotros` 98 · 2.03 s; `/formas-farmaceuticas` 99 · 1.83 s; `/sucursales/la-paz` 98 · 1.96 a 2.10 s; `/cotizar` 97 · 2.33 s (antes 2.48 s). CLS 0.000 en todas |
| axe (`_axe.mjs`, WCAG 2.0/2.1/2.2 A y AA) | 0 violaciones en 40 combinaciones: 5 rutas x (sin query, tier 3 recorrido, tier 1, `?rm=1`) x (1440, 360 px). Quedan "incomplete" de contraste en nodos sobre el canvas (axe no ve el canvas; cubiertos por la tabla de peor caso) |
| Chequeo contra dist (`_check-dist.mjs`) | `section-kicker` 0, `text-transform: uppercase` 0, " · " en texto visible 0, flechas ↗ → ↓ ↑ 0, color #0B1020 antiguo 0 |
| Sin JS (`_nojs.mjs`) | contenido completo visible en home, formas, cotizar y sede (360 y 1440 px), sin desborde; los 2 nodos "ocultos" en /cotizar son los mensajes de error `hidden` del formulario |
| Desbordes / objetivos táctiles (`_overflow.mjs`) | 8 anchos (320 a 1920) x 12 rutas: 0 desbordes horizontales; objetivos >= 44 px salvo el número de teléfono de la etiqueta (zona de toque ampliada con `::after`, el rectángulo medido sigue midiendo 19 px de alto) |
