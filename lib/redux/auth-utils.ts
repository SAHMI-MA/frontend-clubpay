import { store } from '@/lib/redux/store';
import { loginSuccess, logout } from '@/lib/redux/authSlice';
import { User } from '@/lib/auth-service';

/**
 * Auth utilities for global use
 */
export const authUtils = {
  /**
   * Update the auth state with a new user and token
   * @param user - User data
   * @param token - Auth token
   */
  updateAuthState(user: User, token: string): void {
    store.dispatch(loginSuccess({ user, token }));
  },

  /**
   * Clear authentication state and data
   */
  clearAuth(): void {
    store.dispatch(logout());
    
    // Clean localStorage if needed
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Get current auth token
   * @returns The current auth token or null
   */
  getToken(): string | null {
    return store.getState().auth.token;
  },

  /**
   * Get current user
   * @returns The current user or null
   */
  getUser(): User | null {
    return store.getState().auth.user;
  },

  /**
   * Check if user is authenticated
   * @returns True if authenticated
   */
  isAuthenticated(): boolean {
    return store.getState().auth.isAuthenticated;
  }
};
