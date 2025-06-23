import { getApiUrl } from './api-config';

/**
 * Get the authentication token from local storage
 * @returns The authentication token or undefined if not found
 */
const getAuthToken = (): string | undefined => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token') || undefined;
  }
  return undefined;
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
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token exists
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(url, {
        headers,
        ...options,
      });

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
  },

  /**
   * DELETE request
   * @param endpoint - The API endpoint
   * @returns Promise with the response data
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: 'DELETE' });
  },
};
