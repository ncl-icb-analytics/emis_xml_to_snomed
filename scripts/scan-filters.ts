// Scans all reports for column filters and reports which columns appear,
// how many have empty value sets after parsing, and EPISODE examples.
import fs from 'fs';
import path from 'path';
import { parseEmisXml } from '../src/lib/xml-parser';
import type { SearchCriterion } from '../src/lib/types';

async function main() {
  const xmlPath = path.join(__dirname, '..', 'NCL LTC LCS R5 updated 27112025.xml');
  const doc = await parseEmisXml(fs.readFileSync(xmlPath, 'utf-8'));

  const columnCounts = new Map<string, { total: number; emptyVs: number; withVs: number; withRange: number; withSingle: number }>();
  const episodeExamples: string[] = [];

  const visit = (criteria: SearchCriterion[], reportName: string) => {
    for (const c of criteria) {
      for (const f of c.columnFilters) {
        const col = (f.columns[0] || '?').toUpperCase();
        const entry = columnCounts.get(col) || { total: 0, emptyVs: 0, withVs: 0, withRange: 0, withSingle: 0 };
        entry.total++;
        const vsValues = (f.valueSets || []).reduce((sum, vs) => sum + vs.values.length, 0);
        if ((f.valueSets || []).length > 0 && vsValues === 0) entry.emptyVs++;
        if (vsValues > 0) entry.withVs++;
        if (f.range) entry.withRange++;
        if (f.singleValue) entry.withSingle++;
        columnCounts.set(col, entry);

        if (col === 'EPISODE' && episodeExamples.length < 8) {
          episodeExamples.push(`${reportName} :: ${JSON.stringify({ inNotIn: f.inNotIn, single: f.singleValue, vs: (f.valueSets || []).map((vs) => ({ sys: vs.codeSystem, values: vs.values.map((v) => `${v.code}:${v.displayName}`) })) })}`);
        }
      }
      visit(c.linkedCriteria, reportName);
    }
  };

  for (const report of doc.reports) {
    for (const group of report.criteriaGroups ?? []) visit(group.criteria, report.searchName);
    for (const group of report.columnGroups ?? []) visit(group.criteria, report.searchName);
  }

  console.log('Column filter usage (column: total / withValues / EMPTY-after-parse / range / single):');
  for (const [col, entry] of [...columnCounts.entries()].sort((a, b) => b[1].total - a[1].total)) {
    console.log(`  ${col}: ${entry.total} / ${entry.withVs} / ${entry.emptyVs} / ${entry.withRange} / ${entry.withSingle}`);
  }
  console.log('\nEPISODE examples:');
  for (const example of episodeExamples) console.log(`  ${example}`);
}

main();
