# PostgreSQL Setup Guide - Material Usage Tracking

## 📋 Overview

Dokumentasi lengkap untuk setup database PostgreSQL dan backend API untuk fitur Material Usage Tracking.

---

## 🗄️ Database Schema

### Table: `material_usage`

```sql
CREATE TABLE material_usage (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    daily_report_id INTEGER NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(15, 2) NOT NULL DEFAULT 0,
    usage_date DATE NOT NULL,
    used_by INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Columns Description

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key, auto-increment |
| `project_id` | INTEGER | Reference to projects table |
| `material_id` | INTEGER | Reference to materials table |
| `daily_report_id` | INTEGER | Optional reference to daily_reports |
| `quantity` | DECIMAL(10,2) | Quantity of material used |
| `cost` | DECIMAL(15,2) | Auto-calculated cost |
| `usage_date` | DATE | Date when material was used |
| `used_by` | INTEGER | User who recorded the usage |
| `notes` | TEXT | Additional notes |
| `created_at` | TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Foreign Keys

```sql
-- Projects (CASCADE delete)
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE

-- Materials (RESTRICT delete)
FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE RESTRICT

-- Daily Reports (SET NULL on delete)
FOREIGN KEY (daily_report_id) REFERENCES daily_reports(id) ON DELETE SET NULL

-- Users (RESTRICT delete)
FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE RESTRICT
```

### Indexes

```sql
-- Single column indexes
CREATE INDEX idx_material_usage_project_id ON material_usage(project_id);
CREATE INDEX idx_material_usage_material_id ON material_usage(material_id);
CREATE INDEX idx_material_usage_daily_report_id ON material_usage(daily_report_id);
CREATE INDEX idx_material_usage_usage_date ON material_usage(usage_date);
CREATE INDEX idx_material_usage_used_by ON material_usage(used_by);

-- Composite indexes for common queries
CREATE INDEX idx_material_usage_project_date ON material_usage(project_id, usage_date);
CREATE INDEX idx_material_usage_material_date ON material_usage(material_id, usage_date);
```

---

## 🔧 PostgreSQL Triggers

### 1. Auto-Calculate Cost

```sql
CREATE OR REPLACE FUNCTION calculate_material_usage_cost()
RETURNS TRIGGER AS $$
DECLARE
    unit_price DECIMAL(15, 2);
BEGIN
    SELECT unit_price INTO unit_price
    FROM materials
    WHERE id = NEW.material_id;
    
    NEW.cost = NEW.quantity * unit_price;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_material_usage_cost
    BEFORE INSERT OR UPDATE ON material_usage
    FOR EACH ROW
    EXECUTE FUNCTION calculate_material_usage_cost();
```

**Purpose**: Automatically calculates `cost = quantity × unit_price` before insert/update.

### 2. Auto-Update BOM

```sql
CREATE OR REPLACE FUNCTION update_bom_used_qty()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE bom
        SET 
            used_qty = used_qty + NEW.quantity,
            actual_cost = actual_cost + NEW.cost,
            remaining_qty = planned_qty - (used_qty + NEW.quantity)
        WHERE project_id = NEW.project_id 
            AND material_id = NEW.material_id;
    
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE bom
        SET 
            used_qty = used_qty - OLD.quantity + NEW.quantity,
            actual_cost = actual_cost - OLD.cost + NEW.cost,
            remaining_qty = planned_qty - (used_qty - OLD.quantity + NEW.quantity)
        WHERE project_id = NEW.project_id 
            AND material_id = NEW.material_id;
    
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE bom
        SET 
            used_qty = used_qty - OLD.quantity,
            actual_cost = actual_cost - OLD.cost,
            remaining_qty = planned_qty - (used_qty - OLD.quantity)
        WHERE project_id = OLD.project_id 
            AND material_id = OLD.material_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bom_used_qty
    AFTER INSERT OR UPDATE OR DELETE ON material_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_bom_used_qty();
```

**Purpose**: Automatically updates BOM `used_qty`, `actual_cost`, and `remaining_qty` when material usage changes.

### 3. Auto-Update Timestamp

```sql
CREATE OR REPLACE FUNCTION update_material_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_material_usage_updated_at
    BEFORE UPDATE ON material_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_material_usage_updated_at();
