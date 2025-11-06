import { useState, useEffect } from 'react';
import Link from 'next/link';
import Chart from '@/components/Chart';
import Table from '@/components/Table';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  ShoppingCart,
  Package,
  Users
} from 'lucide-react';
import { formatCurrency, calculateVariance } from '@/lib/dummyData';
import { dashboardAPI, projectsAPI } from '@/lib/api';

export default function CEODashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getRoleDashboard();
      setDashboardData(response.data || response);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const projects = dashboardData?.projects || [];
  const recentApprovals = dashboardData?.recent_approvals || [];

  return (
    <div className="space-y-6">
      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Proyek</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.total_projects || 0}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {stats.active_projects || 0} aktif
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="text-primary" size={24} />
            </div>
          </div>
        </div>

        {/* Total Budget */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Budget</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.total_estimated || 0)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Estimasi</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Approval</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats.pending_approvals || 0}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Butuh persetujuan</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        {/* Overall Performance */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Overall Progress</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats.avg_progress ? `${stats.avg_progress.toFixed(1)}%` : '0%'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Rata-rata</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Low Stock Materials */}
        <Link href="/materials?filter=low-stock">
          <div className="card hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Low Stock Materials</p>
                <h3 className="text-xl font-bold text-red-600">
                  {stats.low_stock_materials || 0}
                </h3>
              </div>
              <Package className="text-red-600" size={32} />
            </div>
          </div>
        </Link>

        {/* Purchase Requests */}
        <Link href="/purchase-requests?filter=pending_approval">
          <div className="card hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Purchase Requests</p>
                <h3 className="text-xl font-bold text-orange-600">
                  {stats.pending_prs || 0}
                </h3>
              </div>
              <ShoppingCart className="text-orange-600" size={32} />
            </div>
          </div>
        </Link>

        {/* Active Users */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Users</p>
              <h3 className="text-xl font-bold text-blue-600">
                {stats.active_users || 0}
              </h3>
            </div>
            <Users className="text-blue-600" size={32} />
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Project Budget Overview</h3>
          {projects.length > 0 ? (
            <Chart
              data={projects.map((p: any) => ({
                name: p.name?.substring(0, 15) || 'Project',
                Budget: p.estimated_cost || 0,
                Actual: p.actual_cost || 0,
              }))}
              type="bar"
              xAxisKey="name"
              dataKeys={[
                { key: 'Budget', color: '#3b82f6', name: 'Budget' },
                { key: 'Actual', color: '#8b5cf6', name: 'Actual' },
              ]}
              height={300}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">No project data</div>
          )}
        </div>

        {/* Recent Approvals */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Approvals</h3>
            <Link href="/purchase-requests" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentApprovals.length > 0 ? (
              recentApprovals.slice(0, 5).map((approval: any) => (
                <div key={approval.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{approval.title || approval.pr_number}</p>
                    <p className="text-xs text-gray-500">{approval.requester?.name}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    approval.status === 'approved' ? 'bg-green-100 text-green-800' :
                    approval.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {approval.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No recent approvals</div>
            )}
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">All Projects</h3>
          <Link href="/projects" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Project</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Progress</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Budget</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.slice(0, 5).map((project: any) => (
                <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <Link href={`/projects/${project.id}`} className="font-medium text-primary hover:underline">
                      {project.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${project.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-sm">{project.progress || 0}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {formatCurrency(project.estimated_cost || 0)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === 'On Track' ? 'bg-green-100 text-green-800' :
                      project.status === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {project.status || 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

