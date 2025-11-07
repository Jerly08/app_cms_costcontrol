# Material Usage Tracking - Complete Implementation Guide

## Overview
The Material Usage Tracking feature provides comprehensive functionality to record material consumption, link usage to daily reports, and compare actual usage against BOM planned quantities.

## File Location
- **Main Page**: `frontend/pages/materials/usage-tracking.tsx`
- **API Configuration**: `frontend/lib/api.ts` (materialUsageAPI section)

## Key Features

### 1. **Material Consumption Recording**
- Record material usage with quantity, date, and optional daily report linkage
- Full CRUD operations (Create, Read, Update, Delete)
- Automatic cost calculation based on material unit price
- Validation for all input fields
- Link usage records to specific daily reports for traceability

### 2. **BOM Comparison View**
- Side-by-side comparison of planned vs actual usage
- Real-time calculation of usage percentages
- Visual indicators for usage status:
  - 🟢 **Green (On Track)**: Usage < 80%
  - 🟠 **Orange (Warning)**: Usage 80-99%
  - 🔴 **Red (Over Budget)**: Usage ≥ 100%
- Remaining quantity calculations with color coding
- Phase-based tracking for construction stages

### 3. **Advanced Filtering & Search**
- **Material Filter**: Filter by specific material
- **Date Range Filter**: From date and to date selection
- **Search**: Search by material name, code, or notes
- **Clear Filters**: Quick reset of all filters

### 4. **Detailed Usage Records**
- View detailed information for each usage record
- Shows material details, quantity, cost, date
- Linked daily report information
- User who recorded the usage
- Creation timestamp

### 5. **Data Management**
- **Add Usage**: Modal form with validations
- **Edit Usage**: Pre-populated form for modifications
- **Delete Usage**: Confirmation dialog to prevent accidental deletion
- **Auto-refresh**: BOM data refreshes after usage operations

## Data Structure

### MaterialUsage Interface
```typescript
interface MaterialUsage {
  id: number;
  project_id: number;
  material_id: number;
  material: {
    name: string;
    code: string;
    unit: string;
    unit_price: number;
  };
  daily_report_id?: number;
  daily_report?: any;
  quantity: number;
  cost: number;
  usage_date: string;
  used_by: number;
  user: {
    name: string;
  };
  notes: string;
  created_at: string;
}
```

### BOMItem Interface
```typescript
interface BOMItem {
  id: number;
  material_id: number;
  material: any;
  planned_qty: number;
  used_qty: number;
  remaining_qty: number;
  estimated_cost: number;
  actual_cost: number;
  phase: string;
}
```

## API Endpoints

### Material Usage API
```typescript
materialUsageAPI = {
  // Get all usage records for a project
  getByProject: (projectId: string) => GET /projects/:id/usage
  
  // Create new usage record
  create: (usageData) => POST /material-usage
  
  // Update existing usage record
  update: (id: string, usageData) => PUT /material-usage/:id
  
  // Delete usage record
  delete: (id: string) => DELETE /material-usage/:id
}
```

### Request/Response Examples

