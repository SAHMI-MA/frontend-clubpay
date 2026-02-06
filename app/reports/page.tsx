'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import dayjs from 'dayjs';
import { reportsApi, type FinancialReport, type SalaryReport, type AcquisitionReport, type ComprehensiveReport } from '@/lib/api/reports';
import { formatCurrency } from '@/lib/pdf-utils';

type ReportType = 'financial' | 'salary' | 'acquisition' | 'comprehensive';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('financial');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  const [salaryReport, setSalaryReport] = useState<SalaryReport | null>(null);
  const [acquisitionReport, setAcquisitionReport] = useState<AcquisitionReport | null>(null);
  const [comprehensiveReport, setComprehensiveReport] = useState<ComprehensiveReport | null>(null);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const filter = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        category: category || undefined,
        status: status || undefined,
      };

      switch (reportType) {
        case 'financial':
          const finReport = await reportsApi.getFinancialReport(filter);
          setFinancialReport(finReport);
          break;
        case 'salary':
          const salReport = await reportsApi.getSalaryReport(filter);
          setSalaryReport(salReport);
          break;
        case 'acquisition':
          const acqReport = await reportsApi.getAcquisitionReport(filter);
          setAcquisitionReport(acqReport);
          break;
        case 'comprehensive':
          const compReport = await reportsApi.getComprehensiveReport(filter);
          setComprehensiveReport(compReport);
          break;
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export for all report types
    console.log('Export PDF feature coming soon');
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('DD/MM/YYYY');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Génération de Rapports</h1>
          <p className="text-muted-foreground">Générez des rapports détaillés pour n'importe quel module</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration du Rapport</CardTitle>
          <CardDescription>Sélectionnez le type de rapport et les filtres</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Type Selection */}
          <div className="space-y-2">
            <Label>Type de Rapport</Label>
            <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="financial">Rapport Financier</SelectItem>
                <SelectItem value="salary">Rapport des Salaires</SelectItem>
                <SelectItem value="acquisition">Rapport des Acquisitions</SelectItem>
                <SelectItem value="comprehensive">Rapport Complet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de Début</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Date de Fin</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Conditional Filters */}
          {reportType === 'financial' && (
            <div className="space-y-2">
              <Label>Catégorie (Optionnel)</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les catégories</SelectItem>
                  <SelectItem value="income">Revenus</SelectItem>
                  <SelectItem value="expense">Dépenses</SelectItem>
                  <SelectItem value="salary">Salaires</SelectItem>
                  <SelectItem value="transfer">Transferts</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="equipment">Équipement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {reportType === 'acquisition' && (
            <div className="space-y-2">
              <Label>Statut (Optionnel)</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvé</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleGenerateReport} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Générer le Rapport
                </>
              )}
            </Button>
            {((reportType === 'financial' && financialReport) ||
              (reportType === 'salary' && salaryReport) ||
              (reportType === 'acquisition' && acquisitionReport) ||
              (reportType === 'comprehensive' && comprehensiveReport)) && (
              <Button onClick={handleExportPDF} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exporter PDF
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Financial Report Display */}
      {financialReport && reportType === 'financial' && (
        <Card>
          <CardHeader>
            <CardTitle>Rapport Financier</CardTitle>
            <CardDescription>
              Période: {formatDate(financialReport.period.startDate)} - {formatDate(financialReport.period.endDate)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Revenus Totaux</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(financialReport.summary.totalIncome)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Dépenses Totales</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(financialReport.summary.totalExpenses)}
                      </p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Solde Net</p>
                      <p className={`text-2xl font-bold ${financialReport.summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(financialReport.summary.netBalance)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Breakdown */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Répartition par Catégorie</h3>
              <div className="space-y-3">
                {financialReport.summary.byCategory.map((cat) => (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{cat.category}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(cat.amount)} ({cat.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Salary Report Display */}
      {salaryReport && reportType === 'salary' && (
        <Card>
          <CardHeader>
            <CardTitle>Rapport des Salaires</CardTitle>
            <CardDescription>
              Période: {formatDate(salaryReport.period.startDate)} - {formatDate(salaryReport.period.endDate)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Payé</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(salaryReport.summary.totalPaid)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total En Attente</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(salaryReport.summary.totalPending)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre de Paiements</p>
                    <p className="text-2xl font-bold">{salaryReport.summary.paymentCount}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* By Type */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Par Type</h3>
              <div className="space-y-3">
                {salaryReport.byType.map((type) => (
                  <div key={type.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium capitalize">{type.type}</span>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(type.amount)}</p>
                      <p className="text-sm text-muted-foreground">{type.count} paiements</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Month */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Évolution Mensuelle</h3>
              <div className="space-y-2">
                {salaryReport.byMonth.map((month) => (
                  <div key={month.month} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{month.month}</span>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(month.totalAmount)}</p>
                      <p className="text-sm text-muted-foreground">
                        Club: {formatCurrency(month.clubAmount)} | HR: {formatCurrency(month.hrAmount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acquisition Report Display */}
      {acquisitionReport && reportType === 'acquisition' && (
        <Card>
          <CardHeader>
            <CardTitle>Rapport des Acquisitions</CardTitle>
            <CardDescription>
              Période: {formatDate(acquisitionReport.period.startDate)} - {formatDate(acquisitionReport.period.endDate)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Dépensé</p>
                    <p className="text-2xl font-bold">{formatCurrency(acquisitionReport.summary.totalSpent)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre d'Articles</p>
                    <p className="text-2xl font-bold">{acquisitionReport.summary.totalItems}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">En Attente</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(acquisitionReport.summary.pendingAmount)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Terminé</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(acquisitionReport.summary.completedAmount)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Suppliers */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Principaux Fournisseurs</h3>
              <div className="space-y-2">
                {acquisitionReport.topSuppliers.map((supplier, index) => (
                  <div key={supplier.supplier} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg text-muted-foreground">#{index + 1}</span>
                      <span className="font-medium">{supplier.supplier}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(supplier.totalAmount)}</p>
                      <p className="text-sm text-muted-foreground">{supplier.itemCount} articles</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Status */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Par Statut</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {acquisitionReport.byStatus.map((statusItem) => (
                  <Card key={statusItem.status}>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground capitalize">{statusItem.status}</p>
                      <p className="text-xl font-bold">{statusItem.count}</p>
                      <p className="text-sm">{formatCurrency(statusItem.totalAmount)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comprehensive Report Display */}
      {comprehensiveReport && reportType === 'comprehensive' && (
        <Card>
          <CardHeader>
            <CardTitle>Rapport Complet</CardTitle>
            <CardDescription>
              Période: {formatDate(comprehensiveReport.period.startDate)} - {formatDate(comprehensiveReport.period.endDate)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Summary */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Revenus</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(comprehensiveReport.summary.totalRevenue)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Dépenses</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(comprehensiveReport.summary.totalExpenses)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Salaires</p>
                  <p className="text-xl font-bold">{formatCurrency(comprehensiveReport.summary.totalSalaries)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Acquisitions</p>
                  <p className="text-xl font-bold">{formatCurrency(comprehensiveReport.summary.totalAcquisitions)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Solde Net</p>
                  <p className={`text-xl font-bold ${comprehensiveReport.summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(comprehensiveReport.summary.netBalance)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Module Reports Tabs */}
            <Tabs defaultValue="financial" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="financial">Financier</TabsTrigger>
                <TabsTrigger value="salary">Salaires</TabsTrigger>
                <TabsTrigger value="acquisition">Acquisitions</TabsTrigger>
              </TabsList>

              <TabsContent value="financial" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Revenus</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(comprehensiveReport.financialReport.summary.totalIncome)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Dépenses</p>
                      <p className="text-xl font-bold text-red-600">
                        {formatCurrency(comprehensiveReport.financialReport.summary.totalExpenses)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      <p className="text-xl font-bold">{comprehensiveReport.financialReport.summary.transactionCount}</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="salary" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Total Payé</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(comprehensiveReport.salaryReport.summary.totalPaid)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">En Attente</p>
                      <p className="text-xl font-bold text-orange-600">
                        {formatCurrency(comprehensiveReport.salaryReport.summary.totalPending)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Paiements</p>
                      <p className="text-xl font-bold">{comprehensiveReport.salaryReport.summary.paymentCount}</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="acquisition" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Total Dépensé</p>
                      <p className="text-xl font-bold">{formatCurrency(comprehensiveReport.acquisitionReport.summary.totalSpent)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Articles</p>
                      <p className="text-xl font-bold">{comprehensiveReport.acquisitionReport.summary.totalItems}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">En Attente</p>
                      <p className="text-xl font-bold text-orange-600">
                        {formatCurrency(comprehensiveReport.acquisitionReport.summary.pendingAmount)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
