const { getDb, sql } = require('../config/database');

class RateRepository {
  /**
   * Get program control list entries by type.
   * CF origin: getProgramCtrlLists
   */
  async getProgramCtrlLists(ctrlType) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('ctrlType', sql.VarChar(10), ctrlType)
      .query(
        `SELECT * FROM frs.ProgramCtrl
         WHERE CtrlType = @ctrlType
         ORDER BY CtrlKey, EffectiveDate DESC`
      );
    return result.recordset;
  }

  /**
   * Get the current value of a control key as of a given date.
   * CF origin: getCtrlCoreValue
   */
  async getCtrlCoreValue(ctrlKey, effectiveDate) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('ctrlKey', sql.VarChar(50), ctrlKey)
      .input('effectiveDate', sql.Date, effectiveDate || new Date())
      .query(
        `SELECT TOP 1 * FROM frs.ProgramCtrl
         WHERE CtrlKey = @ctrlKey AND EffectiveDate <= @effectiveDate
         ORDER BY EffectiveDate DESC`
      );
    return result.recordset[0] || null;
  }

  /**
   * Set/insert a control value.
   * CF origin: ApplyCtrlCoreValue
   */
  async setCtrlCoreValue(data) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('ctrlType', sql.VarChar(10), data.ctrlType || 'CR')
      .input('ctrlKey', sql.VarChar(50), data.ctrlKey)
      .input('ctrlValue', sql.VarChar(200), data.ctrlValue)
      .input('effectiveDate', sql.Date, data.effectiveDate)
      .input('displayValue', sql.VarChar(200), data.displayValue || data.ctrlValue)
      .query(
        `INSERT INTO frs.ProgramCtrl (CtrlType, CtrlKey, CtrlValue, EffectiveDate, DisplayValue)
         VALUES (@ctrlType, @ctrlKey, @ctrlValue, @effectiveDate, @displayValue);
         SELECT SCOPE_IDENTITY() AS CtrlID;`
      );
    return result.recordset[0];
  }

  /**
   * Get all entries for a specific key.
   * CF origin: getListByKey
   */
  async getListByKey(ctrlKey) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('ctrlKey', sql.VarChar(50), ctrlKey)
      .query(
        `SELECT * FROM frs.ProgramCtrl WHERE CtrlKey = @ctrlKey ORDER BY EffectiveDate DESC`
      );
    return result.recordset;
  }

  /**
   * Insert a new entry for a key.
   * CF origin: putListByKey
   */
  async putListByKey(data) {
    return this.setCtrlCoreValue(data);
  }

  /**
   * Get all rate tiers effective as of a given date.
   * Returns availability charges, tier rates, and OCL rates.
   */
  async getRatesForDate(effectiveDate) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('effectiveDate', sql.Date, effectiveDate || new Date())
      .query(
        `SELECT pc.*
         FROM frs.ProgramCtrl pc
         INNER JOIN (
           SELECT CtrlKey, MAX(EffectiveDate) AS MaxDate
           FROM frs.ProgramCtrl
           WHERE EffectiveDate <= @effectiveDate AND CtrlType = 'CR'
           GROUP BY CtrlKey
         ) latest ON pc.CtrlKey = latest.CtrlKey AND pc.EffectiveDate = latest.MaxDate
         WHERE pc.CtrlType = 'CR'
         ORDER BY pc.CtrlKey`
      );
    return result.recordset;
  }

  /**
   * Get minimum / availability charges by meter size and ICL/OCL.
   */
  async getAvailabilityCharges(effectiveDate) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('effectiveDate', sql.Date, effectiveDate || new Date())
      .query(
        `SELECT pc.*
         FROM frs.ProgramCtrl pc
         INNER JOIN (
           SELECT CtrlKey, MAX(EffectiveDate) AS MaxDate
           FROM frs.ProgramCtrl
           WHERE EffectiveDate <= @effectiveDate AND CtrlKey LIKE 'FRS_SWR_AVAIL_%'
           GROUP BY CtrlKey
         ) latest ON pc.CtrlKey = latest.CtrlKey AND pc.EffectiveDate = latest.MaxDate
         ORDER BY pc.CtrlKey`
      );
    return result.recordset;
  }

  /**
   * Get tiered billing rates.
   */
  async getTierRates(effectiveDate) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('effectiveDate', sql.Date, effectiveDate || new Date())
      .query(
        `SELECT pc.*
         FROM frs.ProgramCtrl pc
         INNER JOIN (
           SELECT CtrlKey, MAX(EffectiveDate) AS MaxDate
           FROM frs.ProgramCtrl
           WHERE EffectiveDate <= @effectiveDate AND CtrlKey LIKE 'FRS_BILL_RATE_%'
           GROUP BY CtrlKey
         ) latest ON pc.CtrlKey = latest.CtrlKey AND pc.EffectiveDate = latest.MaxDate
         ORDER BY pc.CtrlKey`
      );
    return result.recordset;
  }
}

module.exports = RateRepository;
