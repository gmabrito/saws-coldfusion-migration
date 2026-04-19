-- ============================================================================
-- AquaHawk Module SQL Schema
-- Database: SAWSMigration
-- Schema: aquahawk
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'aquahawk')
  EXEC('CREATE SCHEMA aquahawk');
GO

-- ============================================================================
-- TABLE: aquahawk.event_log
-- Event log for all AquaHawk platform events
-- ============================================================================
IF OBJECT_ID('aquahawk.event_log', 'U') IS NULL
BEGIN
  CREATE TABLE aquahawk.event_log (
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
-- TABLE: aquahawk.module_status_log
-- Tracks health check results for each module over time
-- ============================================================================
IF OBJECT_ID('aquahawk.module_status_log', 'U') IS NULL
BEGIN
  CREATE TABLE aquahawk.module_status_log (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    module_id    NVARCHAR(50)   NOT NULL,
    status       NVARCHAR(20)   NOT NULL,  -- ok, offline, error, degraded
    response_ms  INT            NULL,
    error_msg    NVARCHAR(500)  NULL,
    checked_at   DATETIME2      NOT NULL DEFAULT GETDATE()
  );
END
GO

-- Index for fast recent-events queries
IF NOT EXISTS (
  SELECT * FROM sys.indexes
  WHERE object_id = OBJECT_ID('aquahawk.event_log')
    AND name = 'IX_aquahawk_event_log_created_at'
)
BEGIN
  CREATE INDEX IX_aquahawk_event_log_created_at
    ON aquahawk.event_log (created_at DESC);
END
GO

IF NOT EXISTS (
  SELECT * FROM sys.indexes
  WHERE object_id = OBJECT_ID('aquahawk.event_log')
    AND name = 'IX_aquahawk_event_log_type'
)
BEGIN
  CREATE INDEX IX_aquahawk_event_log_type
    ON aquahawk.event_log (event_type, created_at DESC);
END
GO
