import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { bomAPI, projectsAPI, materialsAPI, materialUsageAPI, dailyReportsAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/dummyData';
import { 
  Plus, Edit, Trash2, X, Save, AlertCircle, Package, 
  Calendar, TrendingUp, BarChart3, FileText, Download,
  Filter, Search, Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface MaterialUsage {
  id: number;
  project_id: number;
  material_id: number;
  material: any;
  daily_report_id?: number;
  daily_report?: any;
  quantity: number;
  cost: number;
  usage_date: string;
  used_by: number;
  user: any;
  notes: string;
  created_at: string;
}

interface BOMItem {
  id: number;
  material_id: number;
  material: any;
  planned_qty: number;
  used_qty: number;
  remaining_qty: number;
  estimated_cost: number;
  actual_cost: number;
  phase: string;
}

export default function MaterialUsageTracking() {
  const router = useRouter();
  const { project_id } = router.query;
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  
  // State for data
  const [usageList, setUsageList] = useState<MaterialUsage[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(project_id as string || '');
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingUsage, setEditingUsage] = useState<MaterialUsage | null>(null);
  const [viewingUsage, setViewingUsage] = useState<MaterialUsage | null>(null);
  const [deleteUsageId, setDeleteUsageId] = useState<string | null>(null);
  
  // Filter states
  const [filterMaterial, setFilterMaterial] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    material_id: '',
    quantity: '',
    usage_date: new Date().toISOString().split('T')[0],
    daily_report_id: '',
    notes: '',
  });

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'comparison'>('list');

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
      fetchUsageByProject(selectedProject);
      fetchDailyReports(selectedProject);
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

  const fetchUsageByProject = async (projectId: string) => {
    try {
      setLoading(true);
      const response = await materialUsageAPI.getByProject(projectId);
      setUsageList(response.data || []);
    } catch (err) {
      console.error('Error fetching material usage:', err);
      setUsageList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyReports = async (projectId: string) => {
    try {
      const response = await dailyReportsAPI.getAll(projectId);
      setDailyReports(response.data || []);
    } catch (err) {
      console.error('Error fetching daily reports:', err);
    }
  };

  const fetchBOMByProject = async (projectId: string) => {
    try {
      const response = await bomAPI.getByProject(projectId);
      setBomItems(response.data || []);
    } catch (err) {
      console.error('Error fetching BOM:', err);
      setBomItems([]);
    }
  };

  const resetForm = () => {
    setFormData({
      material_id: '',
      quantity: '',
      usage_date: new Date().toISOString().split('T')[0],
      daily_report_id: '',
      notes: '',
    });
    setError('');
  };

  const handleAddUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (!formData.material_id) {
        throw new Error('Please select a material');
      }
      if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
        throw new Error('Please enter a valid quantity');
      }
      if (!formData.usage_date) {
        throw new Error('Please select usage date');
      }

      const usageData = {
        project_id: parseInt(selectedProject),
        material_id: parseInt(formData.material_id),
        quantity: parseFloat(formData.quantity),
        usage_date: formData.usage_date,
        daily_report_id: formData.daily_report_id ? parseInt(formData.daily_report_id) : null,
        notes: formData.notes,
      };

      await materialUsageAPI.create(usageData);
      await fetchUsageByProject(selectedProject);
      await fetchBOMByProject(selectedProject); // Refresh BOM to update used_qty
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to record material usage');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUsage) return;

    setSubmitting(true);
    setError('');

    try {
      if (!formData.material_id) {
        throw new Error('Please select a material');
      }
      if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
        throw new Error('Please enter a valid quantity');
      }

      const usageData = {
        project_id: parseInt(selectedProject),
        material_id: parseInt(formData.material_id),
        quantity: parseFloat(formData.quantity),
        usage_date: formData.usage_date,
        daily_report_id: formData.daily_report_id ? parseInt(formData.daily_report_id) : null,
        notes: formData.notes,
      };

      await materialUsageAPI.update(editingUsage.id.toString(), usageData);
      await fetchUsageByProject(selectedProject);
      await fetchBOMByProject(selectedProject);
      setShowEditModal(false);
      setEditingUsage(null);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to update material usage');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUsageId) return;

    try {
      await materialUsageAPI.delete(deleteUsageId);
      setUsageList(usageList.filter(usage => usage.id !== Number(deleteUsageId)));
      await fetchBOMByProject(selectedProject); // Refresh BOM
      setShowDeleteModal(false);
      setDeleteUsageId(null);
    } catch (err) {
      console.error('Error deleting usage:', err);
      alert('Failed to delete material usage');
    }
  };

  const openEditModal = (usage: MaterialUsage) => {
    setEditingUsage(usage);
    setFormData({
      material_id: usage.material_id?.toString() || '',
      quantity: usage.quantity?.toString() || '',
      usage_date: usage.usage_date ? usage.usage_date.split('T')[0] : '',
      daily_report_id: usage.daily_report_id?.toString() || '',
      notes: usage.notes || '',
    });
    setShowEditModal(true);
  };

  const openDetailModal = (usage: MaterialUsage) => {
    setViewingUsage(usage);
    setShowDetailModal(true);
  };

  const calculateUsagePercentage = (plannedQty: number, usedQty: number) => {
    if (plannedQty === 0) return 0;
    return (usedQty / plannedQty) * 100;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600 bg-red-50';
    if (percentage >= 80) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getRemainingColor = (remaining: number) => {
    if (remaining < 0) return 'text-red-600 font-semibold';
    if (remaining === 0) return 'text-gray-600';
    return 'text-green-600';
  };

  // Filter usage list
  const filteredUsage = usageList.filter(usage => {
    if (filterMaterial && usage.material_id !== parseInt(filterMaterial)) return false;
    if (filterDateFrom && usage.usage_date < filterDateFrom) return false;
    if (filterDateTo && usage.usage_date > filterDateTo) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const materialName = usage.material?.name?.toLowerCase() || '';
      const materialCode = usage.material?.code?.toLowerCase() || '';
      const notes = usage.notes?.toLowerCase() || '';
      if (!materialName.includes(query) && !materialCode.includes(query) && !notes.includes(query)) {
        return false;
      }
    }
    return true;
  });

  // Calculate totals
  const totalUsageCost = filteredUsage.reduce((sum, usage) => sum + (usage.cost || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />

      <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="text-primary" />
            Material Usage Tracking
          </h1>
          <p className="text-gray-600 mt-1">Track material consumption and compare against BOM</p>
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
            {/* View Mode Toggle & Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FileText size={18} />
                  Usage List
                </button>
                <button
                  onClick={() => setViewMode('comparison')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    viewMode === 'comparison'
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 size={18} />
                  BOM Comparison
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                  <p className="text-xs text-gray-600">Total Records</p>
                  <p className="text-lg font-bold text-gray-900">{filteredUsage.length}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                  <p className="text-xs text-gray-600">Total Cost</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(totalUsageCost)}</p>
                </div>
              </div>
            </div>

            {viewMode === 'list' ? (
              <>
                {/* Filters & Actions */}
                <div className="card mb-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search material name, code, or notes..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Material Filter */}
                    <select
                      value={filterMaterial}
                      onChange={(e) => setFilterMaterial(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">All Materials</option>
                      {materials.map((material) => (
                        <option key={material.id} value={material.id}>
                          {material.name}
                        </option>
                      ))}
                    </select>

                    {/* Date From */}
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="From Date"
                    />

                    {/* Date To */}
                    <input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="To Date"
                    />

                    {/* Clear Filters */}
                    {(filterMaterial || filterDateFrom || filterDateTo || searchQuery) && (
                      <button
                        onClick={() => {
                          setFilterMaterial('');
                          setFilterDateFrom('');
                          setFilterDateTo('');
                          setSearchQuery('');
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => {
                        resetForm();
                        setShowAddModal(true);
                      }}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Record Usage
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Download size={18} />
                      Export
                    </button>
                  </div>
                </div>

                {/* Usage List Table */}
                <div className="card overflow-x-auto">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Material Usage Records ({filteredUsage.length})
                  </h3>

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                      <p className="text-gray-600 mt-4">Loading usage data...</p>
                    </div>
                  ) : filteredUsage.length > 0 ? (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Material</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Quantity</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Cost</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Daily Report</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Used By</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsage.map((usage) => (
                          <tr key={usage.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-gray-700">
                              {new Date(usage.usage_date).toLocaleDateString('id-ID')}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-gray-900">{usage.material?.name || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{usage.material?.code || ''}</div>
                            </td>
                            <td className="text-right py-3 px-4 text-gray-700">
                              {usage.quantity} {usage.material?.unit || ''}
                            </td>
                            <td className="text-right py-3 px-4 text-gray-700">
                              {formatCurrency(usage.cost || 0)}
                            </td>
                            <td className="py-3 px-4">
                              {usage.daily_report_id ? (
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                  Report #{usage.daily_report_id}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-gray-700">
                              {usage.user?.name || 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => openDetailModal(usage)}
                                  className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                  title="View Details"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => openEditModal(usage)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Edit"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteUsageId(usage.id.toString());
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
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-12">
                      <Package className="mx-auto text-gray-400 mb-4" size={48} />
                      <p className="text-gray-500 mb-4">No material usage records found</p>
                      <button
                        onClick={() => {
                          resetForm();
                          setShowAddModal(true);
                        }}
                        className="btn-primary"
                      >
                        Record First Usage
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* BOM Comparison View */
              <div className="card overflow-x-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  BOM vs Actual Usage Comparison
                </h3>

                {bomItems.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Material</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Phase</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Planned</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Used</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Remaining</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Usage %</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bomItems.map((bom) => {
                        const usagePercentage = calculateUsagePercentage(bom.planned_qty, bom.used_qty);
                        const remaining = bom.planned_qty - bom.used_qty;
                        
                        return (
                          <tr key={bom.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="font-medium text-gray-900">{bom.material?.name || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{bom.material?.code || ''}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {bom.phase}
                              </span>
                            </td>
                            <td className="text-right py-3 px-4 text-gray-700">
                              {bom.planned_qty} {bom.material?.unit}
                            </td>
                            <td className="text-right py-3 px-4 text-gray-700">
                              {bom.used_qty} {bom.material?.unit}
                            </td>
                            <td className="text-right py-3 px-4">
                              <span className={getRemainingColor(remaining)}>
                                {remaining.toFixed(2)} {bom.material?.unit}
                              </span>
                            </td>
                            <td className="text-center py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getUsageColor(usagePercentage)}`}>
                                {usagePercentage.toFixed(1)}%
                              </span>
                            </td>
                            <td className="text-center py-3 px-4">
                              {usagePercentage >= 100 ? (
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                  Over Budget
                                </span>
                              ) : usagePercentage >= 80 ? (
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                                  Warning
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  On Track
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-500 mb-4">No BOM data available for comparison</p>
                    <p className="text-sm text-gray-400">Please add BOM items first to track usage against planned quantities</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {!selectedProject && (
          <div className="card text-center py-12">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">Please select a project to view material usage</p>
          </div>
        )}
      </main>

      {/* Add Usage Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Record Material Usage</h3>
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

            <form onSubmit={handleAddUsage}>
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
                        {material.name} ({material.code}) - {material.unit}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity Used <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Usage Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usage Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.usage_date}
                    onChange={(e) => setFormData({ ...formData, usage_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                {/* Daily Report (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link to Daily Report (Optional)
                  </label>
                  <select
                    value={formData.daily_report_id}
                    onChange={(e) => setFormData({ ...formData, daily_report_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">-- No Report --</option>
                    {dailyReports.map((report) => (
                      <option key={report.id} value={report.id}>
                        Report {new Date(report.report_date).toLocaleDateString('id-ID')} - {report.title}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Link this usage to a daily report for better tracking
                  </p>
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
                    placeholder="Additional notes about this usage..."
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
                      <span>Recording...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Record Usage</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Usage Modal */}
      {showEditModal && editingUsage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Material Usage</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUsage(null);
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

            <form onSubmit={handleEditUsage}>
              <div className="space-y-4">
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
                        {material.name} ({material.code}) - {material.unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity Used <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usage Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.usage_date}
                    onChange={(e) => setFormData({ ...formData, usage_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link to Daily Report (Optional)
                  </label>
                  <select
                    value={formData.daily_report_id}
                    onChange={(e) => setFormData({ ...formData, daily_report_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">-- No Report --</option>
                    {dailyReports.map((report) => (
                      <option key={report.id} value={report.id}>
                        Report {new Date(report.report_date).toLocaleDateString('id-ID')} - {report.title}
                      </option>
                    ))}
                  </select>
                </div>

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
                    setEditingUsage(null);
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
                      <span>Update Usage</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && viewingUsage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Usage Details</h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setViewingUsage(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Material</p>
                <p className="text-base font-semibold text-gray-900">
                  {viewingUsage.material?.name} ({viewingUsage.material?.code})
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Quantity Used</p>
                  <p className="text-base font-semibold text-gray-900">
                    {viewingUsage.quantity} {viewingUsage.material?.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cost</p>
                  <p className="text-base font-semibold text-gray-900">
                    {formatCurrency(viewingUsage.cost || 0)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Usage Date</p>
                <p className="text-base font-semibold text-gray-900">
                  {new Date(viewingUsage.usage_date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {viewingUsage.daily_report_id && (
                <div>
                  <p className="text-sm text-gray-600">Linked Daily Report</p>
                  <p className="text-base font-semibold text-primary">
                    Daily Report #{viewingUsage.daily_report_id}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Recorded By</p>
                <p className="text-base font-semibold text-gray-900">
                  {viewingUsage.user?.name || 'Unknown'}
                </p>
              </div>

              {viewingUsage.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="text-base text-gray-900">{viewingUsage.notes}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-xs text-gray-500">
                  Created: {new Date(viewingUsage.created_at).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setViewingUsage(null);
                }}
                className="w-full btn-secondary"
              >
                Close
              </button>
            </div>
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
              Are you sure you want to delete this material usage record? This action cannot be undone and will affect BOM calculations.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteUsageId(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

