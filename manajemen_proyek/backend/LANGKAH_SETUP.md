# 🚀 Langkah Setup Backend - SETELAH INSTALL GO

✅ Go sudah terinstall (Version 1.25.3)
✅ Dependencies sudah di-download

---

## 📋 Checklist Setup

### ✅ Step 1: Go Installation (SUDAH SELESAI)
- ✓ Go version 1.25.3 terdeteksi
- ✓ Dependencies berhasil di-download

---

### ⏳ Step 2: Setup MySQL Database

#### **Option A: Jika XAMPP sudah terinstall**
1. Buka XAMPP Control Panel
2. Start "MySQL"
3. Klik "Admin" untuk buka phpMyAdmin
4. Buat database baru:
   - Database name: `unipro_project_management`
   - Collation: `utf8mb4_general_ci`

#### **Option B: Jika belum ada MySQL**
Download salah satu:
- **XAMPP**: https://www.apachefriends.org/download.html
- **MySQL Installer**: https://dev.mysql.com/downloads/installer/

Setelah install, buat database:
```sql
CREATE DATABASE unipro_project_management;
```

---

### ⏳ Step 3: Configure Environment Variables

File `.env` sudah ada di folder backend. Edit file tersebut:

```env
# Server Configuration
PORT=8080
ENV=development

# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=                    ← KOSONGKAN jika pakai XAMPP (default no password)
                                ← ATAU isi password MySQL Anda
DB_NAME=unipro_project_management
DB_CHARSET=utf8mb4
DB_PARSETIME=True
DB_LOC=Local

# JWT Configuration
JWT_SECRET=unipro-secret-key-2025-change-in-production
JWT_EXPIRY=24h

# Upload Configuration
UPLOAD_PATH=./uploads
MAX_UPLOAD_SIZE=10485760

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

**⚠️ PENTING untuk XAMPP users:**
- Default user: `root`
- Default password: **KOSONG** (tidak ada password)
- Jadi `DB_PASSWORD=` (kosong saja)

---

### ⏳ Step 4: Run Backend Server

Setelah database dan .env sudah siap:

```powershell
go run cmd/main.go
```

ATAU gunakan script shortcut:
```powershell
.\start.ps1
```

---

## ✅ Jika Berhasil, Anda Akan Melihat:

```
🚀 Starting Unipro Project Management API...
📝 Environment: development
📦 Connecting to MySQL database...
✓ Database connected successfully
🔄 Running database migrations...
✓ Database migrations completed successfully
🌱 Seeding default data...
✓ Created role: Director
✓ Created role: Manager/GM
✓ Created role: Cost Control
✓ Created role: Purchasing
✓ Created role: Tim Lapangan
✓ Default roles seeded successfully
✅ Server started successfully on http://localhost:8080
📋 API Documentation: http://localhost:8080/health
🔗 API Endpoint: http://localhost:8080/api/v1

👉 Press Ctrl+C to stop the server
```

---

## 🧪 Test API

Setelah server jalan, buka browser:

1. **Health Check**: http://localhost:8080/health
2. **API Test**: http://localhost:8080/api/v1/test

---

## 📊 Database Tables

Setelah migration selesai, cek di phpMyAdmin atau MySQL:

```sql
USE unipro_project_management;
SHOW TABLES;
```

Akan muncul 7 tables:
- ✓ roles (5 default roles sudah di-seed)
- ✓ users
- ✓ projects
- ✓ progress_breakdowns
- ✓ daily_reports
- ✓ photos
- ✓ weekly_reports

---

## 🔧 Troubleshooting

### Error: "dial tcp: connectex: No connection could be made"
❌ **Problem**: MySQL belum jalan
✅ **Solution**: 
- XAMPP: Start MySQL di Control Panel
- MySQL Service: `services.msc` → Start MySQL

### Error: "Access denied for user 'root'@'localhost'"
❌ **Problem**: Password salah di .env
✅ **Solution**: 
- XAMPP: Kosongkan `DB_PASSWORD=` (no password)
- MySQL: Isi dengan password yang benar

### Error: "Database doesn't exist"
❌ **Problem**: Database belum dibuat
✅ **Solution**: Buat database via phpMyAdmin atau MySQL client
```sql
CREATE DATABASE unipro_project_management;
```

### Error: "go: command not found" (setelah restart)
❌ **Problem**: Go belum di PATH permanent
✅ **Solution**: Tambahkan ke PATH Windows:
1. Search "Environment Variables" di Windows
2. Edit "Path" di System Variables
3. Tambahkan: `C:\Program Files\Go\bin`
4. Restart PowerShell

---

## 🎯 Status Saat Ini

✅ **SUDAH SELESAI:**
- Go installed (v1.25.3)
- Dependencies downloaded
- File structure ready
- Configuration files ready
- Main application ready

⏳ **YANG PERLU DILAKUKAN:**
1. Setup MySQL database
2. Edit .env dengan credentials MySQL
3. Run server: `go run cmd/main.go`

---

## 📞 Quick Help

Jika masih ada masalah, cek file lainnya:
- `SETUP_GUIDE.md` - Panduan lengkap
- `QUICK_START.txt` - Quick reference
- `README.md` - Technical docs

---

**Backend hampir siap! Tinggal 2 langkah lagi! 🚀**

1. Setup MySQL
2. Edit .env
3. Run: `go run cmd/main.go`

