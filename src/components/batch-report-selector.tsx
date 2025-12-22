'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppMode } from '@/contexts/AppModeContext';
import { EmisReport } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, CheckSquare, Square, ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { loadParsedXmlData } from '@/lib/storage';
import { buildFolderTree, getAllReportsInFolder, FolderNode } from '@/lib/folder-tree-utils';

export default function BatchReportSelector() {
  const { selectedReportIds, toggleReportSelection, selectAllReports, deselectAllReports, isReportSelected } = useAppMode();
  const [reports, setReports] = useState<EmisReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Load existing parsed data on mount
  useEffect(() => {
    loadParsedXmlData()
      .then((minimalData) => {
        if (minimalData && minimalData.reports) {
          setReports(minimalData.reports);
          // Start with folders collapsed
          setExpandedFolders(new Set());
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
      // Start with folders collapsed
      setExpandedFolders(new Set());
    };

    const handleXmlCleared = () => {
      setReports([]);
      setExpandedFolders(new Set());
    };

    window.addEventListener('xml-parsed', handleXmlParsed);
    window.addEventListener('xml-cleared', handleXmlCleared);

    return () => {
      window.removeEventListener('xml-parsed', handleXmlParsed);
      window.removeEventListener('xml-cleared', handleXmlCleared);
    };
  }, []);

  // Build folder tree from reports using shared utility
  const folderTree = useMemo(() => buildFolderTree(reports), [reports]);

  // Filter reports by search query
  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) {
      return [...reports].sort((a, b) => a.searchName.localeCompare(b.searchName));
    }

    const query = searchQuery.toLowerCase();
    return reports
      .filter(
        (report) =>
          report.name.toLowerCase().includes(query) ||
          report.searchName.toLowerCase().includes(query) ||
          report.rule.toLowerCase().includes(query)
      )
      .sort((a, b) => a.searchName.localeCompare(b.searchName));
  }, [reports, searchQuery]);

  const allReportIds = useMemo(() => reports.map((r) => r.id), [reports]);
  const allFilteredSelected = filteredReports.length > 0 && filteredReports.every((r) => isReportSelected(r.id));

  const handleSelectAll = () => {
    if (allFilteredSelected) {
      // Deselect all filtered reports
      const filteredIds = new Set(filteredReports.map((r) => r.id));
      const remainingSelected = Array.from(selectedReportIds).filter((id) => !filteredIds.has(id));
      if (remainingSelected.length === 0) {
        deselectAllReports();
      } else {
        selectAllReports(remainingSelected);
      }
    } else {
      // Select all filtered reports (merge with existing)
      const newSelections = new Set([...selectedReportIds, ...filteredReports.map((r) => r.id)]);
      selectAllReports(Array.from(newSelections));
    }
  };

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const isFolderFullySelected = (node: FolderNode): boolean => {
    const allReports = getAllReportsInFolder(node);
    return allReports.length > 0 && allReports.every((r) => isReportSelected(r.id));
  };

  const isFolderPartiallySelected = (node: FolderNode): boolean => {
    const allReports = getAllReportsInFolder(node);
    return allReports.some((r) => isReportSelected(r.id)) && !isFolderFullySelected(node);
  };

  const toggleFolderSelection = (node: FolderNode) => {
    const allReports = getAllReportsInFolder(node);
    const allSelected = allReports.every((r) => isReportSelected(r.id));

    if (allSelected) {
      // Deselect all in folder
      const folderReportIds = new Set(allReports.map((r) => r.id));
      const remainingSelected = Array.from(selectedReportIds).filter((id) => !folderReportIds.has(id));
      if (remainingSelected.length === 0) {
        deselectAllReports();
      } else {
        selectAllReports(remainingSelected);
      }
    } else {
      // Select all in folder
      const newSelections = new Set([...selectedReportIds, ...allReports.map((r) => r.id)]);
      selectAllReports(Array.from(newSelections));
      
      // Auto-expand the folder and all parent folders so selected reports are visible
      setExpandedFolders((prev) => {
        const newExpanded = new Set(prev);
        
        // Expand this folder
        if (node.path) {
          newExpanded.add(node.path);
        }
        
        // Expand all parent folders
        if (node.path) {
          const pathParts = node.path.split(' > ');
          for (let i = 1; i < pathParts.length; i++) {
            const parentPath = pathParts.slice(0, i).join(' > ');
            newExpanded.add(parentPath);
          }
        }
        
        return newExpanded;
      });
    }
  };

  const renderFolder = (node: FolderNode, level: number = 0): React.JSX.Element | null => {
    if (node.children.size === 0 && node.reports.length === 0) return null;

    const isExpanded = expandedFolders.has(node.path);
    const hasChildren = node.children.size > 0;
    const reportCount = getAllReportsInFolder(node).length;
    const isFullySelected = isFolderFullySelected(node);
    const isPartiallySelected = isFolderPartiallySelected(node);

    // For root node, render children directly without wrapper div
    if (node.name === 'Root') {
      const childFolders = Array.from(node.children.values())
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((childNode) => renderFolder(childNode, level + 1))
        .filter(Boolean);
      
      const rootReports = [...node.reports]
        .sort((a, b) => a.searchName.localeCompare(b.searchName))
        .map((report) => (
          <div
            key={report.id}
            className="flex items-start gap-2 p-1.5 rounded-md hover:bg-accent/50 cursor-pointer transition-colors"
            style={{ paddingLeft: `${(level + 1) * 12 + 6}px` }}
            onClick={() => toggleReportSelection(report.id)}
          >
            <Checkbox
              checked={isReportSelected(report.id)}
              onCheckedChange={() => toggleReportSelection(report.id)}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-xs truncate">{report.searchName}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {report.valueSets.length} ValueSet{report.valueSets.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        ));

      if (childFolders.length === 0 && rootReports.length === 0) return null;

      return (
        <>
          {childFolders}
          {rootReports}
        </>
      );
    }

    // For non-root nodes, render with wrapper div
    return (
      <div key={node.path} className="space-y-1">
        {/* Folder header */}
        <div
          className="flex items-center gap-2 p-1.5 rounded-md hover:bg-accent/50"
          style={{ paddingLeft: `${level * 12 + 6}px` }}
        >
          <Checkbox
            checked={isFullySelected || (isPartiallySelected ? 'indeterminate' : false)}
            onCheckedChange={() => toggleFolderSelection(node)}
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0"
          />
          <div
            className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) {
                toggleFolder(node.path);
              }
            }}
          >
            {hasChildren && (
              isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
              )
            )}
            <Folder className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium truncate">{node.name}</span>
            <Badge variant="secondary" className="text-xs h-4 px-1 flex-shrink-0">
              {reportCount}
            </Badge>
          </div>
        </div>

        {/* Child folders - only when expanded */}
        {isExpanded && Array.from(node.children.values())
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((childNode) =>
            renderFolder(childNode, level + 1)
          )}

        {/* Reports in this folder - only when expanded */}
        {isExpanded && [...node.reports]
          .sort((a, b) => a.searchName.localeCompare(b.searchName))
          .map((report) => (
          <div
            key={report.id}
            className="flex items-start gap-2 p-1.5 rounded-md hover:bg-accent/50 cursor-pointer transition-colors"
            style={{ paddingLeft: `${(level + 1) * 12 + 6}px` }}
            onClick={() => toggleReportSelection(report.id)}
          >
            <Checkbox
              checked={isReportSelected(report.id)}
              onCheckedChange={() => toggleReportSelection(report.id)}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-xs truncate">{report.searchName}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {report.valueSets.length} ValueSet{report.valueSets.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (reports.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No reports loaded. Upload an XML file to get started.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      <Separator />

      {/* Select/Deselect All */}
      <div className="flex items-center justify-between text-xs px-2">
        <span className="text-muted-foreground">
          {selectedReportIds.size} of {reports.length} selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSelectAll}
          className="h-7 text-xs gap-1.5"
        >
          {allFilteredSelected ? (
            <>
              <Square className="h-3.5 w-3.5" />
              Deselect All
            </>
          ) : (
            <>
              <CheckSquare className="h-3.5 w-3.5" />
              Select All
            </>
          )}
        </Button>
      </div>

      {/* Report List */}
      {searchQuery.trim() ? (
        /* Flat filtered list when searching */
        <div className="space-y-0.5 overflow-y-auto pr-2">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="flex items-start gap-2 p-2 rounded-md hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => toggleReportSelection(report.id)}
            >
              <Checkbox
                checked={isReportSelected(report.id)}
                onCheckedChange={() => toggleReportSelection(report.id)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{report.searchName}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {report.valueSets.length} ValueSet{report.valueSets.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ))}
          {filteredReports.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">
              No reports match &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      ) : (
        /* Folder tree when not searching */
        <div className="space-y-0.5 overflow-y-auto pr-2">
          {renderFolder(folderTree)}
        </div>
      )}
    </div>
  );
}
