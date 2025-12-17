import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Environment, OrbitControls, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

import { Foliage } from './Foliage';
import { OrnamentsGroup } from './Ornaments';
import { useStore } from '../store';
import { TreeState } from '../types';

const Rig = () => {
  const { camera } = useThree();
  const treeState = useStore(state => state.treeState);
  
  // Smooth camera movement based on mouse is handled by OrbitControls mostly,
  // but we can add slight drift or zoom based on state.
  useFrame((state, delta) => {
    const targetZ = treeState === TreeState.TREE_SHAPE ? 25 : 35;
    const targetY = treeState === TreeState.TREE_SHAPE ? 0 : 5;
    
    // Very subtle auto-drift
    if (treeState === TreeState.TREE_SHAPE) {
       camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, delta * 0.5);
    }
  });
  
  return null;
};

export const Experience: React.FC = () => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 30]} fov={45} />
      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 2.5} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={10}
        maxDistance={50}
        autoRotate
        autoRotateSpeed={0.5}
      />

      <Rig />

      {/* Lighting Setup for "Luxury" feel */}
      <ambientLight intensity={0.2} color="#064e3b" />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.5} 
        penumbra={1} 
        intensity={2} 
        color="#fbbf24" 
        castShadow 
        shadow-bias={-0.0001}
      />
      <spotLight 
        position={[-10, 20, -10]} 
        angle={0.5} 
        penumbra={1} 
        intensity={2} 
        color="#fff" 
        castShadow 
      />
      {/* Rim light for cinematic effect */}
      <pointLight position={[0, -10, -10]} intensity={1} color="#10b981" />

      {/* Environment for reflections (Gold needs things to reflect) */}
      <Environment preset="city" />

      <group position={[0, -4, 0]}>
        <Foliage />
        <OrnamentsGroup />
      </group>

      <ContactShadows opacity={0.5} scale={30} blur={2} far={10} resolution={256} color="#000000" />

      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={1.2} // Only very bright things glow (lights, reflections)
          mipmapBlur 
          intensity={1.5} 
          radius={0.6}
        />
        <Vignette offset={0.3} darkness={0.6} eskil={false} blendFunction={BlendFunction.NORMAL} />
        <Noise opacity={0.02} />
      </EffectComposer>
    </>
  );
};