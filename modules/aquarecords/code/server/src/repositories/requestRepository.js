const { getDb, sql } = require('../config/database');

class RequestRepository {
  /**
   * Create a new TPIA request.
   * Returns { id, confirmation_no }.
   */
  async create(data) {
    const pool = await getDb();

    // Generate confirmation number: TPIA-YYYY-NNNNNN
    const year = new Date().getFullYear();
    const countResult = await pool.request().query(
      `SELECT COUNT(*) AS cnt FROM records.requests WHERE YEAR(submitted_at) = ${year}`
    );
    const seq = String(countResult.recordset[0].cnt + 1).padStart(6, '0');
    const confirmationNo = `TPIA-${year}-${seq}`;

    // Due date: 10 business days from submission (simplified: 14 calendar days)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const result = await pool
      .request()
      .input('confirmationNo', sql.VarChar(20), confirmationNo)
      .input('requesterName', sql.NVarChar(200), data.requester_name)
      .input('requesterEmail', sql.NVarChar(200), data.requester_email)
      .input('requesterPhone', sql.NVarChar(30), data.requester_phone || null)
      .input('description', sql.NVarChar(sql.MAX), data.description)
      .input('dateRangeFrom', sql.Date, data.date_range_from ? new Date(data.date_range_from) : null)
      .input('dateRangeTo', sql.Date, data.date_range_to ? new Date(data.date_range_to) : null)
      .input('departments', sql.NVarChar(500), data.departments || null)
      .input('preferredFormat', sql.VarChar(20), data.preferred_format || 'electronic')
      .input('dueDate', sql.DateTime2, dueDate)
      .query(
        `INSERT INTO records.requests
           (confirmation_no, requester_name, requester_email, requester_phone,
            description, date_range_from, date_range_to, departments,
            preferred_format, due_date)
         OUTPUT INSERTED.id, INSERTED.confirmation_no, INSERTED.due_date
         VALUES
           (@confirmationNo, @requesterName, @requesterEmail, @requesterPhone,
            @description, @dateRangeFrom, @dateRangeTo, @departments,
            @preferredFormat, @dueDate)`
      );

    const row = result.recordset[0];
    return { id: row.id, confirmation_no: row.confirmation_no, due_date: row.due_date };
  }

  /**
   * Find by confirmation number — public-safe fields only.
   */
  async findByConfirmationNo(confirmationNo) {
    const pool = await getDb();
    const result = await pool
      .request()
      .input('confirmationNo', sql.VarChar(20), confirmationNo)
      .query(
        `SELECT id, confirmation_no, status, submitted_at, acknowledged_at,
                due_date, departments AS assigned_department
         FROM records.requests
         WHERE confirmation_no = @confirmationNo`
      );
    return result.recordset[0] || null;
  }

  /**
   * Paginated list with optional filters.
   */
  async findAll(filters = {}) {
    const pool = await getDb();
    const request = pool.request();
    const conditions = [];

    if (filters.status) {
      request.input('status', sql.VarChar(30), filters.status);
      conditions.push('status = @status');
    }
    if (filters.assignedTo) {
      request.input('assignedTo', sql.NVarChar(200), filters.assignedTo);
      conditions.push('assigned_to = @assignedTo');
    }
    if (filters.overdue === true || filters.overdue === 'true') {
      conditions.push(`due_date < GETDATE() AND status NOT IN ('completed','denied','partial')`);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const page = parseInt(filters.page, 10) || 1;
    const limit = parseInt(filters.limit, 10) || 25;
    const offset = (page - 1) * limit;

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, limit);

    const countResult = await request.query(
      `SELECT COUNT(*) AS total FROM records.requests ${where}`
    );
    const total = countResult.recordset[0].total;

    const dataResult = await request.query(
      `SELECT id, confirmation_no, requester_name, submitted_at, status,
              assigned_to, due_date
       FROM records.requests
       ${where}
       ORDER BY submitted_at DESC
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`
    );

    return { requests: dataResult.recordset, total, page, limit };
  }

