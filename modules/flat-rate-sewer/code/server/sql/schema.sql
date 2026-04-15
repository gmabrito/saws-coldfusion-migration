-- ============================================================================
-- SAWS Flat Rate Sewer (FRS) Module - Database Schema
-- Code-driven migration from ColdFusion CS_FRS_* tables
-- Schema: frs
-- ============================================================================

-- Create schema if not exists
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'frs')
  EXEC('CREATE SCHEMA frs');
GO

-- ============================================================================
-- TABLE: frs.Accounts
-- Origin: CS_FRS_ACCOUNTS
-- ============================================================================
IF OBJECT_ID('frs.Accounts', 'U') IS NULL
BEGIN
  CREATE TABLE frs.Accounts (
    AccountNum        VARCHAR(20)     NOT NULL PRIMARY KEY,
    ContactID         INT             NULL,
    FacilityDesc      VARCHAR(200)    NULL,
    MeterSize         VARCHAR(10)     NULL,
    Method            VARCHAR(20)     NULL,
    Basis             VARCHAR(20)     NULL,
    BOD_PCT           DECIMAL(5,2)    NULL DEFAULT 0,
    TDD_PCT           DECIMAL(5,2)    NULL DEFAULT 0,
    StartDate         DATE            NULL,
    EndDate           DATE            NULL,
    AssessmentFreq    INT             NULL DEFAULT 12,
    InspectionFreq    INT             NULL DEFAULT 12,
    BillingMethodType VARCHAR(20)     NULL DEFAULT 'STANDARD',
    CreatedBy         VARCHAR(50)     NULL,
    NextAssessmentDate DATE           NULL,
    NextInspectionDate DATE           NULL,
    Status            VARCHAR(20)     NOT NULL DEFAULT 'Active',
    CreatedDate       DATETIME2       NOT NULL DEFAULT GETDATE(),
    ModifiedDate      DATETIME2       NOT NULL DEFAULT GETDATE()
  );
END
GO

-- ============================================================================
-- TABLE: frs.Contacts
-- Origin: CS_FRS_CONTACTS
-- ============================================================================
IF OBJECT_ID('frs.Contacts', 'U') IS NULL
BEGIN
  CREATE TABLE frs.Contacts (
    ContactID         INT IDENTITY(1,1) PRIMARY KEY,
    AccountNum        VARCHAR(20)     NOT NULL,
    BusinessName      VARCHAR(200)    NULL,
    ContactName       VARCHAR(100)    NULL,
    Address           VARCHAR(200)    NULL,
    City              VARCHAR(50)     NULL,
    State             VARCHAR(2)      NULL DEFAULT 'TX',
    Zip               VARCHAR(10)     NULL,
    Phone             VARCHAR(20)     NULL,
    Email             VARCHAR(100)    NULL,
    IsActive          BIT             NOT NULL DEFAULT 1,
    CONSTRAINT FK_Contacts_Accounts FOREIGN KEY (AccountNum) REFERENCES frs.Accounts(AccountNum)
  );
  CREATE INDEX IX_Contacts_AccountNum ON frs.Contacts(AccountNum);
  CREATE INDEX IX_Contacts_BusinessName ON frs.Contacts(BusinessName);
END
GO

