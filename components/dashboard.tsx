"use client"

import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, RootState } from "@/lib/redux/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Building2, CreditCard, DollarSign, TrendingUp, Users, Calendar, Trophy, AlertCircle, RefreshCw } from "lucide-react"
import { 
  fetchAllDashboardData, 
  markAlertAsRead 
} from "@/lib/redux/dashboardSlice"
import { useTranslation } from 'react-i18next';

export function Dashboard() {
  const dispatch = useDispatch<AppDispatch>()
  const authState = useSelector((state: RootState) => state.auth)
  const { 
    metrics, 
    financialData, 
    teamDistribution, 
    upcomingMatches, 
    alerts, 
    recentActivity, 
    quickStats, 
    loading, 
    error,
    lastUpdated 
  } = useSelector((state: RootState) => state.dashboard)
  
  const { t } = useTranslation();

  useEffect(() => {
    if (authState.isAuthenticated && authState.token) {
      dispatch(fetchAllDashboardData({}))
    }
  }, [dispatch, authState.isAuthenticated, authState.token])

  const handleRefreshData = () => {
    if (authState.isAuthenticated && authState.token) {
      dispatch(fetchAllDashboardData({}))
    }
  }

  // Show authentication error if not logged in
  if (!authState.isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="p-6">
          <CardContent className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('auth.loginRequired', 'Authentication Required')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('auth.pleaseLoginDashboard', 'Please log in to view the dashboard.')}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleMarkAlertAsRead = (alertId: number) => {
    dispatch(markAlertAsRead(alertId))
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'contract':
        return <Trophy className="h-4 w-4 mt-0.5" />
      case 'payment':
        return <CreditCard className="h-4 w-4 mt-0.5" />
      case 'registration':
        return <Users className="h-4 w-4 mt-0.5" />
      default:
        return <AlertCircle className="h-4 w-4 mt-0.5" />
    }
  }

  const getAlertColorClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-500'
      case 'medium':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-500 text-orange-500'
      case 'low':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-500'
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-500 text-gray-500'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard.title', 'Dashboard')}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('dashboard.welcomeMessage', `Welcome back! Here's what's happening with your association.`)}
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {t('dashboard.lastUpdated', { date: new Date(lastUpdated).toLocaleString(), defaultValue: 'Last updated: {{date}}' })}
            </p>
          )}
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefreshData}
          disabled={Object.values(loading).some(Boolean)}
          className="text-blue-800 border-blue-800 hover:bg-blue-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${Object.values(loading).some(Boolean) ? 'animate-spin' : ''}`} />
          {t('common.refresh', 'Refresh')}
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.totalRevenue', 'Total Revenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-800" />
          </CardHeader>
          <CardContent>
            {loading.metrics ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : metrics ? (
              <>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(metrics.totalRevenue)}
                </div>
                <p className={`text-xs flex items-center mt-1 ${metrics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendingUp className={`h-3 w-3 mr-1 ${metrics.revenueGrowth < 0 ? 'rotate-180' : ''}`} />
                  {metrics.revenueGrowth >= 0 ? '+' : ''}{metrics.revenueGrowth}% {t('dashboard.fromLastMonth', 'from last month')}
                </p>
              </>
            ) : (
              <div className="text-2xl font-bold text-gray-400">--</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.activePlayers', 'Active Players')}</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {loading.metrics ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : metrics ? (
              <>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.activePlayersCount}
                </div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{metrics.newPlayersThisWeek} {t('dashboard.newThisWeek', 'new this week')}
                </p>
              </>
            ) : (
              <div className="text-2xl font-bold text-gray-400">--</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.totalTeams', 'Total Teams')}</CardTitle>
            <Building2 className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            {loading.metrics ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : metrics ? (
              <>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.totalTeamsCount}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('dashboard.acrossAllDivisions', 'Across all divisions')}</p>
              </>
            ) : (
              <div className="text-2xl font-bold text-gray-400">--</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.monthlyExpenses', 'Monthly Expenses')}</CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading.metrics ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : metrics ? (
              <>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(metrics.monthlyExpenses)}
                </div>
                <p className={`text-xs flex items-center mt-1 ${metrics.expensesGrowth <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendingUp className={`h-3 w-3 mr-1 ${metrics.expensesGrowth > 0 ? 'rotate-180' : ''}`} />
                  {metrics.expensesGrowth >= 0 ? '+' : ''}{metrics.expensesGrowth}% {t('dashboard.fromLastMonth', 'from last month')}
                </p>
              </>
            ) : (
              <div className="text-2xl font-bold text-gray-400">--</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">{t('dashboard.revenueVsExpenses', 'Revenue vs Expenses')}</CardTitle>
            <CardDescription>{t('dashboard.monthlyFinancialOverview', 'Monthly financial overview for the current year')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading.financialData ? (
              <Skeleton className="h-[300px] w-full" />
            ) : financialData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={financialData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="revenue" fill="#1E3A8A" name="Revenue" />
                  <Bar dataKey="expenses" fill="#F97316" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                {error.financialData ? `Error: ${error.financialData}` : t('dashboard.noFinancialDataAvailable', 'No financial data available')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">{t('dashboard.teamDistribution', 'Team Distribution')}</CardTitle>
            <CardDescription>{t('dashboard.teamBreakdown', 'Breakdown of teams by category')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading.teamDistribution ? (
              <Skeleton className="h-[300px] w-full" />
            ) : teamDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={teamDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, count }) => `${category}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {teamDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                {error.teamDistribution ? `Error: ${error.teamDistribution}` : t('dashboard.noTeamDistributionDataAvailable', 'No team distribution data available')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Upcoming Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('dashboard.upcomingMatches', 'Upcoming Matches')}
            </CardTitle>
            <CardDescription>{t('dashboard.nextScheduledGames', 'Next scheduled games this week')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading.upcomingMatches ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : upcomingMatches.length > 0 ? (
              <div className="space-y-4">
                {upcomingMatches.map((match) => (
                  <div
                    key={`match-${match.id}-${match.dateTime}`}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {match.homeTeam} vs {match.awayTeam}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(match.dateTime)} at {formatTime(match.dateTime)}
                      </p>
                      {match.venue && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {match.venue}
                        </p>
                      )}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        match.status === 'scheduled' 
                          ? 'bg-blue-50 text-blue-800 border-blue-200' 
                          : 'bg-green-50 text-green-800 border-green-200'
                      }
                    >
                      {match.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                {error.upcomingMatches ? `Error: ${error.upcomingMatches}` : t('dashboard.noUpcomingMatchesScheduled', 'No upcoming matches scheduled')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {t('dashboard.recentAlerts', 'Recent Alerts')}
            </CardTitle>
            <CardDescription>{t('dashboard.importantNotifications', 'Important notifications and updates')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading.alerts ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div 
                    key={`alert-${alert.id}-${alert.createdAt}`}
                    className={`flex items-start gap-3 p-3 rounded-lg border-l-4 cursor-pointer transition-opacity ${
                      alert.isRead ? 'opacity-60' : ''
                    } ${getAlertColorClass(alert.priority)}`}
                    onClick={() => handleMarkAlertAsRead(alert.id)}
                  >
                    <div className={getAlertColorClass(alert.priority)}>
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {alert.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {alert.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {formatDate(alert.createdAt)}
                      </p>
                    </div>
                    {!alert.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                {error.alerts ? `Error: ${error.alerts}` : t('dashboard.noRecentAlerts', 'No recent alerts')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      {quickStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">{t('dashboard.quickStatistics', 'Quick Statistics')}</CardTitle>
            <CardDescription>{t('dashboard.keyOperationalMetrics', 'Overview of key operational metrics')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading.quickStats ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {quickStats.totalMatches}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {t('dashboard.totalMatches', 'Total Matches')}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {quickStats.matchesThisMonth}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {t('dashboard.thisMonth', 'This Month')}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {quickStats.totalStaff}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {t('dashboard.totalStaff', 'Total Staff')}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {quickStats.totalSuppliers}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {t('dashboard.suppliers', 'Suppliers')}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {quickStats.pendingPayments}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {t('dashboard.pendingPayments', 'Pending Payments')}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {quickStats.activeContracts}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {t('dashboard.activeContracts', 'Active Contracts')}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">{t('dashboard.recentActivity', 'Recent Activity')}</CardTitle>
            <CardDescription>{t('dashboard.latestActions', 'Latest actions and updates in the system')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading.recentActivity ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div 
                    key={activity.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.action}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {activity.description}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {formatDate(activity.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
