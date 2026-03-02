/**
 * RobotScene3D — Enhanced 3D Scene for the Visualizations page
 *
 * Renders:
 * - Arrow-shaped robot model showing position and heading
 * - Live laser scan points as colored particles
 * - Occupancy grid as a textured 3D floor plane
 * - Robot trail line
 */

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Scene3D } from './Scene3D';
import type {
    RobotPose,
    OccupancyGrid,
    PointCloudData,
} from '../../types/visualization';

interface RobotScene3DProps {
    robotPose?: RobotPose;
    occupancyGrid?: OccupancyGrid;
    pointCloudData?: PointCloudData;
    showGrid?: boolean;
    showAxes?: boolean;
    className?: string;
}

// ─── Robot Arrow Model ─────────────────────────────────────────────────────

function RobotArrow({ pose }: { pose: RobotPose }) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame(() => {
        if (groupRef.current) {
            // Smooth interpolation toward target position
            const target = new THREE.Vector3(pose.x, 0.15, -pose.y);
            groupRef.current.position.lerp(target, 0.1);
            // In Three.js, rotation around Y axis = -theta (ROS Z-up to Three.js Y-up)
            const targetRot = -pose.theta;
            groupRef.current.rotation.y += (targetRot - groupRef.current.rotation.y) * 0.1;
        }
    });

    return (
        <group ref={groupRef} position={[pose.x, 0.15, -pose.y]}>
            {/* Main body */}
            <mesh castShadow>
                <cylinderGeometry args={[0.15, 0.2, 0.3, 16]} />
                <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.6} />
            </mesh>

            {/* Direction arrow (cone pointing forward along local +X) */}
            <mesh position={[0.25, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
                <coneGeometry args={[0.1, 0.2, 8]} />
                <meshStandardMaterial color="#60a5fa" roughness={0.3} metalness={0.5} />
            </mesh>

            {/* Height indicator line */}
            <mesh position={[0, 0.25, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
                <meshStandardMaterial color="#93c5fd" roughness={0.5} />
            </mesh>

            {/* Top beacon (pulsing light indicator) */}
            <pointLight
                position={[0, 0.4, 0]}
                color="#3b82f6"
                intensity={2}
                distance={3}
                decay={2}
            />
            <mesh position={[0, 0.4, 0]}>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshStandardMaterial
                    color="#60a5fa"
                    emissive="#3b82f6"
                    emissiveIntensity={2}
                />
            </mesh>
        </group>
    );
}

// ─── Laser Scan Points ─────────────────────────────────────────────────────

function LaserScanPoints({ data, robotPose }: { data: PointCloudData; robotPose?: RobotPose }) {
    const pointsRef = useRef<THREE.Points>(null);

    const { geometry } = useMemo(() => {
        const pts = data.points ?? [];
        const positions = new Float32Array(pts.length * 3);
        const colorArr = new Float32Array(pts.length * 3);

        // Robot position offset (scan points are in robot frame)
        const rx = robotPose?.x ?? 0;
        const ry = robotPose?.y ?? 0;
        const theta = robotPose?.theta ?? 0;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        pts.forEach((pt, i) => {
            // Transform from robot frame to world frame
            const wx = rx + pt.x * cosT - pt.y * sinT;
            const wy = ry + pt.x * sinT + pt.y * cosT;

            positions[i * 3] = wx;
            positions[i * 3 + 1] = 0.05; // Slightly above floor
            positions[i * 3 + 2] = -wy; // ROS Y → Three.js -Z

            // Color by distance (near=red, far=green)
            const dist = Math.sqrt(pt.x * pt.x + pt.y * pt.y);
            const t = Math.min(dist / 10, 1);
            colorArr[i * 3] = 1 - t * 0.7; // R: bright near, dimmer far
            colorArr[i * 3 + 1] = t * 0.8 + 0.2; // G: grows with distance
            colorArr[i * 3 + 2] = 0.3; // B: constant tint
        });

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));
        geo.computeBoundingSphere();

        return { geometry: geo, colors: colorArr };
    }, [data.points, robotPose]);

    return (
        <points ref={pointsRef} geometry={geometry}>
            <pointsMaterial
                size={0.08}
                vertexColors
                sizeAttenuation
                transparent
                opacity={0.9}
                depthWrite={false}
            />
        </points>
    );
}

// ─── Occupancy Grid Floor ──────────────────────────────────────────────────

