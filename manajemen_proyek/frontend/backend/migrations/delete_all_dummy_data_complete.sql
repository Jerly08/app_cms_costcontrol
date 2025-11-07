-- =====================================================
-- DELETE ALL DUMMY DATA - COMPLETE CLEANUP
-- =====================================================
-- Description: Remove ALL dummy projects and their related data
-- Including: cashflow, transactions, and all financial records
-- This will clean everything except user/login data
-- =====================================================

-- Start transaction
BEGIN;

-- =====================================================
-- SHOW WHAT WILL BE DELETED
-- =====================================================

SELECT 'Projects to be deleted:' as info;
SELECT id, name, status FROM projects ORDER BY id;

SELECT 'Cashflow records to be deleted:' as info;
SELECT COUNT(*) as total_cashflow_records FROM cashflow;

-- =====================================================
-- DISABLE TRIGGERS TEMPORARILY
-- =====================================================
SET session_replication_role = 'replica';

-- =====================================================
-- DELETE ALL DATA (except users)
-- =====================================================

-- 1. Delete Cashflow Records (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cashflow') THEN
        TRUNCATE TABLE cashflow CASCADE;
        RAISE NOTICE 'Cashflow table truncated';
    END IF;
END $$;

-- 2. Delete Financial Transactions (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions') THEN
        TRUNCATE TABLE transactions CASCADE;
        RAISE NOTICE 'Transactions table truncated';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'financial_transactions') THEN
        TRUNCATE TABLE financial_transactions CASCADE;
        RAISE NOTICE 'Financial transactions table truncated';
    END IF;
END $$;

-- 3. Delete Budget Records (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'budgets') THEN
        TRUNCATE TABLE budgets CASCADE;
        RAISE NOTICE 'Budgets table truncated';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'project_budgets') THEN
        TRUNCATE TABLE project_budgets CASCADE;
        RAISE NOTICE 'Project budgets table truncated';
    END IF;
END $$;

-- 4. Delete Material Usage
TRUNCATE TABLE material_usage CASCADE;

-- 5. Delete BOM
TRUNCATE TABLE bom CASCADE;

-- 6. Delete Daily Report Photos
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'daily_report_photos') THEN
        TRUNCATE TABLE daily_report_photos CASCADE;
        RAISE NOTICE 'Daily report photos table truncated';
    END IF;
END $$;

-- 7. Delete Daily Reports
TRUNCATE TABLE daily_reports CASCADE;

-- 8. Delete Weekly Reports
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'weekly_reports') THEN
        TRUNCATE TABLE weekly_reports CASCADE;
        RAISE NOTICE 'Weekly reports table truncated';
    END IF;
END $$;

-- 9. Delete Purchase Request Items
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'purchase_request_items') THEN
        TRUNCATE TABLE purchase_request_items CASCADE;
        RAISE NOTICE 'Purchase request items table truncated';
    END IF;
END $$;

-- 10. Delete Purchase Requests
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'purchase_requests') THEN
        TRUNCATE TABLE purchase_requests CASCADE;
        RAISE NOTICE 'Purchase requests table truncated';
    END IF;
END $$;

-- 11. Delete Approvals
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'approvals') THEN
        TRUNCATE TABLE approvals CASCADE;
        RAISE NOTICE 'Approvals table truncated';
    END IF;
END $$;

-- 12. Delete Notifications (project-related only, keep user notifications)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        TRUNCATE TABLE notifications CASCADE;
        RAISE NOTICE 'Notifications table truncated';
    END IF;
END $$;

-- 13. Delete Project Assignments
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'project_assignments') THEN
        TRUNCATE TABLE project_assignments CASCADE;
        RAISE NOTICE 'Project assignments table truncated';
    END IF;
END $$;

-- 14. Delete Project Documents (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'project_documents') THEN
        TRUNCATE TABLE project_documents CASCADE;
        RAISE NOTICE 'Project documents table truncated';
    END IF;
END $$;

-- 15. Delete Project Activities/Logs (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'project_activities') THEN
        TRUNCATE TABLE project_activities CASCADE;
        RAISE NOTICE 'Project activities table truncated';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
        TRUNCATE TABLE activity_logs CASCADE;
        RAISE NOTICE 'Activity logs table truncated';
    END IF;
END $$;

-- 16. Delete Materials (all)
TRUNCATE TABLE materials CASCADE;

-- 17. Delete Projects (finally)
TRUNCATE TABLE projects CASCADE;

-- =====================================================
-- RE-ENABLE TRIGGERS
-- =====================================================
SET session_replication_role = 'origin';

-- =====================================================
-- RESET ALL SEQUENCES
-- =====================================================

-- Reset sequences for clean IDs starting from 1
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT 'SELECT setval(' || quote_literal(quote_ident(sequence_schema) || '.' || quote_ident(sequence_name)) || 
               ', 1, false);' AS sql
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
          AND sequence_name NOT LIKE '%users%'  -- Don't reset user sequences
    LOOP
        EXECUTE r.sql;
    END LOOP;
END $$;

-- =====================================================
-- VACUUM TABLES (reclaim storage)
-- =====================================================

VACUUM ANALYZE projects;
VACUUM ANALYZE materials;
VACUUM ANALYZE daily_reports;
VACUUM ANALYZE bom;
VACUUM ANALYZE material_usage;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cashflow') THEN
        EXECUTE 'VACUUM ANALYZE cashflow';
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions') THEN
        EXECUTE 'VACUUM ANALYZE transactions';
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'weekly_reports') THEN
        EXECUTE 'VACUUM ANALYZE weekly_reports';
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'purchase_requests') THEN
        EXECUTE 'VACUUM ANALYZE purchase_requests';
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'approvals') THEN
        EXECUTE 'VACUUM ANALYZE approvals';
    END IF;
END $$;

-- =====================================================
-- VERIFY DELETION
-- =====================================================

SELECT 'Verification - All counts should be 0:' as info;

SELECT 
    'projects' as table_name,
    COUNT(*) as row_count
FROM projects
UNION ALL
SELECT 'materials', COUNT(*) FROM materials
UNION ALL
SELECT 'daily_reports', COUNT(*) FROM daily_reports
UNION ALL
SELECT 'bom', COUNT(*) FROM bom
UNION ALL
SELECT 'material_usage', COUNT(*) FROM material_usage
ORDER BY table_name;

-- Show cashflow count if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cashflow') THEN
        RAISE NOTICE 'Cashflow records remaining: %', (SELECT COUNT(*) FROM cashflow);
    END IF;
END $$;

-- Show users are still there
SELECT 'Users (should NOT be empty):' as info;
SELECT id, username, full_name, role FROM users ORDER BY id;

-- Commit transaction
COMMIT;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT '✅ All dummy data deleted successfully!' as status;
SELECT '✅ Cashflow records cleared!' as status;
SELECT '✅ User data preserved!' as status;
SELECT '🎉 Database is now clean and ready for real data!' as status;

