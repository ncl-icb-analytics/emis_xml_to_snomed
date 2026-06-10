// Compares ValueSets reachable through the parsed rule tree against
// report.valueSets (the extraction basis). Reports any code lists that the
// extraction path misses. Diagnostic — run with npx tsx.
import fs from 'fs';
import path from 'path';
import { parseEmisXml } from '../src/lib/xml-parser';
import type { EmisValueSet, SearchCriterion } from '../src/lib/types';

const codeKey = (vs: EmisValueSet) => vs.values.map((v) => v.code).sort().join(',');

async function main() {
  const xmlPath = path.join(__dirname, '..', 'NCL LTC LCS R5 updated 27112025.xml');
  const doc = await parseEmisXml(fs.readFileSync(xmlPath, 'utf-8'));

  let affectedReports = 0;
  let missingTotal = 0;

  for (const report of doc.reports) {
    const extractionKeys = new Set(report.valueSets.map(codeKey));
    const missing = new Map<string, EmisValueSet>();

    const visit = (criteria: SearchCriterion[]) => {
      for (const c of criteria) {
        for (const vs of c.valueSets) {
          if (vs.isAllValuesExcept || vs.values.length === 0) continue;
          const key = codeKey(vs);
          if (!extractionKeys.has(key) && !missing.has(key)) missing.set(key, vs);
        }
        for (const f of c.columnFilters) {
          for (const vs of f.valueSets ?? []) {
            if (vs.isAllValuesExcept || vs.values.length === 0) continue;
            const key = codeKey(vs);
            if (!extractionKeys.has(key) && !missing.has(key)) missing.set(key, vs);
          }
        }
        visit(c.linkedCriteria);
      }
    };
    for (const g of report.criteriaGroups ?? []) visit(g.criteria);
    for (const g of report.columnGroups ?? []) visit(g.criteria);

    if (missing.size > 0) {
      affectedReports++;
      missingTotal += missing.size;
      console.log(`${report.searchName}: ${missing.size} missing from extraction`);
      for (const vs of [...missing.values()].slice(0, 3)) {
        console.log(`   - ${vs.codeSystem} ${vs.values.length} codes${vs.description ? ` (${vs.description})` : ''} e.g. ${vs.values[0].code}`);
      }
    }
  }

  console.log(`\nTotal: ${affectedReports} reports, ${missingTotal} missing valuesets`);
}

main();
