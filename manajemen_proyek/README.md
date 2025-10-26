# Cost Control Construction Management System - Frontend

Frontend aplikasi manajemen proyek konstruksi dengan fokus pada **pengendalian biaya aktual vs estimasi**.

## 🚀 Teknologi

- **Framework**: Next.js 14 (Pages Router)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React

## 📦 Instalasi

1. Install dependencies:
```bash
npm install
```

2. Jalankan development server:
```bash
npm run dev
```

3. Buka browser dan akses:
```
http://localhost:3000
```

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

## 🔜 Pengembangan Selanjutnya

- [ ] Integrasi dengan Backend API
- [ ] Autentikasi & Authorization
- [ ] Real-time updates
- [x] Export data ke PDF ✅
- [ ] Export data ke Excel
- [ ] Filter & sorting advanced
- [ ] Notifikasi system
- [ ] Email report otomatis

## 📄 License

Private - Internal Use Only

## 👥 Developer

Developed for Cost Control Construction Management System
