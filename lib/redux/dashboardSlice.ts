import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { tokenUtils } from '@/lib/api'
import { getApiUrl } from '@/lib/api-config'

// Dashboard Types
export interface DashboardMetrics {
  totalRevenue: number
  revenueGrowth: number
  activePlayersCount: number
  newPlayersThisWeek: number
  totalTeamsCount: number
  monthlyExpenses: number
  expensesGrowth: number
}

export interface FinancialData {
  month: string
  revenue: number
  expenses: number
}

export interface TeamDistribution {
  category: string
  count: number
  color: string
}

export interface UpcomingMatch {
  id: number
  homeTeam: string
  awayTeam: string
  dateTime: string
  venue: string
  status: string
}

export interface Alert {
  id: number
  type: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  isRead: boolean
  actionUrl?: string
}

export interface RecentActivity {
  id: number
  action: string
  description: string
  timestamp: string
  entityId: number
  entityType: string
}

export interface QuickStats {
  totalMatches: number
  matchesThisMonth: number
  totalStaff: number
  totalSuppliers: number
  pendingPayments: number
  activeContracts: number
}

export interface DashboardState {
  metrics: DashboardMetrics | null
  financialData: FinancialData[]
  teamDistribution: TeamDistribution[]
  upcomingMatches: UpcomingMatch[]
  alerts: Alert[]
  recentActivity: RecentActivity[]
  quickStats: QuickStats | null
  loading: {
    metrics: boolean
    financialData: boolean
    teamDistribution: boolean
    upcomingMatches: boolean
    alerts: boolean
    recentActivity: boolean
    quickStats: boolean
  }
  error: {
    metrics: string | null
    financialData: string | null
    teamDistribution: string | null
    upcomingMatches: string | null
    alerts: string | null
    recentActivity: string | null
    quickStats: string | null
  }
  lastUpdated: string | null
}

const initialState: DashboardState = {
  metrics: null,
  financialData: [],
  teamDistribution: [],
  upcomingMatches: [],
  alerts: [],
  recentActivity: [],
  quickStats: null,
  loading: {
    metrics: false,
    financialData: false,
    teamDistribution: false,
    upcomingMatches: false,
    alerts: false,
    recentActivity: false,
    quickStats: false,
  },
  error: {
    metrics: null,
    financialData: null,
    teamDistribution: null,
    upcomingMatches: null,
    alerts: null,
    recentActivity: null,
    quickStats: null,
  },
  lastUpdated: null,
}

// Helper function to make authenticated API calls
const makeAuthenticatedRequest = async (url: string): Promise<Response> => {
  const token = tokenUtils.getAuthToken()
  
  if (!token) {
    throw new Error('No authentication token available')
  }
  
  try {
    console.log(`🔄 Making authenticated request to: ${url}`)
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        console.error(`🔒 Authentication failed for request to ${url}`)
        throw new Error('Authentication failed. Please login again.')
      }
      console.error(`❌ API request failed for ${url}: ${response.status} ${response.statusText}`)
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    
    console.log(`✅ Request to ${url} successful`)
    return response
  } catch (error) {
    console.error(`❌ Error making request to ${url}:`, error)
    throw error
  }
}

// Async Thunks
export const fetchDashboardMetrics = createAsyncThunk(
  'dashboard/fetchMetrics',
  async (teamId: number | undefined, { rejectWithValue }) => {
    try {
      const url = teamId 
        ? getApiUrl(`/dashboard/metrics?teamId=${teamId}`)
        : getApiUrl('/dashboard/metrics')
      
      const response = await makeAuthenticatedRequest(url)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch dashboard metrics')
    }
  }
)

export const fetchFinancialOverview = createAsyncThunk(
  'dashboard/fetchFinancialOverview',
  async (params: { period?: 'yearly' | 'monthly'; startDate?: string; endDate?: string } | undefined, { rejectWithValue }) => {
    try {
      const searchParams = new URLSearchParams()
      
      if (params?.period) searchParams.append('period', params.period)
      if (params?.startDate) searchParams.append('startDate', params.startDate)
      if (params?.endDate) searchParams.append('endDate', params.endDate)
      
      const url = getApiUrl(`/dashboard/financial-overview${searchParams.toString() ? `?${searchParams.toString()}` : ''}`)
      
      const response = await makeAuthenticatedRequest(url)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch financial overview')
    }
  }
)

export const fetchTeamDistribution = createAsyncThunk(
  'dashboard/fetchTeamDistribution',
  async (_, { rejectWithValue }) => {
    try {
      const response = await makeAuthenticatedRequest(getApiUrl('/dashboard/team-distribution'))
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch team distribution')
    }
  }
)

export const fetchUpcomingMatches = createAsyncThunk(
  'dashboard/fetchUpcomingMatches',
  async (params: { limit?: number; days?: number } | undefined, { rejectWithValue }) => {
    try {
      const searchParams = new URLSearchParams()
      
      if (params?.limit) searchParams.append('limit', params.limit.toString())
      if (params?.days) searchParams.append('days', params.days.toString())
      
      const url = getApiUrl(`/dashboard/upcoming-matches${searchParams.toString() ? `?${searchParams.toString()}` : ''}`)
      
      const response = await makeAuthenticatedRequest(url)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch upcoming matches')
    }
  }
)

export const fetchAlerts = createAsyncThunk(
  'dashboard/fetchAlerts',
  async (limit: number | undefined, { rejectWithValue }) => {
    try {
      const url = limit 
        ? getApiUrl(`/dashboard/alerts?limit=${limit}`)
        : getApiUrl('/dashboard/alerts')
      
      const response = await makeAuthenticatedRequest(url)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch alerts')
    }
  }
)

