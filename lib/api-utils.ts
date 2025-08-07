/**
 * Utility functions for checking API connectivity and authentication state
 */

import { authService } from './auth-service';
import { getApiUrl } from './api-config';

/**
 * Test the API connection and authentication status
 * @returns Promise with connection status information
 */
export const testApiConnection = async (): Promise<{
  isServerReachable: boolean;
  isAuthenticated: boolean;
  serverMessage?: string;
  error?: string;
}> => {
  try {
    // Get the current auth token
    const token = authService.getToken();
    const headers: HeadersInit = {};
    
    // Add token if exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Try to reach the server with a simple health check endpoint
    // Add a timestamp parameter to avoid caching
    const timestamp = new Date().getTime(); 
    const response = await fetch(`${getApiUrl('health')}?_=${timestamp}`, {
      method: 'GET',
      headers,
      // Don't cache the result
      cache: 'no-store'
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        isServerReachable: true,
        isAuthenticated: response.status !== 401,
        serverMessage: data.message
      };
    } else {
      return {
        isServerReachable: true,
        isAuthenticated: false,
        error: `Server returned ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    console.error('API connection test failed:', error);
    return {
      isServerReachable: false,
      isAuthenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Attempt to login with demo credentials
 * This is useful for development environments when the API server is unavailable
 */
export const loginWithDemoCredentials = async (): Promise<void> => {
  try {
    // Store a demo token in JWT format
    const demoToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IkRlbW8gVXNlciIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxOTE2MjM5MDIyfQ.dKoQFHvmUVJ8GWd_iNwaCU-RDEHzM6VsuOawAcuUe8s';
    authService.storeToken(demoToken);
    
    // Store a demo user
    const demoUser = {
      id: 1,
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
      roles: {
        id: 1,
        name: 'admin',
        permissions: []
      }
    };
    authService.storeUser(demoUser);
    
    console.log('Logged in with demo credentials for development');
  } catch (error) {
    console.error('Failed to login with demo credentials:', error);
    throw error;
  }
};
