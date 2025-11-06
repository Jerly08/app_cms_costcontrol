import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { weeklyReportsAPI, dailyReportsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CalendarDays, MapPin, TrendingUp, Users, FileText, 
  Image as ImageIcon, Download, ArrowLeft, Calendar,
  CloudRain, CheckCircle2, AlertCircle, X, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function WeeklyReportDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [report, setReport] = useState<any>(null);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [allPhotos, setAllPhotos] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && id) {
      fetchReport();
      fetchDailyReports();
    }
  }, [isAuthenticated, authLoading, id, router]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await weeklyReportsAPI.getById(id as string);
      setReport(response.data);
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyReports = async () => {
    try {
      const response = await dailyReportsAPI.getAll();
      // Filter daily reports based on week period (implementation depends on backend structure)
      setDailyReports(response.data || []);
      
      // Collect all photos from daily reports
      const photos: any[] = [];
      response.data?.forEach((dr: any) => {
        if (dr.photos && dr.photos.length > 0) {
          dr.photos.forEach((photo: any) => {
            photos.push({
              ...photo,
              report_date: dr.date,
            });
          });
        }
      });
      setAllPhotos(photos);
    } catch (err) {
      console.error('Error fetching daily reports:', err);
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
    });
    const end = new Date(endDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return `${start} - ${end}`;
  };

  const getWeatherIcon = (weather: string) => {
    const icons: any = {
      Sunny: '☀️',
      Cloudy: '☁️',
      Rainy: '🌧️',
      Stormy: '⛈️',
    };
    return icons[weather] || '🌤️';
  };

  const handleDownloadPDF = async () => {
    try {
      const blob = await weeklyReportsAPI.downloadPDF(id as string);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Weekly-Report-${report.week_number}-${report.year}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Gagal mengunduh PDF');
    }
  };

  const openLightbox = (index: number) => {
    setCurrentPhotoIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextPhoto = () => {
    if (allPhotos && currentPhotoIndex < allPhotos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-gray-600 mt-4">Memuat laporan...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto text-gray-400" size={64} />
          <p className="text-gray-600 mt-4">Laporan tidak ditemukan</p>
          <Link href="/reports/weekly">
            <button className="btn-primary mt-4">Kembali</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />

      <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
        {/* Back Button */}
        <Link href="/reports/weekly">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft size={20} />
            <span>Kembali ke Daftar Laporan</span>
          </button>
        </Link>

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarDays className="text-primary" />
              Laporan Mingguan - Minggu {report.week_number}, {report.year}
            </h1>
            <p className="text-gray-600 mt-1">
              {formatDateRange(report.start_date, report.end_date)}
            </p>
          </div>
          {report.pdf_path && (
            <button
              onClick={handleDownloadPDF}
              className="btn-primary flex items-center gap-2"
            >
              <Download size={18} />
              Download PDF
            </button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Proyek</p>
                <p className="font-semibold text-gray-900">{report.project?.name || '-'}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Progress</p>
                <p className="font-semibold text-gray-900">{report.total_progress}%</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rata-rata Pekerja</p>
                <p className="font-semibold text-gray-900">{report.average_workers || 0} orang</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Hari Kerja</p>
                <p className="font-semibold text-gray-900">{report.working_days || dailyReports.length} hari</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        {report.summary && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileText className="text-primary" />
              Ringkasan Minggu Ini
            </h3>
            <p className="text-gray-700 whitespace-pre-line">{report.summary}</p>
          </div>
        )}

        {/* Achievements & Issues */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {report.achievements && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="text-green-600" />
                Pencapaian
              </h3>
              <p className="text-gray-700 whitespace-pre-line">{report.achievements}</p>
            </div>
          )}

          {report.issues && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="text-red-600" />
                Kendala
              </h3>
              <p className="text-gray-700 whitespace-pre-line">{report.issues}</p>
            </div>
          )}
        </div>

        {/* Daily Reports Summary */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="text-primary" />
            Laporan Harian Agregasi ({dailyReports.length} hari)
          </h3>

          {dailyReports.length > 0 ? (
            <div className="space-y-4">
              {dailyReports.map((dr: any, index: number) => (
                <div
                  key={dr.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-primary font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {new Date(dr.date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            {getWeatherIcon(dr.weather)} {dr.weather}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={14} /> {dr.workers} pekerja
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp size={14} /> {dr.progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link href={`/reports/daily/${dr.id}`}>
                      <button className="text-primary hover:underline text-sm">
                        Lihat Detail →
                      </button>
                    </Link>
                  </div>

                  <div className="pl-13">
                    <p className="text-gray-700 text-sm line-clamp-3">{dr.activities}</p>
                    {dr.photos && dr.photos.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                        <ImageIcon size={14} />
                        {dr.photos.length} foto dokumentasi
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="mx-auto mb-2" size={48} />
              <p>Tidak ada laporan harian untuk periode ini</p>
            </div>
          )}
        </div>

        {/* Photo Gallery - Aggregated from daily reports */}
        {allPhotos.length > 0 && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="text-primary" />
              Galeri Foto Dokumentasi ({allPhotos.length})
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allPhotos.map((photo: any, index: number) => (
                <div
                  key={`${photo.id}-${index}`}
                  className="relative group cursor-pointer"
                  onClick={() => openLightbox(index)}
                >
                  <img
                    src={photo.file_path || '/placeholder-image.jpg'}
                    alt={photo.caption || `Foto ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
                  />
                  <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                    {new Date(photo.report_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-sm p-2 rounded-b-lg">
                      {photo.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generator Info */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Informasi Pembuat</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold">
                {report.generator?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{report.generator?.name || 'Unknown'}</p>
              <p className="text-sm text-gray-600">
                Dibuat: {new Date(report.created_at).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Lightbox Modal */}
      {lightboxOpen && allPhotos.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X size={32} />
          </button>

          <button
            onClick={prevPhoto}
            disabled={currentPhotoIndex === 0}
            className="absolute left-4 text-white hover:text-gray-300 disabled:opacity-30"
          >
            <ChevronLeft size={48} />
          </button>

          <div className="max-w-5xl max-h-[90vh] p-4">
            <img
              src={allPhotos[currentPhotoIndex].file_path}
              alt={allPhotos[currentPhotoIndex].caption}
              className="max-w-full max-h-[80vh] object-contain mx-auto"
            />
            {allPhotos[currentPhotoIndex].caption && (
              <p className="text-white text-center mt-4 text-lg">
                {allPhotos[currentPhotoIndex].caption}
              </p>
            )}
            <p className="text-gray-400 text-center mt-2">
              {new Date(allPhotos[currentPhotoIndex].report_date).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <p className="text-gray-400 text-center mt-1">
              {currentPhotoIndex + 1} / {allPhotos.length}
            </p>
          </div>

          <button
            onClick={nextPhoto}
            disabled={currentPhotoIndex === allPhotos.length - 1}
            className="absolute right-4 text-white hover:text-gray-300 disabled:opacity-30"
          >
            <ChevronRight size={48} />
          </button>
        </div>
      )}
    </div>
  );
}

