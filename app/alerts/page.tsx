"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, RootState } from "@/lib/redux/store"
import { fetchAlertsSummary, fetchLatePayments, fetchBudgetAlerts, fetchUpcomingPayments } from "@/lib/redux/alertsSlice"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, AlertTriangle, Calendar, DollarSign, TrendingUp, Users } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/pdf-utils"

export default function AlertsPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { summary, latePayments, budgetAlerts, upcomingPayments, loading } = useSelector(
    (state: RootState) => state.alerts
  )

  const [activeTab, setActiveTab] = useState("summary")

  useEffect(() => {
    dispatch(fetchAlertsSummary())
    dispatch(fetchLatePayments())
    dispatch(fetchBudgetAlerts())
    dispatch(fetchUpcomingPayments(7)) // 7 days
  }, [dispatch])

  const totalAlerts = (summary?.summary?.totalAlerts || 0)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Centre d'alertes
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gérez toutes les alertes importantes de votre club
          </p>
        </div>
        <Badge variant={totalAlerts > 0 ? "destructive" : "secondary"} className="text-lg px-4 py-2">
          {totalAlerts} {totalAlerts > 1 ? "alertes" : "alerte"}
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-red-700 dark:text-red-400">
                Paiements en retard
              </CardTitle>
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-800 dark:text-red-300">
              {summary?.latePayments?.count || 0}
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {formatCurrency(summary?.latePayments?.totalAmount || 0)} en retard
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-orange-700 dark:text-orange-400">
                Dépassements budget
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-800 dark:text-orange-300">
              {summary?.budgetAlerts?.count || 0}
            </div>
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
              {summary?.budgetAlerts?.exceededCount || 0} dépassé(s), {summary?.budgetAlerts?.warningCount || 0} avertissement(s)
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                Paiements à venir
              </CardTitle>
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800 dark:text-blue-300">
              {summary?.upcomingPayments?.count || 0}
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              {formatCurrency(summary?.upcomingPayments?.totalAmount || 0)} sous 7 jours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs with Details */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="late-payments" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Retards ({latePayments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="budget-alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Budgets ({budgetAlerts?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            À venir ({upcomingPayments?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Late Payments Tab */}
        <TabsContent value="late-payments" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : latePayments && latePayments.length > 0 ? (
            latePayments.map((payment, index) => (
              <Card key={index} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-gray-600" />
                      {payment.employeeName || payment.recipientName}
                    </CardTitle>
                    <CardDescription>
                      {payment.month && payment.year 
                        ? `Période: ${payment.month}/${payment.year}`
                        : `Période: ${new Date(payment.periodStart).toLocaleDateString('fr-FR')} - ${new Date(payment.periodEnd).toLocaleDateString('fr-FR')}`
                      }
                      </CardDescription>
                    </div>
                    <Badge variant="destructive">
                      {payment.daysLate} jour{payment.daysLate > 1 ? 's' : ''} de retard
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Montant</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date prévue</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(payment.paymentDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Équipe</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {payment.teamName}
                      </p>
                    </div>
                    <div>
                      <Link href="/club-salary-payments">
                        <Button variant="outline" size="sm" className="w-full">
                          Voir le paiement
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-gray-500">
                <DollarSign className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-lg font-medium">Aucun paiement en retard</p>
                <p className="text-sm mt-1">Tous les paiements sont à jour</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Budget Alerts Tab */}
        <TabsContent value="budget-alerts" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : budgetAlerts && budgetAlerts.length > 0 ? (
            budgetAlerts.map((alert, index) => (
              <Card 
                key={index} 
                className={`border-l-4 ${
                  alert.status === 'EXCEEDED' 
                    ? 'border-l-red-500' 
                    : 'border-l-orange-500'
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-gray-600" />
                        {alert.teamName}
                      </CardTitle>
                      <CardDescription>
                        Budget annuel: {formatCurrency(alert.budget)}
                      </CardDescription>
                    </div>
                    <Badge variant={alert.status === 'EXCEEDED' ? 'destructive' : 'default'}>
                      {alert.status === 'EXCEEDED' ? 'Dépassé' : 'Avertissement'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Montant utilisé</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(alert.currentSpending)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Montant restant</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(alert.budget - alert.currentSpending)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Utilisation</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {alert.usagePercentage.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <Link href={`/teams/${alert.teamId}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            Voir l'équipe
                          </Button>
                        </Link>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            alert.status === 'EXCEEDED' 
                              ? 'bg-red-500' 
                              : 'bg-orange-500'
                          }`}
                          style={{ width: `${Math.min(alert.usagePercentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {alert.status === 'EXCEEDED' 
                          ? `Dépassement de ${formatCurrency(Math.abs(alert.budget - alert.currentSpending))}`
                          : `Attention: ${(100 - alert.usagePercentage).toFixed(1)}% restant`
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-gray-500">
                <TrendingUp className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-lg font-medium">Aucune alerte budgétaire</p>
                <p className="text-sm mt-1">Tous les budgets sont sous contrôle</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Upcoming Payments Tab */}
        <TabsContent value="upcoming" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : upcomingPayments && upcomingPayments.length > 0 ? (
            upcomingPayments.map((payment, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-gray-600" />
                        {payment.employeeName}
                      </CardTitle>
                      <CardDescription>
                        Période: {payment.month}/{payment.year}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Dans {payment.daysUntilDue} jour{payment.daysUntilDue > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Montant</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date prévue</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(payment.paymentDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        {payment.recipientType === 'employee' ? 'Département' : 'Équipe'}
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {payment.teamName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Link href={payment.recipientType === 'employee' ? '/salary-payments' : '/club-salary-payments'}>
                        <Button variant="outline" size="sm" className="w-full">
                          Voir le paiement
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-gray-500">
                <Calendar className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-lg font-medium">Aucun paiement à venir</p>
                <p className="text-sm mt-1">Aucun paiement prévu dans les 7 prochains jours</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
