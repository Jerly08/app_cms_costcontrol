import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { projectsAPI, dailyReportsAPI, photosAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Camera, Upload, X, Save, AlertCircle } from 'lucide-react';

export default function CreateDailyReport() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    project_id: '',
    date: new Date().toISOString().split('T')[0],
    activities: '',
    progress: 0,
    weather: 'Sunny',
    workers: 0,
    notes: '',
  });

  const [photoCaptions, setPhotoCaptions] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll();
      setProjects(response.data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedPhotos.length > 10) {
      setError('Maksimal 10 foto per laporan');
      return;
    }

    // Create previews
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPhotoPreviews([...photoPreviews, ...newPreviews]);
    setSelectedPhotos([...selectedPhotos, ...files]);
    setPhotoCaptions([...photoCaptions, ...new Array(files.length).fill('')]);
    setError('');
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
    setSelectedPhotos(selectedPhotos.filter((_, i) => i !== index));
    setPhotoCaptions(photoCaptions.filter((_, i) => i !== index));
  };

  const updateCaption = (index: number, caption: string) => {
    const newCaptions = [...photoCaptions];
    newCaptions[index] = caption;
    setPhotoCaptions(newCaptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate
      if (!formData.project_id) {
        throw new Error('Pilih proyek terlebih dahulu');
      }
      if (!formData.activities.trim()) {
        throw new Error('Aktivitas harus diisi');
      }

      // Create daily report
      const reportResponse = await dailyReportsAPI.create({
        ...formData,
        progress: parseFloat(formData.progress.toString()),
        workers: parseInt(formData.workers.toString()),
      });

      const reportId = reportResponse.data.id;

      // Upload photos if any
      if (selectedPhotos.length > 0) {
        await photosAPI.upload(reportId, selectedPhotos, photoCaptions);
      }

      // Success - redirect to reports list
      router.push('/reports/daily');
    } catch (err: any) {
      setError(err.message || 'Gagal membuat laporan harian');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />

      <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Buat Laporan Harian</h1>
          <p className="text-gray-600 mt-1">Input aktivitas dan progress pekerjaan hari ini</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-4xl">
          {/* Basic Info Card */}
          <div className="card mb-6">
            <h3 className="text-lg font-semibold mb-4">Informasi Dasar</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proyek <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Pilih Proyek</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {/* Weather */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kondisi Cuaca
                </label>
                <select
                  value={formData.weather}
                  onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Sunny">☀️ Cerah</option>
                  <option value="Cloudy">☁️ Berawan</option>
                  <option value="Rainy">🌧️ Hujan</option>
                  <option value="Stormy">⛈️ Badai</option>
                </select>
              </div>

              {/* Workers Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Pekerja
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.workers}
                  onChange={(e) => setFormData({ ...formData, workers: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0"
                />
              </div>

              {/* Progress */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Progress Hari Ini (%)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: parseFloat(e.target.value) })}
                    className="flex-1"
                  />
                  <div className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold">
                    {formData.progress}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activities Card */}
          <div className="card mb-6">
            <h3 className="text-lg font-semibold mb-4">Aktivitas & Catatan</h3>

            {/* Activities */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aktivitas Hari Ini <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.activities}
                onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={5}
                placeholder="Jelaskan aktivitas pekerjaan yang dilakukan hari ini..."
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan Tambahan / Kendala
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="Catatan, kendala, atau hal penting lainnya..."
              />
            </div>
          </div>

          {/* Photo Upload Card */}
          <div className="card mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Camera size={20} />
              Foto Dokumentasi
            </h3>

            {/* Upload Button */}
            <div className="mb-4">
              <label className="btn-primary cursor-pointer inline-flex items-center gap-2">
                <Upload size={18} />
                Pilih Foto (Max 10)
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500 mt-2">
                {selectedPhotos.length}/10 foto dipilih
              </p>
            </div>

            {/* Photo Previews */}
            {selectedPhotos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photoPreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                    <input
                      type="text"
                      value={photoCaptions[index]}
                      onChange={(e) => updateCaption(index, e.target.value)}
                      placeholder="Keterangan foto..."
                      className="w-full mt-2 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              <Save size={18} />
              {loading ? 'Menyimpan...' : 'Simpan Laporan'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

