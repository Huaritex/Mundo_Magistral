import * as THREE from 'three';
import { BRAND } from './logo';

/** Four interlocking blocks echo the verified philosophy puzzle pictogram. */
export function createPhilosophyPuzzle(physical = false): { group: THREE.Group; pieces: THREE.Group[] } {
  const group = new THREE.Group();
  const pieces: THREE.Group[] = [];
  const positions: [number, number, number][] = [[-.47, .47, 0], [.47, .47, 0], [-.47, -.47, 0], [.47, -.47, 0]];
  const colors = [BRAND.violet, BRAND.lilac, BRAND.teal, 0x79ced0];
  for (let i = 0; i < 4; i++) {
    const material = physical
      ? new THREE.MeshPhysicalMaterial({ color: colors[i], metalness: .1, roughness: .25, clearcoat: .55 })
      : new THREE.MeshStandardMaterial({ color: colors[i], metalness: .08, roughness: .35 });
    const piece = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(.84, .84, .16), material);
    piece.add(body);
    const tab = new THREE.Mesh(new THREE.SphereGeometry(.16, 12, 10), material);
    tab.position.set(i % 2 ? -.4 : .4, 0, 0);
    piece.add(tab);
    piece.userData.rest = new THREE.Vector3(...positions[i]);
    piece.position.copy(piece.userData.rest);
    pieces.push(piece);
    group.add(piece);
  }
  return { group, pieces };
}

/** Silhouette follows the verified mountain + flag icon, kept as simple geometry. */
export function createMissionMountain(): { group: THREE.Group; flag: THREE.Group } {
  const group = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-1.2, -.72);
  shape.lineTo(-.43, .33);
  shape.lineTo(-.13, -.04);
  shape.lineTo(.34, .72);
  shape.lineTo(1.19, -.72);
  shape.closePath();
  const mountain = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: .13, bevelEnabled: true, bevelSize: .055, bevelThickness: .05, bevelSegments: 2 }), new THREE.MeshStandardMaterial({ color: BRAND.violet, roughness: .36 }));
  group.add(mountain);
  const flag = new THREE.Group();
  flag.add(new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .72, 7), new THREE.MeshStandardMaterial({ color: BRAND.pearl })));
  const clothShape = new THREE.Shape();
  clothShape.moveTo(0, .28); clothShape.lineTo(.47, .18); clothShape.lineTo(0, .04); clothShape.closePath();
  const cloth = new THREE.Mesh(new THREE.ExtrudeGeometry(clothShape, { depth: .025, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: BRAND.teal, side: THREE.DoubleSide }));
  flag.add(cloth);
  flag.position.set(.34, .98, .04);
  group.add(flag);
  return { group, flag };
}

/** The verified vision pictogram is a light bulb. */
export function createVisionBulb(): { group: THREE.Group; light: THREE.PointLight; glass: THREE.Mesh } {
  const group = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.SphereGeometry(.54, 24, 16), new THREE.MeshStandardMaterial({ color: 0x9fdae0, emissive: BRAND.teal, emissiveIntensity: .15, transparent: true, opacity: .84, roughness: .24 }));
  glass.position.y = .24;
  group.add(glass);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.29, .23, .29, 16), new THREE.MeshStandardMaterial({ color: BRAND.lilac, metalness: .3, roughness: .3 }));
  neck.position.y = -.37;
  group.add(neck);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(.21, .18, .29, 16), new THREE.MeshStandardMaterial({ color: BRAND.violet, metalness: .3, roughness: .35 }));
  base.position.y = -.65;
  group.add(base);
  const filament = new THREE.Mesh(new THREE.TorusGeometry(.16, .025, 6, 20), new THREE.MeshBasicMaterial({ color: 0xe5fafa }));
  filament.position.y = .22;
  group.add(filament);
  const light = new THREE.PointLight(BRAND.teal, 0, 3);
  light.position.y = .22;
  group.add(light);
  return { group, light, glass };
}
