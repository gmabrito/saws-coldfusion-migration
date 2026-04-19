const { getDb, sql } = require('../config/database');

class EventRepository {
  /**
   * Write an event to the records.event_log table.
   */
  async logEvent(event) {
    const pool = await getDb();
    await pool
      .request()
      .input('eventId', sql.NVarChar(50), event.id)
      .input('eventType', sql.NVarChar(100), event.type)
      .input('payload', sql.NVarChar(sql.MAX), JSON.stringify(event.data))
      .input('userId', sql.NVarChar(200), event.userId)
      .input('createdAt', sql.DateTime2, new Date(event.timestamp))
      .query(
        `INSERT INTO records.event_log (event_id, event_type, payload, user_id, created_at)
         VALUES (@eventId, @eventType, @payload, @userId, @createdAt)`
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
      request.input('eventType', sql.NVarChar(100), filters.type);
      conditions.push('event_type = @eventType');
    }
    if (filters.userId) {
      request.input('userId', sql.NVarChar(200), filters.userId);
      conditions.push('user_id = @userId');
    }
    if (filters.startDate) {
      request.input('startDate', sql.DateTime2, filters.startDate);
      conditions.push('created_at >= @startDate');
    }
    if (filters.endDate) {
      request.input('endDate', sql.DateTime2, filters.endDate);
      conditions.push('created_at <= @endDate');
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const limit = parseInt(filters.limit, 10) || 100;

    const result = await request.query(
      `SELECT TOP (${limit}) event_id, event_type, payload, user_id, created_at
       FROM records.event_log
       ${where}
       ORDER BY created_at DESC`
    );
    return result.recordset;
  }
}

module.exports = EventRepository;
