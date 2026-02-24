/**
 * SessionLog component
 * Displays all API requests and responses with filtering and export
 */

import React, { useState, useMemo } from 'react';
import { useSessionLogStore } from '../../features/stores/sessionLogStore';
import type { LogEntry, LogFilter } from '../../features/stores/sessionLogStore';
import { downloadFile, generateFilename } from '../../utils/dataExport';

export const SessionLog: React.FC = () => {
  const { logs, clearLogs, filterLogs, exportLogs } = useSessionLogStore();
  
  const [filter, setFilter] = useState<LogFilter>({});
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Apply filters
  const filteredLogs = useMemo(() => {
    return filterLogs({ ...filter, searchTerm });
  }, [logs, filter, searchTerm, filterLogs]);

  // Handle export
  const handleExport = () => {
    const content = exportLogs();
    const filename = generateFilename('session-log', 'json');
    downloadFile(content, filename, 'application/json');
  };

  // Handle clear
  const handleClear = () => {
    if (confirm('Are you sure you want to clear all logs?')) {
      clearLogs();
      setSelectedLog(null);
    }
  };

  // Get status color
  const getStatusColor = (status?: number): string => {
    if (!status) return 'text-gray-500';
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 300 && status < 400) return 'text-blue-600';
    if (status >= 400 && status < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get type badge color
  const getTypeBadgeColor = (type: string): string => {
    switch (type) {
      case 'request':
        return 'bg-blue-100 text-blue-800';
      case 'response':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex h-full">
      {/* Log list */}
      <div className="w-1/2 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Session Log</h2>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={logs.length === 0}
              >
                Export
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                disabled={logs.length === 0}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
          />

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <select
              value={filter.type || ''}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  type: e.target.value as 'request' | 'response' | 'error' | undefined,
                })
              }
              className="px-2 py-1 text-sm border border-gray-300 rounded"
            >
              <option value="">All Types</option>
              <option value="request">Request</option>
              <option value="response">Response</option>
              <option value="error">Error</option>
            </select>

            <select
              value={filter.method || ''}
              onChange={(e) =>
                setFilter({ ...filter, method: e.target.value || undefined })
              }
              className="px-2 py-1 text-sm border border-gray-300 rounded"
            >
              <option value="">All Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>

            <select
              value={filter.status || ''}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  status: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="px-2 py-1 text-sm border border-gray-300 rounded"
            >
              <option value="">All Status</option>
              <option value="200">200 OK</option>
              <option value="201">201 Created</option>
              <option value="400">400 Bad Request</option>
              <option value="404">404 Not Found</option>
              <option value="500">500 Server Error</option>
            </select>
          </div>

          <div className="mt-2 text-sm text-gray-600">
            Showing {filteredLogs.length} of {logs.length} logs
          </div>
        </div>

        {/* Log entries */}
        <div className="flex-1 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {logs.length === 0 ? 'No logs yet' : 'No logs match the filter'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`p-3 cursor-pointer hover:bg-gray-50 ${
                    selectedLog?.id === log.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${getTypeBadgeColor(
                          log.type
                        )}`}
                      >
                        {log.type.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium">{log.method}</span>
                      {log.status && (
                        <span className={`text-sm font-medium ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      )}
                    </div>
                    {log.duration && (
                      <span className="text-xs text-gray-500">{log.duration}ms</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 truncate">{log.url}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                  {log.error && (
                    <div className="text-xs text-red-600 mt-1 truncate">{log.error}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Log detail */}
      <div className="w-1/2 flex flex-col bg-gray-50">
        {selectedLog ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-white">
              <h3 className="text-lg font-semibold mb-2">Log Details</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">ID:</span> {selectedLog.id}
                </div>
                <div>
                  <span className="font-medium">Timestamp:</span>{' '}
                  {new Date(selectedLog.timestamp).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {selectedLog.type}
                </div>
                <div>
                  <span className="font-medium">Method:</span> {selectedLog.method}
                </div>
                <div>
                  <span className="font-medium">URL:</span> {selectedLog.url}
                </div>
                {selectedLog.status && (
                  <div>
                    <span className="font-medium">Status:</span>{' '}
                    <span className={getStatusColor(selectedLog.status)}>
                      {selectedLog.status} {selectedLog.statusText}
                    </span>
                  </div>
                )}
                {selectedLog.duration && (
                  <div>
                    <span className="font-medium">Duration:</span> {selectedLog.duration}ms
                  </div>
                )}
                {selectedLog.error && (
                  <div>
                    <span className="font-medium text-red-600">Error:</span>{' '}
                    <span className="text-red-600">{selectedLog.error}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Request Headers */}
              {selectedLog.requestHeaders && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Request Headers</h4>
                  <pre className="bg-white p-3 rounded border border-gray-200 text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.requestHeaders, null, 2)}
                  </pre>
                </div>
              )}

              {/* Request Body */}
              {selectedLog.requestBody !== undefined && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Request Body</h4>
                  <pre className="bg-white p-3 rounded border border-gray-200 text-xs overflow-x-auto">
                    {typeof selectedLog.requestBody === 'string'
                      ? selectedLog.requestBody
                      : JSON.stringify(selectedLog.requestBody, null, 2)}
                  </pre>
                </div>
              )}

              {/* Response Headers */}
              {selectedLog.responseHeaders && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Response Headers</h4>
                  <pre className="bg-white p-3 rounded border border-gray-200 text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.responseHeaders, null, 2)}
                  </pre>
                </div>
              )}

              {/* Response Body */}
              {selectedLog.responseBody !== undefined && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Response Body</h4>
                  <pre className="bg-white p-3 rounded border border-gray-200 text-xs overflow-x-auto">
                    {typeof selectedLog.responseBody === 'string'
                      ? selectedLog.responseBody
                      : JSON.stringify(selectedLog.responseBody, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a log entry to view details
          </div>
        )}
      </div>
    </div>
  );
};
