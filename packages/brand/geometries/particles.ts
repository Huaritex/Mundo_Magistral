import * as THREE from 'three';
import { BRAND } from './logo';

export function createMorphParticles(count: number): { points: THREE.Points; uniforms: { uMorph: { value: number }; uAlpha: { value: number } } } {
  const from = new Float32Array(count * 3);
  const to = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = (i + .5) / count;
    const phi = Math.acos(1 - 2 * u);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    from[i * 3] = Math.cos(theta) * Math.sin(phi) * .75;
    from[i * 3 + 1] = Math.cos(phi) * .75;
    from[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * .75;
    // Bicolor capsule volume: compressed cylinder with hemispherical tips.
    const ring = theta * .31;
    const y = (u - .5) * 1.7;
    const radius = Math.abs(y) > .56 ? Math.sqrt(Math.max(0, .32 ** 2 - (Math.abs(y) - .56) ** 2)) : .32;
    to[i * 3] = Math.cos(ring) * radius;
    to[i * 3 + 1] = y;
    to[i * 3 + 2] = Math.sin(ring) * radius;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(from, 3));
  geo.setAttribute('aTarget', new THREE.BufferAttribute(to, 3));
  const uniforms = { uMorph: { value: 0 }, uAlpha: { value: 0 } };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: `attribute vec3 aTarget; uniform float uMorph; varying float vPart; void main(){ vPart = step(.5, position.y); vec3 p = mix(position, aTarget, uMorph); gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.); gl_PointSize = min(5., 52. / max(1.,-gl_Position.z)); }`,
    fragmentShader: `uniform float uAlpha; varying float vPart; void main(){ vec2 p=gl_PointCoord-.5; float a=1.-smoothstep(.12,.5,length(p)); vec3 c=mix(vec3(.0,.659,.675),vec3(.435,.282,.592),vPart); gl_FragColor=vec4(c,a*.84*uAlpha); }`,
  });
  const points = new THREE.Points(geo, material);
  points.userData.brandColor = BRAND.teal;
  return { points, uniforms };
}
