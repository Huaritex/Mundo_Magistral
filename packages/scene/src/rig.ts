import * as THREE from 'three';
import { BRAND, createGlobe, createMortar, createOrbit, createPestle } from '@mm/brand/geometries/logo';
import { createProductField, type ProductKind } from '@mm/brand/geometries/products';
import { createPhilosophyPuzzle, createMissionMountain, createVisionBulb } from '@mm/brand/geometries/symbols';
import { createMorphParticles } from '@mm/brand/geometries/particles';
import { PALETTE, getPreset } from './chapters';
import { chapterState, resolveChapterBlend, type BlendState, type RGB, type SceneBlend } from './blend';
import { lerpPose, scenePose, type Pose } from './poses';
import { mulberry32 } from './prng';
import { QUALITY } from './quality';
import { backgroundFragment, backgroundVertex } from './shaders/background';
import type { SceneKey } from './types';

// Falla en compilación si PALETTE (chapters.ts) se desincroniza de BRAND.
const _palette: { [K in keyof typeof PALETTE]: (typeof BRAND)[K] } = PALETTE;
void _palette;

export type FormBlend = { from?: ProductKind | null; k: number };
export type Pointer = { x: number; y: number };

/** Todo lo que determina un frame. `apply` es función pura de esto (más la vista). */
export interface SceneInput {
  chapter: string;
  /** 0..1 del capítulo. */
  progress: number;
  /** Progreso de fondo (uProgress). En la web actual es el progreso GLOBAL de la página; por defecto = progress. */
  bgProgress?: number;
  /** Velocidad de scroll ya suavizada. */
  velocity: number;
  /** Segundos. */
  t: number;
  /** Capítulo previsualizado (menú): tiene prioridad como destino y se muestra "completo" (progreso 1). */
  preview?: string | null;
  form?: ProductKind | null;
  formBlend?: FormBlend;
  blend?: SceneBlend;
  /** Coordenadas normalizadas como Stage.ts: x = clientX/innerWidth, y = 1 - clientY/innerHeight. */
  pointer?: Pointer;
  /** false oculta el fondo shader (p. ej. logo sobre transparente en video). */
  backdrop?: boolean;
}

export interface SceneView { camera: THREE.PerspectiveCamera; aspect: number }

type Globe = ReturnType<typeof createGlobe>;
type SceneGroups = Partial<Record<SceneKey, THREE.Group>>;

export interface SceneRig {
  tier: 2 | 3;
  root: THREE.Group;
  hemi: THREE.HemisphereLight;
  groups: SceneGroups;
  background: THREE.Mesh;
  uniforms: {
    uTime: { value: number }; uProgress: { value: number }; uVelocity: { value: number };
    uColorA: { value: THREE.Color }; uColorB: { value: THREE.Color }; uBase: { value: THREE.Color }; uPointer: { value: THREE.Vector2 };
  };
  ambient: THREE.Points;
  logoGlobe: Globe; orbit: THREE.Group;
  worldGlobe: Globe; lastPins: number;
  mortarGlobe: THREE.Object3D; mortarGlobeApi: Globe; mortarPestle: THREE.Object3D; morph: ReturnType<typeof createMorphParticles>;
  puzzle: ReturnType<typeof createPhilosophyPuzzle>;
  mission: ReturnType<typeof createMissionMountain>;
  vision: ReturnType<typeof createVisionBulb>;
  products: ReturnType<typeof createProductField>;
  heroCapsule: THREE.Group; ctaDust: THREE.Points;
}

type Renderable = THREE.Mesh | THREE.Points;
const isRenderable = (o: THREE.Object3D): o is Renderable => o instanceof THREE.Mesh || o instanceof THREE.Points;

