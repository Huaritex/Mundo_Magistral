export const backgroundVertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

// 3D gradient noise keeps the background alive at rest and follows scroll velocity.
// uBase / uColorA / uColorB llegan en RGB lineal (THREE.Color): al final se convierte al espacio de salida para que la base
// coincida con el hex del CSS (el blanco del sitio es #FFFFFF, la tinta de los bloques profundos #22163A).
// Sobre base clara el flujo se atenúa (tope más bajo): el fondo sigue "vivo" pero sigue siendo blanco y el texto tinta conserva contraste.
export const backgroundFragment = /* glsl */ `
precision mediump float;
uniform float uTime, uProgress, uVelocity;
uniform vec3 uColorA, uColorB, uBase;
uniform vec2 uPointer;
varying vec2 vUv;
float hash(vec3 p) { p = fract(p * .1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float noise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                 mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                 mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
void main() {
  float speed = clamp(abs(uVelocity), 0.0, 22.0);
  vec2 uv = vUv * vec2(1.0, 1.0 + speed * .018);
  float n = noise3(vec3(uv * 3.0, uTime * .035 + uProgress * 2.5));
  float n2 = noise3(vec3(uv * 5.0 + 3.4, uTime * -.028 + uProgress));
  float lum = dot(uBase, vec3(.2126, .7152, .0722));
  float light = smoothstep(.04, .5, lum);
  // Sobre claro el umbral sube: la mayor parte del fondo queda blanca y el flujo solo aparece en manchas.
  float flow = smoothstep(mix(.18, .4, light), .86, n * .77 + n2 * .23 + speed * .014);
  vec3 tint = mix(uColorA, uColorB, clamp(uv.y + (n - .5) * .28, 0.0, 1.0));
  float halo = pow(max(0.0, 1.0 - distance(vUv, uPointer)), 3.0) * mix(.065, .09, light);
  float amount = clamp(flow * mix(.38, .5, light) + halo, 0.0, mix(.5, .26, light));
  gl_FragColor = vec4(mix(uBase, tint, amount), 1.0);
  #include <colorspace_fragment>
}
`;
