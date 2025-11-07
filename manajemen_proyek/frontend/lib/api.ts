const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Helper function to get token from localStorage
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return handleResponse<T>(response);
}

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await apiRequest<{ success: boolean; data: { access_token: string; user: any } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    // Return in expected format
    return {
      token: response.data.access_token,
      user: response.data.user,
    };
  },

  register: async (userData: { username: string; password: string; email: string; full_name: string }) => {
    return apiRequest<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  me: async () => {
    return apiRequest<{ user: any }>('/me', {
      method: 'GET',
    });
  },

  refreshToken: async (token: string) => {
    return apiRequest<{ token: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },
};

// Projects API
export const projectsAPI = {
  getAll: async () => {
    return apiRequest<{ data: any[] }>('/projects', {
      method: 'GET',
    });
  },

  getById: async (id: string) => {
    return apiRequest<{ data: any }>(`/projects/${id}`, {
      method: 'GET',
    });
  },

  create: async (projectData: any) => {
    return apiRequest<{ data: any }>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  update: async (id: string, projectData: any) => {
    return apiRequest<{ data: any }>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  },

  delete: async (id: string) => {
    return apiRequest<{ message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  },

  updateProgress: async (id: string, progress: number) => {
    return apiRequest<{ data: any }>(`/projects/${id}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ progress }),
    });
  },
};

// Dashboard API
export const dashboardAPI = {
  getRoleDashboard: async () => {
    return apiRequest<{ data: any }>('/dashboard', {
      method: 'GET',
    });
  },
};

// Daily Reports API
export const dailyReportsAPI = {
  getAll: async (projectId?: string) => {
    const query = projectId ? `?project_id=${projectId}` : '';
    return apiRequest<{ data: any[] }>(`/reports/daily${query}`, {
      method: 'GET',
    });
  },

  getById: async (id: string) => {
    return apiRequest<{ data: any }>(`/reports/daily/${id}`, {
      method: 'GET',
    });
  },

  create: async (reportData: any) => {
    return apiRequest<{ data: any }>('/reports/daily', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  },

  update: async (id: string, reportData: any) => {
    return apiRequest<{ data: any }>(`/reports/daily/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reportData),
    });
  },

  delete: async (id: string) => {
    return apiRequest<{ message: string }>(`/reports/daily/${id}`, {
      method: 'DELETE',
    });
  },
};

// Weekly Reports API
export const weeklyReportsAPI = {
  getAll: async (projectId?: string) => {
    const query = projectId ? `?project_id=${projectId}` : '';
    return apiRequest<{ data: any[] }>(`/reports/weekly${query}`, {
      method: 'GET',
    });
  },

  getById: async (id: string) => {
    return apiRequest<{ data: any }>(`/reports/weekly/${id}`, {
      method: 'GET',
    });
  },

  generate: async (projectId: string, weekData: any) => {
    return apiRequest<{ data: any }>('/reports/weekly/generate', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, ...weekData }),
    });
  },

  downloadPDF: async (id: string) => {
    const token = getToken();
    const response = await fetch(`${API_URL}/reports/weekly/${id}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to download PDF');
    return response.blob();
  },
};

// Photos API
export const photosAPI = {
  upload: async (reportId: string, files: File[], captions?: string[]) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('photos', file);
      if (captions && captions[index]) {
        formData.append(`caption_${index}`, captions[index]);
      }
    });

    const token = getToken();
    const response = await fetch(`${API_URL}/reports/daily/${reportId}/photos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    return handleResponse<{ data: any[] }>(response);
  },

  getByReport: async (reportId: string) => {
    return apiRequest<{ data: any[] }>(`/reports/daily/${reportId}/photos`, {
      method: 'GET',
    });
  },

  delete: async (photoId: string) => {
    return apiRequest<{ message: string }>(`/photos/${photoId}`, {
      method: 'DELETE',
    });
  },
};

