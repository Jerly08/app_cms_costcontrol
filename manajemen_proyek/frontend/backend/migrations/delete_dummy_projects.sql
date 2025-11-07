-- =====================================================
-- DELETE SPECIFIC DUMMY PROJECTS
-- =====================================================
-- Description: Remove specific dummy projects and their related data
-- This script is SAFER than full cleanup - it only removes specific projects
-- User data will be preserved
-- =====================================================

-- Start transaction
BEGIN;

-- =====================================================
-- IDENTIFY DUMMY PROJECTS TO DELETE
-- =====================================================

-- Show projects that will be deleted
SELECT 
    id,
    name,
    'WILL BE DELETED' as status
FROM projects
WHERE name IN (
    'Proyek Jalan Tol Semarang',
    'Pembangunan Gedung Perkantoran',
    'Renovasi Jembatan Prambanan',
    'Perumahan Griya Asri',
    'Pembangunan Mall Central Plaza',
    'Padel Bandung'
);

-- Store project IDs in temporary table
CREATE TEMP TABLE projects_to_delete AS
SELECT id FROM projects
WHERE name IN (
    'Proyek Jalan Tol Semarang',
    'Pembangunan Gedung Perkantoran',
    'Renovasi Jembatan Prambanan',
    'Perumahan Griya Asri',
    'Pembangunan Mall Central Plaza',
    'Padel Bandung'
);

-- Show how many projects will be deleted
SELECT COUNT(*) as total_projects_to_delete FROM projects_to_delete;

-- =====================================================
-- DELETE RELATED DATA (in correct order)
-- =====================================================

-- 1. Delete Material Usage for these projects
DELETE FROM material_usage 
WHERE project_id IN (SELECT id FROM projects_to_delete);

-- 2. Delete BOM for these projects
DELETE FROM bom 
WHERE project_id IN (SELECT id FROM projects_to_delete);

-- 3. Delete Daily Report Photos
DELETE FROM daily_report_photos 
WHERE daily_report_id IN (
    SELECT id FROM daily_reports 
    WHERE project_id IN (SELECT id FROM projects_to_delete)
);

-- 4. Delete Daily Reports for these projects
DELETE FROM daily_reports 
WHERE project_id IN (SELECT id FROM projects_to_delete);

-- 5. Delete Weekly Reports for these projects
DELETE FROM weekly_reports 
WHERE project_id IN (SELECT id FROM projects_to_delete);

-- 6. Delete Purchase Request Items
DELETE FROM purchase_request_items 
WHERE purchase_request_id IN (
    SELECT id FROM purchase_requests 
    WHERE project_id IN (SELECT id FROM projects_to_delete)
);

-- 7. Delete Purchase Requests for these projects
DELETE FROM purchase_requests 
WHERE project_id IN (SELECT id FROM projects_to_delete);

-- 8. Delete Approvals for these projects
DELETE FROM approvals 
WHERE project_id IN (SELECT id FROM projects_to_delete);

-- 9. Delete Project Assignments for these projects
DELETE FROM project_assignments 
WHERE project_id IN (SELECT id FROM projects_to_delete);

-- 10. Finally, delete the projects themselves
DELETE FROM projects 
WHERE id IN (SELECT id FROM projects_to_delete);

-- =====================================================
-- CLEAN UP ORPHANED DATA (Optional but recommended)
-- =====================================================

-- Delete materials that are not used in any BOM
DELETE FROM materials 
WHERE id NOT IN (SELECT DISTINCT material_id FROM bom WHERE material_id IS NOT NULL)
  AND id NOT IN (SELECT DISTINCT material_id FROM material_usage WHERE material_id IS NOT NULL)
  AND id NOT IN (SELECT DISTINCT material_id FROM purchase_request_items WHERE material_id IS NOT NULL);

-- Delete notifications related to deleted projects (if notification table has project_id)
-- Uncomment if your notifications table references projects
-- DELETE FROM notifications WHERE related_id IN (SELECT id FROM projects_to_delete) AND type = 'project';

-- =====================================================
-- VACUUM TABLES (reclaim storage)
-- =====================================================

VACUUM ANALYZE projects;
VACUUM ANALYZE daily_reports;
VACUUM ANALYZE weekly_reports;
VACUUM ANALYZE bom;
VACUUM ANALYZE material_usage;
VACUUM ANALYZE purchase_requests;
VACUUM ANALYZE purchase_request_items;
VACUUM ANALYZE approvals;
VACUUM ANALYZE project_assignments;
VACUUM ANALYZE materials;

-- =====================================================
-- VERIFY DELETION
-- =====================================================

-- Show remaining projects
SELECT 
    id,
    name,
    status,
    start_date,
    end_date,
    created_at
FROM projects
ORDER BY id;

-- Show counts after deletion
SELECT 
    'projects' as table_name,
    COUNT(*) as remaining_count
FROM projects
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
SELECT 'materials', COUNT(*) FROM materials
UNION ALL
SELECT 'users', COUNT(*) FROM users
ORDER BY table_name;

-- Commit transaction
COMMIT;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'Dummy projects have been successfully deleted! User data preserved.' as status;

-- Drop temporary table
DROP TABLE IF EXISTS projects_to_delete;

