import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Acquisition, CreateAcquisitionDto, UpdateAcquisitionDto, ApprovalDto, ApprovalStatus } from '@/lib/types/supplier-management';
import { api } from '@/lib/api';

interface AcquisitionState {
  acquisitions: Acquisition[];
  pendingApprovals: Acquisition[];
  selectedAcquisition: Acquisition | null;
  loading: boolean;
  error: string | null;
}

const initialState: AcquisitionState = {
  acquisitions: [],
  pendingApprovals: [],
  selectedAcquisition: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchAllAcquisitions = createAsyncThunk(
  'acquisitions/fetchAll',
  async (forType: string | undefined, { rejectWithValue }) => {
    try {
      const endpoint = forType ? `acquisitions?forType=${forType}` : 'acquisitions';
      const data = await api.get<Acquisition[]>(endpoint);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch acquisitions');
    }
  }
);

export const fetchAcquisitionById = createAsyncThunk(
  'acquisitions/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const data = await api.get<Acquisition>(`acquisitions/${id}`);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch acquisition details');
    }
  }
);

export const createAcquisition = createAsyncThunk(
  'acquisitions/create',
  async (acquisitionData: CreateAcquisitionDto & { createdBy?: number }, { rejectWithValue }) => {
    try {
      // Ensure createdBy is a number and present
      if (!acquisitionData.createdBy || typeof acquisitionData.createdBy !== 'number') {
        return rejectWithValue('Missing or invalid createdBy. Please log in again.');
      }
      const data = await api.post<Acquisition>('acquisitions', acquisitionData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create acquisition');
    }
  }
);

export const updateAcquisition = createAsyncThunk(
  'acquisitions/update',
  async ({ id, data }: { id: number; data: UpdateAcquisitionDto }, { rejectWithValue }) => {
    try {
      const updatedData = await api.put<Acquisition>(`acquisitions/${id}`, data);
      return updatedData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update acquisition');
    }
  }
);

export const deleteAcquisition = createAsyncThunk(
  'acquisitions/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      console.log(`Attempting to delete acquisition with ID: ${id}`);
      // The delete method returns void for 204 No Content responses
      await api.delete(`acquisitions/${id}`);
      console.log(`Successfully deleted acquisition with ID: ${id}`);
      // Return the ID for use in the reducer
      return id;
    } catch (error: any) {
      console.error(`Error deleting acquisition ${id}:`, error);
      return rejectWithValue(error.message || 'Failed to delete acquisition');
    }
  }
);

export const fetchPendingApprovals = createAsyncThunk(
  'acquisitions/fetchPendingApprovals',
  async (_, { rejectWithValue }) => {
    try {
      // Check if there's a token before making the request
      let authToken;
      if (typeof window !== 'undefined') {
        authToken = localStorage.getItem('auth_token');
      }

      if (!authToken) {
        return rejectWithValue('No authentication token found. Please log in again.');
      }

      const data = await api.get<Acquisition[]>('acquisitions/pending');
      return data;
    } catch (error: any) {
      console.error("Fetch pending approvals failed:", error);
      return rejectWithValue(error.message || 'Failed to fetch pending approvals');
    }
  }
);

export const approveOrRejectAcquisition = createAsyncThunk(
  'acquisitions/approveOrReject',
  async ({ id, approvalData }: { id: number; approvalData: ApprovalDto }, { rejectWithValue }) => {
    try {
      // Debug log to ensure we have the correct data
      console.log(`Approving acquisition ${id} with data:`, JSON.stringify(approvalData));
      
      // Verify that approvalData contains expected fields
      if (!approvalData.approvalStatus) {
        console.error('Missing approvalStatus in approval data');
        return rejectWithValue('Invalid approval data: missing approvalStatus');
      }
      
      // Verify that approvalData contains a valid approverId
      if (!approvalData.approverId) {
        console.error('Missing approverId in approval data');
        return rejectWithValue('Invalid approval data: missing approverId. Please log in again.');
      }
      
      // Make the API call to approve/reject the acquisition
      const updatedData = await api.put<Acquisition>(`acquisitions/${id}/approve`, approvalData);
      console.log(`Successfully approved acquisition ${id}`);
      return updatedData;
    } catch (error: any) {
      console.error(`Failed to approve/reject acquisition ID ${id}:`, error);
      
      // Check if error message contains "User with ID not found"
      if (error.message && error.message.includes('User with ID') && error.message.includes('not found')) {
        return rejectWithValue('The user ID used for approval is invalid. Please log in again.');
      }
      
      return rejectWithValue(error.message || 'Failed to approve/reject acquisition');
    }
  }
);

