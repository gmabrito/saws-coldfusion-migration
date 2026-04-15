const { getDb, sql } = require('../config/database');

class AccountRepository {
  /**
   * Get a single FRS account by AccountNum.
   * CF origin: getFRSAccount
   */
  async getAccount(accountNum) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('accountNum', sql.VarChar(20), accountNum)
      .query(
        `SELECT a.*, c.BusinessName, c.ContactName, c.Address, c.City, c.State, c.Zip, c.Phone, c.Email
         FROM frs.Accounts a
         LEFT JOIN frs.Contacts c ON a.AccountNum = c.AccountNum AND c.IsActive = 1
         WHERE a.AccountNum = @accountNum`
      );
    return result.recordset[0] || null;
  }

  /**
   * Create a new FRS account.
   * CF origin: putFRSAccount
   */
  async createAccount(data) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('accountNum', sql.VarChar(20), data.accountNum)
      .input('contactId', sql.Int, data.contactId || null)
      .input('facilityDesc', sql.VarChar(200), data.facilityDesc || null)
      .input('meterSize', sql.VarChar(10), data.meterSize || null)
      .input('method', sql.VarChar(20), data.method || null)
      .input('basis', sql.VarChar(20), data.basis || null)
      .input('bodPct', sql.Decimal(5, 2), data.bodPct || 0)
      .input('tddPct', sql.Decimal(5, 2), data.tddPct || 0)
      .input('startDate', sql.Date, data.startDate || new Date())
      .input('endDate', sql.Date, data.endDate || null)
      .input('assessmentFreq', sql.Int, data.assessmentFreq || 12)
      .input('inspectionFreq', sql.Int, data.inspectionFreq || 12)
      .input('billingMethodType', sql.VarChar(20), data.billingMethodType || 'STANDARD')
      .input('createdBy', sql.VarChar(50), data.createdBy || null)
      .input('status', sql.VarChar(20), data.status || 'Active')
      .query(
        `INSERT INTO frs.Accounts
           (AccountNum, ContactID, FacilityDesc, MeterSize, Method, Basis,
            BOD_PCT, TDD_PCT, StartDate, EndDate, AssessmentFreq, InspectionFreq,
            BillingMethodType, CreatedBy, Status, CreatedDate, ModifiedDate)
         VALUES
           (@accountNum, @contactId, @facilityDesc, @meterSize, @method, @basis,
            @bodPct, @tddPct, @startDate, @endDate, @assessmentFreq, @inspectionFreq,
            @billingMethodType, @createdBy, @status, GETDATE(), GETDATE());
         SELECT @accountNum AS AccountNum;`
      );
    return result.recordset[0];
  }

  /**
   * Update an existing FRS account.
   * CF origin: putFRSAccount (update path)
   */
  async updateAccount(accountNum, data) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('accountNum', sql.VarChar(20), accountNum)
      .input('facilityDesc', sql.VarChar(200), data.facilityDesc)
      .input('meterSize', sql.VarChar(10), data.meterSize)
      .input('method', sql.VarChar(20), data.method)
      .input('basis', sql.VarChar(20), data.basis)
      .input('bodPct', sql.Decimal(5, 2), data.bodPct)
      .input('tddPct', sql.Decimal(5, 2), data.tddPct)
      .input('startDate', sql.Date, data.startDate)
      .input('endDate', sql.Date, data.endDate || null)
      .input('assessmentFreq', sql.Int, data.assessmentFreq)
      .input('inspectionFreq', sql.Int, data.inspectionFreq)
      .input('billingMethodType', sql.VarChar(20), data.billingMethodType)
      .input('status', sql.VarChar(20), data.status)
      .input('nextAssessmentDate', sql.Date, data.nextAssessmentDate || null)
      .input('nextInspectionDate', sql.Date, data.nextInspectionDate || null)
      .query(
        `UPDATE frs.Accounts SET
           FacilityDesc = ISNULL(@facilityDesc, FacilityDesc),
           MeterSize = ISNULL(@meterSize, MeterSize),
           Method = ISNULL(@method, Method),
           Basis = ISNULL(@basis, Basis),
           BOD_PCT = ISNULL(@bodPct, BOD_PCT),
           TDD_PCT = ISNULL(@tddPct, TDD_PCT),
           StartDate = ISNULL(@startDate, StartDate),
           EndDate = @endDate,
           AssessmentFreq = ISNULL(@assessmentFreq, AssessmentFreq),
           InspectionFreq = ISNULL(@inspectionFreq, InspectionFreq),
           BillingMethodType = ISNULL(@billingMethodType, BillingMethodType),
           Status = ISNULL(@status, Status),
           NextAssessmentDate = ISNULL(@nextAssessmentDate, NextAssessmentDate),
           NextInspectionDate = ISNULL(@nextInspectionDate, NextInspectionDate),
           ModifiedDate = GETDATE()
         WHERE AccountNum = @accountNum;
         SELECT @@ROWCOUNT AS affected;`
      );
    return result.recordset[0];
  }

  /**
   * Get contact for an account.
   * CF origin: getFRScontact
   */
  async getContact(accountNum) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('accountNum', sql.VarChar(20), accountNum)
      .query(
        `SELECT * FROM frs.Contacts WHERE AccountNum = @accountNum AND IsActive = 1`
      );
    return result.recordset[0] || null;
  }

  /**
   * Create or update contact.
   * CF origin: updateFRSContact
   */
  async upsertContact(data) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('accountNum', sql.VarChar(20), data.accountNum)
      .input('businessName', sql.VarChar(200), data.businessName)
      .input('contactName', sql.VarChar(100), data.contactName)
      .input('address', sql.VarChar(200), data.address)
      .input('city', sql.VarChar(50), data.city)
      .input('state', sql.VarChar(2), data.state || 'TX')
      .input('zip', sql.VarChar(10), data.zip)
      .input('phone', sql.VarChar(20), data.phone)
      .input('email', sql.VarChar(100), data.email)
      .query(
        `MERGE frs.Contacts AS target
         USING (SELECT @accountNum AS AccountNum) AS source
         ON target.AccountNum = source.AccountNum AND target.IsActive = 1
         WHEN MATCHED THEN
           UPDATE SET BusinessName = @businessName, ContactName = @contactName,
             Address = @address, City = @city, State = @state, Zip = @zip,
             Phone = @phone, Email = @email
         WHEN NOT MATCHED THEN
           INSERT (AccountNum, BusinessName, ContactName, Address, City, State, Zip, Phone, Email, IsActive)
           VALUES (@accountNum, @businessName, @contactName, @address, @city, @state, @zip, @phone, @email, 1)
         OUTPUT inserted.ContactID;`
      );
    return result.recordset[0];
  }

  /**
   * Get all sites.
   * CF origin: getAllSites
   */
  async getAllSites() {
    const pool = await getDb();
    const result = await pool.request().query('SELECT * FROM frs.Sites ORDER BY AccountNum');
    return result.recordset;
  }

  /**
   * Get sites for an account.
   * CF origin: getSites
   */
  async getSites(accountNum) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('accountNum', sql.VarChar(20), accountNum)
      .query('SELECT * FROM frs.Sites WHERE AccountNum = @accountNum ORDER BY SiteID');
    return result.recordset;
  }

  /**
   * Search accounts by name (autocomplete).
   * CF origin: lookupFRSName
   */
  async lookupByName(searchTerm) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('searchTerm', sql.VarChar(100), `%${searchTerm}%`)
      .query(
        `SELECT TOP 20 a.AccountNum, c.BusinessName, c.ContactName, a.Status
         FROM frs.Accounts a
         LEFT JOIN frs.Contacts c ON a.AccountNum = c.AccountNum AND c.IsActive = 1
         WHERE c.BusinessName LIKE @searchTerm OR c.ContactName LIKE @searchTerm OR a.AccountNum LIKE @searchTerm
         ORDER BY c.BusinessName`
      );
    return result.recordset;
  }

  /**
   * List accounts with pagination and filtering.
   */
  async listAccounts(filters = {}, page = 1, pageSize = 25) {
    const pool = await getDb();
    const request = pool.request();
    const conditions = [];
    const offset = (page - 1) * pageSize;

    if (filters.status) {
      request.input('status', sql.VarChar(20), filters.status);
      conditions.push('a.Status = @status');
    }
    if (filters.method) {
      request.input('method', sql.VarChar(20), filters.method);
      conditions.push('a.Method = @method');
    }
    if (filters.search) {
      request.input('search', sql.VarChar(100), `%${filters.search}%`);
      conditions.push('(c.BusinessName LIKE @search OR a.AccountNum LIKE @search)');
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    request.input('offset', sql.Int, offset);
    request.input('pageSize', sql.Int, pageSize);

    const result = await request.query(
      `SELECT a.*, c.BusinessName, c.ContactName,
              COUNT(*) OVER() AS TotalCount
       FROM frs.Accounts a
       LEFT JOIN frs.Contacts c ON a.AccountNum = c.AccountNum AND c.IsActive = 1
       ${where}
       ORDER BY a.AccountNum
       OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`
    );

    const totalCount = result.recordset.length > 0 ? result.recordset[0].TotalCount : 0;
    return {
      data: result.recordset,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }
}

module.exports = AccountRepository;
