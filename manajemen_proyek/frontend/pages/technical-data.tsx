import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Database, HardDrive, Server, Activity } from 'lucide-react';

export default function TechnicalData() {
  const technicalInfo = [
    {
      icon: Database,
      label: 'Database',
      value: 'MySQL 8.0',
      color: 'blue',
    },
    {
      icon: Server,
      label: 'Backend',
      value: 'Golang (Gin Framework)',
      color: 'green',
    },
    {
      icon: HardDrive,
      label: 'Frontend',
      value: 'Next.js 14 + TypeScript',
      color: 'purple',
    },
    {
      icon: Activity,
      label: 'API Version',
      value: 'v1.0.0',
      color: 'orange',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />

      <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Technical Data</h1>
            <p className="text-gray-600 mt-1">System technical information and specifications</p>
          </div>

          {/* Technical Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {technicalInfo.map((item, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 bg-${item.color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <item.icon className={`text-${item.color}-600`} size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">{item.label}</p>
                    <p className="text-lg font-semibold text-gray-900">{item.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* System Info Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Application Name</span>
                <span className="font-medium text-gray-900">Unipro Project Manager</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Version</span>
                <span className="font-medium text-gray-900">1.1.0</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Environment</span>
                <span className="font-medium text-gray-900">Development</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Backend Port</span>
                <span className="font-medium text-gray-900">8080</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Frontend Port</span>
                <span className="font-medium text-gray-900">3000</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Authentication</span>
                <span className="font-medium text-gray-900">JWT (24h expiry)</span>
              </div>
            </div>
          </div>

          {/* API Endpoints Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">API Endpoints</h2>
            
            <div className="space-y-2">
              <div className="font-mono text-sm p-3 bg-gray-50 rounded border border-gray-200">
                <span className="text-green-600 font-semibold">GET</span> /api/v1/health
              </div>
              <div className="font-mono text-sm p-3 bg-gray-50 rounded border border-gray-200">
                <span className="text-yellow-600 font-semibold">POST</span> /api/v1/auth/login
              </div>
              <div className="font-mono text-sm p-3 bg-gray-50 rounded border border-gray-200">
                <span className="text-green-600 font-semibold">GET</span> /api/v1/projects
              </div>
              <div className="font-mono text-sm p-3 bg-gray-50 rounded border border-gray-200">
                <span className="text-yellow-600 font-semibold">POST</span> /api/v1/projects
              </div>
              <div className="font-mono text-sm p-3 bg-gray-50 rounded border border-gray-200">
                <span className="text-blue-600 font-semibold">PUT</span> /api/v1/projects/:id
              </div>
              <div className="font-mono text-sm p-3 bg-gray-50 rounded border border-gray-200">
                <span className="text-red-600 font-semibold">DELETE</span> /api/v1/projects/:id
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

