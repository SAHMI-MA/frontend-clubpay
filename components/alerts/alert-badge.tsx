"use client"

import { useEffect } from 'react';
import { AlertCircle, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchAlertsSummary } from '@/lib/redux/alertsSlice';
import { formatCurrency } from '@/lib/pdf-utils';
import Link from 'next/link';

export function AlertBadge() {
  const dispatch = useAppDispatch();
  const { summary, loading } = useAppSelector((state) => state.alerts);

  useEffect(() => {
    // Fetch alerts on mount
    dispatch(fetchAlertsSummary());

    // Refresh alerts every 5 minutes
    const interval = setInterval(() => {
      dispatch(fetchAlertsSummary());
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const totalAlerts = summary?.summary?.totalAlerts || 0;
  const hasAlerts = totalAlerts > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <AlertCircle className="h-5 w-5" />
          {hasAlerts && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalAlerts > 9 ? '9+' : totalAlerts}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Alertes</h3>
            {hasAlerts && (
              <Badge variant="secondary">{totalAlerts} alerte{totalAlerts > 1 ? 's' : ''}</Badge>
            )}
          </div>

          <Separator />

          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Chargement des alertes...
            </div>
          ) : !hasAlerts ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aucune alerte pour le moment
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto space-y-4">
              {/* Late Payments */}
              {summary?.latePayments && summary.latePayments.count > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Paiements en retard ({summary.latePayments.count})</span>
                  </div>
                  {summary.latePayments.items.slice(0, 3).map((payment) => (
                      <Link
                        key={payment.id}
                        href={`/club-salary-payments`}
                        className="block p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{payment.recipientName}</p>
                            <p className="text-xs text-muted-foreground">
                            {payment.recipientType === 'player' 
                              ? 'Joueur' 
                              : payment.recipientType === 'employee'
                              ? 'Employé'
                              : 'Staff'}
                            {payment.teamName && ` • ${payment.teamName}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-red-600">
                              {formatCurrency(payment.amount)}
                            </p>
                            <p className="text-xs text-red-500">
                              {payment.daysLate} jour{payment.daysLate > 1 ? 's' : ''} de retard
                            </p>
                          </div>
                        </div>
                    </Link>
                  ))}
                  {summary.latePayments.count > 3 && (
                    <Link href="/alerts?tab=late-payments">
                      <Button variant="link" size="sm" className="w-full text-red-600">
                        Voir tout ({summary.latePayments.count})
                      </Button>
                    </Link>
                  )}
                </div>
              )}

              {/* Budget Alerts */}
              {summary?.budgetAlerts && summary.budgetAlerts.count > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>Alertes budget ({summary.budgetAlerts.count})</span>
                  </div>
                  {summary.budgetAlerts.items.slice(0, 3).map((alert) => (
                    <Link
                      key={alert.teamId}
                      href={`/teams/${alert.teamId}`}
                      className={`block p-3 rounded-lg transition-colors ${
                        alert.status === 'EXCEEDED'
                          ? 'bg-red-50 hover:bg-red-100'
                          : 'bg-orange-50 hover:bg-orange-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{alert.teamName}</p>
                          <p className="text-xs text-muted-foreground">
                            {alert.usagePercentage.toFixed(1)}% du budget utilisé
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={alert.status === 'EXCEEDED' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {alert.status === 'EXCEEDED' ? 'Dépassé' : 'Alerte'}
                          </Badge>
                          {alert.overspendAmount && (
                            <p className="text-xs text-red-500 mt-1">
                              +{formatCurrency(alert.overspendAmount)}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                  {summary.budgetAlerts.count > 3 && (
                    <Link href="/alerts?tab=budget">
                      <Button variant="link" size="sm" className="w-full text-orange-600">
                        Voir tout ({summary.budgetAlerts.count})
                      </Button>
                    </Link>
                  )}
                </div>
              )}

              {/* Upcoming Payments */}
              {summary?.upcomingPayments && summary.upcomingPayments.count > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                    <Clock className="h-4 w-4" />
                    <span>Paiements à venir ({summary.upcomingPayments.count})</span>
                  </div>
                  {summary.upcomingPayments.items.slice(0, 3).map((payment) => (
                    <div
                      key={payment.id}
                      className="p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{payment.recipientName}</p>
                          <p className="text-xs text-muted-foreground">
                            Dans {payment.daysUntilDue} jour{payment.daysUntilDue > 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-blue-600">
                            {formatCurrency(payment.amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {summary.upcomingPayments.count > 3 && (
                    <Link href="/alerts?tab=upcoming">
                      <Button variant="link" size="sm" className="w-full text-blue-600">
                        Voir tout ({summary.upcomingPayments.count})
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          <Separator />

          <Link href="/alerts">
            <Button variant="outline" size="sm" className="w-full">
              Voir toutes les alertes
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
