# Material Usage Tracking - Quick Reference Guide

## 🚀 Quick Start

### Access the Page
```
URL: /materials/usage-tracking
File: frontend/pages/materials/usage-tracking.tsx
```

### Basic Usage
1. Select a project
2. View usage list or BOM comparison
3. Record material usage
4. Track against planned quantities

---

## 📋 API Endpoints Quick Reference

```typescript
// Get usage by project
GET /api/v1/projects/:id/usage

// Create usage record
POST /api/v1/material-usage
{
  "project_id": 1,
  "material_id": 5,
  "quantity": 100.5,
  "usage_date": "2025-01-15",
  "daily_report_id": 23,  // optional
  "notes": "Foundation work"  // optional
}

// Update usage record
PUT /api/v1/material-usage/:id
{
  // same payload as create
}

// Delete usage record
DELETE /api/v1/material-usage/:id
```

---

## 🎨 Key Components

### View Modes
- **Usage List**: Table of all usage records
- **BOM Comparison**: Planned vs Actual

### Modals
- **Add Modal**: Record new usage
- **Edit Modal**: Update existing usage
- **Detail Modal**: View usage details
- **Delete Modal**: Confirm deletion

### Filters
- Material dropdown
- Date from/to
- Search text
- Clear all filters

---

## 📊 Calculations

```typescript
// Usage Percentage
usagePercent = (used_qty / planned_qty) * 100

// Remaining Quantity
remaining = planned_qty - used_qty

// Cost
cost = quantity * material.unit_price
```

---

## 🎨 Color Indicators

### Usage Status
- 🟢 **Green**: < 80% (On Track)
- 🟠 **Orange**: 80-99% (Warning)
- 🔴 **Red**: ≥ 100% (Over Budget)

### Remaining Quantity
- 🟢 **Green**: Positive
- ⚫ **Gray**: Zero
- 🔴 **Red Bold**: Negative

---

## 🔧 Props & State

### Main State
```typescript
const [usageList, setUsageList] = useState<MaterialUsage[]>([]);
const [bomItems, setBomItems] = useState<BOMItem[]>([]);
const [selectedProject, setSelectedProject] = useState<string>('');
const [viewMode, setViewMode] = useState<'list' | 'comparison'>('list');
```

### Form Data
```typescript
const [formData, setFormData] = useState({
  material_id: '',
  quantity: '',
  usage_date: new Date().toISOString().split('T')[0],
  daily_report_id: '',
  notes: '',
});
```

---

## ⚡ Key Functions

### CRUD Operations
```typescript
// Create
handleAddUsage(e: React.FormEvent)

// Read
fetchUsageByProject(projectId: string)
fetchBOMByProject(projectId: string)

// Update
handleEditUsage(e: React.FormEvent)

// Delete
handleDelete()
```

### Utilities
```typescript
calculateUsagePercentage(planned: number, used: number): number
getUsageColor(percentage: number): string
getRemainingColor(remaining: number): string
```

---

## 🔍 Filtering Logic

```typescript
const filteredUsage = usageList.filter(usage => {
  // Material filter
  if (filterMaterial && usage.material_id !== parseInt(filterMaterial)) 
    return false;
  
  // Date range filter
  if (filterDateFrom && usage.usage_date < filterDateFrom) 
    return false;
  if (filterDateTo && usage.usage_date > filterDateTo) 
    return false;
  
  // Search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    const matches = 
      usage.material?.name?.toLowerCase().includes(query) ||
      usage.material?.code?.toLowerCase().includes(query) ||
      usage.notes?.toLowerCase().includes(query);
    if (!matches) return false;
  }
  
  return true;
});
```

---

## ✅ Validation Rules

```typescript
// Material - Required
if (!formData.material_id) {
  throw new Error('Please select a material');
}

// Quantity - Required, Positive
if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
  throw new Error('Please enter a valid quantity');
}

// Date - Required
if (!formData.usage_date) {
  throw new Error('Please select usage date');
}
```

---

## 🧪 Testing Commands

