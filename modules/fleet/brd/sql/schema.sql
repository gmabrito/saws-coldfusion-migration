-- Fleet Vehicle Management Schema
-- Basic CRUD for vehicles and maintenance logs

-- Create schema if not exists
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'fleet')
BEGIN
    EXEC('CREATE SCHEMA fleet');
END
GO

-- Fleet vehicles table
CREATE TABLE fleet.Vehicles (
    VehicleID           INT IDENTITY(1,1) PRIMARY KEY,
    VehicleNumber       NVARCHAR(50) NOT NULL,
    Make                NVARCHAR(50) NOT NULL,
    Model               NVARCHAR(50) NOT NULL,
    Year                INT NOT NULL,
    VIN                 NVARCHAR(17) NULL,
    DepartmentID        INT NULL,
    Status              NVARCHAR(20) NOT NULL DEFAULT 'Active'
                        CHECK (Status IN ('Active', 'Maintenance', 'Retired')),
    Mileage             INT NOT NULL DEFAULT 0,
    AssignedEmployeeID  INT NULL,
    CreatedDate         DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Vehicles_Departments FOREIGN KEY (DepartmentID)
        REFERENCES dbo.Departments(DepartmentID),
    CONSTRAINT FK_Vehicles_Employees FOREIGN KEY (AssignedEmployeeID)
        REFERENCES dbo.Employees(EmployeeID)
);
GO

-- Fleet maintenance log
CREATE TABLE fleet.MaintenanceLog (
    LogID               INT IDENTITY(1,1) PRIMARY KEY,
    VehicleID           INT NOT NULL,
    MaintenanceDate     DATE NOT NULL,
    MaintenanceType     NVARCHAR(100) NOT NULL,
    Description         NVARCHAR(500) NOT NULL,
    Cost                DECIMAL(10,2) NOT NULL DEFAULT 0,
    Mileage             INT NOT NULL DEFAULT 0,
    PerformedBy         NVARCHAR(100) NULL,
    CreatedDate         DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_MaintenanceLog_Vehicles FOREIGN KEY (VehicleID)
        REFERENCES fleet.Vehicles(VehicleID)
);
GO

-- Indexes for performance
CREATE INDEX IX_Vehicles_Status ON fleet.Vehicles(Status);
CREATE INDEX IX_Vehicles_DepartmentID ON fleet.Vehicles(DepartmentID);
CREATE INDEX IX_Vehicles_VehicleNumber ON fleet.Vehicles(VehicleNumber);
CREATE INDEX IX_MaintenanceLog_VehicleID ON fleet.MaintenanceLog(VehicleID);
CREATE INDEX IX_MaintenanceLog_MaintenanceDate ON fleet.MaintenanceLog(MaintenanceDate);
GO

-- Stored procedures
CREATE OR ALTER PROCEDURE fleet.usp_GetVehicles
    @Status NVARCHAR(20) = NULL,
    @DepartmentID INT = NULL,
    @Search NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT v.VehicleID, v.VehicleNumber, v.Make, v.Model, v.Year, v.VIN,
           v.DepartmentID, v.Status, v.Mileage, v.AssignedEmployeeID, v.CreatedDate,
           d.DepartmentName,
           e.FirstName + ' ' + e.LastName AS AssignedEmployee
    FROM fleet.Vehicles v
    LEFT JOIN dbo.Departments d ON v.DepartmentID = d.DepartmentID
    LEFT JOIN dbo.Employees e ON v.AssignedEmployeeID = e.EmployeeID
    WHERE (@Status IS NULL OR v.Status = @Status)
      AND (@DepartmentID IS NULL OR v.DepartmentID = @DepartmentID)
      AND (@Search IS NULL OR v.VehicleNumber LIKE '%' + @Search + '%'
           OR v.Make LIKE '%' + @Search + '%'
           OR v.Model LIKE '%' + @Search + '%')
    ORDER BY v.VehicleNumber;
END
GO

CREATE OR ALTER PROCEDURE fleet.usp_GetVehicleById
    @VehicleID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT v.VehicleID, v.VehicleNumber, v.Make, v.Model, v.Year, v.VIN,
           v.DepartmentID, v.Status, v.Mileage, v.AssignedEmployeeID, v.CreatedDate,
           d.DepartmentName,
           e.FirstName + ' ' + e.LastName AS AssignedEmployee
    FROM fleet.Vehicles v
    LEFT JOIN dbo.Departments d ON v.DepartmentID = d.DepartmentID
    LEFT JOIN dbo.Employees e ON v.AssignedEmployeeID = e.EmployeeID
    WHERE v.VehicleID = @VehicleID;

    SELECT LogID, VehicleID, MaintenanceDate, MaintenanceType, Description, Cost, Mileage, PerformedBy, CreatedDate
    FROM fleet.MaintenanceLog
    WHERE VehicleID = @VehicleID
    ORDER BY MaintenanceDate DESC;
END
GO

CREATE OR ALTER PROCEDURE fleet.usp_InsertVehicle
    @VehicleNumber NVARCHAR(50),
    @Make NVARCHAR(50),
    @Model NVARCHAR(50),
    @Year INT,
    @VIN NVARCHAR(17) = NULL,
    @DepartmentID INT = NULL,
    @Status NVARCHAR(20) = 'Active',
    @Mileage INT = 0,
    @AssignedEmployeeID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO fleet.Vehicles (VehicleNumber, Make, Model, Year, VIN, DepartmentID, Status, Mileage, AssignedEmployeeID, CreatedDate)
    OUTPUT INSERTED.VehicleID
    VALUES (@VehicleNumber, @Make, @Model, @Year, @VIN, @DepartmentID, @Status, @Mileage, @AssignedEmployeeID, GETDATE());
END
GO

CREATE OR ALTER PROCEDURE fleet.usp_InsertMaintenanceLog
    @VehicleID INT,
    @MaintenanceDate DATE,
    @MaintenanceType NVARCHAR(100),
    @Description NVARCHAR(500),
    @Cost DECIMAL(10,2),
    @Mileage INT,
    @PerformedBy NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO fleet.MaintenanceLog (VehicleID, MaintenanceDate, MaintenanceType, Description, Cost, Mileage, PerformedBy, CreatedDate)
    OUTPUT INSERTED.LogID
    VALUES (@VehicleID, @MaintenanceDate, @MaintenanceType, @Description, @Cost, @Mileage, @PerformedBy, GETDATE());

    -- Update vehicle mileage if higher
    UPDATE fleet.Vehicles SET Mileage = @Mileage WHERE VehicleID = @VehicleID AND Mileage < @Mileage;
END
GO
