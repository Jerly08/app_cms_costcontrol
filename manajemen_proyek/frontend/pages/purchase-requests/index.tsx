import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Table from '@/components/Table';
import { purchaseRequestAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingCart, Plus, Filter, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/dummyData';

export default function PurchaseRequests() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchRequests();
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRequests();
    }
  }, [filterStatus]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const filter = filterStatus === 'all' ? undefined : filterStatus;
      const response = await purchaseRequestAPI.getAll(filter);
      setRequests(response.data || []);
    } catch (err) {
      console.error('Error fetching purchase requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, stage: string) => {
    const badges: any = {
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: <Clock size={14} />,
        label: `Pending - ${stage}`,
      },
      approved: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle size={14} />,
        label: 'Approved',
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <XCircle size={14} />,
        label: 'Rejected',
      },
    };

    const badge = badges[status] || badges.pending;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const columns = [
    {
      header: 'PR Number',
      accessor: 'pr_number',
      cell: (value: string) => (
        <div className="font-mono font-medium text-gray-900">{value}</div>
      ),
    },
    {
      header: 'Tanggal',
      accessor: 'created_at',
      cell: (value: string) => (
        <div className="text-gray-700">{formatDate(value)}</div>
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
      header: 'Material',
      accessor: 'material',
      cell: (value: any) => (
        <div className="font-medium text-gray-900">{value?.name || '-'}</div>
      ),
    },
    {
      header: 'Quantity',
      accessor: 'quantity',
      cell: (value: number, row: any) => (
        <div className="text-gray-700">
          {value} {row.unit}
        </div>
      ),
    },
    {
      header: 'Estimasi Harga',
      accessor: 'estimated_price',
      cell: (value: number) => (
        <div className="text-gray-700">{formatCurrency(value)}</div>
      ),
    },
    {
      header: 'Total',
      accessor: 'total',
      cell: (_: any, row: any) => (
        <div className="font-semibold text-gray-900">
          {formatCurrency(row.quantity * row.estimated_price)}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (value: string, row: any) => getStatusBadge(value, row.current_stage),
    },
    {
      header: 'Requester',
      accessor: 'requester',
      cell: (value: any) => (
        <div className="text-gray-700">{value?.name || '-'}</div>
      ),
    },
    {
      header: 'Aksi',
      accessor: 'id',
      cell: (value: number) => (
        <Link href={`/purchase-requests/${value}`}>
          <button className="text-primary hover:text-primary-dark flex items-center gap-1">
            <Eye size={16} />
            <span className="text-sm">Detail</span>
          </button>
        </Link>
      ),
    },
  ];

  const statusCounts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />

      <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="text-primary" />
              Purchase Requests
            </h1>
            <p className="text-gray-600 mt-1">Kelola permintaan pembelian material</p>
          </div>
          <Link href="/purchase-requests/create">
            <button className="btn-primary flex items-center gap-2">
              <Plus size={18} />
              Buat PR Baru
            </button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilterStatus('all')}>
            <p className="text-sm text-gray-600">Total PR</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{statusCounts.all}</h3>
          </div>
          <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilterStatus('pending')}>
            <p className="text-sm text-gray-600">Pending</p>
            <h3 className="text-2xl font-bold text-yellow-600 mt-1">{statusCounts.pending}</h3>
          </div>
          <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilterStatus('approved')}>
            <p className="text-sm text-gray-600">Approved</p>
            <h3 className="text-2xl font-bold text-green-600 mt-1">{statusCounts.approved}</h3>
          </div>
          <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilterStatus('rejected')}>
            <p className="text-sm text-gray-600">Rejected</p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">{statusCounts.rejected}</h3>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={18} className="text-gray-600" />
            <span className="font-medium text-gray-700">Filter Status:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Semua' },
              { key: 'pending', label: 'Pending' },
              { key: 'approved', label: 'Approved' },
              { key: 'rejected', label: 'Rejected' },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setFilterStatus(filter.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === filter.key
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label} ({statusCounts[filter.key as keyof typeof statusCounts]})
              </button>
            ))}
          </div>
        </div>

        {/* PR Table */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Daftar Purchase Requests ({requests.length})
          </h3>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-gray-600 mt-2">Memuat data...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto text-gray-400" size={48} />
              <p className="text-gray-600 mt-2">Belum ada purchase request</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table columns={columns} data={requests} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

