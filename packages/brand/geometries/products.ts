import * as THREE from 'three';
import { BRAND } from './logo';

const pearl = () => new THREE.MeshStandardMaterial({ color: BRAND.pearl, metalness: .04, roughness: .3 });
const violet = () => new THREE.MeshStandardMaterial({ color: BRAND.violet, metalness: .12, roughness: .3 });
const teal = () => new THREE.MeshStandardMaterial({ color: BRAND.teal, metalness: .1, roughness: .3 });

export function createCapsule(): THREE.Group {
  const group = new THREE.Group();
  const upper = teal();
  const lower = violet();
  const topBody = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .36, 20), upper);
  topBody.position.y = .18;
  const topCap = new THREE.Mesh(new THREE.SphereGeometry(.3, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), upper);
  topCap.position.y = .36;
  const bottomBody = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .36, 20), lower);
  bottomBody.position.y = -.18;
  const bottomCap = new THREE.Mesh(new THREE.SphereGeometry(.3, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), lower);
  bottomCap.position.y = -.36;
  group.add(topBody, topCap, bottomBody, bottomCap);
  group.rotation.z = .58;
  return group;
}

export function createCreamJar(): THREE.Group {
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.CylinderGeometry(.42, .45, .57, 20), pearl()));
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(.46, .46, .16, 20), violet());
  lid.position.y = .36;
  group.add(lid);
  const label = new THREE.Mesh(new THREE.CylinderGeometry(.453, .453, .2, 20, 1, true), teal());
  label.position.y = -.04;
  group.add(label);
  return group;
}

export function createOvule(): THREE.Group {
  const profile = [
    [0, -.52], [.17, -.48], [.29, -.34], [.36, -.06], [.32, .2], [.22, .4], [0, .56],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 24), pearl()));
  return group;
}

export function createDropper(): THREE.Group {
  const group = new THREE.Group();
  const amber = new THREE.MeshStandardMaterial({ color: 0x8c543c, transparent: true, opacity: .87, metalness: .05, roughness: .2 });
  const bottle = new THREE.Mesh(new THREE.CylinderGeometry(.29, .32, .76, 18), amber);
  bottle.position.y = -.16;
  group.add(bottle);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .16, 16), pearl());
  neck.position.y = .31;
  group.add(neck);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.21, .17, .32, 16), violet());
  cap.position.y = .54;
  group.add(cap);
  return group;
}

export function createSoap(): THREE.Group {
  const group = new THREE.Group();
  const bottle = new THREE.Mesh(
    new THREE.CapsuleGeometry(.32, .49, 5, 12),
    new THREE.MeshStandardMaterial({ color: 0xeab8df, roughness: .3 }),
  );
  group.add(bottle);
  const pump = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .26, 12), pearl());
  pump.position.y = .68;
  group.add(pump);
  const spout = new THREE.Mesh(new THREE.CapsuleGeometry(.055, .25, 3, 8), pearl());
  spout.rotation.z = Math.PI / 2;
  spout.position.set(.16, .83, 0);
  group.add(spout);
  return group;
}

export type ProductKind = 'capsula' | 'crema' | 'ovulo' | 'gotero' | 'jabon';

export function createProductField(): { group: THREE.Group; products: Map<ProductKind, THREE.Group> } {
  const group = new THREE.Group();
  const products = new Map<ProductKind, THREE.Group>([
    ['capsula', createCapsule()],
    ['crema', createCreamJar()],
    ['ovulo', createOvule()],
    ['gotero', createDropper()],
    ['jabon', createSoap()],
  ]);
  [...products.values()].forEach((item, index) => {
    const angle = index * Math.PI * 2 / products.size - Math.PI / 2;
    item.position.set(Math.cos(angle) * 1.48, Math.sin(angle) * .8, (index % 2) * .28);
    item.scale.setScalar(.76);
    group.add(item);
  });
  return { group, products };
}
