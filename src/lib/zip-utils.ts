import { convertToCSV } from './csv-utils';

export interface NormalizedTables {
  reports: any[];
  valuesets: any[];
  originalCodes: any[];
  expandedConcepts: any[];
  failedCodes: any[];
  exceptions: any[];
}

/**
 * Creates a ZIP file containing all normalized tables as CSV files
 * @param data - The normalized tables data
 * @returns Promise that resolves to a Blob containing the ZIP file
 */
export async function createNormalizedDataZip(data: NormalizedTables): Promise<Blob> {
  // Dynamic import of JSZip to reduce initial bundle size
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  // Add each CSV file to the ZIP if it has data
  if (data.reports.length > 0) {
    zip.file('reports.csv', convertToCSV(data.reports));
  }
  if (data.valuesets.length > 0) {
    zip.file('valuesets.csv', convertToCSV(data.valuesets));
  }
  if (data.originalCodes.length > 0) {
    zip.file('original_codes.csv', convertToCSV(data.originalCodes));
  }
  if (data.expandedConcepts.length > 0) {
    zip.file('expanded_concepts.csv', convertToCSV(data.expandedConcepts));
  }
  if (data.failedCodes.length > 0) {
    zip.file('failed_codes.csv', convertToCSV(data.failedCodes));
  }
  if (data.exceptions.length > 0) {
    zip.file('exceptions.csv', convertToCSV(data.exceptions));
  }

  // Generate ZIP file as blob
  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Downloads a ZIP file containing normalized data
 * @param data - The normalized tables data
 * @param filename - Optional filename (defaults to emis-snomed-extract-YYYY-MM-DD.zip)
 */
export async function downloadNormalizedDataZip(
  data: NormalizedTables,
  filename?: string
): Promise<void> {
  try {
    const zipBlob = await createNormalizedDataZip(data);

    // Generate filename if not provided
    const defaultFilename = `emis-snomed-extract-${new Date().toISOString().split('T')[0]}.zip`;
    const finalFilename = filename || defaultFilename;

    // Download ZIP
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error creating ZIP:', error);
    throw new Error('Failed to create ZIP file. Please try again.');
  }
}
