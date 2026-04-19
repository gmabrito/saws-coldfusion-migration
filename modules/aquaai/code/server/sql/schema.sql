-- ============================================================================
-- AquaAI Module SQL Schema
-- Database: SAWSMigration
-- Schema: aquaai
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'aquaai')
  EXEC('CREATE SCHEMA aquaai');
GO

-- ============================================================================
-- TABLE: aquaai.event_log
-- Event log for all AquaAI platform events
-- ============================================================================
IF OBJECT_ID('aquaai.event_log', 'U') IS NULL
BEGIN
  CREATE TABLE aquaai.event_log (
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
-- TABLE: aquaai.usage_log
-- Tracks every Azure OpenAI API call: tokens, latency, calling module
-- ============================================================================
IF OBJECT_ID('aquaai.usage_log', 'U') IS NULL
BEGIN
  CREATE TABLE aquaai.usage_log (
    id                 INT IDENTITY(1,1) PRIMARY KEY,
    model_name         NVARCHAR(100)  NOT NULL,
    calling_module     NVARCHAR(50)   NOT NULL DEFAULT 'unknown',
    prompt_tokens      INT            NOT NULL DEFAULT 0,
    completion_tokens  INT            NOT NULL DEFAULT 0,
    duration_ms        INT            NULL,
    created_at         DATETIME2      NOT NULL DEFAULT GETDATE()
  );
END
GO

-- Index for usage queries
IF NOT EXISTS (
  SELECT * FROM sys.indexes
  WHERE object_id = OBJECT_ID('aquaai.usage_log')
    AND name = 'IX_aquaai_usage_log_created_at'
)
BEGIN
  CREATE INDEX IX_aquaai_usage_log_created_at
    ON aquaai.usage_log (created_at DESC);
END
GO

IF NOT EXISTS (
  SELECT * FROM sys.indexes
  WHERE object_id = OBJECT_ID('aquaai.usage_log')
    AND name = 'IX_aquaai_usage_log_module'
)
BEGIN
  CREATE INDEX IX_aquaai_usage_log_module
    ON aquaai.usage_log (calling_module, created_at DESC);
END
GO

IF NOT EXISTS (
  SELECT * FROM sys.indexes
  WHERE object_id = OBJECT_ID('aquaai.event_log')
    AND name = 'IX_aquaai_event_log_created_at'
)
BEGIN
  CREATE INDEX IX_aquaai_event_log_created_at
    ON aquaai.event_log (created_at DESC);
END
GO
