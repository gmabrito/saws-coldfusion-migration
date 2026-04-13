-- IS Part 1: Emergency SMS Text Message Notification Opt-in
-- BRD 7.1: SMS Opt-in schema
-- BRD 7.2: Technical requirements

-- Create schema if not exists
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'is_sms')
BEGIN
    EXEC('CREATE SCHEMA is_sms');
END
GO

-- BRD 7.1: Opt-in records for emergency SMS notifications
CREATE TABLE is_sms.OptIns (
    OptInID         INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeID      INT NOT NULL,
    PhoneNumber     NVARCHAR(20) NOT NULL,
    ConsentDate     DATETIME NOT NULL DEFAULT GETDATE(),
    IsActive        BIT NOT NULL DEFAULT 1,
    CreatedDate     DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_OptIns_Employees FOREIGN KEY (EmployeeID)
        REFERENCES dbo.Employees(EmployeeID)
);
GO

-- BRD 7.1: Notification type preferences per opt-in
-- Types: Inclement/Emergency Weather, Fire Alarm, Hazardous Chemical Incident,
--        Emergency Lockdown, Other Emergencies
CREATE TABLE is_sms.OptInPreferences (
    PreferenceID      INT IDENTITY(1,1) PRIMARY KEY,
    OptInID           INT NOT NULL,
    NotificationType  NVARCHAR(100) NOT NULL,
    IsEnabled         BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_OptInPreferences_OptIns FOREIGN KEY (OptInID)
        REFERENCES is_sms.OptIns(OptInID)
);
GO

-- Indexes for performance (BRD 7.2)
CREATE INDEX IX_OptIns_EmployeeID ON is_sms.OptIns(EmployeeID);
CREATE INDEX IX_OptIns_IsActive ON is_sms.OptIns(IsActive);
CREATE INDEX IX_OptInPreferences_OptInID ON is_sms.OptInPreferences(OptInID);
GO

-- Stored procedures (BRD 7.2)
CREATE OR ALTER PROCEDURE is_sms.usp_GetOptIns
    @Search NVARCHAR(100) = NULL,
    @IsActive BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT o.OptInID, o.EmployeeID, o.PhoneNumber, o.ConsentDate, o.IsActive, o.CreatedDate,
           e.FirstName, e.LastName, e.Email, e.Department
    FROM is_sms.OptIns o
    LEFT JOIN dbo.Employees e ON o.EmployeeID = e.EmployeeID
    WHERE (@Search IS NULL OR e.FirstName LIKE '%' + @Search + '%'
           OR e.LastName LIKE '%' + @Search + '%'
           OR o.PhoneNumber LIKE '%' + @Search + '%')
      AND (@IsActive IS NULL OR o.IsActive = @IsActive)
    ORDER BY o.CreatedDate DESC;
END
GO

CREATE OR ALTER PROCEDURE is_sms.usp_GetOptInById
    @OptInID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT o.OptInID, o.EmployeeID, o.PhoneNumber, o.ConsentDate, o.IsActive, o.CreatedDate,
           e.FirstName, e.LastName, e.Email, e.Department
    FROM is_sms.OptIns o
    LEFT JOIN dbo.Employees e ON o.EmployeeID = e.EmployeeID
    WHERE o.OptInID = @OptInID;

    SELECT PreferenceID, OptInID, NotificationType, IsEnabled
    FROM is_sms.OptInPreferences
    WHERE OptInID = @OptInID;
END
GO

CREATE OR ALTER PROCEDURE is_sms.usp_InsertOptIn
    @EmployeeID INT,
    @PhoneNumber NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO is_sms.OptIns (EmployeeID, PhoneNumber, ConsentDate, IsActive, CreatedDate)
    OUTPUT INSERTED.OptInID
    VALUES (@EmployeeID, @PhoneNumber, GETDATE(), 1, GETDATE());
END
GO
