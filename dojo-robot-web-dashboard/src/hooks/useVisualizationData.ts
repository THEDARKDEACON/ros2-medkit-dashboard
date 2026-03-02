/**
 * useVisualizationData Hook
 *
 * Composite hook that aggregates all visualization data sources
 * into a single interface for the Visualizations page.
 *
 * Data source priority (fallback chain):
 * 1. Rosbridge (direct ROS topic subscription) — universal robot support
 * 2. REST API (ros2_medkit gateway) — legacy support
 * 3. Empty state — no data available
 */

import { useMemo } from 'react';
import {
    useOccupancyGrid,
    useRobotPose,
    useSemanticObjects,
    useNavigationStatus,
    useExplorationStats,
    usePointCloudData,
} from '../features/api/hooks';
import { useRosbridgeTopic } from './useRosbridgeTopic';
import { useRosbridgeStore } from '../features/stores/rosbridgeStore';
import type {
    RobotPose,
    OccupancyGrid,
    SemanticObject,
    Frontier,
    PathPoint,
    PointCloudData,
} from '../types/visualization';

export interface VisualizationData {
    // 2D Map data
    robotPose?: RobotPose;
    occupancyGrid?: OccupancyGrid;
    semanticObjects: SemanticObject[];
    frontiers: Frontier[];
    path: PathPoint[];

    // 3D data
    pointCloudData?: PointCloudData;

    // Status
    isLoading: boolean;
    isAnyDataAvailable: boolean;
    connectionStatus: 'connected' | 'partial' | 'disconnected';
    dataSource: 'rosbridge' | 'rest' | 'none';
    errors: string[];

    // Last update timestamps
    lastPoseUpdate?: string;
    lastMapUpdate?: string;
}

interface UseVisualizationDataOptions {
    /** Navigation component ID (required for nav status and exploration data via REST) */
    componentId?: string;
    /** Whether data fetching is enabled (pause when tab is inactive) */
    enabled?: boolean;
    /** Topic name overrides for rosbridge mode */
    rosbridgeTopics?: {
        map?: string;
        pose?: string;
        pointCloud?: string;
    };
}

