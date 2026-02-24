/**
 * Utility functions for API client
 */

/**
 * Generate a unique request ID for tracing
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format API error message for logging
 */
export function formatErrorLog(
  method: string,
  url: string,
  error: unknown
): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] ${method.toUpperCase()} ${url} - Error: ${error}`;
}

/**
 * Format API request for logging
 */
export function formatRequestLog(method: string, url: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] ${method.toUpperCase()} ${url}`;
}
