# Panduan Membersihkan Data Dummy dari Database

## ⚠️ PERINGATAN PENTING

**Script ini akan menghapus SEMUA data dari database!**
- Pastikan backup database terlebih dahulu
- Script ini akan menghapus semua projects, materials, reports, users, dll
- ID akan di-reset kembali ke 1
- **TIDAK BISA DI-UNDO setelah dijalankan!**

---

## 🎯 Masalah yang Akan Diselesaikan

Anda mengalami masalah di mana:
1. Di halaman Projects, muncul nama "Padel Bandung" (data dummy)
2. Ketika diklik, isinya malah "Perumahan Griya Asri" (data dummy lain)
3. Data dummy ini bentrok dengan data real yang ingin Anda buat

**Solusi**: Hapus semua data dummy agar bisa mulai dari awal dengan data real.

---

## 📋 Persiapan

### 1. Backup Database Terlebih Dahulu (WAJIB!)

```bash
# Backup full database
pg_dump -U your_username -d your_database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# Atau backup hanya data (tanpa structure)
pg_dump -U your_username -d your_database_name --data-only > backup_data_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Catat Info Login Admin

Jika Anda ingin **tetap menjaga user admin** untuk login, edit file SQL:
- Buka: `backend/migrations/clean_dummy_data.sql`
- Cari baris 72-77
- **Comment** baris 72-73 (Option A)
- **Uncomment** baris 76-77 (Option B)

Hasilnya akan seperti ini:
```sql
-- 13. Delete Users (keep admin user if needed)
-- Option A: Delete all users
-- TRUNCATE TABLE users CASCADE;
-- RESET SEQUENCE IF EXISTS users_id_seq;

-- Option B: Keep admin user only (uncomment this and comment Option A above)
DELETE FROM users WHERE username != 'admin';
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
```

---

## 🚀 Cara Menjalankan Script

### Metode 1: Via psql Command Line (Recommended)

```bash
# 1. Connect ke PostgreSQL
psql -U your_username -d your_database_name

# 2. Run script
\i backend/migrations/clean_dummy_data.sql

# 3. Verify hasilnya
# Script akan otomatis menampilkan jumlah row di setiap tabel
```

### Metode 2: Via pgAdmin

1. Buka **pgAdmin**
2. Connect ke database Anda
3. Klik kanan pada database → **Query Tool**
4. Buka file `backend/migrations/clean_dummy_data.sql`
5. Copy-paste isi file ke Query Tool
6. Klik **Execute** (F5)

### Metode 3: Via Command Line Langsung

```bash
psql -U your_username -d your_database_name -f backend/migrations/clean_dummy_data.sql
```

---

## ✅ Verifikasi Setelah Cleanup

### 1. Cek Jumlah Data di Setiap Tabel

```sql
SELECT 
    schemaname,
    tablename,
    n_tup_ins AS total_inserts,
    n_tup_upd AS total_updates,
    n_tup_del AS total_deletes,
    n_live_tup AS current_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### 2. Cek Sequence Values (Harus mulai dari 1)

```sql
SELECT 
    sequence_name,
    last_value,
    is_called
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;
```

### 3. Manual Check per Tabel

```sql
-- Check setiap tabel
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'materials', COUNT(*) FROM materials
UNION ALL
SELECT 'bom', COUNT(*) FROM bom
UNION ALL
SELECT 'daily_reports', COUNT(*) FROM daily_reports;
```

**Expected Result**: Semua tabel harus menunjukkan **0 rows** (atau 1 row jika menjaga admin user)

---

## 🔄 Setelah Cleanup - Mulai Fresh

### 1. Test Login

```bash
# Jika Anda menjaga admin user, test login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_admin_password"
  }'
```

### 2. Buat User Baru (Jika Anda hapus semua users)

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "christopher",
    "password": "your_password",
    "email": "christopher@unipro.com",
    "full_name": "Christopher",
    "role": "project_director"
  }'