```

**Purpose**: Updates `updated_at` timestamp on every record update.

---

## 📊 Database View

### `v_material_usage_details`

```sql
CREATE OR REPLACE VIEW v_material_usage_details AS
SELECT 
    mu.id,
    mu.project_id,
    p.name AS project_name,
    mu.material_id,
    m.name AS material_name,
    m.code AS material_code,
    m.unit AS material_unit,
    m.unit_price AS material_unit_price,
    mu.daily_report_id,
    dr.report_date,
    dr.title AS report_title,
    mu.quantity,
    mu.cost,
    mu.usage_date,
    mu.used_by,
    u.full_name AS user_name,
    u.email AS user_email,
    mu.notes,
    mu.created_at,
    mu.updated_at
FROM material_usage mu
JOIN projects p ON mu.project_id = p.id
JOIN materials m ON mu.material_id = m.id
LEFT JOIN daily_reports dr ON mu.daily_report_id = dr.id
JOIN users u ON mu.used_by = u.id;
```

**Purpose**: Provides a denormalized view with all related data for easy querying.

---

## 🚀 Installation Steps

### 1. Run Migration

```bash
# Connect to PostgreSQL
psql -U your_username -d your_database

# Run migration file
\i backend/migrations/create_material_usage_table.sql

# Verify table creation
\dt material_usage

# Verify triggers
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'material_usage';

# Verify view
\dv v_material_usage_details
```

### 2. Verify Installation

```sql
-- Check table structure
\d material_usage

-- Check indexes
\di material_usage*

-- Check triggers
SELECT * FROM pg_trigger WHERE tgrelid = 'material_usage'::regclass;

-- Test view
SELECT * FROM v_material_usage_details LIMIT 5;
```

---

## 🔌 Backend API Endpoints

### Go (Gin Framework) Example

```go
package handlers

import (
    "database/sql"
    "net/http"
    "time"
    "github.com/gin-gonic/gin"
)

type MaterialUsage struct {
    ID             int       `json:"id"`
    ProjectID      int       `json:"project_id"`
    MaterialID     int       `json:"material_id"`
    DailyReportID  *int      `json:"daily_report_id"`
    Quantity       float64   `json:"quantity"`
    Cost           float64   `json:"cost"`
    UsageDate      string    `json:"usage_date"`
    UsedBy         int       `json:"used_by"`
    Notes          string    `json:"notes"`
    CreatedAt      time.Time `json:"created_at"`
    UpdatedAt      time.Time `json:"updated_at"`
}

// GET /api/v1/projects/:id/usage
func GetMaterialUsageByProject(c *gin.Context) {
    db := c.MustGet("db").(*sql.DB)
    projectID := c.Param("id")
    
    query := `
        SELECT 
            mu.*,
            json_build_object(
                'id', m.id,
                'name', m.name,
                'code', m.code,
                'unit', m.unit,
                'unit_price', m.unit_price
            ) as material,
            json_build_object(
                'id', u.id,
                'name', u.full_name
            ) as user
        FROM material_usage mu
        JOIN materials m ON mu.material_id = m.id
        JOIN users u ON mu.used_by = u.id
        WHERE mu.project_id = $1
        ORDER BY mu.usage_date DESC, mu.created_at DESC
    `
    
    rows, err := db.Query(query, projectID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer rows.Close()
    
    var usageList []MaterialUsage
    for rows.Next() {
        var usage MaterialUsage
        err := rows.Scan(&usage.ID, &usage.ProjectID, /* ... */)
        if err != nil {
            continue
        }
        usageList = append(usageList, usage)
    }
    
    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data": usageList,
    })
}