export const fetchRecentActivity = createAsyncThunk(
  'dashboard/fetchRecentActivity',
  async (limit: number | undefined, { rejectWithValue }) => {
    try {
      const url = limit 
        ? getApiUrl(`/dashboard/recent-activity?limit=${limit}`)
        : getApiUrl('/dashboard/recent-activity')
      
      const response = await makeAuthenticatedRequest(url)
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch recent activity')
    }
  }
)

export const fetchQuickStats = createAsyncThunk(
  'dashboard/fetchQuickStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await makeAuthenticatedRequest(getApiUrl('/dashboard/quick-stats'))
      return await response.json()
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch quick stats')
    }
  }
)

// Combined fetch all dashboard data
export const fetchAllDashboardData = createAsyncThunk(
  'dashboard/fetchAllData',
  async (params: { teamId?: number } = {}, { dispatch }) => {
    const { teamId } = params
    await Promise.all([
      dispatch(fetchDashboardMetrics(teamId)),
      dispatch(fetchFinancialOverview()),
      dispatch(fetchTeamDistribution()),
      dispatch(fetchUpcomingMatches({ limit: 5, days: 7 })),
      dispatch(fetchAlerts(5)),
      dispatch(fetchRecentActivity(10)),
      dispatch(fetchQuickStats()),
    ])
  }
)

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardData: (state) => {
      state.metrics = null
      state.financialData = []
      state.teamDistribution = []
      state.upcomingMatches = []
      state.alerts = []
      state.recentActivity = []
      state.quickStats = null
      state.lastUpdated = null
    },
    markAlertAsRead: (state, action) => {
      const alertId = action.payload
      const alert = state.alerts.find(a => a.id === alertId)
      if (alert) {
        alert.isRead = true
      }
    },
  },
  extraReducers: (builder) => {
    // Dashboard Metrics
    builder
      .addCase(fetchDashboardMetrics.pending, (state) => {
        state.loading.metrics = true
        state.error.metrics = null
      })
      .addCase(fetchDashboardMetrics.fulfilled, (state, action) => {
        state.loading.metrics = false
        state.metrics = action.payload
        state.lastUpdated = new Date().toISOString()
      })
      .addCase(fetchDashboardMetrics.rejected, (state, action) => {
        state.loading.metrics = false
        state.error.metrics = action.error.message || 'Failed to fetch metrics'
      })

    // Financial Overview
    builder
      .addCase(fetchFinancialOverview.pending, (state) => {
        state.loading.financialData = true
        state.error.financialData = null
      })
      .addCase(fetchFinancialOverview.fulfilled, (state, action) => {
        state.loading.financialData = false
        state.financialData = action.payload
      })
      .addCase(fetchFinancialOverview.rejected, (state, action) => {
        state.loading.financialData = false
        state.error.financialData = action.error.message || 'Failed to fetch financial data'
      })

    // Team Distribution
    builder
      .addCase(fetchTeamDistribution.pending, (state) => {
        state.loading.teamDistribution = true
        state.error.teamDistribution = null
      })
      .addCase(fetchTeamDistribution.fulfilled, (state, action) => {
        state.loading.teamDistribution = false
        state.teamDistribution = action.payload
      })
      .addCase(fetchTeamDistribution.rejected, (state, action) => {
        state.loading.teamDistribution = false
        state.error.teamDistribution = action.error.message || 'Failed to fetch team distribution'
      })

    // Upcoming Matches
    builder
      .addCase(fetchUpcomingMatches.pending, (state) => {
        state.loading.upcomingMatches = true
        state.error.upcomingMatches = null
      })
      .addCase(fetchUpcomingMatches.fulfilled, (state, action) => {
        state.loading.upcomingMatches = false
        state.upcomingMatches = action.payload
      })
      .addCase(fetchUpcomingMatches.rejected, (state, action) => {
        state.loading.upcomingMatches = false
        state.error.upcomingMatches = action.error.message || 'Failed to fetch upcoming matches'
      })

    // Alerts
    builder
      .addCase(fetchAlerts.pending, (state) => {
        state.loading.alerts = true
        state.error.alerts = null
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.loading.alerts = false
        state.alerts = action.payload
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading.alerts = false
        state.error.alerts = action.error.message || 'Failed to fetch alerts'
      })

    // Recent Activity
    builder
      .addCase(fetchRecentActivity.pending, (state) => {
        state.loading.recentActivity = true
        state.error.recentActivity = null
      })
      .addCase(fetchRecentActivity.fulfilled, (state, action) => {
        state.loading.recentActivity = false
        state.recentActivity = action.payload
      })
      .addCase(fetchRecentActivity.rejected, (state, action) => {
        state.loading.recentActivity = false
        state.error.recentActivity = action.error.message || 'Failed to fetch recent activity'
      })

    // Quick Stats
    builder
      .addCase(fetchQuickStats.pending, (state) => {
        state.loading.quickStats = true
        state.error.quickStats = null
      })
      .addCase(fetchQuickStats.fulfilled, (state, action) => {
        state.loading.quickStats = false
        state.quickStats = action.payload
      })
      .addCase(fetchQuickStats.rejected, (state, action) => {
        state.loading.quickStats = false
        state.error.quickStats = action.error.message || 'Failed to fetch quick stats'
      })
  },
})

export const { clearDashboardData, markAlertAsRead } = dashboardSlice.actions
export default dashboardSlice.reducer
