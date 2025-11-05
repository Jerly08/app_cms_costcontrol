import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Table from '@/components/Table';
import { weeklyReportsAPI, projectsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarDays, FileText, Download, Eye, PlusCircle } from 'lucide-react';

export default function WeeklyReports() {
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
      const response = await weeklyReportsAPI.getAll(selectedProject || undefined);
      setReports(response.data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
    const end = new Date(endDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${start} - ${end}`;
  };

  const handleDownloadPDF = async (reportId: number) => {
    try {
      const blob = await weeklyReportsAPI.downloadPDF(reportId.toString());
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Weekly-Report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Gagal mengunduh PDF');
    }
  };

  const columns = [
    {
      header: 'Minggu',
      accessor: 'week_number',
      cell: (value: number, row: any) => (
        <div className="font-medium text-gray-900">
          Minggu {value}, {row.year}
        </div>
      ),
    },
    {
      header: 'Periode',
      accessor: 'start_date',
      cell: (value: string, row: any) => (
        <div className="text-gray-700">{formatDateRange(value, row.end_date)}</div>
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
      header: 'Progress',
      accessor: 'total_progress',
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
      header: 'Dibuat Oleh',
      accessor: 'generator',
      cell: (value: any) => (
        <div className="text-gray-700">{value?.name || '-'}</div>
      ),
    },
    {
      header: 'Aksi',
      accessor: 'id',
      cell: (value: number, row: any) => (
        <div className="flex items-center gap-2">
          <Link href={`/reports/weekly/${value}`}>
            <button className="text-primary hover:text-primary-dark flex items-center gap-1">
              <Eye size={16} />
              <span className="text-sm">Detail</span>
            </button>
          </Link>
          {row.pdf_path && (
            <button
              onClick={() => handleDownloadPDF(value)}
              className="text-green-600 hover:text-green-700 flex items-center gap-1"
            >
              <Download size={16} />
              <span className="text-sm">PDF</span>
            </button>
          )}
        </div>
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
              <CalendarDays className="text-primary" />
              Laporan Mingguan
            </h1>
            <p className="text-gray-600 mt-1">Ringkasan progress mingguan proyek</p>
          </div>
          <Link href="/reports/weekly/generate">
            <button className="btn-primary flex items-center gap-2">
              <PlusCircle size={18} />
              Generate Laporan
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
              <p className="text-gray-600 mt-2">Belum ada laporan mingguan</p>
              <Link href="/reports/weekly/generate">
                <button className="btn-primary mt-4 inline-flex items-center gap-2">
                  <PlusCircle size={18} />
                  Generate Laporan Pertama
                </button>
              </Link>
            </div>
          ) : (
            <Table columns={columns} data={reports} />
          )}
        </div>
      </main>
    </div>
  );
}

