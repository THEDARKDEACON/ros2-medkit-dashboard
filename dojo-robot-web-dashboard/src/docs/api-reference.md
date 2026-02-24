# API Reference

This dashboard communicates with the ros2_medkit REST API Gateway. Below are the key endpoints used.

## Base URL

```
http://localhost:8080/api/v1
```

Configure the API URL in your environment or robot settings.

## Areas and Components

### List All Areas

```http
GET /api/v1/areas
```

**Response:**
```json
[
  {
    "id": "navigation",
    "name": "Navigation",
    "description": "Navigation and localization components",
    "componentCount": 5
  }
]
```

### List Components in an Area

```http
GET /api/v1/areas/{area_id}/components
```

**Response:**
```json
[
  {
    "id": "nav_001",
    "name": "Path Planner",
    "identifier": "/navigation/planner",
    "areaId": "navigation",
    "status": "active"
  }
]
```

## Topic Data

### Get Topic Data

```http
GET /api/v1/components/{component_id}/data/{topic_name}
```

**Example:**
```http
GET /api/v1/components/nav_001/data/cmd_vel
```

**Response:**
```json
{
  "linear": { "x": 0.5, "y": 0.0, "z": 0.0 },
  "angular": { "x": 0.0, "y": 0.0, "z": 0.2 }
}
```

### Publish Topic Data

```http
PUT /api/v1/components/{component_id}/data/{topic_name}
```

**Request Body:**
```json
{
  "linear": { "x": 1.0, "y": 0.0, "z": 0.0 },
  "angular": { "x": 0.0, "y": 0.0, "z": 0.5 }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message published successfully"
}
```

## Operations

### List Operations

```http
GET /api/v1/components/{component_id}/operations
```

**Response:**
```json
[
  {
    "id": "start_mapping",
    "name": "Start Mapping",
    "type": "action",
    "parameters": [
      {
        "name": "resolution",
        "type": "number",
        "required": false,
        "default": 0.05
      }
    ]
  }
]
```

### Execute Operation

```http
POST /api/v1/components/{component_id}/operations/{operation_id}/executions
```

**Request Body:**
```json
{
  "parameters": {
    "resolution": 0.05
  }
}
```

**Response:**
```json
{
  "id": "exec_123",
  "operationId": "start_mapping",
  "status": "running",
  "startTime": "2024-01-15T10:30:00Z"
}
```

### Get Execution Status

```http
GET /api/v1/components/{component_id}/operations/{operation_id}/executions/{execution_id}
```

**Response:**
```json
{
  "id": "exec_123",
  "status": "running",
  "progress": 45,
  "feedback": {
    "current_area": "room_1",
    "cells_mapped": 1250
  }
}
```

### Cancel Execution

```http
DELETE /api/v1/components/{component_id}/operations/{operation_id}/executions/{execution_id}
```

## Parameters

### List Parameters

```http
GET /api/v1/components/{component_id}/configurations
```

**Response:**
```json
[
  {
    "name": "max_velocity",
    "value": 1.5,
    "type": "number",
    "description": "Maximum linear velocity in m/s",
    "namespace": "navigation"
  }
]
```

### Get Parameter Details

```http
GET /api/v1/components/{component_id}/configurations/{param_name}
```

**Response:**
```json
{
  "name": "max_velocity",
  "value": 1.5,
  "type": "number",
  "description": "Maximum linear velocity in m/s",
  "constraints": {
    "min": 0.1,
    "max": 3.0
  }
}
```

### Update Parameter

```http
PUT /api/v1/components/{component_id}/configurations/{param_name}
```

**Request Body:**
```json
{
  "value": 2.0
}
```

### Reset Parameter

```http
DELETE /api/v1/components/{component_id}/configurations/{param_name}
```

## Faults

### List Current Faults

```http
GET /api/v1/faults
```

**Response:**
```json
[
  {
    "code": "NAV_001",
    "message": "Path planning failed",
    "severity": "error",
    "componentId": "nav_001",
    "timestamp": "2024-01-15T10:30:00Z"
  }
]
```

### Get Fault Snapshots

```http
GET /api/v1/faults/{fault_code}/snapshots
```

**Response:**
```json
[
  {
    "faultCode": "NAV_001",
    "timestamp": "2024-01-15T10:30:00Z",
    "systemState": {
      "robot_pose": { "x": 5.2, "y": 3.1, "theta": 1.57 }
    }
  }
]
```

### Download Fault Rosbag

```http
GET /api/v1/faults/{fault_code}/snapshots/bag
```

Downloads a rosbag file containing data from the fault occurrence.

## Real-time Streaming

### Server-Sent Events (SSE)

Connect to the SSE endpoint for real-time fault updates:

```http
GET /api/v1/stream/faults
```

**Event Format:**
```
event: fault
data: {"code":"NAV_001","message":"Path planning failed","severity":"error"}
```

### WebSocket

Connect to the WebSocket endpoint for bidirectional real-time communication:

```
ws://localhost:8080/ws
```

**Subscribe to Events:**
```json
{
  "type": "subscribe",
  "event": "topic_update"
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Not Found",
  "message": "Component with ID 'invalid_id' not found",
  "statusCode": 404
}
```

Common status codes:
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error
- `503` - Service Unavailable (API Gateway disconnected)
