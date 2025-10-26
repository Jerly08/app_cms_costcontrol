import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Table from '@/components/Table';
import { projects, purchases, formatCurrency } from '@/lib/dummyData';
import { ShoppingCart, Plus, TrendingDown, TrendingUp, FileDown } from 'lucide-react';
import { useState } from 'react';
import { exportPurchasingPDF } from '@/lib/pdfExport';

export default function Purchasing() {
  const [formData, setFormData] = useState({
    projectId: '',
    material: '',
    quantity: '',
    unit: '',
    estimatedPrice: '',
    actualPrice: '',
    vendor: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic akan ditambahkan nanti
    alert('Pembelian berhasil ditambahkan! (Demo)');
    // Reset form
    setFormData({
      projectId: '',
      material: '',
      quantity: '',
      unit: '',
      estimatedPrice: '',
      actualPrice: '',
      vendor: '',
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Calculate summary
  const totalEstimated = purchases.reduce(
    (sum, p) => sum + p.estimatedPrice * p.quantity,
    0
  );
  const totalActual = purchases.reduce(
    (sum, p) => sum + p.actualPrice * p.quantity,
    0
  );
  const savings = totalEstimated - totalActual;

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
      header: 'Material',
      accessor: 'material',
    },
    {
      header: 'Qty',
      accessor: 'quantity',
      cell: (value: number, row: any) => `${value} ${row.unit}`,
    },
    {
      header: 'Harga Estimasi',
      accessor: 'estimatedPrice',
      cell: (value: number) => (
        <span className="text-gray-700">{formatCurrency(value)}</span>
      ),
    },
    {
      header: 'Harga Aktual',
      accessor: 'actualPrice',
      cell: (value: number) => (
        <span className="text-gray-700">{formatCurrency(value)}</span>
      ),
    },
    {
      header: 'Selisih',
      accessor: 'difference',
      cell: (_: any, row: any) => {
        const diff = (row.actualPrice - row.estimatedPrice) * row.quantity;
        const isOver = diff > 0;
        return (
          <div className="flex items-center gap-1">
            {isOver ? (
              <TrendingUp size={16} className="text-red-600" />
            ) : (
              <TrendingDown size={16} className="text-green-600" />
            )}
            <span
              className={`font-semibold ${
                isOver ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {isOver ? '+' : ''}
              {formatCurrency(Math.abs(diff))}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Vendor',
      accessor: 'vendor',
      cell: (value: string) => (
        <span className="text-sm text-gray-600">{value}</span>
      ),
    },
    {
      header: 'Tanggal',
      accessor: 'date',
      cell: (value: string) => (
        <span className="text-sm text-gray-600">{value}</span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />

      {/* Main Content */}
      <main className="md:ml-64 pt-20 p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Purchasing Management
              </h1>
              <p className="text-gray-600 mt-1">
                Kelola pembelian material proyek konstruksi
              </p>
            </div>
            <button
              onClick={() => exportPurchasingPDF(purchases)}
              className="btn-secondary flex items-center gap-2"
            >
              <FileDown size={20} />
              Export PDF
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Estimasi</p>
                <h3 className="text-xl font-bold text-gray-900">
                  {formatCurrency(totalEstimated)}
                </h3>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="text-primary" size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Aktual</p>
                <h3 className="text-xl font-bold text-gray-900">
                  {formatCurrency(totalActual)}
                </h3>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {savings >= 0 ? 'Penghematan' : 'Kelebihan'}
                </p>
                <h3
                  className={`text-xl font-bold ${
                    savings >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(Math.abs(savings))}
                </h3>
              </div>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  savings >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                {savings >= 0 ? (
                  <TrendingDown className="text-green-600" size={24} />
                ) : (
                  <TrendingUp className="text-red-600" size={24} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form Input */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Plus className="text-primary" size={24} />
            <h2 className="text-lg font-semibold text-gray-900">
              Tambah Pembelian Material
            </h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proyek
                </label>
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">Pilih Proyek</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Material
                </label>
                <input
                  type="text"
                  name="material"
                  value={formData.material}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Contoh: Semen Portland"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Satuan
                </label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Contoh: kg, m³, sak"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harga Estimasi
                </label>
                <input
                  type="number"
                  name="estimatedPrice"
                  value={formData.estimatedPrice}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harga Aktual
                </label>
                <input
                  type="number"
                  name="actualPrice"
                  value={formData.actualPrice}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor
                </label>
                <input
                  type="text"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Nama vendor"
                  required
                />
              </div>

              <div className="flex items-end">
                <button type="submit" className="btn-primary w-full">
                  <Plus size={20} className="inline mr-2" />
                  Tambah
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Purchase Table */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Daftar Pembelian Material
          </h2>
          <Table columns={columns} data={purchases} />
        </div>
      </main>
    </div>
  );
}
