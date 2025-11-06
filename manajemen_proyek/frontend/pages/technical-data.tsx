import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Database, HardDrive, Server, Activity, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function TechnicalData() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check if user is CEO/Director
    if (!loading && isAuthenticated && user) {
      const allowedRoles = ['director', 'ceo'];
      const userRole = user.role?.slug || user.role?.name?.toLowerCase() || '';
      
      if (!allowedRoles.includes(userRole)) {
        // Redirect to dashboard if not authorized
        router.push('/');
        return;
      }
    }
  }, [isAuthenticated, loading, user, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <Navbar />
        <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show access denied if not CEO/Director
  if (user) {
    const allowedRoles = ['director', 'ceo'];
    const userRole = user.role?.slug || user.role?.name?.toLowerCase() || '';
    
    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="min-h-screen bg-gray-50">
          <Sidebar />
          <Navbar />
          <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
            <div className="max-w-md mx-auto mt-20">
              <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="text-red-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                <p className="text-gray-600 mb-6">
                  This page is only accessible to CEO/Director.
                  <br />
                  Your role: <span className="font-semibold text-gray-900">{user.role?.name || 'Unknown'}</span>
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="btn-primary"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </main>
        </div>
      );
    }
  }
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

