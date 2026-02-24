/**
 * Gaussian Splat Viewer Component
 * Renders 3D Gaussian splats for scene reconstruction
 */

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Scene3D } from './Scene3D';
import type {
  GaussianSplatData,
  GaussianRenderMode,
  GaussianSplatStats,
} from '../../types/visualization';

interface GaussianSplatViewerProps {
  data: GaussianSplatData;
  renderMode?: GaussianRenderMode;
  showGrid?: boolean;
  showAxes?: boolean;
  showStats?: boolean;
  className?: string;
}

/**
 * Custom shader material for Gaussian rendering
 */
function createGaussianMaterial(renderMode: GaussianRenderMode): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      pointSize: { value: 1.0 },
      renderMode: { value: renderMode === 'points' ? 0 : renderMode === 'ellipsoids' ? 1 : 2 },
    },
    vertexShader: `
      attribute vec3 color;
      attribute float opacity;
      
      varying vec3 vColor;
      varying float vOpacity;
      
      uniform float pointSize;
      
      void main() {
        vColor = color;
        vOpacity = opacity;
        
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Scale point size based on distance
        gl_PointSize = pointSize * (300.0 / -mvPosition.z);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vOpacity;
      
      uniform int renderMode;
      
      void main() {
        if (renderMode == 0) {
          // Points mode - simple circular points
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          gl_FragColor = vec4(vColor, vOpacity);
        } else if (renderMode == 1) {
          // Ellipsoids mode - smooth falloff
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          float alpha = exp(-dist * dist * 4.0) * vOpacity;
          gl_FragColor = vec4(vColor, alpha);
        } else {
          // Full mode - Gaussian with bloom
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          float alpha = exp(-dist * dist * 8.0) * vOpacity;
          
          // Add slight glow
          float glow = exp(-dist * dist * 2.0) * vOpacity * 0.3;
          vec3 finalColor = vColor + vec3(glow);
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/**
 * Compute statistics for Gaussian splat data
 */
function computeStats(data: GaussianSplatData): GaussianSplatStats {
  if (data.splats.length === 0) {
    return {
      totalSplats: 0,
      averageOpacity: 0,
      boundingBox: {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
      },
      memoryUsage: 0,
    };
  }

  let totalOpacity = 0;
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;

  data.splats.forEach((splat) => {
    totalOpacity += splat.opacity;
    const [x, y, z] = splat.position;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  });

  // Estimate memory usage (position + color + covariance + opacity)
  const bytesPerSplat = 3 * 4 + 3 * 4 + 9 * 4 + 4; // floats are 4 bytes
  const memoryUsage = data.splats.length * bytesPerSplat;

  return {
    totalSplats: data.splats.length,
    averageOpacity: totalOpacity / data.splats.length,
    boundingBox: {
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ },
    },
    memoryUsage,
  };
}

/**
 * Gaussian splat geometry component
 */
function GaussianSplatGeometry({
  data,
  renderMode,
}: {
  data: GaussianSplatData;
  renderMode: GaussianRenderMode;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  const [geometry, material] = useMemo(() => {
    const positions = new Float32Array(data.splats.length * 3);
    const colors = new Float32Array(data.splats.length * 3);
    const opacities = new Float32Array(data.splats.length);

    data.splats.forEach((splat, i) => {
      // Set position
      positions[i * 3] = splat.position[0];
      positions[i * 3 + 1] = splat.position[1];
      positions[i * 3 + 2] = splat.position[2];

      // Set color
      colors[i * 3] = splat.color[0];
      colors[i * 3 + 1] = splat.color[1];
      colors[i * 3 + 2] = splat.color[2];

      // Set opacity
      opacities[i] = splat.opacity;
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

    geometry.computeBoundingSphere();

    const material = createGaussianMaterial(renderMode);

    return [geometry, material];
  }, [data, renderMode]);

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

/**
 * Statistics display component
 */
function StatsDisplay({ stats }: { stats: GaussianSplatStats }) {
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 space-y-2">
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Reconstruction Statistics
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-gray-600 dark:text-gray-400">Total Splats:</span>
          <span className="font-mono">{stats.totalSplats.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-600 dark:text-gray-400">Avg Opacity:</span>
          <span className="font-mono">{stats.averageOpacity.toFixed(3)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-600 dark:text-gray-400">Memory:</span>
          <span className="font-mono">{formatBytes(stats.memoryUsage)}</span>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-gray-600 dark:text-gray-400 mb-1">Bounding Box:</div>
          <div className="font-mono text-[10px] space-y-0.5">
            <div>
              Min: ({stats.boundingBox.min.x.toFixed(2)}, {stats.boundingBox.min.y.toFixed(2)},{' '}
              {stats.boundingBox.min.z.toFixed(2)})
            </div>
            <div>
              Max: ({stats.boundingBox.max.x.toFixed(2)}, {stats.boundingBox.max.y.toFixed(2)},{' '}
              {stats.boundingBox.max.z.toFixed(2)})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Gaussian Splat Viewer with controls
 */
export function GaussianSplatViewer({
  data,
  renderMode = 'full',
  showGrid = true,
  showAxes = true,
  showStats = true,
  className,
}: GaussianSplatViewerProps) {
  const stats = useMemo(() => computeStats(data), [data]);

  return (
    <div className={`relative ${className || 'w-full h-full'}`}>
      <Scene3D
        showGrid={showGrid}
        showAxes={showAxes}
        cameraPosition={[10, 10, 10]}
        className="w-full h-full"
      >
        <GaussianSplatGeometry data={data} renderMode={renderMode} />
      </Scene3D>
      {showStats && <StatsDisplay stats={stats} />}
    </div>
  );
}
