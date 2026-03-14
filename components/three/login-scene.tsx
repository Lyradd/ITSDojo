'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// --- Shape Definitions ---
interface ShapeProps {
  initialPosition: [number, number, number];
  geometry: 'book' | 'pencil' | 'eraser' | 'ruler';
  color: string;
  scale?: number;
  speed?: number;
}

// Brand Colors
const COLORS = {
  indigo: '#4f46e5',
  purple: '#a855f7',
  blue: '#2563eb',
  sky: '#0ea5e9',
  pink: '#ec4899',
  teal: '#14b8a6',
  amber: '#f59e0b',
};

const SHAPES_CFG: ShapeProps[] = [
  { initialPosition: [-5.5, 3, -4],   geometry: 'book',    color: COLORS.indigo, scale: 1.4, speed: 2.0 },
  { initialPosition: [5.2, -2, -5],   geometry: 'pencil',  color: COLORS.purple, scale: 1.2, speed: 2.2 },
  { initialPosition: [3, 3.5, -6],    geometry: 'eraser',  color: COLORS.blue,   scale: 1.2, speed: 2.5 },
  { initialPosition: [-4, -3, -5],    geometry: 'ruler',   color: COLORS.sky,    scale: 1.1, speed: 1.8 },
  { initialPosition: [0, -4, -7],     geometry: 'book',    color: COLORS.blue,   scale: 1.6, speed: 1.5 },
  { initialPosition: [-2.5, 5, -8],   geometry: 'pencil',  color: COLORS.purple, scale: 1.2, speed: 2.8 },
  { initialPosition: [7, 1, -9],      geometry: 'eraser',  color: COLORS.indigo, scale: 1.3, speed: 1.9 },
  { initialPosition: [1.5, -5, -4],   geometry: 'ruler',   color: COLORS.blue,   scale: 1.0, speed: 2.6 },
];

