import * as THREE from 'three';
import { gsap } from 'gsap';
import { ease, dur } from '@mm/brand/motion';
import { BRAND, createGlobe, createMortar, createOrbit, createPestle } from '@mm/brand/geometries/logo';
import { createProductField, type ProductKind } from '@mm/brand/geometries/products';
import { createPhilosophyPuzzle, createMissionMountain, createVisionBulb } from '@mm/brand/geometries/symbols';
import { createMorphParticles } from '@mm/brand/geometries/particles';
import { backgroundVertex, backgroundFragment } from './shaders/background';
import type { StageTier } from './tier';

type SceneKey = 'logo' | 'globe' | 'mortar' | 'puzzle' | 'mission' | 'vision' | 'products' | 'capsule' | 'none';
type ChapterPreset = { scene: SceneKey; base: number; a: number; b: number; cameraZ: number; cameraX?: number; particles?: number };

const NIGHT = BRAND.night;
const CLINIC = 0xf4f7fb;
const CHAPTERS: Record<string, ChapterPreset> = {
  hero: { scene: 'logo', base: NIGHT, a: BRAND.teal, b: BRAND.violet, cameraZ: 5.5, particles: .32 },
  'que-es': { scene: 'logo', base: NIGHT, a: BRAND.teal, b: 0x20556b, cameraZ: 4.6, particles: .36 },
  mundo: { scene: 'globe', base: NIGHT, a: BRAND.teal, b: 0x265b7b, cameraZ: 3.9, particles: .52 },
  mortero: { scene: 'mortar', base: NIGHT, a: BRAND.teal, b: BRAND.violet, cameraZ: 4.45, particles: .88 },
  formula: { scene: 'mortar', base: NIGHT, a: BRAND.teal, b: BRAND.violet, cameraZ: 4.2, particles: .95 },
  filosofia: { scene: 'puzzle', base: NIGHT, a: BRAND.violet, b: BRAND.lilac, cameraZ: 4.7, particles: .4 },
  historia: { scene: 'globe', base: NIGHT, a: BRAND.violet, b: BRAND.teal, cameraZ: 5.3, particles: .35 },
  mision: { scene: 'mission', base: NIGHT, a: BRAND.violet, b: BRAND.teal, cameraZ: 4.7, particles: .3 },
  vision: { scene: 'vision', base: NIGHT, a: BRAND.violet, b: BRAND.teal, cameraZ: 4.5, particles: .35 },
  especialidades: { scene: 'none', base: 0x172437, a: BRAND.teal, b: BRAND.violet, cameraZ: 5, particles: .2 },
  formas: { scene: 'products', base: CLINIC, a: BRAND.teal, b: BRAND.violet, cameraZ: 5.8, particles: .25 },
  sedes: { scene: 'globe', base: CLINIC, a: BRAND.teal, b: 0xd9e9f0, cameraZ: 5.4, cameraX: 1.1, particles: .2 },
  medicos: { scene: 'vision', base: 0x29243c, a: BRAND.violet, b: BRAND.lilac, cameraZ: 5.2, particles: .15 },
  cta: { scene: 'capsule', base: NIGHT, a: BRAND.violet, b: BRAND.teal, cameraZ: 4.45, particles: .6 },
  cotizar: { scene: 'none', base: CLINIC, a: BRAND.teal, b: BRAND.violet, cameraZ: 5, particles: 0 },
  faq: { scene: 'none', base: CLINIC, a: BRAND.teal, b: BRAND.violet, cameraZ: 5, particles: .1 },
  footer: { scene: 'none', base: NIGHT, a: BRAND.violet, b: BRAND.teal, cameraZ: 5.5, particles: 0 },
  '404': { scene: 'globe', base: NIGHT, a: BRAND.violet, b: BRAND.teal, cameraZ: 5.5, particles: .32 },
};

const PAGE_CHAPTER: Record<string, string> = {
  home: 'hero', nosotros: 'historia', especialidades: 'especialidades',
  formas: 'formas', sucursales: 'sedes', medicos: 'medicos', cotizar: 'cotizar',
  faq: 'faq', '404': '404',
};

