-- SAWS ColdFusion Migration - Database Schema Initialization
-- Run this against your SQL Server database to create per-module schemas

-- Module-specific schemas (loose coupling)
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'ceo')
    EXEC('CREATE SCHEMA ceo AUTHORIZATION dbo');
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'contracting')
    EXEC('CREATE SCHEMA contracting AUTHORIZATION dbo');
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'development')
    EXEC('CREATE SCHEMA development AUTHORIZATION dbo');
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'finance')
    EXEC('CREATE SCHEMA finance AUTHORIZATION dbo');
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'fleet')
    EXEC('CREATE SCHEMA fleet AUTHORIZATION dbo');
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'hr')
    EXEC('CREATE SCHEMA hr AUTHORIZATION dbo');
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'is_sms')
    EXEC('CREATE SCHEMA is_sms AUTHORIZATION dbo');
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'oncall')
    EXEC('CREATE SCHEMA oncall AUTHORIZATION dbo');
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'printshop')
    EXEC('CREATE SCHEMA printshop AUTHORIZATION dbo');
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'records')
    EXEC('CREATE SCHEMA records AUTHORIZATION dbo');
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'utilitymaps')
    EXEC('CREATE SCHEMA utilitymaps AUTHORIZATION dbo');
GO

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'waterresource')
    EXEC('CREATE SCHEMA waterresource AUTHORIZATION dbo');
GO

PRINT 'All module schemas created successfully.';
GO
