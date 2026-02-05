"use client"

import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, RootState } from "@/lib/redux/store"
import { fetchAlertsSummary } from "@/lib/redux/alertsSlice"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, TrendingUp, Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/pdf-utils"

export function AlertsDashboardWidget() {
  const dispatch = useDispatch<AppDispatch>()
  const { summary, loading } = useSelector((state: RootState) => state.alerts)

  useEffect(() => {
    dispatch(fetchAlertsSummary())
    
    // Refresh every 5 minutes
    const interval = setInterval(() => {
      dispatch(fetchAlertsSummary())
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [dispatch])

  const totalAlerts = summary?.summary?.totalAlerts || 0

  return (
    <Card className="border-t-4 border-t-orange-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Alertes actives
            </CardTitle>
            <CardDescription>Vue d'ensemble des alertes en cours</CardDescription>
          </div>
          <Badge 
            variant={totalAlerts > 0 ? "destructive" : "secondary"}
            className="text-lg px-3 py-1"
          >
            {totalAlerts}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Late Payments Alert */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Paiements en retard
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatCurrency(summary?.latePayments?.totalAmount || 0)} en retard
                  </p>
                </div>
              </div>
              <Badge variant="destructive" className="text-sm">
                {summary?.latePayments?.count || 0}
              </Badge>
            </div>

            {/* Budget Alerts */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Alertes budgétaires
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {summary?.budgetAlerts?.exceededCount || 0} dépassé(s), {summary?.budgetAlerts?.warningCount || 0} avertissement(s)
                  </p>
                </div>
              </div>
              <Badge variant="default" className="bg-orange-600 text-white text-sm">
                {summary?.budgetAlerts?.count || 0}
              </Badge>
            </div>

            {/* Upcoming Payments */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Paiements à venir
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatCurrency(summary?.upcomingPayments?.totalAmount || 0)} sous 7 jours
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-sm">
                {summary?.upcomingPayments?.count || 0}
              </Badge>
            </div>

            {/* View All Button */}
            <Link href="/alerts">
              <Button 
                variant="outline" 
                className="w-full mt-2 text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                Voir toutes les alertes
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
