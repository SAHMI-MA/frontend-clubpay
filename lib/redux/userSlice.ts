import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, Role, Permission, userService, roleService, permissionService, CreateUserDto, UpdateUserDto, CreateRoleDto, UpdateRoleDto } from '@/lib/services';

// User state interface
interface UserState {
  users: User[];
  selectedUser: User | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: UserState = {
  users: [],
  selectedUser: null,
  loading: false,
  error: null,
};

// Async thunks for user operations
export const fetchAllUsers = createAsyncThunk('users/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await userService.getAllUsers();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch users');
  }
});

export const fetchUserById = createAsyncThunk('users/fetchById', async (id: number, { rejectWithValue }) => {
  try {
    return await userService.getUserById(id);
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch user');
  }
});

export const createUser = createAsyncThunk('users/create', async (userData: CreateUserDto, { rejectWithValue }) => {
  try {
    return await userService.createUser(userData);
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to create user');
  }
});

export const updateUser = createAsyncThunk(
  'users/update',
  async ({ id, userData }: { id: number; userData: UpdateUserDto }, { rejectWithValue }) => {
    try {
      return await userService.updateUser(id, userData);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update user');
    }
  }
);

export const deleteUser = createAsyncThunk('users/delete', async (id: number, { rejectWithValue }) => {
  try {
    await userService.deleteUser(id);
    return id;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete user');
  }
});

export const assignRoleToUser = createAsyncThunk(
  'users/assignRole',
  async ({ userId, roleId }: { userId: number; roleId: number }, { rejectWithValue }) => {
    try {
      return await userService.assignRoleToUser(userId, roleId);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to assign role');
    }
  }
);

export const removeRoleFromUser = createAsyncThunk(
  'users/removeRole',
  async ({ userId, roleId }: { userId: number; roleId: number }, { rejectWithValue, dispatch }) => {
    try {
      // Make the API call to remove the role
      const updatedUser = await userService.removeRoleFromUser(userId, roleId);
      
      // If the API doesn't return the updated user, fetch it manually
      if (!updatedUser || !updatedUser.id) {
        return await userService.getUserById(userId);
      }
      
      return updatedUser;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to remove role');
    }
  }
);

// User slice
const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch all users
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.users = action.payload;
        state.loading = false;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch user by ID
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action: PayloadAction<User>) => {
        state.selectedUser = action.payload;
        state.loading = false;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create user
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.users.push(action.payload);
        state.loading = false;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update user
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<User>) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
        state.loading = false;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action: PayloadAction<number>) => {
        state.users = state.users.filter(user => user.id !== action.payload);
        if (state.selectedUser?.id === action.payload) {
          state.selectedUser = null;
        }
        state.loading = false;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Assign role to user
      .addCase(assignRoleToUser.fulfilled, (state, action: PayloadAction<User>) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
      })
      // Remove role from user
      .addCase(removeRoleFromUser.fulfilled, (state, action: PayloadAction<User>) => {
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
      });
  },
});

export default userSlice.reducer;
