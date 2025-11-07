import { Project, formatCurrency, calculateVariance } from '@/lib/dummyData';
import { TrendingUp, TrendingDown, AlertCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { projectsAPI } from '@/lib/api';

interface ProjectCardProps {
  project: Project;
  onDelete?: () => void;
}

const ProjectCard = ({ project, onDelete }: ProjectCardProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Map backend field names to frontend
  const estimatedCost = project.estimated_cost || project.estimatedCost || 0;
  const actualCost = project.actual_cost || project.actualCost || 0;
  const startDate = project.start_date || project.startDate || '';
  const endDate = project.end_date || project.endDate || '';
  
  const variance = calculateVariance(estimatedCost, actualCost);
  const isOverBudget = variance > 0;

  const statusColors = {
    'On Track': 'bg-green-100 text-green-800',
    'Warning': 'bg-yellow-100 text-yellow-800',
    'Over Budget': 'bg-red-100 text-red-800',
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsDeleting(true);
      await projectsAPI.delete(project.id.toString());
      
      // Call parent onDelete callback to refresh the list
      if (onDelete) {
        onDelete();
      }
      
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Gagal menghapus proyek. Silakan coba lagi.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <Link href={`/projects/${project.id}`}>
        <div className="card hover:shadow-lg transition-shadow cursor-pointer relative">
        {/* Delete Button */}
        <button
          onClick={handleDeleteClick}
          className="absolute top-3 right-3 z-10 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100 hover:opacity-100"
          title="Hapus Proyek"
          disabled={isDeleting}
        >
          <Trash2 size={16} />
        </button>
        
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
              {project.name}
            </h3>
            <p className="text-xs md:text-sm text-gray-500">
              {startDate} - {endDate}
            </p>
          </div>
          <span
            className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
              statusColors[project.status]
            }`}
          >
            {project.status}
          </span>
        </div>

      {/* Budget Info */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Estimasi</span>
          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(estimatedCost)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Aktual</span>
          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(actualCost)}
          </span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span className="text-sm text-gray-600 flex items-center gap-1">
            {isOverBudget ? (
              <>
                <TrendingUp size={16} className="text-red-600" />
                Variance
              </>
            ) : (
              <>
                <TrendingDown size={16} className="text-green-600" />
                Saving
              </>
            )}
          </span>
          <span
            className={`text-sm font-bold ${
              isOverBudget ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {isOverBudget ? '+' : ''}
            {variance.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm font-semibold text-primary">
            {project.progress}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>
      </div>
      </Link>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCancelDelete}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Hapus Proyek?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Apakah Anda yakin ingin menghapus proyek <span className="font-semibold">"{project.name}"</span>? 
                  Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait proyek ini.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={handleCancelDelete}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    disabled={isDeleting}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectCard;
