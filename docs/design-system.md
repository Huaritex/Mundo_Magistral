# Sistema visual — Mundo Magistral

## Identidad

La base es blanca y clínica, con violeta profundo para confianza y contenido editorial, turquesa para acciones y detalles de precisión. Los valores fuente están en `packages/brand/tokens.css`: turquesa `#00a8ac`, violeta `#6f4897`, lila `#a98bd0` y tinta `#22163a`. Usar las variables semánticas de `apps/site/src/styles/tokens.css` en componentes; no repetir hexadecimales.

## Tipografía y composición

Outfit es la voz de interfaz y del hero. Crimson Pro sirve en los titulares editoriales del resto del sitio. Texto de cuerpo legible, medidas de línea controladas y jerarquía clara. Contenedor compartido de 1280 px; el hero usa hasta 1440 px para dar protagonismo a la fotografía. Espaciado basado en 4 px mediante `--s-*`.

El hero combina una zona de tinta violeta con fotografía realista de formulación. La tarjeta flotante explica el servicio, sin simular un producto de comercio. Una palabra gigante de bajo contraste puede servir de textura solo allí. Evitar fotos genéricas de médicos posando, iconografía médica decorativa y gradientes sin función.

## Superficies y movimiento

Acciones en píldora y tarjetas del hero de 18–24 px; conservar los patrones propios de otras páginas cuando cumplen una función de datos. Sombras suaves teñidas de violeta. Duraciones: rápida 180–200 ms, estándar 250–350 ms, imagen 600–800 ms; easing de salida `--ease-out`. Animar opacidad y transformaciones, y anular animación decorativa con movimiento reducido.

El carrusel del hero tiene cinco historias enlazadas. La fotografía cambia con un fundido de 720 ms y el contenido de la tarjeta entra después de 100 ms, mientras su marco permanece estable para evitar saltos. El indicador avanza durante 2,5 s y gobierna el cambio automático en bucle. Se detiene al enfocar el hero con teclado o al ocultar la pestaña. Puntos, flechas de teclado y gesto horizontal permiten avanzar manualmente. Con movimiento reducido se desactiva el avance automático y se mantienen los cambios instantáneos.

La presentación inicial dura 3,65 s: tipografía científica sobre tinta, una composición editorial clara, logo oficial y ensamblaje de la portada. Sus movimientos cambian la composición; no hay rotación, rebote, audio ni partículas. El cierre mide y duplica temporalmente el hero real, mueve el mensaje a su H1 y abre una máscara vertical para revelar la página. El hero mantiene la primera foto hasta que termina. Solo se reproduce al entrar directamente al inicio en una sesión nueva; `Saltar intro`, Escape y movimiento reducido liberan la portada. Arquitectura, mantenimiento y QA en `docs/intro.md`.

## Responsive

En tablet y móvil el texto antecede a la imagen. El CTA principal debe aparecer pronto y la tarjeta quedar dentro del encuadre. Revisar 360, 390, 430, 768, 1024, 1280 y 1440 px, incluyendo menú, recorte fotográfico, foco, controles táctiles y ausencia de desborde horizontal.

## Páginas internas

`PageHero` es el encabezado editorial compacto: eyebrow, titular serif, apoyo breve y fotografía propia de cada destino. El texto precede a la imagen en móvil; en escritorio se usa una composición dividida. Las variantes `split`, `wide` y `compact` cambian la proporción de la imagen sin alterar la jerarquía. Las imágenes se encuentran en `apps/site/public/media/internal/` y su origen se documenta en `docs/image-prompts.md`.

Las secciones combinan reglas finas, números tipográficos y amplios márgenes en vez de cajas genéricas. El CTA final y la cita de filosofía usan tinta violeta profunda; el resto alterna blanco y porcelana. Las tarjetas de servicios priorizan imagen, título y enlace. El localizador de Contacto usa botones de 44 px, estado `aria-pressed`, direcciones siempre visibles y datos de `sedes.json`.

Al navegar a una página interna con GSAP listo, el hero entra en unos 600 ms: el título asciende sin perder opacidad, el texto y las acciones se escalonan, y la foto llega con una dirección propia de cada destino. La navegación cambia de ruta inmediatamente; se omite el snapshot nativo para que no tape el DOM animado. Si GSAP aún no cargó, la transición nativa de 320 ms mantiene continuidad. Ambas rutas respetan movimiento reducido. Ninguna página interna depende del Stage 3D para comunicar información.
