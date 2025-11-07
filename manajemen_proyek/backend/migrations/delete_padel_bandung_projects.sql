-- ============================================
-- Script: Delete Padel bandung Projects
-- Description: Remove all Padel bandung projects and related data
-- Date: 2025
-- ============================================

-- Start transaction
BEGIN;

-- Step 1: Disable triggers temporarily to avoid cascade errors
SET session_replication_role = 'replica';

-- Step 2: Find and display Padel bandung project IDs (for verification)
-- Uncomment the following line to see which projects will be deleted:
-- SELECT id, name, created_at FROM projects WHERE LOWER(name) LIKE '%padel%bandung%' OR LOWER(name) LIKE '%padel bandung%';

-- Step 3: Delete related data from dependent tables
-- (Order matters due to foreign key constraints)

-- Delete daily report photos
DELETE FROM daily_report_photos 
WHERE daily_report_id IN (
    SELECT dr.id FROM daily_reports dr
    INNER JOIN projects p ON dr.project_id = p.id
    WHERE LOWER(p.name) LIKE '%padel%bandung%' OR LOWER(p.name) LIKE '%padel bandung%'
);

-- Delete daily reports
DELETE FROM daily_reports 
WHERE project_id IN (
    SELECT id FROM projects 
    WHERE LOWER(name) LIKE '%padel%bandung%' OR LOWER(name) LIKE '%padel bandung%'
);

-- Delete weekly reports
DELETE FROM weekly_reports 
WHERE project_id IN (
    SELECT id FROM projects 
    WHERE LOWER(name) LIKE '%padel%bandung%' OR LOWER(name) LIKE '%padel bandung%'
);

-- Delete material usage
DELETE FROM material_usage 
WHERE project_id IN (
    SELECT id FROM projects 
    WHERE LOWER(name) LIKE '%padel%bandung%' OR LOWER(name) LIKE '%padel bandung%'
);

-- Delete BOM (Bill of Materials)
DELETE FROM bom 
WHERE project_id IN (
    SELECT id FROM projects 
    WHERE LOWER(name) LIKE '%padel%bandung%' OR LOWER(name) LIKE '%padel bandung%'
);

-- Delete purchase request items
DELETE FROM purchase_request_items 
WHERE purchase_request_id IN (
    SELECT pr.id FROM purchase_requests pr
    INNER JOIN projects p ON pr.project_id = p.id
    WHERE LOWER(p.name) LIKE '%padel%bandung%' OR LOWER(p.name) LIKE '%padel bandung%'
);

-- Delete purchase request approvals
DELETE FROM purchase_request_approvals 
WHERE purchase_request_id IN (
    SELECT pr.id FROM purchase_requests pr
    INNER JOIN projects p ON pr.project_id = p.id
    WHERE LOWER(p.name) LIKE '%padel%bandung%' OR LOWER(p.name) LIKE '%padel bandung%'
);

-- Delete purchase requests
DELETE FROM purchase_requests 
WHERE project_id IN (
    SELECT id FROM projects 
    WHERE LOWER(name) LIKE '%padel%bandung%' OR LOWER(name) LIKE '%padel bandung%'
);

-- Delete project approvals (if exists)
DELETE FROM approvals 
WHERE project_id IN (
    SELECT id FROM projects 
    WHERE LOWER(name) LIKE '%padel%bandung%' OR LOWER(name) LIKE '%padel bandung%'
);

-- Delete cashflow data (if exists)
DELETE FROM cashflow 
WHERE project_id IN (
    SELECT id FROM projects 
    WHERE LOWER(name) LIKE '%padel%bandung%' OR LOWER(name) LIKE '%padel bandung%'
);

-- Delete project budget details (if exists)
DELETE FROM project_budgets 
WHERE project_id IN (
    SELECT id FROM projects 
    WHERE LOWER(name) LIKE '%padel%bandung%' OR LOWER(name) LIKE '%padel bandung%'
);

-- Delete notifications related to these projects
DELETE FROM notifications 
WHERE related_entity_type = 'project' 
AND related_entity_id IN (
    SELECT id FROM projects 
    WHERE LOWER(name) LIKE '%padel%bandung%' OR LOWER(name) LIKE '%padel bandung%'
);

-- Step 4: Finally, delete the projects themselves
DELETE FROM projects 
WHERE LOWER(name) LIKE '%padel%bandung%' OR LOWER(name) LIKE '%padel bandung%';

-- Step 5: Re-enable triggers
SET session_replication_role = 'origin';

-- Commit the transaction
COMMIT;

-- ============================================
-- Verification Queries
-- ============================================
-- Run these after executing the script to verify:

-- Check if Padel bandung projects are deleted
-- SELECT COUNT(*) as remaining_padel_projects FROM projects WHERE LOWER(name) LIKE '%padel%';

-- Check total projects remaining
-- SELECT COUNT(*) as total_projects FROM projects;

-- ============================================
-- USAGE INSTRUCTIONS
-- ============================================
-- 
-- 1. BACKUP DATABASE FIRST!
--    pg_dump -U postgres -d your_database > backup_before_delete.sql
--
-- 2. Connect to PostgreSQL:
--    psql -U postgres -d your_database
--
-- 3. Run this script:
--    \i /path/to/delete_padel_bandung_projects.sql
--
-- 4. Verify deletion:
--    SELECT * FROM projects WHERE LOWER(name) LIKE '%padel%';
--
-- 5. If you need to rollback (only possible before COMMIT):
--    ROLLBACK;
--
-- ============================================

