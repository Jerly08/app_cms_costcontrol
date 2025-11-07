# Complete Database Cleanup - Termasuk Cashflow

## 🎯 Masalah

Anda sudah jalankan script delete dummy projects, tapi **data cashflow masih muncul** di halaman Cashflow Dashboard.

**Penyebab**: Data cashflow tersimpan di tabel terpisah (`cashflow` atau `transactions`) yang belum dihapus.

## ✅ Solusi

Script baru ini akan menghapus **SEMUA data dummy** termasuk:
- ✅ Projects
- ✅ **Cashflow records** ⭐
- ✅ **Financial transactions** ⭐
- ✅ Budgets
- ✅ Daily/Weekly Reports
- ✅ BOM
- ✅ Material Usage
- ✅ Purchase Requests
- ✅ Approvals
- ✅ Notifications
- ✅ Materials

## ⚠️ Yang AMAN (TIDAK Dihapus)

- ✅ **User data** - Login tetap bisa
- ✅ **User credentials** - Password tidak berubah
- ✅ **User roles** - Role tetap sama

---

## 🚀 Cara Menjalankan

### Via psql (Recommended):
```bash
psql -U your_username -d your_database_name

\i backend/migrations/delete_all_dummy_data_complete.sql
```

### Via pgAdmin:
1. Buka pgAdmin
2. Query Tool
3. Copy-paste isi file `delete_all_dummy_data_complete.sql`
4. Execute (F5)

### Via Command Line:
```bash
psql -U your_username -d your_database_name -f backend/migrations/delete_all_dummy_data_complete.sql
```

---

## 🔍 Setelah Run Script

### 1. Restart Backend Server

```bash
# Stop backend (Ctrl+C jika running)
# Start backend lagi
go run main.go
# atau
npm start
# atau sesuai cara Anda menjalankan backend
```

### 2. Clear Browser Cache & Refresh

**Chrome/Edge:**
```
Ctrl + Shift + R (hard refresh)
atau
Ctrl + Shift + Delete (clear cache)
```

**Firefox:**
```
Ctrl + Shift + R
```

### 3. Test Halaman Cashflow

1. Login ke aplikasi
2. Pergi ke halaman **Cashflow**
3. Tabel **"Detail Cashflow per Proyek"** harus **KOSONG**
4. Tidak ada project yang muncul

---

## 📊 Expected Result

### Sebelum:
```
Detail Cashflow per Proyek
├─ Proyek Jalan Tol Semarang
├─ Pembangunan Gedung Perkantoran
├─ Renovasi Jembatan Prambanan
├─ Perumahan Griya Asri
└─ Pembangunan Mall Central Plaza
```

### Sesudah:
```
Detail Cashflow per Proyek
└─ (kosong / no data)
```

---

## ✅ Verification

Jalankan query ini untuk memastikan semua data terhapus:

```sql
-- Check projects (harus 0)
SELECT COUNT(*) FROM projects;

-- Check cashflow (harus 0)
SELECT COUNT(*) FROM cashflow;

-- Check users (harus ada)
SELECT COUNT(*) FROM users;
```

**Expected:**
- projects: `0`
- cashflow: `0`
- users: `> 0` (ada user Anda)

---

## 🔧 Troubleshooting

### Issue 1: Cashflow masih muncul setelah delete

**Penyebab**: Cache backend atau browser

**Solution**:
```bash
# 1. Restart backend server
# 2. Clear browser cache (Ctrl+Shift+Delete)
# 3. Hard refresh (Ctrl+Shift+R)
# 4. Logout dan login lagi
```

### Issue 2: Error "table cashflow does not exist"

**Penyebab**: Nama tabel berbeda di database Anda

**Solution**:
```sql
-- Cek nama tabel yang ada
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Edit script sesuai nama tabel yang ada
```

### Issue 3: Permission denied

**Solution**:
```bash
# Login sebagai postgres superuser
psql -U postgres -d your_database_name -f backend/migrations/delete_all_dummy_data_complete.sql
```

### Issue 4: Data masih ada setelah refresh

**Kemungkinan penyebab**:
1. Cache backend (restart backend)
2. Data dari API external (cek konfigurasi)
3. Data hardcoded di frontend (cek file frontend)

**Cek di frontend**:
```bash
# Search untuk data dummy di frontend
cd frontend
grep -r "Proyek Jalan Tol" .
grep -r "Pembangunan Gedung" .
```

---

## 📝 Alternative: Manual Check & Delete

Jika ingin cek manual tabel cashflow:

```sql
-- 1. Lihat struktur tabel cashflow
\d cashflow

-- 2. Lihat data yang ada
SELECT * FROM cashflow LIMIT 10;

-- 3. Hapus manual
DELETE FROM cashflow;

-- 4. Verify
SELECT COUNT(*) FROM cashflow;
```

---

## 🎯 Script Comparison

| Feature | `delete_dummy_projects.sql` | `delete_all_dummy_data_complete.sql` |
|---------|------------------------------|--------------------------------------|
| Hapus projects spesifik | ✅ 6 projects | ❌ Tidak |
| Hapus semua projects | ❌ Tidak | ✅ Ya |
| Hapus cashflow | ❌ **Tidak** | ✅ **Ya** ⭐ |
| Hapus transactions | ❌ Tidak | ✅ Ya |
| Hapus users | ❌ Tidak | ❌ Tidak |
| Reset ID ke 1 | ❌ Tidak | ✅ Ya |
| **Recommended for cashflow issue** | ❌ | ✅ **Ya** |

---

## ⚡ One-Line Solution

```bash
psql -U your_username -d your_database_name -f backend/migrations/delete_all_dummy_data_complete.sql && echo "✅ Cashflow cleared! Restart backend & refresh browser."
```

---

## 🎉 After Cleanup Checklist

- [ ] Run script berhasil tanpa error
- [ ] Restart backend server
- [ ] Clear browser cache
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Login ke aplikasi
- [ ] Cek halaman Cashflow → harus kosong
- [ ] Cek halaman Projects → harus kosong
- [ ] Test buat project baru
- [ ] Cek apakah data baru muncul di cashflow

---

## 💡 Next Steps

Setelah cleanup selesai dan halaman Cashflow kosong:

1. **Buat Project Real** pertama Anda
2. **Input data cashflow/budget** untuk project tersebut
3. **Test** apakah data muncul dengan benar
4. **Mulai input data real** tanpa gangguan data dummy

---

**File**: `backend/migrations/delete_all_dummy_data_complete.sql`  
**Purpose**: Complete cleanup including cashflow  
**Safe**: Yes, user data preserved  
**Rollback**: Yes, wrapped in transaction  

**Setelah run script ini dan restart backend, halaman Cashflow akan bersih total! 🚀**