/** Construye toda la escena una vez por tier (equivale al constructor de Stage.ts). Sin Math.random: semilla fija. */
export function createSceneRig(tier: 2 | 3): SceneRig {
  const q = QUALITY[tier];
  const physical = q.physical;
  const root = new THREE.Group();
  const hemi = new THREE.HemisphereLight(0xe5ffff, 0x22203b, 2);
  root.add(hemi);
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.3);
  keyLight.position.set(-3, 5, 6);
  root.add(keyLight);

  const uniforms: SceneRig['uniforms'] = {
    uTime: { value: 0 }, uProgress: { value: 0 }, uVelocity: { value: 0 },
    uColorA: { value: new THREE.Color(BRAND.teal) },
    uColorB: { value: new THREE.Color(BRAND.violet) },
    uBase: { value: new THREE.Color(BRAND.white) },
    uPointer: { value: new THREE.Vector2(.5, .5) },
  };
  const background = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    uniforms, vertexShader: backgroundVertex, fragmentShader: backgroundFragment, depthWrite: false, depthTest: false,
  }));
  background.renderOrder = -100;
  background.frustumCulled = false;
  root.add(background);

  const groups: SceneGroups = {};
  const logoGlobe = createGlobe(tier);
  const orbit = createOrbit();
  const logo = new THREE.Group();
  const bowl = createMortar(physical);
  bowl.position.y = -.38;
  logoGlobe.group.position.y = .5;
  logo.add(bowl, logoGlobe.group, createPestle(physical), orbit);
  groups.logo = logo;

  const globeScene = new THREE.Group();
  const worldGlobe = createGlobe(tier);
  worldGlobe.group.scale.setScalar(1.75);
  worldGlobe.group.position.y = -.05;
  worldGlobe.pins.visible = true;
  worldGlobe.setPinProgress(0);
  globeScene.add(worldGlobe.group);
  groups.globe = globeScene;

  const mortarScene = new THREE.Group();
  const mortar = createMortar(physical);
  mortar.scale.setScalar(1.35);
  mortar.position.y = -.25;
  const mortarGlobeApi = createGlobe(tier);
  const mortarGlobe = mortarGlobeApi.group;
  mortarGlobe.position.y = .95;
  const mortarPestle = createPestle(physical);
  mortarScene.add(mortar, mortarGlobe, mortarPestle);
  const morph = createMorphParticles(q.morph);
  morph.points.position.set(0, -.28, 1.05);
  morph.points.scale.setScalar(1.25);
  mortarScene.add(morph.points);
  groups.mortar = mortarScene;

  const puzzle = createPhilosophyPuzzle(physical);
  groups.puzzle = puzzle.group;
  const mission = createMissionMountain();
  groups.mission = mission.group;
  const vision = createVisionBulb();
  groups.vision = vision.group;
  const products = createProductField();
  groups.products = products.group;

  const capsule = new THREE.Group();
  const heroCapsule = products.products.get('capsula')!.clone(true);
  heroCapsule.traverse((object) => {
    if (object instanceof THREE.Mesh) object.material = (object.material as THREE.Material).clone();
  });
  heroCapsule.scale.setScalar(1.6);
  capsule.add(heroCapsule);
  const dustPositions = new Float32Array(240 * 3);
  for (let i = 0; i < dustPositions.length; i += 3) {
    const angle = i * 2.39996;
    const radius = Math.sqrt(i / dustPositions.length * 3) * .45;
    dustPositions[i] = Math.cos(angle) * radius;
    dustPositions[i + 1] = Math.sin(angle) * radius;
    dustPositions[i + 2] = (Math.sin(i * 2.17) + 1) * .15;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const ctaDust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: BRAND.teal, size: .025, transparent: true, opacity: 0, depthWrite: false }));
  capsule.add(ctaDust);
  groups.capsule = capsule;

  Object.values(groups).forEach((group) => { group.visible = false; root.add(group); });

  const rand = mulberry32(0x4d4d);
  const positions = new Float32Array(q.ambient * 3);
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = (rand() - .5) * 10;
    positions[i + 1] = (rand() - .5) * 7;
    positions[i + 2] = (rand() - .5) * 6 - 1;
  }
  const ambientGeo = new THREE.BufferGeometry();
  ambientGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const ambient = new THREE.Points(ambientGeo, new THREE.PointsMaterial({ color: BRAND.teal, size: .017, transparent: true, opacity: .24, depthWrite: false }));
  root.add(ambient);

  return { tier, root, hemi, groups, background, uniforms, ambient, logoGlobe, orbit, worldGlobe, lastPins: 0, mortarGlobe, mortarGlobeApi, mortarPestle, morph, puzzle, mission, vision, products, heroCapsule, ctaDust };
}

function setGroupOpacity(group: THREE.Group, opacity: number) {
  if (group.userData.mmOpacity === opacity) return;
  group.userData.mmOpacity = opacity;
  group.traverse((obj) => {
    if (!isRenderable(obj)) return;
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const material of materials) {
      if (material.userData.originalOpacity === undefined) material.userData.originalOpacity = material.opacity;
      const original = material.userData.originalOpacity as number;
      material.transparent = opacity < .99 || original < .99;
      material.opacity = original * opacity;
    }
  });
}

