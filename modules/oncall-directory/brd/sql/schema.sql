-- On-Call Directory - Database Schema
-- Schema: oncall
-- BRD Reference: Section 7.1 - On-Call Directory
-- BRD Reference: Section 7.2 - Enhancements / Functional Requirements
-- BRD Reference: Section 7.3 - Report Requirements

-- Create schema if not exists
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'oncall')
BEGIN
    EXEC('CREATE SCHEMA oncall');
END
GO

-- On-Call Assignments
-- BRD 7.1: Schedule showing what employee is on-call, contact info by department
CREATE TABLE oncall.Assignments (
    AssignmentID INT IDENTITY(1,1) PRIMARY KEY,
    DepartmentID INT NOT NULL,
    EmployeeID INT NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    Phone VARCHAR(20) NOT NULL,
    Notes NVARCHAR(500) NULL,
    CreatedByEmployeeID INT NOT NULL,
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    -- Foreign keys to shared dbo tables
    CONSTRAINT FK_Assignments_Department FOREIGN KEY (DepartmentID)
        REFERENCES dbo.Departments(DepartmentID),
    CONSTRAINT FK_Assignments_Employee FOREIGN KEY (EmployeeID)
        REFERENCES dbo.Employees(EmployeeID),
    CONSTRAINT FK_Assignments_CreatedBy FOREIGN KEY (CreatedByEmployeeID)
        REFERENCES dbo.Employees(EmployeeID),
    -- Ensure end date is after start date
    CONSTRAINT CK_Assignments_DateRange CHECK (EndDate > StartDate)
);
GO

-- Indexes for query performance
-- BRD 7.1: Lookup by department
CREATE INDEX IX_Assignments_DepartmentID ON oncall.Assignments(DepartmentID);
-- BRD 7.2: Date range queries
CREATE INDEX IX_Assignments_DateRange ON oncall.Assignments(StartDate, EndDate);
-- Employee lookup
CREATE INDEX IX_Assignments_EmployeeID ON oncall.Assignments(EmployeeID);
GO

-- ============================================================
-- Stored Procedures
-- ============================================================

-- Get current on-call staff (optionally filtered by department)
-- BRD 7.1: Schedule showing what employee is on-call, contact info by department
CREATE OR ALTER PROCEDURE oncall.usp_GetCurrentOnCall
    @DepartmentID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        a.AssignmentID,
        a.DepartmentID,
        d.DepartmentName,
        a.EmployeeID,
        e.FirstName,
        e.LastName,
        e.Email,
        a.Phone,
        a.StartDate,
        a.EndDate,
        a.Notes
    FROM oncall.Assignments a
    INNER JOIN dbo.Departments d ON a.DepartmentID = d.DepartmentID
    INNER JOIN dbo.Employees e ON a.EmployeeID = e.EmployeeID
    WHERE CAST(GETDATE() AS DATE) BETWEEN a.StartDate AND a.EndDate
      AND (@DepartmentID IS NULL OR a.DepartmentID = @DepartmentID)
    ORDER BY d.DepartmentName, e.LastName, e.FirstName;
END
GO

-- Get schedule for date range with pagination
-- BRD 7.2: Enhanced filtering and date range queries
-- BRD 7.3: Report Requirements
CREATE OR ALTER PROCEDURE oncall.usp_GetSchedule
    @StartDate DATE = NULL,
    @EndDate DATE = NULL,
    @DepartmentID INT = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 25
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        a.AssignmentID,
        a.DepartmentID,
        d.DepartmentName,
        a.EmployeeID,
        e.FirstName,
        e.LastName,
        e.Email,
        a.Phone,
        a.StartDate,
        a.EndDate,
        a.Notes,
        a.CreatedByEmployeeID,
        ce.FirstName + ' ' + ce.LastName AS CreatedByName,
        a.CreatedDate,
        a.ModifiedDate
    FROM oncall.Assignments a
    INNER JOIN dbo.Departments d ON a.DepartmentID = d.DepartmentID
    INNER JOIN dbo.Employees e ON a.EmployeeID = e.EmployeeID
    INNER JOIN dbo.Employees ce ON a.CreatedByEmployeeID = ce.EmployeeID
    WHERE (@DepartmentID IS NULL OR a.DepartmentID = @DepartmentID)
      AND (@StartDate IS NULL OR a.EndDate >= @StartDate)
      AND (@EndDate IS NULL OR a.StartDate <= @EndDate)
    ORDER BY a.StartDate DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;

    -- Return total count for pagination
    SELECT COUNT(*) AS TotalCount
    FROM oncall.Assignments a
    WHERE (@DepartmentID IS NULL OR a.DepartmentID = @DepartmentID)
      AND (@StartDate IS NULL OR a.EndDate >= @StartDate)
      AND (@EndDate IS NULL OR a.StartDate <= @EndDate);
END
GO

-- Insert on-call assignment
-- BRD 7.2: Admin can assign on-call staff
CREATE OR ALTER PROCEDURE oncall.usp_InsertAssignment
    @DepartmentID INT,
    @EmployeeID INT,
    @StartDate DATE,
    @EndDate DATE,
    @Phone VARCHAR(20),
    @Notes NVARCHAR(500) = NULL,
    @CreatedByEmployeeID INT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO oncall.Assignments
        (DepartmentID, EmployeeID, StartDate, EndDate, Phone, Notes, CreatedByEmployeeID)
    VALUES
        (@DepartmentID, @EmployeeID, @StartDate, @EndDate, @Phone, @Notes, @CreatedByEmployeeID);

    SELECT SCOPE_IDENTITY() AS AssignmentID;
END
GO

-- Update on-call assignment
-- BRD 7.2: Admin can modify on-call assignments
CREATE OR ALTER PROCEDURE oncall.usp_UpdateAssignment
    @AssignmentID INT,
    @DepartmentID INT,
    @EmployeeID INT,
    @StartDate DATE,
    @EndDate DATE,
    @Phone VARCHAR(20),
    @Notes NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE oncall.Assignments
    SET DepartmentID = @DepartmentID,
        EmployeeID = @EmployeeID,
        StartDate = @StartDate,
        EndDate = @EndDate,
        Phone = @Phone,
        Notes = @Notes,
        ModifiedDate = GETDATE()
    WHERE AssignmentID = @AssignmentID;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Delete on-call assignment
-- BRD 7.2: Admin can remove on-call assignments
CREATE OR ALTER PROCEDURE oncall.usp_DeleteAssignment
    @AssignmentID INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM oncall.Assignments
    WHERE AssignmentID = @AssignmentID;

    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
