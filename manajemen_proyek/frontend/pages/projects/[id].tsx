import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { projects, formatCurrency, calculateVariance } from '@/lib/dummyData';
import { ArrowLeft, Calendar, MapPin, Building2, User as UserIcon, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = router.query;

  // Find project by ID
  const project = projects.find((p) => p.id === Number(id));

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <Navbar />
        <main className="md:ml-64 pt-16 md:pt-20 p-6">
          <div className="card text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Proyek Tidak Ditemukan
            </h2>
            <p className="text-gray-600 mb-4">
              Proyek dengan ID {id} tidak ditemukan
            </p>
            <Link href="/projects" className="btn-primary">
              Kembali ke Projects
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const variance = calculateVariance(project.estimatedCost, project.actualCost);
  const isOverBudget = variance > 0;

  const statusColors = {
    'On Track': 'bg-green-100 text-green-800',
    'Warning': 'bg-yellow-100 text-yellow-800',
    'Over Budget': 'bg-red-100 text-red-800',
  };

  // Mock progress breakdown data (would come from API)
  const progressData = project.progressBreakdown || {
    foundation: 0,
    utilities: 0,
    interior: 0,
    equipment: 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />

      <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
        {/* Back Button */}
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Projects</span>
        </Link>

        {/* Project Header */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {project.name}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    statusColors[project.status]
                  }`}
                >
                  {project.status}
                </span>
              </div>
              {project.description && (
                <p className="text-gray-600 mb-4">{project.description}</p>
              )}
            </div>
          </div>

          {/* Project Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {project.customer && (
              <div className="flex items-start gap-3">
                <UserIcon size={20} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium text-gray-900">{project.customer}</p>
                </div>
              </div>
            )}
            {project.city && (
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">City</p>
                  <p className="font-medium text-gray-900">{project.city}</p>
                </div>
              </div>
            )}
            {project.projectType && (
              <div className="flex items-start gap-3">
                <Briefcase size={20} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Project Type</p>
                  <p className="font-medium text-gray-900">{project.projectType}</p>
                </div>
              </div>
            )}
            {project.address && (
              <div className="flex items-start gap-3 md:col-span-2">
                <Building2 size={20} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-gray-900">{project.address}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Calendar size={20} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Timeline</p>
                <p className="font-medium text-gray-900">
                  {project.startDate} - {project.endDate}
                </p>
              </div>
            </div>
          </div>

          {/* Budget Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-500 mb-1">Estimated Cost</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(project.estimatedCost)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Actual Cost</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(project.actualCost)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Variance</p>
              <p
                className={`text-xl font-bold ${
                  isOverBudget ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {isOverBudget ? '+' : ''}
                {variance.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overall Progress */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Overall Progress
            </h2>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl font-bold text-primary">
                  {project.progress}%
                </span>
                <span className="text-sm text-gray-500">Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-primary h-4 rounded-full transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Renovasi pabrik produksi ompreng
            </p>
          </div>

          {/* Progress Breakdown */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Progress Breakdown
            </h2>
            <div className="space-y-4">
              {/* Foundation */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Foundation
                  </span>
                  <span className="text-sm font-semibold text-blue-600">
                    {progressData.foundation}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${progressData.foundation}%` }}
                  />
                </div>
              </div>

              {/* Utilities */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Utilities
                  </span>
                  <span className="text-sm font-semibold text-teal-600">
                    {progressData.utilities}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-teal-500 h-2 rounded-full"
                    style={{ width: `${progressData.utilities}%` }}
                  />
                </div>
              </div>

              {/* Interior & Finishes */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Interior & Finishes
                  </span>
                  <span className="text-sm font-semibold text-orange-600">
                    {progressData.interior}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${progressData.interior}%` }}
                  />
                </div>
              </div>

              {/* Equipment */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Equipment
                  </span>
                  <span className="text-sm font-semibold text-purple-600">
                    {progressData.equipment}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${progressData.equipment}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

