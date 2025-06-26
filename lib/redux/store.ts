import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import userReducer from './userSlice';
import roleReducer from './roleSlice';
import permissionReducer from './permissionSlice';
import teamReducer from './teamSlice';
import playerReducer from './playerSlice';
import staffReducer from './staffSlice';
import supplierReducer from './supplierSlice';
import acquisitionReducer from './acquisitionSlice';
import financialReducer from './financialSlice';

// Configure the Redux store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    roles: roleReducer,
    permissions: permissionReducer,
    teams: teamReducer,
    players: playerReducer,
    staff: staffReducer,
    suppliers: supplierReducer,
    acquisitions: acquisitionReducer,
    financial: financialReducer,
  },
  // Enable Redux DevTools extension
  devTools: process.env.NODE_ENV !== 'production',
});

// Export types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
