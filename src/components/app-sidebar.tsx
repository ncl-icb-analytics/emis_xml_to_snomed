'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from '@/components/ui/sidebar';
import XmlUploader from '@/components/xml-uploader';
import FolderTreeNavigation from '@/components/folder-tree-navigation';
import BatchReportSelector from '@/components/batch-report-selector';
import { Separator } from '@/components/ui/separator';
import ModeToggle from '@/components/mode-toggle';
import { useAppMode } from '@/contexts/AppModeContext';

export function AppSidebar() {
  const { mode } = useAppMode();

  return (
    <Sidebar collapsible="icon" style={{ '--sidebar-width': '28rem' } as React.CSSProperties}>
      <SidebarHeader>
        <div className="px-2 py-4 space-y-3">
          <div>
            <h1 className="text-lg font-bold">EMIS XML Analyser</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              SNOMED CT Code Expansion
            </p>
          </div>
          <ModeToggle />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>XML File</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <XmlUploader />
          </SidebarGroupContent>
        </SidebarGroup>
        <Separator />
        <SidebarGroup>
          <SidebarGroupLabel>
            {mode === 'explore' ? 'Search Reports' : 'Select Reports'}
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            {mode === 'explore' ? (
              <FolderTreeNavigation />
            ) : (
              <BatchReportSelector />
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
