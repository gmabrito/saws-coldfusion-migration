-- Shared Lookup Values table + seed data

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LookupValues' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.LookupValues (
        LookupID INT IDENTITY(1,1) PRIMARY KEY,
        Category NVARCHAR(50) NOT NULL,
        LookupKey NVARCHAR(50) NOT NULL,
        LookupValue NVARCHAR(255) NOT NULL,
        SortOrder INT NOT NULL DEFAULT 0,
        IsActive BIT NOT NULL DEFAULT 1,
        UNIQUE (Category, LookupKey)
    );
END
GO

-- Application statuses
INSERT INTO dbo.LookupValues (Category, LookupKey, LookupValue, SortOrder) VALUES
('AppStatus', 'PENDING', 'Pending Review', 1),
('AppStatus', 'APPROVED', 'Approved', 2),
('AppStatus', 'DENIED', 'Denied', 3),
('AppStatus', 'ACTIVE', 'Active', 4),
('AppStatus', 'INACTIVE', 'Inactive', 5);

-- Meeting types
INSERT INTO dbo.LookupValues (Category, LookupKey, LookupValue, SortOrder) VALUES
('MeetingType', 'AUDIT', 'Audit Committee', 1),
('MeetingType', 'COMP', 'Compensation Committee', 2),
('MeetingType', 'BOARD', 'Board Meeting', 3),
('MeetingType', 'CIAC', 'CIAC Meeting', 4);

-- Emergency notification types
INSERT INTO dbo.LookupValues (Category, LookupKey, LookupValue, SortOrder) VALUES
('EmergencyType', 'WEATHER', 'Inclement/Emergency Weather', 1),
('EmergencyType', 'FIRE', 'Fire Alarm', 2),
('EmergencyType', 'HAZMAT', 'Hazardous Chemical Incident', 3),
('EmergencyType', 'LOCKDOWN', 'Emergency Lockdown', 4),
('EmergencyType', 'OTHER', 'Other Emergency', 5);

-- Counties for water resource stats
INSERT INTO dbo.LookupValues (Category, LookupKey, LookupValue, SortOrder) VALUES
('County', 'BEXAR', 'Bexar County', 1),
('County', 'MEDINA', 'Medina County', 2),
('County', 'UVALDE', 'Uvalde County', 3),
('County', 'COMAL', 'Comal County', 4),
('County', 'HAYS', 'Hays County', 5);
GO

PRINT 'LookupValues table created and seeded.';
GO
