/**
 * Utility functions for handling dates in the application
 */

/**
 * Convert a date string to a Date object
 * @param dateString - The date string to convert
 * @returns Date object or null if invalid
 */
export const parseDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    console.warn('Invalid date string:', dateString);
    return null;
  }
};

export const calculateAge = (dateOfBirth: string | null | undefined): number => {
    if (!dateOfBirth) return 0;
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

/**
 * Format a date string for display
 * @param dateString - The date string to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string, 
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }
): string => {
  const date = parseDate(dateString);
  if (!date) return 'Invalid Date';
  
  try {
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.warn('Error formatting date:', dateString, error);
    return 'Invalid Date';
  }
};

/**
 * Get relative time string (e.g., "2 days ago")
 * @param dateString - The date string to compare
 * @returns Relative time string
 */
export const getRelativeTime = (dateString: string): string => {
  const date = parseDate(dateString);
  if (!date) return 'Unknown';
  
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  
  return `${Math.floor(diffInDays / 365)} years ago`;
};
