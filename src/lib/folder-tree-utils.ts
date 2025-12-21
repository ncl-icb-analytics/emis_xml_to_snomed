import { EmisReport } from './types';

/**
 * Unified folder node structure for both navigation and selection modes
 */
export interface FolderNode {
  name: string;
  path: string; // String path like "Folder1 > Folder2"
  pathSegments: string[]; // Array path like ["Folder1", "Folder2"]
  reports: EmisReport[];
  children: Map<string, FolderNode>;
}

/**
 * Builds a folder tree from an array of reports
 * Extracts folder structure from report.rule (skips first segment which is XML filename)
 */
export function buildFolderTree(reports: EmisReport[]): FolderNode {
  const root: FolderNode = {
    name: 'Root',
    path: '',
    pathSegments: [],
    reports: [],
    children: new Map(),
  };

  reports.forEach((report) => {
    // Extract folder path from rule (skip first segment which is XML filename)
    const segments = report.rule.split(' > ').slice(1);

    if (segments.length === 0) {
      // No folder structure, add to root
      root.reports.push(report);
      return;
    }

    let currentNode = root;
    let currentPath = '';
    const currentPathSegments: string[] = [];

    // Navigate through folders (all segments are folders)
    segments.forEach((segment) => {
      currentPath = currentPath ? `${currentPath} > ${segment}` : segment;
      currentPathSegments.push(segment);

      // Create folder if it doesn't exist
      if (!currentNode.children.has(segment)) {
        currentNode.children.set(segment, {
          path: currentPath,
          pathSegments: [...currentPathSegments],
          name: segment,
          reports: [],
          children: new Map(),
        });
      }
      currentNode = currentNode.children.get(segment)!;
    });

    // Add report to the final folder
    currentNode.reports.push(report);
  });

  return root;
}

/**
 * Navigates to a specific folder node by path segments
 */
export function navigateToFolder(
  root: FolderNode,
  pathSegments: string[]
): FolderNode | null {
  let node = root;
  for (const segment of pathSegments) {
    const nextNode = node.children.get(segment);
    if (!nextNode) return null;
    node = nextNode;
  }
  return node;
}

/**
 * Gets all reports recursively from a folder node and its children
 */
export function getAllReportsInFolder(node: FolderNode): EmisReport[] {
  const allReports = [...node.reports];
  node.children.forEach((childNode) => {
    allReports.push(...getAllReportsInFolder(childNode));
  });
  return allReports;
}

/**
 * Searches for folders and reports matching a query string
 */
export function searchFolderTree(
  root: FolderNode,
  query: string
): { folders: FolderNode[]; reports: EmisReport[] } {
  const lowerQuery = query.toLowerCase();
  const allFolders: FolderNode[] = [];
  const allReports: EmisReport[] = [];

  const searchNode = (node: FolderNode) => {
    // Search folders
    node.children.forEach((folder) => {
      if (folder.name.toLowerCase().includes(lowerQuery)) {
        allFolders.push(folder);
      }
      searchNode(folder); // Recurse into subfolders
    });

    // Search reports
    node.reports.forEach((report) => {
      if (
        report.name.toLowerCase().includes(lowerQuery) ||
        report.searchName.toLowerCase().includes(lowerQuery) ||
        report.rule.toLowerCase().includes(lowerQuery)
      ) {
        allReports.push(report);
      }
    });
  };

  searchNode(root);

  return {
    folders: allFolders.sort((a, b) => a.name.localeCompare(b.name)),
    reports: allReports.sort((a, b) => a.searchName.localeCompare(b.searchName)),
  };
}

/**
 * Gets sorted immediate children of a folder
 */
export function getFolderContents(node: FolderNode): {
  folders: FolderNode[];
  reports: EmisReport[];
} {
  const folders = Array.from(node.children.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const reports = [...node.reports].sort((a, b) =>
    a.searchName.localeCompare(b.searchName)
  );

  return { folders, reports };
}

/**
 * Counts total reports in a folder including all subfolders
 */
export function countReportsInFolder(node: FolderNode): number {
  let count = node.reports.length;
  node.children.forEach((child) => {
    count += countReportsInFolder(child);
  });
  return count;
}
