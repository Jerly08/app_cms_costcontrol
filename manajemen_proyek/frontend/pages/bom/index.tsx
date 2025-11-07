import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { bomAPI, projectsAPI, materialsAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/dummyData';
import { FileDown, Upload, Plus, Edit, Trash2, Calculator, X, Save, AlertCircle, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function BOMManagement() {
  const router = useRouter();
  const { project_id } = router.query;
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [bomList, setBomList] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(project_id as string || '');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteBomId, setDeleteBomId] = useState<string | null>(null);
  const [editingBom, setEditingBom] = useState<any>(null);
  const [error, setError] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    material_id: '',
    planned_qty: '',
    phase: 'foundation',
    notes: '',
  });

  // Auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
      fetchMaterials();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedProject) {
      fetchBOMByProject(selectedProject);
    }
  }, [selectedProject]);

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

  const fetchBOMByProject = async (projectId: string) => {
    try {
      setLoading(true);
      const response = await bomAPI.getByProject(projectId);
      setBomList(response.data || []);
    } catch (err) {
      console.error('Error fetching BOM:', err);
      setBomList([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      material_id: '',
      planned_qty: '',
      phase: 'foundation',
      notes: '',
    });
    setError('');
  };

  const handleAddBOM = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (!formData.material_id) {
        throw new Error('Please select a material');
      }
      if (!formData.planned_qty || parseFloat(formData.planned_qty) <= 0) {
        throw new Error('Please enter a valid planned quantity');
      }

      const bomData = {
        project_id: parseInt(selectedProject),
        material_id: parseInt(formData.material_id),
        planned_qty: parseFloat(formData.planned_qty),
        phase: formData.phase,
        notes: formData.notes,
      };

      await bomAPI.create(bomData);
      await fetchBOMByProject(selectedProject);
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to add BOM item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditBOM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBom) return;

    setSubmitting(true);
    setError('');

    try {
      if (!formData.material_id) {
        throw new Error('Please select a material');
      }
      if (!formData.planned_qty || parseFloat(formData.planned_qty) <= 0) {
        throw new Error('Please enter a valid planned quantity');
      }

      const bomData = {
        project_id: parseInt(selectedProject),
        material_id: parseInt(formData.material_id),
        planned_qty: parseFloat(formData.planned_qty),
        phase: formData.phase,
        notes: formData.notes,
      };

      await bomAPI.update(editingBom.id.toString(), bomData);
      await fetchBOMByProject(selectedProject);
      setShowEditModal(false);
      setEditingBom(null);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to update BOM item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteBomId) return;

    try {
      await bomAPI.delete(deleteBomId);
      setBomList(bomList.filter(bom => bom.id !== Number(deleteBomId)));
      setShowDeleteModal(false);
      setDeleteBomId(null);
    } catch (err) {
      console.error('Error deleting BOM:', err);
      alert('Failed to delete BOM item');
    }
  };

  const openEditModal = (bom: any) => {
    setEditingBom(bom);
    setFormData({
      material_id: bom.material_id?.toString() || '',
      planned_qty: bom.planned_qty?.toString() || '',
      phase: bom.phase || 'foundation',
      notes: bom.notes || '',
    });
    setShowEditModal(true);
  };

  const calculateUsagePercentage = (plannedQty: number, usedQty: number) => {
    if (plannedQty === 0) return 0;
    return (usedQty / plannedQty) * 100;
  };

  const calculateVariance = (estimated: number, actual: number) => {
    if (estimated === 0) return 0;
    return ((actual - estimated) / estimated) * 100;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600 bg-red-50';
    if (percentage >= 80) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  // Calculate totals
  const totalEstimated = bomList.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
  const totalActual = bomList.reduce((sum, item) => sum + (item.actual_cost || 0), 0);
  const totalVariance = calculateVariance(totalEstimated, totalActual);

  const phases = [
    { value: 'foundation', label: 'Foundation' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'interior', label: 'Interior' },
    { value: 'equipment', label: 'Equipment' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />

      <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="text-primary" />
            BOM Management
          </h1>
          <p className="text-gray-600 mt-1">Bill of Materials - Material Planning & Usage</p>
        </div>

        {/* Project Selector */}
        <div className="card mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Project <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">-- Select a Project --</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {selectedProject && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="card">
                <p className="text-sm text-gray-600 mb-1">Total Estimated Cost</p>
                <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totalEstimated)}</h3>
                <p className="text-xs text-gray-500 mt-1">{bomList.length} materials</p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-600 mb-1">Total Actual Cost</p>
                <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totalActual)}</h3>
                <p className="text-xs text-gray-500 mt-1">From material usage</p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-600 mb-1">Cost Variance</p>
                <h3
                  className={`text-2xl font-bold ${
                    totalVariance > 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {totalVariance > 0 ? '+' : ''}
                  {totalVariance.toFixed(2)}%
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {totalVariance > 0 ? 'Over budget' : 'Under budget'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                Add BOM Item
              </button>
              <Link href={`/bom/import?project_id=${selectedProject}`}>
                <button className="btn-secondary flex items-center gap-2">
                  <Upload size={18} />
                  Import from Excel
                </button>
              </Link>
              <Link href={`/bom/calculate?project_id=${selectedProject}`}>
                <button className="btn-secondary flex items-center gap-2">
                  <Calculator size={18} />
                  Calculate Usage
                </button>
              </Link>
              <button
                onClick={() => window.print()}
                className="btn-secondary flex items-center gap-2"
              >
                <FileDown size={18} />
                Export PDF
              </button>
            </div>

            {/* BOM Table */}
            <div className="card overflow-x-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Bill of Materials ({bomList.length})
              </h3>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading BOM data...</p>
                </div>
              ) : bomList.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Material</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Phase</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Planned Qty</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Used Qty</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Remaining</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Usage %</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Est. Cost</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Act. Cost</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bomList.map((bom) => {
                      const usagePercentage = calculateUsagePercentage(bom.planned_qty || 0, bom.used_qty || 0);
                      const remaining = (bom.planned_qty || 0) - (bom.used_qty || 0);
                      
                      return (
                        <tr key={bom.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{bom.material?.name || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{bom.material?.code || ''}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {bom.phase || 'N/A'}
                            </span>
                          </td>
                          <td className="text-right py-3 px-4 text-gray-700">
                            {bom.planned_qty || 0} {bom.material?.unit || ''}
                          </td>
                          <td className="text-right py-3 px-4 text-gray-700">
                            {bom.used_qty || 0} {bom.material?.unit || ''}
                          </td>
                          <td className="text-right py-3 px-4">
                            <span className={remaining < 0 ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                              {remaining.toFixed(2)} {bom.material?.unit || ''}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getUsageColor(usagePercentage)}`}>
                              {usagePercentage.toFixed(1)}%
                            </span>
                          </td>
                          <td className="text-right py-3 px-4 text-gray-700">
                            {formatCurrency(bom.estimated_cost || 0)}
                          </td>
                          <td className="text-right py-3 px-4 text-gray-700">
                            {formatCurrency(bom.actual_cost || 0)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => openEditModal(bom)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteBomId(bom.id.toString());
                                  setShowDeleteModal(true);
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <Package className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-500 mb-4">No BOM items found for this project</p>
                  <button
                    onClick={() => {
                      resetForm();
                      setShowAddModal(true);
                    }}
                    className="btn-primary"
                  >
                    Add First BOM Item
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {!selectedProject && (
          <div className="card text-center py-12">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">Please select a project to view BOM</p>
          </div>
        )}
      </main>

      {/* Add BOM Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add BOM Item</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleAddBOM}>
              <div className="space-y-4">
                {/* Material Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.material_id}
                    onChange={(e) => setFormData({ ...formData, material_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    <option value="">-- Select Material --</option>
                    {materials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name} ({material.code}) - {formatCurrency(material.unit_price)}/{material.unit}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Planned Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Planned Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.planned_qty}
                    onChange={(e) => setFormData({ ...formData, planned_qty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Phase */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Construction Phase <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.phase}
                    onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    {phases.map((phase) => (
                      <option key={phase.value} value={phase.value}>
                        {phase.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Add BOM</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit BOM Modal */}
      {showEditModal && editingBom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit BOM Item</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingBom(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleEditBOM}>
              <div className="space-y-4">
                {/* Material Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.material_id}
                    onChange={(e) => setFormData({ ...formData, material_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    <option value="">-- Select Material --</option>
                    {materials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name} ({material.code}) - {formatCurrency(material.unit_price)}/{material.unit}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Planned Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Planned Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.planned_qty}
                    onChange={(e) => setFormData({ ...formData, planned_qty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Phase */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Construction Phase <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.phase}
                    onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    {phases.map((phase) => (
                      <option key={phase.value} value={phase.value}>
                        {phase.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingBom(null);
                    resetForm();
                  }}
                  className="flex-1 btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Update BOM</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this BOM item? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteBomId(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

