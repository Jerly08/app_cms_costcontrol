import { useState, useEffect } from 'react';
import Link from 'next/link';
import Chart from '@/components/Chart';
import { DollarSign, TrendingDown, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/dummyData';
import { dashboardAPI } from '@/lib/api';

export default function CostControlDashboard() {
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
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  const stats = dashboardData?.stats || {};
  const materials = dashboardData?.materials || [];
  const costVariances = dashboardData?.cost_variances || [];

  return (
    <div className="space-y-6">
      {/* Cost Control Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Material Cost</p>
              <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_material_cost || 0)}</h3>
            </div>
            <DollarSign className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Cost Variance</p>
              <h3 className={`text-2xl font-bold ${stats.cost_variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.cost_variance >= 0 ? '+' : ''}{stats.cost_variance?.toFixed(2) || '0'}%
              </h3>
            </div>
            {stats.cost_variance >= 0 ? <TrendingUp className="text-green-600" size={32} /> : <TrendingDown className="text-red-600" size={32} />}
          </div>
        </div>

        <Link href="/materials?filter=low-stock">
          <div className="card hover:shadow-lg transition cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Low Stock Items</p>
                <h3 className="text-2xl font-bold text-red-600">{stats.low_stock_count || 0}</h3>
              </div>
              <AlertTriangle className="text-red-600" size={32} />
            </div>
          </div>
        </Link>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Materials</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.total_materials || 0}</h3>
            </div>
            <Package className="text-purple-600" size={32} />
          </div>
        </div>
      </div>

      {/* Material Usage & Cost Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Material Usage vs Budget</h3>
          {materials.length > 0 ? (
            <Chart
              data={materials.slice(0, 8).map((m: any) => ({
                name: m.name?.substring(0, 12) || 'Material',
                Budget: m.estimated_cost || 0,
                Used: m.actual_cost || 0,
              }))}
              type="bar"
              xAxisKey="name"
              dataKeys={[
                { key: 'Budget', color: '#3b82f6', name: 'Budget' },
                { key: 'Used', color: '#ef4444', name: 'Used' },
              ]}
              height={300}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">No data available</div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Cost Variance by Project</h3>
          {costVariances.length > 0 ? (
            <div className="space-y-3">
              {costVariances.map((cv: any) => (
                <div key={cv.project_id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">{cv.project_name}</span>
                    <span className={`font-bold ${cv.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {cv.variance >= 0 ? '+' : ''}{cv.variance?.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Budget: {formatCurrency(cv.budget || 0)} | Actual: {formatCurrency(cv.actual || 0)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No variance data</div>
          )}
        </div>
      </div>

      {/* Low Stock Materials Alert */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Low Stock Alerts</h3>
          <Link href="/materials?filter=low-stock" className="text-sm text-primary hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4 text-sm font-semibold">Material</th>
                <th className="text-left py-2 px-4 text-sm font-semibold">Current Stock</th>
                <th className="text-left py-2 px-4 text-sm font-semibold">Min Stock</th>
                <th className="text-left py-2 px-4 text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {materials.filter((m: any) => m.stock <= m.min_stock).slice(0, 5).map((material: any) => (
                <tr key={material.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4 font-medium">{material.name}</td>
                  <td className="py-2 px-4 text-red-600 font-bold">{material.stock} {material.unit}</td>
                  <td className="py-2 px-4">{material.min_stock} {material.unit}</td>
                  <td className="py-2 px-4">
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Low Stock</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/materials">
          <div className="card hover:shadow-lg transition cursor-pointer text-center">
            <Package className="mx-auto text-primary mb-2" size={32} />
            <h4 className="font-semibold">Manage Materials</h4>
            <p className="text-sm text-gray-600 mt-1">View and update material inventory</p>
          </div>
        </Link>
        <Link href="/projects">
          <div className="card hover:shadow-lg transition cursor-pointer text-center">
            <DollarSign className="mx-auto text-green-600 mb-2" size={32} />
            <h4 className="font-semibold">Project Costs</h4>
            <p className="text-sm text-gray-600 mt-1">Monitor project budgets</p>
          </div>
        </Link>
        <Link href="/purchase-requests">
          <div className="card hover:shadow-lg transition cursor-pointer text-center">
            <AlertTriangle className="mx-auto text-orange-600 mb-2" size={32} />
            <h4 className="font-semibold">Review PRs</h4>
            <p className="text-sm text-gray-600 mt-1">Verify purchase requests</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