function EducationalShape({ type, color }: { type: string, color: string }) {
  const sharedMaterial = (
    <meshPhysicalMaterial
      color={color}
      transparent
      opacity={0.85}
      roughness={0.1}
      metalness={0.3}
      clearcoat={1.0}
      clearcoatRoughness={0.1}
    />
  );

  switch (type) {
    case 'book':
      return (
        <group>
          {/* Bottom Book (Green) */}
          <group position={[0, -0.4, 0]}>
            <mesh>
              <boxGeometry args={[1.5, 0.4, 1.9]} />
              <meshStandardMaterial color="#65a30d" roughness={0.4} />
            </mesh>
            <mesh position={[0.05, 0, 0]}>
              <boxGeometry args={[1.4, 0.35, 1.8]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
          </group>
          {/* Middle Book (Orange) */}
          <group position={[-0.1, 0.0, 0.05]} rotation={[0, 0.2, 0]}>
            <mesh>
              <boxGeometry args={[1.4, 0.4, 1.8]} />
              <meshStandardMaterial color="#ea580c" roughness={0.4} />
            </mesh>
            <mesh position={[0.05, 0, 0]}>
              <boxGeometry args={[1.3, 0.35, 1.7]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
          </group>
          {/* Top Book (Magenta) */}
          <group position={[0.05, 0.4, -0.05]} rotation={[0, -0.15, 0]}>
            <mesh>
              <boxGeometry args={[1.3, 0.4, 1.7]} />
              <meshStandardMaterial color="#9f1239" roughness={0.4} />
            </mesh>
            <mesh position={[0.05, 0, 0]}>
              <boxGeometry args={[1.2, 0.35, 1.6]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
          </group>
        </group>
      );
    case 'pencil':
      return (
        <group>
          {/* Body */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 2, 6]} />
            {sharedMaterial}
          </mesh>
          {/* Wood Tip */}
          <mesh position={[0, 1.3, 0]}>
            <coneGeometry args={[0.2, 0.6, 6]} />
            <meshStandardMaterial color="#fcd34d" /> {/* Wood color */}
          </mesh>
          {/* Graphite */}
          <mesh position={[0, 1.6, 0]}>
            <coneGeometry args={[0.06, 0.2, 6]} />
            <meshStandardMaterial color="#334155" /> {/* Graphite color */}
          </mesh>
          {/* Eraser */}
          <mesh position={[0, -1.15, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.3, 16]} />
            <meshStandardMaterial color="#f472b6" /> {/* Pink eraser */}
          </mesh>
        </group>
      );
    case 'eraser':
      return (
        <group>
          {/* Pink half */}
          <mesh position={[0, 0, -0.5]}>
            <boxGeometry args={[1.2, 0.6, 1]} />
            <meshStandardMaterial color="#f472b6" roughness={0.8} />
          </mesh>
          {/* Blue half */}
          <mesh position={[0, 0, 0.5]}>
            <boxGeometry args={[1.2, 0.6, 1]} />
            <meshStandardMaterial color="#3b82f6" roughness={0.8} />
          </mesh>
          {/* White sleeve/wrapper */}
          <mesh position={[0, 0, 0]}>
             <boxGeometry args={[1.25, 0.62, 0.8]} />
             <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
        </group>
      );
    case 'ruler':
      return (
        <group>
          {/* Yellow Body */}
          <mesh>
            <boxGeometry args={[0.5, 3.5, 0.05]} />
            <meshStandardMaterial color="#eab308" roughness={0.4} metalness={0.1} />
          </mesh>
          {/* Etchings */}
          <mesh position={[0.15, 0, 0.026]}>
            <boxGeometry args={[0.05, 3.2, 0.01]} />
            <meshStandardMaterial color="#000000" opacity={0.6} transparent />
          </mesh>
        </group>
      );
    default:
      return (
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          {sharedMaterial}
        </mesh>
      );
  }
}

function PhysicsScene() {
  const { size, camera } = useThree();
  const meshesRef = useRef<(THREE.Mesh | null)[]>([]);
  const mouse = useRef<[number, number]>([0,0]);

  // Calculate boundaries based on screen size + camera depth
  // At z = -6 (average depth), distance from camera = 8 + 6 = 14
  const aspect = size.width / size.height;
  const fov = (camera as THREE.PerspectiveCamera).fov;
  const heightAtZ = 2 * Math.tan((fov * Math.PI) / 360) * 14;
  const widthAtZ = heightAtZ * aspect;

  const BOUNDS = useMemo(() => ({
    x: widthAtZ / 2 + 2,   // Allow them to go slightly off-screen X
    y: heightAtZ / 2 + 1,  // Allow them to go slightly off-screen Y
    zMin: -10,
    zMax: -2
  }), [widthAtZ, heightAtZ]);

  // Physics State initialization
  const physicsRef = useRef(
    SHAPES_CFG.map(s => {
      // Random direction unit vector
      const dir = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        (Math.random() - 0.5) * 0.5 // less movement in Z
      ).normalize();
      
      const speedMultiplier = (s.speed || 1) * 0.8; // Reduced base speed factor
      
      return {
        vel: dir.multiplyScalar(speedMultiplier),
        radius: (s.scale || 1) * 1.2, // Approximate collision radius
        rotVel: new THREE.Vector3(
          (Math.random() - 0.5) * 1.0,
          (Math.random() - 0.5) * 1.0,
          (Math.random() - 0.5) * 1.0
        )
      };
    })
  );

  useFrame((_, delta) => {
    // Cap delta to prevent huge jumps if tab was inactive
    const dt = Math.min(delta, 0.1);

    const count = SHAPES_CFG.length;
    
    // 1. Update Positions and check boundary conditions
    for (let i = 0; i < count; i++) {
      const mesh = meshesRef.current[i];
      if (!mesh) continue;
      
      const pData = physicsRef.current[i];
      
      // Rotate
      mesh.rotation.x += pData.rotVel.x * dt;
      mesh.rotation.y += pData.rotVel.y * dt;
      mesh.rotation.z += pData.rotVel.z * dt;

      // Move
      mesh.position.addScaledVector(pData.vel, dt);

      // Boundary Collisions (Bounce)
      const p = mesh.position;
      
      if (p.x > BOUNDS.x - pData.radius) {
        p.x = BOUNDS.x - pData.radius;
        pData.vel.x = -Math.abs(pData.vel.x);
      } else if (p.x < -BOUNDS.x + pData.radius) {
        p.x = -BOUNDS.x + pData.radius;
        pData.vel.x = Math.abs(pData.vel.x);
      }
      
      if (p.y > BOUNDS.y - pData.radius) {
        p.y = BOUNDS.y - pData.radius;
        pData.vel.y = -Math.abs(pData.vel.y);
      } else if (p.y < -BOUNDS.y + pData.radius) {
        p.y = -BOUNDS.y + pData.radius;
        pData.vel.y = Math.abs(pData.vel.y);
      }

      if (p.z > BOUNDS.zMax - pData.radius) {
        p.z = BOUNDS.zMax - pData.radius;
        pData.vel.z = -Math.abs(pData.vel.z);
      } else if (p.z < BOUNDS.zMin + pData.radius) {
        p.z = BOUNDS.zMin + pData.radius;
        pData.vel.z = Math.abs(pData.vel.z);
      }
    }

    // 2. Object-to-Object Collisions
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const meshA = meshesRef.current[i];
        const meshB = meshesRef.current[j];
        if (!meshA || !meshB) continue;

        const pA = physicsRef.current[i];
        const pB = physicsRef.current[j];

        const distSq = meshA.position.distanceToSquared(meshB.position);
        const radSum = pA.radius + pB.radius;

        if (distSq < radSum * radSum && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          // Collision Normal
          const normal = new THREE.Vector3().subVectors(meshA.position, meshB.position).normalize();
          
          // Relative Velocity
          const relVel = new THREE.Vector3().subVectors(pA.vel, pB.vel);
          const speed = relVel.dot(normal);

          // If objects are moving towards each other
          if (speed < 0) {
            // Elastic collision impulse (assuming equal mass)
            const impulse = normal.multiplyScalar(speed * 0.7); // 0.7 bounce factor
            
            pA.vel.sub(impulse);
            pB.vel.add(impulse);
            
            // Add a little spin on collision
            pA.rotVel.add(new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, 0).multiplyScalar(0.2));
            pB.rotVel.add(new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, 0).multiplyScalar(0.2));
          }

          // Positional correction to prevent sticking
          const overlap = radSum - dist;
          const correction = normal.clone().multiplyScalar(overlap / 2.01);
          meshA.position.add(correction);
          meshB.position.sub(correction);
        }
      }
    }

    // 3. Mouse Parallax Effect (Moves the entire camera slightly based on mouse)
    const targetCamX = mouse.current[0] * 1.5;
    const targetCamY = mouse.current[1] * 1.5;
    camera.position.x += (targetCamX - camera.position.x) * 0.05;
    camera.position.y += (targetCamY - camera.position.y) * 0.05;
    camera.lookAt(0, 0, -5);
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} color="#fff" />
      <directionalLight position={[-5, -10, -5]} intensity={0.8} color="#c084fc" />
      
      {/* Invisible plane to catch mouse moves */}
      <mesh
        position={[0, 0, -5]}
        visible={false}
        onPointerMove={(e) => {
          mouse.current = [
            (e.point.x / widthAtZ) * 2,
            (e.point.y / heightAtZ) * 2,
          ];
        }}
        onPointerLeave={() => { mouse.current = [0,0]; }}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial />
      </mesh>

      {SHAPES_CFG.map((cfg, idx) => {
        return (
          <group
            key={idx}
            ref={(el) => {
              // Physics expects Object3D which Group implements, allowing rotation and position manipulation
              meshesRef.current[idx] = el as unknown as THREE.Mesh; 
              // Set initial position once
              if (el && el.position.lengthSq() === 0) {
                el.position.set(...cfg.initialPosition);
              }
            }}
            scale={cfg.scale}
          >
            <EducationalShape type={cfg.geometry} color={cfg.color} />
          </group>
        );
      })}
    </>
  );
}

// --- Exported Component ---
export function LoginScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 65 }}
      dpr={[1, 1.5]}
      style={{ position: 'absolute', inset: 0 }}
    >
      <PhysicsScene />
    </Canvas>
  );
}
