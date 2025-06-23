import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../auth-service';

// Define the authentication state interface
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
};

// Create the authentication slice
export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Sets loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    // Login success action
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
    },
    
    // Update user information
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    
    // Logout action
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
    },
  },
});

// Export the actions
export const { setLoading, loginSuccess, updateUser, logout } = authSlice.actions;

// Export the reducer
export default authSlice.reducer;
