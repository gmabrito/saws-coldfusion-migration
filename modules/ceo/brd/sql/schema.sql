-- CEO Module Schema
-- BRD Requirements: 7.1 Board Committee Agenda, 7.2 Board Agenda, 7.3 Report Requirements

-- Create schema if not exists
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'ceo')
    EXEC('CREATE SCHEMA ceo');
GO

-- 7.1 & 7.2: Agendas table supporting both Committee and Board agendas
CREATE TABLE ceo.Agendas (
    AgendaID        INT IDENTITY(1,1) PRIMARY KEY,
    AgendaType      VARCHAR(20) NOT NULL CHECK (AgendaType IN ('Committee', 'Board')),
    CommitteeType   VARCHAR(20) NULL CHECK (CommitteeType IN ('Audit', 'Compensation') OR CommitteeType IS NULL),
    MeetingDate     DATETIME NOT NULL,
    Title           NVARCHAR(255) NOT NULL,
    Description     NVARCHAR(MAX) NULL,
    AccessibilityNotes NVARCHAR(MAX) NULL,   -- 7.2: handicap accessibility info
    Location        NVARCHAR(255) NULL,
    Status          VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (Status IN ('Draft', 'Published', 'Archived')),
    CreatedByEmployeeID INT NULL,
    CreatedDate     DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate    DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT CK_CommitteeType_Required CHECK (
        (AgendaType = 'Committee' AND CommitteeType IS NOT NULL)
        OR (AgendaType = 'Board' AND CommitteeType IS NULL)
    )
);
GO

-- 7.1 & 7.2: Documents attached to agendas
CREATE TABLE ceo.AgendaDocuments (
    DocumentID      INT IDENTITY(1,1) PRIMARY KEY,
    AgendaID        INT NOT NULL,
    FileName        NVARCHAR(255) NOT NULL,
    FileType        VARCHAR(50) NULL,
    Description     NVARCHAR(500) NULL,
    UploadDate      DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_AgendaDocuments_Agendas FOREIGN KEY (AgendaID)
        REFERENCES ceo.Agendas(AgendaID) ON DELETE CASCADE
);
GO

-- 7.2: Notification subscribers for board meetings
CREATE TABLE ceo.Subscribers (
    SubscriberID    INT IDENTITY(1,1) PRIMARY KEY,
    Email           NVARCHAR(255) NOT NULL,
    FullName        NVARCHAR(255) NOT NULL,
    SubscribedDate  DATETIME NOT NULL DEFAULT GETDATE(),
    IsActive        BIT NOT NULL DEFAULT 1,
    CONSTRAINT UQ_Subscribers_Email UNIQUE (Email)
);
GO

-- Stored Procedures

-- List agendas with optional type filter
CREATE OR ALTER PROCEDURE ceo.usp_GetAgendas
    @AgendaType VARCHAR(20) = NULL,
    @CommitteeType VARCHAR(20) = NULL,
    @Status VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        a.AgendaID, a.AgendaType, a.CommitteeType, a.MeetingDate,
        a.Title, a.Description, a.AccessibilityNotes, a.Location,
        a.Status, a.CreatedByEmployeeID, a.CreatedDate, a.ModifiedDate
    FROM ceo.Agendas a
    WHERE (@AgendaType IS NULL OR a.AgendaType = @AgendaType)
      AND (@CommitteeType IS NULL OR a.CommitteeType = @CommitteeType)
      AND (@Status IS NULL OR a.Status = @Status)
    ORDER BY a.MeetingDate DESC;
END;
GO

-- Get single agenda with documents
CREATE OR ALTER PROCEDURE ceo.usp_GetAgendaById
    @AgendaID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        a.AgendaID, a.AgendaType, a.CommitteeType, a.MeetingDate,
        a.Title, a.Description, a.AccessibilityNotes, a.Location,
        a.Status, a.CreatedByEmployeeID, a.CreatedDate, a.ModifiedDate
    FROM ceo.Agendas a
    WHERE a.AgendaID = @AgendaID;

    SELECT
        d.DocumentID, d.AgendaID, d.FileName, d.FileType,
        d.Description, d.UploadDate
    FROM ceo.AgendaDocuments d
    WHERE d.AgendaID = @AgendaID
    ORDER BY d.UploadDate DESC;
