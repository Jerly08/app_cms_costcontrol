-- =====================================================
-- CLEAN ALL DUMMY DATA FROM DATABASE
-- =====================================================
-- Description: This script removes all dummy/sample data from the database
-- Warning: This will delete all existing data in the tables
-- Use with caution! Make sure to backup your database first.
-- =====================================================

-- Start transaction
BEGIN;

-- =====================================================
-- DISABLE TRIGGERS TEMPORARILY
-- =====================================================
-- This prevents trigger errors during deletion
SET session_replication_role = 'replica';

-- =====================================================
-- DELETE DATA IN CORRECT ORDER (respecting foreign keys)
-- =====================================================

-- 1. Delete Material Usage (depends on: projects, materials, daily_reports, users)
TRUNCATE TABLE material_usage CASCADE;
RESET SEQUENCE IF EXISTS material_usage_id_seq;

-- 2. Delete BOM (depends on: projects, materials)
TRUNCATE TABLE bom CASCADE;
RESET SEQUENCE IF EXISTS bom_id_seq;

-- 3. Delete Daily Report Photos (depends on: daily_reports)
TRUNCATE TABLE daily_report_photos CASCADE;
RESET SEQUENCE IF EXISTS daily_report_photos_id_seq;

-- 4. Delete Daily Reports (depends on: projects)
TRUNCATE TABLE daily_reports CASCADE;
RESET SEQUENCE IF EXISTS daily_reports_id_seq;

-- 5. Delete Weekly Reports (depends on: projects)
TRUNCATE TABLE weekly_reports CASCADE;
RESET SEQUENCE IF EXISTS weekly_reports_id_seq;

-- 6. Delete Purchase Request Items (depends on: purchase_requests, materials)
TRUNCATE TABLE purchase_request_items CASCADE;
RESET SEQUENCE IF EXISTS purchase_request_items_id_seq;

-- 7. Delete Purchase Requests (depends on: projects, users)
TRUNCATE TABLE purchase_requests CASCADE;
RESET SEQUENCE IF EXISTS purchase_requests_id_seq;

-- 8. Delete Approvals (depends on: projects, users)
TRUNCATE TABLE approvals CASCADE;
RESET SEQUENCE IF EXISTS approvals_id_seq;

-- 9. Delete Notifications (depends on: users)
TRUNCATE TABLE notifications CASCADE;
RESET SEQUENCE IF EXISTS notifications_id_seq;

-- 10. Delete Project Assignments (depends on: projects, users)
TRUNCATE TABLE project_assignments CASCADE;
RESET SEQUENCE IF EXISTS project_assignments_id_seq;

-- 11. Delete Materials
TRUNCATE TABLE materials CASCADE;
RESET SEQUENCE IF EXISTS materials_id_seq;

-- 12. Delete Projects
TRUNCATE TABLE projects CASCADE;
RESET SEQUENCE IF EXISTS projects_id_seq;

-- 13. Delete Users (keep admin user if needed)
-- Option A: Delete all users
TRUNCATE TABLE users CASCADE;
RESET SEQUENCE IF EXISTS users_id_seq;

-- Option B: Keep admin user only (uncomment this and comment Option A above)
-- DELETE FROM users WHERE username != 'admin';
-- SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- =====================================================
-- RE-ENABLE TRIGGERS
-- =====================================================
SET session_replication_role = 'origin';

-- =====================================================
-- RESET ALL SEQUENCES TO START FROM 1
-- =====================================================

-- Reset all sequences to 1
SELECT setval('users_id_seq', 1, false);
SELECT setval('projects_id_seq', 1, false);
SELECT setval('materials_id_seq', 1, false);
SELECT setval('daily_reports_id_seq', 1, false);
SELECT setval('weekly_reports_id_seq', 1, false);
SELECT setval('bom_id_seq', 1, false);
SELECT setval('material_usage_id_seq', 1, false);
SELECT setval('purchase_requests_id_seq', 1, false);
SELECT setval('purchase_request_items_id_seq', 1, false);
SELECT setval('approvals_id_seq', 1, false);
SELECT setval('notifications_id_seq', 1, false);
SELECT setval('project_assignments_id_seq', 1, false);
SELECT setval('daily_report_photos_id_seq', 1, false);

-- =====================================================
-- VACUUM TABLES (reclaim storage)
-- =====================================================

VACUUM ANALYZE users;
VACUUM ANALYZE projects;
VACUUM ANALYZE materials;
VACUUM ANALYZE daily_reports;
VACUUM ANALYZE weekly_reports;
VACUUM ANALYZE bom;
VACUUM ANALYZE material_usage;
VACUUM ANALYZE purchase_requests;
VACUUM ANALYZE purchase_request_items;
VACUUM ANALYZE approvals;
VACUUM ANALYZE notifications;
VACUUM ANALYZE project_assignments;
VACUUM ANALYZE daily_report_photos;

-- =====================================================
-- VERIFY DELETION
-- =====================================================

-- Show table counts after deletion
SELECT 
    'users' as table_name, 
    COUNT(*) as row_count 
FROM users
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'materials', COUNT(*) FROM materials
UNION ALL
SELECT 'daily_reports', COUNT(*) FROM daily_reports
UNION ALL
SELECT 'weekly_reports', COUNT(*) FROM weekly_reports
UNION ALL
SELECT 'bom', COUNT(*) FROM bom
UNION ALL
SELECT 'material_usage', COUNT(*) FROM material_usage
UNION ALL
SELECT 'purchase_requests', COUNT(*) FROM purchase_requests
UNION ALL
SELECT 'purchase_request_items', COUNT(*) FROM purchase_request_items
UNION ALL
SELECT 'approvals', COUNT(*) FROM approvals
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'project_assignments', COUNT(*) FROM project_assignments
UNION ALL
SELECT 'daily_report_photos', COUNT(*) FROM daily_report_photos
ORDER BY table_name;

-- Commit transaction
COMMIT;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'All dummy data has been successfully deleted!' as status;

