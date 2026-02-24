/**
 * Data Processing Web Worker
 * 
 * Offloads heavy computation tasks from the main thread to prevent UI blocking.
 * Handles:
 * - Point cloud data parsing
 * - Statistical computations
 * - Large dataset filtering and transformations
 */

export interface WorkerMessage {
  type: 'PARSE_POINT_CLOUD' | 'COMPUTE_STATISTICS' | 'FILTER_DATASET';
  data: any;
  requestId: string;
}

export interface WorkerResponse {
  type: string;
  data: any;
  requestId: string;
  error?: string;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
  intensity?: number;
  r?: number;
  g?: number;
  b?: number;
}

export interface PointCloud {
  points: Point3D[];
  count: number;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
}

export interface Statistics {
  count: number;
  sum: number;
  mean: number;
  min: number;
  max: number;
  variance: number;
  stdDev: number;
}

// Listen for messages from the main thread
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, data, requestId } = event.data;

  try {
    switch (type) {
      case 'PARSE_POINT_CLOUD':
        const pointCloud = parsePointCloudData(data);
        postResponse('POINT_CLOUD_PARSED', pointCloud, requestId);
        break;

      case 'COMPUTE_STATISTICS':
        const stats = computeStatistics(data);
        postResponse('STATISTICS_COMPUTED', stats, requestId);
        break;

      case 'FILTER_DATASET':
        const filtered = filterDataset(data.items, data.predicate);
        postResponse('DATASET_FILTERED', filtered, requestId);
        break;

      default:
        postError(`Unknown message type: ${type}`, requestId);
    }
  } catch (error) {
    postError(error instanceof Error ? error.message : 'Unknown error', requestId);
  }
});

/**
 * Parse point cloud data from binary format
 */
function parsePointCloudData(rawData: ArrayBuffer): PointCloud {
  const view = new DataView(rawData);
  const points: Point3D[] = [];
  
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  // Assuming format: x(float32), y(float32), z(float32), intensity(float32)
  // Each point is 16 bytes
  const pointSize = 16;
  const pointCount = view.byteLength / pointSize;

  for (let i = 0; i < pointCount; i++) {
    const offset = i * pointSize;
    
    const x = view.getFloat32(offset, true);
    const y = view.getFloat32(offset + 4, true);
    const z = view.getFloat32(offset + 8, true);
    const intensity = view.getFloat32(offset + 12, true);

    points.push({ x, y, z, intensity });

    // Update bounds
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }

  return {
    points,
    count: points.length,
    bounds: { minX, maxX, minY, maxY, minZ, maxZ },
  };
}

/**
 * Compute statistical measures for a dataset
 */
function computeStatistics(values: number[]): Statistics {
  if (values.length === 0) {
    return {
      count: 0,
      sum: 0,
      mean: 0,
      min: 0,
      max: 0,
      variance: 0,
      stdDev: 0,
    };
  }

  let sum = 0;
  let min = values[0];
  let max = values[0];

  // First pass: sum, min, max
  for (const value of values) {
    sum += value;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  const mean = sum / values.length;

  // Second pass: variance
  let varianceSum = 0;
  for (const value of values) {
    const diff = value - mean;
    varianceSum += diff * diff;
  }

  const variance = varianceSum / values.length;
  const stdDev = Math.sqrt(variance);

  return {
    count: values.length,
    sum,
    mean,
    min,
    max,
    variance,
    stdDev,
  };
}

/**
 * Filter a large dataset based on a predicate function
 */
function filterDataset(items: any[], predicateStr: string): any[] {
  // Create a function from the predicate string
  // This is a simplified version - in production, use a safer approach
  const predicate = new Function('item', `return ${predicateStr}`);
  
  return items.filter((item) => {
    try {
      return predicate(item);
    } catch {
      return false;
    }
  });
}

/**
 * Post a successful response back to the main thread
 */
function postResponse(type: string, data: any, requestId: string) {
  const response: WorkerResponse = {
    type,
    data,
    requestId,
  };
  self.postMessage(response);
}

/**
 * Post an error response back to the main thread
 */
function postError(error: string, requestId: string) {
  const response: WorkerResponse = {
    type: 'ERROR',
    data: null,
    requestId,
    error,
  };
  self.postMessage(response);
}
