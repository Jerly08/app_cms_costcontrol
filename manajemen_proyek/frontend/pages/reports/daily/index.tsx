import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Table from '@/components/Table';
import { dailyReportsAPI, projectsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Calendar, FileText, Image, Eye } from 'lucide-react';

export default function DailyReports() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchProjects();
      fetchReports();
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchReports();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll();
      setProjects(response.data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await dailyReportsAPI.getAll(selectedProject || undefined);
      setReports(response.data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
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

  const columns = [
    {
      header: 'Tanggal',
      accessor: 'date',
      cell: (value: string) => (
        <div className="font-medium text-gray-900">{formatDate(value)}</div>
      ),
    },
    {
      header: 'Proyek',
      accessor: 'project',
      cell: (value: any) => (
        <div className="text-gray-700">{value?.name || '-'}</div>
      ),
    },
    {
      header: 'Aktivitas',
      accessor: 'activities',
      cell: (value: string) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">{value}</div>
      ),
    },
    {
      header: 'Progress',
      accessor: 'progress',
      cell: (value: number) => (
        <div className="flex items-center gap-2">
          <div className="w-20 bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full"
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-sm font-medium">{value}%</span>
        </div>
      ),
    },
    {
      header: 'Cuaca',
      accessor: 'weather',
      cell: (value: string) => (
        <div className="flex items-center gap-1">
          <span>{getWeatherIcon(value)}</span>
          <span className="text-sm">{value}</span>
        </div>
      ),
    },
    {
      header: 'Pekerja',
      accessor: 'workers',
      cell: (value: number) => (
        <div className="text-gray-700">{value} orang</div>
      ),
    },
    {
      header: 'Foto',
      accessor: 'photos',
      cell: (value: any[]) => (
        <div className="flex items-center gap-1 text-gray-600">
          <Image size={16} />
          <span className="text-sm">{value?.length || 0}</span>
        </div>
      ),
    },
    {
      header: 'Aksi',
      accessor: 'id',
      cell: (value: number) => (
        <Link href={`/reports/daily/${value}`}>
          <button className="text-primary hover:text-primary-dark flex items-center gap-1">
            <Eye size={16} />
            <span className="text-sm">Detail</span>
          </button>
        </Link>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />

      <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="text-primary" />
              Laporan Harian
            </h1>
            <p className="text-gray-600 mt-1">Dokumentasi aktivitas harian proyek</p>
          </div>
          <Link href="/reports/daily/create">
            <button className="btn-primary flex items-center gap-2">
              <Plus size={18} />
              Buat Laporan
            </button>
          </Link>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Proyek
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
          </div>
        </div>

        {/* Reports Table */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="text-primary" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">
              Daftar Laporan ({reports.length})
            </h3>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-gray-600 mt-2">Memuat data...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto text-gray-400" size={48} />
              <p className="text-gray-600 mt-2">Belum ada laporan harian</p>
            </div>
          ) : (
            <Table columns={columns} data={reports} />
          )}
        </div>
      </main>
    </div>
  );
}

