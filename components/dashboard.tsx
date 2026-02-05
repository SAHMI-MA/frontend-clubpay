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
import { AlertsDashboardWidget } from "@/components/alerts/alerts-dashboard-widget"

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
              Connexion requise
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Veuillez vous connecter pour accéder au tableau de bord.
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
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
          {lastUpdated && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Dernière mise à jour : {new Date(lastUpdated).toLocaleString('fr-FR')}
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
          Actualiser
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenus totaux</CardTitle>
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
                  {metrics.revenueGrowth >= 0 ? '+' : ''}{metrics.revenueGrowth}% par rapport au mois dernier
                </p>
              </>
            ) : (
              <div className="text-2xl font-bold text-gray-400">--</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Joueurs actifs</CardTitle>
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
                  +{metrics.newPlayersThisWeek} nouveaux cette semaine
                </p>
              </>
            ) : (
              <div className="text-2xl font-bold text-gray-400">--</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Masse salariale payée</CardTitle>
            <Building2 className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            {loading.metrics ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : metrics ? (
              <>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.salaryMass}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">la somme des rémunérations</p>
              </>
            ) : (
              <div className="text-2xl font-bold text-gray-400">--</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Dépenses mensuelles</CardTitle>
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
                  {metrics.expensesGrowth >= 0 ? '+' : ''}{metrics.expensesGrowth}% par rapport au mois dernier
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
            <CardTitle className="text-gray-900 dark:text-white">Revenus vs Dépenses</CardTitle>
            <CardDescription>Vue financière mensuelle pour l'année en cours</CardDescription>
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
                  <Bar dataKey="revenue" fill="#1E3A8A" name="Revenus" />
                  <Bar dataKey="expenses" fill="#F97316" name="Dépenses" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                {error.financialData ? `Erreur : ${error.financialData}` : 'Aucune donnée financière disponible'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Répartition des équipes</CardTitle>
            <CardDescription>Répartition des équipes par catégorie</CardDescription>
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
                {error.teamDistribution ? `Erreur : ${error.teamDistribution}` : 'Aucune donnée de répartition disponible'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Upcoming Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Dashboard Widget */}
        <div className="lg:col-span-1">
          <AlertsDashboardWidget />
        </div>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Prochains matchs
            </CardTitle>
            <CardDescription>Prochains matchs prévus cette semaine</CardDescription>
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
                {upcomingMatches.map((match, index) => (
                  <div
                    key={`match-${match.id}-${match.dateTime}-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {match.homeTeam} vs {match.awayTeam}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(match.dateTime)} à {formatTime(match.dateTime)}
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
                      {match.status === 'scheduled' 
                        ? 'Prévu' 
                        : 'Terminé'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                {error.upcomingMatches ? `Erreur : ${error.upcomingMatches}` : 'Aucun match à venir programmé'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Alertes récentes
            </CardTitle>
            <CardDescription>Notifications et mises à jour importantes</CardDescription>
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
                {alerts.map((alert, index) => (
                  <div 
                    key={`alert-${alert.id}-${alert.createdAt}-${index}`}
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
                {error.alerts ? `Erreur : ${error.alerts}` : 'Aucune alerte récente'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      {quickStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Statistiques rapides</CardTitle>
            <CardDescription>Vue d'ensemble des indicateurs clés</CardDescription>
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
                    Matchs totaux
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {quickStats.matchesThisMonth}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Ce mois-ci
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {quickStats.totalStaff}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Staff total
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {quickStats.totalSuppliers}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Fournisseurs
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {quickStats.pendingPayments}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Paiements en attente
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {quickStats.activeContracts}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Contrats actifs
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
            <CardTitle className="text-gray-900 dark:text-white">Activité récente</CardTitle>
            <CardDescription>Dernières actions et mises à jour du système</CardDescription>
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
                {recentActivity.map((activity, index) => (
                  <div 
                    key={index}
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
