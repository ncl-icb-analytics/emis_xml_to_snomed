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
    <div className="space-y-4">
      {/* Reports Table */}
      <Card>
        <div className="px-3 py-1.5 border-b bg-muted/30">
          <h3 className="text-xs font-semibold uppercase tracking-wide">reports (1)</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">report_id</TableHead>
              <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">report_name</TableHead>
              <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">search_name</TableHead>
              <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">folder_path</TableHead>
              <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">xml_file_name</TableHead>
              <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">parsed_at</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="h-6 px-2 py-0.5 font-mono text-xs">{report.id}</TableCell>
              <TableCell className="h-6 px-2 py-0.5 text-xs">{report.name}</TableCell>
              <TableCell className="h-6 px-2 py-0.5 text-xs">{report.searchName}</TableCell>
              <TableCell className="h-6 px-2 py-0.5 text-xs">{report.rule}</TableCell>
              <TableCell className="h-6 px-2 py-0.5 text-xs">{xmlFileName}</TableCell>
              <TableCell className="h-6 px-2 py-0.5 text-xs">{expandedCodes.expandedAt}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      {/* Valuesets Table */}
      <Card>
        <div className="px-3 py-1.5 border-b bg-muted/30">
          <h3 className="text-xs font-semibold uppercase tracking-wide">valuesets ({valuesetsCount})</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">valueset_id</TableHead>
              <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">report_id</TableHead>
              <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">valueset_index</TableHead>
              <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">valueset_hash</TableHead>
              <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">valueset_friendly_name</TableHead>
              <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">code_system</TableHead>
              <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">expansion_error</TableHead>
              <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">expanded_at</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expandedCodes.valueSetGroups?.map((group) => (
              <TableRow key={group.valueSetId}>
                <TableCell className="h-6 px-2 py-0.5 font-mono text-xs">{group.valueSetId}</TableCell>
                <TableCell className="h-6 px-2 py-0.5 font-mono text-xs">{report.id}</TableCell>
                <TableCell className="h-6 px-2 py-0.5 text-xs text-right">{group.valueSetIndex}</TableCell>
                <TableCell className="h-6 px-2 py-0.5 font-mono text-xs">{group.valueSetHash}</TableCell>
                <TableCell className="h-6 px-2 py-0.5 text-xs">{group.valueSetFriendlyName}</TableCell>
                <TableCell className="h-6 px-2 py-0.5">
                  {group.originalCodes?.[0]?.codeSystem && (
                    <Badge variant="outline" className="text-xs h-4 px-1 bg-blue-50 text-blue-700 border-blue-200">
                      {group.originalCodes[0].codeSystem}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="h-6 px-2 py-0.5 text-xs text-muted-foreground">
                  {group.expansionError || ''}
                </TableCell>
                <TableCell className="h-6 px-2 py-0.5 text-xs">{expandedCodes.expandedAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Original Codes Table */}
      <Card>
        <div className="px-3 py-1.5 border-b bg-muted/30">
          <h3 className="text-xs font-semibold uppercase tracking-wide">original_codes ({originalCodesCount})</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">original_code_id</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">valueset_id</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">original_code</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">display_name</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">code_system</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">include_children</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">is_refset</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">translated_to_snomed_code</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">translated_to_display</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expandedCodes.valueSetGroups?.flatMap((group) =>
                group.originalCodes?.map((oc, idx) => (
                  <TableRow key={`${group.valueSetId}-${idx}`}>
                    <TableCell className="h-6 px-2 py-0.5 font-mono text-xs">
                      {`${group.valueSetId}-oc${idx}`}
                    </TableCell>
                    <TableCell className="h-6 px-2 py-0.5 font-mono text-xs">{group.valueSetId}</TableCell>
                    <TableCell className="h-6 px-2 py-0.5 font-mono text-xs">{oc.originalCode}</TableCell>
                    <TableCell className="h-6 px-2 py-0.5 text-xs">{oc.displayName}</TableCell>
                    <TableCell className="h-6 px-2 py-0.5">
                      <Badge variant="outline" className="text-xs h-4 px-1 bg-blue-50 text-blue-700 border-blue-200">{oc.codeSystem}</Badge>
                    </TableCell>
                    <TableCell className="h-6 px-2 py-0.5 text-xs text-center">
                      {oc.includeChildren ? '✓' : ''}
                    </TableCell>
                    <TableCell className="h-6 px-2 py-0.5 text-xs text-center">
                      {oc.isRefset ? '✓' : ''}
                    </TableCell>
                    <TableCell className="h-6 px-2 py-0.5 font-mono text-xs">
                      {oc.translatedTo || ''}
                    </TableCell>
                    <TableCell className="h-6 px-2 py-0.5 text-xs text-muted-foreground">
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
      <Card>
        <div className="px-3 py-1.5 border-b bg-muted/30">
          <h3 className="text-xs font-semibold uppercase tracking-wide">expanded_concepts ({expandedConceptsCount})</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">concept_id</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">valueset_id</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">snomed_code</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">display</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">source</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">exclude_children</TableHead>
                <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">is_refset</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expandedCodes.valueSetGroups?.flatMap((group) =>
                group.concepts.map((concept, idx) => (
                  <TableRow key={`${group.valueSetId}-${concept.code}-${idx}`}>
                    <TableCell className="h-6 px-2 py-0.5 font-mono text-xs">
                      {`${group.valueSetId}-c${idx}`}
                    </TableCell>
                    <TableCell className="h-6 px-2 py-0.5 font-mono text-xs">{group.valueSetId}</TableCell>
                    <TableCell className="h-6 px-2 py-0.5 font-mono text-xs">{concept.code}</TableCell>
                    <TableCell className="h-6 px-2 py-0.5 text-xs">{concept.display}</TableCell>
                    <TableCell className="h-6 px-2 py-0.5">
                      <Badge className="text-xs h-4 px-1 bg-green-100 text-green-800 border-green-200">
                        terminology_server
                      </Badge>
                    </TableCell>
                    <TableCell className="h-6 px-2 py-0.5 text-xs text-center">
                      {concept.excludeChildren ? '✓' : ''}
                    </TableCell>
                    <TableCell className="h-6 px-2 py-0.5 text-xs text-center">
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
        <Card className="border-orange-200">
          <div className="px-3 py-1.5 border-b bg-orange-50">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-orange-900">failed_codes ({failedCodesCount})</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">failed_code_id</TableHead>
                  <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">valueset_id</TableHead>
                  <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">original_code</TableHead>
                  <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">display_name</TableHead>
                  <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">code_system</TableHead>
                  <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expandedCodes.valueSetGroups?.flatMap((group, vsIdx) =>
                  group.failedCodes?.map((failed, idx) => (
                    <TableRow key={`${group.valueSetId}-failed${idx}`} className="bg-orange-50/50">
                      <TableCell className="h-6 px-2 py-0.5 font-mono text-xs">
                        {`${group.valueSetId}-failed${idx}`}
                      </TableCell>
                      <TableCell className="h-6 px-2 py-0.5 font-mono text-xs">{group.valueSetId}</TableCell>
                      <TableCell className="h-6 px-2 py-0.5 font-mono text-xs">{failed.originalCode}</TableCell>
                      <TableCell className="h-6 px-2 py-0.5 text-xs">{failed.displayName}</TableCell>
                      <TableCell className="h-6 px-2 py-0.5">
                        <Badge variant="outline" className="text-xs h-4 px-1 bg-blue-50 text-blue-700 border-blue-200">{failed.codeSystem}</Badge>
                      </TableCell>
                      <TableCell className="h-6 px-2 py-0.5">
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
      <Card>
        <div className="px-3 py-1.5 border-b bg-muted/30">
          <h3 className="text-xs font-semibold uppercase tracking-wide">exceptions ({exceptionsCount})</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">exception_id</TableHead>
              <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">valueset_id</TableHead>
              <TableHead className="h-7 px-2 py-0.5 text-xs font-semibold">excluded_code</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expandedCodes.valueSetGroups?.flatMap((group, vsIdx) =>
              report.valueSets[group.valueSetIndex]?.exceptions.map((exception, excIdx) => (
                <TableRow key={`${group.valueSetId}-exc${excIdx}`}>
                  <TableCell className="h-6 px-2 py-0.5 font-mono text-xs">
                    {`${group.valueSetId}-exc${excIdx}`}
                  </TableCell>
                  <TableCell className="h-6 px-2 py-0.5 font-mono text-xs">{group.valueSetId}</TableCell>
                  <TableCell className="h-6 px-2 py-0.5 font-mono text-xs">{exception.code}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

