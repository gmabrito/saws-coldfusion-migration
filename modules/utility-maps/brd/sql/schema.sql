-- Utility Maps Module Schema (BRD Approach)
-- Utility map viewing and management for SAWS infrastructure maps

IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'utilitymaps')
  EXEC('CREATE SCHEMA utilitymaps');
GO

-- Map Categories lookup table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MapCategories' AND schema_id = SCHEMA_ID('utilitymaps'))
BEGIN
    CREATE TABLE utilitymaps.MapCategories (
        CategoryID INT IDENTITY(1,1) PRIMARY KEY,
        CategoryName NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500) NULL
    );

    -- Seed default categories
    INSERT INTO utilitymaps.MapCategories (CategoryName, Description) VALUES
        ('Water Distribution', 'Water main and distribution system maps'),
        ('Sewer Collection', 'Sewer line and collection system maps'),
        ('Service Areas', 'Customer service area boundary maps'),
        ('Infrastructure', 'General infrastructure and facility maps'),
        ('Construction', 'Active construction and project area maps'),
        ('Environmental', 'Environmental and watershed maps');
END
GO

-- Maps table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Maps' AND schema_id = SCHEMA_ID('utilitymaps'))
BEGIN
    CREATE TABLE utilitymaps.Maps (
        MapID INT IDENTITY(1,1) PRIMARY KEY,
        Title NVARCHAR(200) NOT NULL,
        CategoryID INT NOT NULL REFERENCES utilitymaps.MapCategories(CategoryID),
        Area NVARCHAR(100) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        FileUrl NVARCHAR(500) NOT NULL,
        FileType NVARCHAR(20) NOT NULL DEFAULT 'PDF',
        LastUpdated DATETIME NOT NULL DEFAULT GETDATE(),
        CreatedByEmployeeID INT NOT NULL REFERENCES dbo.Employees(EmployeeID),
        CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
        ModifiedDate DATETIME NOT NULL DEFAULT GETDATE()
    );
END
GO

-- Index for category filtering
CREATE NONCLUSTERED INDEX IX_Maps_Category
ON utilitymaps.Maps (CategoryID)
INCLUDE (Title, Area, LastUpdated);
GO

-- Index for area search
CREATE NONCLUSTERED INDEX IX_Maps_Area
ON utilitymaps.Maps (Area)
INCLUDE (Title, CategoryID);
GO

-- Index for recent updates
CREATE NONCLUSTERED INDEX IX_Maps_LastUpdated
ON utilitymaps.Maps (LastUpdated DESC)
INCLUDE (Title, CategoryID, Area);
GO

PRINT 'Utility Maps module schema created successfully.';
GO
