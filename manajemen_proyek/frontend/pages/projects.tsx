import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import ProjectCard from '@/components/ProjectCard';
import { projects } from '@/lib/dummyData';
import { Search, Filter, Plus, FileDown } from 'lucide-react';
import { useState } from 'react';
import { exportProjectsPDF } from '@/lib/pdfExport';

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = ['All', 'On Track', 'Warning', 'Over Budget'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />

      {/* Main Content */}
      <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Daftar Proyek
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Kelola dan monitor semua proyek konstruksi
              </p>
            </div>
            <div className="flex gap-2 md:gap-3">
              <button
                onClick={() => exportProjectsPDF(projects)}
                className="btn-secondary flex items-center gap-2 text-sm md:text-base"
              >
                <FileDown size={18} className="md:w-5 md:h-5" />
                <span className="hidden sm:inline">Export PDF</span>
                <span className="sm:hidden">Export</span>
              </button>
              <button className="btn-primary flex items-center gap-2 text-sm md:text-base">
                <Plus size={18} className="md:w-5 md:h-5" />
                <span className="hidden sm:inline">Tambah Proyek Baru</span>
                <span className="sm:hidden">Tambah</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Cari nama proyek..."
                className="input-field pl-9 md:pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="relative sm:w-48">
              <Filter
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                className="input-field pl-9 md:pl-10 pr-8 appearance-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === 'All' ? 'Semua Status' : status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
            <p className="text-xs md:text-sm text-gray-600 mb-1">Total Proyek</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900">{projects.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
            <p className="text-xs md:text-sm text-gray-600 mb-1">On Track</p>
            <p className="text-xl md:text-2xl font-bold text-green-600">
              {projects.filter((p) => p.status === 'On Track').length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
            <p className="text-xs md:text-sm text-gray-600 mb-1">Warning</p>
            <p className="text-xl md:text-2xl font-bold text-yellow-600">
              {projects.filter((p) => p.status === 'Warning').length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
            <p className="text-xs md:text-sm text-gray-600 mb-1">Over Budget</p>
            <p className="text-xl md:text-2xl font-bold text-red-600">
              {projects.filter((p) => p.status === 'Over Budget').length}
            </p>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 text-lg">
              Tidak ada proyek yang ditemukan
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Coba ubah filter atau pencarian Anda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