-- ============================================================================
-- TABLE: frs.Meters
-- Origin: CS_FRS_METERS
-- ============================================================================
IF OBJECT_ID('frs.Meters', 'U') IS NULL
BEGIN
  CREATE TABLE frs.Meters (
    MeterID           INT IDENTITY(1,1) PRIMARY KEY,
    AccountNum        VARCHAR(20)     NOT NULL,
    Serial            VARCHAR(30)     NOT NULL,
    MeterSize         VARCHAR(10)     NULL,
    FunctionType      VARCHAR(20)     NOT NULL, -- MAKEUP, BLOWDOWN, LOSS, SEWER, INCOMING
    UOM               VARCHAR(5)      NOT NULL DEFAULT 'GAL', -- GAL, CF, CCF, LB
    MaxReading        DECIMAL(18,2)   NOT NULL DEFAULT 9999999,
    IsActive          BIT             NOT NULL DEFAULT 1,
    CONSTRAINT FK_Meters_Accounts FOREIGN KEY (AccountNum) REFERENCES frs.Accounts(AccountNum),
    CONSTRAINT CK_Meters_FunctionType CHECK (FunctionType IN ('MAKEUP','BLOWDOWN','LOSS','SEWER','INCOMING')),
    CONSTRAINT CK_Meters_UOM CHECK (UOM IN ('GAL','CF','CCF','LB'))
  );
  CREATE INDEX IX_Meters_AccountNum ON frs.Meters(AccountNum);
  CREATE INDEX IX_Meters_Serial ON frs.Meters(Serial);
END
GO

-- ============================================================================
-- TABLE: frs.MeterReadings
-- Origin: CS_FRS_METER_READINGS
-- ============================================================================
IF OBJECT_ID('frs.MeterReadings', 'U') IS NULL
BEGIN
  CREATE TABLE frs.MeterReadings (
    ReadingID         INT IDENTITY(1,1) PRIMARY KEY,
    AccountNum        VARCHAR(20)     NOT NULL,
    Serial            VARCHAR(30)     NOT NULL,
    ReadingDate       DATE            NOT NULL,
    ReadingValue      DECIMAL(18,2)   NOT NULL,
    Consumption       DECIMAL(18,2)   NULL DEFAULT 0,
    MakeupCCF         DECIMAL(18,4)   NULL DEFAULT 0,
    BlowdownCCF       DECIMAL(18,4)   NULL DEFAULT 0,
    LossCCF           DECIMAL(18,4)   NULL DEFAULT 0,
    SewerCCF          DECIMAL(18,4)   NULL DEFAULT 0,
    IncomingCCF       DECIMAL(18,4)   NULL DEFAULT 0,
    PctChange         DECIMAL(8,4)    NULL DEFAULT 0,
    EntryDate         DATETIME2       NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_MeterReadings_Accounts FOREIGN KEY (AccountNum) REFERENCES frs.Accounts(AccountNum)
  );
  CREATE INDEX IX_MeterReadings_AccountNum ON frs.MeterReadings(AccountNum);
  CREATE INDEX IX_MeterReadings_Serial ON frs.MeterReadings(Serial);
  CREATE INDEX IX_MeterReadings_ReadingDate ON frs.MeterReadings(ReadingDate);
END
GO

-- ============================================================================
-- TABLE: frs.BillingAssessments
-- Origin: CS_FRS_BILLING_ASSESSMENTS
-- ============================================================================
IF OBJECT_ID('frs.BillingAssessments', 'U') IS NULL
BEGIN
  CREATE TABLE frs.BillingAssessments (
    AssessmentID      INT IDENTITY(1,1) PRIMARY KEY,
    BillingRecID      VARCHAR(50)     NULL,
    AccountNum        VARCHAR(20)     NOT NULL,
    Type              VARCHAR(20)     NULL DEFAULT 'MONTHLY',
    IncomingCCFOverride DECIMAL(18,4) NULL,
    SewerChargeOverride DECIMAL(18,2) NULL,
    ReadingDate       DATE            NULL,
    BillingDate       DATE            NOT NULL,
    ActualLoss        DECIMAL(18,4)   NULL DEFAULT 0,
    ActualBasis       DECIMAL(18,4)   NULL DEFAULT 0,
    ActualSewer       DECIMAL(18,4)   NULL DEFAULT 0,
    ActualCharge      DECIMAL(18,2)   NULL DEFAULT 0,
    Difference        DECIMAL(18,2)   NULL DEFAULT 0,
    UseMoney          DECIMAL(18,2)   NULL DEFAULT 0,
    UseBasis          DECIMAL(18,4)   NULL DEFAULT 0,
    EntryDate         DATETIME2       NOT NULL DEFAULT GETDATE(),
    IsAssessed        BIT             NOT NULL DEFAULT 0,
    AssessmentDate    DATETIME2       NULL,
    CONSTRAINT FK_BillingAssessments_Accounts FOREIGN KEY (AccountNum) REFERENCES frs.Accounts(AccountNum)
  );
  CREATE INDEX IX_BillingAssessments_AccountNum ON frs.BillingAssessments(AccountNum);
  CREATE INDEX IX_BillingAssessments_BillingDate ON frs.BillingAssessments(BillingDate);
  CREATE INDEX IX_BillingAssessments_IsAssessed ON frs.BillingAssessments(IsAssessed);
