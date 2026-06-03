"use client";

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function ParticleSwarm(props: any) {
  const ref = useRef<THREE.Points>(null!);

  // Create a sphere of random points
  const sphere = useMemo(() => {
    // Generate 500 points for stable 60fps across all devices
    const count = 500;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = Math.cbrt(Math.random()) * 1.5; // Random radius up to 1.5

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);     // x
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta); // y
      positions[i * 3 + 2] = r * Math.cos(phi);                   // z
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;

    // Smoothly rotate the whole swarm
    ref.current.rotation.x -= delta / 10;
    ref.current.rotation.y -= delta / 15;

    // Parallax effect based on mouse pointer
    const pointerX = state.pointer.x;
    const pointerY = state.pointer.y;

    // Move the swarm slightly based on cursor
    ref.current.position.x += (pointerX * 0.2 - ref.current.position.x) * 0.05;
    ref.current.position.y += (pointerY * 0.2 - ref.current.position.y) * 0.05;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#3b82f6" // Electric blue
          size={0.008}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-auto">
      {/* 
        Performance Optimization:
        - dpr={[1, 1.5]} caps pixel ratio on Retina/4K displays preventing massive fill-rate drops.
        - performance={{ min: 0.5 }} allows three.js to adapt rendering if frame drops occur.
      */}
      <Canvas camera={{ position: [0, 0, 1.2] }} dpr={[1, 1.5]} performance={{ min: 0.5 }}>
        <ParticleSwarm />
      </Canvas>
    </div>
  );
}
