const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to handle API calls
const apiRequest = async (endpoint, options = {}) => {
  try {
    const defaultOptions = {
      credentials: 'include', // Important for cookies/sessions
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    console.log(`Making request to: ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, defaultOptions);
    
    console.log(`Response status: ${response.status}`);
    
    if (response.status === 401) {
      // Clear any stored user data
      localStorage.removeItem('user');
      throw new Error('Please login again');
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Form data API request (for file uploads)
const apiFormRequest = async (endpoint, formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    return data;
  } catch (error) {
    console.error('API form request error:', error);
    throw error;
  }
};

export const processingAPI = {
  processDocuments: (formData) => apiFormRequest('/processing/process-documents', formData),
  getDepartmentDocuments: (department) => apiRequest(`/processing/department-documents/${department}`),
  getDocumentDetails: (docId) => apiRequest(`/processing/document/${docId}`),
};

export const authAPI = {
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  logout: () => apiRequest('/auth/logout', {
    method: 'POST',
  }),
  getCurrentUser: () => apiRequest('/auth/me'),
  getDepartments: () => apiRequest('/auth/departments'),
  getCategories: () => apiRequest('/auth/categories'),
  getUsers: () => apiRequest('/auth/users'),
  updateUser: (userId, data) => apiRequest(`/auth/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

export const documentAPI = {
  uploadDocument: (formData) => apiFormRequest('/upload', formData),
  getDocuments: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/documents?${queryString}`);
  },
  getDocument: (docId) => apiRequest(`/documents/${docId}`),
  downloadDocument: async (docId) => {
    const response = await fetch(`${API_BASE_URL}/documents/${docId}/download`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return response.blob();
  },
};