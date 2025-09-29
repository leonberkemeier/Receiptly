// Utility for making authenticated API requests

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export const getApiUrl = (path: string): string => {
  // Remove leading slash to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const authenticatedFetch = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  
  // Automatically prepend the API base URL if it's a relative path
  const fullUrl = url.startsWith('http') ? url : getApiUrl(url);
  
  console.log('authenticatedFetch:', {
    originalUrl: url,
    fullUrl,
    apiBaseUrl: API_BASE_URL,
    hasToken: !!token,
    method: options.method || 'GET'
  });
  
  const authOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  };

  return fetch(fullUrl, authOptions);
};

// For FormData requests (file uploads)
export const authenticatedFormDataFetch = async (
  url: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  
  // Automatically prepend the API base URL if it's a relative path
  const fullUrl = url.startsWith('http') ? url : getApiUrl(url);
  
  const authOptions: RequestInit = {
    ...options,
    method: 'POST',
    body: formData,
    headers: {
      ...options.headers,
      ...(token && { 'Authorization': `Bearer ${token}` }),
      // Don't set Content-Type for FormData, let browser set it with boundary
    },
  };

  return fetch(fullUrl, authOptions);
};
