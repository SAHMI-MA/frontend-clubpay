import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  Transaction, 
  SalaryPayment, 
  Rental, 
  FinancialReport,
  CreateTransactionDto,
  CreateTransactionFromAcquisitionDto,
  CreateRentalDto,
  CreateSalaryPaymentDto,
  UpdateTransactionDto,
  UpdatePaymentStatusDto,
  GenerateReportDto,
  TransactionFilterDto,
  PaymentStatus
} from '@/lib/types/financial-management';
import { api } from '@/lib/api';

interface FinancialState {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  selectedTransaction: Transaction | null;
  rentals: Rental[];
  selectedRental: Rental | null;
  salaryPayments: SalaryPayment[];
  selectedSalaryPayment: SalaryPayment | null;
  financialReports: FinancialReport[];
  selectedReport: FinancialReport | null;
  loading: boolean;
  error: string | null;
}

const initialState: FinancialState = {
  transactions: [],
  filteredTransactions: [],
  selectedTransaction: null,
  rentals: [],
  selectedRental: null,
  salaryPayments: [],
  selectedSalaryPayment: null,
  financialReports: [],
  selectedReport: null,
  loading: false,
  error: null,
};

// Transactions Thunks
export const fetchTransactions = createAsyncThunk(
  'financial/fetchTransactions',
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get<Transaction[]>('/accounting/transactions');
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch transactions');
    }
  }
);

export const fetchTransactionsByFilter = createAsyncThunk(
  'financial/fetchTransactionsByFilter',
  async (filterParams: TransactionFilterDto, { rejectWithValue }) => {
    try {
      // Build query string from filter parameters
      const queryParams = new URLSearchParams();
      if (filterParams.startDate) queryParams.append('startDate', filterParams.startDate);
      if (filterParams.endDate) queryParams.append('endDate', filterParams.endDate);
      if (filterParams.type) queryParams.append('type', filterParams.type);
      if (filterParams.category) queryParams.append('category', filterParams.category);
      if (filterParams.status) queryParams.append('status', filterParams.status);
      
      const endpoint = `accounting/transactions/date-range?${queryParams.toString()}`;
      const data = await api.get<Transaction[]>(endpoint);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch filtered transactions');
    }
  }
);

export const fetchTransactionById = createAsyncThunk(
  'financial/fetchTransactionById',
  async (id: number, { rejectWithValue }) => {
    try {
      const data = await api.get<Transaction>(`/accounting/transactions/${id}`);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch transaction details');
    }
  }
);

export const createTransaction = createAsyncThunk(
  'financial/createTransaction',
  async (transactionData: CreateTransactionDto, { rejectWithValue }) => {
    try {
      const data = await api.post<Transaction>('/accounting/transactions', transactionData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create transaction');
    }
  }
);

export const createTransactionFromAcquisition = createAsyncThunk(
  'financial/createTransactionFromAcquisition',
  async (data: CreateTransactionFromAcquisitionDto, { rejectWithValue }) => {
    try {
      // Check for authentication token
      let authToken;
      if (typeof window !== 'undefined') {
        authToken = localStorage.getItem('auth_token');
      }

      if (!authToken) {
        return rejectWithValue('Authentication required: No token found. Please log in again.');
      }

      console.log("Making transaction creation request with authorization token");
      console.log("Request endpoint: /accounting/transactions/from-acquisition");
      console.log("Request payload:", JSON.stringify(data));
      const response = await api.post<Transaction>('/accounting/transactions/from-acquisition', data);
      return response;
    } catch (error: any) {
      console.error("Transaction creation failed:", error);
      return rejectWithValue(error.message || 'Failed to create transaction from acquisition');
    }
  }
);

export const updateTransaction = createAsyncThunk(
  'financial/updateTransaction',
  async ({ id, data }: { id: number; data: UpdateTransactionDto }, { rejectWithValue }) => {
    try {
      const response = await api.put<Transaction>(`accounting/transactions/${id}`, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update transaction');
    }
  }
);

export const updateTransactionStatus = createAsyncThunk(
  'financial/updateTransactionStatus',
  async ({ id, status, notes }: { id: number; status: PaymentStatus; notes?: string }, { rejectWithValue }) => {
    try {
      const data: UpdatePaymentStatusDto = { status, notes };
      const response = await api.patch<Transaction>(`accounting/transactions/${id}/status`, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update transaction status');
    }
  }
);

// Rentals Thunks
export const fetchRentals = createAsyncThunk(
  'financial/fetchRentals',
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get<Rental[]>('/accounting/rentals');
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch rentals');
    }
  }
);

export const fetchRentalById = createAsyncThunk(
  'financial/fetchRentalById',
  async (id: number, { rejectWithValue }) => {
    try {
      const data = await api.get<Rental>(`/accounting/rentals/${id}`);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch rental details');
    }
  }
);

export const createRental = createAsyncThunk(
  'financial/createRental',
  async (rentalData: CreateRentalDto, { rejectWithValue }) => {
    try {
      const data = await api.post<Rental>('/accounting/rentals', rentalData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create rental');
    }
  }
);

export const createRentalFromAcquisition = createAsyncThunk(
  'financial/createRentalFromAcquisition',
  async (acquisitionId: number, { rejectWithValue }) => {
    try {
      const data = await api.post<Rental>('/accounting/rentals/from-acquisition', { acquisitionId });
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create rental from acquisition');
    }
  }
);

// Salary Payments Thunks
export const fetchSalaryPayments = createAsyncThunk(
  'financial/fetchSalaryPayments',
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get<SalaryPayment[]>('/accounting/salary-payments');
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch salary payments');
    }
  }
);

