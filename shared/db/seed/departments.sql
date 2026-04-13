-- Shared Departments table + seed data

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Departments' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.Departments (
        DepartmentID INT IDENTITY(1,1) PRIMARY KEY,
        DepartmentName NVARCHAR(100) NOT NULL,
        DepartmentCode NVARCHAR(20) NOT NULL UNIQUE,
        ManagerEmployeeID INT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
        ModifiedDate DATETIME NOT NULL DEFAULT GETDATE()
    );
END
GO

-- Seed departments based on BRD modules
INSERT INTO dbo.Departments (DepartmentName, DepartmentCode) VALUES
('Chief Executive Office', 'CEO'),
('Contracting', 'CNTRCT'),
('Development Services', 'DEV'),
('Finance & Accounting', 'FIN'),
('Fleet Services', 'FLEET'),
('Human Resources', 'HR'),
('Information Services', 'IS'),
('Operations - On Call', 'ONCALL'),
('Print Shop', 'PRINT'),
('Records Management', 'RECORDS'),
('Utility Maps', 'UTILMAP'),
('Water Resources', 'WATER'),
('Supply', 'SUPPLY'),
('Preventative Maintenance', 'PREVMNT');
GO

PRINT 'Departments table created and seeded.';
GO
