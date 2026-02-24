/**
 * API type definitions
 * Core domain types for the ros2_medkit REST API Gateway
 */

/**
 * Area represents a logical grouping of components
 */
export interface Area {
  id: string;
  name: string;
  description?: string;
  componentCount: number;
}

/**
 * Component represents a ROS2 component/node
 */
export interface Component {
  id: string;
  name: string;
  identifier: string;
  areaId: string;
  status: 'active' | 'inactive' | 'error';
  metadata?: Record<string, unknown>;
}

/**
 * Topic represents a ROS2 topic
 */
export interface Topic {
  name: string;
  messageType: string;
  publishRate: number;
  lastUpdate: string;
  data: unknown;
}

/**
 * Operation represents a ROS2 service or action
 */
export interface Operation {
  id: string;
  name: string;
  type: 'service' | 'action';
  parameters: ParameterDefinition[];
  description?: string;
}

/**
 * Parameter definition for operations
 */
export interface ParameterDefinition {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  default?: unknown;
}

/**
 * Execution represents an operation execution instance
 */
export interface Execution {
  id: string;
  operationId: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  progress?: number;
  feedback?: unknown;
  result?: unknown;
  error?: string;
  startTime: string;
  endTime?: string;
}

/**
 * Parameter represents a ROS2 parameter
 */
export interface Parameter {
  name: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  constraints?: ParameterConstraints;
  namespace?: string;
}

/**
 * Parameter constraints for validation
 */
export interface ParameterConstraints {
  min?: number;
  max?: number;
  enum?: unknown[];
  pattern?: string;
}

/**
 * Fault represents a system fault/error
 */
export interface Fault {
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  componentId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Fault snapshot with system state
 */
export interface FaultSnapshot {
  faultCode: string;
  timestamp: string;
  systemState: Record<string, unknown>;
  topicData: Record<string, unknown>;
}
