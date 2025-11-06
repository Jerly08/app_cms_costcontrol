import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Camera, CheckCircle, Clock, Package } from 'lucide-react';
import { dashboardAPI } from '@/lib/api';

export default function TimLapanganDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getRoleDashboard();
      setDashboardData(response.data || response);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  const stats = dashboardData?.stats || {};
  const myReports = dashboardData?.my_reports || [];
  const todayTasks = dashboardData?.today_tasks || [];
  const myProjects = dashboardData?.my_projects || [];

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="card bg-gradient-to-r from-primary to-primary-600 text-white">
        <h2 className="text-2xl font-bold mb-2">Selamat Datang, Tim Lapangan!</h2>
        <p className="text-primary-50">{today}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Reports This Month</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.monthly_reports || 0}</h3>
            </div>
            <FileText className="text-primary" size={32} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Photos Uploaded</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.total_photos || 0}</h3>
            </div>
            <Camera className="text-purple-600" size={32} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Projects</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.active_projects || 0}</h3>
            </div>
            <CheckCircle className="text-green-600" size={32} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Material Used Today</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.materials_used_today || 0}</h3>
            </div>
            <Package className="text-orange-600" size={32} />
          </div>
        </div>
      </div>

      {/* Today's Action Required */}
      <div className="card bg-yellow-50 border-2 border-yellow-300">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="text-yellow-700" size={24} />
          <h3 className="text-lg font-semibold text-yellow-900">Today's Action Required</h3>
        </div>
        <div className="space-y-2">
          {!stats.has_today_report && (
            <Link href="/reports/daily/create">
              <div className="p-3 bg-white border-2 border-yellow-400 rounded-lg hover:shadow-md transition cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Submit Today's Daily Report</p>
                    <p className="text-sm text-gray-600">Daily report untuk hari ini belum dibuat</p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-500 text-white font-semibold rounded">Action Needed</span>
                </div>
              </div>
            </Link>
          )}
          {stats.has_today_report && (
            <div className="p-3 bg-white border-2 border-green-400 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-600" size={20} />
                <p className="font-semibold text-green-700">✓ Daily report sudah disubmit untuk hari ini</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/reports/daily/create">
          <div className="card hover:shadow-lg transition cursor-pointer text-center bg-primary text-white">
            <FileText className="mx-auto mb-2" size={36} />
            <h4 className="font-semibold text-lg">Create Daily Report</h4>
            <p className="text-sm mt-1 opacity-90">Submit today's activities</p>
          </div>
        </Link>
        <Link href="/reports/daily">
          <div className="card hover:shadow-lg transition cursor-pointer text-center">
            <FileText className="mx-auto text-primary mb-2" size={36} />
            <h4 className="font-semibold">My Reports</h4>
            <p className="text-sm text-gray-600 mt-1">View submitted reports</p>
          </div>
        </Link>
        <Link href="/photos">
          <div className="card hover:shadow-lg transition cursor-pointer text-center">
            <Camera className="mx-auto text-purple-600 mb-2" size={36} />
            <h4 className="font-semibold">Upload Photos</h4>
            <p className="text-sm text-gray-600 mt-1">Add documentation photos</p>
          </div>
        </Link>
      </div>

      {/* My Recent Reports */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">My Recent Reports</h3>
          <Link href="/reports/daily" className="text-sm text-primary hover:underline">View All</Link>
        </div>
        <div className="space-y-3">
          {myReports.length > 0 ? myReports.slice(0, 5).map((report: any) => (
            <Link key={report.id} href={`/reports/daily/${report.id}`}>
              <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{report.project?.name || 'Project'}</p>
                    <p className="text-xs text-gray-600">{new Date(report.date).toLocaleDateString('id-ID')}</p>
                  </div>
                  <span className="text-sm text-primary font-semibold">{report.progress}% Progress</span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{report.activities}</p>
                {report.photos && report.photos.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <Camera size={14} />
                    <span>{report.photos.length} photos</span>
                  </div>
                )}
              </div>
            </Link>
          )) : (
            <div className="text-center py-8 text-gray-500">No reports yet</div>
          )}
        </div>
      </div>

      {/* Active Projects */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">My Active Projects</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myProjects.length > 0 ? myProjects.map((project: any) => (
            <div key={project.id} className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">{project.name}</h4>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${project.progress || 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{project.progress || 0}%</span>
              </div>
              <div className="flex gap-2">
                <Link href={`/reports/daily/create?project_id=${project.id}`}>
                  <button className="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary-600 transition">
                    Report
                  </button>
                </Link>
                <Link href={`/projects/${project.id}`}>
                  <button className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-100 transition">
                    Details
                  </button>
                </Link>
              </div>
            </div>
          )) : (
            <div className="col-span-2 text-center py-8 text-gray-500">No active projects</div>
          )}
        </div>
      </div>
    </div>
  );
}

