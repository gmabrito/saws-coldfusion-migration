-- Water Resource Module - Database Schema
-- Schema: waterresource
-- BRD Reference: Section 7.1 - Display 30-day aquifer stats
-- Aquifer & Water Stats: water levels for 5 counties, daily precipitation,
-- daily temperatures, total pumpage. Data is manually updated.

-- Create schema if not exists
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'waterresource')
BEGIN
    EXEC('CREATE SCHEMA waterresource');
END
GO

-- BRD 7.1: Daily readings table for aquifer stats
-- Stores manually-entered daily water level readings, weather data, and pumpage
CREATE TABLE waterresource.DailyReadings (
    ReadingID INT IDENTITY(1,1) PRIMARY KEY,
    ReadingDate DATE NOT NULL,
    BexarLevel DECIMAL(10,2) NOT NULL,       -- Bexar County water level (ft MSL)
    MedinaLevel DECIMAL(10,2) NOT NULL,      -- Medina County water level (ft MSL)
    UvaldeLevel DECIMAL(10,2) NOT NULL,      -- Uvalde County water level (ft MSL)
    ComalLevel DECIMAL(10,2) NOT NULL,       -- Comal County water level (ft MSL)
    HaysLevel DECIMAL(10,2) NOT NULL,        -- Hays County water level (ft MSL)
    Precipitation DECIMAL(6,2) NOT NULL,     -- Daily precipitation (inches)
    TemperatureHigh DECIMAL(5,1) NOT NULL,   -- Daily high temperature (Fahrenheit)
    TemperatureLow DECIMAL(5,1) NOT NULL,    -- Daily low temperature (Fahrenheit)
    TotalPumpage DECIMAL(12,2) NOT NULL,     -- Total pumpage (acre-feet)
    EnteredByEmployeeID INT NOT NULL,        -- FK to dbo.Employees
    CreatedDate DATETIME NOT NULL DEFAULT GETDATE(),
    ModifiedDate DATETIME NULL,
    CONSTRAINT UQ_DailyReadings_Date UNIQUE (ReadingDate),
    CONSTRAINT FK_DailyReadings_Employee FOREIGN KEY (EnteredByEmployeeID)
        REFERENCES dbo.Employees(EmployeeID)
);
GO

-- Index for date range queries (BRD 7.1, 7.3)
CREATE INDEX IX_DailyReadings_ReadingDate
    ON waterresource.DailyReadings (ReadingDate DESC);
GO

-- =============================================
-- Stored Procedures
-- =============================================

-- BRD 7.1: Get 30-day summary statistics
CREATE OR ALTER PROCEDURE waterresource.usp_Get30DaySummary
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @EndDate DATE = GETDATE();
    DECLARE @StartDate DATE = DATEADD(DAY, -30, @EndDate);

    SELECT
        AVG(BexarLevel) AS AvgBexarLevel,
        AVG(MedinaLevel) AS AvgMedinaLevel,
        AVG(UvaldeLevel) AS AvgUvaldeLevel,
        AVG(ComalLevel) AS AvgComalLevel,
        AVG(HaysLevel) AS AvgHaysLevel,
        AVG(Precipitation) AS AvgPrecipitation,
        AVG(TemperatureHigh) AS AvgTemperatureHigh,
        AVG(TemperatureLow) AS AvgTemperatureLow,
        SUM(TotalPumpage) AS TotalPumpageSum,
        COUNT(*) AS ReadingCount,
        MAX(ReadingDate) AS LatestReadingDate,
        -- Latest reading values (from most recent date)
        (SELECT TOP 1 BexarLevel FROM waterresource.DailyReadings
         WHERE ReadingDate BETWEEN @StartDate AND @EndDate
         ORDER BY ReadingDate DESC) AS LatestBexarLevel,
        (SELECT TOP 1 Precipitation FROM waterresource.DailyReadings
         WHERE ReadingDate BETWEEN @StartDate AND @EndDate
         ORDER BY ReadingDate DESC) AS LatestPrecipitation,
        (SELECT TOP 1 TemperatureHigh FROM waterresource.DailyReadings
         WHERE ReadingDate BETWEEN @StartDate AND @EndDate
         ORDER BY ReadingDate DESC) AS LatestTemperatureHigh,
        (SELECT TOP 1 TemperatureLow FROM waterresource.DailyReadings
         WHERE ReadingDate BETWEEN @StartDate AND @EndDate
         ORDER BY ReadingDate DESC) AS LatestTemperatureLow,
        (SELECT TOP 1 TotalPumpage FROM waterresource.DailyReadings
         WHERE ReadingDate BETWEEN @StartDate AND @EndDate
         ORDER BY ReadingDate DESC) AS LatestTotalPumpage
    FROM waterresource.DailyReadings
    WHERE ReadingDate BETWEEN @StartDate AND @EndDate;
