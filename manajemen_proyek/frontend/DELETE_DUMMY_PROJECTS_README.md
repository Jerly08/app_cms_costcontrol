# Hapus Project Dummy - Quick Guide

## 🎯 Tujuan

Menghapus project-project dummy berikut dari database:
- ❌ Proyek Jalan Tol Semarang
- ❌ Pembangunan Gedung Perkantoran
- ❌ Renovasi Jembatan Prambanan
- ❌ Perumahan Griya Asri
- ❌ Pembangunan Mall Central Plaza
- ❌ Padel Bandung

## ✅ Yang TIDAK Akan Dihapus

- ✅ **User data** (semua user tetap ada)
- ✅ **Project real** yang Anda buat sendiri
- ✅ **Materials** yang masih digunakan project lain

## 🚀 Cara Menjalankan (3 Langkah)

### 1. Backup Database (Opsional tapi Recommended)

```bash
pg_dump -U your_username -d your_database_name > backup_before_delete.sql
```

### 2. Run Script

**Via psql:**
```bash
psql -U your_username -d your_database_name

\i backend/migrations/delete_dummy_projects.sql
```

**Via pgAdmin:**
1. Buka pgAdmin
2. Query Tool
3. Copy-paste isi file `delete_dummy_projects.sql`
4. Execute (F5)

**Via Command Line:**
```bash
psql -U your_username -d your_database_name -f backend/migrations/delete_dummy_projects.sql
```

### 3. Refresh Browser

Setelah script selesai, refresh halaman Projects dan Cashflow di browser Anda.

---

## 📊 Apa yang Akan Dihapus?

Script akan menghapus data terkait 6 project dummy:

1. ✅ Project itu sendiri
2. ✅ Daily Reports project tersebut
3. ✅ Weekly Reports project tersebut
4. ✅ BOM (Bill of Materials) project tersebut
5. ✅ Material Usage records project tersebut
6. ✅ Purchase Requests project tersebut
7. ✅ Approvals project tersebut
8. ✅ Project Assignments project tersebut
9. ✅ Materials yang tidak digunakan lagi (orphaned)

---

## 🔍 Verifikasi Hasil

Setelah script selesai, script akan otomatis menampilkan:

1. **List project yang tersisa** (harusnya hanya project real Anda)
2. **Jumlah data** di setiap tabel

---

## 💡 Contoh Output

```
┌────┬─────────────────────────────┬─────────────────┐
│ id │           name              │     status      │
├────┼─────────────────────────────┼─────────────────┤
│  1 │ My Real Project             │ in_progress     │
└────┴─────────────────────────────┴─────────────────┘

table_name          | remaining_count
--------------------+----------------
projects            |              1
daily_reports       |              0
bom                 |              0
material_usage      |              0
users               |              5
```

---

## ⚠️ Troubleshooting

### Issue: Project masih muncul setelah delete

**Solution**: 
```bash
# Clear cache backend (jika ada)
# Restart backend server
# Hard refresh browser (Ctrl+Shift+R)
```

### Issue: Error "relation does not exist"

**Solution**: Beberapa tabel mungkin belum ada. Edit script dan comment tabel yang error:
```sql
-- DELETE FROM table_that_not_exists WHERE ...;
```

### Issue: Permission denied

**Solution**:
```bash
# Login sebagai superuser
psql -U postgres -d your_database_name -f backend/migrations/delete_dummy_projects.sql
```

---

## 🎯 Quick Command (All in One)

```bash
# Backup + Delete + Verify
pg_dump -U username -d dbname > backup.sql && \
psql -U username -d dbname -f backend/migrations/delete_dummy_projects.sql && \
psql -U username -d dbname -c "SELECT name FROM projects ORDER BY id;"
```

---

## ✅ Checklist

- [ ] Backup database (opsional)
- [ ] Run script `delete_dummy_projects.sql`
- [ ] Verify hasil di output
- [ ] Refresh halaman Projects
- [ ] Refresh halaman Cashflow
- [ ] Cek apakah project dummy sudah hilang
- [ ] Test buat project baru

---

## 📝 Alternative: Manual Delete via SQL

Jika ingin hapus manual satu per satu:

```sql
-- Hapus 1 project saja
BEGIN;
DELETE FROM material_usage WHERE project_id = (SELECT id FROM projects WHERE name = 'Padel Bandung');
DELETE FROM bom WHERE project_id = (SELECT id FROM projects WHERE name = 'Padel Bandung');
DELETE FROM daily_reports WHERE project_id = (SELECT id FROM projects WHERE name = 'Padel Bandung');
DELETE FROM weekly_reports WHERE project_id = (SELECT id FROM projects WHERE name = 'Padel Bandung');
DELETE FROM purchase_requests WHERE project_id = (SELECT id FROM projects WHERE name = 'Padel Bandung');
DELETE FROM approvals WHERE project_id = (SELECT id FROM projects WHERE name = 'Padel Bandung');
DELETE FROM project_assignments WHERE project_id = (SELECT id FROM projects WHERE name = 'Padel Bandung');
DELETE FROM projects WHERE name = 'Padel Bandung';
COMMIT;
```

---

## 🎉 Setelah Selesai

Setelah script berhasil:
- ✅ 6 project dummy akan hilang
- ✅ Data cashflow dummy akan hilang
- ✅ User data tetap aman
- ✅ Siap untuk input data real

**Refresh browser dan cek halaman Projects dan Cashflow - semuanya akan bersih!** 🚀

---

**File**: `backend/migrations/delete_dummy_projects.sql`  
**Safe**: Ya, hanya menghapus project dummy spesifik  
**Rollback**: Ya, wrapped dalam transaction  
**User Data**: AMAN, tidak akan terhapus

