/**
 * Data export utilities for topic data, fault history, and parameters
 * Supports JSON, CSV, and YAML formats with metadata
 */

interface ExportMetadata {
  timestamp: string;
  exportedBy: string;
  version: string;
  source: string;
}

interface TopicDataExport {
  metadata: ExportMetadata;
  topicName: string;
  messageType: string;
  data: unknown[];
}

/**
 * Generate export metadata
 */
function generateMetadata(source: string): ExportMetadata {
  return {
    timestamp: new Date().toISOString(),
    exportedBy: 'Dojo Robot Dashboard',
    version: '1.0',
    source,
  };
}

/**
 * Export topic data as JSON
 * @param topicName - Name of the topic
 * @param messageType - Message type of the topic
 * @param data - Array of topic data points
 * @returns JSON string with metadata
 */
export function exportToJSON(
  topicName: string,
  messageType: string,
  data: unknown[]
): string {
  const exportData: TopicDataExport = {
    metadata: generateMetadata(`topic:${topicName}`),
    topicName,
    messageType,
    data,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export fault history as CSV
 * @param faults - Array of fault objects
 * @returns CSV string with headers and metadata
 */
export function exportToCSV(
  faults: Array<{
    code: string;
    message: string;
    severity: string;
    componentId: string;
    timestamp: string;
    [key: string]: unknown;
  }>
): string {
  const metadata = generateMetadata('fault-history');

  // Build CSV with metadata header
  const lines: string[] = [];

  // Add metadata as comments
  lines.push(`# Exported By: ${metadata.exportedBy}`);
  lines.push(`# Export Timestamp: ${metadata.timestamp}`);
  lines.push(`# Version: ${metadata.version}`);
  lines.push(`# Source: ${metadata.source}`);
  lines.push('');

  // Add CSV headers
  if (faults.length === 0) {
    lines.push('code,message,severity,componentId,timestamp');
    return lines.join('\n');
  }

  // Get all unique keys from all faults
  const allKeys = new Set<string>();
  faults.forEach(fault => {
    Object.keys(fault).forEach(key => allKeys.add(key));
  });

  const headers = Array.from(allKeys);
  lines.push(headers.join(','));

  // Add data rows
  faults.forEach(fault => {
    const row = headers.map(header => {
      const value = fault[header];

      // Handle different value types
      if (value === null || value === undefined) {
        return '';
      }

      // Escape strings containing commas, quotes, or special characters
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.startsWith('#')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    });

    lines.push(row.join(','));
  });

  return lines.join('\n');
}

/**
 * Export parameters as YAML
 * @param parameters - Object containing parameter key-value pairs
 * @param namespace - Optional namespace for the parameters
 * @returns YAML string with metadata
 */
export function exportToYAML(
  parameters: Record<string, unknown>,
  namespace?: string
): string {
  const metadata = generateMetadata(namespace ? `parameters:${namespace}` : 'parameters');

  const lines: string[] = [];

  // Add metadata section
  lines.push('# Metadata');
  lines.push(`exported_by: "${metadata.exportedBy}"`);
  lines.push(`timestamp: "${metadata.timestamp}"`);
  lines.push(`version: "${metadata.version}"`);
  lines.push(`source: "${metadata.source}"`);
  lines.push('');

  // Add parameters section
  lines.push('# Parameters');
  lines.push('parameters:');

  // Convert parameters to YAML format
  Object.entries(parameters).forEach(([key, value]) => {
    lines.push(`  ${key}: ${formatYAMLValue(value, 2)}`);
  });

  return lines.join('\n');
}

/**
 * Format a value for YAML output
 */
function formatYAMLValue(value: unknown, indent: number): string {
  const indentStr = ' '.repeat(indent);

  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'boolean') {
    return String(value);
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'string') {
    // Escape strings that need quotes
    if (value.includes('\n') || value.includes(':') || value.includes('#')) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return `"${value}"`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }

    const items = value.map(item => `\n${indentStr}- ${formatYAMLValue(item, indent + 2)}`);
    return items.join('');
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return '{}';
    }

    const items = entries.map(
      ([k, v]) => `\n${indentStr}${k}: ${formatYAMLValue(v, indent + 2)}`
    );
    return items.join('');
  }

  return String(value);
}

/**
 * Trigger browser download of exported data
 * @param content - File content
 * @param filename - Name of the file to download
 * @param mimeType - MIME type of the file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp
 * @param prefix - Filename prefix
 * @param extension - File extension (without dot)
 * @returns Filename with timestamp
 */
export function generateFilename(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}_${timestamp}.${extension}`;
}