const FORM_PALETTE: Record<ProductKind, [number, number]> = {
  capsula: [BRAND.teal, BRAND.violet], crema: [BRAND.teal, 0xb4e4e6],
  ovulo: [0xdde8f0, BRAND.violet], gotero: [0x8c543c, BRAND.teal], jabon: [0xeab8df, BRAND.lilac],
};
const GROUND_LIGHT = new THREE.Color();
/** 0..1: cuánto de "claro" es una base (RGB lineal). Misma curva que `light` en shaders/background.ts. */
const baseLight = (base: RGB) => THREE.MathUtils.smoothstep(.2126 * base[0] + .7152 * base[1] + .0722 * base[2], .04, .5);
/** Factor 0..1 del desplazamiento lateral de cámara según el aspecto del canvas (0 en vertical, 1 desde ~1.5:1). */
const wideFactor = (aspect: number) => THREE.MathUtils.clamp((aspect - .85) / .65, 0, 1);
const tmp = new THREE.Color();
const formRgb = (kind: ProductKind, i: 0 | 1): RGB => { tmp.set(FORM_PALETTE[kind][i]); return [tmp.r, tmp.g, tmp.b]; };
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const mixRgb = (a: RGB, b: RGB, k: number): RGB => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];
const formScale = (sel: ProductKind | null | undefined, kind: ProductKind) => (sel ? (kind === sel ? 1.4 : .48) : .76);
const formZ = (sel: ProductKind | null | undefined, kind: ProductKind, index: number) => (sel ? (kind === sel ? 1 : 0) : (index % 2) * .28);

/** Estado de fondo/cámara/opacidades para un input (sin efectos). */
export function resolveState(input: SceneInput): { state: BlendState; target: string; progress: number; blending: boolean } {
  const target = input.preview || input.chapter;
  const previewing = !!input.preview && input.preview !== input.chapter;
  const progress = Math.min(1, Math.max(0, previewing ? 1 : input.progress));
  const blending = !!input.blend && input.blend.k < 1;
  const state = blending ? resolveChapterBlend(input.blend!.from, target, input.blend!.k) : chapterState(target);
  return { state, target, progress, blending };
}

function poseFor(scene: SceneKey, target: string, progress: number, input: SceneInput, blending: boolean): Pose {
  const ownTo = getPreset(target).scene === scene;
  const fromChapter = input.blend?.fromChapter ?? target;
  const ownFrom = blending && getPreset(fromChapter).scene === scene;
  if (ownTo && ownFrom) {
    return lerpPose(scenePose(scene, fromChapter, input.blend!.fromProgress), scenePose(scene, target, progress), input.blend!.k);
  }
  if (ownTo) return scenePose(scene, target, progress);
  if (ownFrom) return scenePose(scene, fromChapter, input.blend!.fromProgress);
  return scenePose(scene, scene === 'globe' ? 'mundo' : target, 1);
}

/**
 * Aplica un frame al rig. Determinista: cada valor sale absoluto de `input` (t, progress, velocity, blend...);
 * no hay acumuladores ni estado entre llamadas (salvo cachés idempotentes).
 */
