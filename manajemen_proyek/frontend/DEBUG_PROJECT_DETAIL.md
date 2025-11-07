# 🐛 Debug Project Detail Page - "Proyek Tidak Ditemukan"

## ⚠️ Issue
Setelah create project baru (ID 8), ketika click project dari dashboard, muncul:
```
Proyek Tidak Ditemukan
Proyek dengan ID 8 tidak ditemukan
```

---

## 🔍 Debugging Steps

### Step 1: Check Browser Console

1. **Buka browser** di `http://localhost:3001/projects` (atau port 3000)
2. **Buka Developer Tools** (F12)
3. **Go to Console tab**
4. **Create project baru**
5. **Click project** yang baru dibuat
6. **Check console logs**

**Expected logs:**
```
🔍 Fetching project with ID: 8
✅ Project API response: { success: true, data: {...} }
📦 Project data: { id: 8, name: "...", ... }
```

**If you see ERROR:**
```
❌ Error fetching project: Error: ...
❌ Error details: ...
```

**Tolong screenshot dan share console error!**

---

### Step 2: Check Backend API Response

#### A. Test API Directly with Postman/cURL

```bash
# Get your auth token first (check localStorage in browser)
# Then test:

curl -X GET "http://localhost:8080/api/v1/projects/8" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "id": 8,
    "name": "Your Project Name",
    "description": "...",
    "customer": "...",
    "city": "...",
    "project_type": "New Build",
    "estimated_cost": 1200000000,
    "start_date": "2025-01-11",
    "end_date": "2025-01-12",
    ...
  }
}
```

#### B. Check Backend Logs

```bash
# Check backend console output
# Look for GET /api/v1/projects/8 request
```

---

### Step 3: Check API URL Configuration

**Check `.env.local` file:**
```bash
# Should be:
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

**Check `lib/api.ts`:**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
```

---

### Step 4: Check Authentication

1. Open browser DevTools → Application/Storage → Local Storage
2. Check if `token` exists
3. Copy token value
4. Go to [jwt.io](https://jwt.io) and paste token
5. Check if token is expired

**If token expired:**
```bash
# Login again to get new token
```

---

### Step 5: Clear Cache

```bash
# 1. Clear browser cache:
Ctrl+Shift+Delete → Clear cached images and files

# 2. Hard reload:
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# 3. Restart frontend:
Ctrl+C (stop server)
npm run dev
```

---

## 🔧 Possible Root Causes

### 1. **Backend Not Returning Data**
- Backend endpoint `/api/v1/projects/:id` tidak mengembalikan data
- Backend error saat query database
- Project dengan ID 8 tidak ada di database

**Solution:** Check backend logs dan database

### 2. **API URL Wrong**
- Frontend calling wrong API URL
- CORS issue
- API endpoint path salah

**Solution:** Check .env.local dan API_URL

### 3. **Authentication Issue**
- Token expired
- Token invalid
- Token tidak dikirim di request header

**Solution:** Login ulang untuk get new token

### 4. **Response Format Wrong**
- Backend mengembalikan format response yang berbeda
- Field `data` tidak ada
- Response structure berubah

**Solution:** Check API response format

---

## 📝 What to Share for Further Help

Please provide:

1. **Browser Console Logs** (screenshot)
   - Termasuk 🔍, ✅, ❌ logs

2. **Network Tab** (DevTools → Network)
   - Find request ke `/api/v1/projects/8`
   - Click request → Check:
     - Request Headers (ada Authorization?)
     - Response Status (200? 404? 500?)
     - Response Body (apa isinya?)

3. **Backend Console Logs**
   - Logs saat GET /api/v1/projects/8 dipanggil

4. **.env.local** file content
   ```
   NEXT_PUBLIC_API_URL=?
   ```

5. **Backend API URL**
   - Backend running di port berapa?
   - URL lengkapnya?

---

## 🚨 Quick Fix Options

### Option 1: Restart Everything

```bash
# 1. Stop frontend
Ctrl+C

# 2. Stop backend
Ctrl+C

# 3. Clear browser cache
Ctrl+Shift+Delete

# 4. Start backend
cd backend
go run main.go  # or your backend start command

# 5. Start frontend
cd frontend
npm run dev

# 6. Hard refresh browser
Ctrl+Shift+R

# 7. Login ulang
# 8. Create project baru
# 9. Try click project
```

### Option 2: Test with Existing Project

1. Go to `/projects`
2. Try click **project lama** (yang sudah ada sebelumnya)
3. Does it work?

**If YES:** Problem is with newly created projects
**If NO:** Problem is with API endpoint in general

---

## 🎯 Expected Behavior After Fix

1. ✅ Create project → Success
2. ✅ Project muncul di dashboard
3. ✅ Click project → Loading spinner
4. ✅ Project detail page muncul dengan data lengkap
5. ❌ NO "Proyek Tidak Ditemukan" error

---

## 📞 Next Steps

**Please do:**
1. Follow debugging steps above
2. Check browser console logs
3. Check Network tab
4. Share screenshots/logs

**I need to see:**
- Console logs (dengan 🔍✅❌ emoji)
- Network request/response
- Backend logs (jika ada)

**Then I can help you fix it properly!** 🚀

