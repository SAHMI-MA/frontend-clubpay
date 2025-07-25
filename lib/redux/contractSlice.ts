import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  PlayerContract, 
  StaffContract, 
  CreatePlayerContractDto, 
  UpdatePlayerContractDto,
  CreateStaffContractDto,
  UpdateStaffContractDto,
  contractApi 
} from '@/lib/api/contract-api';
import { tokenUtils } from '@/lib/api';

const handleAuthError = (error: any) => {
  if (error.message?.includes('Authentication required') || 
      error.message?.includes('401') || 
      error.message?.includes('token')) {
    // Clear any invalid tokens
    tokenUtils.removeAuthToken();
    return 'Authentication required: Please login again to access contract management.';
  }
  return error.message || 'An error occurred';
};

interface ContractState {
  playerContracts: PlayerContract[];
  staffContracts: StaffContract[];
  allContracts: (PlayerContract | StaffContract)[];
  selectedContract: PlayerContract | StaffContract | null;
  loading: boolean;
  error: string | null;
  filterStatus: 'active' | 'expired' | 'terminated' | 'pending' | 'all' | null;
  filterType: 'player' | 'staff' | 'all' | null;
}

const initialState: ContractState = {
  playerContracts: [],
  staffContracts: [],
  allContracts: [],
  selectedContract: null,
  loading: false,
  error: null,
  filterStatus: null,
  filterType: null,
};

// Unified contract fetching with filtering
export const fetchContracts = createAsyncThunk(
  'contracts/fetchContracts',
  async (params: { type?: 'player' | 'staff'; status?: 'active' | 'expired' | 'terminated' | 'pending' } = {}, { rejectWithValue }) => {
    try {
      // Check authentication before making request
      if (!tokenUtils.hasAuthToken()) {
        throw new Error('Authentication required: Please login to access contracts.');
      }
      
      const data = await contractApi.getContracts(params.type, params.status);
      return { contracts: data, type: params.type };
    } catch (error: any) {
      return rejectWithValue(handleAuthError(error));
    }
  }
);

