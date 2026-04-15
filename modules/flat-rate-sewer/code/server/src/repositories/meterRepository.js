const { getDb, sql } = require('../config/database');

class MeterRepository {
  /**
   * Get active meters for an account.
   * CF origin: getActiveMeters
   */
  async getActiveMeters(accountNum) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('accountNum', sql.VarChar(20), accountNum)
      .query(
        `SELECT * FROM frs.Meters
         WHERE AccountNum = @accountNum AND IsActive = 1
         ORDER BY Serial`
      );
    return result.recordset;
  }

  /**
   * Get all meters for an account (active and inactive).
   * CF origin: getMeters
   */
  async getMeters(accountNum) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('accountNum', sql.VarChar(20), accountNum)
      .query('SELECT * FROM frs.Meters WHERE AccountNum = @accountNum ORDER BY Serial');
    return result.recordset;
  }

  /**
   * Get a single meter by ID.
   */
  async getMeterById(meterId) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('meterId', sql.Int, meterId)
      .query('SELECT * FROM frs.Meters WHERE MeterID = @meterId');
    return result.recordset[0] || null;
  }

  /**
   * Add a new meter.
   * CF origin: PutMeter
   */
  async createMeter(data) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('accountNum', sql.VarChar(20), data.accountNum)
      .input('serial', sql.VarChar(30), data.serial)
      .input('meterSize', sql.VarChar(10), data.meterSize)
      .input('functionType', sql.VarChar(20), data.functionType)
      .input('uom', sql.VarChar(5), data.uom || 'GAL')
      .input('maxReading', sql.Decimal(18, 2), data.maxReading || 9999999)
      .query(
        `INSERT INTO frs.Meters (AccountNum, Serial, MeterSize, FunctionType, UOM, MaxReading, IsActive)
         VALUES (@accountNum, @serial, @meterSize, @functionType, @uom, @maxReading, 1);
         SELECT SCOPE_IDENTITY() AS MeterID;`
      );
    return result.recordset[0];
  }

  /**
   * Update meter details.
   * CF origin: editMeter
   */
  async updateMeter(meterId, data) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('meterId', sql.Int, meterId)
      .input('serial', sql.VarChar(30), data.serial)
      .input('meterSize', sql.VarChar(10), data.meterSize)
      .input('functionType', sql.VarChar(20), data.functionType)
      .input('uom', sql.VarChar(5), data.uom)
      .input('maxReading', sql.Decimal(18, 2), data.maxReading)
      .query(
        `UPDATE frs.Meters SET
           Serial = ISNULL(@serial, Serial),
           MeterSize = ISNULL(@meterSize, MeterSize),
           FunctionType = ISNULL(@functionType, FunctionType),
           UOM = ISNULL(@uom, UOM),
           MaxReading = ISNULL(@maxReading, MaxReading)
         WHERE MeterID = @meterId;
         SELECT @@ROWCOUNT AS affected;`
      );
    return result.recordset[0];
  }

  /**
   * Deactivate a meter.
   */
  async deactivateMeter(meterId) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('meterId', sql.Int, meterId)
      .query(
        `UPDATE frs.Meters SET IsActive = 0 WHERE MeterID = @meterId;
         SELECT @@ROWCOUNT AS affected;`
      );
    return result.recordset[0];
  }

  /**
   * Insert a meter reading.
   * CF origin: putMeterReadings
   */
  async insertReading(data) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('accountNum', sql.VarChar(20), data.accountNum)
      .input('serial', sql.VarChar(30), data.serial)
      .input('readingDate', sql.Date, data.readingDate)
      .input('readingValue', sql.Decimal(18, 2), data.readingValue)
      .input('consumption', sql.Decimal(18, 2), data.consumption)
      .input('makeupCCF', sql.Decimal(18, 4), data.makeupCCF || 0)
      .input('blowdownCCF', sql.Decimal(18, 4), data.blowdownCCF || 0)
      .input('lossCCF', sql.Decimal(18, 4), data.lossCCF || 0)
      .input('sewerCCF', sql.Decimal(18, 4), data.sewerCCF || 0)
      .input('incomingCCF', sql.Decimal(18, 4), data.incomingCCF || 0)
      .input('pctChange', sql.Decimal(8, 4), data.pctChange || 0)
      .query(
        `INSERT INTO frs.MeterReadings
           (AccountNum, Serial, ReadingDate, ReadingValue, Consumption,
            MakeupCCF, BlowdownCCF, LossCCF, SewerCCF, IncomingCCF, PctChange, EntryDate)
         VALUES
           (@accountNum, @serial, @readingDate, @readingValue, @consumption,
            @makeupCCF, @blowdownCCF, @lossCCF, @sewerCCF, @incomingCCF, @pctChange, GETDATE());
         SELECT SCOPE_IDENTITY() AS ReadingID;`
      );
    return result.recordset[0];
  }

  /**
   * Get meter readings with filters.
   * CF origin: getMeterReadings
   */
  async getReadings(filters = {}) {
    const pool = await getDb();
    const request = pool.request();
    const conditions = [];

    if (filters.accountNum) {
      request.input('accountNum', sql.VarChar(20), filters.accountNum);
      conditions.push('AccountNum = @accountNum');
    }
    if (filters.serial) {
      request.input('serial', sql.VarChar(30), filters.serial);
      conditions.push('Serial = @serial');
    }
    if (filters.startDate) {
      request.input('startDate', sql.Date, filters.startDate);
      conditions.push('ReadingDate >= @startDate');
    }
    if (filters.endDate) {
      request.input('endDate', sql.Date, filters.endDate);
      conditions.push('ReadingDate <= @endDate');
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await request.query(
      `SELECT * FROM frs.MeterReadings ${where} ORDER BY ReadingDate DESC, Serial`
    );
    return result.recordset;
  }

  /**
   * Get the last reading for a given meter.
   * CF origin: getLastMeterReadings
   */
  async getLastReading(accountNum, serial) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('accountNum', sql.VarChar(20), accountNum)
      .input('serial', sql.VarChar(30), serial)
      .query(
        `SELECT TOP 1 * FROM frs.MeterReadings
         WHERE AccountNum = @accountNum AND Serial = @serial
         ORDER BY ReadingDate DESC`
      );
    return result.recordset[0] || null;
  }

  /**
   * Delete readings for recalculation.
   * CF origin: recalcMeterReadings (deletes then re-inserts)
   */
  async deleteReadings(accountNum, serial) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('accountNum', sql.VarChar(20), accountNum)
      .input('serial', sql.VarChar(30), serial)
      .query(
        `DELETE FROM frs.MeterReadings WHERE AccountNum = @accountNum AND Serial = @serial;
         SELECT @@ROWCOUNT AS deleted;`
      );
    return result.recordset[0];
  }

  /**
   * Update an existing reading.
   */
  async updateReading(readingId, data) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('readingId', sql.Int, readingId)
      .input('readingValue', sql.Decimal(18, 2), data.readingValue)
      .input('consumption', sql.Decimal(18, 2), data.consumption)
      .input('makeupCCF', sql.Decimal(18, 4), data.makeupCCF)
      .input('blowdownCCF', sql.Decimal(18, 4), data.blowdownCCF)
      .input('lossCCF', sql.Decimal(18, 4), data.lossCCF)
      .input('sewerCCF', sql.Decimal(18, 4), data.sewerCCF)
      .input('incomingCCF', sql.Decimal(18, 4), data.incomingCCF)
      .input('pctChange', sql.Decimal(8, 4), data.pctChange)
      .query(
        `UPDATE frs.MeterReadings SET
           ReadingValue = ISNULL(@readingValue, ReadingValue),
           Consumption = ISNULL(@consumption, Consumption),
           MakeupCCF = ISNULL(@makeupCCF, MakeupCCF),
           BlowdownCCF = ISNULL(@blowdownCCF, BlowdownCCF),
           LossCCF = ISNULL(@lossCCF, LossCCF),
           SewerCCF = ISNULL(@sewerCCF, SewerCCF),
           IncomingCCF = ISNULL(@incomingCCF, IncomingCCF),
           PctChange = ISNULL(@pctChange, PctChange)
         WHERE ReadingID = @readingId;
         SELECT @@ROWCOUNT AS affected;`
      );
    return result.recordset[0];
  }
}

module.exports = MeterRepository;
