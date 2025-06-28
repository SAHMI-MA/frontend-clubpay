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
        console.warn('No auth token available for request:', endpoint);
        // For protected endpoints, we should fail fast
        const protectedEndpoints = ['/acquisitions', '/accounting'];
        if (protectedEndpoints.some(prefix => endpoint.startsWith(prefix))) {
          throw new Error('Authentication required: No token found for accessing protected resource');
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
      
      // Log more detailed information about the request for debugging
      console.log(`Fetching ${url}`, { 
        method: requestOptions.method,
        headers: JSON.stringify(headers),
        hasAuthToken: 'Authorization' in headers,
        bodyPresent: options?.body ? true : false
      });
      
      // For debugging, show the actual request body if it exists
      if (options?.body) {
        try {
          const bodyContent = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
          console.log('Request body content:', bodyContent);
          console.log('Request body length:', bodyContent.length);
          
          // For PUT requests, provide extra detailed logging
          if (requestOptions.method === 'PUT') {
            console.log('💡 PUT REQUEST DETAILS 💡');
            console.log('URL:', url);
            console.log('Headers:', JSON.stringify(headers));
            console.log('Full body:', bodyContent);
          }
          
          // Validate JSON if it's supposed to be JSON
          if (headers && typeof headers === 'object' && 'Content-Type' in headers && 
              typeof headers['Content-Type'] === 'string' && 
              headers['Content-Type'].includes('application/json')) {
            try {
              const parsedJson = JSON.parse(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
              console.log('Body is valid JSON:', Object.keys(parsedJson));
            } catch (jsonError) {
              console.error('Body is NOT valid JSON:', jsonError);
            }
          }
        } catch (e) {
          console.log('Could not log request body:', e);
        }
      } else {
        console.warn('No body content for', requestOptions.method, 'request to', url);
        
        // Extra warning for PUT requests with no body
        if (requestOptions.method === 'PUT') {
          console.error('⚠️ WARNING: PUT request with no body! This is likely an error.');
        }
      }
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
        // Log detailed error information
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
  },  /**
   * DELETE request
   * @param endpoint - The API endpoint
   * @returns Promise with the response data
   */
  async delete<T>(endpoint: string): Promise<T> {
    const url = getApiUrl(endpoint);
    const authToken = getAuthToken();
    
    try {
      // Create headers with auth token
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        console.log('Adding auth token to DELETE request:', endpoint);
      } else {
        console.warn('No auth token available for DELETE request:', endpoint);
        // For protected endpoints, fail fast
        const protectedEndpoints = ['/acquisitions', '/accounting'];
        if (protectedEndpoints.some(prefix => endpoint.startsWith(prefix))) {
          throw new Error('Authentication required: No token found for accessing protected resource');
        }
      }
      
      console.log(`Sending DELETE to ${url}`);
      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });
      
      // Handle specific status codes
      if (response.status === 401) {
        console.error('Authentication failed (401 Unauthorized) in DELETE');
        removeAuthToken();
        throw new Error('Authentication failed: Your session has expired or is invalid. Please log in again.');
      }
      
      if (response.status === 403) {
        console.error('Authorization failed (403 Forbidden) in DELETE');
        throw new Error('Permission denied: You do not have permission to perform this action.');
      }
      
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
    } catch (error) {
      console.error('DELETE request failed:', error);
      throw error;
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

// Test function to directly verify approve acquisition endpoint
export const testApproveAcquisition = async (id: number, approvalData: any): Promise<void> => {
  try {
    console.log(`=== TEST: Directly testing approval of acquisition ID ${id} ===`);
    console.log('Approval data:', JSON.stringify(approvalData));
    
    const baseUrl = getApiUrl().split('/')[0] + '//' + getApiUrl().split('/')[2];
    const endpoint = `acquisitions/${id}/approve`;
    const url = `${baseUrl}/${endpoint}`;
    
    console.log(`Making direct fetch to: ${url}`);
    
    // Get auth token
    const authToken = getAuthToken();
    if (!authToken) {
      console.error('No auth token available for test');
      return;
    }
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(approvalData)
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    // Read and log response body
    const responseBody = await response.text();
    console.log('Response body:', responseBody);
    
    if (!response.ok) {
      console.error('Test failed - API returned error');
    } else {
      console.log('Test successful - API returned OK');
    }
  } catch (error) {
    console.error('Test error:', error);
  }
};

// Direct test function for the acquisition approval endpoint
export const debugApproveAcquisition = async (id: number, approvalData: any): Promise<void> => {
  try {
    console.log('=== DEBUGGING APPROVAL REQUEST ===');
    console.log(`Testing approval endpoint for acquisition ID ${id}`);
    console.log('Request body:', JSON.stringify(approvalData));
    
    // Manually construct the request to see exactly what's happening
    const endpoint = `acquisitions/${id}/approve`;
    const url = getApiUrl(endpoint);
    const authToken = getAuthToken();
    
    if (!authToken) {
      console.error('No authentication token found for approval test');
      return;
    }
    
    // Create headers
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    };
    
    console.log('Request URL:', url);
    console.log('Request method: PUT');
    console.log('Request headers:', JSON.stringify(headers));
    
    const bodyString = JSON.stringify(approvalData);
    console.log('Request body string:', bodyString);
    console.log('Request body length:', bodyString.length);
    
    // Make the actual fetch request
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: bodyString
    });
    
    console.log('Response status:', response.status, response.statusText);
    
    // Try to read the response
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (!response.ok) {
      console.error('Approval test failed with status', response.status);
    } else {
      console.log('Approval test successful');
    }
  } catch (error) {
    console.error('Error in debug approval test:', error);
  }
};