// Fetch all contracts (both player and staff)
export const fetchAllContracts = createAsyncThunk(
  'contracts/fetchAllContracts',
  async (status: 'active' | 'expired' | 'terminated' | 'pending' | undefined, { rejectWithValue }) => {
    try {
      console.log('🔄 Fetching all contracts from API...');
      const data = await contractApi.getContracts(undefined, status);
      
      // Handle the new response structure
      if (data && typeof data === 'object' && 'player' in data && 'staff' in data) {
        console.log('✅ Received contracts data:', data);
        return { 
          playerContracts: data.player || [], 
          staffContracts: data.staff || [] 
        };
      } else {
        console.warn('⚠️ Unexpected contract data structure:', data);
        return { playerContracts: [], staffContracts: [] };
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch all contracts:', error);
      return rejectWithValue(error.message || 'Failed to fetch all contracts');
    }
  }
);

// Player contracts
export const fetchPlayerContracts = createAsyncThunk(
  'contracts/fetchPlayerContracts',
  async (status: 'active' | 'expired' | 'terminated' | 'pending' | undefined, { rejectWithValue }) => {
    try {
      const data = await contractApi.getContracts('player', status);
      return data as PlayerContract[];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch player contracts');
    }
  }
);

export const fetchPlayerContractById = createAsyncThunk(
  'contracts/fetchPlayerContractById',
  async (id: string, { rejectWithValue }) => {
    try {
      const data = await contractApi.getContractById(id, 'player');
      return data as PlayerContract;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch player contract details');
    }
  }
);

export const createPlayerContract = createAsyncThunk(
  'contracts/createPlayerContract',
  async (contractData: CreatePlayerContractDto & { contractFileId?: number }, { rejectWithValue }) => {
    try {
      // Validate authentication before attempting to create
      if (!tokenUtils.hasAuthToken()) {
        throw new Error('Authentication required: Please login to create contracts.');
      }
      
      console.log('🔐 Creating player contract with authenticated request');
      const data = await contractApi.createPlayerContract(contractData);
      return data;
    } catch (error: any) {
      return rejectWithValue(handleAuthError(error));
    }
  }
);

export const updatePlayerContract = createAsyncThunk(
  'contracts/updatePlayerContract',
  async ({ id, data }: { id: string; data: UpdatePlayerContractDto }, { rejectWithValue }) => {
    try {
      const updatedData = await contractApi.updatePlayerContract(id, data);
      return updatedData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update player contract');
    }
  }
);

export const deletePlayerContract = createAsyncThunk(
  'contracts/deletePlayerContract',
  async (id: string, { rejectWithValue }) => {
    try {
      await contractApi.deletePlayerContract(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete player contract');
    }
  }
);

export const terminatePlayerContract = createAsyncThunk(
  'contracts/terminatePlayerContract',
  async ({ id, terminationDate, reason }: { id: string; terminationDate: string; reason?: string }, { rejectWithValue }) => {
    try {
      const data = await contractApi.terminatePlayerContract(id, terminationDate, reason);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to terminate player contract');
    }
  }
);

// Async thunks for staff contracts
export const fetchStaffContracts = createAsyncThunk(
  'contracts/fetchStaffContracts',
  async (status: 'active' | 'expired' | 'terminated' | 'pending' | undefined, { rejectWithValue }) => {
    try {
      const data = await contractApi.getContracts('staff', status);
      return data as StaffContract[];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch staff contracts');
    }
  }
);

export const fetchStaffContractById = createAsyncThunk(
  'contracts/fetchStaffContractById',
  async (id: string, { rejectWithValue }) => {
    try {
      const data = await contractApi.getContractById(id, 'staff');
      return data as StaffContract;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch staff contract details');
    }
  }
);

export const createStaffContract = createAsyncThunk(
  'contracts/createStaffContract',
  async (contractData: CreateStaffContractDto & { contractFileId?: number }, { rejectWithValue }) => {
    try {
      // Validate authentication before attempting to create
      if (!tokenUtils.hasAuthToken()) {
        throw new Error('Authentication required: Please login to create contracts.');
      }
      
      console.log('🔐 Creating staff contract with authenticated request');
      const data = await contractApi.createStaffContract(contractData);
      return data;
    } catch (error: any) {
      return rejectWithValue(handleAuthError(error));
    }
  }
);

export const updateStaffContract = createAsyncThunk(
  'contracts/updateStaffContract',
  async ({ id, data }: { id: string; data: UpdateStaffContractDto }, { rejectWithValue }) => {
    try {
      const updatedData = await contractApi.updateStaffContract(id, data);
      return updatedData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update staff contract');
    }
  }
);

export const deleteStaffContract = createAsyncThunk(
  'contracts/deleteStaffContract',
  async (id: string, { rejectWithValue }) => {
    try {
      await contractApi.deleteStaffContract(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete staff contract');
    }
  }
);

export const terminateStaffContract = createAsyncThunk(
  'contracts/terminateStaffContract',
  async ({ id, terminationDate, reason }: { id: string; terminationDate: string; reason?: string }, { rejectWithValue }) => {
    try {
      const data = await contractApi.terminateStaffContract(id, terminationDate, reason);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to terminate staff contract');
    }
  }
);

// Async thunks for bonus structures
// Utility thunks for common contract operations
export const getActiveContracts = createAsyncThunk(
  'contracts/getActiveContracts',
  async (_, { rejectWithValue }) => {
    try {
      const [playerContracts, staffContracts] = await Promise.all([
        contractApi.getContracts('player', 'active') as Promise<PlayerContract[]>,
        contractApi.getContracts('staff', 'active') as Promise<StaffContract[]>
      ]);
      return { playerContracts, staffContracts };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch active contracts');
    }
  }
);

export const getExpiringContracts = createAsyncThunk(
  'contracts/getExpiringContracts',
  async (daysAhead: number = 30, { rejectWithValue }) => {
    try {
      // This would typically be handled by the backend, but we can filter on the frontend
      const [playerContracts, staffContracts] = await Promise.all([
        contractApi.getContracts('player', 'active') as Promise<PlayerContract[]>,
        contractApi.getContracts('staff', 'active') as Promise<StaffContract[]>
      ]);
      
      const today = new Date();
      const futureDate = new Date(today.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
      
      const expiringPlayerContracts = playerContracts.filter(contract => {
        const endDate = new Date(contract.endDate);
        return endDate >= today && endDate <= futureDate;
      });
      
      const expiringStaffContracts = staffContracts.filter(contract => {
        const endDate = new Date(contract.endDate);
        return endDate >= today && endDate <= futureDate;
      });
      
      return { 
        playerContracts: expiringPlayerContracts, 
        staffContracts: expiringStaffContracts 
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch expiring contracts');
    }
  }
);

export const validateContractData = createAsyncThunk(
  'contracts/validateContractData',
  async (data: { startDate: string; endDate: string; terminationDate?: string }, { rejectWithValue }) => {
    try {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const termination = data.terminationDate ? new Date(data.terminationDate) : null;
      
      const errors: string[] = [];
      
      // Business rule validations
      if (end <= start) {
        errors.push('End date must be after start date');
      }
      
      if (termination) {
        if (termination < start || termination > end) {
          errors.push('Termination date must be between start and end dates');
        }
      }
      
      if (errors.length > 0) {
        return rejectWithValue(errors.join(', '));
      }
      
      return { valid: true };
    } catch {
      return rejectWithValue('Invalid date format');
    }
  }
);

// Contract slice
const contractSlice = createSlice({
  name: 'contracts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedContract: (state, action: PayloadAction<PlayerContract | StaffContract | null>) => {
      state.selectedContract = action.payload;
    },
    setFilterStatus: (state, action: PayloadAction<'active' | 'expired' | 'terminated' | 'pending' | 'all' | null>) => {
      state.filterStatus = action.payload;
    },
    setFilterType: (state, action: PayloadAction<'player' | 'staff' | 'all' | null>) => {
      state.filterType = action.payload;
    },
    clearFilters: (state) => {
      state.filterStatus = null;
      state.filterType = null;
    },
  },
  extraReducers: (builder) => {
    // Unified contract fetching
    builder.addCase(fetchContracts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchContracts.fulfilled, (state, action) => {
      state.loading = false;
      const { contracts, type } = action.payload;
      if (type === 'player') {
        state.playerContracts = contracts as PlayerContract[];
      } else if (type === 'staff') {
        state.staffContracts = contracts as StaffContract[];
      } else {
        // Handle mixed contracts response
        if (contracts && typeof contracts === 'object' && 'player' in contracts && 'staff' in contracts) {
          state.playerContracts = contracts.player || [];
          state.staffContracts = contracts.staff || [];
          state.allContracts = [...(contracts.player || []), ...(contracts.staff || [])];
        }
      }
    });
    builder.addCase(fetchContracts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch all contracts
    builder.addCase(fetchAllContracts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAllContracts.fulfilled, (state, action) => {
      state.loading = false;
      const { playerContracts, staffContracts } = action.payload;
      state.playerContracts = playerContracts;
      state.staffContracts = staffContracts;
      state.allContracts = [...playerContracts, ...staffContracts];
    });
    builder.addCase(fetchAllContracts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Player contracts
    builder.addCase(fetchPlayerContracts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPlayerContracts.fulfilled, (state, action) => {
      state.loading = false;
      state.playerContracts = action.payload;
    });
    builder.addCase(fetchPlayerContracts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    builder.addCase(createPlayerContract.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createPlayerContract.fulfilled, (state, action) => {
      state.loading = false;
      state.playerContracts.push(action.payload);
    });
    builder.addCase(createPlayerContract.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    builder.addCase(updatePlayerContract.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updatePlayerContract.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.playerContracts.findIndex(contract => contract.id === action.payload.id);
      if (index !== -1) {
        state.playerContracts[index] = action.payload;
      }
      if (state.selectedContract?.id === action.payload.id) {
        state.selectedContract = action.payload;
      }
      // NOTE: To ensure state is up to date, dispatch(fetchAllContracts()) in your component after updatePlayerContract.fulfilled.
    });
    builder.addCase(updatePlayerContract.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    builder.addCase(deletePlayerContract.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deletePlayerContract.fulfilled, (state, action) => {
      state.loading = false;
      state.playerContracts = state.playerContracts.filter(contract => contract.id !== action.payload);
      if (state.selectedContract?.id === action.payload) {
        state.selectedContract = null;
      }
    });
    builder.addCase(deletePlayerContract.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    builder.addCase(terminatePlayerContract.fulfilled, (state, action) => {
      const index = state.playerContracts.findIndex(contract => contract.id === action.payload.id);
      if (index !== -1) {
        state.playerContracts[index] = action.payload;
      }
      if (state.selectedContract?.id === action.payload.id) {
        state.selectedContract = action.payload;
      }
    });
    
    // Staff contracts
    builder.addCase(fetchStaffContracts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchStaffContracts.fulfilled, (state, action) => {
      state.loading = false;
      state.staffContracts = action.payload;
    });
    builder.addCase(fetchStaffContracts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    builder.addCase(createStaffContract.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createStaffContract.fulfilled, (state, action) => {
      state.loading = false;
      state.staffContracts.push(action.payload);
    });
    builder.addCase(createStaffContract.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    builder.addCase(updateStaffContract.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateStaffContract.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.staffContracts.findIndex(contract => contract.id === action.payload.id);
      if (index !== -1) {
        state.staffContracts[index] = action.payload;
      }
      if (state.selectedContract?.id === action.payload.id) {
        state.selectedContract = action.payload;
      }
      // NOTE: To ensure state is up to date, dispatch(fetchAllContracts()) in your component after updateStaffContract.fulfilled.
    });
    builder.addCase(updateStaffContract.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    builder.addCase(deleteStaffContract.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteStaffContract.fulfilled, (state, action) => {
      state.loading = false;
      state.staffContracts = state.staffContracts.filter(contract => contract.id !== action.payload);
      if (state.selectedContract?.id === action.payload) {
        state.selectedContract = null;
      }
    });
    builder.addCase(deleteStaffContract.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    builder.addCase(terminateStaffContract.fulfilled, (state, action) => {
      const index = state.staffContracts.findIndex(contract => contract.id === action.payload.id);
      if (index !== -1) {
        state.staffContracts[index] = action.payload;
      }
      if (state.selectedContract?.id === action.payload.id) {
        state.selectedContract = action.payload;
      }
    });
    
    // Utility thunks
    builder.addCase(getActiveContracts.fulfilled, (state, action) => {
      const { playerContracts, staffContracts } = action.payload;
      state.playerContracts = playerContracts;
      state.staffContracts = staffContracts;
      state.allContracts = [...playerContracts, ...staffContracts];
    });

    builder.addCase(getExpiringContracts.fulfilled, (state, action) => {
      const { playerContracts, staffContracts } = action.payload;
      // Store expiring contracts in a way that doesn't overwrite all contracts
      // This could be extended with separate state fields for expiring contracts
      state.allContracts = [...playerContracts, ...staffContracts];
    });

    builder.addCase(validateContractData.rejected, (state, action) => {
      state.error = action.payload as string;
    });

    // Authentication verification
    builder.addCase(verifyAuthentication.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(verifyAuthentication.fulfilled, (state) => {
      state.loading = false;
      state.error = null;
    });
    builder.addCase(verifyAuthentication.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

// Selector functions for contract state
export const selectAllContracts = (state: { contracts: ContractState }) => state.contracts.allContracts;
export const selectPlayerContracts = (state: { contracts: ContractState }) => state.contracts.playerContracts;
export const selectStaffContracts = (state: { contracts: ContractState }) => state.contracts.staffContracts;
export const selectSelectedContract = (state: { contracts: ContractState }) => state.contracts.selectedContract;
export const selectContractsLoading = (state: { contracts: ContractState }) => state.contracts.loading;
export const selectContractsError = (state: { contracts: ContractState }) => state.contracts.error;
export const selectFilterStatus = (state: { contracts: ContractState }) => state.contracts.filterStatus;
export const selectFilterType = (state: { contracts: ContractState }) => state.contracts.filterType;

// Authentication verification selector
export const selectIsAuthenticated = () => {
  return tokenUtils.hasAuthToken();
};

// Authentication verification action
export const verifyAuthentication = createAsyncThunk(
  'contracts/verifyAuthentication',
  async (_, { rejectWithValue }) => {
    try {
      if (!tokenUtils.hasAuthToken()) {
        throw new Error('Authentication required: No valid token found. Please login again.');
      }
      
      // Optionally verify token validity with backend
      // This could be a simple /auth/verify endpoint call
      console.log('✅ Authentication verified for contract operations');
      return { authenticated: true };
    } catch (error: any) {
      tokenUtils.removeAuthToken(); // Clear invalid token
      return rejectWithValue(handleAuthError(error));
    }
  }
);

export const { 
  clearError, 
  setSelectedContract, 
  setFilterStatus, 
  setFilterType, 
  clearFilters 
} = contractSlice.actions;

export default contractSlice.reducer;
