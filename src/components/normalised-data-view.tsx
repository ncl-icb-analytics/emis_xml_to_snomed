'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExpandedCodeSet, EmisReport } from '@/lib/types';

interface NormalisedDataViewProps {
  report: EmisReport;
  expandedCodes: ExpandedCodeSet;
}

export default function NormalisedDataView({ report, expandedCodes }: NormalisedDataViewProps) {
  // Extract XML filename from rule (first segment)
  const xmlFileName = report.rule.split(' > ')[0] || 'unknown.xml';

  // Calculate row counts
  const valuesetsCount = expandedCodes.valueSetGroups?.length || 0;
  const originalCodesCount = expandedCodes.valueSetGroups?.reduce((sum, g) => sum + (g.originalCodes?.length || 0), 0) || 0;
  const expandedConceptsCount = expandedCodes.valueSetGroups?.reduce((sum, g) => sum + g.concepts.length, 0) || 0;
  const failedCodesCount = expandedCodes.valueSetGroups?.reduce((sum, g) => sum + (g.failedCodes?.length || 0), 0) || 0;
  const exceptionsCount = expandedCodes.valueSetGroups?.reduce((sum, g) => {
    const vs = report.valueSets[g.valueSetIndex];
    return sum + (vs?.exceptions?.length || 0);
  }, 0) || 0;

  return (
    <div className="space-y-4 w-full max-w-full min-w-0">
      {/* Reports Table */}
      <Card className="w-full max-w-full min-w-0 overflow-hidden">
        <div className="px-3 py-1.5 border-b bg-muted/30">
          <h3 className="text-xs font-semibold uppercase tracking-wide">reports (1)</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">report_id</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">report_name</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">search_name</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">folder_path</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">xml_file_name</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">parsed_at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="h-6 px-2 py-0.5 font-mono text-xs whitespace-nowrap">{report.id}</TableCell>
                <TableCell className="h-6 px-2 py-0.5 text-xs whitespace-nowrap">{report.name}</TableCell>
                <TableCell className="h-6 px-2 py-0.5 text-xs whitespace-nowrap">{report.searchName}</TableCell>
                <TableCell className="h-6 px-2 py-0.5 text-xs whitespace-nowrap">{report.rule}</TableCell>
                <TableCell className="h-6 px-2 py-0.5 text-xs whitespace-nowrap">{xmlFileName}</TableCell>
                <TableCell className="h-6 px-2 py-0.5 text-xs whitespace-nowrap">{expandedCodes.expandedAt}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Valuesets Table */}
      <Card className="w-full max-w-full min-w-0 overflow-hidden">
        <div className="px-3 py-1.5 border-b bg-muted/30">
          <h3 className="text-xs font-semibold uppercase tracking-wide">valuesets ({valuesetsCount})</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">valueset_id</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">report_id</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">valueset_index</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">valueset_hash</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">valueset_friendly_name</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">code_system</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">expansion_error</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">expanded_at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expandedCodes.valueSetGroups?.map((group) => (
                <TableRow key={group.valueSetId}>
                  <TableCell className="h-6 px-2 py-0.5 font-mono text-xs whitespace-nowrap">{group.valueSetId}</TableCell>
                  <TableCell className="h-6 px-2 py-0.5 font-mono text-xs whitespace-nowrap">{report.id}</TableCell>
                  <TableCell className="h-6 px-2 py-0.5 text-xs text-right whitespace-nowrap">{group.valueSetIndex}</TableCell>
                  <TableCell className="h-6 px-2 py-0.5 font-mono text-xs whitespace-nowrap">{group.valueSetHash}</TableCell>
                  <TableCell className="h-6 px-2 py-0.5 text-xs whitespace-nowrap">{group.valueSetFriendlyName}</TableCell>
                  <TableCell className="h-6 px-2 py-0.5 whitespace-nowrap">
                    {group.originalCodes?.[0]?.codeSystem && (
                      <Badge variant="outline" className="text-xs h-4 px-1 bg-blue-50 text-blue-700 border-blue-200">
                        {group.originalCodes[0].codeSystem}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="h-6 px-2 py-0.5 text-xs text-muted-foreground whitespace-nowrap">
                    {group.expansionError || ''}
                  </TableCell>
                  <TableCell className="h-6 px-2 py-0.5 text-xs whitespace-nowrap">{expandedCodes.expandedAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Original Codes Table */}
      <Card className="w-full max-w-full min-w-0 overflow-hidden">
        <div className="px-3 py-1.5 border-b bg-muted/30">
          <h3 className="text-xs font-semibold uppercase tracking-wide">original_codes ({originalCodesCount})</h3>
        </div>
        <div className="max-h-96 overflow-y-auto overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">original_code_id</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">valueset_id</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">original_code</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">display_name</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">code_system</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">include_children</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">is_refset</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">translated_to_snomed_code</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">translated_to_display</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expandedCodes.valueSetGroups?.flatMap((group) =>
                group.originalCodes?.map((oc, idx) => (
                  <TableRow key={`${group.valueSetId}-${idx}`}>
                    <TableCell className="h-6 px-2 py-0.5 font-mono text-xs whitespace-nowrap">
                      {`${group.valueSetId}-oc${idx}`}
                    </TableCell>
                    <TableCell className="h-6 px-2 py-0.5 font-mono text-xs whitespace-nowrap">{group.valueSetId}</TableCell>
                    <TableCell className="h-6 px-2 py-0.5 font-mono text-xs whitespace-nowrap">{oc.originalCode}</TableCell>
                    <TableCell className="h-6 px-2 py-0.5 text-xs whitespace-nowrap">{oc.displayName}</TableCell>
                    <TableCell className="h-6 px-2 py-0.5 whitespace-nowrap">
                      <Badge variant="outline" className="text-xs h-4 px-1 bg-blue-50 text-blue-700 border-blue-200">{oc.codeSystem}</Badge>
                    </TableCell>
                    <TableCell className="h-6 px-2 py-0.5 text-xs text-center whitespace-nowrap">
                      {oc.includeChildren ? '✓' : ''}
                    </TableCell>
                    <TableCell className="h-6 px-2 py-0.5 text-xs text-center whitespace-nowrap">
                      {oc.isRefset ? '✓' : ''}
                    </TableCell>
                    <TableCell className="h-6 px-2 py-0.5 font-mono text-xs whitespace-nowrap">
                      {oc.translatedTo || ''}
                    </TableCell>
                    <TableCell className="h-6 px-2 py-0.5 text-xs text-muted-foreground whitespace-nowrap">
                      {oc.translatedToDisplay || ''}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Expanded Concepts Table */}
      <Card className="w-full max-w-full min-w-0 overflow-hidden">
        <div className="px-3 py-1.5 border-b bg-muted/30">
          <h3 className="text-xs font-semibold uppercase tracking-wide">expanded_concepts ({expandedConceptsCount})</h3>
        </div>
        <div className="max-h-96 overflow-y-auto overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">concept_id</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">valueset_id</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">snomed_code</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">display</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">source</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">exclude_children</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">is_refset</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expandedCodes.valueSetGroups?.flatMap((group) =>
                group.concepts.map((concept, idx) => (
                  <TableRow key={`${group.valueSetId}-${concept.code}-${idx}`}>
                    <TableCell className="h-6 px-2 py-0.5 font-mono text-xs whitespace-nowrap">
                      {`${group.valueSetId}-c${idx}`}
                    </TableCell>
                    <TableCell className="h-6 px-2 py-0.5 font-mono text-xs whitespace-nowrap">{group.valueSetId}</TableCell>
                    <TableCell className="h-6 px-2 py-0.5 font-mono text-xs whitespace-nowrap">{concept.code}</TableCell>
                    <TableCell className="h-6 px-2 py-0.5 text-xs whitespace-nowrap">{concept.display}</TableCell>
                    <TableCell className="h-6 px-2 py-0.5 whitespace-nowrap">
                      <Badge className="text-xs h-4 px-1 bg-green-100 text-green-800 border-green-200">
                        terminology_server
                      </Badge>
                    </TableCell>
                    <TableCell className="h-6 px-2 py-0.5 text-xs text-center whitespace-nowrap">
                      {concept.excludeChildren ? '✓' : ''}
                    </TableCell>
                    <TableCell className="h-6 px-2 py-0.5 text-xs text-center whitespace-nowrap">
                      {concept.isRefset ? '✓' : ''}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Failed Codes Table */}
      {expandedCodes.valueSetGroups?.some(g => g.failedCodes && g.failedCodes.length > 0) && (
        <Card className="border-orange-200 w-full max-w-full min-w-0 overflow-hidden">
          <div className="px-3 py-1.5 border-b bg-orange-50">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-orange-900">failed_codes ({failedCodesCount})</h3>
          </div>
          <div className="max-h-96 overflow-y-auto overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">failed_code_id</TableHead>
                  <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">valueset_id</TableHead>
                  <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">original_code</TableHead>
                  <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">display_name</TableHead>
                  <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">code_system</TableHead>
                  <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expandedCodes.valueSetGroups?.flatMap((group, vsIdx) =>
                  group.failedCodes?.map((failed, idx) => (
                    <TableRow key={`${group.valueSetId}-failed${idx}`} className="bg-orange-50/50">
                      <TableCell className="h-6 px-2 py-0.5 font-mono text-xs whitespace-nowrap">
                        {`${group.valueSetId}-failed${idx}`}
                      </TableCell>
                      <TableCell className="h-6 px-2 py-0.5 font-mono text-xs whitespace-nowrap">{group.valueSetId}</TableCell>
                      <TableCell className="h-6 px-2 py-0.5 font-mono text-xs whitespace-nowrap">{failed.originalCode}</TableCell>
                      <TableCell className="h-6 px-2 py-0.5 text-xs whitespace-nowrap">{failed.displayName}</TableCell>
                      <TableCell className="h-6 px-2 py-0.5 whitespace-nowrap">
                        <Badge variant="outline" className="text-xs h-4 px-1 bg-blue-50 text-blue-700 border-blue-200">{failed.codeSystem}</Badge>
                      </TableCell>
                      <TableCell className="h-6 px-2 py-0.5 whitespace-nowrap">
                        <Badge className="text-xs h-4 px-1 bg-orange-100 text-orange-800 border-orange-200">
                          {failed.reason}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Exceptions Table */}
      <Card className="w-full max-w-full min-w-0 overflow-hidden">
        <div className="px-3 py-1.5 border-b bg-muted/30">
          <h3 className="text-xs font-semibold uppercase tracking-wide">exceptions ({exceptionsCount})</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">exception_id</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">valueset_id</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">excluded_code</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expandedCodes.valueSetGroups?.flatMap((group, vsIdx) =>
                report.valueSets[group.valueSetIndex]?.exceptions.map((exception, excIdx) => (
                  <TableRow key={`${group.valueSetId}-exc${excIdx}`}>
                    <TableCell className="h-6 px-2 py-0.5 font-mono text-xs whitespace-nowrap">
                      {`${group.valueSetId}-exc${excIdx}`}
                    </TableCell>
                    <TableCell className="h-6 px-2 py-0.5 font-mono text-xs whitespace-nowrap">{group.valueSetId}</TableCell>
                    <TableCell className="h-6 px-2 py-0.5 font-mono text-xs whitespace-nowrap">{exception.code}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

