/**
 * Example usage of the API client
 * This file demonstrates how to use the API client and is not part of the production code
 */

import { apiClient, ApiError, NetworkError, ValidationError, handleApiError } from './index';

/**
 * Example: Fetch all areas
 */
export async function fetchAreas() {
  try {
    const response = await apiClient.get('/areas');
    console.log('Areas:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch areas:', handleApiError(error));
    throw error;
  }
}

/**
 * Example: Fetch components for an area
 */
export async function fetchAreaComponents(areaId: string) {
  try {
    const response = await apiClient.get(`/areas/${areaId}/components`);
    console.log('Components:', response.data);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.statusCode === 404) {
        console.error('Area not found');
      } else {
        console.error('API error:', error.message);
      }
    } else if (error instanceof NetworkError) {
      console.error('Network error - cannot reach API Gateway');
    }
    throw error;
  }
}

/**
 * Example: Publish topic data
 */
export async function publishTopicData(
  componentId: string,
  topicName: string,
  message: unknown
) {
  try {
    const response = await apiClient.put(
      `/components/${componentId}/data/${topicName}`,
      message
    );
    console.log('Published successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to publish:', handleApiError(error));
    throw error;
  }
}

/**
 * Example: Execute an operation
 */
export async function executeOperation(
  componentId: string,
  operationId: string,
  parameters: Record<string, unknown>
) {
  try {
    const response = await apiClient.post(
      `/components/${componentId}/operations/${operationId}/executions`,
      { parameters }
    );
    console.log('Operation executed:', response.data);
    return response.data;
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error('Validation errors:', error.fields);
    }
    throw error;
  }
}

/**
 * Example: Update a parameter
 */
export async function updateParameter(
  componentId: string,
  paramName: string,
  value: unknown
) {
  try {
    const response = await apiClient.put(
      `/components/${componentId}/configurations/${paramName}`,
      { value }
    );
    console.log('Parameter updated:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to update parameter:', handleApiError(error));
    throw error;
  }
}

/**
 * Example: Fetch faults
 */
export async function fetchFaults() {
  try {
    const response = await apiClient.get('/faults');
    console.log('Faults:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch faults:', handleApiError(error));
    throw error;
  }
}

/**
 * Example: Demonstrating request ID in headers
 * The request ID is automatically added by the interceptor
 */
export async function demonstrateRequestId() {
  // The interceptor will add X-Request-ID header automatically
  const response = await apiClient.get('/areas');
  
  // In development mode, you'll see the request logged with:
  // [timestamp] GET /areas
  
  // If an error occurs, you'll see it logged with:
  // [timestamp] GET /areas - Error: {error message}
  
  return response.data;
}
