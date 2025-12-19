'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Copy, Check, Download, ChevronDown, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { ExpandedCodeSet, EmisReport } from '@/lib/types';
import NormalisedDataView from './normalised-data-view';

interface CodeDisplayProps {
  expandedCodes: ExpandedCodeSet;
  report?: EmisReport;
}

const getCodeSystemBadgeClass = (codeSystem?: string): string => {
  if (!codeSystem) {
    return 'text-xs bg-gray-50 text-gray-700 border-gray-200';
  }

  const system = codeSystem.toUpperCase();

  // SNOMED_CONCEPT (blue)
  if (system === 'SNOMED_CONCEPT') {
    return 'text-xs bg-blue-50 text-blue-700 border-blue-200';
  }
  // SCT_CONST (pink)
  if (system === 'SCT_CONST') {
    return 'text-xs bg-pink-50 text-pink-700 border-pink-200';
  }
  // SCT_DRGGRP (green)
  if (system === 'SCT_DRGGRP') {
    return 'text-xs bg-green-50 text-green-700 border-green-200';
  }
  // EMISINTERNAL (purple)
  if (system === 'EMISINTERNAL' || system === 'EMIS') {
    return 'text-xs bg-purple-50 text-purple-700 border-purple-200';
  }

  return 'text-xs bg-gray-50 text-gray-700 border-gray-200';
};

