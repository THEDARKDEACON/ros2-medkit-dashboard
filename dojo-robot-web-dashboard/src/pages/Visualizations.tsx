import { useState } from 'react';
import { Map, Box, Camera, Loader2, WifiOff, Wifi, AlertTriangle } from 'lucide-react';
import { Map2D } from '../components/visualizations/Map2D';
import { PointCloudViewer } from '../components/visualizations/PointCloudViewer';
import { RobotScene3D } from '../components/visualizations/RobotScene3D';
import { Visualization3DControls } from '../components/visualizations/Visualization3DControls';
import { useVisualizationData } from '../hooks/useVisualizationData';
import type { PointCloudColorMode } from '../types/visualization';

/**
 * Connection status indicator component
 */
function ConnectionStatus({ status, errors, dataSource }: {
  status: 'connected' | 'partial' | 'disconnected';
  errors: string[];
  dataSource: 'rosbridge' | 'rest' | 'none';
}) {
  const configs = {
    connected: {
      icon: <Wifi className="w-3.5 h-3.5" />,
      label: 'Live',
      className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      dotClass: 'bg-emerald-400',
    },
    partial: {
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      label: 'Partial',
      className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      dotClass: 'bg-amber-400',
    },
    disconnected: {
      icon: <WifiOff className="w-3.5 h-3.5" />,
      label: 'No data',
      className: 'bg-red-500/15 text-red-400 border-red-500/30',
      dotClass: 'bg-red-400',
    },
  };

  const config = configs[status];

  const sourceLabels = {
    rosbridge: 'rosbridge',
    rest: 'REST API',
    none: '',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${config.className}`}>
        <span className={`w-2 h-2 rounded-full ${config.dotClass} ${status === 'connected' ? 'animate-pulse' : ''}`} />
        {config.icon}
        {config.label}
      </div>
      {dataSource !== 'none' && (
        <div className="px-2 py-1 rounded border bg-muted/50 text-[10px] font-mono text-muted-foreground">
          via {sourceLabels[dataSource]}
        </div>
      )}
      {errors.length > 0 && (
        <div className="text-xs text-muted-foreground" title={errors.join('\n')}>
          {errors.length} endpoint{errors.length > 1 ? 's' : ''} unavailable
        </div>
      )}
    </div>
  );
}

/**
 * Loading skeleton for the visualization area
 */
function VisualizationSkeleton() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-muted/30 rounded-lg">
      <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">Connecting to robot...</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Waiting for visualization data</p>
      </div>
    </div>
  );
}

/**
 * Empty state when no data is available
 */
function EmptyState() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20">
      <WifiOff className="w-12 h-12 text-muted-foreground/40" />
      <div className="text-center max-w-sm">
        <p className="text-lg font-medium text-muted-foreground">No Robot Data Available</p>
        <p className="text-sm text-muted-foreground/70 mt-2">
          Connect to a robot instance to see real-time map, pose, and sensor data here.
          Check that the API gateway is running and accessible.
        </p>
      </div>
    </div>
  );
}

export function Visualizations() {
  const [activeTab, setActiveTab] = useState<'2d' | '3d-pointcloud' | '3d-scene'>('2d');

  // 3D Controls State
  const [colorMode, setColorMode] = useState<PointCloudColorMode>('rgb');
  const [pointSize, setPointSize] = useState(0.05);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);

  // Real-time visualization data from backend
  const vizData = useVisualizationData({
    enabled: true,
  });

  // Determine what to render in the main area
  const showSkeleton = vizData.isLoading && !vizData.isAnyDataAvailable;
  const showEmpty = !vizData.isLoading && !vizData.isAnyDataAvailable;

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

        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <ConnectionStatus
            status={vizData.connectionStatus}
            errors={vizData.errors}
            dataSource={vizData.dataSource}
          />

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
      </div>

      {/* Main Visualization Area */}
      <div className="flex-1 overflow-hidden rounded-lg border bg-card shadow-sm relative">
        {/* Loading skeleton */}
        {showSkeleton && <VisualizationSkeleton />}

        {/* Empty state */}
        {showEmpty && <EmptyState />}

        {/* 2D Map - render when data is available or partially available */}
        {!showSkeleton && !showEmpty && activeTab === '2d' && (
          <div className="w-full h-full p-2">
            <Map2D
              robotPose={vizData.robotPose}
              occupancyGrid={vizData.occupancyGrid}
              semanticObjects={vizData.semanticObjects}
              frontiers={vizData.frontiers}
              path={vizData.path}
              width={1200}
              height={800}
              className="w-full h-full rounded border bg-background"
            />
          </div>
        )}

        {/* 3D Point Cloud */}
        {!showSkeleton && !showEmpty && activeTab === '3d-pointcloud' && (
          <div className="w-full h-full bg-black/5 relative">
            {vizData.pointCloudData ? (
              <>
                <PointCloudViewer
                  data={vizData.pointCloudData}
                  colorMode={colorMode}
                  pointSize={pointSize}
                  showGrid={showGrid}
                  showAxes={showAxes}
                  className="w-full h-full"
                />
                <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg shadow-sm p-3 border">
                  <div className="text-xs text-muted-foreground">
                    Points: {(vizData.pointCloudData.points?.length ?? 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Updated: {new Date(vizData.pointCloudData.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No point cloud data available</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    LiDAR data will appear here when the sensor is active
                  </p>
                </div>
              </div>
            )}
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

        {/* 3D Scene — Enhanced with laser scan, occupancy grid, and robot arrow */}
        {!showSkeleton && !showEmpty && activeTab === '3d-scene' && (
          <div className="w-full h-full bg-black/5 relative">
            <RobotScene3D
              robotPose={vizData.robotPose}
              occupancyGrid={vizData.occupancyGrid}
              pointCloudData={vizData.pointCloudData}
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
          </div>
        )}
      </div>
    </div>
  );
}
