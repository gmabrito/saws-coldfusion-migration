-- Shared Employees table + seed data

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Employees' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.Employees (
        EmployeeID INT IDENTITY(1,1) PRIMARY KEY,
        FirstName NVARCHAR(50) NOT NULL,
        LastName NVARCHAR(50) NOT NULL,
        Email NVARCHAR(100) NOT NULL,
        Phone NVARCHAR(20) NULL,
        Title NVARCHAR(100) NULL,
        DepartmentID INT NULL REFERENCES dbo.Departments(DepartmentID),
        IsActive BIT NOT NULL DEFAULT 1,
        HireDate DATE NULL,
        TerminationDate DATE NULL,
        PhotoURL NVARCHAR(255) NULL,
        CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
        ModifiedDate DATETIME NOT NULL DEFAULT GETDATE()
    );
END
GO

-- Seed with mock employees (one per department)
INSERT INTO dbo.Employees (FirstName, LastName, Email, Phone, Title, DepartmentID, HireDate) VALUES
('Jane', 'Smith', 'jsmith@internal', '210-555-0101', 'CEO', 1, '2015-01-15'),
('John', 'Davis', 'jdavis@internal', '210-555-0102', 'Contracting Manager', 2, '2016-03-20'),
('Maria', 'Garcia', 'mgarcia@internal', '210-555-0103', 'Development Manager', 3, '2017-06-01'),
('Robert', 'Johnson', 'rjohnson@internal', '210-555-0104', 'Finance Director', 4, '2014-09-10'),
('Lisa', 'Williams', 'lwilliams@internal', '210-555-0105', 'Fleet Manager', 5, '2018-02-14'),
('Michael', 'Brown', 'mbrown@internal', '210-555-0106', 'HR Director', 6, '2013-11-20'),
('Sarah', 'Jones', 'sjones@internal', '210-555-0107', 'IS Manager', 7, '2016-08-05'),
('David', 'Miller', 'dmiller@internal', '210-555-0108', 'Operations Supervisor', 8, '2019-04-15'),
('Jennifer', 'Wilson', 'jwilson@internal', '210-555-0109', 'Print Shop Lead', 9, '2017-12-01'),
('James', 'Taylor', 'jtaylor@internal', '210-555-0110', 'Records Manager', 10, '2015-07-22'),
('Amanda', 'Anderson', 'aanderson@internal', '210-555-0111', 'GIS Analyst', 11, '2020-01-10'),
('Chris', 'Thomas', 'cthomas@internal', '210-555-0112', 'Water Resources Analyst', 12, '2018-10-30'),
('Patricia', 'Martinez', 'pmartinez@internal', '210-555-0113', 'Supply Manager', 13, '2016-05-18'),
('Daniel', 'Hernandez', 'dhernandez@internal', '210-555-0114', 'PM Inspector', 14, '2019-08-25');
GO

PRINT 'Employees table created and seeded.';
GO
