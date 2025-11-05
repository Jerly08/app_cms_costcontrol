# Project Management Backend - PT Unipro

Backend API untuk Cost Control & Project Management System yang dibangun dengan Golang, Gin Framework, dan PostgreSQL.

## 📋 **Fitur Utama**

### ✅ **Sudah Diimplementasikan**

#### 1. **Database Models**
- ✓ User & Role Management dengan RBAC
- ✓ Project Management (nama, customer, biaya, progress, status)
- ✓ Progress Breakdown (foundation, utilities, interior, equipment)
- ✓ Daily Reports (aktivitas harian, cuaca, pekerja, foto)
- ✓ Weekly Reports (laporan mingguan otomatis)
- ✓ Photo Management (upload foto untuk daily reports)

#### 2. **Role-Based Access Control (RBAC)**
Role yang sudah didefinisikan:
- **Director**: Full access ke semua modul
- **Manager/GM**: Manage projects & approve requests
- **Cost Control**: Verify & control costs
- **Purchasing**: Create & manage purchase requests  
- **Tim Lapangan**: Submit daily reports & update progress

#### 3. **Database Setup**
- ✓ PostgreSQL connection dengan GORM
- ✓ Auto-migration untuk semua tables
- ✓ Default roles seeder

## 🗂️ **Struktur Folder**

```
backend/
├── cmd/                    # Main applications
├── config/                 # Configuration files
│   └── config.go          # ✓ Config loader
├── internal/              # Private application code
│   ├── models/            # ✓ Database models
│   │   ├── user.go       # User & Role models
│   │   ├── project.go    # Project & ProgressBreakdown
│   │   └── report.go     # DailyReport, WeeklyReport, Photo
│   ├── handlers/          # HTTP handlers (TODO)
│   ├── services/          # Business logic (TODO)
│   ├── repositories/      # Database layer (TODO)
│   └── middleware/        # JWT auth, RBAC (TODO)
├── pkg/                   # Public libraries
│   └── database/          # ✓ Database connection
│       └── database.go
├── migrations/            # SQL migrations (optional)
├── .env.example          # ✓ Environment variables template
├── go.mod                # ✓ Go dependencies
└── README.md             # ✓ This file
```

## 🚀 **Setup & Installation**

### 1. **Prerequisites**
```bash
- Go 1.21+
- PostgreSQL 14+
- Git
```

### 2. **Clone & Setup**
```bash
cd backend
cp .env.example .env
# Edit .env dengan database credentials Anda
```

### 3. **Install Dependencies**
```bash
go mod download
```

### 4. **Setup Database**
```sql
CREATE DATABASE unipro_project_management;
```

### 5. **Run Migrations & Seeder** (TODO: Create main.go)
```bash
go run cmd/main.go migrate
go run cmd/main.go seed
```

### 6. **Run Server** (TODO: Create main.go)
```bash
go run cmd/main.go
# Server will start on http://localhost:8080
```

## 📊 **Database Schema**

### **Tables Created:**

1. **roles** - User roles dengan permissions
2. **users** - System users
3. **projects** - Construction projects
4. **progress_breakdowns** - Detailed progress per phase
5. **daily_reports** - Daily field reports
6. **photos** - Uploaded photos
7. **weekly_reports** - Auto-generated weekly summaries

## 🔧 **Environment Variables**

```env
# Server
PORT=8080
ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=unipro_project_management
DB_SSLMODE=disable

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRY=24h

# Upload
UPLOAD_PATH=./uploads
MAX_UPLOAD_SIZE=10485760

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 🎯 **Roadmap - Yang Perlu Dikerjakan Selanjutnya**

### **Phase 1: Core API** (Priority: HIGH)
- [ ] Create main.go application entry point
- [ ] Implement JWT authentication middleware
- [ ] Implement RBAC authorization middleware
- [ ] Create API handlers untuk Projects CRUD
- [ ] Create API handlers untuk Daily Reports
- [ ] Create API handlers untuk User Management

### **Phase 2: File Upload** (Priority: HIGH)
- [ ] Implement photo upload handler
- [ ] Create file storage service
- [ ] Implement file validation & security

### **Phase 3: Reports Generation** (Priority: MEDIUM)
- [ ] Weekly report auto-generator dari daily reports
- [ ] PDF generation service untuk weekly reports
- [ ] Email notification service

### **Phase 4: Integration** (Priority: MEDIUM)
- [ ] Connect frontend dengan backend API
- [ ] Implement real-time notifications
- [ ] Implement audit logging

### **Phase 5: Approval System** (Priority: LOW - Cost Control Module)
- [ ] Purchase request workflow
- [ ] Multi-level approval system
- [ ] Notification & comments system

## 🔐 **API Endpoints (TODO)**

### **Authentication**
```
POST   /api/auth/login           # Login user
POST   /api/auth/register         # Register new user
POST   /api/auth/refresh          # Refresh JWT token
POST   /api/auth/logout           # Logout user
```

### **Projects**
```
GET    /api/projects              # List all projects (filtered by role)
GET    /api/projects/:id          # Get project detail
POST   /api/projects              # Create new project
PUT    /api/projects/:id          # Update project
DELETE /api/projects/:id          # Delete project
PATCH  /api/projects/:id/progress # Update project progress
```

### **Daily Reports**
```
GET    /api/daily-reports              # List daily reports
GET    /api/daily-reports/:id          # Get report detail
POST   /api/daily-reports              # Create daily report
PUT    /api/daily-reports/:id          # Update daily report
POST   /api/daily-reports/:id/photos   # Upload photos
```

### **Weekly Reports**
```
GET    /api/weekly-reports             # List weekly reports
GET    /api/weekly-reports/:id         # Get report detail
POST   /api/weekly-reports/generate    # Generate weekly report
GET    /api/weekly-reports/:id/pdf     # Download PDF report
```

### **Users (Admin Only)**
```
GET    /api/users                 # List all users
GET    /api/users/:id             # Get user detail
POST   /api/users                 # Create user
PUT    /api/users/:id             # Update user
DELETE /api/users/:id             # Delete user
```

## 📝 **Notes**

- Semua endpoint (kecuali login/register) memerlukan JWT token
- Akses endpoint dibatasi berdasarkan role user (RBAC)
- Soft delete digunakan untuk semua models (DeletedAt field)
- Timestamps otomatis (CreatedAt, UpdatedAt) untuk audit trail

## 🤝 **Kontribusi**

Project ini dikembangkan khusus untuk PT Unipro Indonesia.

## 📄 **License**

Private - Internal Use Only

