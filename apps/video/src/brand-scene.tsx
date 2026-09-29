import { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { createGlobe, createMortar, createOrbit, createPestle } from '@mm/brand/geometries/logo';

function LogoObjects() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const model = useMemo(() => {
    const group = new THREE.Group();
    const mortar = createMortar();
    const pestle = createPestle();
    const globe = createGlobe(2).group;
    const orbit = createOrbit();
    mortar.position.y = -.2;
    globe.position.y = .1;
    orbit.position.y = .1;
    group.add(mortar, pestle, globe, orbit);
    return { group, globe, orbit };
  }, []);
  const phase = frame / durationInFrames * Math.PI * 2;
  model.group.rotation.y = Math.sin(phase) * .28;
  model.group.rotation.z = Math.sin(phase) * .035;
  model.globe.rotation.y = phase;
  model.orbit.rotation.y = Math.sin(phase) * .4;
  model.group.position.y = Math.sin(phase) * .12;
  return <primitive object={model.group} />;
}

export function BrandScene({ size = 840 }: { size?: number }) {
  return (
    <ThreeCanvas
      width={size}
      height={size}
      camera={{ position: [0, .1, 5.3], fov: 35 }}
      gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
      style={{ width: size, height: size }}
    >
      <ambientLight intensity={1.2} />
      <hemisphereLight color={0xcdfbfb} groundColor={0x1b1638} intensity={1.6} />
      <directionalLight color={0xffffff} intensity={2.4} position={[3, 4, 5]} />
      <LogoObjects />
    </ThreeCanvas>
  );
}
