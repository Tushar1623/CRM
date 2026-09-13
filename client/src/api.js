const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Standardized API helper for Motorwise CRM.
 * Automatically handles JSON serialization, headers, and JWT Bearer token authentication.
 * 
 * @param {string} path - API endpoint path (e.g., '/api/leads')
 * @param {RequestInit} [options={}] - Standard fetch options
 * @returns {Promise<any>} Parsed JSON response
 */
export async function api(path, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API}${path}`, config);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export default api;
