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
    // Try both possible token storage keys for compatibility
    let token = localStorage.getItem('auth_token') || 
                localStorage.getItem('authToken') || 
                sessionStorage.getItem('authToken');
    
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
    // Store in both locations for compatibility
    localStorage.setItem('auth_token', token);
    localStorage.setItem('authToken', token);
  }
};

/**
 * Remove the authentication token from local storage
 */
const removeAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    // Remove from both possible storage locations
    localStorage.removeItem('auth_token');
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
  }
};

/**
 * Check if a valid auth token is present
 * @returns True if a token is present, false otherwise
 */
const hasAuthToken = (): boolean => {
  return !!getAuthToken();
};

// Export the token utility functions as tokenUtils
export const tokenUtils = {
  isValidJwtFormat,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  hasAuthToken
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
        console.log(`✅ Adding auth token to request: ${endpoint}`);
      } else {
        console.warn('⚠️ No auth token available for request:', endpoint);
        
        // For protected endpoints, explicitly require authentication
        const protectedEndpoints = ['contracts', 'players', 'staff', 'teams', 'users', 'financial'];
        const isProtectedEndpoint = protectedEndpoints.some(path => endpoint.includes(path));
        
        if (isProtectedEndpoint) {
          console.error('🚫 Authentication required for protected endpoint:', endpoint);
          throw new Error(`Authentication required: No token found for accessing ${endpoint}. Please login again.`);
        }
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
      
      // Log detailed information about the request
      console.log(`Fetching ${url}`, { 
        method: requestOptions.method,
        hasAuthToken: 'Authorization' in headers,
        authTokenLength: authToken ? authToken.length : 0
      });
      
      const response = await fetch(url, requestOptions);
      
      // Handle specific error cases
      if (response.status === 401) {
        console.error('Authentication failed (401 Unauthorized)');
        // Clear the invalid token
        removeAuthToken();
        throw new Error('Authentication failed (401 Unauthorized). Your session has expired or is invalid. Please log in again.');
      }
      
      if (response.status === 403) {
        console.error('Authorization failed (403 Forbidden)');
        throw new Error('Permission denied (403 Forbidden). You do not have permission to perform this action.');
      }
      
      if (!response.ok) {
        console.error(`API error: ${response.status} ${response.statusText} for ${url}`);
        
        // Try to get error message from response
        try {
          const responseText = await response.text();
          console.error('Response content:', responseText);
          
          try {
            // Try to parse as JSON
            const errorData = JSON.parse(responseText);
            throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
          } catch (parseError) {
            // If can't parse as JSON, use text directly
            throw new Error(`API error: ${response.status} ${response.statusText}. Response: ${responseText.substring(0, 100)}`);
          }
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
    // Log query parameters if present for better debugging
    if (endpoint.includes('?')) {
      const [base, queryString] = endpoint.split('?');
      const params = new URLSearchParams(queryString);
      console.log(`GET request to ${base} with query parameters:`, 
        Object.fromEntries(params.entries())
      );
    }
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
    console.log(`PUT request to ${endpoint}:`, { data: JSON.stringify(data) });
    
    // Ensure data is not undefined or null
    if (data === undefined || data === null) {
      console.error('PUT request attempted with no data');
      throw new Error('No data provided for PUT request');
    }
    
    // Add more detailed logging for debugging PUT requests
    const bodyString = JSON.stringify(data);
    console.log('PUT request body as string:', bodyString);
    console.log('PUT request body length:', bodyString.length);
    console.log('PUT request content type:', 'application/json');
    
    return this.fetch<T>(endpoint, {
      method: 'PUT',
      body: bodyString,
    });
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

  /**
   * DELETE request
   * @param endpoint - The API endpoint
   * @returns Promise with the response data or void for empty responses
   */
  async delete<T>(endpoint: string): Promise<T | void> {
    try {
      const url = getApiUrl(endpoint);
      const authToken = getAuthToken();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add authentication token if available
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        console.log(`✅ Adding auth token to DELETE request: ${endpoint}`);
      } else {
        console.warn('⚠️ No auth token available for DELETE request:', endpoint);
      }
      
      const requestOptions = {
        method: 'DELETE',
        headers
      };
      
      console.log(`Deleting ${url}`);
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        console.error(`API error: ${response.status} ${response.statusText} for ${url}`);
        
        // Try to get error message from response
        const responseText = await response.text();
        console.error('Response content:', responseText);
        
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
          } catch (parseError) {
            throw new Error(`API error: ${response.status} ${response.statusText}. Response: ${responseText.substring(0, 100)}`);
          }
        } else {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
      }
      
      // For DELETE operations, the response is often empty (204 No Content)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        console.log(`Delete successful with empty response (status: ${response.status})`);
        return;
      }
      
      // Check if there's content to parse
      const contentType = response.headers.get('content-type');
      
      // Only try to parse JSON if the content type is appropriate
      if (contentType && contentType.includes('application/json')) {
        try {
          return await response.json();
        } catch (err) {
          console.warn('Response indicated JSON but parsing failed:', err);
          return;
        }
      }
      
      // Return void for non-JSON or empty responses
      return;
    } catch (error) {
      console.error('API delete request failed:', error);
      throw error;
    }
  },
};
