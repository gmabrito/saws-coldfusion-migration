-- Finance Module Schema (BRD Approach)
-- Ref: BRD Section 7.1 Fire Hydrant Meter Contracts
-- Ref: BRD Section 7.2 Fire Hydrant Meter Reading Reports

-- Fire Hydrant Meter Contracts
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Contracts' AND schema_id = SCHEMA_ID('finance'))
BEGIN
    CREATE TABLE finance.Contracts (
        ContractID INT IDENTITY(1,1) PRIMARY KEY,
        ApplicantName NVARCHAR(100) NOT NULL,
        BusinessName NVARCHAR(100) NOT NULL,
        Email NVARCHAR(100) NOT NULL,
        Phone NVARCHAR(20) NOT NULL,
        MeterSize NVARCHAR(20) NOT NULL,
        MeterLocation NVARCHAR(200) NOT NULL,
        ProjectDescription NVARCHAR(MAX) NULL,
        EstimatedDuration NVARCHAR(50) NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        ApplicationDate DATETIME NOT NULL DEFAULT GETDATE(),
        ApprovedDate DATETIME NULL,
        ApprovedByEmployeeID INT NULL REFERENCES dbo.Employees(EmployeeID),
        ReviewNotes NVARCHAR(MAX) NULL,
        DepositPaid BIT NOT NULL DEFAULT 0,
        DepositAmount DECIMAL(10,2) NULL,
        DepositDate DATETIME NULL,
        CustomerCenter NVARCHAR(50) NULL,
        CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
        ModifiedDate DATETIME NOT NULL DEFAULT GETDATE()
    );
END
GO

-- Fire Hydrant Meter Reading Reports
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Readings' AND schema_id = SCHEMA_ID('finance'))
BEGIN
    CREATE TABLE finance.Readings (
        ReadingID INT IDENTITY(1,1) PRIMARY KEY,
        ContractID INT NOT NULL REFERENCES finance.Contracts(ContractID),
        ReadingDate DATETIME NOT NULL DEFAULT GETDATE(),
        CurrentReading DECIMAL(10,2) NOT NULL,
        PreviousReading DECIMAL(10,2) NOT NULL,
        Usage DECIMAL(10,2) NOT NULL,
        MeterLocation NVARCHAR(200) NULL,
        ReportedBy NVARCHAR(100) NOT NULL,
        CreatedDate DATETIME NOT NULL DEFAULT GETDATE()
    );
END
GO

-- Index for monthly reporting
CREATE NONCLUSTERED INDEX IX_Readings_Date
ON finance.Readings (ReadingDate)
INCLUDE (ContractID, CurrentReading, PreviousReading, Usage);
GO

PRINT 'Finance module schema created successfully.';
GO
