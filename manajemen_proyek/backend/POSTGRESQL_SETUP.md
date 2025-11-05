# PostgreSQL Setup untuk Windows

## Persiapan Database

### 1. Install PostgreSQL (jika belum)

**Opsi A: Install PostgreSQL Standalone**
- Download dari: https://www.postgresql.org/download/windows/
- Install dengan default settings
- Password default: `postgres`
- Port default: `5432`

**Opsi B: Gunakan PostgreSQL di Laragon** (Recommended)
- Buka Laragon
- Klik `Menu` → `PostgreSQL` → Start
- PostgreSQL akan berjalan di port `5432`

### 2. Buat Database

**Via pgAdmin:**
1. Buka pgAdmin (biasanya terinstall bersama PostgreSQL)
2. Connect ke server PostgreSQL (password: `postgres`)
3. Klik kanan pada `Databases` → `Create` → `Database...`
4. Database name: `unipro_project_management`
5. Owner: `postgres`
6. Klik `Save`

**Via psql (Command Line):**
```bash
# Login ke PostgreSQL
psql -U postgres

# Buat database
CREATE DATABASE unipro_project_management;

# Keluar
\q
```

**Via Script SQL:**
```bash
# Jalankan script yang sudah disediakan
psql -U postgres -f create_database.sql
```

### 3. Konfigurasi Environment

File `.env` sudah dikonfigurasi untuk PostgreSQL:

```env
# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=unipro_project_management
DB_SSLMODE=disable
DB_TIMEZONE=Asia/Jakarta
```

**Sesuaikan password jika berbeda!**

## Menjalankan Backend

### 1. Install Dependencies (sudah dilakukan)
```bash
go mod tidy
```

### 2. Pastikan PostgreSQL Running

**Cek status:**
```bash
# Windows - via services
services.msc
# Cari "postgresql" dan pastikan Running

# Atau via Laragon
# Klik Start All atau Start PostgreSQL
```

**Test koneksi:**
```bash
psql -U postgres -d unipro_project_management -c "SELECT version();"
```

### 3. Run Backend
```bash
go run cmd/main.go
```

Backend akan:
- ✅ Connect ke PostgreSQL
- ✅ Auto-migrate semua tabel (roles, users, projects, approvals, notifications, dll)
- ✅ Seed default roles
- ✅ Seed dummy users untuk testing

## Troubleshooting

### Error: "connection refused"
- PostgreSQL belum running
- Cek di Task Manager atau Laragon
- Restart PostgreSQL service

### Error: "password authentication failed"
- Password di `.env` tidak sesuai
- Default password PostgreSQL biasanya `postgres`
- Ubah `DB_PASSWORD` di `.env`

### Error: "database does not exist"
- Buat database dulu via pgAdmin atau psql
- Jalankan script `create_database.sql`

### Port 5432 sudah digunakan
- Cek aplikasi lain yang menggunakan port 5432
- Atau ubah port PostgreSQL dan update `.env`

## Migrasi Data dari MySQL (Opsional)

Jika Anda punya data di MySQL dan ingin migrate ke PostgreSQL:

1. Export data dari MySQL
2. Convert format SQL (MySQL → PostgreSQL)
3. Import ke PostgreSQL
4. Atau jalankan ulang aplikasi (data akan di-seed otomatis)

## Keuntungan PostgreSQL vs MySQL

✅ **ACID Compliance** - Lebih reliable untuk transaksi
✅ **JSON Support** - Native JSON/JSONB datatype
✅ **Full-text Search** - Built-in tanpa extension
✅ **Concurrent Writes** - Better handling untuk multiple users
✅ **Open Source** - Sepenuhnya gratis tanpa batasan
✅ **Advanced Features** - Window functions, CTEs, dll

## Verifikasi Setup

Test koneksi dan data:

```bash
# Connect ke database
psql -U postgres -d unipro_project_management

# List tables
\dt

# Check users
SELECT id, name, email FROM users;

# Check roles
SELECT * FROM roles;

# Exit
\q
```

Jika semua berhasil, backend siap digunakan! 🎉