// Materials API
export const materialsAPI = {
  getAll: async () => {
    return apiRequest<{ data: any[] }>('/materials', {
      method: 'GET',
    });
  },

  getById: async (id: string) => {
    return apiRequest<{ data: any }>(`/materials/${id}`, {
      method: 'GET',
    });
  },

  create: async (materialData: any) => {
    return apiRequest<{ data: any }>('/materials', {
      method: 'POST',
      body: JSON.stringify(materialData),
    });
  },

  update: async (id: string, materialData: any) => {
    return apiRequest<{ data: any }>(`/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(materialData),
    });
  },

  delete: async (id: string) => {
    return apiRequest<{ message: string }>(`/materials/${id}`, {
      method: 'DELETE',
    });
  },

  getLowStock: async () => {
    return apiRequest<{ data: any[] }>('/materials/low-stock', {
      method: 'GET',
    });
  },
};

// BOM (Bill of Materials) API
export const bomAPI = {
  getByProject: async (projectId: string) => {
    return apiRequest<{ data: any[] }>(`/projects/${projectId}/bom`, {
      method: 'GET',
    });
  },

  create: async (bomData: any) => {
    return apiRequest<{ data: any }>('/bom', {
      method: 'POST',
      body: JSON.stringify(bomData),
    });
  },

  update: async (id: string, bomData: any) => {
    return apiRequest<{ data: any }>(`/bom/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bomData),
    });
  },

  delete: async (id: string) => {
    return apiRequest<{ message: string }>(`/bom/${id}`, {
      method: 'DELETE',
    });
  },

  importExcel: async (file: File, projectId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId);

    const token = getToken();
    const response = await fetch(`${API_URL}/bom/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    return handleResponse<{ data: any; imported_count: number }>(response);
  },

  calculateUsage: async (projectId: string) => {
    return apiRequest<{ data: any }>(`/projects/${projectId}/bom/calculate`, {
      method: 'GET',
    });
  },
};

// Material Usage API
export const materialUsageAPI = {
  getByProject: async (projectId: string) => {
    return apiRequest<{ data: any[] }>(`/projects/${projectId}/usage`, {
      method: 'GET',
    });
  },

  create: async (usageData: any) => {
    return apiRequest<{ data: any }>('/material-usage', {
      method: 'POST',
      body: JSON.stringify(usageData),
    });
  },

  update: async (id: string, usageData: any) => {
    return apiRequest<{ data: any }>(`/material-usage/${id}`, {
      method: 'PUT',
      body: JSON.stringify(usageData),
    });
  },

  delete: async (id: string) => {
    return apiRequest<{ message: string }>(`/material-usage/${id}`, {
      method: 'DELETE',
    });
  },
};

// Purchase Request API
export const purchaseRequestAPI = {
  getAll: async (filter?: string) => {
    const query = filter ? `?filter=${filter}` : '';
    return apiRequest<{ data: any[] }>(`/purchase-requests${query}`, {
      method: 'GET',
    });
  },

  getById: async (id: string) => {
    return apiRequest<{ data: any }>(`/purchase-requests/${id}`, {
      method: 'GET',
    });
  },

  create: async (prData: any) => {
    return apiRequest<{ data: any }>('/purchase-requests', {
      method: 'POST',
      body: JSON.stringify(prData),
    });
  },

  approve: async (id: string, stage: string, comment?: string) => {
    return apiRequest<{ data: any }>(`/purchase-requests/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ stage, comment }),
    });
  },

  reject: async (id: string, stage: string, reason: string) => {
    return apiRequest<{ data: any }>(`/purchase-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ stage, reason }),
    });
  },

  addComment: async (id: string, comment: string) => {
    return apiRequest<{ data: any }>(`/purchase-requests/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });
  },
};

// Approvals API (existing)
export const approvalsAPI = {
  getAll: async (filter?: string) => {
    const query = filter ? `?filter=${filter}` : '';
    return apiRequest<{ data: any[] }>(`/approvals${query}`, {
      method: 'GET',
    });
  },

  getById: async (id: string) => {
    return apiRequest<{ data: any }>(`/approvals/${id}`, {
      method: 'GET',
    });
  },

  create: async (approvalData: any) => {
    return apiRequest<{ data: any }>('/approvals', {
      method: 'POST',
      body: JSON.stringify(approvalData),
    });
  },

  updateStatus: async (id: string, status: string, notes?: string) => {
    return apiRequest<{ data: any }>(`/approvals/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, approval_notes: notes }),
    });
  },
};

// Notifications API (existing)
export const notificationsAPI = {
  getAll: async () => {
    return apiRequest<{ data: any[] }>('/notifications', {
      method: 'GET',
    });
  },

  getUnreadCount: async () => {
    return apiRequest<{ count: number }>('/notifications/unread-count', {
      method: 'GET',
    });
  },

  markAsRead: async (id: string) => {
    return apiRequest<{ message: string }>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  markAllAsRead: async () => {
    return apiRequest<{ message: string }>('/notifications/mark-all-read', {
      method: 'PUT',
    });
  },

  delete: async (id: string) => {
    return apiRequest<{ message: string }>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },
};

export default {
  auth: authAPI,
  projects: projectsAPI,
  dashboard: dashboardAPI,
  dailyReports: dailyReportsAPI,
  weeklyReports: weeklyReportsAPI,
  photos: photosAPI,
  materials: materialsAPI,
  bom: bomAPI,
  materialUsage: materialUsageAPI,
  purchaseRequest: purchaseRequestAPI,
  approvals: approvalsAPI,
  notifications: notificationsAPI,
};

