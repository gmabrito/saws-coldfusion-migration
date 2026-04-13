-- ============================================================
-- SAWS Development Services - Database Schema
-- Module: Development (CIAC Meetings & Contractor Registry)
-- Schema: development
-- ============================================================

-- Create schema if not exists
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'development')
BEGIN
    EXEC('CREATE SCHEMA development');
END
GO

-- ============================================================
-- BRD 7.1 - CIAC Meetings
-- ============================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'development.Meetings') AND type = 'U')
BEGIN
    CREATE TABLE development.Meetings (
        MeetingID           INT IDENTITY(1,1) PRIMARY KEY,
        MeetingDate         DATETIME          NOT NULL,
        Title               NVARCHAR(200)     NOT NULL,
        Location            NVARCHAR(200)     NOT NULL,
        Status              NVARCHAR(50)      NOT NULL DEFAULT 'Scheduled',
        Minutes             NVARCHAR(MAX)     NULL,
        CreatedByEmployeeID INT               NULL,
        CreatedDate         DATETIME          NOT NULL DEFAULT GETDATE(),
        ModifiedDate        DATETIME          NOT NULL DEFAULT GETDATE(),

        CONSTRAINT CK_Meetings_Status CHECK (Status IN ('Scheduled', 'In Progress', 'Completed', 'Cancelled'))
    );
END
GO

-- ============================================================
-- BRD 7.1 - Meeting Documents
-- ============================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'development.MeetingDocuments') AND type = 'U')
BEGIN
    CREATE TABLE development.MeetingDocuments (
        DocumentID           INT IDENTITY(1,1) PRIMARY KEY,
        MeetingID            INT               NOT NULL,
        FileName             NVARCHAR(255)     NOT NULL,
        FileType             NVARCHAR(50)      NOT NULL,
        Description          NVARCHAR(500)     NULL,
        UploadedByEmployeeID INT               NULL,
        UploadDate           DATETIME          NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_MeetingDocuments_Meeting
            FOREIGN KEY (MeetingID) REFERENCES development.Meetings(MeetingID)
    );
END
GO

-- Index for document lookups by meeting
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MeetingDocuments_MeetingID')
BEGIN
    CREATE INDEX IX_MeetingDocuments_MeetingID
        ON development.MeetingDocuments(MeetingID);
END
GO

-- ============================================================
-- BRD 7.2 - Authorized Contractor/Plumber Registry
-- ============================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'development.ContractorRegistry') AND type = 'U')
BEGIN
    CREATE TABLE development.ContractorRegistry (
        ContractorID      INT IDENTITY(1,1) PRIMARY KEY,
        CompanyName       NVARCHAR(200)     NOT NULL,
        ContactName       NVARCHAR(200)     NOT NULL,
        Phone             NVARCHAR(20)      NOT NULL,
        Email             NVARCHAR(200)     NULL,
        LicenseNumber     NVARCHAR(50)      NOT NULL,
        LicenseType       NVARCHAR(50)      NOT NULL,
        AuthorizationDate DATE              NOT NULL,
        ExpirationDate    DATE              NOT NULL,
        Status            NVARCHAR(50)      NOT NULL DEFAULT 'Active',
        Notes             NVARCHAR(MAX)     NULL,

        CONSTRAINT CK_ContractorRegistry_LicenseType CHECK (LicenseType IN ('Contractor', 'Plumber', 'Both')),
        CONSTRAINT CK_ContractorRegistry_Status CHECK (Status IN ('Active', 'Inactive', 'Suspended', 'Expired'))
    );
END
GO

-- Index for search queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ContractorRegistry_CompanyName')
BEGIN
    CREATE INDEX IX_ContractorRegistry_CompanyName
        ON development.ContractorRegistry(CompanyName);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ContractorRegistry_Status')
BEGIN
    CREATE INDEX IX_ContractorRegistry_Status
        ON development.ContractorRegistry(Status);
END
GO

-- ============================================================
-- Seed data for development/testing
-- ============================================================

-- Sample CIAC meetings
IF NOT EXISTS (SELECT 1 FROM development.Meetings)
BEGIN
    INSERT INTO development.Meetings (MeetingDate, Title, Location, Status, Minutes, CreatedByEmployeeID)
    VALUES
        ('2026-01-15', 'Q1 CIAC Board Meeting', 'SAWS Headquarters - Board Room A', 'Completed',
         'Attendees: Board members present. Reviewed Q4 capital improvement projects. Approved 3 new infrastructure initiatives. Action items assigned to project managers.', 1),
        ('2026-04-10', 'Q2 CIAC Board Meeting', 'SAWS Headquarters - Board Room A', 'Scheduled', NULL, 1),
        ('2026-03-05', 'Special Session - Pipeline Project Review', 'SAWS Conference Center', 'Completed',
         'Special session called to review pipeline replacement project timeline. Discussed budget overruns and mitigation strategies. Approved revised schedule.', 1),
        ('2026-07-15', 'Q3 CIAC Board Meeting', 'SAWS Headquarters - Board Room A', 'Scheduled', NULL, 1);

    -- Sample documents for the first meeting
    INSERT INTO development.MeetingDocuments (MeetingID, FileName, FileType, Description, UploadedByEmployeeID)
    VALUES
        (1, 'Q1_Agenda.pdf', 'PDF', 'Meeting agenda for Q1 board meeting', 1),
        (1, 'Q4_Capital_Projects_Report.pdf', 'PDF', 'Capital improvement project status report', 1),
        (1, 'Budget_Summary_Q4.xlsx', 'Excel', 'Financial summary of Q4 expenditures', 1),
        (3, 'Pipeline_Project_Timeline.pdf', 'PDF', 'Revised project timeline for pipeline replacement', 1),
        (3, 'Budget_Analysis.xlsx', 'Excel', 'Cost analysis and budget revision proposal', 1);
END
GO

-- Sample contractors/plumbers
IF NOT EXISTS (SELECT 1 FROM development.ContractorRegistry)
BEGIN
    INSERT INTO development.ContractorRegistry
        (CompanyName, ContactName, Phone, Email, LicenseNumber, LicenseType, AuthorizationDate, ExpirationDate, Status, Notes)
    VALUES
        ('ABC Plumbing Services', 'John Martinez', '210-555-0101', 'john@abcplumbing.com',
         'PL-2024-001', 'Plumber', '2025-01-15', '2027-01-15', 'Active', 'Authorized for residential and commercial plumbing work'),
        ('South Texas Contractors LLC', 'Maria Garcia', '210-555-0202', 'mgarcia@stxcontractors.com',
         'CN-2024-015', 'Contractor', '2025-03-01', '2027-03-01', 'Active', 'General contractor - infrastructure projects'),
        ('Lone Star Pipe & Drain', 'Robert Wilson', '210-555-0303', 'rwilson@lonestarplumbing.com',
         'PL-2023-042', 'Both', '2024-06-01', '2026-06-01', 'Active', 'Licensed for both contracting and plumbing services'),
        ('Rivera Construction Group', 'Carlos Rivera', '210-555-0404', 'crivera@riveracg.com',
         'CN-2023-088', 'Contractor', '2023-09-01', '2025-09-01', 'Expired', 'Authorization expired - pending renewal'),
        ('Elite Water Solutions', 'Sarah Chen', '210-555-0505', 'schen@elitewater.com',
         'PL-2024-023', 'Plumber', '2025-02-15', '2027-02-15', 'Active', 'Specializes in water main connections');
END
GO
