# Cost Control Construction Management System

Aplikasi manajemen proyek konstruksi full-stack dengan fokus pada **pengendalian biaya aktual vs estimasi**.

## 🚀 Teknologi

### Frontend
- **Framework**: Next.js 14 (Pages Router)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend
- **Language**: Golang
- **Framework**: Gin
- **ORM**: GORM
- **Database**: MySQL
- **Auth**: JWT

## 📦 Quick Start

### Cara Cepat (Recommended)
Jalankan frontend dan backend sekaligus:
```powershell
.\start-all.ps1
```

Script ini akan membuka 2 terminal terpisah untuk backend dan frontend.

### Cara Manual

#### 1. Setup Database
```bash
mysql -u root -p < backend/create_database.sql
```

#### 2. Setup & Jalankan Backend
```bash
cd backend
cp .env.example .env
# Edit .env sesuai konfigurasi MySQL
go mod download
go run cmd/main.go
```
Backend akan berjalan di `http://localhost:8080`

#### 3. Setup & Jalankan Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend akan berjalan di `http://localhost:3000`

## 🔐 Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Director | `director` | `password123` |
| Manager | `manager` | `password123` |
| Tim Lapangan | `timlapangan` | `password123` |

## 📁 Struktur Folder

```
frontend/
├── components/          # Komponen reusable
│   ├── Navbar.tsx      # Top navigation bar
│   ├── Sidebar.tsx     # Side navigation menu
│   ├── ProjectCard.tsx # Card untuk menampilkan proyek
│   ├── Chart.tsx       # Wrapper untuk Recharts
│   └── Table.tsx       # Tabel data universal
├── pages/              # Halaman aplikasi
│   ├── index.tsx       # Dashboard (halaman utama)
│   ├── projects.tsx    # Daftar proyek
│   ├── purchasing.tsx  # Manajemen pembelian
│   └── cashflow.tsx    # Manajemen arus kas
├── lib/
│   └── dummyData.ts    # Data dummy untuk demo
├── styles/
│   └── globals.css     # Global styles & Tailwind
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

## 🎨 Fitur

### 1. Dashboard (/)
- Ringkasan total estimasi, aktual, variance
- Chart perbandingan estimasi vs aktual
- Budget control progress
- Tabel daftar proyek
- **📄 Export PDF Report**

### 2. Projects (/projects)
- List semua proyek dalam card
- Filter berdasarkan status
- Search by nama proyek
- Statistik proyek
- **📄 Export PDF Report**

### 3. Purchasing (/purchasing)
- Form input pembelian material
- Tabel daftar pembelian
- Analisis selisih harga estimasi vs aktual
- Summary pembelian
- **📄 Export PDF Report**

### 4. Cashflow (/cashflow)
- Grafik arus kas bulanan
- Tabel cashflow per proyek
- Summary pemasukan, pengeluaran, saldo
- Tips manajemen cashflow
- **📄 Export PDF Report**

## 🎯 Cara Penggunaan

1. **Dashboard**: Halaman default yang menampilkan overview seluruh proyek
2. **Navigasi**: Gunakan sidebar untuk berpindah halaman
3. **Responsif**: Sidebar collapsible di layar mobile (toggle dengan tombol hamburger)
4. **Data**: Semua data saat ini menggunakan dummy data dari `lib/dummyData.ts`

## 🔧 Kustomisasi

### Mengganti Warna Tema
Edit `tailwind.config.js`:
```javascript
colors: {
  primary: '#2563eb',        // Warna utama
  'primary-dark': '#1e40af', // Warna hover
  'primary-light': '#3b82f6',
}
```

### Menambah Data Dummy
Edit `lib/dummyData.ts` untuk menambah proyek, pembelian, atau cashflow.

## 📝 Script Available

```bash
npm run dev      # Jalankan development server
npm run build    # Build untuk production
npm start        # Jalankan production server
npm run lint     # Lint code dengan ESLint
```

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📱 Responsive Design

- **Desktop**: Full layout dengan sidebar persistent
- **Tablet**: Optimized layout
- **Mobile**: Collapsible sidebar dengan overlay

## 🎨 Design System

- **Font**: Inter & Poppins (Google Fonts)
- **Primary Color**: Blue #2563eb
- **Spacing**: Tailwind default scale
- **Border Radius**: 8px (lg) untuk cards
- **Shadows**: Soft shadows untuk depth

## ✅ Fitur yang Sudah Terintegrasi

- [x] Integrasi dengan Backend API (Golang + MySQL)
- [x] Autentikasi & Authorization (JWT)
- [x] Role-based Access Control (Director, Manager, Tim Lapangan)
- [x] CRUD Projects dengan API
- [x] Protected Routes
- [x] Export data ke PDF
- [x] Responsive Design (Mobile-friendly)

## 🔜 Pengembangan Selanjutnya

- [ ] Daily & Weekly Reports
- [ ] User Management
- [ ] Real-time updates (WebSocket)
- [ ] Export data ke Excel
- [ ] Filter & sorting advanced
- [ ] Notifikasi system
- [ ] Email report otomatis

## 📄 License

Private - Internal Use Only

## 👥 Developer

Developed for Cost Control Construction Management System