END
GO

-- BRD 7.1: Get daily readings with date range filter
CREATE OR ALTER PROCEDURE waterresource.usp_GetDailyReadings
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ReadingID,
        ReadingDate,
        BexarLevel,
        MedinaLevel,
        UvaldeLevel,
        ComalLevel,
        HaysLevel,
        Precipitation,
        TemperatureHigh,
        TemperatureLow,
        TotalPumpage,
        EnteredByEmployeeID,
        CreatedDate,
        ModifiedDate
    FROM waterresource.DailyReadings
    WHERE ReadingDate BETWEEN @StartDate AND @EndDate
    ORDER BY ReadingDate DESC;
END
GO

-- BRD 7.1: Get latest water levels by county with 30-day stats
CREATE OR ALTER PROCEDURE waterresource.usp_GetCountyWaterLevels
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @EndDate DATE = GETDATE();
    DECLARE @StartDate DATE = DATEADD(DAY, -30, @EndDate);

    -- Unpivot county levels and compute stats
    SELECT
        County,
        LatestLevel,
        AvgLevel,
        MinLevel,
        MaxLevel
    FROM (
        SELECT
            'Bexar' AS County,
            (SELECT TOP 1 BexarLevel FROM waterresource.DailyReadings
             WHERE ReadingDate BETWEEN @StartDate AND @EndDate
             ORDER BY ReadingDate DESC) AS LatestLevel,
            AVG(BexarLevel) AS AvgLevel,
            MIN(BexarLevel) AS MinLevel,
            MAX(BexarLevel) AS MaxLevel,
            1 AS SortOrder
        FROM waterresource.DailyReadings
        WHERE ReadingDate BETWEEN @StartDate AND @EndDate

        UNION ALL

        SELECT
            'Medina',
            (SELECT TOP 1 MedinaLevel FROM waterresource.DailyReadings
             WHERE ReadingDate BETWEEN @StartDate AND @EndDate
             ORDER BY ReadingDate DESC),
            AVG(MedinaLevel),
            MIN(MedinaLevel),
            MAX(MedinaLevel),
            2
        FROM waterresource.DailyReadings
        WHERE ReadingDate BETWEEN @StartDate AND @EndDate

        UNION ALL

        SELECT
            'Uvalde',
            (SELECT TOP 1 UvaldeLevel FROM waterresource.DailyReadings
             WHERE ReadingDate BETWEEN @StartDate AND @EndDate
             ORDER BY ReadingDate DESC),
            AVG(UvaldeLevel),
            MIN(UvaldeLevel),
            MAX(UvaldeLevel),
            3
        FROM waterresource.DailyReadings
        WHERE ReadingDate BETWEEN @StartDate AND @EndDate

        UNION ALL

        SELECT
            'Comal',
            (SELECT TOP 1 ComalLevel FROM waterresource.DailyReadings
             WHERE ReadingDate BETWEEN @StartDate AND @EndDate
             ORDER BY ReadingDate DESC),
            AVG(ComalLevel),
            MIN(ComalLevel),
            MAX(ComalLevel),
            4
        FROM waterresource.DailyReadings
        WHERE ReadingDate BETWEEN @StartDate AND @EndDate

        UNION ALL

        SELECT
            'Hays',
            (SELECT TOP 1 HaysLevel FROM waterresource.DailyReadings
             WHERE ReadingDate BETWEEN @StartDate AND @EndDate
             ORDER BY ReadingDate DESC),
            AVG(HaysLevel),
            MIN(HaysLevel),
            MAX(HaysLevel),
            5
        FROM waterresource.DailyReadings
        WHERE ReadingDate BETWEEN @StartDate AND @EndDate
    ) AS Counties
    ORDER BY SortOrder;
