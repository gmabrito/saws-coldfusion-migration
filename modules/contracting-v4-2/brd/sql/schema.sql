-- ============================================================
-- SAWS Contracting V4-2 - Database Schema
-- Module: Contracting Solicitations
-- Schema: contracting
-- ============================================================

-- Create schema if not exists
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'contracting')
BEGIN
    EXEC('CREATE SCHEMA contracting');
END
GO

-- ============================================================
-- Solicitations
-- ============================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'contracting.Solicitations') AND type = 'U')
BEGIN
    CREATE TABLE contracting.Solicitations (
        SolicitationID       INT IDENTITY(1,1) PRIMARY KEY,
        Title                NVARCHAR(300)     NOT NULL,
        Description          NVARCHAR(MAX)     NULL,
        SolicitationType     NVARCHAR(100)     NOT NULL,
        PostedDate           DATETIME          NULL,
        Deadline             DATETIME          NULL,
        Status               NVARCHAR(50)      NOT NULL DEFAULT 'Open',
        AwardedVendorID      INT               NULL,
        AwardDate            DATETIME          NULL,
        CreatedByEmployeeID  INT               NULL,
        CreatedDate          DATETIME          NOT NULL DEFAULT GETDATE(),
        ModifiedDate         DATETIME          NOT NULL DEFAULT GETDATE(),

        CONSTRAINT CK_Solicitations_Status CHECK (Status IN ('Open', 'Closed', 'Awarded'))
    );
END
GO

-- Index for status filtering
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Solicitations_Status')
BEGIN
    CREATE INDEX IX_Solicitations_Status
        ON contracting.Solicitations(Status);
END
GO

-- Index for type filtering
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Solicitations_Type')
BEGIN
    CREATE INDEX IX_Solicitations_Type
        ON contracting.Solicitations(SolicitationType);
END
GO

-- ============================================================
-- Solicitation Documents
-- ============================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'contracting.SolicitationDocuments') AND type = 'U')
BEGIN
    CREATE TABLE contracting.SolicitationDocuments (
        DocumentID       INT IDENTITY(1,1) PRIMARY KEY,
        SolicitationID   INT               NOT NULL,
        FileName         NVARCHAR(255)     NOT NULL,
        FileType         NVARCHAR(50)      NOT NULL,
        Description      NVARCHAR(500)     NULL,
        UploadDate       DATETIME          NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_SolicitationDocuments_Solicitation
            FOREIGN KEY (SolicitationID) REFERENCES contracting.Solicitations(SolicitationID)
    );
END
GO

-- Index for document lookups by solicitation
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SolicitationDocuments_SolicitationID')
BEGIN
    CREATE INDEX IX_SolicitationDocuments_SolicitationID
        ON contracting.SolicitationDocuments(SolicitationID);
END
GO

-- ============================================================
-- Solicitation Notifications
-- ============================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'contracting.SolicitationNotifications') AND type = 'U')
BEGIN
    CREATE TABLE contracting.SolicitationNotifications (
        NotificationID   INT IDENTITY(1,1) PRIMARY KEY,
        SolicitationID   INT               NOT NULL,
        SentDate         DATETIME          NOT NULL DEFAULT GETDATE(),
        RecipientCount   INT               NOT NULL DEFAULT 0,
        Message          NVARCHAR(MAX)     NOT NULL,

        CONSTRAINT FK_SolicitationNotifications_Solicitation
            FOREIGN KEY (SolicitationID) REFERENCES contracting.Solicitations(SolicitationID)
    );
END
GO

-- Index for notification lookups by solicitation
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SolicitationNotifications_SolicitationID')
BEGIN
    CREATE INDEX IX_SolicitationNotifications_SolicitationID
        ON contracting.SolicitationNotifications(SolicitationID);
END
GO

-- ============================================================
-- Seed data for development/testing
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM contracting.Solicitations)
BEGIN
    INSERT INTO contracting.Solicitations
        (Title, Description, SolicitationType, PostedDate, Deadline, Status, AwardedVendorID, AwardDate, CreatedByEmployeeID)
    VALUES
        ('Water Main Replacement - Phase III',
         'Solicitation for contractors to bid on Phase III of the citywide water main replacement program. Includes approximately 12 miles of pipe replacement in the downtown corridor.',
         'Invitation for Bid', '2026-01-10', '2026-03-15', 'Awarded', 101, '2026-03-20', 1),

        ('SCADA System Upgrade',
         'Request for proposals to upgrade the existing SCADA monitoring system across all water treatment facilities.',
         'Request for Proposal', '2026-02-01', '2026-04-30', 'Open', NULL, NULL, 1),

        ('Fleet Vehicle Maintenance Services',
         'Annual contract for preventive maintenance and repair services for the SAWS utility vehicle fleet.',
         'Request for Qualification', '2026-03-01', '2026-05-15', 'Open', NULL, NULL, 1),

        ('Emergency Generator Installation',
         'Solicitation for installation of backup generators at three pump stations.',
         'Invitation for Bid', '2025-11-15', '2026-01-30', 'Closed', NULL, NULL, 1),

        ('Water Quality Lab Equipment',
         'Procurement of laboratory testing equipment for the water quality division.',
         'Request for Proposal', '2026-03-15', '2026-06-01', 'Open', NULL, NULL, 1);

    -- Sample documents
    INSERT INTO contracting.SolicitationDocuments
        (SolicitationID, FileName, FileType, Description)
    VALUES
        (1, 'Phase_III_Scope_of_Work.pdf', 'PDF', 'Detailed scope of work and project specifications'),
        (1, 'Bid_Form_Template.docx', 'Word', 'Required bid submission form'),
        (1, 'Site_Maps.pdf', 'PDF', 'Maps of affected areas for Phase III'),
        (2, 'SCADA_RFP_Requirements.pdf', 'PDF', 'Technical requirements and evaluation criteria'),
        (2, 'Current_System_Architecture.pdf', 'PDF', 'Documentation of existing SCADA infrastructure'),
        (3, 'Fleet_Inventory_List.xlsx', 'Excel', 'Complete list of vehicles requiring service'),
        (4, 'Generator_Specifications.pdf', 'PDF', 'Technical specifications for required generators'),
        (5, 'Lab_Equipment_List.xlsx', 'Excel', 'List of required equipment with specifications');

    -- Sample notifications
    INSERT INTO contracting.SolicitationNotifications
        (SolicitationID, SentDate, RecipientCount, Message)
    VALUES
        (1, '2026-01-10', 45, 'New solicitation posted: Water Main Replacement - Phase III. Bid deadline: March 15, 2026.'),
        (1, '2026-03-01', 45, 'Reminder: Bid deadline approaching for Water Main Replacement - Phase III. Deadline: March 15, 2026.'),
        (2, '2026-02-01', 30, 'New solicitation posted: SCADA System Upgrade. Proposal deadline: April 30, 2026.'),
        (3, '2026-03-01', 25, 'New solicitation posted: Fleet Vehicle Maintenance Services. Qualification deadline: May 15, 2026.');
END
GO
