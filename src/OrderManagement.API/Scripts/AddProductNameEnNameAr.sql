-- Run this script once on your database to add NameEn and NameAr columns to Products.
-- Execute in SQL Server Management Studio or: sqlcmd -S your_server -d your_database -i AddProductNameEnNameAr.sql

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Products') AND name = 'NameEn')
BEGIN
    ALTER TABLE Products ADD NameEn nvarchar(max) NOT NULL DEFAULT N'';
    ALTER TABLE Products ADD NameAr nvarchar(max) NOT NULL DEFAULT N'';
    -- Copy existing Name into NameEn for current rows
    UPDATE Products SET NameEn = ISNULL(Name, N''), NameAr = N'' WHERE 1=1;
END
GO
