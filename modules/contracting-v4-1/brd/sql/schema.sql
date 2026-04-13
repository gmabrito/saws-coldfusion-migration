-- ============================================================================
-- SAWS Contracting V4-1 - Vendor Directory Schema
-- Module schema: contracting
-- Ref: BRD 6.1 - Bidder, Consultant & Vendor directory through EZlink
-- ============================================================================

-- Create schema if not exists
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'contracting')
BEGIN
    EXEC('CREATE SCHEMA contracting');
END
GO

-- ---------------------------------------------------------------------------
-- contracting.VendorCategories
-- Lookup table for vendor business categories
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('contracting.VendorCategories') AND type = 'U')
BEGIN
    CREATE TABLE contracting.VendorCategories (
        CategoryID      INT IDENTITY(1,1)   PRIMARY KEY,
        CategoryName    NVARCHAR(100)        NOT NULL,
        Description     NVARCHAR(500)        NULL,
        CONSTRAINT UQ_VendorCategories_Name UNIQUE (CategoryName)
    );
END
GO

-- ---------------------------------------------------------------------------
-- contracting.Vendors
-- Directory of registered vendors/contractors who do business with SAWS
-- Ref: BRD 6.1 - search, view, edit, remove vendor profiles
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('contracting.Vendors') AND type = 'U')
BEGIN
    CREATE TABLE contracting.Vendors (
        VendorID            INT IDENTITY(1,1)   PRIMARY KEY,
        BusinessName        NVARCHAR(200)        NOT NULL,
        ContactName         NVARCHAR(150)        NOT NULL,
        Email               NVARCHAR(255)        NOT NULL,
        Phone               NVARCHAR(20)         NULL,
        Address             NVARCHAR(255)        NULL,
        City                NVARCHAR(100)        NULL,
        State               NCHAR(2)             NULL,
        Zip                 NVARCHAR(10)         NULL,
        CategoryID          INT                  NULL,
        Status              NVARCHAR(20)         NOT NULL DEFAULT 'Pending',
        RegistrationDate    DATETIME             NOT NULL DEFAULT GETDATE(),
        LastLoginDate       DATETIME             NULL,
        PasswordHash        NVARCHAR(255)        NULL,
        PasswordResetDate   DATETIME             NULL,
        Notes               NVARCHAR(MAX)        NULL,
        CONSTRAINT FK_Vendors_Category FOREIGN KEY (CategoryID)
            REFERENCES contracting.VendorCategories(CategoryID),
        CONSTRAINT CK_Vendors_Status CHECK (Status IN ('Active', 'Inactive', 'Pending'))
    );
END
GO

-- Index for common search patterns
CREATE NONCLUSTERED INDEX IX_Vendors_BusinessName
    ON contracting.Vendors (BusinessName);
GO

CREATE NONCLUSTERED INDEX IX_Vendors_Status
    ON contracting.Vendors (Status);
GO

CREATE NONCLUSTERED INDEX IX_Vendors_CategoryID
    ON contracting.Vendors (CategoryID);
GO

-- ---------------------------------------------------------------------------
-- Seed data: vendor categories
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM contracting.VendorCategories)
BEGIN
    INSERT INTO contracting.VendorCategories (CategoryName, Description) VALUES
        ('Construction',        'General construction services and contractors'),
        ('Engineering',         'Engineering consulting and design services'),
        ('Environmental',       'Environmental services and compliance'),
        ('Information Technology', 'IT services, software, and hardware vendors'),
        ('Professional Services', 'Consulting, legal, and other professional services'),
        ('Supplies & Materials', 'Equipment, supplies, and materials vendors'),
        ('Maintenance & Repair', 'Facilities and equipment maintenance services'),
        ('Transportation',      'Transportation and logistics services'),
        ('Utilities',           'Utility-related services and infrastructure'),
        ('Other',               'Other vendor categories');
END
GO

-- ---------------------------------------------------------------------------
-- Seed data: sample vendors for prototype testing
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM contracting.Vendors)
BEGIN
    INSERT INTO contracting.Vendors
        (BusinessName, ContactName, Email, Phone, Address, City, State, Zip, CategoryID, Status, RegistrationDate)
    VALUES
        ('Alamo Engineering Group',   'Carlos Mendez',   'cmendez@internal',   '210-555-0101', '100 Main St',     'San Antonio', 'TX', '78201', 2, 'Active',   '2024-01-15'),
        ('Lone Star Construction',    'Sarah Johnson',   'sjohnson@internal',  '210-555-0102', '200 Commerce St', 'San Antonio', 'TX', '78205', 1, 'Active',   '2024-02-20'),
        ('River City IT Solutions',   'Mike Chen',       'mchen@internal',     '210-555-0103', '300 Market St',   'San Antonio', 'TX', '78207', 4, 'Active',   '2024-03-10'),
        ('South TX Environmental',    'Lisa Rodriguez',  'lrodriguez@internal','210-555-0104', '400 Houston St',  'San Antonio', 'TX', '78202', 3, 'Active',   '2024-04-05'),
        ('ProTech Maintenance',       'James Wilson',    'jwilson@internal',   '210-555-0105', '500 Navarro St',  'San Antonio', 'TX', '78206', 7, 'Inactive', '2024-05-12'),
        ('Hill Country Supplies',     'Amy Turner',      'aturner@internal',   '210-555-0106', '600 Flores St',   'San Antonio', 'TX', '78204', 6, 'Active',   '2024-06-01'),
        ('Bexar County Consulting',   'David Brown',     'dbrown@internal',    '210-555-0107', '700 Pecan St',    'San Antonio', 'TX', '78210', 5, 'Pending',  '2024-07-20'),
        ('Texas Transport LLC',       'Maria Garcia',    'mgarcia@internal',   '210-555-0108', '800 Alamo St',    'San Antonio', 'TX', '78215', 8, 'Active',   '2024-08-14'),
        ('ClearWater Utilities Inc',  'Robert Taylor',   'rtaylor@internal',   '210-555-0109', '900 Broadway',    'San Antonio', 'TX', '78209', 9, 'Active',   '2024-09-03'),
        ('Mission Road Services',     'Patricia Davis',  'pdavis@internal',    '210-555-0110', '1000 Military Dr','San Antonio', 'TX', '78214', 10,'Pending',  '2024-10-25');
END
GO
