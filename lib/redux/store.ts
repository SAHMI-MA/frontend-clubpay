import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

// Configure the Redux store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add other reducers here as needed
  },
  // Enable Redux DevTools extension
  devTools: process.env.NODE_ENV !== 'production',
});

// Export types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
