import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { projectsAPI, materialsAPI, purchaseRequestAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingCart, Save, AlertCircle, Plus, X } from 'lucide-react';
import { formatCurrency } from '@/lib/dummyData';

interface PRItem {
  material_id: string;
  material_name?: string;
  quantity: number;
  unit: string;
  estimated_price: number;
  vendor: string;
  notes: string;
}

export default function CreatePurchaseRequest() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    project_id: '',
    title: '',
    description: '',
    required_date: '',
    priority: 'normal',
  });

  const [items, setItems] = useState<PRItem[]>([
    {
      material_id: '',
      quantity: 0,
      unit: '',
      estimated_price: 0,
      vendor: '',
      notes: '',
    },
  ]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchProjects();
      fetchMaterials();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll();
      setProjects(response.data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await materialsAPI.getAll();
      setMaterials(response.data || []);
    } catch (err) {
      console.error('Error fetching materials:', err);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        material_id: '',
        quantity: 0,
        unit: '',
        estimated_price: 0,
        vendor: '',
        notes: '',
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof PRItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-fill unit when material is selected
    if (field === 'material_id') {
      const material = materials.find((m) => m.id.toString() === value);
      if (material) {
        newItems[index].unit = material.unit;
        newItems[index].estimated_price = material.unit_price;
        newItems[index].material_name = material.name;
      }
    }

    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.estimated_price, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.project_id) {
        throw new Error('Pilih proyek terlebih dahulu');
      }
      if (!formData.title.trim()) {
        throw new Error('Judul PR harus diisi');
      }
      if (items.some((item) => !item.material_id || item.quantity <= 0)) {
        throw new Error('Lengkapi semua item material');
      }

      await purchaseRequestAPI.create({
        ...formData,
        items,
        total_amount: calculateTotal(),
      });

      router.push('/purchase-requests');
    } catch (err: any) {
      setError(err.message || 'Gagal membuat purchase request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />

      <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
        <div className="max-w-5xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="text-primary" />
              Buat Purchase Request
            </h1>
            <p className="text-gray-600 mt-1">Ajukan permintaan pembelian material</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Basic Info */}
            <div className="card mb-6">
              <h3 className="text-lg font-semibold mb-4">Informasi Umum</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proyek <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Judul PR <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g. Pembelian Semen untuk Fondasi"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Dibutuhkan
                  </label>
                  <input
                    type="date"
                    value={formData.required_date}
                    onChange={(e) => setFormData({ ...formData, required_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioritas
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                    placeholder="Jelaskan kebutuhan material..."
                  />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="card mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Item Material</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Plus size={16} />
                  Tambah Item
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      >
                        <X size={18} />
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Material <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={item.material_id}
                          onChange={(e) => updateItem(index, 'material_id', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        >
                          <option value="">Pilih Material</option>
                          {materials.map((material) => (
                            <option key={material.id} value={material.id}>
                              {material.code} - {material.name} ({material.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Unit
                        </label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateItem(index, 'unit', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          readOnly
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Harga Estimasi
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.estimated_price}
                          onChange={(e) => updateItem(index, 'estimated_price', parseFloat(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vendor / Supplier
                        </label>
                        <input
                          type="text"
                          value={item.vendor}
                          onChange={(e) => updateItem(index, 'vendor', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Nama vendor"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Catatan
                        </label>
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => updateItem(index, 'notes', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Spesifikasi atau catatan tambahan"
                        />
                      </div>

                      <div className="md:col-span-3 bg-gray-50 rounded p-3">
                        <p className="text-sm text-gray-600">
                          Subtotal: <span className="font-semibold text-gray-900">{formatCurrency(item.quantity * item.estimated_price)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Estimasi:</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={18} />
                {loading ? 'Menyimpan...' : 'Submit PR'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

