import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Role, roleService, CreateRoleDto, UpdateRoleDto } from '@/lib/services';

// Role state interface
interface RoleState {
  roles: Role[];
  selectedRole: Role | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: RoleState = {
  roles: [],
  selectedRole: null,
  loading: false,
  error: null,
};

// Async thunks for role operations
export const fetchAllRoles = createAsyncThunk('roles/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await roleService.getAllRoles();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch roles');
  }
});

export const fetchRoleById = createAsyncThunk('roles/fetchById', async (id: number, { rejectWithValue }) => {
  try {
    return await roleService.getRoleById(id);
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch role');
  }
});

export const createRole = createAsyncThunk('roles/create', async (roleData: CreateRoleDto, { rejectWithValue }) => {
  try {
    return await roleService.createRole(roleData);
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to create role');
  }
});

export const updateRole = createAsyncThunk(
  'roles/update',
  async ({ id, roleData }: { id: number; roleData: UpdateRoleDto }, { rejectWithValue }) => {
    try {
      return await roleService.updateRole(id, roleData);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update role');
    }
  }
);

export const deleteRole = createAsyncThunk('roles/delete', async (id: number, { rejectWithValue }) => {
  try {
    // Make the DELETE request to the proper endpoint
    await roleService.deleteRole(id);
    // Return the ID for the reducer to filter out the deleted role
    return id;
  } catch (error) {
    console.error('Error deleting role:', error);
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete role');
  }
});

export const addPermissionToRole = createAsyncThunk(
  'roles/addPermission',
  async ({ roleId, permissionId }: { roleId: number; permissionId: number }, { rejectWithValue }) => {
    try {
      return await roleService.addPermissionToRole(roleId, permissionId);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add permission to role');
    }
  }
);

export const removePermissionFromRole = createAsyncThunk(
  'roles/removePermission',
  async ({ roleId, permissionId }: { roleId: number; permissionId: number }, { rejectWithValue }) => {
    try {
      return await roleService.removePermissionFromRole(roleId, permissionId);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to remove permission from role');
    }
  }
);

// Role slice
const roleSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    clearSelectedRole: (state) => {
      state.selectedRole = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all roles
      .addCase(fetchAllRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllRoles.fulfilled, (state, action: PayloadAction<Role[]>) => {
        state.roles = action.payload;
        state.loading = false;
      })
      .addCase(fetchAllRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch role by ID
      .addCase(fetchRoleById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoleById.fulfilled, (state, action: PayloadAction<Role>) => {
        state.selectedRole = action.payload;
        state.loading = false;
      })
      .addCase(fetchRoleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create role
      .addCase(createRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRole.fulfilled, (state, action: PayloadAction<Role>) => {
        state.roles.push(action.payload);
        state.loading = false;
      })
      .addCase(createRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update role
      .addCase(updateRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRole.fulfilled, (state, action: PayloadAction<Role>) => {
        const index = state.roles.findIndex(role => role.id === action.payload.id);
        if (index !== -1) {
          state.roles[index] = action.payload;
        }
        if (state.selectedRole?.id === action.payload.id) {
          state.selectedRole = action.payload;
        }
        state.loading = false;
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete role
      .addCase(deleteRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRole.fulfilled, (state, action: PayloadAction<number>) => {
        state.roles = state.roles.filter(role => role.id !== action.payload);
        if (state.selectedRole?.id === action.payload) {
          state.selectedRole = null;
        }
        state.loading = false;
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add permission to role
      .addCase(addPermissionToRole.fulfilled, (state, action) => {
        // Check if the payload exists and is a Role object (not void)
        const payload = action.payload as Role | void;
        if (payload && typeof payload === 'object' && 'id' in payload) {
          const rolePayload = payload as Role;
          const index = state.roles.findIndex(role => role.id === rolePayload.id);
          if (index !== -1) {
            state.roles[index] = rolePayload;
          }
          if (state.selectedRole?.id === rolePayload.id) {
            state.selectedRole = rolePayload;
          }
        }
      })
      // Remove permission from role
      .addCase(removePermissionFromRole.fulfilled, (state, action) => {
        // Check if the payload exists and is a Role object (not void)
        const payload = action.payload as Role | void;
        if (payload && typeof payload === 'object' && 'id' in payload) {
          const rolePayload = payload as Role;
          const index = state.roles.findIndex(role => role.id === rolePayload.id);
          if (index !== -1) {
            state.roles[index] = rolePayload;
          }
          if (state.selectedRole?.id === rolePayload.id) {
            state.selectedRole = rolePayload;
          }
        }
      });
  },
});

export const { clearSelectedRole } = roleSlice.actions;
export default roleSlice.reducer;
