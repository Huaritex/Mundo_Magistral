# Intro de Mundo Magistral

## Arquitectura y decisión de runtime

`IntroGate` vive en el Layout persistente y controla elegibilidad, sesión, movimiento reducido, scroll, foco, Escape y salida. `IntroOverlay` contiene únicamente la composición. `motion-intro.ts` carga de forma diferida el GSAP ya instalado y crea una única timeline de 3,65 segundos. No se añadieron dependencias, video, audio ni WebGL a la intro.

Se evaluó el Player de Remotion: añadiría un runtime al navegador y requeriría otro mecanismo para transferir la composición al DOM del hero. Un WebM sería ligero en runtime, pero exigiría renders separados para móvil y escritorio y haría menos preciso el cierre. La timeline DOM permite adaptar las escenas y medir el hero actual usando los tokens y fuentes del sitio.

## Storyboard

| Tiempo | Composición | Movimiento |
| --- | --- | --- |
| 0,00–0,65 s | CIENCIA, tinta violeta, retícula discreta | Tipografía sale de una máscara y se traza una regla |
| 0,65–1,25 s | PRECISIÓN, recipiente de laboratorio dibujado | La palabra releva a Ciencia en la misma máscara y la geometría se estructura |
| 1,25–2,06 s | PERSONALIZACIÓN, foto editorial y tarjeta | La superficie clara abre desde el lateral; foto y card completan la composición |
| 2,06–2,90 s | Logo oficial, MUNDO MAGISTRAL, mensaje del hero | Revelado del logo sin giro; el mensaje toma protagonismo |
| 2,90–3,65 s | Hero real | El titular se alinea con el H1 medido; aparece el hero duplicado y una máscara abre la portada |

## Continuidad y rendimiento

La portada completa permanece montada detrás. El puente de salida duplica temporalmente `.hero-shell`, elimina IDs, queda inerte y oculto para tecnología asistiva y toma sus coordenadas reales. El texto se mueve hacia el H1 actual. La primera foto del carrusel no avanza hasta terminar la intro; el H1 no repite su entrada. El header aparece durante la apertura. El Stage 3D existente espera al final para descargar su runtime.

Las fotografías nuevas pesan 30,6 KiB y 13,1 KiB. Solo se solicitan si la intro va a reproducirse. La variante de 720 px se utiliza en móvil. La animación usa transformaciones, opacidad y clip-path; no anima layout ni filtros.

## Sesión, fallback y accesibilidad

La clave de `sessionStorage` es `mundo-magistral-intro-seen`. Se guarda al terminar, saltar o solicitar movimiento reducido. No se usa `localStorage` para guardar la intro. Se reproduce únicamente si la entrada inicial es el inicio; una entrada directa a una página interna registra la sesión y no dispara una presentación al navegar luego al inicio. Refresh y navegación posterior no la repiten.

El script temprano de `index.html` evita el flash de intro en sesiones ya vistas. SSR e hidratación comparten markup. El build incorpora el hash del script al CSP existente. Con JavaScript desactivado, `noscript` deja visible la página. Una falla de imagen o del chunk libera la portada, y el límite de seguridad de 4,2 s empieza desde el script temprano.

Durante la reproducción se bloquea el scroll, se compensa su ancho en el body y en los elementos fijos cuando existe, y se vuelven inertes header, main, pie y WhatsApp. La capa conserva el ancho físico del viewport para cubrir también el espacio del scrollbar. El diálogo solo permite enfocar `Saltar intro`; Escape inicia la misma salida de 300 ms. La limpieza restaura los valores originales de overflow, padding, gutter e inert. Al cambiar de tamaño, se abrevia la salida para revelar el layout responsive real.

## Responsive y desarrollo

Escritorio utiliza tipografía horizontal y fotografía a la derecha. En móvil, Personalización se compone en dos líneas, el objeto ocupa la mitad inferior y la tarjeta se simplifica. No se utiliza una escala uniforme del diseño de escritorio.

Solo en desarrollo: `/?intro=1` fuerza la reproducción, y `/?intro=1&introAt=1.8` pausa la timeline en el segundo indicado. `introAt` admite 0–3,64 s. En producción esos parámetros no fuerzan ni pausan nada. Saltar y Escape siguen funcionando durante la inspección.

## Archivos

Nuevos: `components/intro/IntroGate.tsx`, `components/intro/IntroOverlay.tsx`, `motion/motion-intro.ts`, `styles/intro.css`, dos WebP en `public/media/intro/` y `scripts/e2e/intro.spec.mjs`.

Integración: `Layout.tsx`, `main.tsx`, `components/hero/HomeHero.tsx`, `index.html`, `scripts/e2e/smoke.spec.mjs`, `docs/design-system.md`, `docs/image-prompts.md` y este documento.

No hay assets temporales pendientes de reemplazo. La foto generada es editorial; el cierre usa la foto de preparación existente y el logo oficial del sitio.

## QA y medidas finales — 2 de octubre de 2026

- Composiciones y fotogramas revisados en navegador: Ciencia, Precisión, Personalización, marca y cierre. Anchos 360, 390, 430, 768, 1024, 1280 y 1440 px; sin desborde horizontal ni texto accidentalmente recortado. La composición móvil reorganiza foto, palabra y card.
- Se corrigieron la doble transformación que ocultaba Precisión, el contraste del control de salida y el borde descubierto al ocultar un scrollbar clásico. Se revisó de nuevo en el navegador integrado después de esas correcciones.
- En 1440 × 900, el H1 duplicado y el real coinciden en x=104, y=279,1875, ancho=509,265625 y alto=159,65625 px. Al liberar la intro, el H1 real conserva esas coordenadas y se restauran padding, overflow e inert.
- `pnpm check` (TypeScript) y `pnpm build`: correctos. No existe un script de lint configurado.
- Suite completa: 18 pruebas E2E correctas. Después del último ajuste de scrollbar se repitieron las 5 pruebas de intro: correctas. Cubren sesión y refresh, skip, Escape y foco, movimiento reducido, entrada interna, fallo de imagen y HTML sin JavaScript.
- `pnpm budgets`: correcto. JS inicial máximo **102,4 KiB gzip / 110 KiB**, frente a 100,3 KiB antes de la intro: aproximadamente **+2,1 KiB**. Grupo de motion **58,5 KiB / 60 KiB**, frente a 57,1 KiB: aproximadamente **+1,4 KiB**. El chunk diferido de la timeline pesa **1,44 kB gzip**. No se añadieron dependencias.
- Stage existente: **245,7 KiB / 300 KiB**, sin cambio. El build conserva su aviso de tamaño del chunk Three existente; la intro no lo usa.
- Evidencia visual: `artifacts/intro-shots/personalizacion-1440.png` y `personalizacion-430.png`.
