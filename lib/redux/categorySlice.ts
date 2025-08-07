import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { categoryService, CreateCategoryDto, UpdateCategoryDto } from '../services';

// Async thunks
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async () => {
    const response = await categoryService.getAllCategories();
    return response;
  }
);

export const createCategoryAsync = createAsyncThunk(
  'categories/createCategory',
  async (categoryData: CreateCategoryDto) => {
    const response = await categoryService.createCategory(categoryData);
    return response;
  }
);

export const updateCategoryAsync = createAsyncThunk(
  'categories/updateCategory',
  async ({ id, categoryData }: { id: number; categoryData: UpdateCategoryDto }) => {
    const response = await categoryService.updateCategory(id, categoryData);
    return response;
  }
);

export const deleteCategoryAsync = createAsyncThunk(
  'categories/deleteCategory',
  async (id: number) => {
    await categoryService.deleteCategory(id);
    return id;
  }
);

export interface Category {
  id: number;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoryState = {
  categories: [],
  loading: false,
  error: null,
};

export const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    setCategories: (state, action: PayloadAction<Category[]>) => {
      state.categories = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCategories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch categories';
      })
      // createCategoryAsync
      .addCase(createCategoryAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategoryAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.categories.push(action.payload);
        state.error = null;
      })
      .addCase(createCategoryAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create category';
      })
      // updateCategoryAsync
      .addCase(updateCategoryAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategoryAsync.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.categories.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateCategoryAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update category';
      })
      // deleteCategoryAsync
      .addCase(deleteCategoryAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategoryAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = state.categories.filter(c => c.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteCategoryAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete category';
      });
  },
});

export const { 
  setCategories, 
  setLoading, 
  setError 
} = categorySlice.actions;

export default categorySlice.reducer;
