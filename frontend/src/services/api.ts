import { useAuth0 } from '@auth0/auth0-react';

const API_BASE_URL = 'http://localhost:8000';

export const useApi = () => {
  const { getAccessTokenSilently } = useAuth0();

  const makeAuthenticatedRequest = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const token = await getAccessTokenSilently();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  };

  return { makeAuthenticatedRequest };
};

// API endpoints
export const authApi = {
  getUserProfile: () => '/api/auth/me',
  getProtectedData: () => '/api/auth/protected',
};