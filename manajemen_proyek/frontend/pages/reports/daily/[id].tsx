import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { dailyReportsAPI, photosAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Calendar, MapPin, CloudRain, Users, TrendingUp, 
  FileText, Image as ImageIcon, X, ChevronLeft, ChevronRight,
  Edit, Trash2, ArrowLeft 
} from 'lucide-react';

export default function DailyReportDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && id) {
      fetchReport();
    }
  }, [isAuthenticated, authLoading, id, router]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await dailyReportsAPI.getById(id as string);
      setReport(response.data);
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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

  const openLightbox = (index: number) => {
    setCurrentPhotoIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextPhoto = () => {
    if (report?.photos && currentPhotoIndex < report.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus laporan ini?')) return;
    
    try {
      await dailyReportsAPI.delete(id as string);
      router.push('/reports/daily');
    } catch (err) {
      console.error('Error deleting report:', err);
      alert('Gagal menghapus laporan');
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
          <Link href="/reports/daily">
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
        <Link href="/reports/daily">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft size={20} />
            <span>Kembali ke Daftar Laporan</span>
          </button>
        </Link>

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="text-primary" />
              Laporan Harian
            </h1>
            <p className="text-gray-600 mt-1">{formatDate(report.date)}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/reports/daily/edit/${id}`)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <Edit size={18} />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
            >
              <Trash2 size={18} />
              Hapus
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">{getWeatherIcon(report.weather)}</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cuaca</p>
                <p className="font-semibold text-gray-900">{report.weather}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pekerja</p>
                <p className="font-semibold text-gray-900">{report.workers} orang</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Progress</p>
                <p className="font-semibold text-gray-900">{report.progress}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Activities & Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="text-primary" />
              Aktivitas Hari Ini
            </h3>
            <p className="text-gray-700 whitespace-pre-line">{report.activities}</p>
          </div>

          {report.notes && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="text-primary" />
                Catatan Tambahan
              </h3>
              <p className="text-gray-700 whitespace-pre-line">{report.notes}</p>
            </div>
          )}
        </div>

        {/* Photo Gallery */}
        {report.photos && report.photos.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="text-primary" />
              Foto Dokumentasi ({report.photos.length})
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {report.photos.map((photo: any, index: number) => (
                <div
                  key={photo.id}
                  className="relative group cursor-pointer"
                  onClick={() => openLightbox(index)}
                >
                  <img
                    src={photo.file_path || '/placeholder-image.jpg'}
                    alt={photo.caption || `Foto ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
                  />
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

        {/* Reporter Info */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Informasi Pelapor</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold">
                {report.reporter?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{report.reporter?.name || 'Unknown'}</p>
              <p className="text-sm text-gray-600">
                Dibuat: {new Date(report.created_at).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Lightbox Modal */}
      {lightboxOpen && report.photos && (
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
              src={report.photos[currentPhotoIndex].file_path}
              alt={report.photos[currentPhotoIndex].caption}
              className="max-w-full max-h-[80vh] object-contain mx-auto"
            />
            {report.photos[currentPhotoIndex].caption && (
              <p className="text-white text-center mt-4 text-lg">
                {report.photos[currentPhotoIndex].caption}
              </p>
            )}
            <p className="text-gray-400 text-center mt-2">
              {currentPhotoIndex + 1} / {report.photos.length}
            </p>
          </div>

          <button
            onClick={nextPhoto}
            disabled={currentPhotoIndex === report.photos.length - 1}
            className="absolute right-4 text-white hover:text-gray-300 disabled:opacity-30"
          >
            <ChevronRight size={48} />
          </button>
        </div>
      )}
    </div>
  );
}

