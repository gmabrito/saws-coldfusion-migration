-- ============================================================================
-- AquaRecords Module — SQL Schema
-- Database: SAWSMigration
-- Schema: records
-- Texas Public Information Act (TPIA) request management
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'records')
  EXEC('CREATE SCHEMA records');
GO

-- ============================================================================
-- TABLE: records.requests
-- TPIA requests from citizens and internal users
-- ============================================================================
IF OBJECT_ID('records.requests', 'U') IS NULL
BEGIN
  CREATE TABLE records.requests (
    id                    INT IDENTITY(1,1) PRIMARY KEY,
    confirmation_no       VARCHAR(20)       NOT NULL UNIQUE,  -- TPIA-YYYY-NNNNNN
    requester_name        NVARCHAR(200)     NOT NULL,
    requester_email       NVARCHAR(200)     NOT NULL,
    requester_phone       NVARCHAR(30)      NULL,
    description           NVARCHAR(MAX)     NOT NULL,
    date_range_from       DATE              NULL,
    date_range_to         DATE              NULL,
    departments           NVARCHAR(500)     NULL,
    preferred_format      VARCHAR(20)       NOT NULL DEFAULT 'electronic',
    status                VARCHAR(30)       NOT NULL DEFAULT 'submitted'
      CHECK (status IN ('submitted','acknowledged','in_review','pending_response','completed','denied','partial')),
    assigned_to           NVARCHAR(200)     NULL,
    submitted_at          DATETIME2         NOT NULL DEFAULT GETDATE(),
    acknowledged_at       DATETIME2         NULL,
    due_date              DATETIME2         NOT NULL,  -- 10 business days to respond
    response_date         DATETIME2         NULL,
    exemptions_applied    NVARCHAR(500)     NULL,
    internal_notes_count  INT               NOT NULL DEFAULT 0
  );
END
GO

CREATE INDEX IF NOT EXISTS IX_records_requests_status ON records.requests(status);
CREATE INDEX IF NOT EXISTS IX_records_requests_due_date ON records.requests(due_date);
CREATE INDEX IF NOT EXISTS IX_records_requests_assigned_to ON records.requests(assigned_to);
GO

-- ============================================================================
-- TABLE: records.request_notes
-- Internal notes — not visible to the public requester
-- ============================================================================
IF OBJECT_ID('records.request_notes', 'U') IS NULL
BEGIN
  CREATE TABLE records.request_notes (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    request_id  INT               NOT NULL REFERENCES records.requests(id),
    note_text   NVARCHAR(MAX)     NOT NULL,
    author      NVARCHAR(200)     NOT NULL,
    created_at  DATETIME2         NOT NULL DEFAULT GETDATE()
  );
END
GO

-- ============================================================================
-- TABLE: records.request_timeline
-- Status change audit trail — every status transition recorded
-- ============================================================================
IF OBJECT_ID('records.request_timeline', 'U') IS NULL
BEGIN
  CREATE TABLE records.request_timeline (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    request_id  INT               NOT NULL REFERENCES records.requests(id),
    from_status VARCHAR(30)       NULL,
    to_status   VARCHAR(30)       NOT NULL,
    changed_by  NVARCHAR(200)     NOT NULL,
    note        NVARCHAR(1000)    NULL,
    created_at  DATETIME2         NOT NULL DEFAULT GETDATE()
  );
END
GO

-- ============================================================================
-- TABLE: records.exemptions
-- Texas PIA exemption categories used to justify withholding information
-- ============================================================================
IF OBJECT_ID('records.exemptions', 'U') IS NULL
BEGIN
  CREATE TABLE records.exemptions (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    code            VARCHAR(20)       NOT NULL UNIQUE,
    statutory_basis NVARCHAR(200)     NOT NULL,
    description     NVARCHAR(1000)    NOT NULL,
    is_active       BIT               NOT NULL DEFAULT 1,
    created_at      DATETIME2         NOT NULL DEFAULT GETDATE()
  );
END
GO

-- ============================================================================
-- TABLE: records.event_log
-- Event log for AquaLake CDC ingestion
-- ============================================================================
IF OBJECT_ID('records.event_log', 'U') IS NULL
BEGIN
  CREATE TABLE records.event_log (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    event_id    NVARCHAR(50)      NOT NULL,
    event_type  NVARCHAR(100)     NOT NULL,
    payload     NVARCHAR(MAX)     NULL,
    user_id     NVARCHAR(200)     NULL,
    created_at  DATETIME2         NOT NULL DEFAULT GETDATE()
  );
END
GO

-- ============================================================================
-- SEED: Common Texas PIA exemptions
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM records.exemptions WHERE code = '552.101')
BEGIN
  INSERT INTO records.exemptions (code, statutory_basis, description) VALUES
    ('552.101', 'Tex. Gov''t Code §552.101', 'Exception for information made confidential by law'),
    ('552.102', 'Tex. Gov''t Code §552.102', 'Employees'' personal information (home address, etc.)'),
    ('552.103', 'Tex. Gov''t Code §552.103', 'Litigation exception'),
    ('552.107', 'Tex. Gov''t Code §552.107', 'Attorney-client privilege'),
    ('552.108', 'Tex. Gov''t Code §552.108', 'Law enforcement exception'),
    ('552.110', 'Tex. Gov''t Code §552.110', 'Trade secrets and confidential commercial information'),
    ('552.114', 'Tex. Gov''t Code §552.114', 'Personnel files of current/former officers and employees');
END
GO
