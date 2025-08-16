import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Staff, CreateStaffDto, UpdateStaffDto } from '../types/team-management';
import { api } from '../api';

interface StaffState {
  staff: Staff[];
  loading: boolean;
  error: string | null;
}

const initialState: StaffState = {
  staff: [],
  loading: false,
  error: null,
};

// Async thunks for API calls
export const fetchAllStaff = createAsyncThunk(
  'staff/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await api.get('/staff');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch staff members');
    }
  }
);

export const fetchStaffById = createAsyncThunk(
  'staff/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await api.get(`/staff/${id}`);
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to fetch staff member with ID ${id}`);
    }
  }
);

export const createStaff = createAsyncThunk(
  'staff/create',
  async (staffData: CreateStaffDto, { rejectWithValue }) => {
    try {
      return await api.post('/staff', staffData);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create staff member');
    }
  }
);

export const updateStaff = createAsyncThunk(
  'staff/update',
  async ({ id, data }: { id: number; data: UpdateStaffDto }, { rejectWithValue }) => {
    try {
      // Only send allowed fields from UpdateStaffDto
      const {
        firstName,
        lastName,
        role,
        dateOfBirth,
        phoneNumber,
        email,
        qualification,
        experience,
        rib,
        staffImageId,
        salary,
        teamId,
      } = data;
      const updatePayload: UpdateStaffDto = {
        firstName,
        lastName,
        role,
        dateOfBirth,
        phoneNumber,
        email,
        qualification,
        experience,
        rib,
        staffImageId,
        salary,
        teamId,
      };
      return await api.patch(`/staff/${id}`, updatePayload);
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to update staff member with ID ${id}`);
    }
  }
);

export const deleteStaff = createAsyncThunk(
  'staff/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/staff/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to delete staff member with ID ${id}`);
    }
  }
);

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all staff
      .addCase(fetchAllStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllStaff.fulfilled, (state, action) => {
        // Type assertion with as unknown first to avoid TypeScript error
        state.staff = action.payload as unknown as Staff[];
        state.loading = false;
      })
      .addCase(fetchAllStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch staff by ID
      .addCase(fetchStaffById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaffById.fulfilled, (state, action) => {
        // Type assertion with as unknown first to avoid TypeScript error
        const staff = action.payload as unknown as Staff;
        const index = state.staff.findIndex(s => s.id === staff.id);
        if (index >= 0) {
          state.staff[index] = staff;
        } else {
          state.staff.push(staff);
        }
        state.loading = false;
      })
      .addCase(fetchStaffById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create staff
      .addCase(createStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStaff.fulfilled, (state, action) => {
        // Type assertion with as unknown first to avoid TypeScript error
        state.staff.push(action.payload as unknown as Staff);
        state.loading = false;
      })
      .addCase(createStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update staff
      .addCase(updateStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStaff.fulfilled, (state, action) => {
        // Type assertion with as unknown first to avoid TypeScript error
        const updatedStaff = action.payload as unknown as Staff;
        const index = state.staff.findIndex(s => s.id === updatedStaff.id);
        if (index >= 0) {
          state.staff[index] = updatedStaff;
        }
        state.loading = false;
      })
      .addCase(updateStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete staff
      .addCase(deleteStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStaff.fulfilled, (state, action) => {
        // Type assertion with as unknown first to avoid TypeScript error
        const deletedId = action.payload as unknown as number;
        state.staff = state.staff.filter(s => s.id !== deletedId);
        state.loading = false;
      })
      .addCase(deleteStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = staffSlice.actions;
export default staffSlice.reducer;
