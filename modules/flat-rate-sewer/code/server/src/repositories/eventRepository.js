const { getDb, sql } = require('../config/database');

class EventRepository {
  /**
   * Write an event to the SQL event log.
   */
  async logEvent(event) {
    const pool = await getDb();
    await pool
      .request()
      .input('eventId', sql.UniqueIdentifier, event.id)
      .input('eventType', sql.VarChar(100), event.type)
      .input('eventData', sql.NVarChar(sql.MAX), JSON.stringify(event.data))
      .input('userId', sql.VarChar(50), event.userId)
      .input('timestamp', sql.DateTime2, event.timestamp)
      .query(
        `INSERT INTO frs.EventLog (EventID, EventType, EventData, UserID, EventTimestamp)
         VALUES (@eventId, @eventType, @eventData, @userId, @timestamp)`
      );
  }

  /**
   * Query events with optional filters.
   * @param {Object} filters - { type, userId, startDate, endDate, limit }
   */
  async getEvents(filters = {}) {
    const pool = await getDb();
    const request = pool.request();
    const conditions = [];

    if (filters.type) {
      request.input('eventType', sql.VarChar(100), filters.type);
      conditions.push('EventType = @eventType');
    }
    if (filters.userId) {
      request.input('userId', sql.VarChar(50), filters.userId);
      conditions.push('UserID = @userId');
    }
    if (filters.startDate) {
      request.input('startDate', sql.DateTime2, filters.startDate);
      conditions.push('EventTimestamp >= @startDate');
    }
    if (filters.endDate) {
      request.input('endDate', sql.DateTime2, filters.endDate);
      conditions.push('EventTimestamp <= @endDate');
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const limit = parseInt(filters.limit, 10) || 100;

    const result = await request.query(
      `SELECT TOP (${limit}) EventID, EventType, EventData, UserID, EventTimestamp
       FROM frs.EventLog
       ${where}
       ORDER BY EventTimestamp DESC`
    );
    return result.recordset;
  }
}

module.exports = EventRepository;