function OccupancyFloor({ grid }: { grid: OccupancyGrid }) {
    const meshRef = useRef<THREE.Mesh>(null);

    const texture = useMemo(() => {
        const { width, height, data } = grid;
        if (!width || !height || !data || data.length === 0) return null;

        // Create RGBA image data from occupancy grid
        const imageData = new Uint8Array(width * height * 4);

        for (let i = 0; i < data.length; i++) {
            const val = data[i];
            const idx = i * 4;

            if (val === -1 || val === 255) {
                // Unknown — dark translucent gray
                imageData[idx] = 40;
                imageData[idx + 1] = 40;
                imageData[idx + 2] = 50;
                imageData[idx + 3] = 120;
            } else if (val === 0) {
                // Free space — very subtle floor
                imageData[idx] = 30;
                imageData[idx + 1] = 35;
                imageData[idx + 2] = 45;
                imageData[idx + 3] = 60;
            } else if (val >= 50) {
                // Occupied — bright white/blue
                const intensity = Math.min(val / 100, 1);
                imageData[idx] = Math.floor(200 * intensity);
                imageData[idx + 1] = Math.floor(220 * intensity);
                imageData[idx + 2] = Math.floor(255 * intensity);
                imageData[idx + 3] = Math.floor(200 * intensity);
            } else {
                // Low probability — dim
                const intensity = val / 50;
                imageData[idx] = Math.floor(60 * intensity);
                imageData[idx + 1] = Math.floor(70 * intensity);
                imageData[idx + 2] = Math.floor(90 * intensity);
                imageData[idx + 3] = Math.floor(80 * intensity);
            }
        }

        const tex = new THREE.DataTexture(imageData, width, height, THREE.RGBAFormat);
        tex.needsUpdate = true;
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        return tex;
    }, [grid]);

    if (!texture) return null;

    const gridWidth = grid.width * grid.resolution;
    const gridHeight = grid.height * grid.resolution;
    const centerX = grid.origin.x + gridWidth / 2;
    const centerY = grid.origin.y + gridHeight / 2;

    return (
        <mesh
            ref={meshRef}
            position={[centerX, 0.01, -centerY]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
        >
            <planeGeometry args={[gridWidth, gridHeight]} />
            <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
        </mesh>
    );
}

// ─── Robot Trail ───────────────────────────────────────────────────────────

const MAX_TRAIL_LENGTH = 200;

function RobotTrail({ pose }: { pose: RobotPose }) {
    const trailRef = useRef<THREE.Vector3[]>([]);
    const lineRef = useRef<THREE.Line>(null);

    useFrame(() => {
        if (!lineRef.current) return;

        const trail = trailRef.current;
        const newPoint = new THREE.Vector3(pose.x, 0.03, -pose.y);

        // Only add if moved enough
        if (trail.length === 0 || newPoint.distanceTo(trail[trail.length - 1]) > 0.05) {
            trail.push(newPoint);
            if (trail.length > MAX_TRAIL_LENGTH) trail.shift();

            const geo = new THREE.BufferGeometry().setFromPoints(trail);
            lineRef.current.geometry.dispose();
            lineRef.current.geometry = geo;
        }
    });

    return (
        <line ref={lineRef as any}>
            <bufferGeometry />
            <lineBasicMaterial color="#3b82f6" linewidth={2} transparent opacity={0.6} />
        </line>
    );
}

// ─── Info HUD ──────────────────────────────────────────────────────────────

function SceneInfoHUD({
    robotPose,
    scanPoints,
    hasGrid,
}: {
    robotPose?: RobotPose;
    scanPoints: number;
    hasGrid: boolean;
}) {
    return (
        <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg shadow-sm p-3 border space-y-1">
            {robotPose && (
                <>
                    <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-blue-400">Robot:</span>{' '}
                        <span className="font-mono">
                            ({robotPose.x.toFixed(2)}, {robotPose.y.toFixed(2)})
                        </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-orange-400">Heading:</span>{' '}
                        <span className="font-mono">
                            {(robotPose.theta * 180 / Math.PI).toFixed(1)}°
                        </span>
                    </div>
                </>
            )}
            {scanPoints > 0 && (
                <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-green-400">Scan:</span>{' '}
                    <span className="font-mono">{scanPoints} pts</span>
                </div>
            )}
            {hasGrid && (
                <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-purple-400">Map:</span> active
                </div>
            )}
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function RobotScene3D({
    robotPose,
    occupancyGrid,
    pointCloudData,
    showGrid = true,
    showAxes = true,
    className,
}: RobotScene3DProps) {
    const scanPoints = pointCloudData?.points?.length ?? 0;

    return (
        <div className={`relative ${className ?? ''}`}>
            <Scene3D
                showGrid={showGrid}
                showAxes={showAxes}
                cameraPosition={[4, 6, 4]}
                className="w-full h-full"
            >
                {/* Occupancy grid floor */}
                {occupancyGrid && <OccupancyFloor grid={occupancyGrid} />}

                {/* Laser scan points */}
                {pointCloudData && pointCloudData.points && pointCloudData.points.length > 0 && (
                    <LaserScanPoints data={pointCloudData} robotPose={robotPose} />
                )}

                {/* Robot with heading arrow */}
                <RobotArrow pose={robotPose || { x: 0, y: 0, theta: 0 }} />
                {robotPose && <RobotTrail pose={robotPose} />}
            </Scene3D>

            {/* Info overlay */}
            <SceneInfoHUD
                robotPose={robotPose}
                scanPoints={scanPoints}
                hasGrid={!!occupancyGrid}
            />
        </div>
    );
}
