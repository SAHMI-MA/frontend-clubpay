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
  return `${apiConfig.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};