export const fetchSalaryPaymentById = createAsyncThunk(
  'financial/fetchSalaryPaymentById',
  async (id: number, { rejectWithValue }) => {
    try {
      const data = await api.get<SalaryPayment>(`/accounting/salary-payments/${id}`);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch salary payment details');
    }
  }
);

export const createSalaryPayment = createAsyncThunk(
  'financial/createSalaryPayment',
  async (paymentData: CreateSalaryPaymentDto, { rejectWithValue }) => {
    try {
      const data = await api.post<SalaryPayment>('/accounting/salary-payments', paymentData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create salary payment');
    }
  }
);

export const updateSalaryPaymentStatus = createAsyncThunk(
  'financial/updateSalaryPaymentStatus',
  async ({ id, status }: { id: number; status: PaymentStatus }, { rejectWithValue }) => {
    try {
      const response = await api.patch<SalaryPayment>(`accounting/salary-payments/${id}/status/${status}`, {});
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update salary payment status');
    }
  }
);

// Financial Reports Thunks
export const fetchFinancialReports = createAsyncThunk(
  'financial/fetchFinancialReports',
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get<FinancialReport[]>('/accounting/financial-reports');
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch financial reports');
    }
  }
);

export const fetchFinancialReportById = createAsyncThunk(
  'financial/fetchFinancialReportById',
  async (id: number, { rejectWithValue }) => {
    try {
      const data = await api.get<FinancialReport>(`/accounting/financial-reports/${id}`);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch financial report details');
    }
  }
);

