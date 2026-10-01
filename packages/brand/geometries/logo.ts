import * as THREE from 'three';

export const BRAND = {
  teal: 0x00a8ac,
  violet: 0x6f4897,
  lilac: 0xa98bd0,
  pearl: 0xf4f7fb,
  night: 0x22163a,
  /** Base del sitio (blanco principal): fondo del shader y del Stage en los capítulos claros. */
  white: 0xffffff,
} as const;

export function createMortar(physical = false): THREE.Group {
  const group = new THREE.Group();
  const profile = [
    [0, -1.17], [.52, -1.17], [.75, -.98], [.88, -.7], [.95, -.24],
    [1.01, .12], [1.11, .31], [1.09, .42], [.92, .42], [.89, .22],
    [.82, -.38], [.69, -.83], [.45, -.96], [0, -.96],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const geometry = new THREE.LatheGeometry(profile, 48);
  const material = physical
    ? new THREE.MeshPhysicalMaterial({ color: BRAND.violet, metalness: .18, roughness: .24, clearcoat: .65 })
    : new THREE.MeshStandardMaterial({ color: BRAND.violet, metalness: .12, roughness: .37 });
  const bowl = new THREE.Mesh(geometry, material);
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  group.add(bowl);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.01, .065, 10, 56), material);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = .34;
  group.add(rim);
  return group;
}

export function createPestle(physical = false): THREE.Group {
  const group = new THREE.Group();
  const material = physical
    ? new THREE.MeshPhysicalMaterial({ color: BRAND.lilac, metalness: .16, roughness: .22, clearcoat: .7 })
    : new THREE.MeshStandardMaterial({ color: BRAND.lilac, metalness: .12, roughness: .35 });
  const shaft = new THREE.Mesh(new THREE.CapsuleGeometry(.15, 1.45, 6, 14), material);
  shaft.castShadow = true;
  group.add(shaft);
  const foot = new THREE.Mesh(new THREE.SphereGeometry(.24, 16, 12), material);
  foot.position.y = -.76;
  group.add(foot);
  group.rotation.z = -.53;
  group.position.set(.67, 1.08, -.34);
  return group;
}

export function createOrbit(): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: BRAND.violet, emissive: BRAND.violet, emissiveIntensity: .15, metalness: .3, roughness: .25 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.36, .055, 10, 96), material);
  ring.rotation.set(.35, -.25, -.36);
  group.add(ring);
  const highlight = new THREE.Mesh(new THREE.TorusGeometry(1.43, .011, 6, 96), new THREE.MeshBasicMaterial({ color: BRAND.teal, transparent: true, opacity: .5 }));
  highlight.rotation.copy(ring.rotation);
  group.add(highlight);
  return group;
}

/** Decorative city centres. Exact branch coordinates are not yet verified. */
export const CITY_MARKERS = [
  { city: 'Santa Cruz Norte', lat: -17.77, lng: -63.18 },
  { city: 'Santa Cruz Sur', lat: -17.81, lng: -63.18 },
  { city: 'La Paz', lat: -16.5, lng: -68.12 },
  { city: 'Sucre', lat: -19.04, lng: -65.26 },
  { city: 'Trinidad', lat: -14.83, lng: -64.9 },
  { city: 'Oruro', lat: -17.97, lng: -67.11 },
  { city: 'Cochabamba', lat: -17.39, lng: -66.16 },
  { city: 'Tarija', lat: -21.53, lng: -64.73 },
] as const;