function getPreset(chapter: string): ChapterPreset {
  return CHAPTERS[chapter] ?? CHAPTERS[PAGE_CHAPTER[chapter] ?? 'hero'];
}

function setGroupOpacity(group: THREE.Object3D, opacity: number) {
  group.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.InstancedMesh)) return;
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const material of materials) {
      if (!(material instanceof THREE.Material)) continue;
      if (material.userData.originalOpacity === undefined) material.userData.originalOpacity = material.opacity;
      material.transparent = opacity < .99 || (material.userData.originalOpacity as number) < .99;
      material.opacity = (material.userData.originalOpacity as number) * opacity;
    }
  });
}

function getGroupOpacity(group: THREE.Object3D): number {
  let opacity = 1;
  let found = false;
  group.traverse((obj) => {
    if (found) return;
    if (!(obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.InstancedMesh)) return;
    const material = Array.isArray(obj.material) ? obj.material[0] : obj.material;
    if (!material) return;
    const original = (material.userData.originalOpacity as number | undefined) ?? material.opacity;
    if (original > 0) opacity = material.opacity / original;
    found = true;
  });
  return opacity;
}

export class Stage {
  readonly canvas: HTMLCanvasElement;
  readonly tier: 2 | 3;
  readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(37, 1, .1, 100);
  private readonly groups = new Map<SceneKey, THREE.Group>();
  private readonly bgUniforms = {
    uTime: { value: 0 }, uProgress: { value: 0 }, uVelocity: { value: 0 },
    uColorA: { value: new THREE.Color(BRAND.teal) },
    uColorB: { value: new THREE.Color(BRAND.violet) },
    uBase: { value: new THREE.Color(NIGHT) },
    uPointer: { value: new THREE.Vector2(.5, .5) },
  };
  private readonly ambient: THREE.Points;
  private readonly morph: ReturnType<typeof createMorphParticles>;
  private readonly products: ReturnType<typeof createProductField>;
  private readonly puzzle: ReturnType<typeof createPhilosophyPuzzle>;
  private readonly mission: ReturnType<typeof createMissionMountain>;
  private readonly vision: ReturnType<typeof createVisionBulb>;
  private readonly globe: ReturnType<typeof createGlobe>;
  private readonly worldGlobe: ReturnType<typeof createGlobe>;
  private readonly heroCapsule: THREE.Group;
  private readonly ctaDust: THREE.Points;
  private readonly pestle: THREE.Group;
  private readonly orbit: THREE.Group;
  private readonly background: THREE.Mesh;
  private current = '';
  private readonly activeTweens = new Set<gsap.core.Tween>();
  private lastTime = 0;
  private viewportActive = true;
  private destroyed = false;
  private contextLost = false;
  private readonly onResize = () => this.resize();
  private readonly onPointerMove = (event: PointerEvent) => {
    this.bgUniforms.uPointer.value.set(event.clientX / innerWidth, 1 - event.clientY / innerHeight);
  };
  private readonly onContextLost = (event: Event) => {
    event.preventDefault();
    this.contextLost = true;
    this.canvas.style.opacity = '0';
    document.getElementById('stage-poster')?.style.setProperty('opacity', '1');
    document.documentElement.dataset.stageTier = '1';
    document.dispatchEvent(new Event('mm:stage-lost'));
  };