export const generateFinancialReport = createAsyncThunk(
  'financial/generateFinancialReport',
  async (reportData: GenerateReportDto, { rejectWithValue }) => {
    try {
      const data = await api.post<FinancialReport>('/accounting/financial-reports/generate', reportData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate financial report');
    }
  }
);

const financialSlice = createSlice({
  name: 'financial',
  initialState,
  reducers: {
    clearFinancialError: (state) => {
      state.error = null;
    },
    setSelectedTransaction: (state, action: PayloadAction<Transaction | null>) => {
      state.selectedTransaction = action.payload;
    },
    setSelectedRental: (state, action: PayloadAction<Rental | null>) => {
      state.selectedRental = action.payload;
    },
    setSelectedSalaryPayment: (state, action: PayloadAction<SalaryPayment | null>) => {
      state.selectedSalaryPayment = action.payload;
    },
    setSelectedReport: (state, action: PayloadAction<FinancialReport | null>) => {
      state.selectedReport = action.payload;
    },
    filterTransactions: (state, action: PayloadAction<TransactionFilterDto>) => {
      const { type, category, status, startDate, endDate } = action.payload;
      
      state.filteredTransactions = state.transactions.filter((transaction) => {
        let matches = true;
        
        if (type && transaction.type !== type) {
          matches = false;
        }
        
        if (category && transaction.category !== category) {
          matches = false;
        }
        
        if (status && transaction.status !== status) {
          matches = false;
        }
        
        if (startDate) {
          const start = new Date(startDate);
          const transactionDate = new Date(transaction.date);
          if (transactionDate < start) {
            matches = false;
          }
        }
        
        if (endDate) {
          const end = new Date(endDate);
          const transactionDate = new Date(transaction.date);
          if (transactionDate > end) {
            matches = false;
          }
        }
        
        return matches;
      });
    }
  },
  extraReducers: (builder) => {
    // Fetch Transactions
    builder.addCase(fetchTransactions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTransactions.fulfilled, (state, action) => {
      state.loading = false;
      state.transactions = action.payload;
      state.filteredTransactions = action.payload;
    });
    builder.addCase(fetchTransactions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Transactions By Filter
    builder.addCase(fetchTransactionsByFilter.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTransactionsByFilter.fulfilled, (state, action) => {
      state.loading = false;
      state.filteredTransactions = action.payload;
    });
    builder.addCase(fetchTransactionsByFilter.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Transaction By ID
    builder.addCase(fetchTransactionById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchTransactionById.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedTransaction = action.payload;
    });
    builder.addCase(fetchTransactionById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create Transaction
    builder.addCase(createTransaction.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createTransaction.fulfilled, (state, action) => {
      state.loading = false;
      state.transactions.push(action.payload);
      state.filteredTransactions.push(action.payload);
    });
    builder.addCase(createTransaction.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create Transaction From Acquisition
    builder.addCase(createTransactionFromAcquisition.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createTransactionFromAcquisition.fulfilled, (state, action) => {
      state.loading = false;
      state.transactions.push(action.payload);
      state.filteredTransactions.push(action.payload);
    });
    builder.addCase(createTransactionFromAcquisition.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update Transaction
    builder.addCase(updateTransaction.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateTransaction.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.transactions.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.transactions[index] = action.payload;
      }

      const filteredIndex = state.filteredTransactions.findIndex(t => t.id === action.payload.id);
      if (filteredIndex !== -1) {
        state.filteredTransactions[filteredIndex] = action.payload;
      }

      if (state.selectedTransaction?.id === action.payload.id) {
        state.selectedTransaction = action.payload;
      }
    });
    builder.addCase(updateTransaction.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update Transaction Status
    builder.addCase(updateTransactionStatus.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateTransactionStatus.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.transactions.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.transactions[index] = action.payload;
      }

      const filteredIndex = state.filteredTransactions.findIndex(t => t.id === action.payload.id);
      if (filteredIndex !== -1) {
        state.filteredTransactions[filteredIndex] = action.payload;
      }

      if (state.selectedTransaction?.id === action.payload.id) {
        state.selectedTransaction = action.payload;
      }
    });
    builder.addCase(updateTransactionStatus.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Rentals
    builder.addCase(fetchRentals.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchRentals.fulfilled, (state, action) => {
      state.loading = false;
      state.rentals = action.payload;
    });
    builder.addCase(fetchRentals.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Salary Payments
    builder.addCase(fetchSalaryPayments.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSalaryPayments.fulfilled, (state, action) => {
      state.loading = false;
      state.salaryPayments = action.payload;
    });
    builder.addCase(fetchSalaryPayments.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Financial Reports
    builder.addCase(fetchFinancialReports.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchFinancialReports.fulfilled, (state, action) => {
      state.loading = false;
      state.financialReports = action.payload;
    });
    builder.addCase(fetchFinancialReports.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    builder.addCase(generateFinancialReport.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(generateFinancialReport.fulfilled, (state, action) => {
      state.loading = false;
      state.financialReports.push(action.payload);
      state.selectedReport = action.payload;
    });
    builder.addCase(generateFinancialReport.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { 
  clearFinancialError, 
  setSelectedTransaction, 
  setSelectedRental, 
  setSelectedSalaryPayment,
  setSelectedReport,
  filterTransactions
} = financialSlice.actions;

export default financialSlice.reducer;
