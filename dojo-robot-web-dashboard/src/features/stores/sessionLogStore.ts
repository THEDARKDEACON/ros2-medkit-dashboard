/**
 * Session log store for tracking API requests and responses
 * Stores all HTTP requests/responses for debugging and export
 */

import { create } from 'zustand';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'error';
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  requestHeaders?: Record<string, string>;
  requestBody?: unknown;
  responseHeaders?: Record<string, string>;
  responseBody?: unknown;
  error?: string;
  duration?: number;
}

interface SessionLogState {
  logs: LogEntry[];
  maxLogs: number;
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
  filterLogs: (filter: LogFilter) => LogEntry[];
  exportLogs: () => string;
}

export interface LogFilter {
  type?: 'request' | 'response' | 'error';
  method?: string;
  status?: number;
  searchTerm?: string;
}

export const useSessionLogStore = create<SessionLogState>((set, get) => ({
  logs: [],
  maxLogs: 1000, // Keep last 1000 logs

  addLog: (log: LogEntry) =>
    set((state) => {
      const newLogs = [...state.logs, log];
      // Keep only the last maxLogs entries
      if (newLogs.length > state.maxLogs) {
        return { logs: newLogs.slice(-state.maxLogs) };
      }
      return { logs: newLogs };
    }),

  clearLogs: () => set({ logs: [] }),

  filterLogs: (filter: LogFilter) => {
    const { logs } = get();
    return logs.filter((log) => {
      // Filter by type
      if (filter.type && log.type !== filter.type) {
        return false;
      }

      // Filter by method
      if (filter.method && log.method !== filter.method) {
        return false;
      }

      // Filter by status
      if (filter.status && log.status !== filter.status) {
        return false;
      }

      // Filter by search term
      if (filter.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        const matchesUrl = log.url.toLowerCase().includes(searchLower);
        const matchesError = log.error?.toLowerCase().includes(searchLower);
        const matchesBody = JSON.stringify(log.responseBody || log.requestBody)
          .toLowerCase()
          .includes(searchLower);

        if (!matchesUrl && !matchesError && !matchesBody) {
          return false;
        }
      }

      return true;
    });
  },

  exportLogs: () => {
    const { logs } = get();
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalLogs: logs.length,
      logs: logs,
    };
    return JSON.stringify(exportData, null, 2);
  },
}));
