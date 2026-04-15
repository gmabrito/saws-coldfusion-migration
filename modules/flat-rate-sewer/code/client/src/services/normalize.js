/**
 * Normalize API response keys from PascalCase (SQL Server) to snake_case (UI).
 * The server returns PascalCase (AccountNum, BusinessName) but UI code uses snake_case.
 * This runs on every API response so pages don't need to handle both formats.
 */

function pascalToSnake(str) {
  return str.replace(/([A-Z])/g, (match, p1, offset) =>
    offset > 0 ? '_' + p1.toLowerCase() : p1.toLowerCase()
  );
}

function normalizeKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(normalizeKeys);
  }
  if (obj && typeof obj === 'object' && !(obj instanceof Date)) {
    const normalized = {};
    for (const [key, value] of Object.entries(obj)) {
      normalized[pascalToSnake(key)] = normalizeKeys(value);
    }
    return normalized;
  }
  return obj;
}

export { normalizeKeys, pascalToSnake };
