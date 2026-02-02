"use client"

import { useState, useEffect, useCallback } from "react"
import { Alert } from "@/components/ui/alert"
import { Loader2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authUtils } from "@/lib/redux/auth-utils"
import { getApiUrl } from "@/lib/api-config"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, Plus, Search, Filter, Eye, CheckCircle, XCircle, Clock, Trash2, Users } from "lucide-react"
import {
  listSalaryPayments,
  createSalaryPayment,
  deleteSalaryPayment,
  type SalaryPayment as ApiSalaryPayment,
  type CreateSalaryPaymentBody,
  approveOrRejectSalaryPayment,
} from "@/lib/api/hr-salary-api"
import type { Department } from "@/lib/api/hr-api"
import { generateEmployeeSalaryPDF } from "@/lib/jsPDF/EmployeeSalaryPDF"
import { formatDate } from "@/lib/utils/date-utils"

/**
 * Export a list of salary payments to CSV
 * @param payments Array of SalaryPayment objects
 */
export function exportSalaryPaymentsToCSV(payments: ApiSalaryPayment[]) {
  const header = [
    "ID",
    "Employee ID",
    "Period",
    "Base Salary (MAD)",
    "Bonuses (MAD)",
    "Amount (MAD)",
    "Status",
    "Payment Date",
  ]
  const rows = payments.map((payment) => [
    payment.id,
    payment.employee?.employeeId || "",
    `${payment.periodStart} - ${payment.periodEnd}`,
    payment.baseSalary || 0,
    payment.bonuses || 0,
    payment.amount || 0,
    payment.status,
    payment.paymentDate || "",
  ])
  const csvContent = [header, ...rows]
    .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
    .join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", "salary-payments.csv")
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

interface Employee {
  employeeId: string
  name: string
  position: {
    id: number
    title: string
    level?: string
  } | null
  baseSalary: number
  taxRate: number
  benefits: number
  bankAccount: string
}

export function SalaryPaymentManagement() {
  const [payments, setPayments] = useState<ApiSalaryPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [startDateFilter, setStartDateFilter] = useState("")
  const [endDateFilter, setEndDateFilter] = useState("")
  const [selectedPayment, setSelectedPayment] = useState<ApiSalaryPayment | null>(null)
  const [showNewPaymentDialog, setShowNewPaymentDialog] = useState(false)
  const [showBulkPaymentDialog] = useState<boolean>(false)
  const [newPayment, setNewPayment] = useState({
    employeeId: "",
    payPeriod: null as Date | null,
    baseSalary: 0,
    overtime: 0,
    bonuses: 0,
    deductions: 0,
    paymentMethod: "Bank Transfer",
    amount: 0,
    paymentDate: null as Date | null,
    bankAccountId: undefined as number | undefined,
  })
  const [departmentsList, setDepartmentsList] = useState<Department[]>([])
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; payment: ApiSalaryPayment | null }>({
    open: false,
    payment: null,
  })

  // current user from auth-utils
  const currentUser = authUtils.getUser()

  const [employees, setEmployees] = useState<Employee[]>([])
  const [loadingPaymentPeriod, setLoadingPaymentPeriod] = useState(false)
  const [duplicatePaymentWarning, setDuplicatePaymentWarning] = useState<string | null>(null)
  useEffect(() => {
    import("@/lib/api/hr-api").then(({ hrApi }) => {
      hrApi
        .getEmployees()
        .then((empList) => {
          setEmployees(
            empList.map((e: any) => ({
              employeeId: e.employeeId || e.id?.toString() || "",
              name: e.fullName || "",
              position: e.position
                ? {
                  id: e.position.id,
                  title: e.position.title,
                  level: e.position.level,
                }
                : null,
              baseSalary: Number(e.currentSalary) || 0,
              taxRate: e.taxRate || 0,
              benefits: e.benefits || 0,
              bankAccount: e.bankAccountNumber ? "****" + e.bankAccountNumber.slice(-4) : "",
            })),
          )
        })
        .catch(() => setEmployees([]))
      hrApi
        .getDepartments()
        .then((deptList) => setDepartmentsList(deptList))
        .catch(() => setDepartmentsList([]))
    })
  }, [])

  // Auto-fetch payment period when employee changes
  useEffect(() => {
    if (newPayment.employeeId && showNewPaymentDialog) {
      setLoadingPaymentPeriod(true)
      setDuplicatePaymentWarning(null)

      import("@/lib/api/hr-salary-api").then(({ getNextPaymentPeriod }) => {
        getNextPaymentPeriod(newPayment.employeeId)
          .then((periodData) => {
            setNewPayment(prev => ({
              ...prev,
              payPeriod: new Date(periodData.payPeriod),
            }))
          })
          .catch((error) => {
            console.error("Failed to fetch payment period:", error)
            if (error.response?.status === 400 && error.response?.data?.message?.includes('existe déjà')) {
              setDuplicatePaymentWarning(error.response.data.message)
            }
          })
          .finally(() => {
            setLoadingPaymentPeriod(false)
          })
      })
    }
  }, [newPayment.employeeId, showNewPaymentDialog])

  // Fetch payments from backend
  useEffect(() => {
    setLoading(true)
    listSalaryPayments()
      .then(setPayments)
      .catch((e) => setError("Failed to load salary payments " + e.message))
      .finally(() => setLoading(false))
  }, [])

  // Club bank accounts state
  const [bankAccounts, setBankAccounts] = useState<{ id: number; bankName: string; accountNumber: string }[]>([])
  // Fetch club bank accounts when dialog opens
  useEffect(() => {
    if (showNewPaymentDialog || showBulkPaymentDialog) {
      const token = authUtils.getToken()
      fetch(getApiUrl("/bank-accounts"), {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setBankAccounts(Array.isArray(data) ? data : []))
        .catch(() => setBankAccounts([]))
    }
  }, [showNewPaymentDialog, showBulkPaymentDialog])

  // Generate PDF payment slip for HR salary payments
  const generateHRPaymentSlipPDF = useCallback(
    async (payment: ApiSalaryPayment) => {
      await generateEmployeeSalaryPDF({
        payment,
        bankAccounts: bankAccounts.map(acc => ({ ...acc, id: String(acc.id) }))
      })
    },
    [employees, bankAccounts],
  )

  const filteredPayments = payments.filter((payment) => {
    // Use nested employee and string fields from API
    const employeeName = payment.employee?.employeeId
      ? payment.employee.employeeId.toLowerCase()
      : payment.employeeId?.toLowerCase() || ""
    let id = ""
    if (typeof payment.id === "string" || typeof payment.id === "number") {
      id = String(payment.id).toLowerCase()
    }
    const matchesSearch = employeeName.includes(searchTerm.toLowerCase()) || id.includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter

    // Department filter - check both the department ID as number and string
    const paymentDeptId = payment.employee?.department?.id
    const matchesDepartment = departmentFilter === "all" ||
      (paymentDeptId && (String(paymentDeptId) === departmentFilter || paymentDeptId === Number(departmentFilter)))

    // Date filter
    const paymentDate = payment.paymentDate ? new Date(payment.paymentDate) : null
    const matchesStartDate = !startDateFilter || !paymentDate || paymentDate >= new Date(startDateFilter)
    const matchesEndDate = !endDateFilter || !paymentDate || paymentDate <= new Date(endDateFilter)

    return matchesSearch && matchesStatus && matchesDepartment && matchesStartDate && matchesEndDate
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Traité
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Échoué
          </Badge>
        )
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">Annulé</Badge>
      default:
        return <Badge>Inconnu</Badge>
    }
  }

  const calculatePayment = () => {
    const grossPay = newPayment.baseSalary + newPayment.overtime + newPayment.bonuses
    const employee = employees.find((emp) => emp.employeeId === newPayment.employeeId)
    const taxDeduction = employee ? grossPay * employee.taxRate : 0
    const benefitDeduction = employee ? employee.benefits : 0
    const totalDeductions = taxDeduction + benefitDeduction
    const netPay = grossPay - totalDeductions

    return { grossPay, totalDeductions, netPay }
  }

  // Replace handleCreatePayment with API call
  const handleCreatePayment = async () => {
    // Validate all fields are filled and valid
    if (
      !newPayment.employeeId ||
      !newPayment.payPeriod ||
      newPayment.baseSalary === null ||
      isNaN(Number(newPayment.baseSalary)) ||
      Number(newPayment.baseSalary) <= 0 ||
      newPayment.overtime === null ||
      isNaN(Number(newPayment.overtime)) ||
      Number(newPayment.overtime) < 0 ||
      newPayment.bonuses === null ||
      isNaN(Number(newPayment.bonuses)) ||
      Number(newPayment.bonuses) < 0 ||
      newPayment.deductions === null ||
      isNaN(Number(newPayment.deductions)) ||
      Number(newPayment.deductions) < 0 ||
      !newPayment.paymentMethod ||
      !newPayment.paymentDate ||
      !(newPayment.paymentDate instanceof Date) ||
      isNaN(newPayment.paymentDate.getTime()) ||
      !newPayment.payPeriod ||
      !(newPayment.payPeriod instanceof Date) ||
      isNaN(newPayment.payPeriod.getTime())
    ) {
      setError("Tous les champs sont obligatoires et doivent être valides.")
      return
    }
    const employee = employees.find((emp) => emp.employeeId === newPayment.employeeId)
    if (!employee) {
      setError("Employé invalide.")
      return
    }
    // Only send valid date strings, otherwise omit the field
    const getDateString = (date: Date | null) => {
      return date instanceof Date && !isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : undefined
    }
    // Get current user from auth-utils

    const body: CreateSalaryPaymentBody = {
      employeeId: newPayment.employeeId,
      payPeriod: getDateString(newPayment.payPeriod)!,
      baseSalary: newPayment.baseSalary,
      overtime: newPayment.overtime,
      bonuses: newPayment.bonuses,
      paymentMethod: newPayment.paymentMethod,
      status: "pending",
      paymentDate: getDateString(newPayment.paymentDate)!,
      createdById: currentUser!.id,
      deductions: 0,
      bankAccountId: newPayment.paymentMethod === "Bank Transfer" ? newPayment.bankAccountId : undefined,
    }
    try {
      const created = await createSalaryPayment(body)
      setPayments((prev) => [...prev, created])
      setShowNewPaymentDialog(false)
      setNewPayment({
        employeeId: "",
        payPeriod: null,
        baseSalary: 0,
        overtime: 0,
        bonuses: 0,
        paymentMethod: "Bank Transfer",
        amount: 0,
        deductions: 0,
        paymentDate: null,
        bankAccountId: undefined,
      })
    } catch (e: any) {
      // Extract the actual error message from the backend
      const errorMessage = e.response?.data?.message || e.message || "Failed to create payment"
      // If message is an array (validation errors), join them
      const displayMessage = Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage
      setError(displayMessage)
    }
  }

  const handleCancelPayment = async (paymentId: number) => {
    try {
      setLoading(true)
      await approveOrRejectSalaryPayment(paymentId, "cancelled")
      // Refetch payments to update UI
      const refreshedPayments = await listSalaryPayments()
      setPayments(refreshedPayments)
      setLoading(false)
    } catch (e: any) {
      setError("Failed to cancel payment " + e.message)
      setLoading(false)
    }
  }
  const handleProcessPayment = async (paymentId: number) => {
    try {
      setLoading(true)
      await approveOrRejectSalaryPayment(paymentId, "processed")
      // Refetch payments to update UI
      const refreshedPayments = await listSalaryPayments()
      setPayments(refreshedPayments)
      setLoading(false)
    } catch (e: any) {
      setError("Failed to process payment " + e.message)
      setLoading(false)
    }
  }
  // Add delete dialog state and handler
  const handleDeletePayment = async () => {
    if (!deleteDialog.payment) return
    try {
      await deleteSalaryPayment(String(deleteDialog.payment!.id))
      setPayments((prev) => prev.filter((p) => String(p.id) !== String(deleteDialog.payment!.id)))
      setDeleteDialog({ open: false, payment: null })
    } catch (e: any) {
      setError("Failed to delete payment " + e.message)
    }
  }

  const totalPayments = payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
  const pendingPayments = payments.filter((p) => p.status === "pending").length
  const processedPayments = payments.filter((p) => p.status === "processed").length
  const failedPayments = payments.filter((p) => p.status === "failed").length

  return (
    <div className="space-y-6">
      {/* Loading and Error Alerts */}
      {loading && (
        <Alert variant="default" className="flex items-center gap-2">
          <Loader2 className="animate-spin w-5 h-5 mr-2" />
          Chargement des paiements de salaires...
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <p className="whitespace-normal">{String(error)}</p>
        </Alert>
      )}
      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          className="bg-blue-800 hover:bg-blue-900 text-white mb-2"
          onClick={() => exportSalaryPaymentsToCSV(filteredPayments)}
        >
          Exporter les paiements (CSV)
        </Button>
      </div>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des paiements de salaires</h1>
          <p className="text-gray-600 dark:text-gray-400">Traitez et gérez les paiements de salaires des employés</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
            onClick={() => window.location.href = '/salary-payments/grouped'}
          >
            <Users className="w-4 h-4 mr-2" />
            Paiements groupés
          </Button>
          <Dialog open={showNewPaymentDialog} onOpenChange={setShowNewPaymentDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau paiement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un nouveau paiement de salaire</DialogTitle>
                <DialogDescription>Traiter un nouveau paiement de salaire pour un employé</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="employee">Employé</Label>
                    <Combobox
                      options={employees.map((employee) => ({
                        value: employee.employeeId,
                        label: `${employee.name} - ${employee.position ? employee.position.title : "Aucune position"}`,
                        keywords: `${employee.employeeId} ${employee.name} ${employee.position?.title || ""}`
                      }))}
                      value={newPayment.employeeId}
                      onValueChange={(value) => {
                        const employee = employees.find((emp) => emp.employeeId === value)
                        setNewPayment({
                          ...newPayment,
                          employeeId: value,
                          baseSalary: employee?.baseSalary || 0,
                        })
                      }}
                      placeholder="Sélectionner un employé"
                      searchPlaceholder="Rechercher un employé..."
                      emptyText="Aucun employé trouvé"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payPeriod">Période de paie</Label>
                    <Input
                      id="payPeriod"
                      type="date"
                      value={newPayment.payPeriod ? newPayment.payPeriod.toISOString().slice(0, 10) : ""}
                      onChange={(e) =>
                        setNewPayment({ ...newPayment, payPeriod: e.target.value ? new Date(e.target.value) : null })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="baseSalary">Salaire de base</Label>
                    <Input
                      id="baseSalary"
                      type="number"
                      value={newPayment.baseSalary}
                      onChange={(e) => setNewPayment({ ...newPayment, baseSalary: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overtime">Heures supplémentaires</Label>
                    <Input
                      id="overtime"
                      type="number"
                      value={newPayment.overtime}
                      onChange={(e) => setNewPayment({ ...newPayment, overtime: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="bonuses">Primes</Label>
                    <Input
                      id="bonuses"
                      type="number"
                      value={newPayment.bonuses}
                      onChange={(e) => setNewPayment({ ...newPayment, bonuses: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deductions">Déductions</Label>
                    <Input
                      id="deductions"
                      type="number"
                      value={newPayment.deductions}
                      onChange={(e) => setNewPayment({ ...newPayment, deductions: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="paymentDate">Date de paiement</Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={newPayment.paymentDate ? newPayment.paymentDate.toISOString().slice(0, 10) : ""}
                      onChange={(e) =>
                        setNewPayment({ ...newPayment, paymentDate: e.target.value ? new Date(e.target.value) : null })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Méthode de paiement</Label>
                    <Select
                      value={newPayment.paymentMethod}
                      onValueChange={(value) => setNewPayment({ ...newPayment, paymentMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bank Transfer">Virement bancaire</SelectItem>
                        <SelectItem value="Direct Deposit">Dépôt direct</SelectItem>
                        <SelectItem value="Check">Chèque</SelectItem>
                        <SelectItem value="Cash">Espèces</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {newPayment.paymentMethod === "Bank Transfer" && (
                  <div className="space-y-2">                  <Label htmlFor="bankAccountId">Compte bancaire du club</Label>
                    <Select
                      value={newPayment.bankAccountId ? String(newPayment.bankAccountId) : ""}
                      onValueChange={(id) => setNewPayment((f) => ({ ...f, bankAccountId: Number(id) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un compte bancaire" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((account) => (
                          <SelectItem key={account.id} value={String(account.id)}>
                            {account.bankName} - {account.accountNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {newPayment.employeeId && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold mb-2">Calcul du paiement</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Salaire brut :</span>
                      <p className="font-semibold">{calculatePayment().grossPay.toLocaleString()} MAD</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Déductions :</span>
                      <p className="font-semibold">{newPayment.deductions.toLocaleString()} MAD</p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Salaire net :</span>
                      <p className="font-semibold text-green-600">
                        {(calculatePayment().grossPay - newPayment.deductions).toLocaleString()} MAD
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewPaymentDialog(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={handleCreatePayment}
                  disabled={
                    !newPayment.employeeId ||
                    !newPayment.payPeriod ||
                    loadingPaymentPeriod ||
                    !!duplicatePaymentWarning
                  }
                >
                  {loadingPaymentPeriod ? "Calcul..." : "Créer le paiement"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant total des paiements</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayments.toLocaleString()} MAD</div>
            <p className="text-xs text-muted-foreground">Ce mois-ci</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground">En attente de traitement</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Traités</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processedPayments}</div>
            <p className="text-xs text-muted-foreground">Payés avec succès</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Échoués</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedPayments}</div>
            <p className="text-xs text-muted-foreground">À vérifier</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des paiements</CardTitle>
          <CardDescription>Gérez et suivez tous les paiements de salaires</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Rechercher par nom, poste ou ID de paiement..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="processed">Traité</SelectItem>
                  <SelectItem value="failed">Échoué</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="block">
                <Label htmlFor="start-date" className="text-xs mb-1 block">Département</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Département" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les départements</SelectItem>
                    {departmentsList.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 flex-1">
                <div className="flex-1">
                  <Label htmlFor="start-date" className="text-xs mb-1 block">Date début</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="end-date" className="text-xs mb-1 block">Date fin</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>ID Paiement</TableHead>
                  <TableHead>Employé</TableHead>
                  <TableHead>Période de paie</TableHead>
                  <TableHead>Salaire brut (MAD)</TableHead>
                  <TableHead>Déductions (MAD)</TableHead>
                  <TableHead>Salaire net (MAD)</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment, index) => {
                  const employeeId = payment.employee?.employeeId || payment.employeeId || ""
                  const employeeName = payment.employee?.fullName || ""
                  const grossPay = Number(payment.baseSalary) + Number(payment.overtime) + Number(payment.bonuses)
                  const deductions = 0 // If you have deduction logic, update here
                  const netPay = Number(payment.amount)
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{payment.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{employeeId}</div>
                          {employeeName && <div className="text-xs text-muted-foreground">{employeeName}</div>}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(payment.payPeriod)}</TableCell>
                      <TableCell>{grossPay.toLocaleString()} MAD</TableCell>
                      <TableCell>{deductions.toLocaleString()} MAD</TableCell>
                      <TableCell className="font-semibold text-green-600">{netPay.toLocaleString()} MAD</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedPayment(payment)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {payment.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleProcessPayment(Number(payment.id))}
                                className="text-green-600 hover:text-green-700"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelPayment(Number(payment.id))}
                                className="text-gray-600 hover:text-gray-700"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => generateHRPaymentSlipPDF(payment)}
                            title="Générer PDF"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setDeleteDialog({ open: true, payment })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      {selectedPayment && (
        <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails du paiement - {selectedPayment.id}</DialogTitle>
              <DialogDescription>Informations complètes et ventilation du paiement</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Détails du paiement</TabsTrigger>
                <TabsTrigger value="breakdown">Ventilation</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Employé</Label>
                    <p className="text-lg font-semibold">
                      {selectedPayment.employee?.employeeId || selectedPayment.employeeId}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Période de paie</Label>
                    <p className="text-lg">{selectedPayment.payPeriod}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Méthode de paiement</Label>
                    <p className="text-lg">{selectedPayment.paymentMethod}</p>
                  </div>
                  {selectedPayment.paymentMethod === "Bank Transfer" && selectedPayment.bankAccountId && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Compte bancaire du club</Label>
                      <p className="text-lg">
                        {(() => {
                          const account = bankAccounts.find((a) => a.id === selectedPayment.bankAccountId)
                          return account
                            ? `${account.bankName} - ${account.accountNumber}`
                            : `Compte ID: ${selectedPayment.bankAccountId}`
                        })()}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Statut</Label>
                    <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Date de paiement</Label>
                    <p className="text-lg">{selectedPayment.paymentDate}</p>
                  </div>
                  {selectedPayment.processedDate && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Date de traitement</Label>
                      <p className="text-lg">{selectedPayment.processedDate}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="breakdown" className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Label className="text-sm font-medium text-blue-600">Salaire de base</Label>
                      <p className="text-2xl font-bold text-blue-800">
                        {Number(selectedPayment.baseSalary).toLocaleString()} MAD
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Label className="text-sm font-medium text-green-600">Heures supplémentaires</Label>
                      <p className="text-2xl font-bold text-green-800">
                        {Number(selectedPayment.overtime).toLocaleString()} MAD
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <Label className="text-sm font-medium text-purple-600">Primes</Label>
                      <p className="text-2xl font-bold text-purple-800">
                        {Number(selectedPayment.bonuses).toLocaleString()} MAD
                      </p>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <Label className="text-sm font-medium text-red-600">Montant</Label>
                      <p className="text-2xl font-bold text-red-800">
                        {Number(selectedPayment.amount).toLocaleString()} MAD
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Salaire brut</Label>
                        <p className="text-xl font-semibold">
                          {(
                            Number(selectedPayment.baseSalary) +
                            Number(selectedPayment.overtime) +
                            Number(selectedPayment.bonuses)
                          ).toLocaleString()}{" "}
                          MAD
                        </p>
                      </div>
                      <div className="text-right">
                        <Label className="text-sm font-medium text-green-600">Salaire net</Label>
                        <p className="text-2xl font-bold text-green-800">
                          {Number(selectedPayment.amount).toLocaleString()} MAD
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedPayment(null)}>
                Fermer
              </Button>
              <Button
                onClick={() => generateHRPaymentSlipPDF(selectedPayment)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Générer PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, payment: open ? deleteDialog.payment : null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le paiement de salaire</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le paiement {deleteDialog.payment?.id} ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, payment: null })}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeletePayment}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
