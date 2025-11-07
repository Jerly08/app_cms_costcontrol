import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Chart from '@/components/Chart';
import Table from '@/components/Table';
import {
  projects as dummyProjects,
  budgetControls,
  formatCurrency,
  calculateVariance,
} from '@/lib/dummyData';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  FileDown,
  Loader,
} from 'lucide-react';
import { exportDashboardPDF } from '@/lib/pdfExport';
import { useState, useEffect } from 'react';
import { projectsAPI, dashboardAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

// Import role-specific dashboards
import CEODashboard from '@/components/dashboards/CEODashboard';
import CostControlDashboard from '@/components/dashboards/CostControlDashboard';
import PurchasingDashboard from '@/components/dashboards/PurchasingDashboard';
import TimLapanganDashboard from '@/components/dashboards/TimLapanganDashboard';

export default function Dashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const router = useRouter();

  // Fetch dashboard data based on role
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch role-specific dashboard
      const dashResponse = await dashboardAPI.getRoleDashboard();
      setDashboardData(dashResponse.data || dashResponse);

      // Also fetch projects for general overview
      const projResponse = await projectsAPI.getAll();
      setProjects(projResponse.data || []);
    } catch (err: any) {
      console.error('Error fetching dashboard:', err);
      // Fallback to dummy data for demo
      setProjects(dummyProjects);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics
  const totalEstimated = projects.reduce(
    (sum, p) => sum + (p.estimatedCost || p.estimated_cost || 0),
    0
  );
  const totalActual = projects.reduce((sum, p) => sum + (p.actualCost || p.actual_cost || 0), 0);
  const totalVariance = calculateVariance(totalEstimated, totalActual);
  const onTrackProjects = projects.filter(
    (p) => p.status === 'On Track'
  ).length;
  const warningProjects = projects.filter(
    (p) => p.status === 'Warning' || p.status === 'Over Budget'
  ).length;

  // Prepare chart data
  const chartData = projects.map((p) => ({
    name: p.name.split(' ').slice(0, 3).join(' '),
    Estimasi: p.estimatedCost,
    Aktual: p.actualCost,
  }));

  // Table columns
  const columns = [
    {
      header: 'Nama Proyek',
      accessor: 'name',
      cell: (value: string) => (
        <div className="font-medium text-gray-900 dark:text-gray-100">{value}</div>
      ),
    },
    {
      header: 'Estimasi',
      accessor: 'estimatedCost',
      cell: (value: number) => (
        <span className="text-gray-700 dark:text-gray-300">{formatCurrency(value)}</span>
      ),
    },
    {
      header: 'Aktual',
      accessor: 'actualCost',
      cell: (value: number) => (
        <span className="text-gray-700 dark:text-gray-300">{formatCurrency(value)}</span>
      ),
    },
    {
      header: 'Variance',
      accessor: 'variance',
      cell: (_: any, row: any) => {
        const variance = calculateVariance(
          row.estimatedCost,
          row.actualCost
        );
        const isOver = variance > 0;
        return (
          <span
            className={`font-semibold ${
              isOver ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {isOver ? '+' : ''}
            {variance.toFixed(2)}%
          </span>
        );
      },
    },
    {
      header: 'Progress',
      accessor: 'progress',
      cell: (value: number) => (
        <div className="flex items-center gap-2">
          <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full"
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">{value}%</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (value: string) => {
        const colors = {
          'On Track': 'bg-green-100 text-green-800',
          Warning: 'bg-yellow-100 text-yellow-800',
          'Over Budget': 'bg-red-100 text-red-800',
        };
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              colors[value as keyof typeof colors]
            }`}
          >
            {value}
          </span>
        );
      },
    },
  ];

  // Render role-specific dashboard
  const renderDashboardContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-screen">
          <Loader className="animate-spin h-12 w-12 text-primary" />
        </div>
      );
    }

    // Get role name - handle both string and object cases
    const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name;
    const userRole = roleName?.toLowerCase();

    // CEO and Director get the executive dashboard
    if (userRole === 'ceo' || userRole === 'director' || userRole === 'project_director') {
      return <CEODashboard />;
    }

    // Cost Control gets cost analysis dashboard
    if (userRole === 'cost control' || userRole === 'cost_control') {
      return <CostControlDashboard />;
    }

    // Purchasing gets procurement dashboard
    if (userRole === 'purchasing') {
      return <PurchasingDashboard />;
    }

    // Tim Lapangan gets field operations dashboard
    if (userRole === 'tim lapangan' || userRole === 'tim_lapangan' || userRole === 'field') {
      return <TimLapanganDashboard />;
    }

    // Default dashboard for other roles (Manager, etc.)
    return (
      <>
        {/* Header with Export Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">Overview seluruh proyek</p>
          </div>
          <button
            onClick={() =>
              exportDashboardPDF(
                projects,
                totalEstimated,
                totalActual,
                totalVariance
              )
            }
            className="btn-primary flex items-center gap-2 text-sm md:text-base"
          >
            <FileDown size={18} className="md:w-5 md:h-5" />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
          {/* Total Estimasi */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-2">
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">Total Estimasi</p>
                <h3 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {formatCurrency(totalEstimated)}
                </h3>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="text-primary" size={20} />
              </div>
            </div>
          </div>

          {/* Total Aktual */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-2">
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">Total Aktual</p>
                <h3 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {formatCurrency(totalActual)}
                </h3>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="text-purple-600" size={20} />
              </div>
            </div>
          </div>

          {/* Variance */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-2">
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">Variance Total</p>
                <h3
                  className={`text-lg md:text-2xl font-bold ${
                    totalVariance > 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {totalVariance > 0 ? '+' : ''}
                  {totalVariance.toFixed(2)}%
                </h3>
              </div>
              <div
                className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  totalVariance > 0 ? 'bg-red-100' : 'bg-green-100'
                }`}
              >
                <AlertTriangle
                  className={totalVariance > 0 ? 'text-red-600' : 'text-green-600'}
                  size={20}
                />
              </div>
            </div>
          </div>

          {/* Projects Status */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-2">
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1">Status Proyek</p>
                <div className="flex items-center gap-2 md:gap-3">
                  <div>
                    <span className="text-green-600 font-bold text-lg md:text-xl">
                      {onTrackProjects}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">On Track</span>
                  </div>
                  <div>
                    <span className="text-red-600 font-bold text-lg md:text-xl">
                      {warningProjects}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">Warning</span>
                  </div>
                </div>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="text-green-600" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
          {/* Estimasi vs Aktual Chart */}
          <div className="lg:col-span-2 card">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">
              Perbandingan Estimasi vs Aktual per Proyek
            </h3>
            <Chart
              data={chartData}
              type="bar"
              xAxisKey="name"
              dataKeys={[
                { key: 'Estimasi', color: '#3b82f6', name: 'Estimasi' },
                { key: 'Aktual', color: '#8b5cf6', name: 'Aktual' },
              ]}
              height={350}
            />
          </div>

          {/* Budget Control */}
          <div className="card">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 md:mb-4">
              Budget Control
            </h3>
            <div className="space-y-4">
              {budgetControls.slice(0, 4).map((bc) => {
                const percentage = (bc.actualVolume / bc.estimatedVolume) * 100;
                const isOver = percentage > 100;

                return (
                  <div key={bc.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {bc.material}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          isOver ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          isOver ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {bc.actualVolume} / {bc.estimatedVolume} {bc.unit}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Daftar Proyek
          </h3>
          <Table columns={columns} data={projects} />
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <Navbar />

      {/* Main Content */}
      <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
        {renderDashboardContent()}
      </main>
    </div>
  );
}
