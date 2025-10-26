# 🚀 Quick Start - PDF Export Feature

## ⚡ Cepat Mulai (5 Menit)

### 1. Pastikan Server Running
```bash
cd frontend
npm run dev
```

### 2. Buka Browser
```
http://localhost:3001
```

### 3. Test Export PDF

#### Dashboard Report
1. Buka halaman Dashboard (default)
2. Klik tombol **"Export PDF"** di kanan atas
3. File `Dashboard-Report-{timestamp}.pdf` akan otomatis terdownload
4. Buka file PDF → Lihat ringkasan semua proyek

#### Projects Report
1. Klik menu **"Projects"** di sidebar
2. Klik tombol **"Export PDF"** (di samping "Tambah Proyek Baru")
3. File `Projects-Report-{timestamp}.pdf` akan terdownload
4. Buka file PDF → Lihat detail setiap proyek dalam card format

#### Purchasing Report
1. Klik menu **"Purchasing"** di sidebar
2. Klik tombol **"Export PDF"** di kanan atas
3. File `Purchasing-Report-{timestamp}.pdf` akan terdownload (landscape)
4. Buka file PDF → Lihat tabel pembelian lengkap

#### Cashflow Report
1. Klik menu **"Cashflow"** di sidebar
2. Klik tombol **"Export PDF"** di kanan atas
3. File `Cashflow-Report-{timestamp}.pdf` akan terdownload
4. Buka file PDF → Lihat summary & detail cashflow

---

## 📸 Preview PDF Reports

### Dashboard Report
```
┌─────────────────────────────────────┐
│   Cost Control CMS                  │
│   Dashboard Report                  │
│   Generated: 26 Oktober 2025        │
├─────────────────────────────────────┤
│ Summary Overview                    │
│  ┌─────────┬─────────┬──────────┐  │
│  │Estimasi │ Aktual  │ Variance │  │
│  └─────────┴─────────┴──────────┘  │
│                                     │
│ Daftar Proyek                       │
│  Nama | Est | Act | Var% | Progress│
│  ─────────────────────────────────  │
│  Jalan Tol | 450M | 470M | +4.4%   │
│  Gedung    | 850M | 820M | -3.5%   │
│  ...                                │
└─────────────────────────────────────┘
```

### Projects Report
```
┌─────────────────────────────────────┐
│   Projects Report                   │
│   Total Proyek: 5                   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Proyek Jalan Tol  [On Track]    │ │
│ │ Periode: 2025-01-15 - 2025-12-31│ │
│ │ Estimasi: Rp 450.000.000        │ │
│ │ Aktual:   Rp 470.000.000        │ │
│ │ Progress: [████████░░] 85%      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Pembangunan Gedung [On Track]   │ │
│ │ ...                             │ │
└─────────────────────────────────────┘
```

### Purchasing Report (Landscape)
```
┌──────────────────────────────────────────────────────────┐
│              Purchasing Report                           │
│              Total Transaksi: 7                          │
├──────────────────────────────────────────────────────────┤
│ Proyek | Material | Qty | Est | Act | Diff | Vendor     │
│ ───────────────────────────────────────────────────────  │
│ Jalan  | Semen    | 500 | 65K | 68K |+1.5M| PT Semen   │
│ Jalan  | Besi     | 2K  | 13K | 13K |-600K| CV Besi    │
│ ...                                                      │
└──────────────────────────────────────────────────────────┘
```

### Cashflow Report
```
┌─────────────────────────────────────┐
│   Cashflow Report                   │
│   Periode: Jan 2025 - Sep 2025      │
├─────────────────────────────────────┤
│ Summary                             │
│  Total Pemasukan:  Rp 1.360.000.000 │
│  Total Pengeluaran: Rp 1.300.000.000│
│  Saldo Bersih:     Rp 60.000.000    │
│                                     │
│ Detail Cashflow                     │
│  Proyek | Bulan | In | Out | Saldo │
│  ─────────────────────────────────  │
│  Jalan  | Jan   |100M| 85M | +15M  │
│  ...                                │
└─────────────────────────────────────┘
```

---