export default function CodeDisplay({ expandedCodes, report }: CodeDisplayProps) {
  const [copiedButton, setCopiedButton] = useState<number | 'all' | null>(null);
  const [expandedValueSets, setExpandedValueSets] = useState<Set<number>>(new Set());
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleCopy = async (codesText: string, buttonId: number | 'all') => {
    await navigator.clipboard.writeText(codesText);
    setCopiedButton(buttonId);
    setTimeout(() => setCopiedButton(null), 2000);
  };

  const handleCopyItem = async (text: string, itemId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedItem(itemId);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const toggleValueSet = (index: number) => {
    const newExpanded = new Set(expandedValueSets);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedValueSets(newExpanded);
  };

  const handleDownloadCsv = (group: any, type: 'xml' | 'output' | 'summary') => {
    const date = new Date().toISOString().split('T')[0];
    let filename: string;
    let csvContent: string;

    if (type === 'summary') {
      filename = `${expandedCodes.featureName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary_${date}.csv`;
      const headers = ['ValueSet Name', 'Unique Name', 'Hash', 'XML Count', 'Output Count', 'SQL'];
      const rows = expandedCodes.valueSetGroups?.map(g => [
        g.valueSetFriendlyName,
        g.valueSetUniqueName,
        g.valueSetHash,
        g.originalCodes?.length || 0,
        g.concepts.length,
        `"${g.sqlFormattedCodes.replace(/"/g, '""')}"`,
      ]) || [];
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else {
      const sanitisedName = group.valueSetFriendlyName || 'valueset';
      filename = `${sanitisedName}_${type}_${date}.csv`;

      if (type === 'xml' && group.originalCodes) {
        const headers = ['Original Code', 'Display', 'Code System', 'Include Children', 'Translated Code', 'Translated Display'];
        const rows = group.originalCodes.map((oc: any) => [
          oc.originalCode,
          `"${oc.displayName.replace(/"/g, '""')}"`,
          oc.codeSystem,
          oc.includeChildren ? 'Yes' : 'No',
          oc.translatedTo || '',
          oc.translatedToDisplay ? `"${oc.translatedToDisplay.replace(/"/g, '""')}"` : '',
        ]);
        csvContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
      } else {
        const headers = ['SNOMED Code', 'Display', 'Type', 'Source'];
        const rows = group.concepts.map((c: any) => [
          c.code,
          `"${c.display.replace(/"/g, '""')}"`,
          c.isRefset ? 'Refset' : '',
          'Terminology Server',
        ]);
        csvContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
      }
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Tabs defaultValue="expanded" className="space-y-4">
      <TabsList>
        <TabsTrigger value="expanded">Expanded Codes</TabsTrigger>
        <TabsTrigger value="normalised">Normalised Data</TabsTrigger>
      </TabsList>

      <TabsContent value="expanded" className="space-y-4">
        {/* Summary */}
        <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-sm text-muted-foreground">Total Codes</div>
              <div className="text-2xl font-bold">{expandedCodes.totalCount}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">ValueSets</div>
              <div className="text-2xl font-bold">{expandedCodes.valueSetGroups?.length || 0}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadCsv(null, 'summary')}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Summary
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(expandedCodes.sqlFormattedCodes, 'all')}
            >
              {copiedButton === 'all' ? (
                <><Check className="w-4 h-4 mr-2" /> Copied!</>
              ) : (
                <><Copy className="w-4 h-4 mr-2" /> Copy All SQL</>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* ValueSets Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead className="w-12">Status</TableHead>
              <TableHead>ValueSet Name</TableHead>
              <TableHead>Hash</TableHead>
              <TableHead className="text-right">XML</TableHead>
              <TableHead className="text-right">Output</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expandedCodes.valueSetGroups?.map((group, idx) => {
              const isExpanded = expandedValueSets.has(idx);
              const inputCount = group.originalCodes?.length || 0;
              const outputCount = group.concepts.length;

              return (
                <React.Fragment key={idx}>
                  <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleValueSet(idx)}>
                    <TableCell>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </TableCell>
                    <TableCell>
                      {group.failedCodes && group.failedCodes.length > 0 ? (
                        <div title={`${group.failedCodes.length} code(s) failed to map`}>
                          <XCircle className="w-4 h-4 text-orange-600" />
                        </div>
                      ) : (
                        <div title="All codes mapped successfully">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="group flex items-center gap-1 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyItem(group.valueSetFriendlyName, `name-${idx}`);
                          }}
                          title="Click to copy name"
                        >
                          <span className="font-medium text-sm group-hover:text-primary transition-colors">
                            {group.valueSetFriendlyName}
                          </span>
                          {copiedItem === `name-${idx}` ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                          )}
                        </div>
                        <div
                          className="group cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyItem(group.valueSetUniqueName, `id-${idx}`);
                          }}
                          title="Click to copy ID"
                        >
                          <Badge
                            variant="outline"
                            className="font-mono text-xs bg-purple-50 text-purple-700 border-purple-200 group-hover:bg-purple-100 transition-colors inline-flex items-center gap-1"
                          >
                            {group.valueSetUniqueName}
                            {copiedItem === `id-${idx}` ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        {group.valueSetHash}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{inputCount}</TableCell>
                    <TableCell className="text-right font-medium">{outputCount}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(group.sqlFormattedCodes, idx)}
                      >
                        {copiedButton === idx ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <div className="bg-muted/30 p-4 space-y-4">
                          {/* Input Codes Table */}
                          {group.originalCodes && group.originalCodes.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold">XML Codes ({inputCount})</h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadCsv(group, 'xml')}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  CSV
                                </Button>
                              </div>
                              <div className="border rounded-md bg-background">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-32">Code</TableHead>
                                      <TableHead>Display</TableHead>
                                      <TableHead className="w-32">System</TableHead>
                                      <TableHead className="w-24">Children</TableHead>
                                      <TableHead className="w-32">Translated Code</TableHead>
                                      <TableHead>Translated Display</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {group.originalCodes.map((oc, i) => (
                                      <TableRow key={i}>
                                        <TableCell className="font-mono text-xs">{oc.originalCode}</TableCell>
                                        <TableCell className="text-sm">{oc.displayName}</TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className={getCodeSystemBadgeClass(oc.codeSystem)}>
                                            {oc.codeSystem}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          {oc.includeChildren && <Badge className="text-xs">Yes</Badge>}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                          {oc.translatedTo && (
                                            <span className="text-green-600">{oc.translatedTo}</span>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                          {oc.translatedToDisplay || ''}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          )}

                          {/* Output Codes Table */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-semibold">Output Codes ({outputCount})</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadCsv(group, 'output')}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                CSV
                              </Button>
                            </div>
                            <div className="border rounded-md bg-background max-h-96 overflow-y-auto">
                              <Table>
                                <TableHeader className="sticky top-0 bg-background">
                                  <TableRow>
                                    <TableHead className="w-32">Code</TableHead>
                                    <TableHead>Display</TableHead>
                                    <TableHead className="w-24">Type</TableHead>
                                    <TableHead className="w-40">Source</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {group.concepts.map((concept, i) => (
                                    <TableRow key={i}>
                                      <TableCell className="font-mono text-xs">{concept.code}</TableCell>
                                      <TableCell className="text-sm">{concept.display}</TableCell>
                                      <TableCell>
                                        {concept.isRefset && (
                                          <Badge className="text-xs bg-purple-100 text-purple-800 border-purple-200">
                                            Refset
                                          </Badge>
                                        )}
                                      </TableCell>
                                      <TableCell className="whitespace-nowrap">
                                        <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
                                          terminology_server
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>

                          {/* Failed Codes Table */}
                          {group.failedCodes && group.failedCodes.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-orange-700">Failed Codes ({group.failedCodes.length})</h4>
                              </div>
                              <div className="border border-orange-200 rounded-md bg-orange-50/50 max-h-96 overflow-y-auto">
                                <Table>
                                  <TableHeader className="sticky top-0 bg-orange-50">
                                    <TableRow>
                                      <TableHead className="w-32">Code</TableHead>
                                      <TableHead>Display</TableHead>
                                      <TableHead className="w-32">System</TableHead>
                                      <TableHead>Reason</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {group.failedCodes.map((failed, i) => (
                                      <TableRow key={i}>
                                        <TableCell className="font-mono text-xs">{failed.originalCode}</TableCell>
                                        <TableCell className="text-sm">{failed.displayName}</TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className={getCodeSystemBadgeClass(failed.codeSystem)}>
                                            {failed.codeSystem}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          <Badge className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                                            {failed.reason}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Card>
      </TabsContent>

      <TabsContent value="normalised">
        {report ? (
          <NormalisedDataView 
            report={report} 
            expandedCodes={expandedCodes}
          />
        ) : (
          <Card className="p-6">
            <p className="text-sm text-muted-foreground text-center">
              Report information is required to display normalised data view.
            </p>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
