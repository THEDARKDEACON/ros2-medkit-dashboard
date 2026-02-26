import { useState } from 'react';
import { Map, Box, Camera } from 'lucide-react';
import { Map2D } from '../components/visualizations/Map2D';
import { Scene3D } from '../components/visualizations/Scene3D';
import { PointCloudViewer } from '../components/visualizations/PointCloudViewer';
import { Visualization3DControls } from '../components/visualizations/Visualization3DControls';
import type {
  RobotPose,
  OccupancyGrid,
  SemanticObject,
  Frontier,
  PathPoint,
  PointCloudData,
  PointCloudColorMode
} from '../types/visualization';

// Dummy Data Generators based on Usage Examples
function generateOccupancyData(): number[] {
  const data = new Array(10000);
  for (let i = 0; i < data.length; i++) {
    const rand = Math.random();
    if (rand < 0.7) data[i] = 0; // Free
    else if (rand < 0.9) data[i] = 100; // Occupied
    else data[i] = -1; // Unknown
  }
  return data;
}

const dummyRobotPose: RobotPose = { x: 5.0, y: 3.0, theta: Math.PI / 4 };
const dummyOccupancyGrid: OccupancyGrid = {
  width: 100, height: 100, resolution: 0.1, origin: { x: -5, y: -5 }, data: generateOccupancyData()
};
const dummySemanticObjects: SemanticObject[] = [
  { id: 'obj_1', class: 'person', confidence: 0.95, position: { x: 3.0, y: 2.0 }, timestamp: new Date().toISOString() },
  { id: 'obj_2', class: 'chair', confidence: 0.88, position: { x: -1.0, y: 4.0 }, timestamp: new Date().toISOString(), persistent: true }
];
const dummyFrontiers: Frontier[] = [
  { id: 'f_1', points: [{ x: 10, y: 5 }, { x: 10.1, y: 5.1 }], centroid: { x: 10.05, y: 5.05 }, size: 2, clusterId: 0 }
];
const dummyPath: PathPoint[] = [
  { x: 5, y: 3, theta: 0 }, { x: 7, y: 4, theta: 0.5 }, { x: 10, y: 5, theta: 1.0 }
];

const dummyPointCloudData: PointCloudData = {
  points: [
    { x: 0, y: 0, z: 0, r: 255, g: 0, b: 0, intensity: 0.8, semantic: 1 },
    { x: 1, y: 1, z: 1, r: 0, g: 255, b: 0, intensity: 0.6, semantic: 2 },
    { x: 2, y: 2, z: 2, r: 0, g: 0, b: 255, intensity: 0.4, semantic: 3 },
    // A few scatter points
    ...Array.from({ length: 1000 }).map(() => ({
      x: (Math.random() - 0.5) * 10,
      y: (Math.random() - 0.5) * 10,
      z: (Math.random() - 0.5) * 10,
      r: Math.floor(Math.random() * 255),
      g: Math.floor(Math.random() * 255),
      b: Math.floor(Math.random() * 255),
      intensity: Math.random(),
      semantic: Math.floor(Math.random() * 5)
    }))
  ],
  timestamp: new Date().toISOString(),
  frameId: 'base_link',
};

export function Visualizations() {
  const [activeTab, setActiveTab] = useState<'2d' | '3d-pointcloud' | '3d-scene'>('2d');

  // 3D Controls State
  const [colorMode, setColorMode] = useState<PointCloudColorMode>('rgb');
  const [pointSize, setPointSize] = useState(0.05);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col gap-6 overflow-hidden">
      {/* Page Header */}
      <div className="flex-none flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Visualizations</h1>
          <p className="mt-2 text-muted-foreground">
            Interactive 2D and 3D visualizations of robot data
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('2d')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === '2d' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Map className="w-4 h-4" /> 2D Map
          </button>
          <button
            onClick={() => setActiveTab('3d-pointcloud')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === '3d-pointcloud' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Camera className="w-4 h-4" /> 3D Point Cloud
          </button>
          <button
            onClick={() => setActiveTab('3d-scene')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === '3d-scene' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Box className="w-4 h-4" /> 3D Scene
          </button>
        </div>
      </div>

      {/* Main Visualization Area */}
      <div className="flex-1 overflow-hidden rounded-lg border bg-card shadow-sm relative">
        {activeTab === '2d' && (
          <div className="w-full h-full p-2">
            <Map2D
              robotPose={dummyRobotPose}
              occupancyGrid={dummyOccupancyGrid}
              semanticObjects={dummySemanticObjects}
              frontiers={dummyFrontiers}
              path={dummyPath}
              width={1200}
              height={800}
              className="w-full h-full rounded border bg-background"
            />
          </div>
        )}

        {activeTab === '3d-pointcloud' && (
          <div className="w-full h-full bg-black/5 relative">
            <PointCloudViewer
              data={dummyPointCloudData}
              colorMode={colorMode}
              pointSize={pointSize}
              showGrid={showGrid}
              showAxes={showAxes}
              className="w-full h-full"
            />
            <Visualization3DControls
              colorMode={colorMode}
              onColorModeChange={setColorMode}
              pointSize={pointSize}
              onPointSizeChange={setPointSize}
              showGrid={showGrid}
              onShowGridChange={setShowGrid}
              showAxes={showAxes}
              onShowAxesChange={setShowAxes}
            />
            <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg shadow-sm p-3 border">
              <div className="text-xs text-muted-foreground">
                Points: {dummyPointCloudData.points.length.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                Updated: {new Date(dummyPointCloudData.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {activeTab === '3d-scene' && (
          <div className="w-full h-full bg-black/5 relative">
            <Scene3D
              showGrid={showGrid}
              showAxes={showAxes}
              cameraPosition={[5, 5, 5]}
              className="w-full h-full"
            >
              {/* Box representing a robot or an object in the scene */}
              <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#3b82f6" roughness={0.5} />
              </mesh>
            </Scene3D>

            <Visualization3DControls
              colorMode={colorMode}
              onColorModeChange={setColorMode}
              pointSize={pointSize}
              onPointSizeChange={setPointSize}
              showGrid={showGrid}
              onShowGridChange={setShowGrid}
              showAxes={showAxes}
              onShowAxesChange={setShowAxes}
            />
          </div>
        )}
      </div>
    </div>
  );
}
