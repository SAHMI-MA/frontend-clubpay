import { createAsyncThunk } from '@reduxjs/toolkit';
import { authService, LoginCredentials, RegisterCredentials } from '../auth-service';
import { loginSuccess, setLoading, logout } from './authSlice';

// Async thunk for handling login
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const response = await authService.login(credentials);
      
      // Store token and user data
      authService.storeToken(response.access_token);
      authService.storeUser(response.user);
      
      // Dispatch login success action with user and token
      dispatch(loginSuccess({ 
        user: response.user, 
        token: response.access_token 
      }));
      
      return response;
    } catch (error) {
      // Return the error message as the payload of the rejected action
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to login');
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Async thunk for handling registration
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterCredentials, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const response = await authService.register(userData);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to register');
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Thunk for handling logout
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    // Remove token from storage
    authService.removeToken();
    
    // Dispatch logout action
    dispatch(logout());
  }
);

// Thunk for initializing auth state from local storage
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { dispatch }) => {
    const token = authService.getToken();
    const user = authService.getUser();
    
    if (token && user) {
      dispatch(loginSuccess({ user, token }));
    }
  }
);
