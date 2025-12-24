/**
 * Hash and ID generation utilities
 *
 * Generic utilities for generating deterministic hashes and IDs,
 * used across the application for duplicate detection and stable identifiers.
 */

/**
 * Generates a deterministic hash from a string using a custom hash algorithm.
 * Uses MurmurHash3-inspired mixing for good distribution and low collision rates.
 *
 * @param str - The string to hash
 * @returns A 14-character hash in base-36 encoding
 */
export const hashString = (str: string): string => {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;

  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hash = (h2 >>> 0).toString(36).padStart(7, '0') + (h1 >>> 0).toString(36).padStart(7, '0');
  return hash;
};

/**
 * Generates a deterministic UUID-like ID based on report characteristics.
 * Ensures consistent IDs across runs for identical reports.
 *
 * @param name - Report name
 * @param searchName - Extracted search name
 * @param rule - Report rule/category
 * @param valueSets - Array of valueSets in the report
 * @param reportIndex - Index of the report in the source
 * @returns A UUID-like string (e.g., "abc12345-6789-abcd-ef01-234567890abc")
 */
export const generateDeterministicId = (
  name: string,
  searchName: string,
  rule: string,
  valueSets: any[],
  reportIndex: number
): string => {
  // Create a detailed string representation of the report's characteristics
  const valueSetsSummary = valueSets.map((vs, idx) => {
    const valueDetails = vs.values?.map((v: any) =>
      `${v.code}:${v.includeChildren || false}:${v.isRefset || false}:${v.displayName || ''}`
    ).sort().join(',') || '';
    const exceptions = vs.exceptions?.map((e: any) => e.code || e).sort().join(',') || '';
    return `${idx}:${vs.codeSystem || ''}:[${valueDetails}]:[${exceptions}]`;
  }).join('|');

  // Include reportIndex to ensure uniqueness even for identical reports
  const content = `${reportIndex}::${name}::${searchName}::${rule}::${valueSetsSummary}`;
  const hash = hashString(content);

  // Format as a UUID-like string for consistency
  const hash1 = hash.substring(0, 8);
  const hash2 = hash.substring(8, 12);
  const hash3 = hash.substring(12, 16);
  const hash4 = hashString(content + 'a').substring(0, 4);
  const hash5 = hashString(content + 'b').substring(0, 12);

  return `${hash1}-${hash2}-${hash3}-${hash4}-${hash5}`;
};
