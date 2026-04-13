-- Records Storage Transmittal - Database Schema
-- Schema: records
-- BRD Reference: Section 6.1 - Records Storage Transmittal EZ Link

-- Create schema if not exists
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'records')
BEGIN
    EXEC('CREATE SCHEMA records');
END
GO

-- Retention Codes lookup table
-- Stores the retention schedule codes used to classify records
CREATE TABLE records.RetentionCodes (
    RetentionCodeID INT IDENTITY(1,1) PRIMARY KEY,
    Code VARCHAR(20) NOT NULL UNIQUE,
    Description VARCHAR(255) NOT NULL,
    RetentionYears INT NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL
);
GO

-- Transmittals - header record for each transmittal form submission
-- BRD 6.1: Departments submit records indexes to Records Management
CREATE TABLE records.Transmittals (
    TransmittalID INT IDENTITY(1,1) PRIMARY KEY,
    DepartmentID INT NOT NULL,
    SubmittedByEmployeeID INT NOT NULL,
    SubmitDate DATETIME NOT NULL DEFAULT GETDATE(),
    Status VARCHAR(20) NOT NULL DEFAULT 'Submitted'
        CHECK (Status IN ('Draft', 'Submitted', 'Reviewed', 'In Storage', 'Disposed')),
    Notes NVARCHAR(1000) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    -- Foreign keys to shared dbo tables
    CONSTRAINT FK_Transmittals_Department FOREIGN KEY (DepartmentID)
        REFERENCES dbo.Departments(DepartmentID),
    CONSTRAINT FK_Transmittals_Employee FOREIGN KEY (SubmittedByEmployeeID)
        REFERENCES dbo.Employees(EmployeeID)
);
GO

-- Box Indexes - individual box records within a transmittal
-- BRD 6.1: Record, edit, and retrieve record indexes
CREATE TABLE records.BoxIndexes (
    BoxID INT IDENTITY(1,1) PRIMARY KEY,
    TransmittalID INT NOT NULL,
    BoxNumber VARCHAR(50) NOT NULL,
    Description NVARCHAR(500) NOT NULL,
    RetentionCode VARCHAR(20) NOT NULL,
    RetentionDate DATE NULL,
    DispositionDate DATE NULL,
    Location VARCHAR(100) NULL,
    Keywords NVARCHAR(500) NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT FK_BoxIndexes_Transmittal FOREIGN KEY (TransmittalID)
        REFERENCES records.Transmittals(TransmittalID)
        ON DELETE CASCADE,
    CONSTRAINT FK_BoxIndexes_RetentionCode FOREIGN KEY (RetentionCode)
        REFERENCES records.RetentionCodes(Code)
);
GO

-- Indexes for search performance
-- BRD 6.1: Keyword searches to identify boxes with potentially relevant records
CREATE INDEX IX_BoxIndexes_Keywords ON records.BoxIndexes(Keywords);
CREATE INDEX IX_BoxIndexes_RetentionDate ON records.BoxIndexes(RetentionDate);
CREATE INDEX IX_BoxIndexes_TransmittalID ON records.BoxIndexes(TransmittalID);
CREATE INDEX IX_Transmittals_DepartmentID ON records.Transmittals(DepartmentID);
CREATE INDEX IX_Transmittals_Status ON records.Transmittals(Status);
GO

-- Seed retention codes
INSERT INTO records.RetentionCodes (Code, Description, RetentionYears) VALUES
('AC', 'Accounting Records', 7),
('AD', 'Administrative Records', 5),
('CO', 'Contracts and Agreements', 10),
('CR', 'Correspondence', 3),
('ENG', 'Engineering Records', 25),
('ENV', 'Environmental Records', 30),
('FIN', 'Financial Records', 7),
('HR', 'Human Resources Records', 7),
('LEG', 'Legal Records', 10),
('MTG', 'Meeting Minutes', 5),
('OPS', 'Operations Records', 10),
('PM', 'Project Management', 10),
('PR', 'Public Relations', 5),
('PERM', 'Permanent Records', 999),
('REG', 'Regulatory Records', 15),
('SAF', 'Safety Records', 30),
('UTIL', 'Utility Records', 25);
GO

-- Stored Procedures

-- Get all transmittals with pagination
CREATE OR ALTER PROCEDURE records.usp_GetTransmittals
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @Status VARCHAR(20) = NULL,
    @DepartmentID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        t.TransmittalID,
        t.DepartmentID,
        d.DepartmentName,
        t.SubmittedByEmployeeID,
        e.FirstName + ' ' + e.LastName AS SubmittedByName,
        t.SubmitDate,
        t.Status,
        t.Notes,
        t.CreatedDate,
        t.ModifiedDate,
        COUNT(b.BoxID) AS BoxCount
    FROM records.Transmittals t
    INNER JOIN dbo.Departments d ON t.DepartmentID = d.DepartmentID
    INNER JOIN dbo.Employees e ON t.SubmittedByEmployeeID = e.EmployeeID
    LEFT JOIN records.BoxIndexes b ON t.TransmittalID = b.TransmittalID
    WHERE (@Status IS NULL OR t.Status = @Status)
      AND (@DepartmentID IS NULL OR t.DepartmentID = @DepartmentID)
    GROUP BY t.TransmittalID, t.DepartmentID, d.DepartmentName,
             t.SubmittedByEmployeeID, e.FirstName, e.LastName,
             t.SubmitDate, t.Status, t.Notes, t.CreatedDate, t.ModifiedDate
    ORDER BY t.SubmitDate DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;

    -- Return total count for pagination
    SELECT COUNT(*) AS TotalCount
    FROM records.Transmittals t
    WHERE (@Status IS NULL OR t.Status = @Status)
      AND (@DepartmentID IS NULL OR t.DepartmentID = @DepartmentID);
