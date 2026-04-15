/**
 * Normalize API response keys from PascalCase (SQL Server) to snake_case (UI).
 * Handles edge cases: BOD_PCT stays bod_pct, MeterID stays meter_id, IncomingCCF stays incoming_ccf
 */

function pascalToSnake(str) {
  // Already snake_case or lowercase? Leave it alone.
  if (str === str.toLowerCase() || str.includes('_')) return str.toLowerCase();

  return str
    // Insert _ before transitions like: lowercase→uppercase (meterSize → meter_Size)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    // Insert _ before transitions like: uppercase→uppercase+lowercase (BODPct → BOD_Pct, CCF → CCF)
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
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
