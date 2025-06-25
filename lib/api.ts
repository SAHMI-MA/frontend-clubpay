import { getApiUrl } from './api-config';

/**
 * Check if a string is a valid JWT format
 * @param token - The token to check
 * @returns True if valid JWT format, false otherwise
 */
const isValidJwtFormat = (token: string): boolean => {
  // Basic JWT format is three base64 strings separated by dots
  const jwtRegex = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*$/;
  return jwtRegex.test(token);
};

/**
 * Get the authentication token from local storage
 * @returns The authentication token or undefined if not found
 */
const getAuthToken = (): string | undefined => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    
    // If token exists but is not a valid JWT format, log warning
    if (token && !isValidJwtFormat(token)) {
      console.warn('Retrieved token is not in valid JWT format!');
    }
    
    return token || undefined;
  }
  return undefined;
};

/**
 * Set the authentication token in local storage
 * @param token - The authentication token
 */
const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
};

/**
 * Remove the authentication token from local storage
 */
const removeAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
};

/**
 * Check if a valid auth token is present
 * @returns True if a token is present, false otherwise
 */
const hasAuthToken = (): boolean => {
  return !!getAuthToken();
};

/**
 * Basic API client for making requests to the backend
 */
export const api = {

  /**
   * Fetch data from the API
   * @param endpoint - The API endpoint
   * @param options - Fetch options
   * @returns Promise with the response data
   */
  async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = getApiUrl(endpoint);
    const authToken = getAuthToken();
    
    try {
      // Create merged headers from the defaults and any provided in options
      const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token exists
      if (authToken) {
        defaultHeaders['Authorization'] = `Bearer ${authToken}`;
        console.log('Adding auth token to request:', endpoint);
        console.log('Token value (first 10 chars):', authToken.substring(0, 10) + '...');
      } else {
        console.log('No auth token available for request:', endpoint);
      }
      
      // Merge headers with options
      const headers = {
        ...defaultHeaders,
        ...(options?.headers || {})
      };

      // Create the final request options
      const requestOptions = {
        ...options,
        headers
      };
      
      console.log(`Fetching ${url}`, { 
        method: requestOptions.method,
        headers: Object.keys(headers)
      });
      const response = await fetch(url, requestOptions);

      // Handle specific status codes
      if (response.status === 401) {
        console.error('Authentication failed (401 Unauthorized)');
        // Clear invalid token
        removeAuthToken();
        // You might want to redirect to login page here
        // window.location.href = '/login';
        throw new Error('Authentication failed: Your session has expired or is invalid. Please log in again.');
      }
      
      if (response.status === 403) {
        console.error('Authorization failed (403 Forbidden)');
        throw new Error('Permission denied: You do not have permission to perform this action.');
      }
      
      if (!response.ok) {
        // Try to get error message from response
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
        } catch (e) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },

  /**
   * GET request
   * @param endpoint - The API endpoint
   * @returns Promise with the response data
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: 'GET' });
  },

  /**
   * POST request
   * @param endpoint - The API endpoint
   * @param data - The data to send
   * @returns Promise with the response data
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * PUT request
   * @param endpoint - The API endpoint
   * @param data - The data to send
   * @returns Promise with the response data
   */
  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },  /**
   * DELETE request
   * @param endpoint - The API endpoint
   * @returns Promise with the response data
   */
  async delete<T>(endpoint: string): Promise<T> {
    // For DELETE requests we need to ensure we handle empty responses properly
    const response = await fetch(`${getApiUrl(endpoint)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(getAuthToken() ? { 'Authorization': `Bearer ${getAuthToken()}` } : {})
      }
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
      } catch (e) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
    }
    
    // Handle both empty responses and JSON responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }
    
    try {
      return await response.json();
    } catch (e) {
      return {} as T;
    }
  },
  
  /**
   * PATCH request
   * @param endpoint - The API endpoint
   * @param data - The data to send
   * @returns Promise with the response data
   */
  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

/**
 * Utility functions for token management
 */
export const tokenUtils = {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  hasAuthToken,
  isValidJwtFormat
};