END
GO

-- Get single transmittal with box indexes
CREATE OR ALTER PROCEDURE records.usp_GetTransmittalDetail
    @TransmittalID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        t.TransmittalID,
        t.DepartmentID,
        d.DepartmentName,
        t.SubmittedByEmployeeID,
        e.FirstName + ' ' + e.LastName AS SubmittedByName,
        t.SubmitDate,
        t.Status,
        t.Notes,
        t.CreatedDate,
        t.ModifiedDate
    FROM records.Transmittals t
    INNER JOIN dbo.Departments d ON t.DepartmentID = d.DepartmentID
    INNER JOIN dbo.Employees e ON t.SubmittedByEmployeeID = e.EmployeeID
    WHERE t.TransmittalID = @TransmittalID;

    SELECT
        b.BoxID,
        b.TransmittalID,
        b.BoxNumber,
        b.Description,
        b.RetentionCode,
        rc.Description AS RetentionCodeDescription,
        rc.RetentionYears,
        b.RetentionDate,
        b.DispositionDate,
        b.Location,
        b.Keywords,
        b.CreatedDate,
        b.ModifiedDate
    FROM records.BoxIndexes b
    INNER JOIN records.RetentionCodes rc ON b.RetentionCode = rc.Code
    WHERE b.TransmittalID = @TransmittalID
    ORDER BY b.BoxNumber;
END
GO

-- Search box indexes by keyword
-- BRD 6.1: Keyword searches to identify boxes with potentially relevant records
CREATE OR ALTER PROCEDURE records.usp_SearchBoxIndexes
    @Keyword NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        b.BoxID,
        b.TransmittalID,
        b.BoxNumber,
        b.Description,
        b.RetentionCode,
        rc.Description AS RetentionCodeDescription,
        b.RetentionDate,
        b.DispositionDate,
        b.Location,
        b.Keywords,
        t.DepartmentID,
        d.DepartmentName,
        t.Status AS TransmittalStatus
    FROM records.BoxIndexes b
    INNER JOIN records.RetentionCodes rc ON b.RetentionCode = rc.Code
    INNER JOIN records.Transmittals t ON b.TransmittalID = t.TransmittalID
    INNER JOIN dbo.Departments d ON t.DepartmentID = d.DepartmentID
    WHERE b.Keywords LIKE '%' + @Keyword + '%'
       OR b.Description LIKE '%' + @Keyword + '%'
       OR b.BoxNumber LIKE '%' + @Keyword + '%'
    ORDER BY b.BoxNumber;
END
GO

-- Insert transmittal
CREATE OR ALTER PROCEDURE records.usp_InsertTransmittal
    @DepartmentID INT,
    @SubmittedByEmployeeID INT,
    @Status VARCHAR(20) = 'Submitted',
    @Notes NVARCHAR(1000) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO records.Transmittals (DepartmentID, SubmittedByEmployeeID, Status, Notes)
    VALUES (@DepartmentID, @SubmittedByEmployeeID, @Status, @Notes);

    SELECT SCOPE_IDENTITY() AS TransmittalID;
END
GO

-- Insert box index
CREATE OR ALTER PROCEDURE records.usp_InsertBoxIndex
    @TransmittalID INT,
    @BoxNumber VARCHAR(50),
    @Description NVARCHAR(500),
    @RetentionCode VARCHAR(20),
    @RetentionDate DATE = NULL,
    @DispositionDate DATE = NULL,
    @Location VARCHAR(100) = NULL,
    @Keywords NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO records.BoxIndexes
        (TransmittalID, BoxNumber, Description, RetentionCode, RetentionDate, DispositionDate, Location, Keywords)
    VALUES
        (@TransmittalID, @BoxNumber, @Description, @RetentionCode, @RetentionDate, @DispositionDate, @Location, @Keywords);

    SELECT SCOPE_IDENTITY() AS BoxID;
END
GO

-- Update transmittal
CREATE OR ALTER PROCEDURE records.usp_UpdateTransmittal
    @TransmittalID INT,
    @DepartmentID INT,
    @Status VARCHAR(20),
    @Notes NVARCHAR(1000) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE records.Transmittals
    SET DepartmentID = @DepartmentID,
        Status = @Status,
        Notes = @Notes,
        ModifiedDate = GETDATE()
    WHERE TransmittalID = @TransmittalID;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Delete transmittal (cascades to box indexes)
CREATE OR ALTER PROCEDURE records.usp_DeleteTransmittal
    @TransmittalID INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM records.Transmittals
    WHERE TransmittalID = @TransmittalID;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Get retention codes
CREATE OR ALTER PROCEDURE records.usp_GetRetentionCodes
AS
BEGIN
    SET NOCOUNT ON;

    SELECT RetentionCodeID, Code, Description, RetentionYears
    FROM records.RetentionCodes
    WHERE IsActive = 1
    ORDER BY Code;
END
GO