function latLngPosition(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lng + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

const _tmp = new THREE.Color();
/** Mezcla `dark`→`light` (hex sRGB) con k 0..1 en `out`. Sin estado entre llamadas salvo el temporal. */
const lerpHex = (dark: number, light: number, k: number, out: THREE.Color) => out.set(dark).lerp(_tmp.set(light), k);

export type Globe = {
  group: THREE.Group;
  pins: THREE.Group;
  setPinProgress: (progress: number) => void;
  /** 0 = capítulo oscuro (agua teal profundo, puntos turquesa/lila); 1 = capítulo claro (esfera perla lila, puntos turquesa profundo/violeta). Idempotente. */
  setLight: (light: number) => void;
};

export function createGlobe(tier: 2 | 3): Globe {
  const group = new THREE.Group();
  const radius = .73;
  const waterMaterial = new THREE.MeshStandardMaterial({ color: 0x083940, emissive: 0x06343b, emissiveIntensity: .6, metalness: .33, roughness: .42 });
  const water = new THREE.Mesh(new THREE.SphereGeometry(radius, tier === 3 ? 48 : 28, tier === 3 ? 32 : 18), waterMaterial);
  group.add(water);
  const gridMaterial = new THREE.MeshBasicMaterial({ color: BRAND.teal, wireframe: true, transparent: true, opacity: .1 });
  const grid = new THREE.Mesh(new THREE.SphereGeometry(radius + .005, 22, 14), gridMaterial);
  group.add(grid);

  // Sparse point-cloud land silhouettes: procedural and deterministic, so no texture download.
  // The continents are suggestive; the HTML branch list carries the exact information.
  const lands = [
    [-102, 39, 29, 18], [-82, 13, 9, 12], [-61, -17, 16, 31],
    [15, 48, 30, 14], [22, 3, 21, 34], [84, 43, 50, 22],
    [114, 13, 16, 21], [135, -25, 24, 15], [-42, 73, 17, 10],
  ];
  // Dos familias de puntos (turquesa y violeta/lila) repartidas con un hash fijo: la tierra se ve bicolor, como el logo.
  const pointsA: number[] = [];
  const pointsB: number[] = [];
  for (let lat = -80; lat <= 80; lat += tier === 3 ? 2.6 : 3.7) {
    for (let lng = -180; lng < 180; lng += tier === 3 ? 2.8 : 4) {
      const land = lands.some(([cx, cy, rx, ry]) => {
        const dx = (lng - cx) / rx;
        const dy = (lat - cy) / ry;
        const wobble = .12 * Math.sin(lng * .35 + lat * .19) + .1 * Math.cos(lat * .47);
        return dx * dx + dy * dy < 1 + wobble;
      });
      if (land) {
        const p = latLngPosition(lat, lng, radius + .018);
        const h = Math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453;
        (h - Math.floor(h) < .45 ? pointsB : pointsA).push(p.x, p.y, p.z);
      }
    }
  }
  const landSize = tier === 3 ? .025 : .032;
  const landA = new THREE.PointsMaterial({ color: BRAND.teal, size: landSize, sizeAttenuation: true });
  const landB = new THREE.PointsMaterial({ color: BRAND.lilac, size: landSize, sizeAttenuation: true });
  for (const [positions, material] of [[pointsA, landA], [pointsB, landB]] as const) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    group.add(new THREE.Points(geo, material));
  }

  const pins = new THREE.Group();
  const pinGeo = new THREE.SphereGeometry(.03, 10, 8);
  const pinMat = new THREE.MeshBasicMaterial({ color: 0x9ce7e8 });
  const markers = new THREE.InstancedMesh(pinGeo, pinMat, CITY_MARKERS.length);
  const dummy = new THREE.Object3D();
  const matrices: THREE.Matrix4[] = [];
  CITY_MARKERS.forEach(({ lat, lng }, i) => {
    dummy.position.copy(latLngPosition(lat, lng, radius + .055));
    dummy.updateMatrix();
    matrices.push(dummy.matrix.clone());
    markers.setMatrixAt(i, dummy.matrix);
  });
  markers.instanceMatrix.needsUpdate = true;
  pins.add(markers);
  pins.visible = false;
  group.add(pins);
  const setPinProgress = (progress: number) => {
    const p = THREE.MathUtils.clamp(progress, 0, 1);
    matrices.forEach((matrix, index) => {
      const scale = THREE.MathUtils.smoothstep(p * CITY_MARKERS.length - index, 0, 1);
      markers.setMatrixAt(index, matrix.clone().scale(new THREE.Vector3(scale, scale, scale)));
    });
    markers.instanceMatrix.needsUpdate = true;
  };

  let applied = -1;
  const setLight = (light: number) => {
    const k = THREE.MathUtils.clamp(light, 0, 1);
    if (Math.abs(k - applied) < .002) return;
    applied = k;
    lerpHex(0x083940, 0xe3daf2, k, waterMaterial.color);
    lerpHex(0x06343b, 0x6f4897, k, waterMaterial.emissive);
    waterMaterial.emissiveIntensity = THREE.MathUtils.lerp(.6, .08, k);
    waterMaterial.metalness = THREE.MathUtils.lerp(.33, .06, k);
    waterMaterial.roughness = THREE.MathUtils.lerp(.42, .36, k);
    lerpHex(BRAND.teal, 0x00868a, k, landA.color);
    lerpHex(BRAND.lilac, BRAND.violet, k, landB.color);
    lerpHex(BRAND.teal, BRAND.violet, k, gridMaterial.color);
    gridMaterial.opacity = THREE.MathUtils.lerp(.1, .2, k);
    lerpHex(0x9ce7e8, 0x007c80, k, pinMat.color);
  };
  return { group, pins, setPinProgress, setLight };
}
