import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { bomAPI, materialsAPI, projectsAPI } from '@/lib/api';
import { ArrowLeft, Save } from 'lucide-react';

export default function CreateBOM() {
  const router = useRouter();
  const { project_id } = router.query;

  const [projects, setProjects] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    project_id: project_id || '',
    material_id: '',
    estimated_quantity: '',
    actual_quantity: '',
    estimated_cost: '',
    actual_cost: '',
    notes: '',
  });

  useEffect(() => {
    fetchProjects();
    fetchMaterials();
  }, []);

  useEffect(() => {
    if (project_id) {
      setFormData(prev => ({ ...prev, project_id: project_id as string }));
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

  const fetchMaterials = async () => {
    try {
      const response = await materialsAPI.getAll();
      setMaterials(response.data || []);
    } catch (err) {
      console.error('Error fetching materials:', err);
    }
  };

  const handleMaterialChange = (materialId: string) => {
    const selectedMaterial = materials.find(m => m.id === Number(materialId));
    if (selectedMaterial) {
      // Auto-calculate estimated cost based on unit price
      const estimatedCost = selectedMaterial.unit_price * Number(formData.estimated_quantity || 0);
      setFormData(prev => ({
        ...prev,
        material_id: materialId,
        estimated_cost: estimatedCost.toString(),
      }));
    } else {
      setFormData(prev => ({ ...prev, material_id: materialId }));
    }
  };

  const handleQuantityChange = (field: 'estimated_quantity' | 'actual_quantity', value: string) => {
    const selectedMaterial = materials.find(m => m.id === Number(formData.material_id));
    if (selectedMaterial) {
      if (field === 'estimated_quantity') {
        const estimatedCost = selectedMaterial.unit_price * Number(value || 0);
        setFormData(prev => ({
          ...prev,
          [field]: value,
          estimated_cost: estimatedCost.toString(),
        }));
      } else {
        const actualCost = selectedMaterial.unit_price * Number(value || 0);
        setFormData(prev => ({
          ...prev,
          [field]: value,
          actual_cost: actualCost.toString(),
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.project_id || !formData.material_id || !formData.estimated_quantity) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        project_id: Number(formData.project_id),
        material_id: Number(formData.material_id),
        estimated_quantity: Number(formData.estimated_quantity),
        actual_quantity: Number(formData.actual_quantity) || 0,
        estimated_cost: Number(formData.estimated_cost),
        actual_cost: Number(formData.actual_cost) || 0,
        notes: formData.notes,
      };

      await bomAPI.create(payload);
      alert('BOM item created successfully!');
      router.push(`/bom?project_id=${formData.project_id}`);
    } catch (err: any) {
      console.error('Error creating BOM:', err);
      alert(err.message || 'Failed to create BOM item');
    } finally {
      setLoading(false);
    }
  };

  const selectedMaterial = materials.find(m => m.id === Number(formData.material_id));

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />

      <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/bom">
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft size={20} />
              Back to BOM List
            </button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Add BOM Item</h1>
          <p className="text-gray-600 mt-1">Create a new Bill of Materials item</p>
        </div>

        {/* Form */}
        <div className="card max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="input w-full"
                required
              >
                <option value="">-- Select Project --</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Material Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.material_id}
                onChange={(e) => handleMaterialChange(e.target.value)}
                className="input w-full"
                required
              >
                <option value="">-- Select Material --</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name} ({material.code}) - Rp {material.unit_price?.toLocaleString() || 0}/{material.unit}
                  </option>
                ))}
              </select>
              {selectedMaterial && (
                <p className="text-sm text-gray-500 mt-1">
                  Category: {selectedMaterial.category} | Unit Price: Rp {selectedMaterial.unit_price?.toLocaleString() || 0}/{selectedMaterial.unit}
                </p>
              )}
            </div>

            {/* Estimated Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Quantity <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={formData.estimated_quantity}
                  onChange={(e) => handleQuantityChange('estimated_quantity', e.target.value)}
                  className="input flex-1"
                  placeholder="Enter quantity"
                  required
                />
                {selectedMaterial && (
                  <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm">
                    {selectedMaterial.unit}
                  </span>
                )}
              </div>
            </div>

            {/* Estimated Cost (Auto-calculated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Cost
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.estimated_cost}
                onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                className="input w-full bg-gray-50"
                placeholder="Auto-calculated"
                readOnly
              />
              <p className="text-sm text-gray-500 mt-1">
                Automatically calculated based on unit price × quantity
              </p>
            </div>

            {/* Actual Quantity (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actual Quantity (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={formData.actual_quantity}
                  onChange={(e) => handleQuantityChange('actual_quantity', e.target.value)}
                  className="input flex-1"
                  placeholder="Enter actual quantity used"
                />
                {selectedMaterial && (
                  <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm">
                    {selectedMaterial.unit}
                  </span>
                )}
              </div>
            </div>

            {/* Actual Cost (Auto-calculated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actual Cost
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.actual_cost}
                onChange={(e) => setFormData({ ...formData, actual_cost: e.target.value })}
                className="input w-full bg-gray-50"
                placeholder="Auto-calculated"
                readOnly
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input w-full"
                rows={3}
                placeholder="Additional notes..."
              />
            </div>

            {/* Variance Display */}
            {formData.estimated_cost && formData.actual_cost && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Variance Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Estimated Cost:</p>
                    <p className="font-semibold">Rp {Number(formData.estimated_cost).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Actual Cost:</p>
                    <p className="font-semibold">Rp {Number(formData.actual_cost).toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">Variance:</p>
                    <p className={`font-semibold ${
                      Number(formData.actual_cost) > Number(formData.estimated_cost)
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}>
                      {Number(formData.estimated_cost) > 0
                        ? `${(((Number(formData.actual_cost) - Number(formData.estimated_cost)) / Number(formData.estimated_cost)) * 100).toFixed(2)}%`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save BOM Item
                  </>
                )}
              </button>
              <Link href="/bom">
                <button type="button" className="btn-secondary">
                  Cancel
                </button>
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

