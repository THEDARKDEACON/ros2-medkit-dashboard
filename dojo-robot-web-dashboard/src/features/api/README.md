# API Client

This module provides a configured Axios client for communicating with the ros2_medkit REST API Gateway.

## Features

- **Configured Axios Instance**: Pre-configured with base URL, timeout, and headers
- **Request Interceptor**: Automatically adds request IDs for tracing and logs requests in development
- **Response Interceptor**: Handles errors and transforms them to custom error types
- **Custom Error Classes**: `ApiError`, `NetworkError`, and `ValidationError` for better error handling
- **Request ID Generation**: Unique IDs for request tracing and debugging

## Usage

### Basic Usage

```typescript
import { apiClient } from '@/features/api';

// GET request
const response = await apiClient.get('/areas');
console.log(response.data);

// POST request
const result = await apiClient.post('/components/123/operations/456/executions', {
  parameters: { speed: 1.0 }
});

// PUT request
await apiClient.put('/components/123/data/cmd_vel', {
  linear: { x: 1.0, y: 0, z: 0 },
  angular: { x: 0, y: 0, z: 0.5 }
});

// DELETE request
await apiClient.delete('/components/123/operations/456/executions/789');
```

### Error Handling

```typescript
import { apiClient, ApiError, NetworkError, handleApiError } from '@/features/api';

try {
  const response = await apiClient.get('/components/123/data');
  console.log(response.data);
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.statusCode}: ${error.message}`);
    console.error('Response data:', error.data);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
  
  // Or use the helper function for user-friendly messages
  const userMessage = handleApiError(error);
  alert(userMessage);
}
```

### Configuration

The API client uses environment variables for configuration:

- `VITE_API_URL`: Base URL for the API Gateway (default: `http://localhost:8080/api/v1`)

Set these in your `.env` file:

```env
VITE_API_URL=http://localhost:8080/api/v1
```

## Error Types

### ApiError

Thrown when the server responds with an error status code (4xx, 5xx).

Properties:
- `statusCode`: HTTP status code
- `message`: Error message
- `data`: Response data from the server

### NetworkError

Thrown when the request fails to reach the server (network issues, CORS, etc.).

Properties:
- `message`: Error message

### ValidationError

Thrown for validation errors with field-specific messages.

Properties:
- `message`: Error message
- `fields`: Object mapping field names to error messages

## Request Interceptor

The request interceptor:
1. Generates a unique request ID and adds it to the `X-Request-ID` header
2. Logs requests in development mode with timestamp and method/URL

## Response Interceptor

The response interceptor:
1. Passes through successful responses unchanged
2. Transforms error responses into custom error types
3. Logs errors in development mode
4. Extracts error messages from API responses

## Request ID Generation

Each request gets a unique ID in the format: `req_{timestamp}_{random}`

This ID is:
- Added to request headers as `X-Request-ID`
- Useful for tracing requests in logs
- Helps correlate frontend requests with backend logs
