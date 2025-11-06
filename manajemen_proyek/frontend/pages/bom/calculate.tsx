import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Table from '@/components/Table';
import { bomAPI, projectsAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/dummyData';
import { ArrowLeft, Calculator, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export default function CalculateBOMUsage() {
  const router = useRouter();
  const { project_id } = router.query;

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(project_id as string || '');
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (project_id) {
      setSelectedProject(project_id as string);
    }
  }, [project_id]);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll();
      setProjects(response.data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const handleCalculate = async () => {
    if (!selectedProject) {
      alert('Please select a project');
      return;
    }

    try {
      setLoading(true);
      const response = await bomAPI.calculateUsage(selectedProject);
      setCalculationResult(response.data);
    } catch (err: any) {
      console.error('Error calculating BOM usage:', err);
      alert(err.message || 'Failed to calculate BOM usage');
    } finally {
      setLoading(false);
    }
  };

  const getVarianceStatus = (variance: number) => {
    if (variance > 10) return { color: 'text-red-600', bg: 'bg-red-50', label: 'Over Budget', icon: TrendingUp };
    if (variance > 0) return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Slight Over', icon: TrendingUp };
    if (variance >= -5) return { color: 'text-green-600', bg: 'bg-green-50', label: 'On Track', icon: TrendingDown };
    return { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Under Budget', icon: TrendingDown };
  };

  const columns = [
    {
      header: 'Material',
      accessor: 'material_name',
      cell: (value: string, row: any) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{row.material_code}</div>
        </div>
      ),
    },
    {
      header: 'Estimated Qty',
      accessor: 'estimated_quantity',
      cell: (value: number, row: any) => (
        <span className="text-gray-700">{value?.toFixed(2)} {row.unit}</span>
      ),
    },
    {
      header: 'Actual Used',
      accessor: 'actual_quantity',
      cell: (value: number, row: any) => (
        <span className="text-gray-700">{value?.toFixed(2)} {row.unit}</span>
      ),
    },
    {
      header: 'Usage %',
      accessor: 'usage_percentage',
      cell: (value: number) => (
        <div className="flex items-center gap-2">
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${value > 100 ? 'bg-red-500' : 'bg-primary'}`}
              style={{ width: `${Math.min(value, 100)}%` }}
            />
          </div>
          <span className={`text-sm font-medium ${value > 100 ? 'text-red-600' : 'text-gray-700'}`}>
            {value?.toFixed(1)}%
          </span>
        </div>
      ),
    },
    {
      header: 'Estimated Cost',
      accessor: 'estimated_cost',
      cell: (value: number) => (
        <span className="text-gray-700">{formatCurrency(value)}</span>
      ),
    },
    {
      header: 'Actual Cost',
      accessor: 'actual_cost',
      cell: (value: number) => (
        <span className="text-gray-700">{formatCurrency(value)}</span>
      ),
    },
    {
      header: 'Variance',
      accessor: 'variance_percentage',
      cell: (value: number) => {
        const status = getVarianceStatus(value);
        return (
          <span className={`font-semibold ${status.color}`}>
            {value > 0 ? '+' : ''}
            {value?.toFixed(2)}%
          </span>
        );
      },
    },
  ];

  const summary = calculationResult?.summary;
  const items = calculationResult?.items || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />

      <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
        <div className="mb-6">
          <Link href={selectedProject ? `/bom?project_id=${selectedProject}` : '/bom'}>
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft size={20} />
              Back to BOM List
            </button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Calculate BOM Usage</h1>
          <p className="text-gray-600 mt-1">Analyze material usage and budget variance</p>
        </div>

        {/* Project Selector */}
        <div className="card mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Project <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="input flex-1"
            >
              <option value="">-- Select Project --</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleCalculate}
              disabled={!selectedProject || loading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator size={18} />
                  Calculate
                </>
              )}
            </button>
          </div>
        </div>

        {calculationResult && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="card">
                <p className="text-sm text-gray-600 mb-1">Total Estimated Cost</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary?.total_estimated_cost || 0)}
                </h3>
              </div>
              
              <div className="card">
                <p className="text-sm text-gray-600 mb-1">Total Actual Cost</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary?.total_actual_cost || 0)}
                </h3>
              </div>

              <div className="card">
                <p className="text-sm text-gray-600 mb-1">Cost Variance</p>
                <h3 className={`text-2xl font-bold ${
                  summary?.variance_percentage > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {summary?.variance_percentage > 0 ? '+' : ''}
                  {summary?.variance_percentage?.toFixed(2)}%
                </h3>
              </div>

              <div className="card">
                <p className="text-sm text-gray-600 mb-1">Overall Usage</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {summary?.overall_usage_percentage?.toFixed(1)}%
                </h3>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="card bg-red-50 border-2 border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-700 mb-1">Over Budget</p>
                    <h4 className="text-3xl font-bold text-red-600">
                      {summary?.over_budget_count || 0}
                    </h4>
                    <p className="text-xs text-red-600 mt-1">materials</p>
                  </div>
                  <AlertCircle className="text-red-500" size={36} />
                </div>
              </div>

              <div className="card bg-green-50 border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 mb-1">On Track</p>
                    <h4 className="text-3xl font-bold text-green-600">
                      {summary?.on_track_count || 0}
                    </h4>
                    <p className="text-xs text-green-600 mt-1">materials</p>
                  </div>
                  <TrendingDown className="text-green-500" size={36} />
                </div>
              </div>

              <div className="card bg-blue-50 border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 mb-1">Under Budget</p>
                    <h4 className="text-3xl font-bold text-blue-600">
                      {summary?.under_budget_count || 0}
                    </h4>
                    <p className="text-xs text-blue-600 mt-1">materials</p>
                  </div>
                  <TrendingUp className="text-blue-500" size={36} />
                </div>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Material Usage Analysis
              </h3>
              {items.length > 0 ? (
                <Table columns={columns} data={items} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No BOM items found for calculation</p>
                </div>
              )}
            </div>

            {/* Insights */}
            {summary && (
              <div className="card mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      summary.variance_percentage > 0 ? 'bg-red-500' : 'bg-green-500'
                    }`} />
                    <p className="text-gray-700">
                      Project is currently {' '}
                      <strong className={summary.variance_percentage > 0 ? 'text-red-600' : 'text-green-600'}>
                        {Math.abs(summary.variance_percentage).toFixed(2)}% 
                        {summary.variance_percentage > 0 ? ' over' : ' under'} budget
                      </strong>
                      {' '}on material costs.
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                    <p className="text-gray-700">
                      Overall material usage is at <strong className="text-blue-600">
                        {summary.overall_usage_percentage?.toFixed(1)}%
                      </strong> of estimated quantities.
                    </p>
                  </div>

                  {summary.over_budget_count > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5" />
                      <p className="text-gray-700">
                        <strong className="text-yellow-600">{summary.over_budget_count} material(s)</strong>
                        {' '}exceeded estimated budget. Review these items for cost optimization.
                      </p>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5" />
                    <p className="text-gray-700">
                      Cost difference: <strong>
                        {formatCurrency(Math.abs(summary.total_actual_cost - summary.total_estimated_cost))}
                      </strong>
                      {' '}{summary.variance_percentage > 0 ? 'over' : 'under'} the estimated budget.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {!calculationResult && !loading && (
          <div className="card text-center py-12">
            <Calculator className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Calculation Yet
            </h3>
            <p className="text-gray-500">
              Select a project and click "Calculate" to analyze BOM usage
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

