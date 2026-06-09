// Renders the implementation guide for a report from the reference XML.
// Usage: npx tsx scripts/preview-guide.ts [search name substring]
import fs from 'fs';
import path from 'path';
import { parseEmisXml } from '../src/lib/xml-parser';
import { buildImplementationGuideMarkdown } from '../src/lib/agent-report-utils';

async function main() {
  const needle = process.argv[2] || 'COPD Register';
  const xmlPath = path.join(__dirname, '..', 'NCL LTC LCS R5 updated 27112025.xml');
  const doc = await parseEmisXml(fs.readFileSync(xmlPath, 'utf-8'));
  const report = doc.reports.find((r) => r.searchName.toLowerCase().includes(needle.toLowerCase()));
  if (!report) {
    console.error(`No report matching "${needle}"`);
    process.exit(1);
  }
  console.log(buildImplementationGuideMarkdown(report, doc.reports));
}

main();
