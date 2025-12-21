import { EmisValue } from './types';

/**
 * Separates values into refsets and non-refsets
 */
export function separateRefsets(values: EmisValue[]): {
  refsets: EmisValue[];
  nonRefsets: EmisValue[];
} {
  const refsets = values.filter((v) => v.isRefset);
  const nonRefsets = values.filter((v) => !v.isRefset);
  return { refsets, nonRefsets };
}

export function buildBatchedEclQuery(
  values: EmisValue[],
  excludedCodes: string[]
): string {
  // Filter out invalid codes (non-numeric codes like 'M', 'F', etc.)
  // SNOMED CT codes should be numeric strings, 6-18 digits long
  const isValidSnomedCode = (code: string): boolean => {
    // Check if code is numeric (allows digits only)
    // SNOMED CT Concept IDs are 6-18 digits long
    return /^\d+$/.test(code) && code.length >= 6 && code.length <= 18;
  };

  // Filter and deduplicate values
  const validValues = values.filter((v) => {
    if (!isValidSnomedCode(v.code)) {
      console.warn('Filtering out invalid SNOMED code:', v.code);
      return false;
    }
    return true;
  });

  // Remove duplicates by code
  const uniqueValues = new Map<string, EmisValue>();
  validValues.forEach((v) => {
    if (!uniqueValues.has(v.code)) {
      uniqueValues.set(v.code, v);
    } else {
      console.warn('Removing duplicate code:', v.code);
    }
  });
  const deduplicatedValues = Array.from(uniqueValues.values());

  // Group by type: refsets, codes with children, codes without children
  const refsets = deduplicatedValues.filter((v) => v.isRefset);
  const withChildren = deduplicatedValues.filter((v) => !v.isRefset && v.includeChildren);
  const withoutChildren = deduplicatedValues.filter((v) => !v.isRefset && !v.includeChildren);

  console.log(`ECL Builder - Total: ${deduplicatedValues.length}, Refsets: ${refsets.length}, With descendants (<<): ${withChildren.length}, Exact match: ${withoutChildren.length}`);
  if (withChildren.length > 0) {
    console.log(`Codes with descendants (<< operator):`, withChildren.map(v => v.code).slice(0, 10));
  }


  const parts: string[] = [];

  // Add refsets (using ^ operator)
  if (refsets.length > 0) {
    const refsetParts = refsets.map((v) => `^ ${v.code}`);
    parts.push(...refsetParts);
  }

  // Add codes with descendants (using <<)
  if (withChildren.length > 0) {
    const descendantParts = withChildren.map((v) => `<< ${v.code}`);
    parts.push(...descendantParts);
  }

  // Add exact match codes (no operator, but still need OR separators)
  if (withoutChildren.length > 0) {
    const exactParts = withoutChildren.map((v) => v.code);
    parts.push(...exactParts);
  }

  // Combine ALL parts with OR operator (ensuring consistent formatting)
  // Every part should be separated by OR, regardless of operator type
  let eclExpression = parts.join(' OR ');

  // If no parts, return empty string (will be handled by caller)
  if (!eclExpression || eclExpression.trim() === '') {
    return '';
  }

  // Add exclusions if present
  if (excludedCodes.length > 0) {
    const exclusions = excludedCodes.map((code) => `<< ${code}`).join(' OR ');
    eclExpression = `(${eclExpression}) MINUS (${exclusions})`;
  }

  return eclExpression;
}

/**
 * Builds an ECL query for non-refset codes only (excludes refsets)
 */
export function buildBatchedEclQueryWithoutRefsets(
  values: EmisValue[],
  excludedCodes: string[]
): string {
  const nonRefsets = values.filter((v) => !v.isRefset);
  return buildBatchedEclQuery(nonRefsets, excludedCodes);
}

export function estimateEclComplexity(eclExpression: string): number {
  // Rough estimate of query complexity for rate limiting
  const orCount = (eclExpression.match(/OR/g) || []).length;
  const descendantCount = (eclExpression.match(/<</g) || []).length;
  return orCount + descendantCount * 2;
}

/**
 * Builds an ECL query to expand UK Products for a given substance code
 * Format: << (< 10363601000001109 |UK Product| : 762949000 |Has precise active ingredient| = << {substanceCode})
 */
export function buildUkProductEcl(substanceCode: string): string {
  const UK_PRODUCT_CONCEPT = '10363601000001109';
  const HAS_PRECISE_ACTIVE_INGREDIENT = '762949000';
  
  return `<< (< ${UK_PRODUCT_CONCEPT} |UK Product| : ${HAS_PRECISE_ACTIVE_INGREDIENT} |Has precise active ingredient| = << ${substanceCode})`;
}