END
GO

-- ============================================================================
-- TABLE: frs.ProgramCtrl
-- Origin: CS_FRS_PROGRAM_CTRL
-- Stores rate tiers, configuration values, and lookup lists
-- CtrlType: CR = Core Rate, LI = List Item, CFG = Configuration
-- ============================================================================
IF OBJECT_ID('frs.ProgramCtrl', 'U') IS NULL
BEGIN
  CREATE TABLE frs.ProgramCtrl (
    CtrlID            INT IDENTITY(1,1) PRIMARY KEY,
    CtrlType          VARCHAR(10)     NOT NULL DEFAULT 'CR', -- CR, LI, CFG
    CtrlKey           VARCHAR(50)     NOT NULL,
    CtrlValue         VARCHAR(200)    NULL,
    EffectiveDate     DATE            NOT NULL,
    DisplayValue      VARCHAR(200)    NULL,
    CONSTRAINT CK_ProgramCtrl_CtrlType CHECK (CtrlType IN ('CR','LI','CFG'))
  );
  CREATE INDEX IX_ProgramCtrl_CtrlKey ON frs.ProgramCtrl(CtrlKey);
  CREATE INDEX IX_ProgramCtrl_EffectiveDate ON frs.ProgramCtrl(EffectiveDate);
  CREATE INDEX IX_ProgramCtrl_Type_Key ON frs.ProgramCtrl(CtrlType, CtrlKey);
END
GO

-- ============================================================================
-- TABLE: frs.Sites
-- ============================================================================
IF OBJECT_ID('frs.Sites', 'U') IS NULL
BEGIN
  CREATE TABLE frs.Sites (
    SiteID            INT IDENTITY(1,1) PRIMARY KEY,
    AccountNum        VARCHAR(20)     NOT NULL,
    Description       VARCHAR(200)    NULL,
    Address           VARCHAR(200)    NULL,
    City              VARCHAR(50)     NULL,
    Zip               VARCHAR(10)     NULL,
    ContactName       VARCHAR(100)    NULL,
    CONSTRAINT FK_Sites_Accounts FOREIGN KEY (AccountNum) REFERENCES frs.Accounts(AccountNum)
  );
  CREATE INDEX IX_Sites_AccountNum ON frs.Sites(AccountNum);
END
GO

-- ============================================================================
-- TABLE: frs.ACL
-- Access Control List for FRS application
-- AccessLevel: 0=None, 1=ReadOnly, 2=User, 3=Admin
-- ============================================================================
IF OBJECT_ID('frs.ACL', 'U') IS NULL
BEGIN
  CREATE TABLE frs.ACL (
    ACLID             INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeID        VARCHAR(20)     NOT NULL,
    AccessLevel       INT             NOT NULL DEFAULT 0,
    CONSTRAINT CK_ACL_AccessLevel CHECK (AccessLevel IN (0,1,2,3))
  );
  CREATE UNIQUE INDEX IX_ACL_EmployeeID ON frs.ACL(EmployeeID);
END
GO