```

### 3. Buat Project Baru (Via Frontend)

1. Login ke aplikasi
2. Pergi ke halaman Projects
3. Klik "Create New Project"
4. Isi data project real Anda
5. Sekarang tidak akan ada bentrokan dengan data dummy!

---

## 📊 Apa yang Dihapus Script Ini?

Script akan menghapus data dari tabel-tabel berikut dalam urutan yang benar:

1. ✅ `material_usage` - Catatan penggunaan material
2. ✅ `bom` - Bill of Materials
3. ✅ `daily_report_photos` - Foto laporan harian
4. ✅ `daily_reports` - Laporan harian
5. ✅ `weekly_reports` - Laporan mingguan
6. ✅ `purchase_request_items` - Item permintaan pembelian
7. ✅ `purchase_requests` - Permintaan pembelian
8. ✅ `approvals` - Data approval
9. ✅ `notifications` - Notifikasi
10. ✅ `project_assignments` - Penugasan project
11. ✅ `materials` - Master material
12. ✅ `projects` - Master project
13. ✅ `users` - Data users (optional keep admin)

---

## 🛡️ Safety Features

Script ini memiliki fitur keamanan:

1. **Transaction Wrapper**: Semua operasi dalam 1 transaksi
   - Jika ada error, semua akan di-rollback
   - Tidak akan terjadi partial deletion

2. **Disable Triggers**: Sementara menonaktifkan triggers
   - Mencegah error cascade
   - Mencegah trigger overhead

3. **Cascade Delete**: Menggunakan TRUNCATE CASCADE
   - Otomatis hapus dependent data
   - Lebih cepat dari DELETE

4. **Sequence Reset**: Reset semua auto-increment
   - ID baru akan mulai dari 1
   - Konsisten dan clean

5. **Vacuum**: Membersihkan space
   - Reclaim disk space
   - Update statistics untuk performa

---

## 🔧 Troubleshooting

### Issue 1: Permission Denied

**Error**: `ERROR: permission denied for table xxx`

**Solution**:
```sql
-- Login sebagai superuser
psql -U postgres -d your_database_name

-- Atau grant permission
GRANT ALL ON ALL TABLES IN SCHEMA public TO your_username;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_username;
```

### Issue 2: Table Not Found

**Error**: `ERROR: relation "xxx" does not exist`

**Solution**: Edit script, comment out tabel yang tidak ada:
```sql
-- TRUNCATE TABLE table_that_not_exists CASCADE;
```

### Issue 3: Foreign Key Constraint Error

**Error**: `ERROR: update or delete on table violates foreign key constraint`

**Solution**: Script sudah handle ini dengan TRUNCATE CASCADE. Jika masih error:
```sql
-- Disable all foreign keys temporarily
SET CONSTRAINTS ALL DEFERRED;
-- Run your delete commands
-- Re-enable
SET CONSTRAINTS ALL IMMEDIATE;
```

### Issue 4: Cannot TRUNCATE Table

**Error**: `ERROR: cannot truncate a table referenced in a foreign key constraint`

**Solution**: Script sudah menggunakan CASCADE. Jika masih error, gunakan:
```sql
TRUNCATE TABLE table_name RESTART IDENTITY CASCADE;
```

---

## 📝 Alternative: Selective Deletion

Jika Anda hanya ingin hapus data tertentu, gunakan script ini:

```sql
-- Hapus hanya projects dengan nama tertentu
BEGIN;
DELETE FROM projects WHERE name = 'Padel Bandung';
DELETE FROM projects WHERE name = 'Perumahan Griya Asri';
COMMIT;
```

Atau hapus projects dummy (ID < 10):
```sql
BEGIN;
DELETE FROM material_usage WHERE project_id < 10;
DELETE FROM bom WHERE project_id < 10;
DELETE FROM daily_reports WHERE project_id < 10;
DELETE FROM weekly_reports WHERE project_id < 10;
DELETE FROM purchase_requests WHERE project_id < 10;
DELETE FROM project_assignments WHERE project_id < 10;
DELETE FROM projects WHERE id < 10;
COMMIT;
```

---

## 🎯 Summary Quick Steps

```bash
# 1. Backup database
pg_dump -U username -d dbname > backup.sql

# 2. Edit script jika perlu keep admin user
# (edit backend/migrations/clean_dummy_data.sql)

# 3. Run cleanup script
psql -U username -d dbname -f backend/migrations/clean_dummy_data.sql

# 4. Verify hasil
psql -U username -d dbname -c "SELECT COUNT(*) FROM projects;"

# 5. Login ke frontend dan mulai buat data baru!
```

---

## ✅ Checklist

- [ ] Backup database sudah dibuat
- [ ] Sudah tentukan keep admin user atau tidak
- [ ] Sudah edit script sesuai kebutuhan
- [ ] Sudah cek connection ke database
- [ ] Sudah run script cleanup
- [ ] Sudah verify semua tabel kosong
- [ ] Sudah test login aplikasi
- [ ] Sudah bisa buat project baru tanpa bentrokan

---

**Setelah cleanup selesai, database Anda akan bersih dan siap diisi dengan data real tanpa ada bentrokan dengan data dummy lagi!** ✨

**Need Help?** Jika ada error saat running script, share error message-nya untuk troubleshooting lebih lanjut.

