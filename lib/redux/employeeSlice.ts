import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Employee, CreateEmployeeDto, UpdateEmployeeDto } from '../types/team-management';
import { api } from '../api';

interface EmployeeState {
  employees: Employee[];
  loading: boolean;
  error: string | null;
}

const initialState: EmployeeState = {
  employees: [],
  loading: false,
  error: null,
};

// Async thunks for API calls
export const fetchAllEmployees = createAsyncThunk(
  'employees/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await api.get('/hr/employees');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch employees');
    }
  }
);

export const fetchEmployeeById = createAsyncThunk(
  'employees/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await api.get(`/hr/employees/${id}`);
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to fetch employee with ID ${id}`);
    }
  }
);

export const createEmployee = createAsyncThunk(
  'employees/create',
  async (employeeData: CreateEmployeeDto, { rejectWithValue }) => {
    try {
      return await api.post('/hr/employees', employeeData);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create employee');
    }
  }
);

export const updateEmployee = createAsyncThunk(
  'employees/update',
  async ({ id, data }: { id: string; data: UpdateEmployeeDto }, { rejectWithValue }) => {
    try {
      return await api.put(`/hr/employees/${id}`, data);
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to update employee with ID ${id}`);
    }
  }
);

export const deleteEmployee = createAsyncThunk(
  'employees/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/hr/employees/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to delete employee with ID ${id}`);
    }
  }
);

const employeeSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    clearEmployeeError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all employees
      .addCase(fetchAllEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = action.payload as unknown as Employee[];
        state.error = null;
      })
      .addCase(fetchAllEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch employee by ID
      .addCase(fetchEmployeeById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeById.fulfilled, (state, action) => {
        state.loading = false;
        const employee = action.payload as unknown as Employee;
        const index = state.employees.findIndex(emp => emp.employeeId === employee.employeeId);
        if (index !== -1) {
          state.employees[index] = employee;
        } else {
          state.employees.push(employee);
        }
        state.error = null;
      })
      .addCase(fetchEmployeeById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create employee
      .addCase(createEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.employees.push(action.payload as unknown as Employee);
        state.error = null;
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update employee
      .addCase(updateEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.loading = false;
        const employee = action.payload as unknown as Employee;
        const index = state.employees.findIndex(emp => emp.employeeId === employee.employeeId);
        if (index !== -1) {
          state.employees[index] = employee;
        }
        state.error = null;
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete employee
      .addCase(deleteEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = state.employees.filter(emp => emp.employeeId !== action.payload);
        state.error = null;
      })
      .addCase(deleteEmployee.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearEmployeeError } = employeeSlice.actions;
export default employeeSlice.reducer;
