import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Table from '@/components/Table';
import { materialsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Plus, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/dummyData';

export default function Materials() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchMaterials();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = showLowStockOnly 
        ? await materialsAPI.getLowStock()
        : await materialsAPI.getAll();
      setMaterials(response.data || []);
    } catch (err) {
      console.error('Error fetching materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMaterials();
    }
  }, [showLowStockOnly]);

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus material ini?')) return;

    try {
      await materialsAPI.delete(id.toString());
      fetchMaterials();
    } catch (err) {
      console.error('Error deleting material:', err);
      alert('Gagal menghapus material');
    }
  };

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { color: 'text-red-600', label: 'Habis', bg: 'bg-red-50' };
    if (stock <= minStock) return { color: 'text-orange-600', label: 'Low Stock', bg: 'bg-orange-50' };
    return { color: 'text-green-600', label: 'Normal', bg: 'bg-green-50' };
  };

  const columns = [
    {
      header: 'Kode',
      accessor: 'code',
      cell: (value: string) => (
        <div className="font-mono font-medium text-gray-900">{value}</div>
      ),
    },
    {
      header: 'Nama Material',
      accessor: 'name',
      cell: (value: string) => (
        <div className="font-medium text-gray-900">{value}</div>
      ),
    },
    {
      header: 'Kategori',
      accessor: 'category',
      cell: (value: string) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {value}
        </span>
      ),
    },
    {
      header: 'Harga Satuan',
      accessor: 'unit_price',
      cell: (value: number) => (
        <div className="text-gray-700">{formatCurrency(value)}</div>
      ),
    },
    {
      header: 'Stok',
      accessor: 'stock',
      cell: (value: number, row: any) => {
        const status = getStockStatus(value, row.min_stock);
        return (
          <div className={`flex items-center gap-2 ${status.bg} px-2 py-1 rounded`}>
            <span className={`font-semibold ${status.color}`}>
              {value} {row.unit}
            </span>
            {value <= row.min_stock && <AlertTriangle size={16} className="text-orange-500" />}
          </div>
        );
      },
    },
    {
      header: 'Min. Stok',
      accessor: 'min_stock',
      cell: (value: number, row: any) => (
        <div className="text-gray-600">{value} {row.unit}</div>
      ),
    },
    {
      header: 'Supplier',
      accessor: 'supplier',
      cell: (value: string) => (
        <div className="text-gray-700">{value || '-'}</div>
      ),
    },
    {
      header: 'Aksi',
      accessor: 'id',
      cell: (value: number) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/materials/${value}/edit`)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDelete(value)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const lowStockCount = materials.filter(m => m.stock <= m.min_stock).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />

      <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="text-primary" />
              Manajemen Material
            </h1>
            <p className="text-gray-600 mt-1">Kelola material konstruksi dan stok</p>
          </div>
          <Link href="/materials/create">
            <button className="btn-primary flex items-center gap-2">
              <Plus size={18} />
              Tambah Material
            </button>
          </Link>
        </div>

        {/* Low Stock Alert */}
        {lowStockCount > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="text-orange-500 flex-shrink-0" size={24} />
            <div>
              <p className="font-semibold text-orange-900">Peringatan Stok Rendah</p>
              <p className="text-sm text-orange-700 mt-1">
                {lowStockCount} material memiliki stok di bawah minimum. Segera lakukan pemesanan.
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                className="w-4 h-4 text-primary rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Tampilkan hanya stok rendah
              </span>
            </label>
          </div>
        </div>

        {/* Materials Table */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Daftar Material ({materials.length})
            </h3>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-gray-600 mt-2">Memuat data...</p>
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto text-gray-400" size={48} />
              <p className="text-gray-600 mt-2">Belum ada material</p>
            </div>
          ) : (
            <Table columns={columns} data={materials} />
          )}
        </div>
      </main>
    </div>
  );
}

