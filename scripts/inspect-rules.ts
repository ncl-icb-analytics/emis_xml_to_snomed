// Dumps parsed rule structure for a report — for checking parser coverage
// against the raw XML. Usage: npx tsx scripts/inspect-rules.ts "<search name>" [ruleNumbers]
import fs from 'fs';
import path from 'path';
import { parseEmisXml } from '../src/lib/xml-parser';
import type { SearchCriterion } from '../src/lib/types';

async function main() {
  const needle = process.argv[2] || 'Priority Group 2 (HR)';
  const ruleFilter = process.argv[3] ? process.argv[3].split(',').map(Number) : null;
  const xmlPath = path.join(__dirname, '..', 'NCL LTC LCS R5 updated 27112025.xml');
  const doc = await parseEmisXml(fs.readFileSync(xmlPath, 'utf-8'));
  const report = doc.reports.find((r) => r.searchName.toLowerCase().includes(needle.toLowerCase()));
  if (!report) {
    console.error(`No report matching "${needle}"`);
    process.exit(1);
  }
  console.log(`Report: ${report.searchName}`);

  const dump = (c: SearchCriterion, ind: string) => {
    console.log(`${ind}- ${c.displayName || '?'} [${c.table}] neg:${c.negation}`);
    if (c.relationship) {
      console.log(`${ind}  relationship:`, JSON.stringify(c.relationship));
    }
    for (const f of c.columnFilters) {
      console.log(`${ind}  filter:`, JSON.stringify({
        cols: f.columns,
        displayName: f.displayName,
        inNotIn: f.inNotIn,
        single: f.singleValue,
        range: f.range,
        vs: (f.valueSets || []).map((v) => ({
          sys: v.codeSystem,
          n: v.values.length,
          vals: v.values.slice(0, 6).map((x) => `${x.code}:${x.displayName}`),
        })),
      }));
    }
    for (const rst of c.restrictions) {
      console.log(`${ind}  restriction: ${rst.description}`, JSON.stringify(rst.conditions || []));
    }
    for (const vs of c.valueSets) {
      console.log(`${ind}  vs: sys=${vs.codeSystem} n=${vs.values.length} [${vs.values.slice(0, 3).map((v) => `${v.code}:${v.displayName}`).join(' | ')}]${vs.description ? ` cluster=${vs.description}` : ''}`);
    }
    for (const l of c.linkedCriteria) dump(l, `${ind}    `);
  };

  (report.criteriaGroups ?? []).forEach((g, i) => {
    if (ruleFilter && !ruleFilter.includes(i + 1)) return;
    console.log(`\n=== Rule ${i + 1} | ifTrue:${g.actionIfTrue} ifFalse:${g.actionIfFalse} op:${g.memberOperator} libRefs:${(g.libraryItemRefs || []).length}`);
    g.criteria.forEach((c) => dump(c, ''));
  });
}

main();
