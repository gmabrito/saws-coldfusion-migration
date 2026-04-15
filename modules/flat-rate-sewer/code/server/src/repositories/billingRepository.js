const { getDb, sql } = require('../config/database');

class BillingRepository {
  /**
   * Get assessments for an account with optional filters.
   * CF origin: getFRSassessments
   */
  async getAssessments(filters = {}) {
    const pool = await getDb();
    const request = pool.request();
    const conditions = [];

    if (filters.accountNum) {
      request.input('accountNum', sql.VarChar(20), filters.accountNum);
      conditions.push('AccountNum = @accountNum');
    }
    if (filters.isAssessed !== undefined) {
      request.input('isAssessed', sql.Bit, filters.isAssessed ? 1 : 0);
      conditions.push('IsAssessed = @isAssessed');
    }
    if (filters.type) {
      request.input('type', sql.VarChar(20), filters.type);
      conditions.push('Type = @type');
    }
    if (filters.startDate) {
      request.input('startDate', sql.Date, filters.startDate);
      conditions.push('BillingDate >= @startDate');
    }
    if (filters.endDate) {
      request.input('endDate', sql.Date, filters.endDate);
      conditions.push('BillingDate <= @endDate');
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await request.query(
      `SELECT * FROM frs.BillingAssessments ${where} ORDER BY BillingDate DESC`
    );
    return result.recordset;
  }

  /**
   * Get a single assessment by ID.
   */
  async getAssessmentById(assessmentId) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('assessmentId', sql.Int, assessmentId)
      .query('SELECT * FROM frs.BillingAssessments WHERE AssessmentID = @assessmentId');
    return result.recordset[0] || null;
  }

  /**
   * Create a billing assessment.
   * CF origin: putBilling
   */
  async createAssessment(data) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('billingRecId', sql.VarChar(50), data.billingRecId || null)
      .input('accountNum', sql.VarChar(20), data.accountNum)
      .input('type', sql.VarChar(20), data.type || 'MONTHLY')
      .input('incomingCCFOverride', sql.Decimal(18, 4), data.incomingCCFOverride || null)
      .input('sewerChargeOverride', sql.Decimal(18, 2), data.sewerChargeOverride || null)
      .input('readingDate', sql.Date, data.readingDate)
      .input('billingDate', sql.Date, data.billingDate)
      .input('actualLoss', sql.Decimal(18, 4), data.actualLoss || 0)
      .input('actualBasis', sql.Decimal(18, 4), data.actualBasis || 0)
      .input('actualSewer', sql.Decimal(18, 4), data.actualSewer || 0)
      .input('actualCharge', sql.Decimal(18, 2), data.actualCharge || 0)
      .input('difference', sql.Decimal(18, 2), data.difference || 0)
      .input('useMoney', sql.Decimal(18, 2), data.useMoney || 0)
      .input('useBasis', sql.Decimal(18, 4), data.useBasis || 0)
      .query(
        `INSERT INTO frs.BillingAssessments
           (BillingRecID, AccountNum, Type, IncomingCCFOverride, SewerChargeOverride,
            ReadingDate, BillingDate, ActualLoss, ActualBasis, ActualSewer, ActualCharge,
            Difference, UseMoney, UseBasis, EntryDate, IsAssessed)
         VALUES
           (@billingRecId, @accountNum, @type, @incomingCCFOverride, @sewerChargeOverride,
            @readingDate, @billingDate, @actualLoss, @actualBasis, @actualSewer, @actualCharge,
            @difference, @useMoney, @useBasis, GETDATE(), 0);
         SELECT SCOPE_IDENTITY() AS AssessmentID;`
      );
    return result.recordset[0];
  }

  /**
   * Refresh / recalculate billing for an account.
   * CF origin: RefreshAccountBilling
   */
  async refreshAccountBilling(accountNum) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('accountNum', sql.VarChar(20), accountNum)
      .query(
        `SELECT * FROM frs.BillingAssessments
         WHERE AccountNum = @accountNum AND IsAssessed = 0
         ORDER BY BillingDate`
      );
    return result.recordset;
  }

  /**
   * Get FRS billing records.
   * CF origin: getFRSbilling
   */
  async getFRSBilling(accountNum) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('accountNum', sql.VarChar(20), accountNum)
      .query(
        `SELECT * FROM frs.BillingAssessments WHERE AccountNum = @accountNum ORDER BY BillingDate DESC`
      );
    return result.recordset;
  }

  /**
   * Get prior assessments for comparison.
   * CF origin: getPriorAssessments
   */
  async getPriorAssessments(accountNum, beforeDate) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('accountNum', sql.VarChar(20), accountNum)
      .input('beforeDate', sql.Date, beforeDate)
      .query(
        `SELECT TOP 12 * FROM frs.BillingAssessments
         WHERE AccountNum = @accountNum AND BillingDate < @beforeDate AND IsAssessed = 1
         ORDER BY BillingDate DESC`
      );
    return result.recordset;
  }

  /**
   * Rollback prior assessments (mark as unassessed).
   * CF origin: rollbackPriorAssessments
   */
  async rollbackPriorAssessments(accountNum, afterDate) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('accountNum', sql.VarChar(20), accountNum)
      .input('afterDate', sql.Date, afterDate)
      .query(
        `UPDATE frs.BillingAssessments
         SET IsAssessed = 0, AssessmentDate = NULL
         WHERE AccountNum = @accountNum AND BillingDate >= @afterDate;
         SELECT @@ROWCOUNT AS affected;`
      );
    return result.recordset[0];
  }

  /**
   * Mark assessment as reviewed/progressed.
   * CF origin: progressAssessment
   */
  async progressAssessment(assessmentId, data = {}) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('assessmentId', sql.Int, assessmentId)
      .input('isAssessed', sql.Bit, 1)
      .input('assessmentDate', sql.DateTime2, new Date())
      .input('incomingCCFOverride', sql.Decimal(18, 4), data.incomingCCFOverride || null)
      .input('sewerChargeOverride', sql.Decimal(18, 2), data.sewerChargeOverride || null)
      .query(
        `UPDATE frs.BillingAssessments SET
           IsAssessed = @isAssessed,
           AssessmentDate = @assessmentDate,
           IncomingCCFOverride = ISNULL(@incomingCCFOverride, IncomingCCFOverride),
           SewerChargeOverride = ISNULL(@sewerChargeOverride, SewerChargeOverride)
         WHERE AssessmentID = @assessmentId;
         SELECT @@ROWCOUNT AS affected;`
      );
    return result.recordset[0];
  }
}

module.exports = BillingRepository;
