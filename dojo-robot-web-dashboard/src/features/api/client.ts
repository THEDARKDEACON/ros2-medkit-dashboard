/**
 * API client with Axios
 * Configured instance for communicating with ros2_medkit REST API Gateway
 */

import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiError, NetworkError } from './errors';
import { generateRequestId, formatRequestLog, formatErrorLog } from './utils';
import { setupSessionLogging } from './sessionLogger';
import { useConnectionStore } from '../stores/connectionStore';

/**
 * Create and configure Axios instance
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api/v1',
    timeout: 10000, // 10 seconds
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Request interceptor
   * - Adds request ID for tracing
   * - Logs requests in development mode
   */
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Add request ID for tracing
      const requestId = generateRequestId();
      config.headers['X-Request-ID'] = requestId;

      // Log request in development
      if (import.meta.env.DEV) {
        console.log(
          formatRequestLog(
            config.method || 'unknown',
            config.url || 'unknown'
          )
        );
      }

      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  /**
   * Response interceptor
   * - Handles errors and transforms them to custom error types
   * - Logs errors in development mode
   */
  client.interceptors.response.use(
    (response) => {
      // Success response - update connection status
      try {
        const store = useConnectionStore.getState();
        if (store.apiStatus !== 'connected') {
          store.setAPIStatus('connected');
        }
      } catch {
        // Store may not be initialized yet
      }
      return response;
    },
    async (error: AxiosError) => {
      // Update connection status on failure
      try {
        const store = useConnectionStore.getState();
        if (error.code === 'ECONNABORTED' || !error.response) {
          store.setAPIStatus('disconnected');
        }
      } catch {
        // Store may not be initialized yet
      }

      // Log error in development
      if (import.meta.env.DEV) {
        console.error(
          formatErrorLog(
            error.config?.method || 'unknown',
            error.config?.url || 'unknown',
            error.message
          )
        );
      }

      if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;

        // Extract error message from response
        const message =
          (data as { message?: string })?.message ||
          error.message ||
          'Request failed';

        // Throw custom ApiError
        throw new ApiError(status, message, data);
      } else if (error.request) {
        // Request made but no response received
        throw new NetworkError(
          'Unable to reach API Gateway. Please check your connection.'
        );
      } else {
        // Request setup error
        throw new Error(error.message || 'Request configuration error');
      }
    }
  );

  // Setup session logging
  setupSessionLogging(client);

  return client;
};

/**
 * Configured Axios instance for API requests
 */
export const apiClient = createApiClient();

/**
 * Update the API client base URL
 * Used when switching between robot instances
 */
export const updateApiBaseUrl = (baseUrl: string): void => {
  apiClient.defaults.baseURL = baseUrl;
  console.log(`[API] Base URL updated to: ${baseUrl}`);
};

/**
 * Export axios instance type for use in other modules
 */
export type { AxiosInstance };
