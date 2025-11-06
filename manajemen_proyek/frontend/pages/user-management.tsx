import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Users, UserPlus, Search, Shield, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function UserManagement() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

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

  // Dummy users data
  const users = [
    { id: 1, name: 'Direktur Utama', email: 'ceo@unipro.com', role: 'CEO', status: 'Active' },
    { id: 2, name: 'Christopher', email: 'christopher@unipro.com', role: 'Project Director', status: 'Active' },
    { id: 3, name: 'Director', email: 'director@unipro.com', role: 'Director', status: 'Active' },
    { id: 4, name: 'General Manager', email: 'manager@unipro.com', role: 'Manager', status: 'Active' },
    { id: 5, name: 'Cost Control', email: 'costcontrol@unipro.com', role: 'Cost Control', status: 'Active' },
    { id: 6, name: 'Purchasing Staff', email: 'purchasing@unipro.com', role: 'Purchasing', status: 'Active' },
    { id: 7, name: 'Tim Lapangan', email: 'lapangan@unipro.com', role: 'Tim Lapangan', status: 'Active' },
  ];

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'ceo':
        return 'bg-purple-100 text-purple-800';
      case 'project director':
      case 'director':
        return 'bg-blue-100 text-blue-800';
      case 'manager':
        return 'bg-green-100 text-green-800';
      case 'cost control':
        return 'bg-orange-100 text-orange-800';
      case 'purchasing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />

      <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600 mt-1">Manage system users and their roles</p>
              </div>
              <button className="btn-primary flex items-center gap-2 w-fit">
                <UserPlus size={20} />
                Add New User
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="text-blue-600" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{users.filter(u => u.status === 'Active').length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="text-green-600" size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Roles</p>
                  <p className="text-2xl font-bold text-purple-600">7</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="text-purple-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((userItem) => (
                    <tr key={userItem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-semibold">
                              {userItem.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{userItem.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{userItem.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(userItem.role)}`}>
                          {userItem.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {userItem.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                        <button className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No users found</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

