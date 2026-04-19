-- ============================================================================
-- AquaDocs Module — SQL Schema
-- Database: SAWSMigration
-- Schema: aquadocs
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'aquadocs')
  EXEC('CREATE SCHEMA aquadocs');
GO

-- ============================================================================
-- TABLE: aquadocs.query_log
-- Every search and chat interaction tracked for analytics and feedback
-- ============================================================================
IF OBJECT_ID('aquadocs.query_log', 'U') IS NULL
BEGIN
  CREATE TABLE aquadocs.query_log (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    query_text    NVARCHAR(2000)  NOT NULL,
    query_type    VARCHAR(20)     NOT NULL
                    CHECK (query_type IN ('public_search', 'internal_search', 'chat')),
    user_email    NVARCHAR(200)   NULL,
    result_count  INT             NULL,
    answer_text   NVARCHAR(MAX)   NULL,
    response_ms   INT             NULL,
    created_at    DATETIME2       NOT NULL DEFAULT GETDATE()
  );
END
GO

-- ============================================================================
-- TABLE: aquadocs.event_log
-- Event log for AquaLake CDC ingestion (all module events)
-- ============================================================================
IF OBJECT_ID('aquadocs.event_log', 'U') IS NULL
BEGIN
  CREATE TABLE aquadocs.event_log (
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
-- TABLE: aquadocs.pipeline_run_log
-- Audit trail for ingestion pipeline runs (mirrored from AquaCore pipeline)
-- ============================================================================
IF OBJECT_ID('aquadocs.pipeline_run_log', 'U') IS NULL
BEGIN
  CREATE TABLE aquadocs.pipeline_run_log (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    run_id        VARCHAR(30)     NOT NULL,  -- e.g. saws-2026-04-19
    status        VARCHAR(20)     NOT NULL DEFAULT 'running'
                    CHECK (status IN ('running', 'success', 'failed', 'partial')),
    docs_scanned  INT             NULL,
    docs_indexed  INT             NULL,
    embed_rows    INT             NULL,
    index_rows    INT             NULL,
    errors        INT             NOT NULL DEFAULT 0,
    started_at    DATETIME2       NOT NULL DEFAULT GETDATE(),
    completed_at  DATETIME2       NULL
  );
END
GO

-- ============================================================================
-- TABLE: aquadocs.documents
-- Document metadata + pipeline status tracking
-- Mirrors the AquaCore pipeline documents table for admin UI
-- ============================================================================
IF OBJECT_ID('aquadocs.documents', 'U') IS NULL
BEGIN
  CREATE TABLE aquadocs.documents (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    title             NVARCHAR(500)   NOT NULL,
    source_file       NVARCHAR(1000)  NOT NULL,
    blob_url          NVARCHAR(2000)  NULL,
    doc_type          VARCHAR(50)     NULL,
    department        VARCHAR(100)    NULL,
    content_hash      VARCHAR(64)     NULL,  -- SHA-256 for dedup
    embedding_status  VARCHAR(20)     NOT NULL DEFAULT 'pending'
                        CHECK (embedding_status IN (
                          'pending', 'extracted', 'chunked', 'embedded', 'indexed', 'error'
                        )),
    extraction_model  VARCHAR(50)     NULL,
    chunk_count       INT             NULL,
    indexed_at        DATETIME2       NULL,
    error_message     NVARCHAR(1000)  NULL,
    created_at        DATETIME2       NOT NULL DEFAULT GETDATE(),
    modified_at       DATETIME2       NOT NULL DEFAULT GETDATE()
  );
END
GO
