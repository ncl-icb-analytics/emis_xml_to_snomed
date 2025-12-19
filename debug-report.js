const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');

const xmlContent = fs.readFileSync('NCL LTC LCS R5 updated 27112025.xml', 'utf8');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  removeNSPrefix: true,
  parseAttributeValue: false,
  trimValues: true,
  isArray: (name) => ['folder', 'report', 'criterion', 'valueSet', 'value', 'exception'].includes(name)
});

const result = parser.parse(xmlContent);
const reports = result?.export?.folder?.flatMap(f => f?.report || []) || [];

console.log('Total reports:', reports.length);

// Search for reports with "HRC" in the name
console.log('\n=== Reports containing "HRC" ===');
const hrcReports = reports.filter(r => r?.name && r.name.includes('HRC'));
console.log('Found:', hrcReports.length);

hrcReports.slice(0, 5).forEach(r => {
  console.log('\nReport name:', r.name);
  const criteria = r.criterion || [];
  console.log('Criteria count:', criteria.length);

  if (criteria.length > 0) {
    const valueSets = criteria[0]?.valueSet || [];
    console.log('First criterion valueSets:', valueSets.length);
  }
});

// Search for the pattern more broadly
console.log('\n\n=== Looking for "Diabetes Register" pattern ===');
const diabetesReports = reports.filter(r => r?.name && r.name.toLowerCase().includes('diabetes register'));
console.log('Found:', diabetesReports.length);

diabetesReports.slice(0, 3).forEach(r => {
  console.log('\n---');
  console.log('Name:', r.name);
  const criteria = r.criterion || [];
  console.log('Criteria:', criteria.length);
});