-- ============================================================================
-- TABLE: frs.AuditLog
-- ============================================================================
IF OBJECT_ID('frs.AuditLog', 'U') IS NULL
BEGIN
  CREATE TABLE frs.AuditLog (
    LogID             INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeID        VARCHAR(20)     NULL,
    Timestamp         DATETIME2       NOT NULL DEFAULT GETDATE(),
    AppID             VARCHAR(20)     NULL DEFAULT 'FRS',
    Message           NVARCHAR(MAX)   NULL,
    Level             VARCHAR(10)     NULL DEFAULT 'INFO',
    AccountNum        VARCHAR(20)     NULL
  );
  CREATE INDEX IX_AuditLog_EmployeeID ON frs.AuditLog(EmployeeID);
  CREATE INDEX IX_AuditLog_AccountNum ON frs.AuditLog(AccountNum);
  CREATE INDEX IX_AuditLog_Timestamp ON frs.AuditLog(Timestamp);
END
GO

-- ============================================================================
-- TABLE: frs.Memos
-- ============================================================================
IF OBJECT_ID('frs.Memos', 'U') IS NULL
BEGIN
  CREATE TABLE frs.Memos (
    MemoID            INT IDENTITY(1,1) PRIMARY KEY,
    AppID             VARCHAR(20)     NULL DEFAULT 'FRS',
    RecordID          VARCHAR(50)     NULL,
    Tag               VARCHAR(50)     NULL,
    Author            VARCHAR(100)    NULL,
    MemoText          NVARCHAR(MAX)   NULL,
    MemoDate          DATETIME2       NOT NULL DEFAULT GETDATE()
  );
  CREATE INDEX IX_Memos_RecordID ON frs.Memos(RecordID);
  CREATE INDEX IX_Memos_Tag ON frs.Memos(Tag);
END
GO

-- ============================================================================
-- TABLE: frs.EventLog
-- Event sourcing log for the event bus
-- ============================================================================
IF OBJECT_ID('frs.EventLog', 'U') IS NULL
BEGIN
  CREATE TABLE frs.EventLog (
    EventID           UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    EventType         VARCHAR(100)    NOT NULL,
    EventData         NVARCHAR(MAX)   NULL,
    UserID            VARCHAR(50)     NULL,
    EventTimestamp    DATETIME2       NOT NULL DEFAULT GETDATE()
  );
  CREATE INDEX IX_EventLog_EventType ON frs.EventLog(EventType);
  CREATE INDEX IX_EventLog_UserID ON frs.EventLog(UserID);
  CREATE INDEX IX_EventLog_Timestamp ON frs.EventLog(EventTimestamp);
END
GO


-- ============================================================================
-- SEED DATA
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Seed: Rate Tiers (FRS_BILL_RATE_TIERS) - gallon thresholds
-- These define the volume breakpoints for tiered billing
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM frs.ProgramCtrl WHERE CtrlKey = 'FRS_BILL_RATE_TIERS_1')
BEGIN
  INSERT INTO frs.ProgramCtrl (CtrlType, CtrlKey, CtrlValue, EffectiveDate, DisplayValue) VALUES
    ('CR', 'FRS_BILL_RATE_TIERS_1', '0',       '2024-01-01', 'Tier 1 Threshold (gal)'),
    ('CR', 'FRS_BILL_RATE_TIERS_2', '2244',    '2024-01-01', 'Tier 2 Threshold (gal)'),
    ('CR', 'FRS_BILL_RATE_TIERS_3', '3740',    '2024-01-01', 'Tier 3 Threshold (gal)'),
    ('CR', 'FRS_BILL_RATE_TIERS_4', '5610',    '2024-01-01', 'Tier 4 Threshold (gal)'),
    ('CR', 'FRS_BILL_RATE_TIERS_5', '9350',    '2024-01-01', 'Tier 5 Threshold (gal)');
END
GO

