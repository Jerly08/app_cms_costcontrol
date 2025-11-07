import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, AlertCircle, Loader } from 'lucide-react';
import Link from 'next/link';
import { projectsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function CreateProject() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customer: '',
    city: '',
    address: '',
    projectType: 'New Build',
    budget: '',
    startDate: '',
    endDate: '',
    overallProgress: 0,
    foundation: 0,
    utilities: 0,
    interior: 0,
    equipment: 0,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate dates
      if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        if (end < start) {
          setError('End Date harus setelah Start Date');
          setLoading(false);
          return;
        }
      }

      // Convert budget to number if it's a string
      const budgetValue = formData.budget 
        ? (typeof formData.budget === 'string' 
          ? parseFloat(formData.budget.replace(/[^0-9.]/g, '')) 
          : formData.budget)
        : 0;

      const projectData = {
        name: formData.name,
        description: formData.description || '',
        customer: formData.customer || '',
        city: formData.city || '',
        address: formData.address || '',
        project_type: formData.projectType,
        estimated_cost: budgetValue,
        start_date: formData.startDate,
        end_date: formData.endDate,
        progress: {
          overall: formData.overallProgress || 0,
          foundation: formData.foundation || 0,
          utilities: formData.utilities || 0,
          interior: formData.interior || 0,
          equipment: formData.equipment || 0,
        },
      };

      console.log('Sending project data:', projectData);
      
      const response = await projectsAPI.create(projectData);
      console.log('Project created successfully:', response);
      
      alert('Proyek berhasil dibuat!');
      router.push('/projects');
    } catch (err: any) {
      console.error('Error creating project:', err);
      console.error('Error details:', err.response || err);
      
      // Extract more detailed error message
      let errorMessage = 'Gagal membuat proyek. Silakan coba lagi.';
      if (err.message) {
        errorMessage = err.message;
      }
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/projects');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />

      {/* Main Content */}
      <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
        {/* Back Button */}
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Projects</span>
        </Link>

        {/* Form Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Create New Project
            </h1>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Project Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Downtown Restaurant Kitchen"
                  className="input-field"
                  required
                />
              </div>

              {/* Project Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Project Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the project scope, goals, and key features..."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>

              {/* Customer & City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="customer"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Customer
                  </label>
                  <input
                    type="text"
                    id="customer"
                    name="customer"
                    value={formData.customer}
                    onChange={handleChange}
                    placeholder="e.g., Downtown Bistro LLC"
                    className="input-field"
                  />
                </div>
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g., Seattle"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g., 1234 Pike Street, Seattle, WA 98101"
                  className="input-field"
                />
              </div>

              {/* Project Type & Budget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="projectType"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Project Type
                  </label>
                  <select
                    id="projectType"
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="New Build">New Build</option>
                    <option value="Renovation">Renovation</option>
                    <option value="Expansion">Expansion</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="budget"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Budget (IDR)
                  </label>
                  <input
                    type="text"
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    placeholder="Rp 500.000.000 (500 juta)"
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimal: Rp 10.000.000 (10 juta rupiah)
                  </p>
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="startDate"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="endDate"
                    className="block text-sm font-medium text-gray-900 mb-2"
                  >
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              {/* Progress Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Progress Breakdown
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label
                      htmlFor="overallProgress"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Overall Progress (%)
                    </label>
                    <input
                      type="number"
                      id="overallProgress"
                      name="overallProgress"
                      value={formData.overallProgress}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      placeholder="0"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="foundation"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Foundation (%)
                    </label>
                    <input
                      type="number"
                      id="foundation"
                      name="foundation"
                      value={formData.foundation}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      placeholder="0"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="utilities"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Utilities (%)
                    </label>
                    <input
                      type="number"
                      id="utilities"
                      name="utilities"
                      value={formData.utilities}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      placeholder="0"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="interior"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Interior (%)
                    </label>
                    <input
                      type="number"
                      id="interior"
                      name="interior"
                      value={formData.interior}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      placeholder="0"
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="mt-4 max-w-xs">
                  <label
                    htmlFor="equipment"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Equipment (%)
                  </label>
                  <input
                    type="number"
                    id="equipment"
                    name="equipment"
                    value={formData.equipment}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    placeholder="0"
                    className="input-field"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin" size={18} />
                      Membuat...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