## 🎯 Use Cases

### 1. Presentasi ke Client
```
Scenario: Meeting dengan client untuk progress report
Action:
1. Buka Dashboard
2. Export PDF
3. Kirim via email atau print untuk meeting
4. Client bisa lihat ringkasan semua proyek dalam 1 file

Result: Client puas dengan laporan profesional
```

### 2. Monthly Report
```
Scenario: Laporan bulanan untuk management
Action:
1. Export Dashboard PDF (overview)
2. Export Cashflow PDF (keuangan)
3. Export Purchasing PDF (pengeluaran)
4. Compile jadi 1 file atau kirim terpisah

Result: Management punya dokumentasi lengkap
```

### 3. Audit Trail
```
Scenario: Perlu dokumentasi untuk audit
Action:
1. Export semua report per akhir bulan
2. Simpan di folder: /Reports/2025-10/
3. Filename dengan timestamp otomatis = easy tracking

Result: Dokumentasi terorganisir untuk audit
```

### 4. Vendor Comparison
```
Scenario: Analisis performa vendor
Action:
1. Filter di Purchasing page (jika ada)
2. Export Purchasing PDF
3. Compare selisih harga per vendor

Result: Data-driven decision untuk vendor selection
```

---

## 💡 Tips & Tricks

### Naming Convention
```
Format Default: {PageName}-Report-{timestamp}.pdf
Contoh: Dashboard-Report-1730025600000.pdf

Tips: Rename setelah download untuk tracking lebih mudah
Contoh: Dashboard-Report-2025-10-Project-X.pdf
```

### Best Time to Export
- **Dashboard**: Setiap akhir minggu/bulan
- **Projects**: Saat ada review atau meeting
- **Purchasing**: Setelah batch input pembelian
- **Cashflow**: Setiap akhir bulan untuk closing

### Organizing Reports
```
Struktur Folder Recommended:
Reports/
├── 2025-10/
│   ├── Dashboard-2025-10-31.pdf
│   ├── Projects-2025-10-31.pdf
│   ├── Purchasing-2025-10-31.pdf
│   └── Cashflow-2025-10-31.pdf
├── 2025-11/
│   └── ...
```

### Sharing Reports
1. **Email**: Attach langsung, size kecil (~100KB)
2. **WhatsApp**: Bisa dikirim tanpa compress
3. **Cloud**: Upload ke Google Drive/Dropbox
4. **Print**: Quality bagus untuk presentasi

---

## 🔍 Troubleshooting

### PDF Tidak Muncul?
**Cek:**
- Browser popup blocker → Disable untuk localhost
- Download folder permission
- Console error (F12)

**Fix:** Refresh page dan coba lagi

### PDF Kosong?
**Cek:**
- Ada data di halaman?
- Network error di console?

**Fix:** Pastikan dummy data loaded

### Teks Terpotong?
**Info:** 
- Nama panjang otomatis di-truncate
- Normal untuk maintain PDF layout

**Custom:** Edit `lib/pdfExport.ts` jika perlu adjust

---

## 📊 Performance Tips

### Optimal Export
- Export saat data sudah loaded (tunggu chart render)
- Jangan spam click button export
- 1 report = 1-2 detik generation time

### File Size
- Dashboard: ~80-120KB
- Projects: ~100-150KB
- Purchasing: ~150-200KB
- Cashflow: ~80-100KB

Total untuk semua: ~400-500KB = Very efficient!

---

## 🎓 Next Steps

Setelah berhasil test PDF export:

1. ✅ **Customize**: Edit color/layout di `lib/pdfExport.ts`
2. ✅ **Add Logo**: Replace text header dengan company logo
3. ✅ **Filter**: Add filter sebelum export (future)
4. ✅ **Backend**: Connect ke real API (future)

---

## 📞 Support

Jika ada issue:
1. Check `docs/PDF_EXPORT.md` untuk detail lengkap
2. Check console log (F12) untuk error
3. Check `CHANGELOG.md` untuk update history

---

**Happy Exporting! 🎉**

*Generated on: 26 Oktober 2025*
*Version: 1.1.0*
