import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  Transaction, 
  SalaryPayment, 
  Rental, 
  FinancialReport,
  CreateTransactionDto,
  CreateTransactionFromAcquisitionDto,
  CreateTransactionFromSalaryPaymentDto,
  CreateRentalDto,
  CreateSalaryPaymentDto,
  BulkSalaryPaymentDto,
  UpdateTransactionDto,
  UpdatePaymentStatusDto,
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
  totalSalaryPayments: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
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
  totalSalaryPayments: 0,
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
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

export const createTransactionFromAcquisition = createAsyncThunk(
  'financial/createTransactionFromAcquisition',
  /**
   * Supports purchaseOrderId and purchaseOrderType for purchase order file linking (see DTO)
   */
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

      // Log purchase order fields if present
      if (data.purchaseOrderId || data.purchaseOrderType) {
        console.log('[createTransactionFromAcquisition] purchaseOrderId:', data.purchaseOrderId, 'purchaseOrderType:', data.purchaseOrderType);
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

export const createTransaction = createAsyncThunk(
  'financial/createTransaction',
  /**
   * Supports purchaseOrderId and purchaseOrderType for purchase order file linking (see DTO)
   */
  async (data: CreateTransactionDto, { rejectWithValue }) => {
    try {
      // Check for authentication token
      let authToken;
      if (typeof window !== 'undefined') {
        authToken = localStorage.getItem('auth_token');
      }

      if (!authToken) {
        return rejectWithValue('Authentication required: No token found. Please log in again.');
      }

      // Log purchase order fields if present
      if (data.purchaseOrderId || data.purchaseOrderType) {
        console.log('[createTransaction] purchaseOrderId:', data.purchaseOrderId, 'purchaseOrderType:', data.purchaseOrderType);
      }
      console.log("Making transaction creation request with authorization token");
      console.log("Request endpoint: /accounting/transactions");
      console.log("Request payload:", JSON.stringify(data));
      
      // Make sure data contains all required fields
      if (!data.type || !data.category || !data.amount || !data.date || !data.description || !data.createdById) {
        console.error("Missing required fields in payload:", data);
        throw new Error("Missing required fields: all fields including createdById are required");
      }
      
      const response = await api.post<Transaction>('/accounting/transactions', data);
      
      return response;
    } catch (error: any) {
      console.error("Transaction creation error:", error);
      return rejectWithValue(
        `API error: ${error.statusCode || error.status || ''} ${error.message || 'Unknown error'}`
      );
    }
  }
);

export const createTransactionFromSalaryPayment = createAsyncThunk(
  'financial/createTransactionFromSalaryPayment',
  async (data: CreateTransactionFromSalaryPaymentDto, { rejectWithValue, dispatch }) => {
    try {
      // Check for authentication token
      let authToken;
      if (typeof window !== 'undefined') {
        authToken = localStorage.getItem('auth_token');
      }

      if (!authToken) {
        return rejectWithValue('Authentication required: No token found. Please log in again.');
      }

      console.log("Making transaction creation from salary payment request with authorization token");
      console.log("Request endpoint: /accounting/transactions/from-salary-payment");
      console.log("Request payload:", JSON.stringify(data));
      
      // Make sure data contains all required fields
      if (!data.salaryPaymentId || !data.createdById) {
        console.error("Missing required fields in payload:", data);
        throw new Error("Missing required fields: salaryPaymentId and createdById are required");
      }
      
      // Ensure customDescription is present - it's required by the API
      const finalPayload = {
        ...data,
        customDescription: data.customDescription || `Salary payment transaction for payment ID: ${data.salaryPaymentId}`
      };
      
      console.log("Final request payload:", JSON.stringify(finalPayload));
      const response = await api.post<Transaction>('/accounting/transactions/from-salary-payment', finalPayload);
      
      // Update the salary payment status to APPROVED
      if (response && response.id) {
        await dispatch(updateSalaryPaymentStatus({ 
          id: data.salaryPaymentId, 
          status: PaymentStatus.APPROVED 
        }));
      }
      
      return response;
    } catch (error: any) {
      console.error("Transaction creation from salary payment failed:", error);
      
      // Log detailed error information
      console.error("API Error Details:", {
        status: error.status || error.statusCode || error.response?.status,
        data: error.response?.data || error.data,
        message: error.message,
        fullError: error
      });
      
      // Extract more detailed error message if available
      const serverErrorMessage = error.response?.data?.message || 
                               error.response?.data?.error ||
                               error.data?.message;
      
      const errorMessage = serverErrorMessage || error.message || 'Failed to create transaction from salary payment';
      console.error("Final error message:", errorMessage);
      
      return rejectWithValue(errorMessage);
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
  async ({ page = 1, limit = 10 }: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const data = await api.get<{
        data: SalaryPayment[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/accounting/salary-payments?page=${page}&limit=${limit}`);
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

export const approveSalaryPayment = createAsyncThunk(
  'financial/approveSalaryPayment',
  async (id: number, { rejectWithValue }) => {
    try {
      // Check for authentication token
      let authToken;
      if (typeof window !== 'undefined') {
        authToken = localStorage.getItem('auth_token');
      }

      if (!authToken) {
        return rejectWithValue('Authentication required: No token found. Please log in again.');
      }

      console.log(`Approving salary payment with ID: ${id}`);
      const response = await api.patch<SalaryPayment>(`accounting/salary-payments/${id}/approve`, {});
      console.log('Salary payment approved successfully:', response);
      return response;
    } catch (error: any) {
      console.error('Salary payment approval failed:', error);
      return rejectWithValue(error.message || 'Failed to approve salary payment');
    }
  }
);

// Get next payment period for club players/staff
export const getNextClubPaymentPeriod = createAsyncThunk(
  'financial/getNextClubPaymentPeriod',
  async ({ type, id }: { type: 'player' | 'staff'; id: number }, { rejectWithValue }) => {
    try {
      const endpoint = type === 'player' 
        ? `/accounting/salary-payments/next-period/player/${id}`
        : `/accounting/salary-payments/next-period/staff/${id}`;
      const data = await api.get<{ periodStart: string; periodEnd: string; payPeriod: string }>(endpoint);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get next payment period');
    }
  }
);

// Bulk Salary Payments Thunk
export const createBulkSalaryPayment = createAsyncThunk(
  'financial/createBulkSalaryPayment',
  async (paymentData: BulkSalaryPaymentDto, { rejectWithValue, dispatch }) => {
    try {
      // Check for authentication token
      let authToken;
      if (typeof window !== 'undefined') {
        authToken = localStorage.getItem('auth_token');
      }

      if (!authToken) {
        return rejectWithValue('Authentication required: No token found. Please log in again.');
      }

      console.log("Making bulk salary payment request with authorization token");
      console.log("Request endpoint: /accounting/salary-payments/bulk");
      console.log("Request payload:", JSON.stringify(paymentData));
      
      const response = await api.post<SalaryPayment[]>('/accounting/salary-payments/bulk', paymentData);
      
      // Refresh salary payments after creating bulk payments
      await dispatch(fetchSalaryPayments({ page: 1, limit: 10 }));
      
      return response;
    } catch (error: any) {
      console.error("Bulk salary payment creation failed:", error);
      
      // Log detailed error information
      console.error("API Error Details:", {
        status: error.status || error.statusCode || error.response?.status,
        data: error.response?.data || error.data,
        message: error.message,
        fullError: error
      });
      
      // Extract more detailed error message if available
      const serverErrorMessage = error.response?.data?.message || 
                               error.response?.data?.error ||
                               error.data?.message;
      
      const errorMessage = serverErrorMessage || error.message || 'Failed to create bulk salary payments';
      return rejectWithValue(errorMessage);
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
    
    // Create Transaction From Salary Payment
    builder.addCase(createTransactionFromSalaryPayment.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createTransactionFromSalaryPayment.fulfilled, (state, action) => {
      state.loading = false;
      state.transactions.push(action.payload);
      state.filteredTransactions.push(action.payload);
    });
    builder.addCase(createTransactionFromSalaryPayment.rejected, (state, action) => {
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
      const index = state.transactions.findIndex((t: Transaction) => t.id === action.payload.id);
      if (index !== -1) {
        state.transactions[index] = action.payload;
      }

      const filteredIndex = state.filteredTransactions.findIndex((t: Transaction) => t.id === action.payload.id);
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
      const index = state.transactions.findIndex((t: Transaction) => t.id === action.payload.id);
      if (index !== -1) {
        state.transactions[index] = action.payload;
      }

      const filteredIndex = state.filteredTransactions.findIndex((t: Transaction) => t.id === action.payload.id);
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

    // Fetch Rental By ID
    builder.addCase(fetchRentalById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchRentalById.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedRental = action.payload;
    });
    builder.addCase(fetchRentalById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create Rental
    builder.addCase(createRental.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createRental.fulfilled, (state, action) => {
      state.loading = false;
      state.rentals.push(action.payload);
    });
    builder.addCase(createRental.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create Rental From Acquisition
    builder.addCase(createRentalFromAcquisition.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createRentalFromAcquisition.fulfilled, (state, action) => {
      state.loading = false;
      state.rentals.push(action.payload);
    });
    builder.addCase(createRentalFromAcquisition.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Salary Payments
    builder.addCase(fetchSalaryPayments.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSalaryPayments.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      // Handle paginated response
      if (action.payload.data) {
        state.salaryPayments = action.payload.data;
        state.totalSalaryPayments = action.payload.total || 0;
        state.currentPage = action.payload.page || 1;
        state.pageSize = action.payload.limit || 10;
        state.totalPages = action.payload.totalPages || 0;
      } else {
        // Fallback for non-paginated response
        state.salaryPayments = action.payload;
      }
    });
    builder.addCase(fetchSalaryPayments.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Salary Payment By ID
    builder.addCase(fetchSalaryPaymentById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSalaryPaymentById.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedSalaryPayment = action.payload;
    });
    builder.addCase(fetchSalaryPaymentById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create Salary Payment
    builder.addCase(createSalaryPayment.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createSalaryPayment.fulfilled, (state, action) => {
      state.loading = false;
      state.salaryPayments.push(action.payload);
    });
    builder.addCase(createSalaryPayment.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update Salary Payment Status
    builder.addCase(updateSalaryPaymentStatus.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateSalaryPaymentStatus.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.salaryPayments.findIndex((p: SalaryPayment) => p.id === action.payload.id);
      if (index !== -1) {
        state.salaryPayments[index] = action.payload;
      }

      if (state.selectedSalaryPayment?.id === action.payload.id) {
        state.selectedSalaryPayment = action.payload;
      }
    });
    builder.addCase(updateSalaryPaymentStatus.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Approve Salary Payment
    builder.addCase(approveSalaryPayment.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(approveSalaryPayment.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.salaryPayments.findIndex((p: SalaryPayment) => p.id === action.payload.id);
      if (index !== -1) {
        state.salaryPayments[index] = action.payload;
      }

      if (state.selectedSalaryPayment?.id === action.payload.id) {
        state.selectedSalaryPayment = action.payload;
      }
    });
    builder.addCase(approveSalaryPayment.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Bulk Salary Payment
    builder.addCase(createBulkSalaryPayment.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createBulkSalaryPayment.fulfilled, (state, action) => {
      state.loading = false;
      // Add the new salary payments to the state
      if (Array.isArray(action.payload)) {
        state.salaryPayments = [...state.salaryPayments, ...action.payload];
      }
    });
    builder.addCase(createBulkSalaryPayment.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  }
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