-- ----------------------------------------------------------------------------
-- Seed: ICL Tier Rates (inside city limits) - cost per gallon
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM frs.ProgramCtrl WHERE CtrlKey = 'FRS_BILL_RATE_ICL_T1')
BEGIN
  INSERT INTO frs.ProgramCtrl (CtrlType, CtrlKey, CtrlValue, EffectiveDate, DisplayValue) VALUES
    ('CR', 'FRS_BILL_RATE_ICL_T1', '0.007746',  '2024-01-01', 'ICL Tier 1 Rate ($/gal)'),
    ('CR', 'FRS_BILL_RATE_ICL_T2', '0.009032',  '2024-01-01', 'ICL Tier 2 Rate ($/gal)'),
    ('CR', 'FRS_BILL_RATE_ICL_T3', '0.011604',  '2024-01-01', 'ICL Tier 3 Rate ($/gal)'),
    ('CR', 'FRS_BILL_RATE_ICL_T4', '0.015462',  '2024-01-01', 'ICL Tier 4 Rate ($/gal)'),
    ('CR', 'FRS_BILL_RATE_ICL_T5', '0.019322',  '2024-01-01', 'ICL Tier 5 Rate ($/gal)');
END
GO

-- ----------------------------------------------------------------------------
-- Seed: OCL Tier Rates (outside city limits) - cost per gallon
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM frs.ProgramCtrl WHERE CtrlKey = 'FRS_BILL_RATE_OCL_T1')
BEGIN
  INSERT INTO frs.ProgramCtrl (CtrlType, CtrlKey, CtrlValue, EffectiveDate, DisplayValue) VALUES
    ('CR', 'FRS_BILL_RATE_OCL_T1', '0.011619',  '2024-01-01', 'OCL Tier 1 Rate ($/gal)'),
    ('CR', 'FRS_BILL_RATE_OCL_T2', '0.013548',  '2024-01-01', 'OCL Tier 2 Rate ($/gal)'),
    ('CR', 'FRS_BILL_RATE_OCL_T3', '0.017406',  '2024-01-01', 'OCL Tier 3 Rate ($/gal)'),
    ('CR', 'FRS_BILL_RATE_OCL_T4', '0.023193',  '2024-01-01', 'OCL Tier 4 Rate ($/gal)'),
    ('CR', 'FRS_BILL_RATE_OCL_T5', '0.028983',  '2024-01-01', 'OCL Tier 5 Rate ($/gal)');
END
GO

-- ----------------------------------------------------------------------------
-- Seed: Availability Charges ICL (FRS_SWR_AVAIL_IOCLI) - by meter size
-- Monthly minimum / service charge for inside city limits
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM frs.ProgramCtrl WHERE CtrlKey = 'FRS_SWR_AVAIL_IOCLI_5_8')
BEGIN
  INSERT INTO frs.ProgramCtrl (CtrlType, CtrlKey, CtrlValue, EffectiveDate, DisplayValue) VALUES
    ('CR', 'FRS_SWR_AVAIL_IOCLI_5_8',  '8.94',    '2024-01-01', '5/8" ICL Availability'),
    ('CR', 'FRS_SWR_AVAIL_IOCLI_3_4',  '13.41',   '2024-01-01', '3/4" ICL Availability'),
    ('CR', 'FRS_SWR_AVAIL_IOCLI_1',    '22.35',   '2024-01-01', '1" ICL Availability'),
    ('CR', 'FRS_SWR_AVAIL_IOCLI_1_5',  '44.70',   '2024-01-01', '1-1/2" ICL Availability'),
    ('CR', 'FRS_SWR_AVAIL_IOCLI_2',    '71.52',   '2024-01-01', '2" ICL Availability'),
    ('CR', 'FRS_SWR_AVAIL_IOCLI_3',    '134.10',  '2024-01-01', '3" ICL Availability'),
    ('CR', 'FRS_SWR_AVAIL_IOCLI_4',    '223.50',  '2024-01-01', '4" ICL Availability'),
    ('CR', 'FRS_SWR_AVAIL_IOCLI_6',    '447.00',  '2024-01-01', '6" ICL Availability'),
    ('CR', 'FRS_SWR_AVAIL_IOCLI_8',    '715.20',  '2024-01-01', '8" ICL Availability');