END;
GO

-- Insert agenda
CREATE OR ALTER PROCEDURE ceo.usp_InsertAgenda
    @AgendaType VARCHAR(20),
    @CommitteeType VARCHAR(20) = NULL,
    @MeetingDate DATETIME,
    @Title NVARCHAR(255),
    @Description NVARCHAR(MAX) = NULL,
    @AccessibilityNotes NVARCHAR(MAX) = NULL,
    @Location NVARCHAR(255) = NULL,
    @Status VARCHAR(20) = 'Draft',
    @CreatedByEmployeeID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO ceo.Agendas (AgendaType, CommitteeType, MeetingDate, Title, Description, AccessibilityNotes, Location, Status, CreatedByEmployeeID)
    VALUES (@AgendaType, @CommitteeType, @MeetingDate, @Title, @Description, @AccessibilityNotes, @Location, @Status, @CreatedByEmployeeID);
    SELECT SCOPE_IDENTITY() AS AgendaID;
END;
GO

-- Update agenda
CREATE OR ALTER PROCEDURE ceo.usp_UpdateAgenda
    @AgendaID INT,
    @AgendaType VARCHAR(20),
    @CommitteeType VARCHAR(20) = NULL,
    @MeetingDate DATETIME,
    @Title NVARCHAR(255),
    @Description NVARCHAR(MAX) = NULL,
    @AccessibilityNotes NVARCHAR(MAX) = NULL,
    @Location NVARCHAR(255) = NULL,
    @Status VARCHAR(20) = 'Draft'
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE ceo.Agendas
    SET AgendaType = @AgendaType,
        CommitteeType = @CommitteeType,
        MeetingDate = @MeetingDate,
        Title = @Title,
        Description = @Description,
        AccessibilityNotes = @AccessibilityNotes,
        Location = @Location,
        Status = @Status,
        ModifiedDate = GETDATE()
    WHERE AgendaID = @AgendaID;
    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

-- Delete agenda
CREATE OR ALTER PROCEDURE ceo.usp_DeleteAgenda
    @AgendaID INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM ceo.Agendas WHERE AgendaID = @AgendaID;
    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

-- Add document to agenda
CREATE OR ALTER PROCEDURE ceo.usp_InsertAgendaDocument
    @AgendaID INT,
    @FileName NVARCHAR(255),
    @FileType VARCHAR(50) = NULL,
    @Description NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO ceo.AgendaDocuments (AgendaID, FileName, FileType, Description)
    VALUES (@AgendaID, @FileName, @FileType, @Description);
    SELECT SCOPE_IDENTITY() AS DocumentID;
END;
GO

-- List subscribers
CREATE OR ALTER PROCEDURE ceo.usp_GetSubscribers
AS
BEGIN
    SET NOCOUNT ON;
    SELECT SubscriberID, Email, FullName, SubscribedDate, IsActive
    FROM ceo.Subscribers
    ORDER BY SubscribedDate DESC;
END;
GO

-- Insert subscriber
CREATE OR ALTER PROCEDURE ceo.usp_InsertSubscriber
    @Email NVARCHAR(255),
    @FullName NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM ceo.Subscribers WHERE Email = @Email)
    BEGIN
        UPDATE ceo.Subscribers SET IsActive = 1, FullName = @FullName WHERE Email = @Email;
        SELECT SubscriberID FROM ceo.Subscribers WHERE Email = @Email;
    END
    ELSE
    BEGIN
        INSERT INTO ceo.Subscribers (Email, FullName) VALUES (@Email, @FullName);
        SELECT SCOPE_IDENTITY() AS SubscriberID;
    END
END;
GO

-- Delete (unsubscribe) subscriber
CREATE OR ALTER PROCEDURE ceo.usp_DeleteSubscriber
    @SubscriberID INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE ceo.Subscribers SET IsActive = 0 WHERE SubscriberID = @SubscriberID;
    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO
