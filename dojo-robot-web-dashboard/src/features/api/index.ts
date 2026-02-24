/**
 * API client module exports
 */

export { apiClient } from './client';
export type { AxiosInstance } from './client';
export { ApiError, NetworkError, ValidationError, handleApiError } from './errors';
export { generateRequestId } from './utils';
export { useAreas, useComponents, useAreaComponents } from './hooks';
