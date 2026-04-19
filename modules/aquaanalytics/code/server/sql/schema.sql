-- ============================================================================
-- AquaAnalytics Module SQL Schema
-- Database: SAWSMigration
-- Schema: aquaanalytics
-- Cross-schema reads: aquadocs.event_log, aquarecords.event_log (same DB)
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'aquaanalytics')
  EXEC('CREATE SCHEMA aquaanalytics');
GO

-- ============================================================================
-- TABLE: aquaanalytics.event_log
-- AquaAnalytics own event log (for analytics module's own activity)
-- ============================================================================
IF OBJECT_ID('aquaanalytics.event_log', 'U') IS NULL
BEGIN
  CREATE TABLE aquaanalytics.event_log (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    event_id    NVARCHAR(50)    NOT NULL,
    event_type  NVARCHAR(100)   NOT NULL,
    payload     NVARCHAR(MAX)   NULL,
    user_id     NVARCHAR(200)   NULL,
    created_at  DATETIME2       NOT NULL DEFAULT GETDATE()
  );
END
GO

-- ============================================================================
-- TABLE: aquaanalytics.report_run_log
-- Tracks report generation requests and results
-- ============================================================================
IF OBJECT_ID('aquaanalytics.report_run_log', 'U') IS NULL
BEGIN
  CREATE TABLE aquaanalytics.report_run_log (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    report_id    NVARCHAR(100)  NOT NULL,
    requested_by NVARCHAR(200)  NULL,
    start_date   DATE           NULL,
    end_date     DATE           NULL,
    row_count    INT            NULL,
    duration_ms  INT            NULL,
    status       NVARCHAR(20)   NOT NULL DEFAULT 'success'
                   CHECK (status IN ('success', 'failed', 'partial')),
    created_at   DATETIME2      NOT NULL DEFAULT GETDATE()
  );
END
GO

-- Index for fast event queries
IF NOT EXISTS (
  SELECT * FROM sys.indexes
  WHERE object_id = OBJECT_ID('aquaanalytics.event_log')
    AND name = 'IX_aquaanalytics_event_log_created_at'
)
BEGIN
  CREATE INDEX IX_aquaanalytics_event_log_created_at
    ON aquaanalytics.event_log (created_at DESC);
END
GO

-- ============================================================================
-- NOTE: Cross-schema queries used by AquaAnalytics:
--
-- SELECT * FROM aquadocs.event_log    -- AquaDocs events
-- SELECT * FROM aquarecords.event_log -- AquaRecords events
-- SELECT * FROM aquaai.event_log      -- AquaAI events (when provisioned)
-- SELECT * FROM aquahawk.event_log    -- AquaHawk events (when provisioned)
--
-- All schemas are in the same SAWSMigration database.
-- No linked server or cross-DB join required.
-- ============================================================================
