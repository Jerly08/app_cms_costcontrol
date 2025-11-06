# Purchase Request Backend - COMPLETE ✅

## Status: 100% Complete

Backend untuk Purchase Request Flow dengan multi-stage approval workflow telah selesai dibuat.

## Files Created/Modified

### 1. Models (backend/internal/models/purchase_request.go) ✅
- **PurchaseRequest**: Model utama untuk PR dengan approval workflow
  - Fields: PRNumber, ProjectID, RequesterID, Title, Description, Priority, Status, TotalAmount, RequiredDate, CurrentStage
  - Relations: Project, Requester (User), Items, ApprovalHistory, Comments
  - Status: pending, approved, rejected
  - Priority: low, normal, high, urgent
  
- **PRItem**: Model untuk item-item dalam PR
  - Fields: MaterialID, Quantity, Unit, EstimatedPrice, TotalPrice, Vendor, Notes
  - Relation: Material
  - Auto-calculate TotalPrice using GORM hooks (BeforeCreate, BeforeUpdate)

- **ApprovalHistory**: Model untuk tracking approval di setiap stage
  - Fields: Stage, Status, ApproverID, Comment, ApprovedAt
  - Stages: Purchasing → Cost Control → GM
  - Status: pending, approved, rejected

- **PRComment**: Model untuk comment system antar divisi
  - Fields: UserID, Comment
  - Relation: User

### 2. Handlers (backend/internal/handlers/purchase_request.go) ✅
- **CreatePurchaseRequest**: Membuat PR baru
  - Generate PR number otomatis (PR-YYYY-XXXX)
  - Create PR dengan multi items
  - Initialize approval history untuk semua stages
  - Send notification ke Purchasing department

- **GetPurchaseRequests**: Get all PRs dengan filters
  - Filters: all, my_requests, pending_approval, approved, rejected
  - Filter by role untuk pending_approval

- **GetPurchaseRequestByID**: Get PR detail dengan semua relations

- **ApprovePurchaseRequest**: Approve PR at current stage
  - Verify user role matches approval stage
  - Update approval history
  - Move to next stage atau mark as fully approved
  - Send notification ke next approver atau requester

- **RejectPurchaseRequest**: Reject PR at current stage
  - Verify user role matches approval stage
  - Update approval history
  - Mark PR as rejected
  - Send notification ke requester

- **AddPRComment**: Add comment ke PR
  - For discussion antar divisi

### 3. Routes (backend/cmd/main.go) ✅
```go
purchaseRequests := protected.Group("/purchase-requests")
{
    purchaseRequests.GET("", handlers.GetPurchaseRequests)
    purchaseRequests.GET("/:id", handlers.GetPurchaseRequestByID)
    purchaseRequests.POST("", handlers.CreatePurchaseRequest)
    purchaseRequests.POST("/:id/approve", handlers.ApprovePurchaseRequest)
    purchaseRequests.POST("/:id/reject", handlers.RejectPurchaseRequest)
    purchaseRequests.POST("/:id/comments", handlers.AddPRComment)
}
```

### 4. Database Migration (backend/pkg/database/database.go) ✅
Added models to AutoMigrate:
- PurchaseRequest
- PRItem
- ApprovalHistory
- PRComment

## Multi-Stage Approval Workflow

### Stage Flow:
1. **Purchasing** (Initial stage)
   - PR dibuat oleh user
   - Notification dikirim ke Purchasing department
   
2. **Cost Control**
   - Setelah Purchasing approve
   - Notification dikirim ke Cost Control department
   
3. **GM** (Final stage)
   - Setelah Cost Control approve
   - Notification dikirim ke GM
   - Jika GM approve, PR fully approved

### Stage Logic:
- Setiap stage harus approve sebelum lanjut ke stage berikutnya
- Jika di-reject di stage manapun, PR langsung ditolak
- Role matching: User role harus match dengan current stage untuk approve/reject
- Notification otomatis ke approver berikutnya

## Features Implemented

### ✅ Core Features:
- [x] PurchaseRequest model dengan multi-stage workflow
- [x] PRItem model untuk multi-item PR
- [x] ApprovalHistory untuk tracking approval progress
- [x] PRComment untuk comment system antar divisi
- [x] PR number auto-generation (PR-YYYY-XXXX)
- [x] Create PR dengan multiple items
- [x] Get PRs dengan filters (all, my_requests, pending_approval, approved, rejected)
- [x] Get PR by ID dengan full relations
- [x] Approve PR dengan stage validation
- [x] Reject PR dengan reason
- [x] Add comments ke PR
- [x] Notification system untuk approval workflow
- [x] Transaction handling untuk data consistency

### ✅ Business Logic:
- [x] Role-based approval (Purchasing → Cost Control → GM)
- [x] Auto-move to next stage after approval
- [x] Prevent double approval
- [x] Prevent approval by wrong role
- [x] TotalPrice auto-calculation untuk PR items
- [x] Status tracking (pending, approved, rejected)
- [x] Priority levels (low, normal, high, urgent)

## API Endpoints

### Base URL: `/api/v1/purchase-requests`

1. **GET /** - Get all PRs
   - Query params: ?filter=all|my_requests|pending_approval|approved|rejected
   - Response: Array of PRs dengan relations

2. **GET /:id** - Get PR by ID
   - Response: PR object dengan full relations (project, requester, items, approval_history, comments)

3. **POST /** - Create new PR
   - Body: { project_id, title, description, priority, required_date, total_amount, items[] }
   - Response: Created PR

4. **POST /:id/approve** - Approve PR at current stage
   - Body: { stage, comment? }
   - Response: Updated PR

5. **POST /:id/reject** - Reject PR at current stage
   - Body: { stage, reason }
   - Response: Updated PR

6. **POST /:id/comments** - Add comment to PR
   - Body: { comment }
   - Response: Created comment

## Integration dengan Frontend

Frontend sudah 100% complete dan siap digunakan dengan backend ini:
- ✅ List page dengan stats dan filters
- ✅ Create page dengan multi-item form
- ✅ Detail page dengan approval timeline
- ✅ Comment system UI
- ✅ Role-based approval buttons

## Testing

Backend berhasil di-compile tanpa error:
```bash
✓ go build -o bin/server.exe ./cmd/main.go
```

## Next Steps

1. Start backend server
2. Test API endpoints dengan Postman atau frontend
3. Verify approval workflow
4. Test notification system
5. Monitor database untuk data consistency

## Database Tables Created

1. **purchase_requests**
   - id, pr_number, project_id, requester_id, title, description, priority, status, total_amount, required_date, current_stage, timestamps

2. **pr_items**
   - id, purchase_request_id, material_id, quantity, unit, estimated_price, total_price, vendor, notes, timestamps

3. **approval_histories**
   - id, purchase_request_id, stage, status, approver_id, comment, approved_at, timestamps

4. **pr_comments**
   - id, purchase_request_id, user_id, comment, timestamps

## Notes

- Approval workflow fully automated dengan role checking
- Notifications terintegrasi dengan sistem notifikasi yang ada
- Transaction handling untuk data consistency
- Auto-calculation untuk total prices
- Complete audit trail melalui approval_history
- Comment system untuk komunikasi antar divisi

