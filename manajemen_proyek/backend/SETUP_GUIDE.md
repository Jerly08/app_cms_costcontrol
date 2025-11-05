# 📚 Setup Guide - Backend API (MySQL)

Panduan lengkap untuk menjalankan backend API Unipro Project Management.

---

## ✅ Prerequisites yang Dibutuhkan

### 1. **Install Go (Golang)**
Download dan install Golang dari:
- 🔗 https://go.dev/dl/
- Download versi terbaru untuk Windows (contoh: go1.21.windows-amd64.msi)
- Ikuti wizard installer
- Setelah install, **restart PowerShell/CMD**

Cek instalasi:
```powershell
go version
# Output: go version go1.21.x windows/amd64
```

### 2. **Install MySQL**
Download dan install MySQL:
- 🔗 https://dev.mysql.com/downloads/installer/
- Pilih "MySQL Installer for Windows"
- Install MySQL Server 8.0+
- Catat username (default: root) dan password yang Anda set

Atau gunakan XAMPP/WAMP yang sudah include MySQL.

---

## 🚀 Setup Step-by-Step

### **Step 1: Setup Database**

Buka MySQL client (MySQL Workbench, phpMyAdmin, atau command line):

```sql
CREATE DATABASE unipro_project_management;
```

Untuk command line MySQL:
```powershell
# Login ke MySQL
mysql -u root -p
# Masukkan password

# Buat database
CREATE DATABASE unipro_project_management;

# Cek database sudah dibuat
SHOW DATABASES;

# Keluar
EXIT;
```

---

### **Step 2: Configure Environment Variables**

File `.env` sudah di-copy. Edit file `.env` dengan credentials MySQL Anda:

```env
# Server Configuration
PORT=8080
ENV=development

# Database Configuration (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here  # ⚠️ GANTI INI!
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

⚠️ **PENTING**: Ganti `DB_PASSWORD` dengan password MySQL Anda!

---

### **Step 3: Install Go Dependencies**

```powershell
go mod download
```

Ini akan mendownload semua dependencies:
- Gin (web framework)
- GORM (ORM)
- MySQL driver
- JWT library
- dll

---

### **Step 4: Run Server**

```powershell
go run cmd/main.go
```

Anda akan melihat output seperti ini:

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

## ✅ Test API

### **1. Health Check**
Buka browser atau gunakan curl:
```powershell
curl http://localhost:8080/health
```

Response:
```json
{
  "status": "ok",
  "message": "Unipro Project Management API is running",
  "version": "1.0.0"
}
```

### **2. Test API v1**
```powershell
curl http://localhost:8080/api/v1/test
```

Response:
```json
{
  "message": "API v1 is working!"
}
```

---

## 📊 Database Tables Created

Setelah migration, database akan memiliki 7 tables:

1. **roles** - User roles (Director, Manager, Cost Control, Purchasing, Tim Lapangan)
2. **users** - System users
3. **projects** - Construction projects
4. **progress_breakdowns** - Progress detail per fase
5. **daily_reports** - Daily field reports
6. **photos** - Uploaded photos
7. **weekly_reports** - Weekly summaries

Cek tables di MySQL:
```sql
USE unipro_project_management;
SHOW TABLES;

-- Lihat data roles yang sudah di-seed
SELECT * FROM roles;
```

---

## 🔧 Troubleshooting

### **Error: "dial tcp: connectex: No connection could be made"**
- MySQL server belum jalan
- Cek MySQL service: `services.msc` → cari "MySQL" → Start

### **Error: "Access denied for user 'root'@'localhost'"**
- Password salah di file `.env`
- Atau user tidak punya akses ke database

### **Error: "Database 'unipro_project_management' doesn't exist"**
- Belum buat database
- Jalankan: `CREATE DATABASE unipro_project_management;`

### **Error: "go: command not found"**
- Go belum terinstall atau belum di PATH
- Install Go dari https://go.dev/dl/
- Restart terminal

---

## 📁 Struktur Project

```
backend/
├── cmd/
│   └── main.go          # ✅ Entry point application
├── config/
│   └── config.go        # ✅ Config loader
├── internal/
│   ├── models/          # ✅ Database models
│   ├── handlers/        # ⏳ API handlers (TODO)
│   ├── services/        # ⏳ Business logic (TODO)
│   ├── repositories/    # ⏳ Data access (TODO)
│   └── middleware/      # ⏳ Auth & RBAC (TODO)
├── pkg/
│   └── database/        # ✅ DB connection
├── .env                 # ✅ Environment variables
├── .env.example         # ✅ Template
├── go.mod               # ✅ Dependencies
└── SETUP_GUIDE.md       # ✅ This file
```

---

## 🎯 Next Steps

Setelah backend berhasil jalan, Anda bisa:

1. ✅ **Test API endpoints** yang sudah ada
2. ⏳ **Implement authentication** (JWT login/register)
3. ⏳ **Create project CRUD endpoints**
4. ⏳ **Create daily report endpoints**
5. ⏳ **Integrate dengan frontend React/Next.js**

---

## 📞 Bantuan

Jika ada masalah:
1. Cek log error di terminal
2. Pastikan MySQL service running
3. Pastikan `.env` sudah benar
4. Cek Go version: `go version` (minimal 1.21)

---

## 🎉 Success!

Jika semua berjalan lancar, Anda akan melihat:
- ✅ Database connected
- ✅ Migrations completed
- ✅ Default roles seeded
- ✅ Server running di port 8080

**Backend API siap digunakan! 🚀**

