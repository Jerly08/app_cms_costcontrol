import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Chart from '@/components/Chart';
import Table from '@/components/Table';
import { formatCurrency } from '@/lib/dummyData';
import { TrendingUp, DollarSign, Activity, FileDown, AlertCircle } from 'lucide-react';
import { exportCashflowPDF } from '@/lib/pdfExport';
import { useAuth } from '@/contexts/AuthContext';

interface CashflowData {
  id: number;
  projectName: string;
  month: string;
  income: number;
  expense: number;
  balance: number;
  project_id?: number;
}

export default function Cashflow() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [cashflows, setCashflows] = useState<CashflowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch cashflow data from API
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCashflowData = async () => {
      try {
        setLoading(true);
        // TODO: Replace with your actual API endpoint
        // const response = await fetch('/api/v1/cashflow', {
        //   headers: {
        //     'Authorization': `Bearer ${localStorage.getItem('token')}`,
        //   },
        // });
        // const data = await response.json();
        // setCashflows(data.data || []);
        
        // For now, set empty data (no dummy data)
        setCashflows([]);
      } catch (err) {
        console.error('Error fetching cashflow:', err);
        setError('Failed to load cashflow data');
        setCashflows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCashflowData();
  }, [isAuthenticated]);

  // Calculate summary
  const totalIncome = cashflows.reduce((sum, c) => sum + c.income, 0);
  const totalExpense = cashflows.reduce((sum, c) => sum + c.expense, 0);
  const netBalance = totalIncome - totalExpense;

  // Prepare chart data
  const chartData = cashflows.map((cf) => ({
    month: cf.month,
    Pemasukan: cf.income,
    Pengeluaran: cf.expense,
    Saldo: cf.balance,
  }));

  // Table columns
  const columns = [
    {
      header: 'Proyek',
      accessor: 'projectName',
      cell: (value: string) => (
        <div className="font-medium text-gray-900">{value}</div>
      ),
    },
    {
      header: 'Bulan',
      accessor: 'month',
      cell: (value: string) => (
        <span className="text-sm text-gray-700">{value}</span>
      ),
    },
    {
      header: 'Pemasukan',
      accessor: 'income',
      cell: (value: number) => (
        <span className="text-green-600 font-semibold">
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      header: 'Pengeluaran',
      accessor: 'expense',
      cell: (value: number) => (
        <span className="text-red-600 font-semibold">
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      header: 'Saldo',
      accessor: 'balance',
      cell: (value: number) => {
        const isPositive = value >= 0;
        return (
          <span
            className={`font-bold ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatCurrency(value)}
          </span>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />

      {/* Main Content */}
      <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Cashflow Management
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Monitor arus kas dan keuangan proyek
              </p>
            </div>
            <button
              onClick={() => exportCashflowPDF(cashflows)}
              className="btn-secondary flex items-center gap-2 text-sm md:text-base"
            >
              <FileDown size={18} className="md:w-5 md:h-5" />
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-2">
                <p className="text-xs md:text-sm text-gray-600 mb-1">Total Pemasukan</p>
                <h3 className="text-base md:text-xl font-bold text-green-600 truncate">
                  {formatCurrency(totalIncome)}
                </h3>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="text-green-600" size={20} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-2">
                <p className="text-xs md:text-sm text-gray-600 mb-1">Total Pengeluaran</p>
                <h3 className="text-base md:text-xl font-bold text-red-600 truncate">
                  {formatCurrency(totalExpense)}
                </h3>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="text-red-600" size={20} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-2">
                <p className="text-xs md:text-sm text-gray-600 mb-1">Saldo Bersih</p>
                <h3
                  className={`text-base md:text-xl font-bold truncate ${
                    netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(netBalance)}
                </h3>
              </div>
              <div
                className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  netBalance >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                <Activity
                  className={netBalance >= 0 ? 'text-green-600' : 'text-red-600'}
                  size={20}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cashflow Chart */}
        <div className="card mb-4 md:mb-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
            Grafik Arus Kas Bulanan
          </h2>
          <Chart
            data={chartData}
            type="line"
            xAxisKey="month"
            dataKeys={[
              { key: 'Pemasukan', color: '#10b981', name: 'Pemasukan' },
              { key: 'Pengeluaran', color: '#ef4444', name: 'Pengeluaran' },
            ]}
            height={350}
          />
        </div>

        {/* Cashflow by Project Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          <div className="card">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
              Perbandingan Pemasukan vs Pengeluaran
            </h2>
            <Chart
              data={chartData}
              type="bar"
              xAxisKey="month"
              dataKeys={[
                { key: 'Pemasukan', color: '#10b981', name: 'Pemasukan' },
                { key: 'Pengeluaran', color: '#ef4444', name: 'Pengeluaran' },
              ]}
              height={300}
            />
          </div>

          <div className="card">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
              Tren Saldo Bulanan
            </h2>
            <Chart
              data={chartData}
              type="line"
              xAxisKey="month"
              dataKeys={[{ key: 'Saldo', color: '#2563eb', name: 'Saldo' }]}
              height={300}
            />
          </div>
        </div>

        {/* Cashflow Table */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Detail Cashflow per Proyek
          </h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading cashflow data...</p>
            </div>
          ) : cashflows.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500 text-lg mb-2">Tidak ada data cashflow</p>
              <p className="text-gray-400 text-sm">Buat project pertama Anda dan mulai input data cashflow</p>
            </div>
          ) : (
            <Table columns={columns} data={cashflows} />
          )}
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6">
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              💡 Tips Cashflow Management
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Monitor cashflow secara real-time untuk mencegah defisit</li>
              <li>• Pastikan pembayaran dari owner tepat waktu</li>
              <li>• Kelola pengeluaran sesuai jadwal proyek</li>
              <li>• Siapkan dana cadangan untuk kondisi darurat</li>
            </ul>
          </div>

          <div className="card bg-green-50 border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              📊 Status Keuangan
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-800">Rasio Solvabilitas</span>
                <span className="font-bold text-green-900">
                  {((totalIncome / totalExpense) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-800">Rata-rata Saldo</span>
                <span className="font-bold text-green-900">
                  {formatCurrency(
                    cashflows.reduce((sum, c) => sum + c.balance, 0) /
                      cashflows.length
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-800">Total Transaksi</span>
                <span className="font-bold text-green-900">
                  {cashflows.length} bulan
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