export function applyScene(rig: SceneRig, input: SceneInput, view: SceneView): void {
  const { state, target, progress, blending } = resolveState(input);
  const t = input.t;

  // Escenas: visibilidad + fundido.
  for (const key in rig.groups) {
    const group = rig.groups[key as SceneKey]!;
    const opacity = state.scenes[key as SceneKey] ?? 0;
    group.visible = opacity > .001;
    if (group.visible) setGroupOpacity(group, opacity);
  }
  const shown = (key: SceneKey) => (state.scenes[key] ?? 0) > .001;
  const pose = (key: SceneKey) => poseFor(key, target, progress, input, blending);

  // Tono del capítulo (0 = base profunda, 1 = base blanca) a partir de la luminancia lineal de la base ya mezclada:
  // en transiciones claro <-> oscuro los materiales cambian de forma continua, igual que el fondo.
  const light = baseLight(state.base);
  rig.hemi.groundColor.set(0x22203b).lerp(GROUND_LIGHT.set(0x7a6aa6), light);
  rig.logoGlobe.setLight(light);
  rig.worldGlobe.setLight(light);
  rig.mortarGlobeApi.setLight(light);
  const ambientMaterial = rig.ambient.material as THREE.PointsMaterial;
  ambientMaterial.color.set(BRAND.teal).lerp(GROUND_LIGHT.set(BRAND.violet), light * .7);

  // Movimiento continuo: absoluto en función de t.
  rig.logoGlobe.group.rotation.y = t * .12;
  rig.orbit.rotation.y = t * .17;
  rig.ambient.rotation.y = t * .008;
  rig.products.group.rotation.y = t * .07;

  if (shown('globe')) {
    const p = pose('globe');
    rig.groups.globe!.rotation.y = p.rotY;
    if (rig.lastPins !== p.pins) { rig.worldGlobe.setPinProgress(p.pins); rig.lastPins = p.pins; }
  }
  if (shown('mortar')) {
    const p = pose('mortar');
    rig.mortarGlobe.position.y = p.globeY;
    rig.mortarGlobe.scale.setScalar(p.globeS);
    rig.mortarPestle.rotation.z = p.pestleZ;
    rig.morph.uniforms.uMorph.value = p.morph;
    rig.morph.uniforms.uAlpha.value = p.alpha;
  }
  if (shown('puzzle')) {
    const p = pose('puzzle');
    rig.puzzle.pieces.forEach((piece, index) => {
      const local = p[`l${index}`];
      const rest = piece.userData.rest as THREE.Vector3;
      piece.position.set(rest.x + (1 - local) * (index % 2 ? 1.5 : -1.5), rest.y + (1 - local) * (index < 2 ? 1 : -1), rest.z);
      piece.rotation.z = (1 - local) * (index % 2 ? .5 : -.5);
    });
  }
  if (shown('mission')) rig.mission.flag.position.y = pose('mission').flagY;
  if (shown('vision')) {
    const p = pose('vision');
    rig.vision.light.intensity = p.light;
    (rig.vision.glass.material as THREE.MeshStandardMaterial).emissiveIntensity = p.glass;
  }
  if (shown('capsule')) {
    const p = pose('capsule');
    rig.groups.capsule!.rotation.z = p.rotZ;
    rig.heroCapsule.children[0].position.y = p.y0;
    rig.heroCapsule.children[1].position.y = p.y1;
    rig.heroCapsule.children[2].position.y = p.y2;
    rig.heroCapsule.children[3].position.y = p.y3;
    rig.ctaDust.scale.setScalar(p.dustS);
    (rig.ctaDust.material as THREE.PointsMaterial).opacity = p.dustO;
  }

  // Selector de formas (escala/posición persisten aunque products se desvanezca; el color solo pesa con products visible).
  const form = input.form ?? null;
  const fk = input.formBlend?.k ?? 1;
  const fromForm = input.formBlend?.from ?? null;
  [...rig.products.products.entries()].forEach(([kind, item], index) => {
    const s = mix(formScale(fromForm, kind), formScale(form, kind), fk);
    item.scale.setScalar(s);
    item.position.z = mix(formZ(fromForm, kind, index), formZ(form, kind, index), fk);
  });
  let colorA = state.a;
  let colorB = state.b;
  if (form) {
    const kc = Math.min(1, Math.max(0, fk));
    const w = state.scenes.products;
    const fa = mixRgb(fromForm ? formRgb(fromForm, 0) : state.a, formRgb(form, 0), kc);
    const fb = mixRgb(fromForm ? formRgb(fromForm, 1) : state.b, formRgb(form, 1), kc);
    colorA = mixRgb(state.a, fa, w);
    colorB = mixRgb(state.b, fb, w);
  }

  // Fondo shader y ambient.
  const u = rig.uniforms;
  u.uTime.value = t;
  u.uProgress.value = Math.min(1, Math.max(0, input.bgProgress ?? progress));
  u.uVelocity.value = input.velocity;
  u.uColorA.value.setRGB(colorA[0], colorA[1], colorA[2]);
  u.uColorB.value.setRGB(colorB[0], colorB[1], colorB[2]);
  u.uBase.value.setRGB(state.base[0], state.base[1], state.base[2]);
  u.uPointer.value.set(input.pointer?.x ?? .5, input.pointer?.y ?? .5);
  ambientMaterial.opacity = state.particles;

  // Cámara: solo posición (Stage.ts nunca reorienta tras lookAt(0,0,0) inicial). El fondo sigue a la cámara a z-30.
  const camera = view.camera;
  // El desplazamiento lateral (objeto a un lado, texto al otro) solo existe en pantallas anchas: en vertical el objeto va centrado.
  const wide = wideFactor(view.aspect);
  const camX = state.camX * wide;
  const camY = state.camY * (1 - wide);
  // En vertical la cámara se aleja hasta que quepa `fit` (semianchura visible = tan(fov/2) * aspect * z). El aspecto se acota en 9:16:
  // en teléfonos más estrechos el encuadre es idéntico (solo se recorta algo de aro) y el póster vertical coincide con el canvas.
  const camZ = state.fit > 0 && view.aspect < 1.25
    ? Math.max(state.camZ, state.fit / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * Math.max(.5625, view.aspect)))
    : state.camZ;
  camera.position.set(camX, camY, camZ);
  const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 30;
  rig.background.visible = input.backdrop !== false;
  rig.background.position.set(camX, camY, camZ - 30);
  rig.background.scale.set(height * view.aspect, height, 1);
}

/** Libera geometrías y materiales (los <primitive> de R3F no se liberan solos). */
export function disposeRig(rig: SceneRig): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  rig.root.traverse((obj) => {
    if (!isRenderable(obj)) return;
    geometries.add(obj.geometry);
    (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((m) => materials.add(m));
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
}