// POST /api/v1/material-usage
func CreateMaterialUsage(c *gin.Context) {
    db := c.MustGet("db").(*sql.DB)
    userID := c.GetInt("user_id") // From JWT middleware
    
    var input struct {
        ProjectID     int     `json:"project_id" binding:"required"`
        MaterialID    int     `json:"material_id" binding:"required"`
        DailyReportID *int    `json:"daily_report_id"`
        Quantity      float64 `json:"quantity" binding:"required,gt=0"`
        UsageDate     string  `json:"usage_date" binding:"required"`
        Notes         string  `json:"notes"`
    }
    
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    query := `
        INSERT INTO material_usage 
        (project_id, material_id, daily_report_id, quantity, usage_date, used_by, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, cost, created_at
    `
    
    var usage MaterialUsage
    err := db.QueryRow(
        query,
        input.ProjectID,
        input.MaterialID,
        input.DailyReportID,
        input.Quantity,
        input.UsageDate,
        userID,
        input.Notes,
    ).Scan(&usage.ID, &usage.Cost, &usage.CreatedAt)
    
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusCreated, gin.H{
        "success": true,
        "data": usage,
    })
}

// PUT /api/v1/material-usage/:id
func UpdateMaterialUsage(c *gin.Context) {
    db := c.MustGet("db").(*sql.DB)
    usageID := c.Param("id")
    
    var input struct {
        ProjectID     int     `json:"project_id" binding:"required"`
        MaterialID    int     `json:"material_id" binding:"required"`
        DailyReportID *int    `json:"daily_report_id"`
        Quantity      float64 `json:"quantity" binding:"required,gt=0"`
        UsageDate     string  `json:"usage_date" binding:"required"`
        Notes         string  `json:"notes"`
    }
    
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    query := `
        UPDATE material_usage
        SET 
            project_id = $1,
            material_id = $2,
            daily_report_id = $3,
            quantity = $4,
            usage_date = $5,
            notes = $6
        WHERE id = $7
        RETURNING cost, updated_at
    `
    
    var cost float64
    var updatedAt time.Time
    err := db.QueryRow(
        query,
        input.ProjectID,
        input.MaterialID,
        input.DailyReportID,
        input.Quantity,
        input.UsageDate,
        input.Notes,
        usageID,
    ).Scan(&cost, &updatedAt)
    
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "message": "Material usage updated successfully",
    })
}

