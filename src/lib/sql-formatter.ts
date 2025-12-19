export function formatForSql(codes: string[]): string {
  // Format as single-quoted, comma-separated values for SQL IN clause
  // Example: '123456', '789012', '345678'
  return codes.map((code) => `'${code}'`).join(', ');
}

export function generateSqlInClause(
  codes: string[],
  columnName: string = 'code'
): string {
  // Generate complete SQL IN clause
  // Example: WHERE code IN ('123456', '789012', '345678')
  return `WHERE ${columnName} IN (${formatForSql(codes)})`;
}