END
GO

-- ----------------------------------------------------------------------------
-- Seed: Availability Charges OCL (FRS_SWR_AVAIL_IOCLO) - by meter size
-- Monthly minimum / service charge for outside city limits
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM frs.ProgramCtrl WHERE CtrlKey = 'FRS_SWR_AVAIL_IOCLO_5_8')
BEGIN
  INSERT INTO frs.ProgramCtrl (CtrlType, CtrlKey, CtrlValue, EffectiveDate, DisplayValue) VALUES
    ('CR', 'FRS_SWR_AVAIL_IOCLO_5_8',  '13.41',   '2024-01-01', '5/8" OCL Availability'),
    ('CR', 'FRS_SWR_AVAIL_IOCLO_3_4',  '20.12',   '2024-01-01', '3/4" OCL Availability'),
    ('CR', 'FRS_SWR_AVAIL_IOCLO_1',    '33.53',   '2024-01-01', '1" OCL Availability'),
    ('CR', 'FRS_SWR_AVAIL_IOCLO_1_5',  '67.05',   '2024-01-01', '1-1/2" OCL Availability'),
    ('CR', 'FRS_SWR_AVAIL_IOCLO_2',    '107.28',  '2024-01-01', '2" OCL Availability'),
    ('CR', 'FRS_SWR_AVAIL_IOCLO_3',    '201.15',  '2024-01-01', '3" OCL Availability'),
    ('CR', 'FRS_SWR_AVAIL_IOCLO_4',    '335.25',  '2024-01-01', '4" OCL Availability'),
    ('CR', 'FRS_SWR_AVAIL_IOCLO_6',    '670.50',  '2024-01-01', '6" OCL Availability'),
    ('CR', 'FRS_SWR_AVAIL_IOCLO_8',    '1072.80', '2024-01-01', '8" OCL Availability');
END
GO

-- ----------------------------------------------------------------------------
-- Seed: Test Accounts
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM frs.Accounts WHERE AccountNum = 'FRS-TEST-001')
BEGIN
  INSERT INTO frs.Accounts (AccountNum, FacilityDesc, MeterSize, Method, Basis, BOD_PCT, TDD_PCT, StartDate, AssessmentFreq, InspectionFreq, BillingMethodType, CreatedBy, Status)
  VALUES
    ('FRS-TEST-001', 'Acme Industrial Cooling Tower',   '2',  'METERED', 'VOLUME', 15.00, 5.00, '2023-01-01', 12, 12, 'STANDARD', 'SYSTEM', 'Active'),
    ('FRS-TEST-002', 'Riverside Laundry Services',       '1',  'METERED', 'VOLUME', 0.00,  0.00, '2023-06-15', 12, 12, 'STANDARD', 'SYSTEM', 'Active'),
    ('FRS-TEST-003', 'Central Hospital Complex',         '4',  'METERED', 'VOLUME', 25.00, 10.00,'2022-03-01', 6,  12, 'STANDARD', 'SYSTEM', 'Active'),
    ('FRS-TEST-004', 'Westside Car Wash',                '1_5','FLAT',    'FLAT',   0.00,  0.00, '2024-01-01', 12, 12, 'FLAT',     'SYSTEM', 'Active'),
    ('FRS-TEST-005', 'Downtown Office Tower (Inactive)', '3',  'METERED', 'VOLUME', 5.00,  2.00, '2020-01-01', 12, 12, 'STANDARD', 'SYSTEM', 'Inactive');
END
GO

