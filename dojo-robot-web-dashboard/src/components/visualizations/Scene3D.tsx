/**
 * Base 3D Scene Component
 * Provides a configured Three.js canvas with camera, controls, and lighting
 */

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei';
import type { ReactNode } from 'react';

interface Scene3DProps {
  children?: ReactNode;
  showGrid?: boolean;
  showAxes?: boolean;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  gridSize?: number;
  className?: string;
}

/**
 * Base 3D scene with camera, controls, and lighting
 */
export function Scene3D({
  children,
  showGrid = true,
  showAxes = true,
  cameraPosition = [5, 5, 5],
  cameraFov = 75,
  gridSize = 20,
  className = 'w-full h-full',
}: Scene3DProps) {
  return (
    <div className={className}>
      <Canvas>
        {/* Camera setup */}
        <PerspectiveCamera
          makeDefault
          position={cameraPosition}
          fov={cameraFov}
          near={0.1}
          far={1000}
        />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={0.8} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />

        {/* Grid helper */}
        {showGrid && (
          <Grid
            args={[gridSize, gridSize]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#6b7280"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#374151"
            fadeDistance={50}
            fadeStrength={1}
            infiniteGrid
          />
        )}

        {/* Axes helper */}
        {showAxes && <axesHelper args={[5]} />}

        {/* Orbit controls for camera manipulation */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          panSpeed={0.5}
          minDistance={1}
          maxDistance={100}
        />

        {/* User content */}
        {children}
      </Canvas>
    </div>
  );
}
