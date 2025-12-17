import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';
import { useStore } from '../store';

// Custom Shader for the Foliage
// Handles the morphing logic on the GPU for high performance with thousands of particles
const FoliageShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uProgress: { value: 0 }, // 0 = scatter, 1 = tree
    uColorHigh: { value: new THREE.Color('#d4af37') }, // Gold
    uColorLow: { value: new THREE.Color('#064e3b') }, // Emerald Green
  },
  vertexShader: `
    uniform float uTime;
    uniform float uProgress;
    
    attribute vec3 aScatterPos;
    attribute vec3 aTreePos;
    attribute float aRandom;
    
    varying vec2 vUv;
    varying float vRandom;
    varying float vProgress;

    // Cubic easing for smoother transition
    float easeInOutCubic(float x) {
      return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
    }

    void main() {
      vUv = uv;
      vRandom = aRandom;
      vProgress = uProgress;

      float easedProgress = easeInOutCubic(uProgress);

      // Morph position
      vec3 finalPos = mix(aScatterPos, aTreePos, easedProgress);

      // Add "Breathing" / Wind effect
      float breath = sin(uTime * 2.0 + aRandom * 10.0) * 0.05;
      
      // More turbulence in scattered state
      float turbulence = sin(uTime + aScatterPos.x) * 0.1 * (1.0 - easedProgress);
      
      finalPos.y += breath + turbulence;
      finalPos.x += cos(uTime * 1.5 + aRandom) * 0.02;

      vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
      
      // Size attenuation: larger when closer to camera
      // Also pulse size slightly for glitter effect
      float sizePulse = 1.0 + sin(uTime * 5.0 + aRandom * 100.0) * 0.3;
      gl_PointSize = (40.0 * sizePulse) * (1.0 / -mvPosition.z);
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uColorHigh;
    uniform vec3 uColorLow;
    varying float vRandom;
    varying float vProgress;

    void main() {
      // Create a soft circular particle
      vec2 center = gl_PointCoord - 0.5;
      float dist = length(center);
      if (dist > 0.5) discard;

      // Gradient from center (gold) to edge (green)
      // Transition color based on state: brighter when forming the tree
      vec3 baseColor = mix(uColorLow, uColorHigh, 1.0 - dist * 2.0);
      
      // Add a sparkly core
      float sparkle = smoothstep(0.1, 0.0, dist);
      vec3 finalColor = mix(baseColor, vec3(1.0, 1.0, 0.8), sparkle * 0.5);

      // Alpha fade out at edges
      float alpha = 1.0 - smoothstep(0.4, 0.5, dist);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `
};

export const Foliage: React.FC = () => {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const treeState = useStore((state) => state.treeState);
  
  // Animation state for the uniform
  const progressRef = useRef(0);

  const count = 15000; // Number of needles

  const { positions, scatterPos, treePos, randoms } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const scatterPos = new Float32Array(count * 3);
    const treePos = new Float32Array(count * 3);
    const randoms = new Float32Array(count);

    const treeHeight = 14;
    const treeRadiusBase = 5;

    for (let i = 0; i < count; i++) {
      // 1. SCATTER POSITION (Random Sphere)
      const rScatter = 15 * Math.cbrt(Math.random());
      const thetaScatter = Math.random() * 2 * Math.PI;
      const phiScatter = Math.acos(2 * Math.random() - 1);
      
      const sx = rScatter * Math.sin(phiScatter) * Math.cos(thetaScatter);
      const sy = rScatter * Math.sin(phiScatter) * Math.sin(thetaScatter);
      const sz = rScatter * Math.cos(phiScatter);

      scatterPos[i * 3] = sx;
      scatterPos[i * 3 + 1] = sy;
      scatterPos[i * 3 + 2] = sz;

      // 2. TREE POSITION (Cone Spiral)
      // Normalized height (0 to 1)
      const hNorm = Math.random(); 
      // Bias slightly towards bottom for fuller tree
      const h = (hNorm * treeHeight) - (treeHeight / 2); 
      
      // Radius decreases as height increases
      const currentRadius = (1 - hNorm) * treeRadiusBase;
      const angle = i * 137.5 * (Math.PI / 180); // Golden angle for natural distribution
      
      // Add some randomness to thickness of branch layer
      const rOffset = (Math.random() - 0.5) * 0.5;
      
      const tx = Math.cos(angle) * (currentRadius + rOffset);
      const tz = Math.sin(angle) * (currentRadius + rOffset);
      const ty = h;

      treePos[i * 3] = tx;
      treePos[i * 3 + 1] = ty;
      treePos[i * 3 + 2] = tz;

      // Initial position (doesn't matter much as shader overrides)
      positions[i * 3] = sx;
      positions[i * 3 + 1] = sy;
      positions[i * 3 + 2] = sz;

      randoms[i] = Math.random();
    }

    return { positions, scatterPos, treePos, randoms };
  }, []);

  useFrame((state, delta) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      
      // Target progress based on state
      const target = treeState === TreeState.TREE_SHAPE ? 1 : 0;
      // Smooth interpolation for the uniform
      progressRef.current = THREE.MathUtils.lerp(progressRef.current, target, delta * 1.5);
      
      shaderRef.current.uniforms.uProgress.value = progressRef.current;
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScatterPos"
          count={scatterPos.length / 3}
          array={scatterPos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTreePos"
          count={treePos.length / 3}
          array={treePos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        attach="material"
        args={[FoliageShaderMaterial]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};