-- ----------------------------------------------------------------------------
-- Seed: Test Contacts
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM frs.Contacts WHERE AccountNum = 'FRS-TEST-001')
BEGIN
  INSERT INTO frs.Contacts (AccountNum, BusinessName, ContactName, Address, City, State, Zip, Phone, Email, IsActive)
  VALUES
    ('FRS-TEST-001', 'Acme Industrial LLC',       'Robert Chen',    '1200 Industrial Blvd',    'San Antonio', 'TX', '78201', '210-555-0101', 'rchen@acme-ind.com',       1),
    ('FRS-TEST-002', 'Riverside Laundry Services', 'Maria Gonzalez', '456 River Walk Ave',      'San Antonio', 'TX', '78204', '210-555-0202', 'mgonzalez@riversidelaundry.com', 1),
    ('FRS-TEST-003', 'Central Hospital Complex',   'Dr. James Park', '800 Medical Center Dr',   'San Antonio', 'TX', '78229', '210-555-0303', 'jpark@centralhospital.org', 1),
    ('FRS-TEST-004', 'Westside Car Wash Inc',      'Tom Bradley',    '3100 W Commerce St',      'San Antonio', 'TX', '78207', '210-555-0404', 'tbradley@westsidewash.com', 1),
    ('FRS-TEST-005', 'Downtown Properties LLC',    'Susan Miller',   '100 E Houston St Ste 400','San Antonio', 'TX', '78205', '210-555-0505', 'smiller@dtproperties.com',  1);
END
GO

-- ----------------------------------------------------------------------------
-- Seed: Test Meters
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM frs.Meters WHERE AccountNum = 'FRS-TEST-001')
BEGIN
  INSERT INTO frs.Meters (AccountNum, Serial, MeterSize, FunctionType, UOM, MaxReading, IsActive)
  VALUES
    -- Acme Industrial: incoming water + blowdown + makeup meters
    ('FRS-TEST-001', 'SN-ACM-001', '2', 'INCOMING',  'GAL', 9999999, 1),
    ('FRS-TEST-001', 'SN-ACM-002', '2', 'BLOWDOWN',  'GAL', 9999999, 1),
    ('FRS-TEST-001', 'SN-ACM-003', '1', 'MAKEUP',    'GAL', 999999,  1),
    -- Riverside Laundry: single sewer meter
    ('FRS-TEST-002', 'SN-RLS-001', '1', 'SEWER',     'GAL', 9999999, 1),
    -- Central Hospital: incoming + sewer + loss
    ('FRS-TEST-003', 'SN-CHP-001', '4', 'INCOMING',  'GAL', 9999999, 1),
    ('FRS-TEST-003', 'SN-CHP-002', '4', 'SEWER',     'GAL', 9999999, 1),
    ('FRS-TEST-003', 'SN-CHP-003', '2', 'LOSS',      'CCF', 99999,   1),
    -- Car Wash: single incoming meter
    ('FRS-TEST-004', 'SN-WCW-001', '1_5','INCOMING',  'GAL', 9999999, 1);
END
GO

-- ----------------------------------------------------------------------------
-- Seed: Test Meter Readings (last few months for FRS-TEST-001 incoming)
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM frs.MeterReadings WHERE AccountNum = 'FRS-TEST-001')
BEGIN
  INSERT INTO frs.MeterReadings (AccountNum, Serial, ReadingDate, ReadingValue, Consumption, IncomingCCF, EntryDate)
  VALUES
    ('FRS-TEST-001', 'SN-ACM-001', '2025-10-01', 1000000,  0,       0,       '2025-10-02'),
    ('FRS-TEST-001', 'SN-ACM-001', '2025-11-01', 1245000,  245000,  327.50,  '2025-11-02'),
    ('FRS-TEST-001', 'SN-ACM-001', '2025-12-01', 1478000,  233000,  311.46,  '2025-12-02'),
    ('FRS-TEST-001', 'SN-ACM-001', '2026-01-01', 1690000,  212000,  283.38,  '2026-01-02'),
    ('FRS-TEST-001', 'SN-ACM-001', '2026-02-01', 1925000,  235000,  314.14,  '2026-02-02'),
    ('FRS-TEST-001', 'SN-ACM-001', '2026-03-01', 2180000,  255000,  340.89,  '2026-03-02');
END
GO

