-- HR Module Schema (BRD Approach)
-- Ref: BRD 6.1 - Weekly Job Email: job listings entered manually, automated Friday afternoon email
-- Ref: BRD 6.1 - Inactive Employee Directory: centralized inactive employee info with photos

-- Ensure hr schema exists
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'hr')
BEGIN
    EXEC('CREATE SCHEMA hr');
END
GO

-- Job Listings table for Weekly Job Email feature
-- Ref: BRD 6.1 - "jobs (internally and externally) elaborating the specific of each position available"
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'JobListings' AND schema_id = SCHEMA_ID('hr'))
BEGIN
    CREATE TABLE hr.JobListings (
        ListingID INT IDENTITY(1,1) PRIMARY KEY,
        Title NVARCHAR(200) NOT NULL,
        Description NVARCHAR(MAX) NOT NULL,
        Department NVARCHAR(100) NOT NULL,
        JobType NVARCHAR(20) NOT NULL CHECK (JobType IN ('Internal', 'External')),
        Requirements NVARCHAR(MAX) NULL,
        SalaryRange NVARCHAR(100) NULL,
        PostedDate DATETIME NOT NULL DEFAULT GETDATE(),
        ExpirationDate DATETIME NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (Status IN ('Active', 'Closed', 'Draft')),
        CreatedByEmployeeID INT NULL REFERENCES dbo.Employees(EmployeeID),
        CreatedDate DATETIME NOT NULL DEFAULT GETDATE()
    );
END
GO

-- Index for active listings query (used by public listing and email generation)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_JobListings_Status_Expiration')
BEGIN
    CREATE NONCLUSTERED INDEX IX_JobListings_Status_Expiration
    ON hr.JobListings (Status, ExpirationDate)
    INCLUDE (Title, Department, JobType, SalaryRange, PostedDate);
END
GO

-- Index for filtering by job type
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_JobListings_JobType')
BEGIN
    CREATE NONCLUSTERED INDEX IX_JobListings_JobType
    ON hr.JobListings (JobType)
    INCLUDE (Title, Department, Status, PostedDate);
END
GO

-- Inactive Employee Directory uses dbo.Employees WHERE IsActive = 0
-- No additional tables needed; the directory reads from the shared Employees table
-- Ref: BRD 6.1 - "All the inactive employee's information (to include their photo) is centralized within this area"

-- Index to support inactive employee directory queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Employees_Inactive')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Employees_Inactive
    ON dbo.Employees (IsActive, LastName, FirstName)
    INCLUDE (Email, Phone, JobTitle, PhotoURL, HireDate, TerminationDate, DepartmentID);
END
GO

PRINT 'HR module schema created successfully.';
GO
