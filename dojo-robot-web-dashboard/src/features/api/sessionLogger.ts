/**
 * Session logger for API requests and responses
 * Integrates with Axios interceptors to capture all HTTP traffic
 */

import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useSessionLogStore } from '../stores/sessionLogStore';
import type { LogEntry } from '../stores/sessionLogStore';

// Store request start times for duration calculation
const requestTimings = new Map<string, number>();

/**
 * Setup session logging interceptors on an Axios instance
 */
export function setupSessionLogging(client: AxiosInstance): void {
  // Request interceptor
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const requestId = config.headers['X-Request-ID'] as string;
      
      // Store request start time
      requestTimings.set(requestId, Date.now());

      // Create log entry for request
      const logEntry: LogEntry = {
        id: requestId,
        timestamp: new Date().toISOString(),
        type: 'request',
        method: (config.method || 'GET').toUpperCase(),
        url: config.url || '',
        requestHeaders: config.headers as Record<string, string>,
        requestBody: config.data,
      };

      // Add to session log
      useSessionLogStore.getState().addLog(logEntry);

      return config;
    },
    (error: AxiosError) => {
      // Log request error
      const requestId = error.config?.headers?.['X-Request-ID'] as string;
      
      const logEntry: LogEntry = {
        id: requestId || `error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'error',
        method: (error.config?.method || 'UNKNOWN').toUpperCase(),
        url: error.config?.url || 'unknown',
        error: error.message,
      };

      useSessionLogStore.getState().addLog(logEntry);

      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      const requestId = response.config.headers['X-Request-ID'] as string;
      const startTime = requestTimings.get(requestId);
      const duration = startTime ? Date.now() - startTime : undefined;

      // Clean up timing
      if (requestId) {
        requestTimings.delete(requestId);
      }

      // Create log entry for response
      const logEntry: LogEntry = {
        id: `${requestId}-response`,
        timestamp: new Date().toISOString(),
        type: 'response',
        method: (response.config.method || 'GET').toUpperCase(),
        url: response.config.url || '',
        status: response.status,
        statusText: response.statusText,
        responseHeaders: response.headers as Record<string, string>,
        responseBody: response.data,
        duration,
      };

      // Add to session log
      useSessionLogStore.getState().addLog(logEntry);

      return response;
    },
    (error: AxiosError) => {
      const requestId = error.config?.headers?.['X-Request-ID'] as string;
      const startTime = requestId ? requestTimings.get(requestId) : undefined;
      const duration = startTime ? Date.now() - startTime : undefined;

      // Clean up timing
      if (requestId) {
        requestTimings.delete(requestId);
      }

      // Create log entry for error response
      const logEntry: LogEntry = {
        id: `${requestId}-error`,
        timestamp: new Date().toISOString(),
        type: 'error',
        method: (error.config?.method || 'UNKNOWN').toUpperCase(),
        url: error.config?.url || 'unknown',
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseHeaders: error.response?.headers as Record<string, string>,
        responseBody: error.response?.data,
        error: error.message,
        duration,
      };

      // Add to session log
      useSessionLogStore.getState().addLog(logEntry);

      return Promise.reject(error);
    }
  );
}
