'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { loadParsedXmlData, saveParsedXmlData, clearParsedXmlData } from '@/lib/storage';
import {
  ChevronRight,
  Folder,
  FileText,
  Search,
  Home,
  ChevronDown,
  FolderOpen,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmisXmlDocument, EmisReport } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FolderNode {
  name: string;
  path: string[];
  reports: EmisReport[];
  subfolders: Map<string, FolderNode>;
}

export default function FolderTreeNavigation() {
  const [parsedData, setParsedData] = useState<EmisXmlDocument | null>(null);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadParsedXmlData()
      .then((minimalData) => {
        if (minimalData) {
          setParsedData(minimalData);
        }
      })
      .catch((error) => {
        console.error('Failed to load stored data:', error);
      });
  }, []);

  useEffect(() => {
    const handleXmlParsed = (event: Event) => {
      const customEvent = event as CustomEvent<EmisXmlDocument>;
      setParsedData(customEvent.detail);

      try {
        const reports = customEvent.detail.reports;
        const minimalReports: any[] = [];

        const batchSize = 100;
        for (let i = 0; i < reports.length; i += batchSize) {
          const batch = reports.slice(i, i + batchSize);
          minimalReports.push(...batch.map((report) => ({
            id: report.id,
            name: report.name,
            searchName: report.searchName,
            rule: report.rule,
            valueSets: report.valueSets.map((vs) => ({
              id: vs.id,
              codeSystem: vs.codeSystem,
              values: vs.values.map((v) => ({
                code: v.code,
                includeChildren: v.includeChildren,
                isRefset: v.isRefset,
                displayName: v.displayName && v.displayName !== v.code ? v.displayName : undefined,
              })),
              exceptions: vs.exceptions.map((e) => e.code),
            })),
          })));
        }

        const minimalData = {
          namespace: customEvent.detail.namespace,
          parsedAt: customEvent.detail.parsedAt,
          reports: minimalReports,
        };

        // Save to IndexedDB (handles large files much better than sessionStorage)
        saveParsedXmlData(minimalData).catch((error) => {
          console.error('Failed to save parsed XML data:', error);
        });
      } catch (error) {
        console.error('Error storing parsed XML data:', error);
      }

      setCurrentPath([]);
      setSelectedReportId(null);
      setExpandedFolders(new Set());
    };

    const handleXmlCleared = () => {
      setParsedData(null);
      setCurrentPath([]);
      setSelectedReportId(null);
      setExpandedFolders(new Set());
      clearParsedXmlData().catch((error) => {
        console.error('Failed to clear stored data:', error);
      });
    };

    window.addEventListener('xml-parsed', handleXmlParsed);
    window.addEventListener('xml-cleared', handleXmlCleared);
    return () => {
      window.removeEventListener('xml-parsed', handleXmlParsed);
      window.removeEventListener('xml-cleared', handleXmlCleared);
    };
  }, []);

  const folderTree = useMemo(() => {
    if (!parsedData) return null;

    const root: FolderNode = {
      name: 'Root',
      path: [],
      reports: [],
      subfolders: new Map(),
    };

    parsedData.reports.forEach((report) => {
      const segments = report.rule.split(' > ').slice(1);

      if (segments.length === 0) {
        root.reports.push(report);
        return;
      }

      let currentNode = root;
      segments.forEach((segment) => {
        if (!currentNode.subfolders.has(segment)) {
          currentNode.subfolders.set(segment, {
            name: segment,
            path: [...currentNode.path, segment],
            reports: [],
            subfolders: new Map(),
          });
        }
        currentNode = currentNode.subfolders.get(segment)!;
      });

      currentNode.reports.push(report);
    });

    return root;
  }, [parsedData]);

  const currentNode = useMemo(() => {
    if (!folderTree) return null;

    let node = folderTree;
    for (const segment of currentPath) {
      const nextNode = node.subfolders.get(segment);
      if (!nextNode) return null;
      node = nextNode;
    }
    return node;
  }, [folderTree, currentPath]);

  const filteredItems = useMemo(() => {
    if (!currentNode) return { folders: [], reports: [] };

    const query = searchQuery.toLowerCase();

    const folders = Array.from(currentNode.subfolders.values())
      .filter((folder) => folder.name.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name));

    const reports = currentNode.reports
      .filter(
        (report) =>
          report.name.toLowerCase().includes(query) ||
          report.searchName.toLowerCase().includes(query)
      )
      .sort((a, b) => a.searchName.localeCompare(b.searchName));

    return { folders, reports };
  }, [currentNode, searchQuery]);

  const handleReportClick = (report: EmisReport) => {
    console.log('Dispatching report-selected event:', report);
    setSelectedReportId(report.id);
    window.dispatchEvent(
      new CustomEvent('report-selected', { detail: report })
    );
  };

  const handleFolderClick = (folderPath: string) => {
    const fullPath = folderPath;
    if (expandedFolders.has(fullPath)) {
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        next.delete(fullPath);
        return next;
      });
    } else {
      setExpandedFolders((prev) => new Set(prev).add(fullPath));
    }
  };

  const toggleFolder = (folderName: string) => {
    setCurrentPath([...currentPath, folderName]);
  };

  const navigateUp = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1));
    }
  };

  const renderFolderContents = (node: FolderNode, depth: number = 0) => {
    const folders = Array.from(node.subfolders.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const reports = node.reports.sort((a, b) =>
      a.searchName.localeCompare(b.searchName)
    );

    return (
      <div>
        {folders.map((folder) => {
          const folderPath = folder.path.join('/');
          const isExpanded = expandedFolders.has(folderPath);
          const reportCount = countReports(folder);

          return (
            <div key={folderPath}>
              <div
                className={`flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent transition-colors text-sm`}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onClick={() => handleFolderClick(folderPath)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                )}
                {isExpanded ? (
                  <FolderOpen className="h-4 w-4 text-blue-500 flex-shrink-0" />
                ) : (
                  <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )}
                <span className="flex-1 truncate">{folder.name}</span>
                <Badge variant="secondary" className="text-xs h-5">
                  {reportCount}
                </Badge>
              </div>
              {isExpanded && renderFolderContents(folder, depth + 1)}
            </div>
          );
        })}

        {reports.map((report) => (
          <TooltipProvider key={report.id} delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent transition-colors text-sm ${
                    selectedReportId === report.id ? 'bg-accent' : ''
                  }`}
                  style={{ paddingLeft: `${depth * 12 + 8 + 20}px` }}
                  onClick={() => handleReportClick(report)}
                >
                  <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 truncate">{report.searchName}</span>
                  <Badge variant="outline" className="text-xs h-5">
                    {report.valueSets.length}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-md">
                <p className="font-medium">{report.searchName}</p>
                {report.name !== report.searchName && (
                  <p className="text-xs text-muted-foreground mt-1">{report.name}</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  };

  const countReports = (node: FolderNode): number => {
    let count = node.reports.length;
    node.subfolders.forEach((subfolder) => {
      count += countReports(subfolder);
    });
    return count;
  };

  if (!parsedData) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-muted-foreground px-2">
          No file loaded
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
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

      <div className="text-xs text-muted-foreground px-2">
        {parsedData.reports.length} searches
      </div>

      <div className="space-y-0.5 overflow-y-auto pr-2">
        {searchQuery ? (
          <>
            {filteredItems.folders.map((folder) => (
              <div
                key={folder.path.join('/')}
                className="flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent transition-colors text-sm"
                onClick={() => handleFolderClick(folder.path.join('/'))}
              >
                <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="flex-1 truncate">{folder.name}</span>
                <Badge variant="secondary" className="text-xs h-5">
                  {countReports(folder)}
                </Badge>
              </div>
            ))}
            {filteredItems.reports.map((report) => (
              <TooltipProvider key={report.id} delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent transition-colors text-sm ${
                        selectedReportId === report.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => handleReportClick(report)}
                    >
                      <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1 truncate">{report.searchName}</span>
                      <Badge variant="outline" className="text-xs h-5">
                        {report.valueSets.length}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-md">
                    <p className="font-medium">{report.searchName}</p>
                    {report.name !== report.searchName && (
                      <p className="text-xs text-muted-foreground mt-1">{report.name}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            {filteredItems.folders.length === 0 && filteredItems.reports.length === 0 && (
              <div className="text-sm text-muted-foreground px-2 py-4 text-center">
                No results found
              </div>
            )}
          </>
        ) : (
          folderTree && renderFolderContents(folderTree)
        )}
      </div>
    </div>
  );
}