// DELETE /api/v1/material-usage/:id
func DeleteMaterialUsage(c *gin.Context) {
    db := c.MustGet("db").(*sql.DB)
    usageID := c.Param("id")
    
    query := `DELETE FROM material_usage WHERE id = $1`
    
    result, err := db.Exec(query, usageID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    rowsAffected, _ := result.RowsAffected()
    if rowsAffected == 0 {
        c.JSON(http.StatusNotFound, gin.H{"error": "Material usage not found"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "message": "Material usage deleted successfully",
    })
}
```

---

## 📝 API Routes Registration

```go
// routes/material_usage.go
func RegisterMaterialUsageRoutes(router *gin.RouterGroup, db *sql.DB) {
    router.Use(AuthMiddleware()) // JWT authentication
    
    // Get usage by project
    router.GET("/projects/:id/usage", GetMaterialUsageByProject)
    
    // CRUD operations
    router.POST("/material-usage", CreateMaterialUsage)
    router.PUT("/material-usage/:id", UpdateMaterialUsage)
    router.DELETE("/material-usage/:id", DeleteMaterialUsage)
}
```

---

## 🧪 Testing Queries

### 1. Get All Usage for Project

```sql
SELECT * FROM v_material_usage_details 
WHERE project_id = 1 
ORDER BY usage_date DESC;
```

### 2. Get Usage Summary by Material

```sql
SELECT 
    m.name AS material_name,
    m.code AS material_code,
    SUM(mu.quantity) AS total_quantity,
    SUM(mu.cost) AS total_cost,
    COUNT(*) AS usage_count
FROM material_usage mu
JOIN materials m ON mu.material_id = m.id
WHERE mu.project_id = 1
GROUP BY m.id, m.name, m.code
ORDER BY total_cost DESC;
```

### 3. Get Usage by Date Range

```sql
SELECT * FROM material_usage
WHERE project_id = 1
    AND usage_date BETWEEN '2025-01-01' AND '2025-01-31'
ORDER BY usage_date, created_at;
```

### 4. Check BOM vs Usage

```sql
SELECT 
    b.id,
    m.name AS material_name,
    b.planned_qty,
    b.used_qty,
    b.remaining_qty,
    ROUND((b.used_qty / NULLIF(b.planned_qty, 0) * 100), 2) AS usage_percentage
FROM bom b
JOIN materials m ON b.material_id = m.id
WHERE b.project_id = 1
ORDER BY usage_percentage DESC;
```

### 5. Get Top Material Consumers

```sql
SELECT 
    u.full_name,
    COUNT(mu.id) AS total_records,
    SUM(mu.quantity) AS total_quantity,
    SUM(mu.cost) AS total_cost
FROM material_usage mu
JOIN users u ON mu.used_by = u.id
WHERE mu.project_id = 1
GROUP BY u.id, u.full_name
ORDER BY total_cost DESC;
```

---

## 🔒 Security Considerations

### 1. Row-Level Security (Optional)

```sql
-- Enable RLS
ALTER TABLE material_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see usage from their assigned projects
CREATE POLICY material_usage_select_policy ON material_usage
    FOR SELECT
    USING (
        project_id IN (
            SELECT project_id FROM user_projects 
            WHERE user_id = current_user_id()
        )
    );

-- Policy: Users can only insert/update/delete their own records
CREATE POLICY material_usage_modify_policy ON material_usage
    FOR ALL
    USING (used_by = current_user_id());
```

### 2. Audit Trail

```sql
-- Create audit table
CREATE TABLE material_usage_audit (
    audit_id SERIAL PRIMARY KEY,
    operation VARCHAR(10) NOT NULL,
    usage_id INTEGER,
    old_data JSONB,
    new_data JSONB,
    changed_by INTEGER,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_material_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO material_usage_audit (operation, usage_id, new_data, changed_by)
        VALUES ('INSERT', NEW.id, row_to_json(NEW)::jsonb, NEW.used_by);
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO material_usage_audit (operation, usage_id, old_data, new_data, changed_by)
        VALUES ('UPDATE', NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, NEW.used_by);
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO material_usage_audit (operation, usage_id, old_data, changed_by)
        VALUES ('DELETE', OLD.id, row_to_json(OLD)::jsonb, OLD.used_by);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit trigger
CREATE TRIGGER trigger_audit_material_usage
    AFTER INSERT OR UPDATE OR DELETE ON material_usage
    FOR EACH ROW
    EXECUTE FUNCTION audit_material_usage();
```

---

## 📊 Performance Optimization

### 1. Analyze Query Performance

```sql
EXPLAIN ANALYZE
SELECT * FROM v_material_usage_details
WHERE project_id = 1
ORDER BY usage_date DESC
LIMIT 50;
```

### 2. Update Statistics

```sql
ANALYZE material_usage;
```

### 3. Vacuum Table

```sql
VACUUM ANALYZE material_usage;
```

---

## 🔄 Backup & Restore

### Backup

```bash
# Backup specific table
pg_dump -U username -d database_name -t material_usage > material_usage_backup.sql

# Backup with data
pg_dump -U username -d database_name -t material_usage --data-only > material_usage_data.sql
```

### Restore

```bash
psql -U username -d database_name < material_usage_backup.sql
```

---

## 📈 Monitoring Queries

### 1. Check Table Size

```sql
SELECT 
    pg_size_pretty(pg_total_relation_size('material_usage')) AS total_size,
    pg_size_pretty(pg_relation_size('material_usage')) AS table_size,
    pg_size_pretty(pg_indexes_size('material_usage')) AS indexes_size;
```

### 2. Check Row Count

```sql
SELECT COUNT(*) FROM material_usage;
```

### 3. Check Recent Activity

```sql
SELECT 
    usage_date,
    COUNT(*) AS records_count,
    SUM(quantity) AS total_quantity,
    SUM(cost) AS total_cost
FROM material_usage
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY usage_date
ORDER BY usage_date DESC;
```

---

## ✅ Checklist

- [ ] Run migration script
- [ ] Verify table creation
- [ ] Test all triggers
- [ ] Check view creation
- [ ] Create indexes
- [ ] Implement backend API endpoints
- [ ] Test API with Postman/curl
- [ ] Set up authentication middleware
- [ ] Implement authorization checks
- [ ] Add error handling
- [ ] Create audit trail (optional)
- [ ] Set up monitoring
- [ ] Document API endpoints
- [ ] Test integration with frontend

---

**Last Updated**: January 2025  
**Database**: PostgreSQL 12+  
**Compatibility**: PostgreSQL 12, 13, 14, 15, 16

