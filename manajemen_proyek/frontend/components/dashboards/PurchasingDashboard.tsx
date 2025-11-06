import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { dashboardAPI } from '@/lib/api';

export default function PurchasingDashboard() {
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
  const lowStockMaterials = dashboardData?.low_stock_materials || [];
  const myPRs = dashboardData?.my_prs || [];

  return (
    <div className="space-y-6">
      {/* Purchasing Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/purchase-requests?filter=my_requests">
          <div className="card hover:shadow-lg transition cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">My PRs</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.my_prs_count || 0}</h3>
              </div>
              <ShoppingCart className="text-primary" size={32} />
            </div>
          </div>
        </Link>

        <Link href="/purchase-requests?filter=pending_approval">
          <div className="card hover:shadow-lg transition cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Approval</p>
                <h3 className="text-2xl font-bold text-yellow-600">{stats.pending_prs || 0}</h3>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </div>
        </Link>

        <Link href="/materials?filter=low-stock">
          <div className="card hover:shadow-lg transition cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Low Stock Alerts</p>
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

      {/* Low Stock Materials - Priority Alert */}
      <div className="card bg-red-50 border-2 border-red-200">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-red-600" size={24} />
          <h3 className="text-lg font-semibold text-red-900">Urgent: Low Stock Materials</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {lowStockMaterials.slice(0, 6).map((material: any) => (
            <div key={material.id} className="bg-white p-3 rounded-lg border border-red-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-gray-900">{material.name}</p>
                  <p className="text-xs text-gray-600">{material.code}</p>
                </div>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">Urgent</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Stock: <span className="font-bold text-red-600">{material.stock} {material.unit}</span></span>
                <span className="text-gray-600">Min: {material.min_stock} {material.unit}</span>
              </div>
              <Link href={`/purchase-requests/create?material_id=${material.id}`}>
                <button className="w-full mt-2 px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary-600 transition">
                  Create PR
                </button>
              </Link>
            </div>
          ))}
        </div>
        {lowStockMaterials.length === 0 && (
          <div className="text-center py-4 text-gray-600">✓ All materials are adequately stocked</div>
        )}
      </div>

      {/* My Purchase Requests */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">My Recent Purchase Requests</h3>
          <Link href="/purchase-requests?filter=my_requests" className="text-sm text-primary hover:underline">View All</Link>
        </div>
        <div className="space-y-3">
          {myPRs.length > 0 ? myPRs.slice(0, 5).map((pr: any) => (
            <Link key={pr.id} href={`/purchase-requests/${pr.id}`}>
              <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{pr.title || pr.pr_number}</p>
                    <p className="text-xs text-gray-600">{pr.pr_number} • {new Date(pr.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    pr.status === 'approved' ? 'bg-green-100 text-green-800' :
                    pr.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {pr.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span>Items: {pr.items?.length || 0}</span>
                  <span>Stage: {pr.current_stage}</span>
                </div>
              </div>
            </Link>
          )) : (
            <div className="text-center py-8 text-gray-500">No purchase requests yet</div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/purchase-requests/create">
          <div className="card hover:shadow-lg transition cursor-pointer text-center bg-primary text-white">
            <ShoppingCart className="mx-auto mb-2" size={36} />
            <h4 className="font-semibold text-lg">Create Purchase Request</h4>
            <p className="text-sm mt-1 opacity-90">Request new materials</p>
          </div>
        </Link>
        <Link href="/materials">
          <div className="card hover:shadow-lg transition cursor-pointer text-center">
            <Package className="mx-auto text-primary mb-2" size={36} />
            <h4 className="font-semibold">Browse Materials</h4>
            <p className="text-sm text-gray-600 mt-1">View material catalog</p>
          </div>
        </Link>
        <Link href="/materials?filter=low-stock">
          <div className="card hover:shadow-lg transition cursor-pointer text-center">
            <AlertTriangle className="mx-auto text-red-600 mb-2" size={36} />
            <h4 className="font-semibold">Low Stock Report</h4>
            <p className="text-sm text-gray-600 mt-1">Review materials to reorder</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

