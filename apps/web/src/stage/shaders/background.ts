export const backgroundVertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

// 3D gradient noise keeps the background alive at rest and follows scroll velocity.
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
  float flow = smoothstep(.18, .86, n * .77 + n2 * .23 + speed * .014);
  vec3 tint = mix(uColorA, uColorB, clamp(uv.y + (n - .5) * .28, 0.0, 1.0));
  float halo = pow(max(0.0, 1.0 - distance(vUv, uPointer)), 3.0) * .065;
  gl_FragColor = vec4(mix(uBase, tint, clamp(flow * .38 + halo, 0.0, .5)), 1.0);
}
`;
