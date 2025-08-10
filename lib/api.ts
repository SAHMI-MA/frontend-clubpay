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
    const token = localStorage.getItem('auth_token') || 
                localStorage.getItem('authToken') || 
                sessionStorage.getItem('authToken');
    
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
   * Upload a file to the server
   * @param endpoint - The API endpoint for file upload
   * @param file - The file to upload
   * @returns Promise with the response data
   */
  async uploadFile<T>(endpoint: string, file: File): Promise<T> {
    const url = getApiUrl(endpoint);
    const authToken = getAuthToken();
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Create headers with authorization
      const headers: HeadersInit = {};
      
      // Add authorization header if token exists
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      } else {
        throw new Error('Authentication required for file upload');
      }
      
      console.log(`Uploading file to ${url}`, {
        filename: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      
      // Send request
      // Important: When using FormData, don't set Content-Type header
      // The browser will automatically set it with the proper boundary
      const response = await fetch(url, {
        method: 'POST',
        headers, // Only contains Authorization header
        body: formData,
        // credentials: 'include' // Include if cookies/sessions are used
      });
      
      // Handle response
      if (!response.ok) {
        console.error(`File upload error: ${response.status} ${response.statusText} for ${url}`);
        
        try {
          const responseText = await response.text();
          console.error('Response content:', responseText);
          
          try {
            const errorData = JSON.parse(responseText);
            throw new Error(errorData.message || `File upload error: ${response.status} ${response.statusText}`);
          } catch {
            throw new Error(`File upload error: ${response.status} ${response.statusText}. Response: ${responseText.substring(0, 100)}`);
          }
        } catch {
          throw new Error(`File upload error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('File upload failed:', error);
      throw error;
    }
  },

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
        const protectedEndpoints = ['contracts', 'players', 'staff', 'teams', 'users', 'financial', 'auth/change-password', 'auth/test'];
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
          } catch {
            // If can't parse as JSON, use text directly
            throw new Error(`API error: ${response.status} ${response.statusText}. Response: ${responseText.substring(0, 100)}`);
          }
        } catch {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      
      // Additional validation for GET requests to array endpoints
      const isGetRequest = !options || !options.method || options.method === 'GET';
      if (endpoint === '/category-club' && isGetRequest && !Array.isArray(data)) {
        console.error('[API] Expected array response for GET /category-club but got:', data);
        throw new Error('Invalid response format: Expected array');
      }
      
      return data;
    } catch (error: any) {
      console.error('API request failed:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Handle different types of errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('Network error: Failed to fetch. Check if the backend server is running.');
        throw new Error('Network error: Cannot connect to the server. Please check if the backend is running.');
      }
      
      if (error.name === 'AbortError') {
        console.error('Request was aborted');
        throw new Error('Request timeout: The request took too long to complete.');
      }
      
      // Re-throw the original error
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
      
      console.log(`[API] DELETE ${url}`);
      console.log('[API] DELETE request options:', requestOptions);
      const response = await fetch(url, requestOptions);
      console.log('[API] DELETE response status:', response.status, response.statusText);
      console.log('[API] DELETE response headers:', Array.from(response.headers.entries()));
      
      if (!response.ok) {
        console.error(`[API] DELETE error: ${response.status} ${response.statusText} for ${url}`);
        
        // Try to get error message from response
        const responseText = await response.text();
        console.error('[API] DELETE response content:', responseText);
        
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText);
            throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
          } catch (err) {
            console.error('[API] DELETE error parsing JSON:', err);
            throw new Error(`API error: ${response.status} ${response.statusText}. Response: ${responseText.substring(0, 100)}`);
          }
        } else {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
      }
      
      // For DELETE operations, the response is often empty (204 No Content)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        console.log('[API] Delete successful with empty response (status:', response.status, ')');
        return;
      }
      
      // Check if there's content to parse
      const contentType = response.headers.get('content-type');
      console.log('[API] DELETE response content-type:', contentType);
      
      // Only try to parse JSON if the content type is appropriate
      if (contentType && contentType.includes('application/json')) {
        try {
          const json = await response.json();
          console.log('[API] DELETE response JSON:', json);
          return json;
        } catch (err) {
          console.warn('[API] DELETE response indicated JSON but parsing failed:', err);
          return;
        }
      }
      
      // Return void for non-JSON or empty responses
      return;
    } catch (error) {
      console.error('[API] DELETE request failed:', error);
      throw error;
    }
  },
};
