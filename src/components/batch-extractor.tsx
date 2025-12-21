'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppMode } from '@/contexts/AppModeContext';
import { EmisReport, ExpandedCodeSet } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Package, Download, FileText, X, Loader2, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { loadParsedXmlData } from '@/lib/storage';
import { ExtractionFileList } from '@/components/extraction-file-list';
import { ExtractionDataModel } from '@/components/extraction-data-model';

interface ProcessingStatus {
  currentReport: number;
  totalReports: number;
  reportName: string;
  currentValueSet: number;
  totalValueSets: number;
  message: string;
}

interface NormalizedTables {
  reports: any[];
  valuesets: any[];
  originalCodes: any[];
  expandedConcepts: any[];
  failedCodes: any[];
  exceptions: any[];
}

export default function BatchExtractor() {
  const { selectedReportIds, toggleReportSelection } = useAppMode();
  const [reports, setReports] = useState<EmisReport[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const cancellationRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [extractedData, setExtractedData] = useState<NormalizedTables | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const valuesetTimesRef = useRef<number[]>([]);
  const lastRemainingTimeCalcRef = useRef<number | null>(null);

  // Load existing parsed data on mount
  useEffect(() => {
    loadParsedXmlData()
      .then((minimalData) => {
        if (minimalData && minimalData.reports) {
          setReports(minimalData.reports);
        }
      })
      .catch((error) => {
        console.error('Failed to load stored data:', error);
      });
  }, []);

  useEffect(() => {
    const handleXmlParsed = (event: Event) => {
      const customEvent = event as CustomEvent;
      const parsedData = customEvent.detail;
      setReports(parsedData.reports || []);
    };

    const handleXmlCleared = () => {
      setReports([]);
      setStatus('idle');
      setProgress(0);
    };

    window.addEventListener('xml-parsed', handleXmlParsed);
    window.addEventListener('xml-cleared', handleXmlCleared);

    return () => {
      window.removeEventListener('xml-parsed', handleXmlParsed);
      window.removeEventListener('xml-cleared', handleXmlCleared);
    };
  }, []);

  const selectedReports = reports.filter((r) => selectedReportIds.has(r.id));
  const totalValueSets = selectedReports.reduce((sum, r) => sum + r.valueSets.length, 0);

  // Timer effect
  useEffect(() => {
    if (status !== 'processing' || !startTime) {
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);

      // Calculate remaining time based on average time per valueset
      if (processingStatus && valuesetTimesRef.current.length > 0) {
        const avgTimePerValueSet = valuesetTimesRef.current.reduce((a, b) => a + b, 0) / valuesetTimesRef.current.length;
        const totalValueSets = selectedReports.reduce((sum, r) => sum + r.valueSets.length, 0);
        
        // Calculate completed valuesets: all in previous reports + current valueset (minus 1 since we're currently processing it)
        let completedValueSets = 0;
        for (let i = 0; i < processingStatus.currentReport - 1; i++) {
          completedValueSets += selectedReports[i]?.valueSets.length || 0;
        }
        completedValueSets += processingStatus.currentValueSet - 1; // -1 because we're currently processing this one
        
        const remainingValueSets = totalValueSets - completedValueSets;
        if (remainingValueSets > 0) {
          const estimatedSecondsRemaining = Math.ceil(remainingValueSets * avgTimePerValueSet);
          
          // Only recalculate if we don't have a value yet, or if the valueset count has changed (new timing data)
          const currentValuesetCount = valuesetTimesRef.current.length;
          if (lastRemainingTimeCalcRef.current === null || 
              lastRemainingTimeCalcRef.current !== currentValuesetCount) {
            setRemainingTime(Math.max(0, estimatedSecondsRemaining));
            lastRemainingTimeCalcRef.current = currentValuesetCount;
          } else {
            // Count down the existing estimate
            setRemainingTime((prev) => prev !== null ? Math.max(0, prev - 1) : null);
          }
        } else {
          setRemainingTime(0);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status, startTime, processingStatus, selectedReports]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExtract = async () => {
    if (selectedReports.length === 0) return;

    setIsExtracting(true);
    cancellationRef.current = false;
    setStatus('processing');
    setProgress(0);
    setErrorMessage('');
    setStartTime(Date.now());
    setElapsedTime(0);
    setRemainingTime(null);
    valuesetTimesRef.current = [];
    lastRemainingTimeCalcRef.current = null;

    const normalizedData: NormalizedTables = {
      reports: [],
      valuesets: [],
      originalCodes: [],
      expandedConcepts: [],
      failedCodes: [],
      exceptions: [],
    };

    try {
      const totalReports = selectedReports.length;
      let completedReports = 0;

      for (const report of selectedReports) {
        // Check if extraction was cancelled
        if (cancellationRef.current) {
          setStatus('idle');
          setProcessingStatus(null);
          setIsExtracting(false);
          return;
        }
        completedReports++;
        const totalValueSets = report.valueSets.length;

        // Add report row to reports table
        normalizedData.reports.push({
          report_id: report.id,
          report_name: report.name,
          search_name: report.searchName,
          folder_path: report.rule,
          xml_file_name: report.rule.split(' > ')[0] || 'unknown.xml',
          parsed_at: new Date().toISOString(),
        });

        // Process each ValueSet in the report
        let completedValueSets = 0;

        for (const [vsIndex, vs] of report.valueSets.entries()) {
          completedValueSets++;
          const valueSetStartTime = Date.now();

          setProcessingStatus({
            currentReport: completedReports,
            totalReports,
            reportName: report.searchName,
            currentValueSet: completedValueSets,
            totalValueSets,
            message: `Processing ValueSet ${completedValueSets} of ${totalValueSets}`,
          });

          // Prepare data for API call
          const parentCodes: string[] = [];
          const displayNames: string[] = [];
          const includeChildren: boolean[] = [];
          const isRefset: boolean[] = [];
          const codeSystems: string[] = [];
          const vsExcludedCodes: string[] = [];

          vs.values.forEach((v) => {
            parentCodes.push(v.code);
            displayNames.push(v.displayName || v.code);
            includeChildren.push(v.includeChildren);
            isRefset.push(v.isRefset || false);
            codeSystems.push(vs.codeSystem || 'EMISINTERNAL');
          });

          vs.exceptions.forEach((e) => {
            vsExcludedCodes.push(e.code);
          });

          const valueSetMapping = [{
            valueSetId: vs.id,
            valueSetIndex: vsIndex,
            codeIndices: parentCodes.map((_, idx) => idx),
            excludedCodes: vsExcludedCodes,
          }];

          // Check if extraction was cancelled before each API call
          if (cancellationRef.current) {
            setStatus('idle');
            setProcessingStatus(null);
            setIsExtracting(false);
            return;
          }

          try {
            // Make API call for this ValueSet
            const response = await fetch('/api/terminology/expand', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                featureId: report.id,
                featureName: report.name,
                parentCodes,
                displayNames,
                excludedCodes: vsExcludedCodes,
                includeChildren,
                isRefset,
                codeSystems,
                valueSetMapping,
              }),
            });

            const result = await response.json();

            if (result.success && result.data && result.data.valueSetGroups) {
              const group = result.data.valueSetGroups[0];

              if (group) {
                // Add valueset row
                normalizedData.valuesets.push({
                  valueset_id: group.valueSetId,
                  report_id: report.id,
                  valueset_index: group.valueSetIndex,
                  valueset_hash: group.valueSetHash,
                  valueset_friendly_name: group.valueSetFriendlyName,
                  code_system: group.originalCodes?.[0]?.codeSystem || '',
                  expansion_error: group.expansionError || '',
                  expanded_at: result.data.expandedAt,
                });

                // Add original codes
                group.originalCodes?.forEach((oc: any, idx: number) => {
                  normalizedData.originalCodes.push({
                    original_code_id: `${group.valueSetId}-oc${idx}`,
                    valueset_id: group.valueSetId,
                    original_code: oc.originalCode,
                    display_name: oc.displayName,
                    code_system: oc.codeSystem,
                    include_children: oc.includeChildren || false,
                    is_refset: oc.isRefset || false,
                    translated_to_snomed_code: oc.translatedTo || '',
                    translated_to_display: oc.translatedToDisplay || '',
                  });
                });

                // Add expanded concepts
                group.concepts?.forEach((concept: any, idx: number) => {
                  normalizedData.expandedConcepts.push({
                    concept_id: `${group.valueSetId}-c${idx}`,
                    valueset_id: group.valueSetId,
                    snomed_code: concept.code,
                    display: concept.display,
                    source: 'terminology_server',
                    exclude_children: concept.excludeChildren || false,
                    is_refset: concept.isRefset || false,
                  });
                });

                // Add failed codes
                group.failedCodes?.forEach((failed: any, idx: number) => {
                  normalizedData.failedCodes.push({
                    failed_code_id: `${group.valueSetId}-failed${idx}`,
                    valueset_id: group.valueSetId,
                    original_code: failed.originalCode,
                    display_name: failed.displayName,
                    code_system: failed.codeSystem,
                    reason: failed.reason,
                  });
                });

                // Add exceptions
                vs.exceptions.forEach((exception, excIdx) => {
                  normalizedData.exceptions.push({
                    exception_id: `${group.valueSetId}-exc${excIdx}`,
                    valueset_id: group.valueSetId,
                    excluded_code: exception.code,
                  });
                });
              }
            }
          } catch (error) {
            console.error(`Error expanding ValueSet ${vsIndex} in report ${report.name}:`, error);
            // Continue processing other ValueSets even if one fails
          }

          // Track time for this valueset
          const valueSetTime = (Date.now() - valueSetStartTime) / 1000; // in seconds
          valuesetTimesRef.current.push(valueSetTime);
          // Keep only last 50 valuesets for rolling average
          if (valuesetTimesRef.current.length > 50) {
            valuesetTimesRef.current.shift();
          }

          // Update progress
          const totalProgress = ((completedReports - 1) / totalReports + (completedValueSets / totalValueSets) / totalReports) * 100;
          setProgress(Math.round(totalProgress));
        }
      }

      setExtractedData(normalizedData);
      setStatus('completed');
      setProcessingStatus(null);
    } catch (error) {
      if (!cancellationRef.current) {
        console.error('Batch extraction error:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
        setProcessingStatus(null);
      }
    } finally {
      setIsExtracting(false);
      cancellationRef.current = false;
      setStartTime(null);
      setElapsedTime(0);
      setRemainingTime(null);
      valuesetTimesRef.current = [];
      lastRemainingTimeCalcRef.current = null;
    }
  };

  const handleCancel = () => {
    cancellationRef.current = true;
    setStatus('idle');
    setProcessingStatus(null);
    setIsExtracting(false);
    setProgress(0);
    setStartTime(null);
    setElapsedTime(0);
    setRemainingTime(null);
    valuesetTimesRef.current = [];
    lastRemainingTimeCalcRef.current = null;
  };

  const convertToCSV = (data: any[], headers?: string[]): string => {
    if (data.length === 0) return '';

    // Use provided headers or extract from first object
    const csvHeaders = headers || Object.keys(data[0]);

    // Escape and quote CSV values
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      // Quote if contains comma, quote, or newline
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Create header row
    const headerRow = csvHeaders.map(h => escapeCSV(h)).join(',');

    // Create data rows
    const dataRows = data.map(row =>
      csvHeaders.map(header => escapeCSV(row[header])).join(',')
    );

    return [headerRow, ...dataRows].join('\n');
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadZIP = async () => {
    if (!extractedData) return;

    try {
      // Dynamic import of JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Add each CSV file to the ZIP
      if (extractedData.reports.length > 0) {
        zip.file('reports.csv', convertToCSV(extractedData.reports));
      }
      if (extractedData.valuesets.length > 0) {
        zip.file('valuesets.csv', convertToCSV(extractedData.valuesets));
      }
      if (extractedData.originalCodes.length > 0) {
        zip.file('original_codes.csv', convertToCSV(extractedData.originalCodes));
      }
      if (extractedData.expandedConcepts.length > 0) {
        zip.file('expanded_concepts.csv', convertToCSV(extractedData.expandedConcepts));
      }
      if (extractedData.failedCodes.length > 0) {
        zip.file('failed_codes.csv', convertToCSV(extractedData.failedCodes));
      }
      if (extractedData.exceptions.length > 0) {
        zip.file('exceptions.csv', convertToCSV(extractedData.exceptions));
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Download ZIP
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `emis-snomed-extract-${new Date().toISOString().split('T')[0]}.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating ZIP:', error);
      alert('Failed to create ZIP file. Please try again.');
    }
  };

  // No XML loaded
  if (reports.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-full p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold mb-2">No XML File Loaded</h3>
                <p className="text-sm text-muted-foreground">
                  Upload an XML file from the sidebar to get started with batch extraction
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No reports selected
  if (selectedReports.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-full p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Package className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold mb-2">No Reports Selected</h3>
                <p className="text-sm text-muted-foreground">
                  Select one or more reports from the sidebar to begin batch extraction
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 w-full max-w-full min-w-0">
      {/* Selected Reports & Extract Action */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Selected Reports</h2>
            <Badge variant="secondary">{selectedReports.length}</Badge>
          </div>
          {status === 'idle' && (
            <Button
              onClick={handleExtract}
              disabled={isExtracting}
              size="lg"
            >
              <Package className="mr-2 h-4 w-4" />
              Extract All Tables
            </Button>
          )}
        </div>
        
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {selectedReports.map((report) => (
              <div
                key={report.id}
                className="flex items-start justify-between gap-3 p-2 rounded-md bg-background hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{report.searchName}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {report.valueSets.length} ValueSet{report.valueSets.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 flex-shrink-0"
                  onClick={() => toggleReportSelection(report.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        
        {status === 'idle' && (
          <p className="text-sm text-muted-foreground">
            This will expand SNOMED codes for all selected reports and generate normalised tables ready for Snowflake import.
          </p>
        )}
      </div>

      {/* Processing Status */}
      {status === 'processing' && processingStatus && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">Extracting Reports</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Report {processingStatus.currentReport} of {processingStatus.totalReports}: {processingStatus.reportName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {processingStatus.message}
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancel}
                  className="gap-2 flex-shrink-0"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Overall Progress</span>
                  <span className="text-xs font-medium">{Math.round(progress)}%</span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <div 
                    className="h-full bg-blue-600 dark:bg-blue-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Elapsed: {formatTime(elapsedTime)}</span>
                  {remainingTime !== null && (
                    <span>Remaining: {formatTime(remainingTime)}</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Status */}
      {status === 'completed' && extractedData && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900">Extraction Complete</h3>
                  <p className="text-sm text-green-700">
                    Successfully processed {selectedReports.length} reports
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                <div className="bg-white/50 p-2 rounded">
                  <div className="text-xs text-muted-foreground">Reports</div>
                  <div className="font-semibold">{extractedData.reports.length}</div>
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <div className="text-xs text-muted-foreground">ValueSets</div>
                  <div className="font-semibold">{extractedData.valuesets.length}</div>
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <div className="text-xs text-muted-foreground">Concepts</div>
                  <div className="font-semibold">{extractedData.expandedConcepts.length}</div>
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <div className="text-xs text-muted-foreground">Original Codes</div>
                  <div className="font-semibold">{extractedData.originalCodes.length}</div>
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <div className="text-xs text-muted-foreground">Failed Codes</div>
                  <div className="font-semibold">{extractedData.failedCodes.length}</div>
                </div>
                <div className="bg-white/50 p-2 rounded">
                  <div className="text-xs text-muted-foreground">Exceptions</div>
                  <div className="font-semibold">{extractedData.exceptions.length}</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleDownloadZIP} variant="default">
                  <Download className="mr-2 h-4 w-4" />
                  Download ZIP Bundle
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Status */}
      {status === 'error' && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive mb-1">Extraction Failed</h3>
                <p className="text-sm text-muted-foreground">
                  {errorMessage || 'An error occurred while processing the reports. Please try again.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6 p-0">
          <div className="divide-y divide-border">
            <div className="p-6">
              <ExtractionFileList />
            </div>
            <div className="p-6">
              <ExtractionDataModel />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
