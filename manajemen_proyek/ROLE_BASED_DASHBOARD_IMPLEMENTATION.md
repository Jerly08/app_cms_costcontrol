# Role-Based Dashboard Implementation

## Overview
Implementasi sistem dashboard berbasis role untuk Project Management CCMS. Setiap role user akan melihat dashboard yang sesuai dengan tugas dan tanggung jawabnya.

## Struktur Komponen Dashboard

### 1. CEO / Director Dashboard
**File:** `frontend/components/dashboards/CEODashboard.tsx`

**Fitur:**
- Executive summary dengan key metrics:
  - Total Projects
  - Total Budget
  - Active Approvals
  - Performance Score
- Charts & Analytics:
  - Project Overview (Bar Chart)
  - Budget Distribution (Pie Chart)
  - Performance Trends (Line Chart)
- Pending Approvals List
- Projects Overview Table
- Recent Activities Timeline

**API Endpoint:** `GET /api/dashboard/role`

---

### 2. Cost Control Dashboard
**File:** `frontend/components/dashboards/CostControlDashboard.tsx`

**Fitur:**
- Cost Analysis Cards:
  - Total Material Cost
  - Budget Variance
  - Cost Savings
  - Materials Tracked
- Material Cost Analysis Chart
- Budget Variance by Project
- Low Stock Alerts
- Materials Summary Table

**API Endpoint:** `GET /api/dashboard/role`

---

### 3. Purchasing Dashboard
**File:** `frontend/components/dashboards/PurchasingDashboard.tsx`

**Fitur:**
- Procurement Stats:
  - My PRs
  - Pending Approvals
  - Approved This Month
  - Low Stock Alerts
- Quick Actions:
  - Create New PR
  - View All PRs
  - Material Catalog
- My Recent Purchase Requests
- Pending Approvals for Me
- Low Stock Materials Alert

**API Endpoint:** `GET /api/dashboard/role`

---

### 4. Tim Lapangan Dashboard
**File:** `frontend/components/dashboards/TimLapanganDashboard.tsx`

**Fitur:**
- Field Operations Stats:
  - Reports This Month
  - Photos Uploaded
  - Active Projects
  - Materials Used Today
- Today's Action Required:
  - Daily Report Submission Status
- Quick Actions:
  - Create Daily Report
  - View My Reports
  - Upload Photos
- My Recent Reports
- Active Projects List

**API Endpoint:** `GET /api/dashboard/role`

---

## Implementasi di Main Dashboard

**File:** `frontend/pages/index.tsx`

### Role Mapping Logic:
```typescript
const renderDashboardContent = () => {
  const userRole = user?.role?.toLowerCase();

  // CEO and Director
  if (userRole === 'ceo' || userRole === 'director') {
    return <CEODashboard />;
  }

  // Cost Control
  if (userRole === 'cost control' || userRole === 'cost_control') {
    return <CostControlDashboard />;
  }

  // Purchasing
  if (userRole === 'purchasing') {
    return <PurchasingDashboard />;
  }

  // Tim Lapangan
  if (userRole === 'tim lapangan' || userRole === 'tim_lapangan' || userRole === 'field') {
    return <TimLapanganDashboard />;
  }

  // Default dashboard for Manager and other roles
  return <DefaultDashboard />;
};
```

---

## Backend Requirements

### API Endpoint yang Diperlukan:

#### 1. Role-Based Dashboard Data
```
GET /api/dashboard/role
Authorization: Bearer <token>

Response:
{
  "stats": {
    // Role-specific statistics
  },
  "charts": {
    // Chart data
  },
  "tables": {
    // Table data
  },
  "alerts": [
    // Alerts/notifications
  ]
}
```

#### 2. Data Structures per Role:

**CEO/Director:**
```json
{
  "stats": {
    "total_projects": 15,
    "total_budget": 50000000000,
    "active_approvals": 8,
    "performance_score": 87.5
  },
  "charts": {
    "project_overview": [...],
    "budget_distribution": [...],
    "performance_trends": [...]
  },
  "pending_approvals": [...],
  "projects": [...],
  "activities": [...]
}
```

**Cost Control:**
```json
{
  "stats": {
    "total_material_cost": 5000000000,
    "budget_variance": 2.5,
    "cost_savings": 250000000,
    "materials_tracked": 150
  },
  "charts": {
    "material_costs": [...],
    "budget_variance": [...]
  },
  "low_stock_alerts": [...],
  "materials": [...]
}
```

**Purchasing:**
```json
{
  "stats": {
    "my_prs": 12,
    "pending_approvals": 5,
    "approved_this_month": 25,
    "low_stock_items": 8
  },
  "my_purchase_requests": [...],
  "pending_approvals": [...],
  "low_stock_materials": [...]
}
```

**Tim Lapangan:**
```json
{
  "stats": {
    "monthly_reports": 20,
    "total_photos": 150,
    "active_projects": 3,
    "materials_used_today": 15,
    "has_today_report": false
  },
  "my_reports": [...],
  "my_projects": [...]
}
```

---

## Testing Checklist

### Frontend Testing:
- [ ] CEO role displays CEODashboard
- [ ] Director role displays CEODashboard
- [ ] Cost Control role displays CostControlDashboard
- [ ] Purchasing role displays PurchasingDashboard
- [ ] Tim Lapangan role displays TimLapanganDashboard
- [ ] Other roles display default dashboard
- [ ] Loading states work correctly
- [ ] Error handling works properly

### Backend Testing:
- [ ] `/api/dashboard/role` returns correct data for each role
- [ ] Authentication is required
- [ ] Role-based authorization works
- [ ] Data is filtered based on user permissions
- [ ] Performance is acceptable for large datasets

---

## Next Steps

### Backend Implementation Required:
1. **Create role-based middleware** untuk authorization
2. **Implement `/api/dashboard/role` endpoint** dengan logic per role
3. **Implement Daily Report handlers:**
   - Create daily report
   - Get daily reports
   - Update daily report
   - Delete daily report
   - Upload photos for daily report
4. **Implement Weekly Report handlers:**
   - Auto-generate weekly report
   - Get weekly reports
   - Update weekly report
   - Delete weekly report
   - Generate PDF for weekly report
5. **Add routes** di `backend/main.go` untuk daily/weekly reports
6. **Implement PDF generator** untuk weekly reports

### Frontend Enhancements:
1. Add error boundaries for dashboard components
2. Implement data caching untuk improve performance
3. Add export functionality untuk each dashboard
4. Implement real-time updates menggunakan WebSocket
5. Add unit tests untuk dashboard components

---

## Files Modified/Created

### Created:
- `frontend/components/dashboards/CEODashboard.tsx`
- `frontend/components/dashboards/CostControlDashboard.tsx`
- `frontend/components/dashboards/PurchasingDashboard.tsx`
- `frontend/components/dashboards/TimLapanganDashboard.tsx`

### Modified:
- `frontend/pages/index.tsx` - Added role-based rendering logic

---

## Notes
- Semua dashboard components menggunakan `dashboardAPI.getRoleDashboard()` untuk fetch data
- Backend harus return data sesuai dengan role user yang login
- Default dashboard tetap digunakan untuk Manager dan role lainnya
- Setiap dashboard sudah include loading states dan error handling
- Responsive design sudah diimplementasikan untuk mobile/tablet/desktop

---

## Author
Jeremia Kaligis  
Date: 2025

