/**
 * Authentication utility functions
 */

// Get auth token from localStorage or sessionStorage
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
};

// Set auth token in localStorage
export const setAuthToken = (token: string, persistent: boolean = true): void => {
  if (typeof window === 'undefined') return;
  
  if (persistent) {
    localStorage.setItem('authToken', token);
  } else {
    sessionStorage.setItem('authToken', token);
  }
};

// Remove auth token
export const removeAuthToken = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Get auth headers for API requests
export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return {
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Handle auth errors
export const handleAuthError = (error: any): void => {
  if (error?.status === 401 || error?.message?.includes('401')) {
    removeAuthToken();
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
};
