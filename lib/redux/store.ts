import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import userReducer from './userSlice';
import roleReducer from './roleSlice';
import permissionReducer from './permissionSlice';
import teamReducer from './teamSlice';
import playerReducer from './playerSlice';

// Configure the Redux store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    roles: roleReducer,
    permissions: permissionReducer,
    teams: teamReducer,
    players: playerReducer,
  },
  // Enable Redux DevTools extension
  devTools: process.env.NODE_ENV !== 'production',
});

// Export types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
