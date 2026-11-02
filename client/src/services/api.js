const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Core HTTP client using native Fetch API.
 * Automatically attaches JWT Bearer token and parses JSON responses.
 */
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('student_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // If session expired or unauthorized
  if (response.status === 401) {
    if (endpoint !== '/auth/login' && endpoint !== '/auth/register') {
      localStorage.removeItem('student_token');
      localStorage.removeItem('student_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Authentication Service
export const authAPI = {
  register: (payload) => apiFetch('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => apiFetch('/auth/login', { method: 'POST', body: payload }),
  getMe: () => apiFetch('/auth/me')
};

// Student Profile Service
export const profileAPI = {
  getProfile: () => apiFetch('/profile'),
  updateProfile: (payload) => apiFetch('/profile', { method: 'PUT', body: payload })
};

// Scheme Discovery & Matching Service
export const schemeAPI = {
  getSchemes: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'All') {
        searchParams.append(k, v);
      }
    });
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return apiFetch(`/schemes${qs}`);
  },
  getSchemeById: (id) => apiFetch(`/schemes/${id}`),
  getEligibilityAnalysis: (schemeId) =>
    apiFetch('/schemes/eligibility', { method: 'POST', body: { schemeId } }),
  getRecommended: () => apiFetch('/schemes/recommended'),
  compareSchemes: (schemeIds) =>
    apiFetch('/schemes/compare', { method: 'POST', body: { schemeIds } })
};

// Document Tracker & Privacy-Safe Expiry Service
export const documentAPI = {
  getDocuments: () => apiFetch('/documents'),
  addDocument: (payload) => apiFetch('/documents', { method: 'POST', body: payload }),
  updateDocument: (id, payload) => apiFetch(`/documents/${id}`, { method: 'PUT', body: payload }),
  deleteDocument: (id) => apiFetch(`/documents/${id}`, { method: 'DELETE' }),
  getReadiness: (schemeId) => apiFetch(`/documents/readiness/${schemeId}`)
};

// In-App Notification Center Service
export const notificationAPI = {
  getNotifications: () => apiFetch('/notifications'),
  getUnreadCount: () => apiFetch('/notifications/unread-count'),
  markAsRead: (id) => apiFetch(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllAsRead: () => apiFetch('/notifications/read-all', { method: 'PUT' })
};

// Dashboard Metrics Service
export const dashboardAPI = {
  getDashboardData: () => apiFetch('/dashboard')
};

// Portal Administration Service
export const adminAPI = {
  getMetrics: () => apiFetch('/admin/metrics'),
  getStudents: () => apiFetch('/admin/students'),
  toggleStudentStatus: (id, isActive) =>
    apiFetch(`/admin/students/${id}/status`, { method: 'PUT', body: { isActive } }),
  createScheme: (payload) => apiFetch('/schemes', { method: 'POST', body: payload }),
  updateScheme: (id, payload) => apiFetch(`/schemes/${id}`, { method: 'PUT', body: payload }),
  deleteScheme: (id) => apiFetch(`/schemes/${id}`, { method: 'DELETE' }),
  updateVerification: (id, payload) =>
    apiFetch(`/admin/schemes/${id}/verification`, { method: 'PUT', body: payload }),
  updateEligibilityRules: (id, rules) =>
    apiFetch(`/admin/schemes/${id}/rules`, { method: 'PUT', body: { rules } }),
  getAnnouncements: () => apiFetch('/admin/announcements'),
  createAnnouncement: (payload) =>
    apiFetch('/admin/announcements', { method: 'POST', body: payload }),
  updateAnnouncement: (id, payload) =>
    apiFetch(`/admin/announcements/${id}`, { method: 'PUT', body: payload }),
  deleteAnnouncement: (id) =>
    apiFetch(`/admin/announcements/${id}`, { method: 'DELETE' })
};

// Public Portal Announcements Service
export const announcementAPI = {
  getAnnouncements: () => apiFetch('/announcements'),
  getPublished: () => apiFetch('/announcements/published')
};

