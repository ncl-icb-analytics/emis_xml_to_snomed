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
import { Separator } from '@/components/ui/separator';

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" style={{ '--sidebar-width': '28rem' } as React.CSSProperties}>
      <SidebarHeader>
        <div className="px-2 py-4">
          <h1 className="text-lg font-bold">EMIS XML Analyser</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            SNOMED CT Code Expansion
          </p>
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
          <SidebarGroupLabel>Search Reports</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <FolderTreeNavigation />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
