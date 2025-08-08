import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Supply, CreateSupplyDto, UpdateSupplyDto } from '../types/supplier-management';
import { api } from '../api';

interface SuppliesState {
  supplies: Supply[];
  selectedSupply: Supply | null;
  loading: boolean;
  error: string | null;
}

const initialState: SuppliesState = {
  supplies: [],
  selectedSupply: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchAllSupplies = createAsyncThunk(
  'supplies/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching supplies from API...');
      const data = await api.get<Supply[]>('supplies');
      console.log('Supplies fetched successfully:', data);
      return data;
    } catch (error: any) {
      console.error('Error fetching supplies:', error);
      return rejectWithValue(error.message || 'Échec de la récupération des fournitures');
    }
  }
);

export const fetchSupplyById = createAsyncThunk(
  'supplies/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const data = await api.get<Supply>(`supplies/${id}`);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Échec de la récupération de la fourniture');
    }
  }
);

export const createSupply = createAsyncThunk(
  'supplies/create',
  async (supplyData: CreateSupplyDto, { rejectWithValue }) => {
    try {
      const data = await api.post<Supply>('supplies', supplyData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Échec de la création de la fourniture');
    }
  }
);

export const updateSupply = createAsyncThunk(
  'supplies/update',
  async ({ id, data }: { id: number; data: UpdateSupplyDto }, { rejectWithValue }) => {
    try {
      const result = await api.put<Supply>(`supplies/${id}`, data);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Échec de la mise à jour de la fourniture');
    }
  }
);

export const deleteSupply = createAsyncThunk(
  'supplies/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`supplies/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Échec de la suppression de la fourniture');
    }
  }
);

// Slice
const suppliesSlice = createSlice({
  name: 'supplies',
  initialState,
  reducers: {
    clearSuppliesError: (state) => {
      state.error = null;
    },
    setSelectedSupply: (state, action: PayloadAction<Supply | null>) => {
      state.selectedSupply = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Fetch all supplies
    builder.addCase(fetchAllSupplies.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAllSupplies.fulfilled, (state, action) => {
      state.loading = false;
      state.supplies = action.payload;
    });
    builder.addCase(fetchAllSupplies.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch supply by ID
    builder.addCase(fetchSupplyById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSupplyById.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedSupply = action.payload;
    });
    builder.addCase(fetchSupplyById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create supply
    builder.addCase(createSupply.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createSupply.fulfilled, (state, action) => {
      state.loading = false;
      state.supplies.push(action.payload);
    });
    builder.addCase(createSupply.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update supply
    builder.addCase(updateSupply.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateSupply.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.supplies.findIndex(supply => supply.id === action.payload.id);
      if (index !== -1) {
        state.supplies[index] = action.payload;
      }
      if (state.selectedSupply?.id === action.payload.id) {
        state.selectedSupply = action.payload;
      }
    });
    builder.addCase(updateSupply.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete supply
    builder.addCase(deleteSupply.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteSupply.fulfilled, (state, action) => {
      state.loading = false;
      state.supplies = state.supplies.filter(supply => supply.id !== action.payload);
      if (state.selectedSupply?.id === action.payload) {
        state.selectedSupply = null;
      }
    });
    builder.addCase(deleteSupply.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearSuppliesError, setSelectedSupply } = suppliesSlice.actions;
export default suppliesSlice.reducer;
