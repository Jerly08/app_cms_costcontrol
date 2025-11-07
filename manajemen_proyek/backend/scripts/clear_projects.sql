-- Clear all project-related data
-- Run this in MySQL to clean up the database

-- Delete progress breakdowns first (foreign key dependency)
DELETE FROM progress_breakdowns;

-- Delete daily reports and related data
DELETE FROM daily_report_photos;
DELETE FROM daily_reports;

-- Delete weekly reports
DELETE FROM weekly_reports;

-- Delete material usage
DELETE FROM material_usages;

-- Delete BOM items and BOMs
DELETE FROM bom_items;
DELETE FROM boms;

-- Delete purchase request items and purchase requests
DELETE FROM purchase_request_items;
DELETE FROM purchase_request_comments;
DELETE FROM purchase_requests;

-- Finally delete all projects
DELETE FROM projects;

-- Reset auto increment if needed
-- ALTER TABLE projects AUTO_INCREMENT = 1;
-- ALTER TABLE progress_breakdowns AUTO_INCREMENT = 1;

SELECT 'All project data has been cleared!' as message;

