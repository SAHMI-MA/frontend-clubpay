/**
 * Debugging utilities for authentication-related issues
 */
import { authService } from './auth-service';
import { tokenUtils } from './api';
import { getApiUrl } from './api-config';

/**
 * Run a comprehensive authentication diagnostic
 * @returns Diagnostic results
 */
export const runAuthDiagnostics = async (): Promise<{
  tokenExists: boolean;
  tokenFormat: 'valid' | 'invalid' | 'none';
  tokenFirstChars?: string;
  userDataExists: boolean;
  testEndpointReachable: boolean;
  testEndpointAuthenticated: boolean;
  testMessage?: string;
}> => {
  // Check token existence and format
  const token = authService.getToken();
  const tokenExists = !!token;
  let tokenFormat: 'valid' | 'invalid' | 'none' = 'none';
  let tokenFirstChars: string | undefined;
  
  if (token) {
    tokenFormat = tokenUtils.isValidJwtFormat(token) ? 'valid' : 'invalid';
    tokenFirstChars = token.substring(0, 10) + '...';
  }
  
  // Check user data
  const userData = authService.getUser();
  const userDataExists = !!userData;
  
  // Test endpoint
  let testEndpointReachable = false;
  let testEndpointAuthenticated = false;
  let testMessage: string | undefined;
  
  try {
    // Headers with token if available
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Try a basic health check endpoint
    const response = await fetch(`${getApiUrl('health')}`, {
      method: 'GET',
      headers
    });
    
    testEndpointReachable = true;
    testEndpointAuthenticated = response.status !== 401;
    
    if (response.ok) {
      const data = await response.json();
      testMessage = data.message || 'OK';
    } else {
      testMessage = `Error: ${response.status} ${response.statusText}`;
    }
  } catch (error) {
    testMessage = error instanceof Error ? error.message : 'Unknown error';
  }
  
  return {
    tokenExists,
    tokenFormat,
    tokenFirstChars,
    userDataExists,
    testEndpointReachable,
    testEndpointAuthenticated,
    testMessage
  };
};

/**
 * Debug function that can be called to log all auth-related info to console
 */
export const debugAuth = async (): Promise<void> => {
  console.group('🔍 Auth Debugging Info');
  
  const results = await runAuthDiagnostics();
  
  console.log('Token exists:', results.tokenExists);
  console.log('Token format:', results.tokenFormat);
  if (results.tokenFirstChars) {
    console.log('Token preview:', results.tokenFirstChars);
  }
  console.log('User data exists:', results.userDataExists);
  console.log('Test endpoint reachable:', results.testEndpointReachable);
  console.log('Test endpoint authenticated:', results.testEndpointAuthenticated);
  if (results.testMessage) {
    console.log('Test message:', results.testMessage);
  }
  
  console.groupEnd();
  
  return;
};
