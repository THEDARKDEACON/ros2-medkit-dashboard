/**
 * Robot Orientation 3D Component
 * Displays robot orientation using coordinate frame axes
 */

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Scene3D } from './Scene3D';
import type { RobotPose3D, RobotOrientation } from '../../types/visualization';

interface RobotOrientation3DProps {
  pose?: RobotPose3D;
  orientation?: RobotOrientation;
  showGrid?: boolean;
  showAxes?: boolean;
  axisLength?: number;
  animate?: boolean;
  className?: string;
}

/**
 * Coordinate frame component showing X, Y, Z axes
 */
function CoordinateFrame({
  orientation,
  position = [0, 0, 0],
  axisLength = 2,
  animate = true,
}: {
  orientation: RobotOrientation;
  position?: [number, number, number];
  axisLength?: number;
  animate?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef(new THREE.Euler());

  // Update target rotation when orientation changes
  useEffect(() => {
    targetRotation.current.set(orientation.roll, orientation.pitch, orientation.yaw, 'XYZ');
  }, [orientation]);

  // Smoothly interpolate to target rotation
  useFrame(() => {
    if (groupRef.current && animate) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetRotation.current.x,
        0.1
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation.current.y,
        0.1
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        targetRotation.current.z,
        0.1
      );
    } else if (groupRef.current && !animate) {
      groupRef.current.rotation.set(
        targetRotation.current.x,
        targetRotation.current.y,
        targetRotation.current.z
      );
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* X axis - Red */}
      <arrowHelper args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), axisLength, 0xff0000, axisLength * 0.2, axisLength * 0.1]} />
      
      {/* Y axis - Green */}
      <arrowHelper args={[new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), axisLength, 0x00ff00, axisLength * 0.2, axisLength * 0.1]} />
      
      {/* Z axis - Blue */}
      <arrowHelper args={[new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), axisLength, 0x0000ff, axisLength * 0.2, axisLength * 0.1]} />

      {/* Robot body representation (simple box) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.5, 0.3, 0.7]} />
        <meshStandardMaterial color="#3b82f6" opacity={0.7} transparent />
      </mesh>
    </group>
  );
}

/**
 * Orientation labels component
 */
function OrientationLabels({ orientation }: { orientation: RobotOrientation }) {
  const toDegrees = (rad: number) => ((rad * 180) / Math.PI).toFixed(1);

  return (
    <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 space-y-2">
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Orientation
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-12 text-red-500 font-medium">Roll:</span>
          <span className="font-mono">{toDegrees(orientation.roll)}°</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-12 text-green-500 font-medium">Pitch:</span>
          <span className="font-mono">{toDegrees(orientation.pitch)}°</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-12 text-blue-500 font-medium">Yaw:</span>
          <span className="font-mono">{toDegrees(orientation.yaw)}°</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Robot Orientation 3D Viewer
 */
export function RobotOrientation3D({
  pose,
  orientation,
  showGrid = true,
  showAxes = true,
  axisLength = 2,
  animate = true,
  className,
}: RobotOrientation3DProps) {
  // Use orientation from pose if available, otherwise use direct orientation
  const currentOrientation = pose?.orientation || orientation || { roll: 0, pitch: 0, yaw: 0 };
  const position = pose?.position
    ? ([pose.position.x, pose.position.y, pose.position.z] as [number, number, number])
    : ([0, 0, 0] as [number, number, number]);

  return (
    <div className={`relative ${className || 'w-full h-full'}`}>
      <Scene3D
        showGrid={showGrid}
        showAxes={showAxes}
        cameraPosition={[5, 5, 5]}
        className="w-full h-full"
      >
        <CoordinateFrame
          orientation={currentOrientation}
          position={position}
          axisLength={axisLength}
          animate={animate}
        />
      </Scene3D>
      <OrientationLabels orientation={currentOrientation} />
    </div>
  );
}
