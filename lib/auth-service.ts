import { api } from './api';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

/**
 * Authentication service for handling user login and registration
 */
export const authService = {  /**
   * Login with email and password
   * @param credentials - User login credentials
   * @returns Authentication response with token and user data
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return api.post<AuthResponse>('auth/login', credentials);
  },

  /**
   * Register a new user
   * @param userData - User registration data
   * @returns Authentication response with token and user data
   */
  async register(userData: RegisterCredentials): Promise<AuthResponse> {
    return api.post<AuthResponse>('auth/register', userData);
  },

  /**
   * Store the authentication token in local storage
   * @param token - The authentication token
   */
  storeToken(token: string): void {
    localStorage.setItem('auth_token', token);
    console.log('Auth token stored in localStorage');
  },

  /**
   * Get the stored authentication token
   * @returns The authentication token or null if not found
   */
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      console.log('Retrieved auth token:', token ? 'Found' : 'Not found');
      return token;
    }
    return null;
  },

  /**
   * Remove the authentication token from storage (logout)
   */
  removeToken(): void {
    localStorage.removeItem('auth_token');
    console.log('Auth token removed from localStorage');
  },

  /**
   * Store the current user data
   * @param user - User data to store
   */
  storeUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  },

  /**
   * Get the current user data
   * @returns The user data or null if not found
   */
  getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
    }
    return null;
  },

  /**
   * Check if the user is authenticated
   * @returns True if authenticated, false otherwise
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  /**
   * Log out the current user
   */
  logout(): void {
    this.removeToken();
    localStorage.removeItem('user');
  }
};