#### Create Usage Record
```json
// Request
POST /material-usage
{
  "project_id": 1,
  "material_id": 5,
  "quantity": 100.5,
  "usage_date": "2025-01-15",
  "daily_report_id": 23,
  "notes": "Used for foundation work"
}

// Response
{
  "success": true,
  "data": {
    "id": 45,
    "project_id": 1,
    "material_id": 5,
    "quantity": 100.5,
    "cost": 5025000,
    "usage_date": "2025-01-15",
    "daily_report_id": 23,
    "notes": "Used for foundation work",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

## UI Components

### 1. View Mode Toggle
- **Usage List**: Displays all usage records in table format
- **BOM Comparison**: Shows planned vs actual comparison

### 2. Summary Cards
- **Total Records**: Count of usage records
- **Total Cost**: Sum of all usage costs

### 3. Usage List Table
Columns:
- Date
- Material (name and code)
- Quantity (with unit)
- Cost
- Daily Report (linked report badge)
- Used By (user name)
- Actions (View, Edit, Delete)

### 4. BOM Comparison Table
Columns:
- Material (name and code)
- Phase
- Planned Qty
- Used Qty
- Remaining Qty (color-coded)
- Usage % (color-coded badge)
- Status (On Track/Warning/Over Budget)

### 5. Modals

#### Add/Edit Usage Modal
Fields:
- **Material**: Dropdown (required)
- **Quantity Used**: Number input (required, min: 0)
- **Usage Date**: Date picker (required)
- **Link to Daily Report**: Dropdown (optional)
- **Notes**: Textarea (optional)

#### Detail Modal
Shows:
- Material name and code
- Quantity used with unit
- Cost
- Usage date (formatted)
- Linked daily report
- Recorded by user
- Notes
- Creation timestamp

#### Delete Confirmation Modal
- Warning message
- Confirmation buttons

## Usage Workflow

### Recording Material Usage
1. Select project from dropdown
2. Click "Record Usage" button
3. Fill in the form:
   - Select material
   - Enter quantity used
   - Select usage date
   - Optionally link to daily report
   - Add notes if needed
4. Click "Record Usage" to save
5. System automatically:
   - Calculates cost based on material unit price
   - Updates BOM used_qty
   - Refreshes both usage list and BOM comparison

### Viewing BOM Comparison
1. Select project
2. Click "BOM Comparison" tab
3. View comparison table showing:
   - Planned quantities from BOM
   - Actual usage from recorded consumption
   - Remaining quantities
   - Usage percentages
   - Status indicators

### Editing Usage Record
1. Find record in usage list
2. Click edit icon (pencil)
3. Modify fields in pre-populated form
4. Click "Update Usage"
5. BOM data refreshes automatically

### Deleting Usage Record
1. Click delete icon (trash)
2. Confirm deletion
3. Record removed and BOM recalculated

## Calculations

### Usage Percentage
```typescript
usagePercentage = (used_qty / planned_qty) * 100
```

### Remaining Quantity
```typescript
remaining_qty = planned_qty - used_qty
```

### Cost Calculation
```typescript
cost = quantity * material.unit_price
```

## Color Coding System

### Usage Percentage Badges
- **Green**: 0-79% (On Track)
- **Orange**: 80-99% (Warning)
- **Red**: 100%+ (Over Budget)

### Remaining Quantity Text
- **Green**: Positive remaining
- **Gray**: Zero remaining
- **Red Bold**: Negative (over budget)

## Filtering & Search

### Available Filters
1. **Material Filter**: Select specific material
2. **Date Range**: 
   - From Date
   - To Date
3. **Search Query**: Full-text search in:
   - Material name
   - Material code
   - Notes

### Filter Logic
All filters are cumulative (AND logic):
```typescript
filteredUsage = usageList.filter(usage => {
  if (filterMaterial && usage.material_id !== parseInt(filterMaterial)) 
    return false;
  if (filterDateFrom && usage.usage_date < filterDateFrom) 
    return false;
  if (filterDateTo && usage.usage_date > filterDateTo) 
    return false;
  if (searchQuery && !matches(usage, searchQuery)) 
    return false;
  return true;
});
```

## State Management

### Main States
- `usageList`: Array of usage records
- `bomItems`: Array of BOM items for comparison
- `selectedProject`: Currently selected project ID
- `viewMode`: 'list' or 'comparison'
- `loading`: Loading indicator
- `submitting`: Form submission state

### Modal States
- `showAddModal`: Add usage form
- `showEditModal`: Edit usage form
- `showDetailModal`: View usage details
- `showDeleteModal`: Delete confirmation

### Filter States
- `filterMaterial`: Selected material filter
- `filterDateFrom`: Start date filter
- `filterDateTo`: End date filter
- `searchQuery`: Search text

## Validation Rules

### Form Validations
1. **Material**: Required, must be selected
2. **Quantity**: 
   - Required
   - Must be positive number
   - Allows decimals (step: 0.01)
3. **Usage Date**: Required, valid date format
4. **Daily Report**: Optional
5. **Notes**: Optional, text field

### Error Handling
- Network errors caught and displayed
- Validation errors shown in form
- User-friendly error messages
- Automatic error dismissal on retry

## Responsive Design

### Mobile Optimizations
- Stack filters vertically on small screens
- Horizontal scrolling for tables
- Touch-friendly action buttons
- Modal full-height on mobile
- Adjusted padding and spacing

### Breakpoints
- `sm`: 640px - Stack certain elements
- `md`: 768px - Side navigation appears
- `lg`: 1024px - Optimal desktop layout

## Performance Optimizations

### Data Fetching
- Fetch on project selection
- Lazy load daily reports
- Cache materials list
- Debounced search (optional enhancement)

### Re-rendering
- Use React.memo for list items (optional)
- Efficient filter computation
- Minimal state updates

## Integration Points

### Links to Other Features
1. **BOM Management**: Uses BOM data for comparison
2. **Daily Reports**: Links usage to specific reports
3. **Materials Master**: Uses material data and pricing
4. **Projects**: Project-based filtering

### Data Flow
```
Projects → Select Project
    ↓