-- ----------------------------------------------------------------------------
-- Seed: Test Sites
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM frs.Sites WHERE AccountNum = 'FRS-TEST-001')
BEGIN
  INSERT INTO frs.Sites (AccountNum, Description, Address, City, Zip, ContactName)
  VALUES
    ('FRS-TEST-001', 'Main Cooling Tower Facility', '1200 Industrial Blvd', 'San Antonio', '78201', 'Robert Chen'),
    ('FRS-TEST-001', 'Warehouse & Storage',         '1204 Industrial Blvd', 'San Antonio', '78201', 'Robert Chen'),
    ('FRS-TEST-003', 'Main Hospital Building',      '800 Medical Center Dr','San Antonio', '78229', 'Dr. James Park'),
    ('FRS-TEST-003', 'Medical Research Wing',        '802 Medical Center Dr','San Antonio', '78229', 'Dr. James Park');
END
GO

-- ----------------------------------------------------------------------------
-- Seed: ACL entries for mock users
-- AccessLevel: 0=None, 1=ReadOnly, 2=User, 3=Admin
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM frs.ACL WHERE EmployeeID = '9900001')
BEGIN
  INSERT INTO frs.ACL (EmployeeID, AccessLevel)
  VALUES
    ('9900001', 3),  -- admin@saws.org = Admin
    ('9900002', 2),  -- user@saws.org = User
    ('9900003', 1);  -- readonly@saws.org = ReadOnly
END
GO

-- ----------------------------------------------------------------------------
-- Seed: Sample Billing Assessments
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM frs.BillingAssessments WHERE AccountNum = 'FRS-TEST-001')
BEGIN
  INSERT INTO frs.BillingAssessments (AccountNum, Type, ReadingDate, BillingDate, ActualLoss, ActualBasis, ActualSewer, ActualCharge, Difference, UseMoney, UseBasis, IsAssessed, AssessmentDate)
  VALUES
    ('FRS-TEST-001', 'MONTHLY', '2025-11-01', '2025-11-15', 49.12,  278.38, 278.38, 45.50, 0, 45.50, 278.38, 1, '2025-11-20'),
    ('FRS-TEST-001', 'MONTHLY', '2025-12-01', '2025-12-15', 46.72,  264.74, 264.74, 43.20, 0, 43.20, 264.74, 1, '2025-12-20'),
    ('FRS-TEST-001', 'MONTHLY', '2026-01-01', '2026-01-15', 42.51,  240.87, 240.87, 39.80, 0, 39.80, 240.87, 0, NULL),
    ('FRS-TEST-001', 'MONTHLY', '2026-02-01', '2026-02-15', 47.12,  267.02, 267.02, 43.60, 0, 43.60, 267.02, 0, NULL);
END
GO

-- ============================================================================
-- Verification: Print record counts
-- ============================================================================
SELECT 'frs.Accounts'          AS TableName, COUNT(*) AS RecordCount FROM frs.Accounts
UNION ALL
SELECT 'frs.Contacts',         COUNT(*) FROM frs.Contacts
UNION ALL
SELECT 'frs.Meters',           COUNT(*) FROM frs.Meters
UNION ALL
SELECT 'frs.MeterReadings',    COUNT(*) FROM frs.MeterReadings
UNION ALL
SELECT 'frs.BillingAssessments',COUNT(*) FROM frs.BillingAssessments
UNION ALL
SELECT 'frs.ProgramCtrl',      COUNT(*) FROM frs.ProgramCtrl
UNION ALL
SELECT 'frs.Sites',            COUNT(*) FROM frs.Sites
UNION ALL
SELECT 'frs.ACL',              COUNT(*) FROM frs.ACL
UNION ALL
SELECT 'frs.AuditLog',         COUNT(*) FROM frs.AuditLog
UNION ALL
SELECT 'frs.Memos',            COUNT(*) FROM frs.Memos
UNION ALL
SELECT 'frs.EventLog',         COUNT(*) FROM frs.EventLog;
GO
