import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { alertsApi } from '@/lib/api/alerts';
import type {
  AlertsSummary,
  LatePaymentInfo,
  BudgetAlert,
  UpcomingPayment,
} from '@/lib/types/alerts';

interface AlertsState {
  summary: AlertsSummary | null;
  latePayments: LatePaymentInfo[];
  budgetAlerts: BudgetAlert[];
  upcomingPayments: UpcomingPayment[];
  loading: boolean;
  error: string | null;
  lastFetched: string | null;
}

const initialState: AlertsState = {
  summary: null,
  latePayments: [],
  budgetAlerts: [],
  upcomingPayments: [],
  loading: false,
  error: null,
  lastFetched: null,
};

// Async thunks
export const fetchAlertsSummary = createAsyncThunk(
  'alerts/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const data = await alertsApi.getSummary();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch alerts summary');
    }
  }
);

export const fetchLatePayments = createAsyncThunk(
  'alerts/fetchLatePayments',
  async (_, { rejectWithValue }) => {
    try {
      const data = await alertsApi.getLatePayments();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch late payments');
    }
  }
);

export const fetchBudgetAlerts = createAsyncThunk(
  'alerts/fetchBudgetAlerts',
  async (_, { rejectWithValue }) => {
    try {
      const data = await alertsApi.getBudgetAlerts();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch budget alerts');
    }
  }
);

export const fetchUpcomingPayments = createAsyncThunk(
  'alerts/fetchUpcomingPayments',
  async (days: number = 7, { rejectWithValue }) => {
    try {
      const data = await alertsApi.getUpcomingPayments(days);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch upcoming payments');
    }
  }
);

export const triggerLatePaymentCheck = createAsyncThunk(
  'alerts/triggerLatePaymentCheck',
  async (_, { rejectWithValue }) => {
    try {
      const data = await alertsApi.checkLatePayments();
      return data.latePayments;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check late payments');
    }
  }
);

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    clearAlerts: (state) => {
      state.summary = null;
      state.latePayments = [];
      state.budgetAlerts = [];
      state.upcomingPayments = [];
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Alerts Summary
    builder.addCase(fetchAlertsSummary.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAlertsSummary.fulfilled, (state, action: PayloadAction<AlertsSummary>) => {
      state.loading = false;
      state.summary = action.payload;
      state.latePayments = action.payload.latePayments.items;
      state.budgetAlerts = action.payload.budgetAlerts.items;
      state.upcomingPayments = action.payload.upcomingPayments.items;
      state.lastFetched = new Date().toISOString();
    });
    builder.addCase(fetchAlertsSummary.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Late Payments
    builder.addCase(fetchLatePayments.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchLatePayments.fulfilled, (state, action: PayloadAction<LatePaymentInfo[]>) => {
      state.loading = false;
      state.latePayments = action.payload;
    });
    builder.addCase(fetchLatePayments.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Budget Alerts
    builder.addCase(fetchBudgetAlerts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBudgetAlerts.fulfilled, (state, action: PayloadAction<BudgetAlert[]>) => {
      state.loading = false;
      state.budgetAlerts = action.payload;
    });
    builder.addCase(fetchBudgetAlerts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Upcoming Payments
    builder.addCase(fetchUpcomingPayments.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUpcomingPayments.fulfilled, (state, action: PayloadAction<UpcomingPayment[]>) => {
      state.loading = false;
      state.upcomingPayments = action.payload;
    });
    builder.addCase(fetchUpcomingPayments.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Trigger Late Payment Check
    builder.addCase(triggerLatePaymentCheck.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(triggerLatePaymentCheck.fulfilled, (state, action: PayloadAction<LatePaymentInfo[]>) => {
      state.loading = false;
      state.latePayments = action.payload;
    });
    builder.addCase(triggerLatePaymentCheck.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearAlerts, clearError } = alertsSlice.actions;
export default alertsSlice.reducer;