```bash
# Run development server
npm run dev

# Access the page
# http://localhost:3000/materials/usage-tracking

# Test with sample data
# 1. Login as user
# 2. Select a project
# 3. Record usage
# 4. View BOM comparison
```

---

## 🐛 Common Debugging

### Check API Calls
```javascript
// Open browser console (F12)
// Look for network requests to:
// - /api/v1/projects/:id/usage
// - /api/v1/material-usage
// - /api/v1/projects/:id/bom
```

### Check State
```javascript
// Add console.log in component
console.log('Usage List:', usageList);
console.log('BOM Items:', bomItems);
console.log('Selected Project:', selectedProject);
```

### Check Authentication
```javascript
// Verify token exists
const token = localStorage.getItem('token');
console.log('Token:', token);
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 640px) { /* sm */ }

/* Tablet */
@media (min-width: 641px) and (max-width: 768px) { /* md */ }

/* Desktop */
@media (min-width: 769px) { /* lg */ }
```

---

## 🔐 Security Checklist

- ✅ Authentication required (JWT token)
- ✅ Token sent with all API requests
- ✅ User validation on backend
- ✅ CORS configured properly
- ✅ Input validation on frontend
- ✅ SQL injection prevention on backend

---

## 📦 Dependencies

```json
{
  "react": "^18.x",
  "next": "^14.x",
  "lucide-react": "^0.x",
  "tailwindcss": "^3.x"
}
```

---

## 🎯 Performance Tips

1. **Lazy Loading**: Load daily reports only when needed
2. **Memoization**: Use React.memo for list items
3. **Debouncing**: Add debounce to search input
4. **Pagination**: Implement for large datasets
5. **Caching**: Cache materials and projects list

---

## 🚨 Error Messages

```typescript
// Common error messages
const ERRORS = {
  NO_MATERIAL: 'Please select a material',
  INVALID_QUANTITY: 'Please enter a valid quantity',
  NO_DATE: 'Please select usage date',
  NETWORK_ERROR: 'Failed to record material usage',
  DELETE_ERROR: 'Failed to delete material usage',
};
```

---

## 📊 Summary Stats

```typescript
// Total records
const totalRecords = filteredUsage.length;

// Total cost
const totalCost = filteredUsage.reduce(
  (sum, usage) => sum + (usage.cost || 0), 
  0
);

// Usage by material
const usageByMaterial = filteredUsage.reduce((acc, usage) => {
  const materialId = usage.material_id;
  acc[materialId] = (acc[materialId] || 0) + usage.quantity;
  return acc;
}, {});
```

---

## 🔗 Integration Points

### BOM Management
- Uses BOM data for comparison
- Updates used_qty when recording usage

### Daily Reports
- Links usage to specific reports
- Provides traceability

### Materials Master
- Uses material data and pricing
- References material units

### Projects
- Project-based filtering
- Multi-project support

---

## 💡 Pro Tips

1. **Always link to daily reports** for better traceability
2. **Use notes field** to document special cases
3. **Check BOM comparison regularly** to catch over-budget early
4. **Filter by date range** for periodic reviews
5. **Export data** before making bulk changes

---

## 📝 Code Snippets

### Add Usage Programmatically
```typescript
const usageData = {
  project_id: 1,
  material_id: 5,
  quantity: 100.5,
  usage_date: '2025-01-15',
  daily_report_id: 23,
  notes: 'Foundation work'
};

await materialUsageAPI.create(usageData);
```

### Calculate Total Usage for Material
```typescript
const getTotalUsage = (materialId: number) => {
  return usageList
    .filter(u => u.material_id === materialId)
    .reduce((sum, u) => sum + u.quantity, 0);
};
```

### Check if Over Budget
```typescript
const isOverBudget = (bomItem: BOMItem) => {
  return bomItem.used_qty > bomItem.planned_qty;
};
```

---

**Quick Links:**
- [Full Documentation](./MATERIAL_USAGE_TRACKING_COMPLETE.md)
- [Main Page](./frontend/pages/materials/usage-tracking.tsx)
- [API Configuration](./frontend/lib/api.ts)

---

**Last Updated**: January 2025
**Version**: 1.0.0

