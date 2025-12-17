import React, { useLayoutEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState, DualPosition } from '../types';
import { useStore } from '../store';

// Reusable hook for managing dual-state instanced meshes
const useDualStateInstances = (count: number, type: 'box' | 'sphere') => {
  const treeHeight = 12;
  const treeRadiusBase = 4.5;
  
  return useMemo(() => {
    const data: DualPosition[] = [];
    for (let i = 0; i < count; i++) {
      // Tree Shape Calculation
      const hNorm = Math.random();
      const h = (hNorm * treeHeight) - (treeHeight / 2);
      const currentRadius = ((1 - hNorm) * treeRadiusBase) + 0.2; // Slightly outside foliage
      const angle = Math.random() * Math.PI * 2;
      
      const tx = Math.cos(angle) * currentRadius;
      const tz = Math.sin(angle) * currentRadius;
      const ty = h;

      // Scatter Shape Calculation
      const rScatter = 10 + Math.random() * 10;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const sx = rScatter * Math.sin(phi) * Math.cos(theta);
      const sy = rScatter * Math.sin(phi) * Math.sin(theta);
      const sz = rScatter * Math.cos(phi);

      const scale = type === 'box' ? 0.3 + Math.random() * 0.4 : 0.2 + Math.random() * 0.3;

      data.push({
        tree: [tx, ty, tz],
        scatter: [sx, sy, sz],
        scale: scale,
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0]
      });
    }
    return data;
  }, [count, type]);
};

interface InstancedOrnamentsProps {
  type: 'box' | 'sphere';
  count: number;
  color: string;
  metalness: number;
  roughness: number;
  emissive?: string;
  emissiveIntensity?: number;
}

const InstancedOrnaments: React.FC<InstancedOrnamentsProps> = ({ 
  type, count, color, metalness, roughness, emissive = "#000000", emissiveIntensity = 0 
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const data = useDualStateInstances(count, type);
  const treeState = useStore((state) => state.treeState);
  
  // To track interpolation per frame
  const progressRef = useRef(0);
  const tempObj = useMemo(() => new THREE.Object3D(), []);

  // Initial layout
  useLayoutEffect(() => {
    if (!meshRef.current) return;
    
    data.forEach((d, i) => {
      tempObj.position.set(...d.scatter);
      tempObj.rotation.set(...d.rotation);
      tempObj.scale.set(d.scale, d.scale, d.scale);
      tempObj.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObj.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [data, tempObj]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const target = treeState === TreeState.TREE_SHAPE ? 1 : 0;
    // Slower interpolation for heavy ornaments ("weight" feeling)
    const lerpSpeed = type === 'box' ? 1.0 : 1.5; 
    
    // Check if we need to update (simple optimization)
    if (Math.abs(progressRef.current - target) < 0.001) {
        progressRef.current = target;
        // Optional: return here to stop updating matrix when static, 
        // but we want rotation animation so we continue.
    } else {
        progressRef.current = THREE.MathUtils.lerp(progressRef.current, target, delta * lerpSpeed);
    }
    
    const p = progressRef.current;
    
    // Cubic easing
    const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

    data.forEach((d, i) => {
      // Position Interpolation
      const cx = THREE.MathUtils.lerp(d.scatter[0], d.tree[0], eased);
      const cy = THREE.MathUtils.lerp(d.scatter[1], d.tree[1], eased);
      const cz = THREE.MathUtils.lerp(d.scatter[2], d.tree[2], eased);

      // Add a slow rotation when in tree state for liveliness
      const time = state.clock.elapsedTime;
      const rotX = d.rotation[0] + time * 0.1;
      const rotY = d.rotation[1] + time * 0.2;

      tempObj.position.set(cx, cy, cz);
      
      // Interpolate scale (maybe pop out a bit in tree mode)
      const scaleMult = 1.0 + (eased * 0.1 * Math.sin(time + i));
      tempObj.scale.set(d.scale * scaleMult, d.scale * scaleMult, d.scale * scaleMult);
      
      tempObj.rotation.set(rotX, rotY, d.rotation[2]);
      
      tempObj.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObj.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      {type === 'box' ? <boxGeometry /> : <sphereGeometry args={[1, 16, 16]} />}
      <meshStandardMaterial 
        color={color} 
        metalness={metalness} 
        roughness={roughness}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        envMapIntensity={2}
      />
    </instancedMesh>
  );
};

export const OrnamentsGroup: React.FC = () => {
  return (
    <group>
      {/* Heavy Gold Gift Boxes */}
      <InstancedOrnaments 
        type="box" 
        count={60} 
        color="#FCD34D" // Gold
        metalness={0.9} 
        roughness={0.1} 
      />
      {/* Red Velvet Boxes */}
      <InstancedOrnaments 
        type="box" 
        count={40} 
        color="#7f1d1d" // Deep Red
        metalness={0.3} 
        roughness={0.8} 
      />
      {/* Shiny Emerald Baubles */}
      <InstancedOrnaments 
        type="sphere" 
        count={150} 
        color="#065f46" 
        metalness={1.0} 
        roughness={0.0} 
      />
      {/* Glowing Lights */}
      <InstancedOrnaments 
        type="sphere" 
        count={300} 
        color="#FFFBEB"
        metalness={0} 
        roughness={1}
        emissive="#FCD34D"
        emissiveIntensity={4}
      />
    </group>
  );
};