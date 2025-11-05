import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { projectsAPI, weeklyReportsAPI, dailyReportsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarDays, AlertCircle, Save, Loader } from 'lucide-react';

export default function GenerateWeeklyReport() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [dailyReportsPreview, setDailyReportsPreview] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    project_id: '',
    start_date: '',
    end_date: '',
    summary: '',
    achievements: '',
    issues: '',
    next_week_plan: '',
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (formData.project_id && formData.start_date && formData.end_date) {
      previewDailyReports();
    }
  }, [formData.project_id, formData.start_date, formData.end_date]);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll();
      setProjects(response.data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const previewDailyReports = async () => {
    try {
      const response = await dailyReportsAPI.getAll(formData.project_id);
      const filtered = response.data.filter((report: any) => {
        const reportDate = new Date(report.date);
        return reportDate >= new Date(formData.start_date) && 
               reportDate <= new Date(formData.end_date);
      });
      setDailyReportsPreview(filtered);
    } catch (err) {
      console.error('Error fetching daily reports:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.project_id) {
        throw new Error('Pilih proyek terlebih dahulu');
      }
      if (!formData.start_date || !formData.end_date) {
        throw new Error('Tentukan periode laporan');
      }

      await weeklyReportsAPI.generate(formData.project_id, formData);
      router.push('/reports/weekly');
    } catch (err: any) {
      setError(err.message || 'Gagal generate laporan mingguan');
    } finally {
      setLoading(false);
    }
  };

  const getWeekNumber = (date: Date) => {
    const oneJan = new Date(date.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((date.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />

      <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
        <div className="max-w-4xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarDays className="text-primary" />
              Generate Laporan Mingguan
            </h1>
            <p className="text-gray-600 mt-1">Buat laporan mingguan dari agregasi laporan harian</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="card mb-6">
              <h3 className="text-lg font-semibold mb-4">Periode & Proyek</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-3">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Mulai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Selesai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minggu Ke
                  </label>
                  <input
                    type="text"
                    value={formData.start_date ? `Minggu ${getWeekNumber(new Date(formData.start_date))}` : '-'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>
              </div>

              {dailyReportsPreview.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    📊 <strong>{dailyReportsPreview.length}</strong> laporan harian akan diagregasi
                  </p>
                </div>
              )}
            </div>

            <div className="card mb-6">
              <h3 className="text-lg font-semibold mb-4">Ringkasan</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Summary Minggu Ini
                </label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={4}
                  placeholder="Ringkasan umum progress minggu ini..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pencapaian / Achievements
                </label>
                <textarea
                  value={formData.achievements}
                  onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={4}
                  placeholder="Target yang tercapai minggu ini..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kendala / Issues
                </label>
                <textarea
                  value={formData.issues}
                  onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={4}
                  placeholder="Kendala yang dihadapi minggu ini..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rencana Minggu Depan
                </label>
                <textarea
                  value={formData.next_week_plan}
                  onChange={(e) => setFormData({ ...formData, next_week_plan: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={4}
                  placeholder="Rencana aktivitas untuk minggu depan..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                {loading ? 'Generating...' : 'Generate Laporan'}
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
        </div>
      </main>
    </div>
  );
}

