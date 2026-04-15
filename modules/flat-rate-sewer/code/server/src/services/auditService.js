const { getDb, sql } = require('../config/database');

class AuditService {
  /**
   * Log an audit action.
   * CF origin: logAction in FRS audit trail
   *
   * @param {string} employeeId - employee ID performing the action
   * @param {string} appId - application identifier (e.g., 'FRS')
   * @param {string} message - description of the action
   * @param {string} level - severity level: INFO, WARN, ERROR
   * @param {string} accountNum - related account number (optional)
   */
  async logAction(employeeId, appId, message, level = 'INFO', accountNum = null) {
    const pool = await getDb();
    await pool
      .request()
      .input('employeeId', sql.VarChar(20), employeeId)
      .input('appId', sql.VarChar(20), appId || 'FRS')
      .input('message', sql.NVarChar(sql.MAX), message)
      .input('level', sql.VarChar(10), level)
      .input('accountNum', sql.VarChar(20), accountNum)
      .query(
        `INSERT INTO frs.AuditLog (EmployeeID, Timestamp, AppID, Message, Level, AccountNum)
         VALUES (@employeeId, GETDATE(), @appId, @message, @level, @accountNum)`
      );
  }

  /**
   * Get audit log entries with optional filters.
   *
   * @param {string} accountNum - filter by account number
   * @param {Object} dateRange - { startDate, endDate }
   * @param {number} limit - max rows to return
   */
  async getAuditLog(accountNum, dateRange = {}, limit = 100) {
    const pool = await getDb();
    const request = pool.request();
    const conditions = [];

    if (accountNum) {
      request.input('accountNum', sql.VarChar(20), accountNum);
      conditions.push('AccountNum = @accountNum');
    }
    if (dateRange.startDate) {
      request.input('startDate', sql.DateTime2, dateRange.startDate);
      conditions.push('Timestamp >= @startDate');
    }
    if (dateRange.endDate) {
      request.input('endDate', sql.DateTime2, dateRange.endDate);
      conditions.push('Timestamp <= @endDate');
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await request.query(
      `SELECT TOP (${parseInt(limit, 10) || 100}) *
       FROM frs.AuditLog
       ${where}
       ORDER BY Timestamp DESC`
    );
    return result.recordset;
  }
}

module.exports = new AuditService();
