'use client';

import { useState, useEffect } from 'react';
import { EmisReport, ExpandedCodeSet } from '@/lib/types';
import CodeDisplay from '@/components/code-display';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { hasParsedXmlData } from '@/lib/storage';

export default function HomePage() {
  const [selectedReport, setSelectedReport] = useState<EmisReport | null>(null);
  const [expandedData, setExpandedData] = useState<ExpandedCodeSet | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);
  const [hasXmlLoaded, setHasXmlLoaded] = useState(false);

  // Check if XML is already loaded in IndexedDB on mount
  useEffect(() => {
    hasParsedXmlData().then((hasData) => {
      if (hasData) {
        setHasXmlLoaded(true);
      }
    });
  }, []);

  useEffect(() => {
    const handleReportSelected = (event: Event) => {
      const customEvent = event as CustomEvent<EmisReport>;
      console.log('Report selected event received:', customEvent.detail);
      setSelectedReport(customEvent.detail);
      setExpandedData(null);
    };

    const handleXmlParsed = () => {
      setHasXmlLoaded(true);
      setSelectedReport(null);
      setExpandedData(null);
    };

    const handleXmlCleared = () => {
      setHasXmlLoaded(false);
      setSelectedReport(null);
      setExpandedData(null);
    };

    window.addEventListener('report-selected', handleReportSelected);
    window.addEventListener('xml-parsed', handleXmlParsed);
    window.addEventListener('xml-cleared', handleXmlCleared);

    return () => {
      window.removeEventListener('report-selected', handleReportSelected);
      window.removeEventListener('xml-parsed', handleXmlParsed);
      window.removeEventListener('xml-cleared', handleXmlCleared);
    };
  }, []);

  const handleExpandReport = async () => {
    if (!selectedReport) return;

    setIsExpanding(true);

    try {
      const parentCodes: string[] = [];
      const displayNames: string[] = [];
      const includeChildren: boolean[] = [];
      const isRefset: boolean[] = [];
      const codeSystems: string[] = [];
      const excludedCodes: string[] = [];
      const valueSetMapping: Array<{
        valueSetId: string;
        valueSetIndex: number;
        codeIndices: number[];
        excludedCodes: string[];
      }> = [];

      let codeIndex = 0;
      selectedReport.valueSets.forEach((vs, vsIndex) => {
        const codeIndices: number[] = [];
        const vsExcludedCodes: string[] = [];

        vs.values.forEach((v) => {
          parentCodes.push(v.code);
          displayNames.push(v.displayName || v.code);
          includeChildren.push(v.includeChildren);
          isRefset.push(v.isRefset || false);
          codeSystems.push(vs.codeSystem || 'EMISINTERNAL');
          codeIndices.push(codeIndex);
          codeIndex++;
        });

        vs.exceptions.forEach((e) => {
          excludedCodes.push(e.code);
          vsExcludedCodes.push(e.code);
        });

        valueSetMapping.push({
          valueSetId: vs.id,
          valueSetIndex: vsIndex,
          codeIndices,
          excludedCodes: vsExcludedCodes,
        });
      });

      const response = await fetch('/api/terminology/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureId: selectedReport.id,
          featureName: selectedReport.name,
          parentCodes,
          displayNames,
          excludedCodes,
          includeChildren,
          isRefset,
          codeSystems,
          valueSetMapping,
        }),
      });

      const result = await response.json();

      if (!result.success || !result.data) {
        const errorMessage = result.error || 'Failed to expand codes';
        setExpandedData({
          featureId: selectedReport.id,
          featureName: selectedReport.name,
          concepts: [],
          totalCount: 0,
          sqlFormattedCodes: '',
          expandedAt: new Date().toISOString(),
          error: errorMessage,
        });
        return;
      }

      setExpandedData(result.data);
    } catch (err) {
      console.error('Expansion error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setExpandedData({
        featureId: selectedReport.id,
        featureName: selectedReport.name,
        concepts: [],
        totalCount: 0,
        sqlFormattedCodes: '',
        expandedAt: new Date().toISOString(),
        error: errorMessage,
      });
    } finally {
      setIsExpanding(false);
    }
  };

  // Empty state when no XML loaded
  if (!hasXmlLoaded) {
    return (
      <div className="flex items-center justify-center min-h-full p-6">
          <Card className="max-w-2xl w-full">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">Welcome to EMIS XML SNOMED Analyser</h2>
                  <p className="text-muted-foreground mb-4">
                    Get started by uploading an EMIS XML export file
                  </p>
                </div>
                <div className="text-left space-y-2 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">How it works:</h3>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Upload your EMIS search export XML file using the sidebar</li>
                    <li>Browse the folder structure and select a search report</li>
                    <li>Expand codes to see SNOMED CT translations and child concepts</li>
                    <li>Export results as CSV or copy SQL-formatted code lists</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>
    );
  }

  // Instruction state when XML loaded but no report selected
  if (!selectedReport) {
    return (
      <div className="flex items-center justify-center min-h-full p-6">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Select a search report</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a report from the sidebar to view and expand its SNOMED codes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>
    );
  }

  // Extract breadcrumb path from report.rule
  const getBreadcrumbs = () => {
    if (!selectedReport) return [];
    const segments = selectedReport.rule.split(' > ');
    // Skip the first segment (XML filename) and return the rest
    return segments.slice(1);
  };

  const breadcrumbs = getBreadcrumbs();

  // Report selected view
  return (
    <div className="p-6 space-y-6">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="flex text-sm text-muted-foreground">
            {breadcrumbs.map((segment, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <span className="mx-2">/</span>}
                <span className={index === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''}>
                  {segment}
                </span>
              </div>
            ))}
          </nav>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{selectedReport.searchName}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedReport.valueSets.length} ValueSet{selectedReport.valueSets.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            onClick={handleExpandReport}
            disabled={isExpanding || !!expandedData}
            size="lg"
          >
            {isExpanding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Expanding codes...
              </>
            ) : expandedData ? (
              'Codes expanded'
            ) : (
              'Expand all codes'
            )}
          </Button>
        </div>

        {expandedData && (
          <>
            {expandedData.error ? (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-destructive mb-1">Expansion Error</h3>
                      <p className="text-sm text-muted-foreground">{expandedData.error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <CodeDisplay expandedCodes={expandedData} report={selectedReport} />
            )}
          </>
        )}
      </div>
    );
}