export function useVisualizationData(
    options: UseVisualizationDataOptions = {}
): VisualizationData {
    const {
        componentId,
        enabled = true,
        rosbridgeTopics = {},
    } = options;

    const rosbridgeStatus = useRosbridgeStore((s) => s.status);
    const useRosbridge = rosbridgeStatus === 'connected';

    // ── Rosbridge Data Sources ─────────────────────────────────────────────

    const mapTopic = rosbridgeTopics.map || '/map';
    const poseTopic = rosbridgeTopics.pose || '/odom';
    const pointCloudTopic = rosbridgeTopics.pointCloud || '/scan';

    const rbMap = useRosbridgeTopic<OccupancyGrid>(
        mapTopic,
        { type: 'nav_msgs/OccupancyGrid', throttleRate: 2000, enabled: useRosbridge && enabled }
    );

    const rbPose = useRosbridgeTopic<{ pose: { pose: { position: { x: number; y: number; z: number }; orientation: { x: number; y: number; z: number; w: number } } } }>(
        poseTopic,
        { type: 'nav_msgs/Odometry', throttleRate: 100, enabled: useRosbridge && enabled }
    );

    const rbPointCloud = useRosbridgeTopic<PointCloudData>(
        pointCloudTopic,
        { type: 'sensor_msgs/PointCloud2', throttleRate: 1000, enabled: useRosbridge && enabled }
    );

    // ── REST Data Sources (fallback) ───────────────────────────────────────

    const restEnabled = !useRosbridge && enabled;

    const occupancyQuery = useOccupancyGrid({ enabled: restEnabled });
    const poseQuery = useRobotPose({ enabled: restEnabled });
    const semanticQuery = useSemanticObjects({ enabled, refetchInterval: 2000 });
    const navQuery = useNavigationStatus(componentId || '', {
        enabled: enabled && !!componentId,
        refetchInterval: 1000,
    });
    const explorQuery = useExplorationStats(componentId || '', {
        enabled: enabled && !!componentId,
        refetchInterval: 2000,
    });
    const pointCloudQuery = usePointCloudData({ enabled: restEnabled });

    // ── Merge Data Sources ─────────────────────────────────────────────────

    // Convert rosbridge odom to RobotPose
    const rbRobotPose: RobotPose | undefined = useMemo(() => {
        if (!rbPose.data) return undefined;
        const pos = rbPose.data.pose?.pose?.position;
        const orient = rbPose.data.pose?.pose?.orientation;
        if (!pos) return undefined;

        // Convert quaternion to yaw (theta)
        const theta = orient
            ? Math.atan2(2 * (orient.w * orient.z + orient.x * orient.y), 1 - 2 * (orient.y * orient.y + orient.z * orient.z))
            : 0;

        return { x: pos.x, y: pos.y, theta };
    }, [rbPose.data]);

    // Choose data source
    const robotPose = useRosbridge ? rbRobotPose : poseQuery.data;
    const occupancyGrid = useRosbridge ? rbMap.data : occupancyQuery.data;
    const pointCloudData = useRosbridge ? rbPointCloud.data : pointCloudQuery.data;

    // Semantic objects come from REST API regardless (they use the medkit backend)
    const semanticObjects = semanticQuery.data || [];

    // Derive frontiers from exploration stats
    const frontiers: Frontier[] = useMemo(() => {
        if (!explorQuery.data?.frontierClusters) return [];
        return explorQuery.data.frontierClusters.map((cluster) => ({
            id: cluster.id,
            points: [cluster.centroid],
            centroid: cluster.centroid,
            size: cluster.size,
        }));
    }, [explorQuery.data]);

    // Derive path from navigation status
    const path: PathPoint[] = useMemo(() => {
        if (!navQuery.data?.plannedPath) return [];
        return navQuery.data.plannedPath;
    }, [navQuery.data]);

    // ── Status Derivation ──────────────────────────────────────────────────

    const errors = useMemo(() => {
        const errs: string[] = [];
        if (!useRosbridge) {
            if (occupancyQuery.error) errs.push(`Map: ${(occupancyQuery.error as Error).message}`);
            if (poseQuery.error) errs.push(`Pose: ${(poseQuery.error as Error).message}`);
            if (pointCloudQuery.error) errs.push(`PointCloud: ${(pointCloudQuery.error as Error).message}`);
        }
        if (rbMap.error) errs.push(`Map: ${rbMap.error}`);
        if (rbPose.error) errs.push(`Pose: ${rbPose.error}`);
        if (rbPointCloud.error) errs.push(`PointCloud: ${rbPointCloud.error}`);
        if (semanticQuery.error) errs.push(`Semantic: ${(semanticQuery.error as Error).message}`);
        return errs;
    }, [occupancyQuery.error, poseQuery.error, pointCloudQuery.error, semanticQuery.error, rbMap.error, rbPose.error, rbPointCloud.error, useRosbridge]);

    const isAnyDataAvailable =
        !!occupancyGrid ||
        !!robotPose ||
        semanticObjects.length > 0 ||
        !!pointCloudData;

    const isLoading = useRosbridge
        ? (!rbMap.data && !rbPose.data && rbMap.isConnected)
        : (occupancyQuery.isLoading || poseQuery.isLoading || semanticQuery.isLoading || pointCloudQuery.isLoading);

    const dataSource: 'rosbridge' | 'rest' | 'none' = useRosbridge
        ? 'rosbridge'
        : isAnyDataAvailable
            ? 'rest'
            : 'none';

    const connectionStatus = useMemo(() => {
        if (isAnyDataAvailable && errors.length === 0) return 'connected' as const;
        if (isAnyDataAvailable && errors.length > 0) return 'partial' as const;
        return 'disconnected' as const;
    }, [isAnyDataAvailable, errors.length]);

    return {
        robotPose,
        occupancyGrid,
        semanticObjects,
        frontiers,
        path,
        pointCloudData,
        isLoading,
        isAnyDataAvailable,
        connectionStatus,
        dataSource,
        errors,
        lastPoseUpdate: rbPose.lastUpdate
            ? new Date(rbPose.lastUpdate).toISOString()
            : poseQuery.dataUpdatedAt
                ? new Date(poseQuery.dataUpdatedAt).toISOString()
                : undefined,
        lastMapUpdate: rbMap.lastUpdate
            ? new Date(rbMap.lastUpdate).toISOString()
            : occupancyQuery.dataUpdatedAt
                ? new Date(occupancyQuery.dataUpdatedAt).toISOString()
                : undefined,
    };
}