// Slice
const acquisitionSlice = createSlice({
  name: 'acquisitions',
  initialState,
  reducers: {
    clearAcquisitionError: (state) => {
      state.error = null;
    },
    setSelectedAcquisition: (state, action: PayloadAction<Acquisition | null>) => {
      state.selectedAcquisition = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Fetch all acquisitions
    builder.addCase(fetchAllAcquisitions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAllAcquisitions.fulfilled, (state, action) => {
      state.loading = false;
      state.acquisitions = action.payload;
    });
    builder.addCase(fetchAllAcquisitions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch acquisition by ID
    builder.addCase(fetchAcquisitionById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAcquisitionById.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedAcquisition = action.payload;
    });
    builder.addCase(fetchAcquisitionById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create acquisition
    builder.addCase(createAcquisition.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createAcquisition.fulfilled, (state, action) => {
      state.loading = false;
      state.acquisitions.push(action.payload);
      if (action.payload.approvalStatus === ApprovalStatus.PENDING) {
        state.pendingApprovals.push(action.payload);
      }
    });
    builder.addCase(createAcquisition.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update acquisition
    builder.addCase(updateAcquisition.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateAcquisition.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.acquisitions.findIndex((acquisition) => acquisition.id === action.payload.id);
      if (index !== -1) {
        state.acquisitions[index] = action.payload;
      }
      
      // Update in pending approvals if necessary
      if (action.payload.approvalStatus === ApprovalStatus.PENDING) {
        const pendingIndex = state.pendingApprovals.findIndex(
          (acquisition) => acquisition.id === action.payload.id
        );
        if (pendingIndex !== -1) {
          state.pendingApprovals[pendingIndex] = action.payload;
        } else {
          state.pendingApprovals.push(action.payload);
        }
      } else {
        state.pendingApprovals = state.pendingApprovals.filter(
          (acquisition) => acquisition.id !== action.payload.id
        );
      }
      
      if (state.selectedAcquisition?.id === action.payload.id) {
        state.selectedAcquisition = action.payload;
      }
    });
    builder.addCase(updateAcquisition.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete acquisition
    builder.addCase(deleteAcquisition.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteAcquisition.fulfilled, (state, action) => {
      state.loading = false;
      state.acquisitions = state.acquisitions.filter((acquisition) => acquisition.id !== action.payload);
      state.pendingApprovals = state.pendingApprovals.filter(
        (acquisition) => acquisition.id !== action.payload
      );
      if (state.selectedAcquisition?.id === action.payload) {
        state.selectedAcquisition = null;
      }
    });
    builder.addCase(deleteAcquisition.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch pending approvals
    builder.addCase(fetchPendingApprovals.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPendingApprovals.fulfilled, (state, action) => {
      state.loading = false;
      state.pendingApprovals = action.payload;
    });
    builder.addCase(fetchPendingApprovals.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Approve or reject acquisition
    builder.addCase(approveOrRejectAcquisition.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(approveOrRejectAcquisition.fulfilled, (state, action) => {
      state.loading = false;
      
      // Update in acquisitions list
      const index = state.acquisitions.findIndex((acquisition) => acquisition.id === action.payload.id);
      if (index !== -1) {
        state.acquisitions[index] = action.payload;
      }
      
      // Remove from pending approvals if no longer pending
      if (action.payload.approvalStatus !== ApprovalStatus.PENDING) {
        state.pendingApprovals = state.pendingApprovals.filter(
          (acquisition) => acquisition.id !== action.payload.id
        );
      }
      
      // Update selected acquisition if it's the current one
      if (state.selectedAcquisition?.id === action.payload.id) {
        state.selectedAcquisition = action.payload;
      }
    });
    builder.addCase(approveOrRejectAcquisition.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  }
});

export const { clearAcquisitionError, setSelectedAcquisition } = acquisitionSlice.actions;
export default acquisitionSlice.reducer;
