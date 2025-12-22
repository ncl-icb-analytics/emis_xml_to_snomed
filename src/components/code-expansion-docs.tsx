'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, CheckCircle2, XCircle, AlertCircle, FileText, Database, Code, Network, FileCode } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface CodeExpansionDocsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CodeExpansionDocs({ open, onOpenChange }: CodeExpansionDocsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Documentation</DialogTitle>
          <DialogDescription className="text-base">
            How the system parses XML files and expands codes into SNOMED CT concepts
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="xml-parsing" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="xml-parsing">XML Parsing</TabsTrigger>
            <TabsTrigger value="code-expansion">Code Expansion Routing</TabsTrigger>
          </TabsList>

          <TabsContent value="xml-parsing" className="space-y-6 py-4 mt-4">
            {/* XML Parsing Content */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Overview
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                The system reads EMIS XML export files directly in your browser to extract search reports, value sets, and codes.
                The XML structure is navigated hierarchically to build a structured representation of the data.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs font-medium text-blue-900 mb-1">Client-Side Processing for Security</p>
                <p className="text-xs text-blue-800">
                  All XML processing happens entirely in your browser—the file never reaches our servers. This protects the
                  application from malicious file uploads and potential security threats. Parsed data is stored locally in IndexedDB
                  for fast access and to handle large files (50MB+) efficiently.
                </p>
              </div>
            </section>

            <Separator />

            {/* XML Structure Example */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                XML Structure Example
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                A simplified example of how a report appears in the EMIS XML and how we extract it:
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                <div>
                  <p className="text-xs font-medium mb-2">XML Structure:</p>
                  <div className="border rounded overflow-hidden">
                    <Editor
                      height="400px"
                      defaultLanguage="xml"
                      value={`<enquiryDocument>
  <reportFolder id="folder1" name="Clinical Searches">
    <report>
      <name>[Search Name] Report Title</name>
      <population>
        <criteriaGroup>
          <definition>
            <criteria>
              <criterion>
                <filterAttribute>
                  <columnValue>
                    <valueSet codeSystem="SNOMED_CONCEPT">
                      <values>
                        <value>239887007</value>
                        <displayName>Beta blocker</displayName>
                        <includeChildren>true</includeChildren>
                        <isRefset>false</isRefset>
                      </values>
                      <values>
                        <value>14405791000006110</value>
                        <displayName>UK Primary Care refset</displayName>
                        <includeChildren>false</includeChildren>
                        <isRefset>true</isRefset>
                      </values>
                    </valueSet>
                  </columnValue>
                </filterAttribute>
              </criterion>
            </criteria>
          </definition>
        </criteriaGroup>
      </population>
    </report>
  </reportFolder>
</enquiryDocument>`}
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 12,
                        lineNumbers: 'on',
                        wordWrap: 'on',
                        automaticLayout: true,
                        theme: 'vs',
                        stickyScroll: { enabled: false },
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium mb-1">How We Parse It:</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1 ml-2">
                      <li><strong>Report name:</strong> Extracted from <code className="text-xs bg-muted px-1 py-0.5 rounded">name</code> element</li>
                      <li><strong>Search name:</strong> Extracted from brackets in name: <code className="text-xs bg-muted px-1 py-0.5 rounded">[Search Name]</code></li>
                      <li><strong>Folder path:</strong> Built from <code className="text-xs bg-muted px-1 py-0.5 rounded">reportFolder</code> hierarchy</li>
                      <li><strong>Value sets:</strong> Extracted from nested <code className="text-xs bg-muted px-1 py-0.5 rounded">valueSet</code> elements in criteria</li>
                      <li><strong>Codes:</strong> Each <code className="text-xs bg-muted px-1 py-0.5 rounded">values</code> element contains code, displayName, includeChildren, isRefset</li>
                      <li><strong>Code system:</strong> From <code className="text-xs bg-muted px-1 py-0.5 rounded">codeSystem</code> attribute (SNOMED_CONCEPT, SCT_CONST, EMISINTERNAL, etc.)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Step 1: Reading the XML Structure */}
            <section>
              <div className="flex items-start gap-3 mb-3">
                <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  1
                </Badge>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Reading the XML Structure</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    We navigate through the XML hierarchy to extract the key components. The system reads the structure
                    starting from the root <code className="text-xs bg-muted px-1 py-0.5 rounded">enquiryDocument</code> element
                    and traverses down through folders, reports, and value sets.
                  </p>
                  <div className="space-y-2 ml-4">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Report Folders</p>
                        <p className="text-xs text-muted-foreground">
                          We read the <code className="text-xs bg-muted px-1 py-0.5 rounded">reportFolder</code> hierarchy
                          to build the folder tree structure. Each folder can contain nested folders and reports.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Search Reports</p>
                        <p className="text-xs text-muted-foreground">
                          For each <code className="text-xs bg-muted px-1 py-0.5 rounded">report</code> element, we extract:
                          the report name (from <code className="text-xs bg-muted px-1 py-0.5 rounded">name</code>),
                          search name (from brackets like <code className="text-xs bg-muted px-1 py-0.5 rounded">[Search Name]</code>),
                          and navigate into the <code className="text-xs bg-muted px-1 py-0.5 rounded">population</code> structure
                          to find value sets.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Value Sets</p>
                        <p className="text-xs text-muted-foreground">
                          We traverse through <code className="text-xs bg-muted px-1 py-0.5 rounded">criteriaGroup</code> →
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">criteria</code> →
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">criterion</code> →
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">filterAttribute</code> →
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">columnValue</code> to find
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">valueSet</code> elements. Each value set
                          contains multiple <code className="text-xs bg-muted px-1 py-0.5 rounded">values</code> entries.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            <Separator />

            {/* Step 2: Extracting Codes from Value Sets */}
            <section>
              <div className="flex items-start gap-3 mb-3">
                <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  2
                </Badge>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Extracting Codes from Value Sets</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    For each <code className="text-xs bg-muted px-1 py-0.5 rounded">values</code> element within a value set,
                    we read the code and its associated metadata.
                  </p>
                  <div className="space-y-2 ml-4">
                    <div className="flex items-start gap-2">
                      <Code className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Reading Code Values</p>
                        <p className="text-xs text-muted-foreground">
                          The code itself is read from the <code className="text-xs bg-muted px-1 py-0.5 rounded">value</code> element.
                          This is the SNOMED CT concept code or EMIS code that will be used for expansion.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Reading Metadata</p>
                        <p className="text-xs text-muted-foreground">
                          We also read the <code className="text-xs bg-muted px-1 py-0.5 rounded">displayName</code>,
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">includeChildren</code> flag (whether to expand
                          child concepts), and <code className="text-xs bg-muted px-1 py-0.5 rounded">isRefset</code> flag
                          (whether this is a refset ID that needs expansion).
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Filtering Values</p>
                        <p className="text-xs text-muted-foreground">
                          We skip certain placeholder values like status codes (ACTIVE, REVIEW, ENDED), empty values (N/A, None),
                          and specific SNOMED placeholder codes that aren't real concepts.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Step 3: Fast Client-Side Storage */}
            <section>
              <div className="flex items-start gap-3 mb-3">
                <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  3
                </Badge>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Fast Client-Side Storage</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Once we've read and structured the XML data, we store it locally in your browser using IndexedDB.
                    This allows for fast retrieval without re-parsing, and keeps all data secure on your device.
                  </p>
                  <div className="space-y-2 ml-4">
                    <div className="flex items-start gap-2">
                      <Database className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">IndexedDB for Large Files</p>
                        <p className="text-xs text-muted-foreground">
                          IndexedDB can handle very large files (50MB+) efficiently. Once parsed, the structured data
                          is stored here so it can be quickly retrieved when you switch between explore and extract modes,
                          or refresh the page. Since files are processed client-side, malicious content never reaches the server,
                          keeping the application secure from potential file upload attacks.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Deterministic IDs</p>
                        <p className="text-xs text-muted-foreground">
                          Each report gets a unique ID generated from its content (name, search name, folder path, value sets).
                          This ensures the same report always gets the same ID, making it easy to track and reference reports
                          across sessions.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Minimal Data Format</p>
                        <p className="text-xs text-muted-foreground">
                          Only essential data is stored: report IDs, names, value set structures, and code metadata.
                          Full display names are preserved only when different from codes. This minimises storage size
                          while preserving all necessary information for code expansion.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="code-expansion" className="space-y-6 py-4 mt-4">
            {/* Overview */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Network className="h-5 w-5" />
                Overview
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Each code goes through a routing process to translate it from EMIS to SNOMED CT and expand it into
                a complete set of concepts. The system tries multiple approaches in sequence, using fallbacks when
                primary methods don't work.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-xs font-medium text-green-900 mb-1">Server-Side Processing</p>
                <p className="text-xs text-green-800">
                  Code expansion happens on the server to securely access terminology servers and RF2 files stored on the server.
                  The server handles translation, refset lookups, and concept expansion, then returns the results to your browser.
                </p>
              </div>
            </section>

          <Separator />

          {/* Step 1: ConceptMap Translation */}
          <section>
            <div className="flex items-start gap-3 mb-3">
              <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                1
              </Badge>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">ConceptMap Translation</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  All codes are first attempted to be translated from EMIS to SNOMED CT using FHIR ConceptMap resources.
                  The system tries a primary map, and if that fails, falls back to a secondary map specifically for drug codes.
                </p>
                
                <div className="space-y-2 ml-4">
                  <div className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Primary ConceptMap</p>
                      <p className="text-xs text-muted-foreground">
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">8d2953a3-b70b-4727-8a6a-8b4d912535ad</code>
                        {' '}(Version 2.1.4) - EMIS to SNOMED CodeID mapping
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Fallback ConceptMap</p>
                      <p className="text-xs text-muted-foreground">
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">b5519813-31eb-4cad-8c77-b8999420e3c9</code>
                        {' '}(Version 7.1.1) - DrugCodeID fallback for drug codes
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 mt-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Equivalence Filtering</p>
                      <p className="text-xs text-muted-foreground">
                        Only accepts mappings with equivalence <code className="text-xs bg-muted px-1 py-0.5 rounded">equivalent</code> or <code className="text-xs bg-muted px-1 py-0.5 rounded">narrower</code>.
                        Rejects <code className="text-xs bg-muted px-1 py-0.5 rounded">broader</code> or <code className="text-xs bg-muted px-1 py-0.5 rounded">related</code> mappings.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 mt-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Translation Failure</p>
                      <p className="text-xs text-muted-foreground">
                        If both ConceptMaps fail (404 not found, wrong equivalence, or other error), the code proceeds to
                        refset detection and historical resolution. It may be a refset in RF2, or assumed to be an
                        already-valid SNOMED CT concept.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Step 2: Refset Detection (for untranslated codes) */}
          <section>
            <div className="flex items-start gap-3 mb-3">
              <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                2
              </Badge>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Refset Detection (for Untranslated Codes)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Codes that failed ConceptMap translation are checked against local RF2 refset files to see if they
                  are refset IDs that need expansion.
                </p>
                <div className="flex items-start gap-2 ml-4">
                  <Code className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    If found in RF2, the code is marked as a refset and will be expanded from RF2 files in the next step.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Step 3: Historical Resolution */}
          <section>
            <div className="flex items-start gap-3 mb-3">
              <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                3
              </Badge>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Historical Concept Resolution</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  All SNOMED CT codes (translated or original) are checked against the terminology server to resolve
                  historical/inactive concepts to their current active equivalents.
                </p>
                <div className="flex items-start gap-2 ml-4">
                  <Database className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Uses FHIR <code className="text-xs bg-muted px-1 py-0.5 rounded">$lookup</code> operation to find
                    the current concept ID and display name for historical concepts.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Step 4: Refset Detection (from XML) */}
          <section>
            <div className="flex items-start gap-3 mb-3">
              <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                4
              </Badge>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Refset Detection (from XML)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Codes marked with <code className="text-xs bg-muted px-1 py-0.5 rounded">isRefset=true</code> in the XML
                  are identified as refsets that need expansion.
                </p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Step 5: Refset Expansion */}
          <section>
            <div className="flex items-start gap-3 mb-3">
              <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                5
              </Badge>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Refset Expansion</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Refsets are expanded to retrieve their member concepts using a prioritized approach.
                </p>
                
                <div className="space-y-3 ml-4">
                  <div className="border-l-2 border-blue-500 pl-3">
                    <p className="text-sm font-medium mb-1">Primary: RF2 File Expansion</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Refsets are first checked against local RF2 Simple Refset files on the server file system.
                      If found, members are loaded directly from the file for fast, reliable expansion.
                    </p>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-start gap-2">
                        <FileText className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          Display names are loaded from RF2 Description files (UK Primary Care concepts)
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Database className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          Missing display names are fetched from terminology server (standard SNOMED concepts)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-2 border-orange-500 pl-3">
                    <p className="text-sm font-medium mb-1">Fallback: ECL Query</p>
                    <p className="text-xs text-muted-foreground">
                      If a refset is not found in RF2 files, it falls back to ECL query expansion using the
                      terminology server with the <code className="text-xs bg-muted px-1 py-0.5 rounded">^</code> operator.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Step 6: Non-Refset Expansion */}
          <section>
            <div className="flex items-start gap-3 mb-3">
              <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                6
              </Badge>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Expansion</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Codes that are not refsets are expanded using ECL (Expression Constraint Language) queries.
                  Refsets are handled separately in the previous step.
                </p>
                
                <div className="space-y-2 ml-4">
                  <div className="flex items-start gap-2">
                    <Code className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">ECL Query Construction</p>
                      <p className="text-xs text-muted-foreground mb-1">
                        Codes are batched into efficient ECL queries to minimise server requests:
                      </p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5 ml-2">
                        <li>Multiple codes combined with <code className="text-xs bg-muted px-1 py-0.5 rounded">OR</code></li>
                        <li>Excluded codes added with <code className="text-xs bg-muted px-1 py-0.5 rounded">MINUS</code></li>
                        <li>Child concepts included with <code className="text-xs bg-muted px-1 py-0.5 rounded">&lt;&lt;</code> when <code className="text-xs bg-muted px-1 py-0.5 rounded">includeChildren=true</code></li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 mt-3">
                    <Database className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Terminology Server Expansion</p>
                      <p className="text-xs text-muted-foreground">
                        ECL queries are executed via FHIR <code className="text-xs bg-muted px-1 py-0.5 rounded">$expand</code> operation
                        on the terminology server to retrieve all matching concepts.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Step 7: SCT_CONST Handling */}
          <section>
            <div className="flex items-start gap-3 mb-3">
              <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                7
              </Badge>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">SCT_CONST (UK Products)</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Codes with <code className="text-xs bg-muted px-1 py-0.5 rounded">codeSystem="SCT_CONST"</code> represent
                  substance codes that need to be expanded to UK Product concepts.
                </p>
                
                <div className="space-y-2 ml-4">
                  <div className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Special ECL Query</p>
                      <p className="text-xs text-muted-foreground mb-1">
                        Uses a specialised ECL query to find all UK Products containing the substance:
                      </p>
                      <code className="text-xs bg-muted px-2 py-1.5 rounded-md block mt-1 font-mono break-all">
                        {'<< (< 10363601000001109 |UK Product| : 762949000 |Has precise active ingredient| = << <SUBSTANCE_CODE>)'}
                      </code>
                      <p className="text-xs text-muted-foreground mt-2">
                        This query finds all descendants of UK Products that have the specified substance as a precise active ingredient.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Failed Codes */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Failed Codes
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              A code is marked as "failed" if it doesn't appear in the final expanded concept set after all expansion attempts.
            </p>
            
            <div className="space-y-3 ml-4">
              <div className="border-l-2 border-destructive pl-3">
                <p className="text-sm font-medium mb-1">Failure Reasons</p>
                <div className="space-y-2 mt-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">No ConceptMap Translation</p>
                    <p className="text-xs text-muted-foreground">
                      Code wasn't found in either ConceptMap, wasn't detected as a refset in RF2, and doesn't appear
                      in the expanded concepts. Reason: <code className="text-xs bg-muted px-1 py-0.5 rounded">"No translation found from ConceptMap"</code>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Not Found in Expansion</p>
                    <p className="text-xs text-muted-foreground">
                      Code was translated by ConceptMap but doesn't appear in the final expanded concept set.
                      Reason: <code className="text-xs bg-muted px-1 py-0.5 rounded">"Not found in terminology server expansion"</code>
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-l-2 border-green-500 pl-3">
                <p className="text-sm font-medium mb-1">Exclusions from Failed Codes</p>
                <div className="space-y-1 mt-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      <strong>SCT_CONST codes</strong> that successfully expanded to UK Products (substance code itself won't appear, only products)
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      <strong>Refsets</strong> that successfully expanded from RF2 (refset ID itself isn't a concept, only members are)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Request Architecture */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Network className="h-5 w-5" />
              Request Architecture
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Each value set is expanded via a separate API request. This architecture is crucial for handling
              large XML files with many reports and value sets without hitting server-side timeouts.
            </p>
            
            <div className="space-y-3 ml-4">
              <div className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Individual Value Set Requests</p>
                  <p className="text-xs text-muted-foreground">
                    When expanding a report, each value set within that report is expanded via a separate API call.
                    The client makes sequential requests, waiting for each to complete before starting the next.
                    This allows the application to handle very long-running extractions without server timeouts.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Database className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Client-Side Result Storage</p>
                  <p className="text-xs text-muted-foreground">
                    Results are stored entirely on the client side—in React state for immediate display, and in IndexedDB
                    for persistence. Each completed value set expansion is immediately available in the UI, providing
                    progressive feedback as extraction proceeds.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">No Server-Side Timeouts</p>
                  <p className="text-xs text-muted-foreground">
                    Because each value set expansion is a separate, relatively quick request (typically a few seconds),
                    the application can process hundreds of value sets across many reports without encountering
                    server-side timeout limits that would occur with a single long-running request.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Extract Process */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Extract Process & Data Models
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              In extract mode, the system processes multiple reports and creates normalised data models suitable
              for export and analysis. Each report's value sets are expanded individually, and results are structured
              into relational tables.
            </p>
            
            <div className="space-y-3 ml-4">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  1
                </Badge>
                <div>
                  <p className="text-sm font-medium">Report Selection</p>
                  <p className="text-xs text-muted-foreground">
                    Users select one or more reports from the parsed XML. Each report contains multiple value sets
                    that need expansion.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  2
                </Badge>
                <div>
                  <p className="text-sm font-medium">Sequential Value Set Expansion</p>
                  <p className="text-xs text-muted-foreground">
                    For each selected report, value sets are expanded one at a time via separate API requests.
                    Each expansion follows the routing process described above (ConceptMap translation, refset detection,
                    historical resolution, expansion).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  3
                </Badge>
                <div>
                  <p className="text-sm font-medium">Normalised Data Model Creation</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Results are structured into six relational tables:
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5 ml-2">
                    <li><strong>ValueSets:</strong> Metadata for each value set (ID, hash, friendly name, code system, errors)</li>
                    <li><strong>Original Codes:</strong> The original codes from XML with translation results</li>
                    <li><strong>Expanded Concepts:</strong> All SNOMED concepts resulting from expansion</li>
                    <li><strong>Failed Codes:</strong> Codes that couldn't be translated or expanded</li>
                    <li><strong>Exceptions:</strong> Codes explicitly excluded from value sets</li>
                    <li><strong>Refset Metadata:</strong> Information about refsets (display names, member counts)</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  4
                </Badge>
                <div>
                  <p className="text-sm font-medium">Progressive Display & Export</p>
                  <p className="text-xs text-muted-foreground">
                    As each value set completes, results are immediately added to the normalised data tables.
                    Users can view progress in real-time and export the complete dataset once all value sets are processed.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Summary Flow */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Summary Flow</h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="shrink-0">EMIS Code</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">ConceptMap Translation</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">RF2 Refset Check</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Historical Resolution</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="shrink-0">SNOMED Code</Badge>
              </div>
              <div className="flex items-center gap-2 ml-8">
                <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
              </div>
              <div className="flex items-center gap-2 ml-8">
                <Badge variant="secondary" className="shrink-0">Is Refset?</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">RF2 File</span>
                <span className="text-muted-foreground">OR</span>
                <span className="text-muted-foreground">ECL Query</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="shrink-0">Expanded Concepts</Badge>
              </div>
              <div className="flex items-center gap-2 ml-8 mt-2 pt-2 border-t border-border">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-xs text-muted-foreground">
                  Codes not in final expansion → <strong>Failed Codes</strong>
                </span>
              </div>
            </div>
          </section>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

