// Authentication helper functions
import { buildApiUrl } from './apiConfig';
export const getAuthToken = (): string => {
  try {
    const oidcStorage = localStorage.getItem('oidc.user:https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_GxKWo2hS9:6c69v8akat6b5k0t54s6fm1a87');
    if (oidcStorage) {
      const parsed = JSON.parse(oidcStorage);
      return parsed.access_token || '';
    }
  } catch (error) {
    console.warn('Could not retrieve token from storage:', error);
  }
  return '';
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// API request helper with proper authentication
export const authenticatedFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const url = buildApiUrl(endpoint);
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
};
