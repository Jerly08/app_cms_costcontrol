import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { dailyReportsAPI, projectsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Image as ImageIcon, Filter, X, ChevronLeft, ChevronRight, Download, Calendar, MapPin } from 'lucide-react';

export default function PhotoGallery() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [photos, setPhotos] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchProjects();
      fetchPhotos();
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPhotos();
    }
  }, [selectedProject, dateFrom, dateTo]);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll();
      setProjects(response.data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      // Fetch all daily reports first
      const reportsResponse = await dailyReportsAPI.getAll(selectedProject || undefined);
      const reports = reportsResponse.data || [];

      // Filter by date range
      let filteredReports = reports;
      if (dateFrom || dateTo) {
        filteredReports = reports.filter((report: any) => {
          const reportDate = new Date(report.date);
          if (dateFrom && reportDate < new Date(dateFrom)) return false;
          if (dateTo && reportDate > new Date(dateTo)) return false;
          return true;
        });
      }

      // Extract all photos from reports
      const allPhotos = filteredReports.flatMap((report: any) => 
        (report.photos || []).map((photo: any) => ({
          ...photo,
          report_date: report.date,
          report_id: report.id,
          project_name: report.project?.name,
        }))
      );

      setPhotos(allPhotos);
    } catch (err) {
      console.error('Error fetching photos:', err);
    } finally {
      setLoading(false);
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
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const downloadPhoto = (photoUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />

      <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="text-primary" />
            Photo Gallery
          </h1>
          <p className="text-gray-600 mt-1">Semua foto dokumentasi proyek</p>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-gray-600" />
            <span className="font-medium text-gray-700">Filter:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proyek
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Semua Proyek</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Photo Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Menampilkan <span className="font-semibold text-gray-900">{photos.length}</span> foto
          </p>
        </div>

        {/* Photo Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-gray-600 mt-2">Memuat foto...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="card text-center py-12">
            <ImageIcon className="mx-auto text-gray-400" size={64} />
            <p className="text-gray-600 mt-4">Tidak ada foto yang sesuai filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative group cursor-pointer"
                onClick={() => openLightbox(index)}
              >
                <img
                  src={photo.file_path || '/placeholder-image.jpg'}
                  alt={photo.caption || `Photo ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg border border-gray-200 hover:shadow-xl transition-shadow"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 rounded-lg transition-opacity flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100">
                  <div className="text-white text-xs space-y-1">
                    {photo.project_name && (
                      <div className="flex items-center gap-1">
                        <MapPin size={12} />
                        <span className="truncate">{photo.project_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{formatDate(photo.report_date)}</span>
                    </div>
                  </div>
                </div>

                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2 rounded-b-lg">
                    <p className="truncate">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {lightboxOpen && photos[currentPhotoIndex] && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black bg-opacity-50 p-2 rounded-full"
          >
            <X size={32} />
          </button>

          {/* Download Button */}
          <button
            onClick={() => downloadPhoto(photos[currentPhotoIndex].file_path, photos[currentPhotoIndex].filename)}
            className="absolute top-4 right-20 text-white hover:text-gray-300 bg-black bg-opacity-50 p-2 rounded-full"
          >
            <Download size={24} />
          </button>

          {/* Previous Button */}
          <button
            onClick={prevPhoto}
            disabled={currentPhotoIndex === 0}
            className="absolute left-4 text-white hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed bg-black bg-opacity-50 p-3 rounded-full"
          >
            <ChevronLeft size={48} />
          </button>

          {/* Image Container */}
          <div className="max-w-6xl max-h-[90vh] p-4 w-full">
            <img
              src={photos[currentPhotoIndex].file_path}
              alt={photos[currentPhotoIndex].caption}
              className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
            />
            
            {/* Photo Info */}
            <div className="text-white mt-4 space-y-2">
              {photos[currentPhotoIndex].caption && (
                <p className="text-lg font-medium text-center">{photos[currentPhotoIndex].caption}</p>
              )}
              
              <div className="flex justify-center gap-6 text-sm text-gray-300">
                {photos[currentPhotoIndex].project_name && (
                  <div className="flex items-center gap-1">
                    <MapPin size={16} />
                    <span>{photos[currentPhotoIndex].project_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  <span>{formatDate(photos[currentPhotoIndex].report_date)}</span>
                </div>
                <span>Photo {currentPhotoIndex + 1} / {photos.length}</span>
              </div>

              {photos[currentPhotoIndex].uploader?.name && (
                <p className="text-center text-sm text-gray-400">
                  Uploaded by {photos[currentPhotoIndex].uploader.name}
                </p>
              )}
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={nextPhoto}
            disabled={currentPhotoIndex === photos.length - 1}
            className="absolute right-4 text-white hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed bg-black bg-opacity-50 p-3 rounded-full"
          >
            <ChevronRight size={48} />
          </button>
        </div>
      )}
    </div>
  );
}