Materials Usage API → Fetch usage records
    ↓
BOM API → Fetch BOM comparison data
    ↓
Daily Reports API → Fetch available reports
    ↓
Display in UI (List or Comparison view)
```

## Security Considerations

### Authentication
- Page requires authentication (redirects to login)
- JWT token sent with all API requests
- Token stored in localStorage

### Authorization
- User must have access to the project
- Only authorized users can create/edit/delete
- used_by field automatically set to current user

## Future Enhancements (Optional)

1. **Bulk Import**: Upload Excel file with multiple usage records
2. **Export to Excel**: Download usage data as spreadsheet
3. **Usage Analytics**: Charts and graphs for usage trends
4. **Alerts**: Notifications when approaching BOM limits
5. **Photo Attachments**: Attach photos to usage records
6. **Approval Workflow**: Require approval for usage records
7. **Barcode Scanning**: Scan materials for quick recording
8. **Real-time Updates**: WebSocket for live updates
9. **Advanced Search**: More filter options (phase, user, etc.)
10. **Usage History**: Timeline view of material consumption

## Testing Checklist

### Functional Tests
- ✅ Record new usage
- ✅ Edit existing usage
- ✅ Delete usage with confirmation
- ✅ View usage details
- ✅ Link to daily report
- ✅ Filter by material
- ✅ Filter by date range
- ✅ Search functionality
- ✅ Clear filters
- ✅ Switch between list and comparison views
- ✅ BOM calculations accurate
- ✅ Usage percentage correct
- ✅ Color coding appropriate

### Edge Cases
- ✅ Empty usage list
- ✅ No BOM data available
- ✅ Over-budget scenarios
- ✅ Zero planned quantity
- ✅ Negative dates
- ✅ Large numbers
- ✅ Special characters in notes

### UI/UX Tests
- ✅ Responsive on mobile
- ✅ Loading states displayed
- ✅ Error messages clear
- ✅ Modals closeable
- ✅ Forms validated
- ✅ Buttons disabled during submission
- ✅ Tooltips helpful

## Troubleshooting

### Common Issues

#### 1. Usage records not showing
- Check if project is selected
- Verify API endpoint is correct
- Check authentication token
- Inspect browser console for errors

#### 2. BOM comparison not updating
- Ensure BOM data exists for project
- Check if used_qty is being updated in backend
- Refresh the page
- Verify API is returning updated data

#### 3. Form submission fails
- Check required fields are filled
- Verify data formats (numbers, dates)
- Check network connectivity
- Inspect API error response

#### 4. Filters not working
- Clear browser cache
- Check filter state values
- Verify filter logic
- Test with simple filter first

## Summary

The Material Usage Tracking feature provides:
- ✅ Complete CRUD operations for material consumption
- ✅ Daily report integration for traceability
- ✅ Real-time BOM vs actual comparison
- ✅ Advanced filtering and search
- ✅ Visual indicators for over-budget warnings
- ✅ Responsive mobile-friendly design
- ✅ Comprehensive validation and error handling
- ✅ Detailed usage history and analytics

This feature helps project managers:
- Track material consumption accurately
- Identify over-budget situations early
- Link material usage to daily activities
- Make data-driven procurement decisions
- Maintain accountability with user tracking
- Generate usage reports for stakeholders

---

**Implementation Status**: ✅ Complete
**Last Updated**: January 2025
**Version**: 1.0.0

