-- Print Shop Final Module Schema (BRD Approach)
-- Enhanced print job tracking with dashboard and approval workflow
-- Shares printshop schema with print-shop module

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'printshop')
  EXEC('CREATE SCHEMA printshop');
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PrintJobs' AND schema_id = SCHEMA_ID('printshop'))
BEGIN
    CREATE TABLE printshop.PrintJobs (
        JobID INT IDENTITY(1,1) PRIMARY KEY,
        Title NVARCHAR(200) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        Quantity INT NOT NULL DEFAULT 1,
        PaperSize NVARCHAR(50) NOT NULL,
        ColorType NVARCHAR(20) NOT NULL DEFAULT 'Black & White',
        DepartmentID INT NOT NULL REFERENCES dbo.Departments(DepartmentID),
        RequestedByEmployeeID INT NOT NULL REFERENCES dbo.Employees(EmployeeID),
        RushOrder BIT NOT NULL DEFAULT 0,
        Status NVARCHAR(20) NOT NULL DEFAULT 'Submitted',
        RequestDate DATETIME NOT NULL DEFAULT GETDATE(),
        CompletedDate DATETIME NULL,
        Notes NVARCHAR(MAX) NULL,
        CreatedDate DATETIME NOT NULL DEFAULT GETDATE()
    );
END
GO

-- Check constraint for valid statuses
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_PrintJobs_Status')
BEGIN
    ALTER TABLE printshop.PrintJobs
    ADD CONSTRAINT CK_PrintJobs_Status
    CHECK (Status IN ('Submitted', 'InProgress', 'Completed', 'Cancelled'));
END
GO

-- Indexes for dashboard queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PrintJobs_Status')
    CREATE NONCLUSTERED INDEX IX_PrintJobs_Status
    ON printshop.PrintJobs (Status)
    INCLUDE (DepartmentID, RequestDate, Title);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PrintJobs_Department')
    CREATE NONCLUSTERED INDEX IX_PrintJobs_Department
    ON printshop.PrintJobs (DepartmentID)
    INCLUDE (Status, RequestDate);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_PrintJobs_RushOrder')
    CREATE NONCLUSTERED INDEX IX_PrintJobs_RushOrder
    ON printshop.PrintJobs (RushOrder, Status)
    WHERE RushOrder = 1;
GO

PRINT 'Print Shop Final module schema created successfully.';
GO
