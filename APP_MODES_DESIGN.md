# App Modes Design: Explorer & Exporter

## Overview
Split the application into two distinct modes with different purposes and UIs.

## Mode 1: Explorer Mode
**Purpose**: Explore and analyse XML data, expand codes, view results

### Features:
- Browse folder structure
- Select individual reports
- Expand codes using terminology server
- View expanded concepts in tables
- Copy SQL-formatted code lists
- Export individual reports as CSV

### UI:
- Current functionality
- Focus on single report at a time
- Detailed code expansion view

## Mode 2: Exporter Mode
**Purpose**: Select multiple reports, view normalised data, export to Snowflake

### Features:
- Browse all reports with checkboxes
- Select multiple reports for export
- View normalised data model (all tables)
- Preview data before export
- Export selected reports to CSV/Snowflake
- Bulk operations

### UI:
- Report list with checkboxes
- Normalised table views (reports, valuesets, codes, concepts)
- Export configuration panel
- Progress tracking for bulk operations

## Implementation Approach

### Option A: Tabs in Header
```
[Explorer] [Exporter]
```
- Simple tab switcher in header
- Same sidebar, different main content
- Mode state in URL or state management

### Option B: Mode Switcher in Sidebar
```
Sidebar Header
[Explorer] [Exporter] ← Mode buttons
```
- Mode selector in sidebar header
- Different sidebar content per mode
- Clear separation

### Option C: Separate Routes
```
/explorer
/exporter
```
- Different pages/routes
- Can bookmark specific mode
- More separation but requires routing

## Recommended: Option B (Mode Switcher in Sidebar)

### Benefits:
- Clear visual separation
- Sidebar can adapt per mode
- Single page, simpler state management
- Easy to switch between modes

### Sidebar Structure:

**Explorer Mode:**
```
EMIS XML Analyser
SNOMED CT Code Expansion

[Explorer] [Exporter] ← Mode switcher

XML File
  [Upload component]

Search Reports
  [Folder tree navigation]
```

**Exporter Mode:**
```
EMIS XML Analyser
SNOMED CT Export

[Explorer] [Exporter] ← Mode switcher

XML File
  [Upload component]

Reports for Export
  [Report list with checkboxes]
  [Select All / Deselect All]
  [X reports selected]

Export Options
  [Export format dropdown]
  [Export button]
```

## State Management

### Shared State:
- Parsed XML data (sessionStorage)
- Selected mode (localStorage or state)

### Mode-Specific State:
- **Explorer**: selectedReport, expandedData
- **Exporter**: selectedReportIds (Set), exportConfig

## Component Structure

```
app/
  layout.tsx (shared sidebar, header)
  page.tsx (mode router)
  
components/
  explorer/
    explorer-view.tsx
    code-display.tsx (existing)
    
  exporter/
    exporter-view.tsx
    report-selector.tsx
    normalised-data-view.tsx
    export-panel.tsx
    
  app-sidebar.tsx (mode-aware sidebar)
```

## User Flow

### Explorer Mode:
1. Upload XML
2. Browse folders
3. Click report → view details
4. Expand codes → see results
5. Copy/export individual report

### Exporter Mode:
1. Upload XML (shared)
2. Browse reports with checkboxes
3. Select reports to export
4. View normalised data tables
5. Configure export options
6. Export to CSV/Snowflake

## Next Steps

1. Add mode state management
2. Create mode switcher component
3. Split sidebar into mode-specific content
4. Create exporter view components
5. Implement report selection UI
6. Build normalised data view
7. Add export functionality

