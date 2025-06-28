/**
 * Environment variables configuration for the application
 */

/**
 * API configuration
 */
export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
};

/**
 * Get the API URL with an optional path
 * @param path - The path to append to the base URL
 * @returns The full API URL
 */
export const getApiUrl = (path: string = ''): string => {
  const normalizedPath = path.trim();
  const baseUrl = apiConfig.baseUrl.endsWith('/') 
    ? apiConfig.baseUrl.slice(0, -1) 
    : apiConfig.baseUrl;
    
  const fullUrl = `${baseUrl}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`;
  console.log(`API URL constructed: "${fullUrl}" from base "${apiConfig.baseUrl}" and path "${path}"`);
  return fullUrl;
};