  /**
   * Full request detail with notes and timeline.
   */
  async findById(id) {
    const pool = await getDb();
    const request = pool.request().input('id', sql.Int, id);

    const reqResult = await request.query(
      `SELECT * FROM records.requests WHERE id = @id`
    );
    if (!reqResult.recordset[0]) return null;
    const row = reqResult.recordset[0];

    const notesResult = await pool
      .request()
      .input('id2', sql.Int, id)
      .query(
        `SELECT id, note_text, author, created_at
         FROM records.request_notes
         WHERE request_id = @id2
         ORDER BY created_at DESC`
      );

    const timelineResult = await pool
      .request()
      .input('id3', sql.Int, id)
      .query(
        `SELECT id, from_status, to_status, changed_by, note, created_at
         FROM records.request_timeline
         WHERE request_id = @id3
         ORDER BY created_at ASC`
      );

    return {
      ...row,
      notes: notesResult.recordset,
      timeline: timelineResult.recordset,
    };
  }

  /**
   * Update request status and insert a timeline entry.
   */
  async updateStatus(id, newStatus, changedBy, note = null) {
    const pool = await getDb();

    // Get current status for timeline
    const current = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT status FROM records.requests WHERE id = @id');

    const fromStatus = current.recordset[0]?.status || null;

    await pool
      .request()
      .input('status', sql.VarChar(30), newStatus)
      .input('id', sql.Int, id)
      .query('UPDATE records.requests SET status = @status WHERE id = @id');

    // Insert timeline entry
    await pool
      .request()
      .input('requestId', sql.Int, id)
      .input('fromStatus', sql.VarChar(30), fromStatus)
      .input('toStatus', sql.VarChar(30), newStatus)
      .input('changedBy', sql.NVarChar(200), changedBy)
      .input('note', sql.NVarChar(1000), note || null)
      .query(
        `INSERT INTO records.request_timeline (request_id, from_status, to_status, changed_by, note)
         VALUES (@requestId, @fromStatus, @toStatus, @changedBy, @note)`
      );
  }

  /**
   * Add an internal note (not visible to public).
   */
  async addNote(id, noteText, authorEmail) {
    const pool = await getDb();
    await pool
      .request()
      .input('requestId', sql.Int, id)
      .input('noteText', sql.NVarChar(sql.MAX), noteText)
      .input('author', sql.NVarChar(200), authorEmail)
      .query(
        `INSERT INTO records.request_notes (request_id, note_text, author)
         VALUES (@requestId, @noteText, @author);
         UPDATE records.requests
           SET internal_notes_count = internal_notes_count + 1
         WHERE id = @requestId`
      );
  }

  /**
   * Assign request to a staff member.
   */
  async assign(id, staffEmail, assignedBy) {
    const pool = await getDb();
    await pool
      .request()
      .input('staffEmail', sql.NVarChar(200), staffEmail)
      .input('id', sql.Int, id)
      .query('UPDATE records.requests SET assigned_to = @staffEmail WHERE id = @id');
  }

  /**
   * Aggregate stats for the dashboard.
   */
  async getStats() {
    const pool = await getDb();
    const result = await pool.request().query(`
      SELECT
        SUM(CASE WHEN status NOT IN ('completed','denied','partial') THEN 1 ELSE 0 END) AS [open],
        SUM(CASE WHEN due_date < GETDATE() AND status NOT IN ('completed','denied','partial') THEN 1 ELSE 0 END) AS overdue,
        SUM(CASE WHEN due_date BETWEEN GETDATE() AND DATEADD(day, 7, GETDATE())
                   AND status NOT IN ('completed','denied','partial') THEN 1 ELSE 0 END) AS due_this_week,
        SUM(CASE WHEN status IN ('completed','denied','partial')
                   AND MONTH(response_date) = MONTH(GETDATE())
                   AND YEAR(response_date) = YEAR(GETDATE()) THEN 1 ELSE 0 END) AS completed_this_month
      FROM records.requests
    `);
    const stats = result.recordset[0];

    // Recent activity: last 10 updated requests
    const activityResult = await pool.request().query(`
      SELECT TOP 10 id, confirmation_no, requester_name, status, submitted_at
      FROM records.requests
      ORDER BY submitted_at DESC
    `);

    return { ...stats, recent_activity: activityResult.recordset };
  }
}

module.exports = RequestRepository;
