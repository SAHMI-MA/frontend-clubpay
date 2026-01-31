import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import userReducer from './userSlice';
import categoryReducer from './categorySlice';
import roleReducer from './roleSlice';
import permissionReducer from './permissionSlice';
import teamReducer from './teamSlice';
import playerReducer from './playerSlice';
import staffReducer from './staffSlice';
import employeeReducer from './employeeSlice';
import supplierReducer from './supplierSlice';
import suppliesReducer from './suppliesSlice';
import acquisitionReducer from './acquisitionSlice';
import financialReducer from './financialSlice';
import contractReducer from './contractSlice';
import objectiveReducer from './objectiveSlice';
import matchReducer from './matchSlice';
import dashboardReducer from './dashboardSlice';
import notificationReducer from './notificationSlice';
import { inventoryReducer } from './InventorySlice';

// Configure the Redux store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    categories: categoryReducer,
    users: userReducer,
    roles: roleReducer,
    permissions: permissionReducer,
    teams: teamReducer,
    players: playerReducer,
    staff: staffReducer,
    employees: employeeReducer,
    suppliers: supplierReducer,
    supplies: suppliesReducer,
    acquisitions: acquisitionReducer,
    financial: financialReducer,
    contracts: contractReducer,
    objectives: objectiveReducer,
    matches: matchReducer,
    dashboard: dashboardReducer,
    notifications: notificationReducer,
    inventory: inventoryReducer
  },
  // Enable Redux DevTools extension
  devTools: process.env.NODE_ENV !== 'production',
});

// Export types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