  constructor(canvas: HTMLCanvasElement, tier: StageTier) {
    if (tier === 1) throw new Error('The static tier does not create WebGL');
    this.canvas = canvas;
    this.tier = tier;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: tier === 3, alpha: true, powerPreference: tier === 3 ? 'high-performance' : 'low-power' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, tier === 3 ? 1.75 : 1.25));
    this.renderer.setClearColor(NIGHT, 0);
    this.camera.position.set(0, 0, 5.5);
    this.camera.lookAt(0, 0, 0);
    this.scene.add(this.camera);
    this.scene.add(new THREE.HemisphereLight(0xe5ffff, 0x22203b, 2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.3);
    keyLight.position.set(-3, 5, 6);
    this.scene.add(keyLight);

    this.background = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
      uniforms: this.bgUniforms, vertexShader: backgroundVertex, fragmentShader: backgroundFragment,
      depthWrite: false, depthTest: false,
    }));
    this.background.position.z = -30;
    this.background.renderOrder = -100;
    this.background.frustumCulled = false;
    this.camera.add(this.background);

    this.globe = createGlobe(tier);
    this.pestle = createPestle(tier === 3);
    this.orbit = createOrbit();
    const logo = new THREE.Group();
    const bowl = createMortar(tier === 3);
    bowl.position.y = -.38;
    this.globe.group.position.y = .5;
    logo.add(bowl, this.globe.group, this.pestle, this.orbit);
    this.groups.set('logo', logo);

    const globeScene = new THREE.Group();
    this.worldGlobe = createGlobe(tier);
    this.worldGlobe.group.scale.setScalar(1.75);
    this.worldGlobe.group.position.y = -.05;
    this.worldGlobe.pins.visible = true;
    this.worldGlobe.setPinProgress(0);
    globeScene.add(this.worldGlobe.group);
    this.groups.set('globe', globeScene);

    const mortarScene = new THREE.Group();
    const mortar = createMortar(tier === 3);
    mortar.scale.setScalar(1.35);
    mortar.position.y = -.25;
    const mortarGlobe = createGlobe(tier).group;
    mortarGlobe.position.y = .95;
    mortarScene.add(mortar, mortarGlobe, createPestle(tier === 3));
    this.morph = createMorphParticles(tier === 3 ? 4000 : 1500);
    this.morph.points.position.set(0, -.28, 1.05);
    this.morph.points.scale.setScalar(1.25);
    mortarScene.add(this.morph.points);
    this.groups.set('mortar', mortarScene);

    this.puzzle = createPhilosophyPuzzle(tier === 3);
    this.groups.set('puzzle', this.puzzle.group);
    this.mission = createMissionMountain();
    this.groups.set('mission', this.mission.group);
    this.vision = createVisionBulb();
    this.groups.set('vision', this.vision.group);
    this.products = createProductField();
    this.groups.set('products', this.products.group);
    const capsule = new THREE.Group();
    this.heroCapsule = this.products.products.get('capsula')!.clone(true);
    this.heroCapsule.traverse((object) => {
      if (object instanceof THREE.Mesh) object.material = (object.material as THREE.Material).clone();
    });
    this.heroCapsule.scale.setScalar(1.6);
    capsule.add(this.heroCapsule);
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
    this.ctaDust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: BRAND.teal, size: .025, transparent: true, opacity: 0, depthWrite: false }));
    capsule.add(this.ctaDust);
    this.groups.set('capsule', capsule);

    this.groups.forEach((group) => { group.visible = false; this.scene.add(group); });
    const ambientGeo = new THREE.BufferGeometry();
    const positions = new Float32Array((tier === 3 ? 400 : 160) * 3);
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = (Math.random() - .5) * 10;
      positions[i + 1] = (Math.random() - .5) * 7;
      positions[i + 2] = (Math.random() - .5) * 6 - 1;
    }
    ambientGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.ambient = new THREE.Points(ambientGeo, new THREE.PointsMaterial({ color: BRAND.teal, size: .017, transparent: true, opacity: .24, depthWrite: false }));
    this.scene.add(this.ambient);

    this.resize();
    addEventListener('resize', this.onResize, { passive: true });
    addEventListener('pointermove', this.onPointerMove, { passive: true });
    canvas.addEventListener('webglcontextlost', this.onContextLost);
    canvas.style.opacity = '0';
    canvas.style.transition = 'opacity 450ms ease';
    this.render(0, 0);
    canvas.style.opacity = '1';
    document.getElementById('stage-poster')?.style.setProperty('opacity', '0');
  }

  goTo(chapter: string, immediate = false) {
    if (this.destroyed || this.contextLost) return;
    const preset = getPreset(chapter);
    if (this.current === chapter && !immediate) return;
    this.current = chapter;
    this.activeTweens.forEach((tween) => tween.kill());
    this.activeTweens.clear();
    const oldGroups = [...this.groups.entries()].filter(([, group]) => group.visible);
    const next = this.groups.get(preset.scene);
    const duration = immediate ? 0 : dur.chapter;
    if (next) {
      next.visible = true;
      const wasVisible = oldGroups.some(([, group]) => group === next);
      if (!wasVisible) setGroupOpacity(next, 0);
      const state = { opacity: wasVisible ? getGroupOpacity(next) : 0 };
      this.animate(state, { opacity: 1, duration, ease: ease.magistral, onUpdate: () => setGroupOpacity(next, state.opacity) });
    }
    oldGroups.forEach(([, group]) => {
      if (group === next) return;
      const state = { opacity: getGroupOpacity(group) };
      this.animate(state, { opacity: 0, duration, ease: ease.magistral,
        onUpdate: () => setGroupOpacity(group, state.opacity),
        onComplete: () => { group.visible = false; setGroupOpacity(group, 1); },
      });
    });
    this.animate(this.camera.position, { x: preset.cameraX ?? 0, z: preset.cameraZ, duration, ease: ease.magistral });
    const colorA = new THREE.Color(preset.a);
    const colorB = new THREE.Color(preset.b);
    const colorBase = new THREE.Color(preset.base);
    this.animate(this.bgUniforms.uColorA.value, { r: colorA.r, g: colorA.g, b: colorA.b, duration, ease: ease.magistral });
    this.animate(this.bgUniforms.uColorB.value, { r: colorB.r, g: colorB.g, b: colorB.b, duration, ease: ease.magistral });
    this.animate(this.bgUniforms.uBase.value, { r: colorBase.r, g: colorBase.g, b: colorBase.b, duration, ease: ease.magistral });
    this.animate(this.ambient.material, { opacity: preset.particles ?? 0, duration, ease: ease.magistral });
    this.globe.pins.visible = false;
    if (chapter === 'sedes') this.worldGlobe.setPinProgress(1);
    if (chapter === 'mundo') this.worldGlobe.setPinProgress(0);
  }

  setProgress(chapter: string, progress: number) {
    if (this.destroyed || this.contextLost) return;
    const p = THREE.MathUtils.clamp(progress, 0, 1);
    this.bgUniforms.uProgress.value = p;
    if (chapter === 'mundo' || chapter === 'sedes') {
      const globe = this.groups.get('globe');
      if (globe) globe.rotation.y = -.25 + p * .8;
      this.worldGlobe.setPinProgress(chapter === 'sedes' ? 1 : p);
    }
    if (chapter === 'mortero' || chapter === 'formula') {
      const mortar = this.groups.get('mortar');
      const globe = mortar?.children[1];
      if (globe) { globe.position.y = .95 - p * 1.25; globe.scale.setScalar(1 - p * .8); }
      if (mortar?.children[2]) mortar.children[2].rotation.z = -.53 + Math.sin(p * Math.PI * 4) * .2;
      this.morph.uniforms.uMorph.value = p;
      this.morph.uniforms.uAlpha.value = THREE.MathUtils.smoothstep(p, .28, .6);
    }
    if (chapter === 'filosofia') {
      this.puzzle.pieces.forEach((piece, index) => {
        const local = THREE.MathUtils.clamp(p * 4 - index, 0, 1);
        const rest = piece.userData.rest as THREE.Vector3;
        piece.position.set(rest.x + (1 - local) * (index % 2 ? 1.5 : -1.5), rest.y + (1 - local) * (index < 2 ? 1 : -1), rest.z);
        piece.rotation.z = (1 - local) * (index % 2 ? .5 : -.5);
      });
    }
    if (chapter === 'mision') this.mission.flag.position.y = .98 + (1 - p) * .6;
    if (chapter === 'vision' || chapter === 'medicos') {
      this.vision.light.intensity = .15 + p * 1.1;
      (this.vision.glass.material as THREE.MeshStandardMaterial).emissiveIntensity = .15 + p * .65;
    }
    if (chapter === 'cta') {
      const group = this.groups.get('capsule');
      if (group) group.rotation.z = p * Math.PI * .5;
      this.heroCapsule.children[0].position.y = .18 + p * .45;
      this.heroCapsule.children[1].position.y = .36 + p * .45;
      this.heroCapsule.children[2].position.y = -.18 - p * .45;
      this.heroCapsule.children[3].position.y = -.36 - p * .45;
      this.ctaDust.scale.setScalar(.3 + p * 2.5);
      (this.ctaDust.material as THREE.PointsMaterial).opacity = THREE.MathUtils.smoothstep(p, .23, .7) * .75;
    }
  }

  selectForm(kind: ProductKind) {
    const target = this.products.products.get(kind);
    if (!target) return;
    this.products.products.forEach((item) => {
      this.animate(item.scale, { x: item === target ? 1.4 : .48, y: item === target ? 1.4 : .48, z: item === target ? 1.4 : .48, duration: dur.ui, ease: ease.settle });
      this.animate(item.position, { z: item === target ? 1 : 0, duration: dur.ui, ease: ease.magistral });
    });
    const palette: Record<ProductKind, [number, number]> = {
      capsula: [BRAND.teal, BRAND.violet], crema: [BRAND.teal, 0xb4e4e6],
      ovulo: [0xdde8f0, BRAND.violet], gotero: [0x8c543c, BRAND.teal], jabon: [0xeab8df, BRAND.lilac],
    };
    const [a, b] = palette[kind];
    const colorA = new THREE.Color(a);
    const colorB = new THREE.Color(b);
    this.animate(this.bgUniforms.uColorA.value, { r: colorA.r, g: colorA.g, b: colorA.b, duration: dur.ui });
    this.animate(this.bgUniforms.uColorB.value, { r: colorB.r, g: colorB.g, b: colorB.b, duration: dur.ui });
  }

  private animate(target: object, vars: gsap.TweenVars) {
    const originalComplete = vars.onComplete;
    let tween: gsap.core.Tween | undefined;
    tween = gsap.to(target, {
      ...vars,
      onComplete: () => {
        if (typeof originalComplete === 'function') originalComplete();
        if (tween) this.activeTweens.delete(tween);
      },
    });
    this.activeTweens.add(tween);
    if (tween.progress() >= 1) this.activeTweens.delete(tween);
  }

  setViewportActive(active: boolean) { this.viewportActive = active; }

  render(time: number, velocity: number) {
    if (this.destroyed || this.contextLost || !this.viewportActive || document.hidden) return;
    if (document.body.dataset.page === 'cotizar' && document.activeElement?.closest('form')) return;
    if (['cotizar', 'faq', 'footer'].includes(this.current) && time - this.lastTime < .1) return;
    this.bgUniforms.uTime.value = time;
    this.bgUniforms.uVelocity.value += (velocity - this.bgUniforms.uVelocity.value) * .1;
    const dt = Math.min(Math.max(time - this.lastTime, 0), .05);
    this.lastTime = time;
    if (this.current === 'hero' || this.current === 'que-es' || this.current === '404') {
      this.globe.group.rotation.y += dt * .12;
      this.orbit.rotation.y += dt * .17;
    }
    this.ambient.rotation.y += dt * .008;
    this.products.group.rotation.y += dt * .07;
    this.resizeBackground();
    this.renderer.render(this.scene, this.camera);
  }

  private resizeBackground() {
    const distance = 30;
    const h = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * distance;
    this.background.scale.set(h * this.camera.aspect, h, 1);
  }

  private resize() {
    const width = Math.max(1, this.canvas.clientWidth || innerWidth);
    const height = Math.max(1, this.canvas.clientHeight || innerHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.resizeBackground();
  }

  dispose() {
    if (this.destroyed) return;
    this.destroyed = true;
    removeEventListener('resize', this.onResize);
    removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.activeTweens.forEach((tween) => tween.kill());
    this.activeTweens.clear();
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    this.scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.InstancedMesh)) return;
      geometries.add(obj.geometry);
      (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((material) => materials.add(material));
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    this.renderer.dispose();
  }
}
