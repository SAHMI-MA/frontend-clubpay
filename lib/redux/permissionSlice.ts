import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Permission, permissionService, CreatePermissionDto, UpdatePermissionDto } from '@/lib/services';

// Permission state interface
interface PermissionState {
  permissions: Permission[];
  selectedPermission: Permission | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: PermissionState = {
  permissions: [],
  selectedPermission: null,
  loading: false,
  error: null,
};

// Async thunks for permission operations
export const fetchAllPermissions = createAsyncThunk('permissions/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await permissionService.getAllPermissions();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch permissions');
  }
});

export const fetchPermissionById = createAsyncThunk('permissions/fetchById', async (id: number, { rejectWithValue }) => {
  try {
    return await permissionService.getPermissionById(id);
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch permission');
  }
});

export const createPermission = createAsyncThunk(
  'permissions/create',
  async (permissionData: CreatePermissionDto, { rejectWithValue }) => {
    try {
      return await permissionService.createPermission(permissionData);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create permission');
    }
  }
);

export const updatePermission = createAsyncThunk(
  'permissions/update',
  async ({ id, permissionData }: { id: number; permissionData: UpdatePermissionDto }, { rejectWithValue }) => {
    try {
      return await permissionService.updatePermission(id, permissionData);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update permission');
    }
  }
);

export const deletePermission = createAsyncThunk('permissions/delete', async (id: number, { rejectWithValue }) => {
  try {
    await permissionService.deletePermission(id);
    return id;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete permission');
  }
});

// Permission slice
const permissionSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    clearSelectedPermission: (state) => {
      state.selectedPermission = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all permissions
      .addCase(fetchAllPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllPermissions.fulfilled, (state, action: PayloadAction<Permission[]>) => {
        state.permissions = action.payload;
        state.loading = false;
      })
      .addCase(fetchAllPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch permission by ID
      .addCase(fetchPermissionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPermissionById.fulfilled, (state, action: PayloadAction<Permission>) => {
        state.selectedPermission = action.payload;
        state.loading = false;
      })
      .addCase(fetchPermissionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create permission
      .addCase(createPermission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPermission.fulfilled, (state, action: PayloadAction<Permission>) => {
        state.permissions.push(action.payload);
        state.loading = false;
      })
      .addCase(createPermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update permission
      .addCase(updatePermission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePermission.fulfilled, (state, action: PayloadAction<Permission>) => {
        const index = state.permissions.findIndex(permission => permission.id === action.payload.id);
        if (index !== -1) {
          state.permissions[index] = action.payload;
        }
        if (state.selectedPermission?.id === action.payload.id) {
          state.selectedPermission = action.payload;
        }
        state.loading = false;
      })
      .addCase(updatePermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete permission
      .addCase(deletePermission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePermission.fulfilled, (state, action: PayloadAction<number>) => {
        state.permissions = state.permissions.filter(permission => permission.id !== action.payload);
        if (state.selectedPermission?.id === action.payload) {
          state.selectedPermission = null;
        }
        state.loading = false;
      })
      .addCase(deletePermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSelectedPermission } = permissionSlice.actions;
export default permissionSlice.reducer;
