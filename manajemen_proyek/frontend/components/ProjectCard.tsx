import { Project, formatCurrency, calculateVariance } from '@/lib/dummyData';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  const variance = calculateVariance(project.estimatedCost, project.actualCost);
  const isOverBudget = variance > 0;

  const statusColors = {
    'On Track': 'bg-green-100 text-green-800',
    'Warning': 'bg-yellow-100 text-yellow-800',
    'Over Budget': 'bg-red-100 text-red-800',
  };

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="card hover:shadow-lg transition-shadow cursor-pointer">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
            {project.name}
          </h3>
          <p className="text-xs md:text-sm text-gray-500">
            {project.startDate} - {project.endDate}
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
            {formatCurrency(project.estimatedCost)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Aktual</span>
          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(project.actualCost)}
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
  );
};

export default ProjectCard;
