/**
 * Escapes a value for CSV format
 * Handles commas, quotes, and newlines
 */
export function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Quote if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts an array of objects to CSV format
 * @param data - Array of objects to convert
 * @param headers - Optional array of header names (defaults to object keys from first row)
 * @returns CSV string
 */
export function convertToCSV(data: any[], headers?: string[]): string {
  if (data.length === 0) return '';

  // Use provided headers or extract from first object
  const csvHeaders = headers || Object.keys(data[0]);

  // Create header row
  const headerRow = csvHeaders.map(h => escapeCSV(h)).join(',');

  // Create data rows
  const dataRows = data.map(row =>
    csvHeaders.map(header => escapeCSV(row[header])).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Downloads a string as a file
 * @param content - File content
 * @param filename - Name for the downloaded file
 * @param mimeType - MIME type (defaults to CSV)
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/csv;charset=utf-8;'
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
