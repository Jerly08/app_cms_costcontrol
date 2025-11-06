import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { bomAPI, projectsAPI } from '@/lib/api';
import { ArrowLeft, Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';

export default function ImportBOM() {
  const router = useRouter();
  const { project_id } = router.query;

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(project_id as string || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [importedCount, setImportedCount] = useState(0);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (project_id) {
      setSelectedProject(project_id as string);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.xlsx',
        '.xls'
      ];
      const fileType = file.type;
      const fileExt = file.name.split('.').pop()?.toLowerCase();

      if (!fileType.includes('sheet') && fileExt !== 'xlsx' && fileExt !== 'xls') {
        alert('Please select a valid Excel file (.xlsx or .xls)');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit');
        return;
      }

      setSelectedFile(file);
      setUploadStatus('idle');
    }
  };

  const handleDownloadTemplate = () => {
    // Create a sample Excel template structure
    const csvContent = `Material Code,Material Name,Category,Unit,Unit Price,Estimated Quantity,Actual Quantity,Notes
MAT001,Semen Portland,Cement,Sak,75000,100,0,
MAT002,Pasir Beton,Aggregate,M3,250000,50,0,
MAT003,Besi Beton 10mm,Steel,Kg,12000,500,0,
MAT004,Keramik 40x40,Finishing,Box,150000,20,0,`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'BOM_Template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async () => {
    if (!selectedProject) {
      alert('Please select a project');
      return;
    }

    if (!selectedFile) {
      alert('Please select a file to import');
      return;
    }

    try {
      setLoading(true);
      setUploadStatus('idle');
      
      const response = await bomAPI.importExcel(selectedFile, selectedProject);
      
      setUploadStatus('success');
      setUploadMessage('BOM items imported successfully!');
      setImportedCount(response.imported_count || 0);
      
      // Reset file input after 2 seconds, then redirect
      setTimeout(() => {
        router.push(`/bom?project_id=${selectedProject}`);
      }, 2000);
    } catch (err: any) {
      console.error('Error importing BOM:', err);
      setUploadStatus('error');
      setUploadMessage(err.message || 'Failed to import BOM. Please check your file format.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />

      <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <Link href={selectedProject ? `/bom?project_id=${selectedProject}` : '/bom'}>
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft size={20} />
              Back to BOM List
            </button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Import BOM from Excel</h1>
          <p className="text-gray-600 mt-1">Upload Excel file to bulk import Bill of Materials</p>
        </div>

        <div className="max-w-3xl">
          {/* Instructions Card */}
          <div className="card mb-6 bg-blue-50 border-2 border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileSpreadsheet className="text-blue-600" size={24} />
              Instructions
            </h3>
            <ol className="space-y-2 text-sm text-gray-700 ml-4">
              <li className="list-decimal">Download the Excel template using the button below</li>
              <li className="list-decimal">Fill in the BOM data according to the template format</li>
              <li className="list-decimal">Select the project you want to import to</li>
              <li className="list-decimal">Upload the completed Excel file</li>
              <li className="list-decimal">Review the imported data in the BOM list</li>
            </ol>

            <div className="mt-4 p-3 bg-white rounded-lg border border-blue-300">
              <p className="text-sm font-medium text-gray-900 mb-2">Required Columns:</p>
              <ul className="text-xs text-gray-600 space-y-1 ml-4">
                <li>• <strong>Material Code</strong>: Unique identifier for material</li>
                <li>• <strong>Material Name</strong>: Name of the material</li>
                <li>• <strong>Category</strong>: Material category (e.g., Cement, Steel, etc.)</li>
                <li>• <strong>Unit</strong>: Unit of measurement (e.g., Kg, M3, Sak, etc.)</li>
                <li>• <strong>Unit Price</strong>: Price per unit</li>
                <li>• <strong>Estimated Quantity</strong>: Planned quantity needed</li>
                <li>• <strong>Actual Quantity</strong>: Actual quantity used (optional)</li>
                <li>• <strong>Notes</strong>: Additional notes (optional)</li>
              </ul>
            </div>
          </div>

          {/* Download Template */}
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Download Template</h3>
            <button
              onClick={handleDownloadTemplate}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={18} />
              Download Excel Template
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Download the template and fill it with your BOM data
            </p>
          </div>

          {/* Select Project */}
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Step 2: Select Project <span className="text-red-500">*</span>
            </h3>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
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

          {/* Upload File */}
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Step 3: Upload Excel File <span className="text-red-500">*</span>
            </h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition">
              <input
                type="file"
                id="file-upload"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <Upload className="text-gray-400" size={48} />
                <div>
                  <p className="text-gray-700 font-medium">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Excel files only (.xlsx, .xls) - Max 10MB
                  </p>
                </div>
              </label>
            </div>

            {selectedFile && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="text-green-600" size={24} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600">
                      Size: {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Upload Status */}
          {uploadStatus === 'success' && (
            <div className="card mb-6 bg-green-50 border-2 border-green-300">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
                <div>
                  <h4 className="font-semibold text-green-900">Import Successful!</h4>
                  <p className="text-green-700 mt-1">{uploadMessage}</p>
                  <p className="text-sm text-green-600 mt-2">
                    {importedCount} BOM items have been imported successfully.
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Redirecting to BOM list...</p>
                </div>
              </div>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="card mb-6 bg-red-50 border-2 border-red-300">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
                <div>
                  <h4 className="font-semibold text-red-900">Import Failed</h4>
                  <p className="text-red-700 mt-1">{uploadMessage}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Please check your Excel file format and try again.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Import Button */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 4: Import</h3>
            <div className="flex gap-3">
              <button
                onClick={handleImport}
                disabled={!selectedProject || !selectedFile || loading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Import BOM Data
                  </>
                )}
              </button>
              <Link href={selectedProject ? `/bom?project_id=${selectedProject}` : '/bom'}>
                <button className="btn-secondary">
                  Cancel
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

