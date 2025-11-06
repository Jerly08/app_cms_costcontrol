import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Chart from '@/components/Chart';
import { projectsAPI, dashboardAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/dummyData';
import { 
  TrendingUp, TrendingDown, BarChart3, LineChart as LineChartIcon,
  AlertTriangle, CheckCircle, DollarSign, Percent, Filter, Download,
  PieChart as PieChartIcon, Activity
} from 'lucide-react';

export default function CostVarianceAnalytics() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [timeRange, setTimeRange] = useState<'all' | 'active' | 'completed'>('active');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, authLoading, router, timeRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsRes, dashboardRes] = await Promise.all([
        projectsAPI.getAll(),
        dashboardAPI.getRoleDashboard(),
      ]);

      let filteredProjects = projectsRes.data || [];
      
      // Filter by time range
      if (timeRange === 'active') {
        filteredProjects = filteredProjects.filter((p: any) => p.status !== 'completed');
      } else if (timeRange === 'completed') {
        filteredProjects = filteredProjects.filter((p: any) => p.status === 'completed');
      }

      setProjects(filteredProjects);
      setDashboardData(dashboardRes.data);

      // Auto-select top 5 projects with highest variance
      const topVariance = filteredProjects
        .map((p: any) => ({
          ...p,
          variance: p.estimated_cost > 0 
            ? ((p.actual_cost - p.estimated_cost) / p.estimated_cost) * 100 
            : 0
        }))
        .sort((a: any, b: any) => Math.abs(b.variance) - Math.abs(a.variance))
        .slice(0, 5)
        .map((p: any) => p.id.toString());
      
      setSelectedProjects(topVariance);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        if (prev.length >= 10) {
          alert('Maximum 10 projects can be selected');
          return prev;
        }
        return [...prev, projectId];
      }
    });
  };

  const getChartData = () => {
    const filtered = projects.filter(p => selectedProjects.includes(p.id.toString()));
    return filtered.map(p => ({
      name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
      fullName: p.name,
      estimated: p.estimated_cost || 0,
      actual: p.actual_cost || 0,
      variance: p.estimated_cost > 0 
        ? ((p.actual_cost - p.estimated_cost) / p.estimated_cost) * 100 
        : 0,
    }));
  };

  const getVarianceChartData = () => {
    const filtered = projects.filter(p => selectedProjects.includes(p.id.toString()));
    return filtered.map(p => {
      const variance = p.estimated_cost > 0 
        ? ((p.actual_cost - p.estimated_cost) / p.estimated_cost) * 100 
        : 0;
      return {
        name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
        variance: variance,
        difference: (p.actual_cost || 0) - (p.estimated_cost || 0),
      };
    });
  };

  const getSummaryStats = () => {
    const filtered = projects.filter(p => selectedProjects.includes(p.id.toString()));
    
    const totalEstimated = filtered.reduce((sum, p) => sum + (p.estimated_cost || 0), 0);
    const totalActual = filtered.reduce((sum, p) => sum + (p.actual_cost || 0), 0);
    const overBudget = filtered.filter(p => (p.actual_cost || 0) > (p.estimated_cost || 0)).length;
    const underBudget = filtered.filter(p => (p.actual_cost || 0) < (p.estimated_cost || 0)).length;
    const onTrack = filtered.filter(p => (p.actual_cost || 0) === (p.estimated_cost || 0)).length;
    
    const overallVariance = totalEstimated > 0 
      ? ((totalActual - totalEstimated) / totalEstimated) * 100 
      : 0;

    return {
      totalEstimated,
      totalActual,
      overBudget,
      underBudget,
      onTrack,
      overallVariance,
      totalProjects: filtered.length,
    };
  };

  const getProgressVsCostData = () => {
    const filtered = projects.filter(p => selectedProjects.includes(p.id.toString()));
    return filtered.map(p => ({
      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
      progress: p.progress || 0,
      costProgress: p.estimated_cost > 0 ? ((p.actual_cost / p.estimated_cost) * 100) : 0,
    }));
  };

  const exportToCSV = () => {
    const filtered = projects.filter(p => selectedProjects.includes(p.id.toString()));
    const csvData = filtered.map(p => {
      const variance = p.estimated_cost > 0
        ? ((p.actual_cost - p.estimated_cost) / p.estimated_cost) * 100
        : 0;
      return {
        'Project Name': p.name,
        'Status': p.status,
        'Progress (%)': p.progress,
        'Estimated Cost': p.estimated_cost || 0,
        'Actual Cost': p.actual_cost || 0,
        'Variance (%)': variance.toFixed(2),
        'Difference': (p.actual_cost || 0) - (p.estimated_cost || 0),
      };
    });

    const headers = Object.keys(csvData[0] || {});
    const csv = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => row[h as keyof typeof row]).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cost-variance-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const stats = getSummaryStats();
  const chartData = getChartData();
  const varianceChartData = getVarianceChartData();
  const progressVsCostData = getProgressVsCostData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-gray-600 mt-4">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />

      <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="text-primary" />
              Cost Variance Analysis
            </h1>
            <p className="text-gray-600 mt-1">Compare estimated vs actual costs across projects</p>
          </div>
          {selectedProjects.length > 0 && (
            <button
              onClick={exportToCSV}
              className="btn-primary flex items-center gap-2"
            >
              <Download size={18} />
              Export CSV
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter size={16} className="inline mr-1" />
                Time Range
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="input w-full"
              >
                <option value="all">All Projects</option>
                <option value="active">Active Projects Only</option>
                <option value="completed">Completed Projects Only</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chart Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartType('bar')}
                  className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    chartType === 'bar'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <BarChart3 size={18} />
                  Bar
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    chartType === 'line'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <LineChartIcon size={18} />
                  Line
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Estimated</p>
                <p className="font-bold text-gray-900 text-lg">
                  {formatCurrency(stats.totalEstimated)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Actual</p>
                <p className="font-bold text-gray-900 text-lg">
                  {formatCurrency(stats.totalActual)}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                stats.overallVariance > 0 ? 'bg-red-100' : 'bg-green-100'
              }`}>
                <Percent className={stats.overallVariance > 0 ? 'text-red-600' : 'text-green-600'} size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overall Variance</p>
                <p className={`font-bold text-lg ${
                  stats.overallVariance > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {stats.overallVariance > 0 ? '+' : ''}
                  {stats.overallVariance.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Projects Selected</p>
                <p className="font-bold text-gray-900 text-lg">
                  {stats.totalProjects}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card bg-red-50 border-2 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 mb-1">Over Budget</p>
                <h3 className="text-3xl font-bold text-red-600">{stats.overBudget}</h3>
                <p className="text-xs text-red-600 mt-1">projects</p>
              </div>
              <AlertTriangle className="text-red-500" size={36} />
            </div>
          </div>

          <div className="card bg-green-50 border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 mb-1">Under Budget</p>
                <h3 className="text-3xl font-bold text-green-600">{stats.underBudget}</h3>
                <p className="text-xs text-green-600 mt-1">projects</p>
              </div>
              <TrendingDown className="text-green-500" size={36} />
            </div>
          </div>

          <div className="card bg-blue-50 border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 mb-1">On Track</p>
                <h3 className="text-3xl font-bold text-blue-600">{stats.onTrack}</h3>
                <p className="text-xs text-blue-600 mt-1">projects</p>
              </div>
              <CheckCircle className="text-blue-500" size={36} />
            </div>
          </div>
        </div>

        {/* Main Chart - Estimated vs Actual */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Estimated vs Actual Cost Comparison
          </h3>
          {chartData.length > 0 ? (
            <Chart
              data={chartData}
              type={chartType}
              xAxisKey="name"
              height={400}
              dataKeys={[
                { key: 'estimated', color: '#3b82f6', name: 'Estimated Cost' },
                { key: 'actual', color: '#8b5cf6', name: 'Actual Cost' },
              ]}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="mx-auto mb-2" size={48} />
              <p>No projects selected. Please select projects below.</p>
            </div>
          )}
        </div>

        {/* Variance Chart */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Cost Variance Percentage
          </h3>
          {varianceChartData.length > 0 ? (
            <Chart
              data={varianceChartData}
              type="bar"
              xAxisKey="name"
              height={350}
              dataKeys={[
                { key: 'variance', color: '#ef4444', name: 'Variance %' },
              ]}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Percent className="mx-auto mb-2" size={48} />
              <p>No data available</p>
            </div>
          )}
        </div>

        {/* Progress vs Cost Efficiency Chart */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Project Progress vs Cost Efficiency
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Compare physical progress with budget consumption
              </p>
            </div>
            <Activity className="text-primary" size={24} />
          </div>
          {progressVsCostData.length > 0 ? (
            <Chart
              data={progressVsCostData}
              type="bar"
              xAxisKey="name"
              height={350}
              dataKeys={[
                { key: 'progress', color: '#10b981', name: 'Physical Progress (%)' },
                { key: 'costProgress', color: '#f59e0b', name: 'Budget Used (%)' },
              ]}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Activity className="mx-auto mb-2" size={48} />
              <p>No data available</p>
            </div>
          )}
          {progressVsCostData.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <AlertTriangle size={16} />
                Analysis Insight
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Ideal scenario:</strong> Physical progress and budget used should be aligned</li>
                <li>• <strong>Budget used {'>'} Progress:</strong> Project spending faster than progress (concern)</li>
                <li>• <strong>Progress {'>'} Budget used:</strong> Project progressing efficiently (positive)</li>
              </ul>
            </div>
          )}
        </div>

        {/* Project Selection */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Select Projects ({selectedProjects.length}/10)
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedProjects(projects.map(p => p.id.toString()))}
                className="text-sm text-primary hover:underline"
                disabled={projects.length > 10}
              >
                Select All {projects.length > 10 && '(Max 10)'}
              </button>
              <button
                onClick={() => setSelectedProjects([])}
                className="text-sm text-gray-600 hover:underline"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Select
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Project
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estimated Cost
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actual Cost
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Variance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projects.map((project) => {
                  const variance = project.estimated_cost > 0
                    ? ((project.actual_cost - project.estimated_cost) / project.estimated_cost) * 100
                    : 0;
                  const isSelected = selectedProjects.includes(project.id.toString());

                  return (
                    <tr
                      key={project.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleProjectToggle(project.id.toString())}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{project.name}</div>
                        <div className="text-xs text-gray-500">Progress: {project.progress}%</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatCurrency(project.estimated_cost || 0)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatCurrency(project.actual_cost || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${
                          variance > 0 ? 'text-red-600' : variance < 0 ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {variance > 0 ? '+' : ''}
                          {variance.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          project.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : project.status === 'over_budget'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {project.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {projects.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <AlertTriangle className="mx-auto mb-2" size={48} />
              <p>No projects found for the selected time range</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