END
GO

-- BRD 7.1: Insert daily reading (manual data entry)
CREATE OR ALTER PROCEDURE waterresource.usp_InsertDailyReading
    @ReadingDate DATE,
    @BexarLevel DECIMAL(10,2),
    @MedinaLevel DECIMAL(10,2),
    @UvaldeLevel DECIMAL(10,2),
    @ComalLevel DECIMAL(10,2),
    @HaysLevel DECIMAL(10,2),
    @Precipitation DECIMAL(6,2),
    @TemperatureHigh DECIMAL(5,1),
    @TemperatureLow DECIMAL(5,1),
    @TotalPumpage DECIMAL(12,2),
    @EnteredByEmployeeID INT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO waterresource.DailyReadings (
        ReadingDate, BexarLevel, MedinaLevel, UvaldeLevel,
        ComalLevel, HaysLevel, Precipitation,
        TemperatureHigh, TemperatureLow, TotalPumpage,
        EnteredByEmployeeID
    )
    VALUES (
        @ReadingDate, @BexarLevel, @MedinaLevel, @UvaldeLevel,
        @ComalLevel, @HaysLevel, @Precipitation,
        @TemperatureHigh, @TemperatureLow, @TotalPumpage,
        @EnteredByEmployeeID
    );

    -- Return the inserted record
    SELECT
        ReadingID, ReadingDate, BexarLevel, MedinaLevel, UvaldeLevel,
        ComalLevel, HaysLevel, Precipitation,
        TemperatureHigh, TemperatureLow, TotalPumpage,
        EnteredByEmployeeID, CreatedDate
    FROM waterresource.DailyReadings
    WHERE ReadingID = SCOPE_IDENTITY();
END
GO

-- BRD 7.1: Update daily reading
CREATE OR ALTER PROCEDURE waterresource.usp_UpdateDailyReading
    @ReadingID INT,
    @ReadingDate DATE = NULL,
    @BexarLevel DECIMAL(10,2) = NULL,
    @MedinaLevel DECIMAL(10,2) = NULL,
    @UvaldeLevel DECIMAL(10,2) = NULL,
    @ComalLevel DECIMAL(10,2) = NULL,
    @HaysLevel DECIMAL(10,2) = NULL,
    @Precipitation DECIMAL(6,2) = NULL,
    @TemperatureHigh DECIMAL(5,1) = NULL,
    @TemperatureLow DECIMAL(5,1) = NULL,
    @TotalPumpage DECIMAL(12,2) = NULL,
    @EnteredByEmployeeID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE waterresource.DailyReadings
    SET
        ReadingDate = ISNULL(@ReadingDate, ReadingDate),
        BexarLevel = ISNULL(@BexarLevel, BexarLevel),
        MedinaLevel = ISNULL(@MedinaLevel, MedinaLevel),
        UvaldeLevel = ISNULL(@UvaldeLevel, UvaldeLevel),
        ComalLevel = ISNULL(@ComalLevel, ComalLevel),
        HaysLevel = ISNULL(@HaysLevel, HaysLevel),
        Precipitation = ISNULL(@Precipitation, Precipitation),
        TemperatureHigh = ISNULL(@TemperatureHigh, TemperatureHigh),
        TemperatureLow = ISNULL(@TemperatureLow, TemperatureLow),
        TotalPumpage = ISNULL(@TotalPumpage, TotalPumpage),
        ModifiedDate = GETDATE()
    WHERE ReadingID = @ReadingID;

    -- Return the updated record
    SELECT
        ReadingID, ReadingDate, BexarLevel, MedinaLevel, UvaldeLevel,
        ComalLevel, HaysLevel, Precipitation,
        TemperatureHigh, TemperatureLow, TotalPumpage,
        EnteredByEmployeeID, CreatedDate, ModifiedDate
    FROM waterresource.DailyReadings
    WHERE ReadingID = @ReadingID;
END
GO
