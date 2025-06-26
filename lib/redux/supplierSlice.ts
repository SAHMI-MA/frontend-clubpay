import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Supplier, CreateSupplierDto, UpdateSupplierDto } from '@/lib/types/supplier-management';
import { api } from '@/lib/api';

interface SupplierState {
  suppliers: Supplier[];
  selectedSupplier: Supplier | null;
  loading: boolean;
  error: string | null;
}

const initialState: SupplierState = {
  suppliers: [],
  selectedSupplier: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchAllSuppliers = createAsyncThunk(
  'suppliers/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get<Supplier[]>('suppliers');
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch suppliers');
    }
  }
);

export const fetchSupplierById = createAsyncThunk(
  'suppliers/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const data = await api.get<Supplier>(`suppliers/${id}`);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch supplier details');
    }
  }
);

export const createSupplier = createAsyncThunk(
  'suppliers/create',
  async (supplierData: CreateSupplierDto, { rejectWithValue }) => {
    try {
      const data = await api.post<Supplier>('suppliers', supplierData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create supplier');
    }
  }
);

export const updateSupplier = createAsyncThunk(
  'suppliers/update',
  async ({ id, data }: { id: number; data: UpdateSupplierDto }, { rejectWithValue }) => {
    try {
      const updatedData = await api.put<Supplier>(`suppliers/${id}`, data);
      return updatedData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update supplier');
    }
  }
);

export const deleteSupplier = createAsyncThunk(
  'suppliers/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`suppliers/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete supplier');
    }
  }
);

// Slice
const supplierSlice = createSlice({
  name: 'suppliers',
  initialState,
  reducers: {
    clearSupplierError: (state) => {
      state.error = null;
    },
    setSelectedSupplier: (state, action: PayloadAction<Supplier | null>) => {
      state.selectedSupplier = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Fetch all suppliers
    builder.addCase(fetchAllSuppliers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAllSuppliers.fulfilled, (state, action) => {
      state.loading = false;
      state.suppliers = action.payload;
    });
    builder.addCase(fetchAllSuppliers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch supplier by ID
    builder.addCase(fetchSupplierById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSupplierById.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedSupplier = action.payload;
    });
    builder.addCase(fetchSupplierById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create supplier
    builder.addCase(createSupplier.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createSupplier.fulfilled, (state, action) => {
      state.loading = false;
      state.suppliers.push(action.payload);
    });
    builder.addCase(createSupplier.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update supplier
    builder.addCase(updateSupplier.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateSupplier.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.suppliers.findIndex((supplier) => supplier.id === action.payload.id);
      if (index !== -1) {
        state.suppliers[index] = action.payload;
      }
      if (state.selectedSupplier?.id === action.payload.id) {
        state.selectedSupplier = action.payload;
      }
    });
    builder.addCase(updateSupplier.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete supplier
    builder.addCase(deleteSupplier.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteSupplier.fulfilled, (state, action) => {
      state.loading = false;
      state.suppliers = state.suppliers.filter((supplier) => supplier.id !== action.payload);
      if (state.selectedSupplier?.id === action.payload) {
        state.selectedSupplier = null;
      }
    });
    builder.addCase(deleteSupplier.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  }
});

export const { clearSupplierError, setSelectedSupplier } = supplierSlice.actions;
export default supplierSlice.reducer;
