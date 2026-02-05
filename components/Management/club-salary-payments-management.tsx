"use client"

/**
 * Export a list of club salary payments to CSV
 * @param salaryPayments Array of SalaryPayment objects
 */
export function exportClubSalaryPaymentsToCSV(salaryPayments: any[]) {
  const header = [
    "ID",
    "Payment Date",
    "Recipient",
    "Type",
    "Period",
    "Gross Amount (MAD)",
    "Tax Amount (MAD)",
    "Net Amount (MAD)",
    "Bonus (MAD)",
    "Status",
  ]
  const rows = salaryPayments.map((payment) => [
    payment.id,
    new Date(payment.paymentDate).toLocaleDateString(),
    payment.player
      ? `${payment.player.firstName} ${payment.player.lastName} (Player)`
      : payment.staff
        ? `${payment.staff.firstName} ${payment.staff.lastName} (Staff)`
        : "Unknown",
    payment.playerId ? "Player" : payment.staffId ? "Staff" : "Unknown",
    payment.periodStart && payment.periodEnd
      ? `${new Date(payment.periodStart!).toLocaleDateString()} - ${new Date(payment.periodEnd!).toLocaleDateString()}`
      : payment.payPeriod
      ? new Date(payment.payPeriod!).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      : "N/A",
    payment.amount || 0,
    payment.taxAmount || 0,
    payment.netAmount || 0,
    payment.bonus || 0,
    payment.status,
  ])
  const csvContent = [header, ...rows]
    .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
    .join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", "club-salary-payments.csv")
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  DollarSign,
  Plus,
  Search,
  Loader2,
  Users,
  UserCheck,
  Clock,
  CheckCircle,
  Eye,
  Building,
  FileText,
} from "lucide-react"
import { formatCurrency } from "@/lib/pdf-utils"
import { ToastNotification, useToast } from "@/components/ui/toast-notification"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import type { RootState } from "@/lib/redux/store"
import {
  fetchSalaryPayments,
  createSalaryPayment,
  createTransactionFromSalaryPayment,
  approveSalaryPayment,
  getNextClubPaymentPeriod,
} from "@/lib/redux/financialSlice"
import {
  TransactionType,
  TransactionCategory,
  PaymentStatus as TransactionPaymentStatus,
  type CreateSalaryPaymentDto,
  type CreateTransactionFromSalaryPaymentDto,
  SalaryPayment,
} from "@/lib/types/financial-management"
import { fetchAllPlayers } from "@/lib/redux/playerSlice"
import { fetchAllStaff } from "@/lib/redux/staffSlice"
import { GenerateSalaryProfilePDF } from "@/lib/jsPDF/SalaryProfilePDF"


export function ClubSalaryPaymentsManagement() {
  // Toast notification state
  const { toastState, showToast, hideToast } = useToast()

  // State for managing salary payments
  const [isCreateSalaryPaymentDialogOpen, setIsCreateSalaryPaymentDialogOpen] = useState(false)
  const [isSubmittingSalaryPayment, setIsSubmittingSalaryPayment] = useState(false)
  const [salaryPaymentError, setSalaryPaymentError] = useState<string | null>(null)

  // State for viewing payment details
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false)
  const [selectedPaymentForView, setSelectedPaymentForView] = useState<any>(null)

  // State for transaction creation from salary payment
  const [selectedSalaryPaymentId, setSelectedSalaryPaymentId] = useState<number | null>(null)
  const [selectedTransactionType, setSelectedTransactionType] = useState<TransactionType>(TransactionType.EXPENSE)
  const [selectedTransactionCategory, setSelectedTransactionCategory] = useState<TransactionCategory | "">(
    TransactionCategory.SALARY,
  )
  const [isTransactionTypeDialogOpen, setIsTransactionTypeDialogOpen] = useState(false)

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedRecipientType, setSelectedRecipientType] = useState("all")

  // Salary payment form state
  const [salaryPaymentForm, setSalaryPaymentForm] = useState({
    amount: "",
    paymentDate: "",
    periodStart: "",
    periodEnd: "",
    payPeriod: "", // Add payPeriod field
    bonus: "",
    netAmount: "",
    recipientType: "player" as "player" | "staff",
    playerId: null as number | null,
    staffId: null as number | null,
    notes: "",
  })

  // Payment period calculation states
  const [loadingPaymentPeriod, setLoadingPaymentPeriod] = useState(false)
  const [duplicatePaymentWarning, setDuplicatePaymentWarning] = useState<string | null>(null)
  const [noContractWarning, setNoContractWarning] = useState<string | null>(null)

  const dispatch = useAppDispatch()

  // Get data from Redux store
  const { salaryPayments, loading, totalSalaryPayments: totalPaymentCount, totalPages } = useAppSelector((state) => state.financial)
  const players = useAppSelector((state) => state.players?.players || [])
  const staff = useAppSelector((state) => state.staff?.staff || [])
  const playersLoading = useAppSelector((state) => state.players?.loading || false)
  const staffLoading = useAppSelector((state) => state.staff?.loading || false)
  const authUser = useAppSelector((state: RootState) => state.auth.user)

  // Pagination state
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  // Fetch initial data on component mount
  useEffect(() => {
    dispatch(fetchSalaryPayments({ page, limit }))
    dispatch(fetchAllPlayers())
    dispatch(fetchAllStaff())
  }, [dispatch, page, limit])

  // Refresh payment counter when salary payments change
  useEffect(() => {
    console.log("Salary payments updated:", salaryPayments.length, "payments loaded")
  }, [salaryPayments])

  // Auto-fetch payment period when player/staff is selected
  useEffect(() => {
    const recipientId = salaryPaymentForm.recipientType === 'player' 
      ? salaryPaymentForm.playerId 
      : salaryPaymentForm.staffId;
    
    if (recipientId && isCreateSalaryPaymentDialogOpen) {
      setLoadingPaymentPeriod(true)
      setDuplicatePaymentWarning(null)
      setNoContractWarning(null)
      
      dispatch(getNextClubPaymentPeriod({ 
        type: salaryPaymentForm.recipientType, 
        id: recipientId 
      }))
        .unwrap()
        .then((periodData: { periodStart: string; periodEnd: string; payPeriod: string }) => {
          setSalaryPaymentForm(prev => ({
            ...prev,
            payPeriod: periodData.payPeriod,
            periodStart: periodData.periodStart,
            periodEnd: periodData.periodEnd,
          }))
        })
        .catch((error: any) => {
          console.error("Failed to fetch payment period:", error)
          const errorStr = typeof error === 'string' ? error : (error?.message || JSON.stringify(error))
          
          if (errorStr.includes('no active contract') || errorStr.includes('pas de contrat')) {
            const recipientType = salaryPaymentForm.recipientType === 'player' ? 'joueur' : 'personnel'
            setNoContractWarning(`Ce ${recipientType} n'a pas de contrat actif. Veuillez d'abord créer un contrat.`)
          } else if (errorStr.includes('already exists') || errorStr.includes('existe déjà')) {
            setDuplicatePaymentWarning(errorStr)
          }
        })
        .finally(() => {
          setLoadingPaymentPeriod(false)
        })
    }
  }, [salaryPaymentForm.playerId, salaryPaymentForm.staffId, salaryPaymentForm.recipientType, isCreateSalaryPaymentDialogOpen, dispatch])

  // Generate PDF payment slip
  const generatePaymentSlipPDF = useCallback(
    async (payment: SalaryPayment) => {
      await GenerateSalaryProfilePDF({ payment, players, staff })
    },
    [players, staff],
  )

  // Calculate remaining payments for selected recipient
  const calculateRemainingPayments = useCallback(() => {
    if (salaryPaymentForm.recipientType === "player" && salaryPaymentForm.playerId) {
      const selectedPlayer = players.find((p) => p.id === salaryPaymentForm.playerId)
      if (selectedPlayer?.contract) {
        // Use salary payments directly from the player object (now included from API)
        const playerSalaryPayments = selectedPlayer.salaryPayments || []

        // Count existing PAID payments for this player
        const paidPayments = playerSalaryPayments.filter((payment) => payment.status === "PAID")

        // Debug logging
        console.log("Payment Counter Debug (using player data):", {
          playerId: salaryPaymentForm.playerId,
          playerName: `${selectedPlayer.firstName} ${selectedPlayer.lastName}`,
          playerSalaryPayments: playerSalaryPayments,
          paidPaymentsFromPlayerData: paidPayments,
          paidCount: paidPayments.length,
        })

        // Calculate contract duration in months
        const startDate = new Date(selectedPlayer.contract.startDate)
        const endDate = new Date(selectedPlayer.contract.endDate || new Date())
        const monthsDiff =
          (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth())

        const remainingPayments = Math.max(0, monthsDiff - paidPayments.length)
        return {
          totalMonths: monthsDiff,
          paidPayments: paidPayments.length,
          remainingPayments,
          recipientName: `${selectedPlayer.firstName} ${selectedPlayer.lastName}`,
          contractEndDate: selectedPlayer.contract.endDate,
        }
      }
    } else if (salaryPaymentForm.recipientType === "staff" && salaryPaymentForm.staffId) {
      const selectedStaff = staff.find((s) => s.id === salaryPaymentForm.staffId)
      if (selectedStaff?.contract) {
        // Use salary payments directly from the staff object (now included from API)
        const staffSalaryPayments = selectedStaff.salaryPayments || []

        // Count existing PAID payments for this staff member
        const paidPayments = staffSalaryPayments.filter((payment) => payment.status === "PAID")

        // Debug logging
        console.log("Staff Payment Counter Debug (using staff data):", {
          staffId: salaryPaymentForm.staffId,
          staffName: `${selectedStaff.firstName} ${selectedStaff.lastName}`,
          staffSalaryPayments: staffSalaryPayments,
          paidPaymentsFromStaffData: paidPayments,
          paidCount: paidPayments.length,
        })

        // Calculate contract duration in months
        const startDate = new Date(selectedStaff.contract.startDate)
        const endDate = new Date(selectedStaff.contract.endDate || new Date())
        const monthsDiff =
          (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth())

        const remainingPayments = Math.max(0, monthsDiff - paidPayments.length)
        return {
          totalMonths: monthsDiff,
          paidPayments: paidPayments.length,
          remainingPayments,
          recipientName: `${selectedStaff.firstName} ${selectedStaff.lastName}`,
          contractEndDate: selectedStaff.contract.endDate,
        }
      }
    }
    return null
  }, [salaryPaymentForm.recipientType, salaryPaymentForm.playerId, salaryPaymentForm.staffId, players, staff])

  const paymentCounter = calculateRemainingPayments()

  // Create salary payment
  const handleCreateSalaryPayment = useCallback(async () => {
    // Validation
    if (
      !salaryPaymentForm.amount ||
      !salaryPaymentForm.paymentDate
    ) {
      setSalaryPaymentError("Please fill in all required fields")
      return
    }

    if (salaryPaymentForm.recipientType === "player" && !salaryPaymentForm.playerId) {
      setSalaryPaymentError("Please select a player")
      return
    }

    if (salaryPaymentForm.recipientType === "staff" && !salaryPaymentForm.staffId) {
      setSalaryPaymentError("Please select a staff member")
      return
    }

    // Check authentication token
    let authToken
    if (typeof window !== "undefined") {
      authToken = localStorage.getItem("auth_token")
    }

    if (!authToken) {
      setSalaryPaymentError("Authentication required: Please log in again to create a salary payment")
      return
    }

    setIsSubmittingSalaryPayment(true)
    setSalaryPaymentError(null)

    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}")

      if (!currentUser.id) {
        setSalaryPaymentError("Authentication required: Please log in again to create a salary payment")
        return
      }

      const salaryPaymentData: CreateSalaryPaymentDto = {
        amount: Number.parseFloat(salaryPaymentForm.amount),
        paymentDate: salaryPaymentForm.paymentDate,
        periodStart: salaryPaymentForm.periodStart,
        periodEnd: salaryPaymentForm.periodEnd,
        bonus: salaryPaymentForm.bonus ? Number.parseFloat(salaryPaymentForm.bonus) : undefined,
        playerId: salaryPaymentForm.recipientType === "player" ? salaryPaymentForm.playerId! : undefined,
        staffId: salaryPaymentForm.recipientType === "staff" ? salaryPaymentForm.staffId! : undefined,
        createdBy: currentUser.id,
        notes: salaryPaymentForm.notes || "",
      }

      console.log("Creating salary payment with data:", salaryPaymentData)

      const result = await dispatch(createSalaryPayment(salaryPaymentData)).unwrap()
      console.log("Salary payment created successfully:", result)

      setIsCreateSalaryPaymentDialogOpen(false)

      // Show success toast notification
      showToast("Salary payment created successfully.", "success", "Salary Payment Created")

      // Reset form
      setSalaryPaymentForm({
        amount: "",
        paymentDate: "",
        periodStart: "",
        periodEnd: "",
        payPeriod: "",
        bonus: "",
        netAmount: "",
        recipientType: "player" as "player" | "staff",
        playerId: null,
        staffId: null,
        notes: "",
      })
      
      // Reset warnings
      setDuplicatePaymentWarning(null)
      setNoContractWarning(null)

      // Refresh data
      dispatch(fetchSalaryPayments({ page, limit }))
    } catch (err: any) {
      console.error("Failed to create salary payment:", err)

      const errorMessage = err.message || "Failed to create salary payment. Please try again."

      // Show error toast notification
      showToast(errorMessage, "error", "Salary Payment Creation Failed")

      if (err.message?.includes("401") || err.message?.includes("auth")) {
        setSalaryPaymentError("Authentication failed: Your session may have expired. Please log in again.")
      } else {
        setSalaryPaymentError(errorMessage)
      }
    } finally {
      setIsSubmittingSalaryPayment(false)
    }
  }, [salaryPaymentForm, dispatch, showToast])

  // Create transaction from salary payment with specified type
  const handleCreateTransactionFromSalaryPayment = useCallback(async () => {
    // Check authentication token and user
    let authToken
    if (typeof window !== "undefined") {
      authToken = localStorage.getItem("auth_token")
    }

    if (!authToken || !selectedSalaryPaymentId) {
      showToast("Authentication required or invalid salary payment", "error", "Error")
      return
    }

    // Check if we have a valid authenticated user
    let userId: number | null = null

    if (authUser && authUser.id) {
      userId = authUser.id
    } else {
      showToast("Unable to get user information for transaction creation", "error", "Error")
      return
    }

    try {
      // Create the transaction from salary payment
      // First, find the salary payment to get recipient details for description
      const salaryPayment = salaryPayments.find((sp) => sp.id === selectedSalaryPaymentId)
      if (!salaryPayment) {
        showToast("Salary payment not found", "error", "Error")
        return
      }

      const playerInfo =
        salaryPayment.player || (salaryPayment.playerId ? players.find((p) => p.id === salaryPayment.playerId) : null)
      const staffInfo =
        salaryPayment.staff || (salaryPayment.staffId ? staff.find((s) => s.id === salaryPayment.staffId) : null)
      const recipientName = playerInfo
        ? `${playerInfo.firstName} ${playerInfo.lastName} (Player)`
        : staffInfo
          ? `${staffInfo.firstName} ${staffInfo.lastName} (${staffInfo.role})`
          : "Unknown"

      const periodInfo = salaryPayment.periodStart && salaryPayment.periodEnd
        ? `Period: ${new Date(salaryPayment.periodStart!).toLocaleDateString()} to ${new Date(salaryPayment.periodEnd!).toLocaleDateString()}`
        : salaryPayment.payPeriod
        ? `Pay Period: ${new Date(salaryPayment.payPeriod!).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
        : "";

      const transactionData: CreateTransactionFromSalaryPaymentDto = {
        salaryPaymentId: selectedSalaryPaymentId,
        createdById: userId,
        customDescription: `Salary payment for ${recipientName}${periodInfo ? ` - ${periodInfo}` : ""}`,
        transactionType: selectedTransactionType,
        transactionCategory: selectedTransactionCategory as TransactionCategory,
      }

      await dispatch(createTransactionFromSalaryPayment(transactionData)).unwrap()

      setIsTransactionTypeDialogOpen(false)
      setSelectedSalaryPaymentId(null)

      showToast("Transaction created successfully from salary payment", "success", "Transaction Created")

      // Refresh salary payments to get updated status
      dispatch(fetchSalaryPayments({ page, limit }))
    } catch (err: any) {
      console.error("Failed to create transaction from salary payment:", err)
      showToast(
        err.message || "Failed to create transaction from salary payment",
        "error",
        "Transaction Creation Failed",
      )
    }
  }, [
    selectedSalaryPaymentId,
    selectedTransactionType,
    selectedTransactionCategory,
    authUser,
    salaryPayments,
    players,
    staff,
    dispatch,
    showToast,
  ])

  // Approve salary payment
  const handleApproveSalaryPayment = useCallback(
    async (paymentId: number) => {
      // Check authentication
      let authToken
      if (typeof window !== "undefined") {
        authToken = localStorage.getItem("auth_token")
      }

      if (!authToken) {
        showToast("Authentication required: Please log in again", "error", "Authentication Error")
        return
      }

      try {
        console.log(`Approving salary payment with ID: ${paymentId}`)

        const approvedPayment = await dispatch(approveSalaryPayment(paymentId)).unwrap()

        showToast("Paiement de salaire approuvé et transaction créée avec succès", "success", "Paiement Approuvé")

        // Refresh salary payments to get updated data
        dispatch(fetchSalaryPayments({ page, limit }))

        console.log("Salary payment approved:", approvedPayment)
      } catch (err: any) {
        console.error("Failed to approve salary payment:", err)
        showToast(err.message || "Échec de l'approbation du paiement de salaire", "error", "Approbation Échouée")
      }
    },
    [dispatch, showToast],
  )

  // Filter salary payments based on search term, status, and recipient type
  const filteredSalaryPayments = useMemo(() => {
    console.log("Filtering payments with selectedRecipientType:", selectedRecipientType)
    console.log("Total payments to filter:", salaryPayments.length)

    const filtered = salaryPayments.filter((payment) => {
      const playerInfo = payment.player || (payment.playerId ? players.find((p) => p.id === payment.playerId) : null)
      const staffInfo = payment.staff || (payment.staffId ? staff.find((s) => s.id === payment.staffId) : null)

      // Debug each payment's type
      const isPlayerPayment = !!(payment.playerId || playerInfo)
      const isStaffPayment = !!(payment.staffId || staffInfo)

      console.log(
        `Payment ${payment.id}: playerId=${payment.playerId}, staffId=${payment.staffId}, isPlayer=${isPlayerPayment}, isStaff=${isStaffPayment}`,
      )

      // Create searchable text including name, position/role
      const recipientName = playerInfo
        ? `${playerInfo.firstName} ${playerInfo.lastName}`
        : staffInfo
          ? `${staffInfo.firstName} ${staffInfo.lastName}`
          : ""

      const recipientRole = playerInfo ? playerInfo.position || "" : staffInfo ? staffInfo.role || "" : ""

      const searchableText = `${recipientName} ${recipientRole}`.toLowerCase()
      const matchesSearch = searchableText.includes(searchTerm.toLowerCase())

      // Fix status filtering to map French filter values to English API values
      const statusMapping: Record<string, string> = {
        pending: "PENDING",
        paid: "PAID",
      }

      const matchesStatus =
        selectedStatus === "all" ||
        payment.status.toString().toUpperCase() === (statusMapping[selectedStatus] || selectedStatus).toUpperCase()

      // Fix recipient type filtering
      const matchesRecipientType =
        selectedRecipientType === "all" ||
        (selectedRecipientType === "player" && isPlayerPayment) ||
        (selectedRecipientType === "staff" && isStaffPayment)

      const passes = matchesSearch && matchesStatus && matchesRecipientType
      console.log(
        `Payment ${payment.id} passes filter: ${passes} (search: ${matchesSearch}, status: ${matchesStatus}, type: ${matchesRecipientType})`,
      )

      return passes
    })

    console.log(`Filtered ${filtered.length} payments from ${salaryPayments.length} total`)
    return filtered
  }, [salaryPayments, players, staff, searchTerm, selectedStatus, selectedRecipientType])

  // Utility function to get color based on payment status
  const getStatusColor = useCallback((status: TransactionPaymentStatus) => {
    switch (status) {
      case TransactionPaymentStatus.PAID:
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case TransactionPaymentStatus.PENDING:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }, [])

  // Calculate salary payment statistics
  const totalSalaryPayments = useMemo(() => {
    // Only include PAID payments in the total
    const paidPayments = salaryPayments.filter((payment) => payment.status === TransactionPaymentStatus.PAID)
    const total = paidPayments.reduce((sum, payment) => {
      // Parse netAmount as it comes as a string from the API
      const netAmount = Number.parseFloat(payment.netAmount?.toString() || "0") || 0
      console.log(
        `Payment ${payment.id}: netAmount=${payment.netAmount} (parsed: ${netAmount}), status=${payment.status}`,
      )
      return sum + netAmount
    }, 0)
    console.log(
      `Total salary payments: ${total} from ${paidPayments.length} paid payments out of ${salaryPayments.length} total`,
    )
    return total
  }, [salaryPayments])

  const pendingPayments = useMemo(
    () => salaryPayments.filter((payment) => payment.status === TransactionPaymentStatus.PENDING).length,
    [salaryPayments],
  )

  const completedPayments = useMemo(
    () => salaryPayments.filter((payment) => payment.status === TransactionPaymentStatus.PAID).length,
    [salaryPayments],
  )

  return (
    <div className="container mx-auto py-6 space-y-6">
      <ToastNotification toast={toastState} onClose={hideToast} />

      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          className="bg-blue-800 hover:bg-blue-900 text-white mb-2"
          onClick={() => exportClubSalaryPaymentsToCSV(filteredSalaryPayments)}
        >
          Exporter les paiements (CSV)
        </Button>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Salaires du Club</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez les paiements de salaires pour les joueurs et le staff du club
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => window.location.href = "/club-salary-payments/grouped"}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Users className="h-4 w-4 mr-2" />
            Paiements Groupés
          </Button>
          <Button
            onClick={() => setIsCreateSalaryPaymentDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Paiement
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total des Paiements</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSalaryPayments)}</div>
            <p className="text-xs text-muted-foreground">Montant total net versé</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paiements en Attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground">En attente de traitement</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paiements Complétés</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedPayments}</div>
            <p className="text-xs text-muted-foreground">Paiements effectués</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total des Paiements</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salaryPayments.length}</div>
            <p className="text-xs text-muted-foreground">Nombre total de paiements</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres et Recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, poste, rôle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="paid">Payé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedRecipientType} onValueChange={setSelectedRecipientType}>
              <SelectTrigger>
                <SelectValue placeholder="Type de bénéficiaire" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="player">Joueurs</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setSelectedStatus("all")
                setSelectedRecipientType("all")
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Salary Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Paiements de Salaires du Club</CardTitle>
          <CardDescription>
            Consultez et gérez tous les paiements de salaires des joueurs et staff du club
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Date de paiement</TableHead>
                  <TableHead>Bénéficiaire</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Montant brut</TableHead>
                  <TableHead>Bonus</TableHead>
                  <TableHead>Montant Totale</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-500 mr-2" />
                        <span>Chargement des paiements de salaires...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !filteredSalaryPayments || filteredSalaryPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      Aucuns paiements de salaires trouvés.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSalaryPayments.map((payment, index) => {
                    // Use recipient details directly from API response if available
                    // Fall back to our local state if not available
                    const playerInfo =
                      payment.player || (payment.playerId ? players.find((p) => p.id === payment.playerId) : null)
                    const staffInfo =
                      payment.staff || (payment.staffId ? staff.find((s) => s.id === payment.staffId) : null)
                    const recipientName = playerInfo
                      ? `${playerInfo.firstName} ${playerInfo.lastName} (Player)`
                      : staffInfo
                        ? `${staffInfo.firstName} ${staffInfo.lastName} (${staffInfo.role})`
                        : "Unknown"

                    return (
                      <TableRow key={payment.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {playerInfo && <UserCheck className="h-4 w-4 text-blue-600" />}
                            {staffInfo && <Building className="h-4 w-4 text-purple-600" />}
                            {recipientName}
                          </div>
                        </TableCell>
                        <TableCell>
                          {payment.periodStart && payment.periodEnd
                            ? `${new Date(payment.periodStart!).toLocaleDateString()} - ${new Date(payment.periodEnd!).toLocaleDateString()}`
                            : payment.payPeriod
                            ? new Date(payment.payPeriod!).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                            : "N/A"}
                        </TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{formatCurrency(payment?.bonus || 0)}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(Number(payment.amount) + Number(payment.bonus ?? 0))}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status === TransactionPaymentStatus.PAID
                              ? "Payé"
                              : payment.status === TransactionPaymentStatus.PENDING
                                ? "En attente"
                                : payment.status === TransactionPaymentStatus.APPROVED
                                  ? "Approuvé"
                                  : payment.status === TransactionPaymentStatus.REJECTED
                                    ? "Rejeté"
                                    : payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {payment.status === TransactionPaymentStatus.PENDING && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-300 hover:bg-green-100 text-green-700 hover:text-green-800 bg-transparent"
                                onClick={() => handleApproveSalaryPayment(payment.id)}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approuver
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-gray-600 hover:text-gray-800"
                              onClick={() => {
                                console.log("🔍 Selected payment for view:", payment)
                                console.log("🔍 Payment playerId:", payment?.playerId)
                                console.log("🔍 Payment staffId:", payment?.staffId)
                                console.log("🔍 Payment player object:", payment?.player)
                                console.log("🔍 Payment staff object:", payment?.staff)
                                setSelectedPaymentForView(payment)
                                setIsViewDetailsDialogOpen(true)
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Voir
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 hover:text-blue-800 border-blue-300 hover:bg-blue-50 bg-transparent"
                              onClick={() => generatePaymentSlipPDF(payment)}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Afficher</span>
              <Select
                value={limit.toString()}
                onValueChange={(value) => {
                  setLimit(Number(value))
                  setPage(1) // Reset to first page when changing page size
                }}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">par page</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Page {page} sur {totalPages || 1} ({totalPaymentCount || 0} paiements au total)
              </span>
              
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={page === 1 || loading}
                >
                  Première
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1 || loading}
                >
                  Précédent
                </Button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages || 1) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= (totalPages - 2)) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      disabled={loading}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= (totalPages || 1) || loading}
                >
                  Suivant
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages || 1)}
                  disabled={page >= (totalPages || 1) || loading}
                >
                  Dernière
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Salary Payment Dialog */}
      <Dialog open={isCreateSalaryPaymentDialogOpen} onOpenChange={setIsCreateSalaryPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[600px] lg:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un nouveau paiement de salaire pour le club</DialogTitle>
            <DialogDescription>
              Créez un nouveau paiement de salaire pour un joueur ou un membre du staff du club.
            </DialogDescription>
          </DialogHeader>

          {salaryPaymentError && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4">
              <p className="text-sm">{salaryPaymentError}</p>
            </div>
          )}

          <div className="space-y-4 py-2">
            {/* Recipient Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Type de bénéficiaire*</Label>
              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="playerType"
                    name="recipientType"
                    value="player"
                    checked={salaryPaymentForm.recipientType === "player"}
                    onChange={() => {
                      setSalaryPaymentForm({ ...salaryPaymentForm, recipientType: "player", staffId: null, periodStart: "", periodEnd: "", payPeriod: "" })
                      setNoContractWarning(null)
                      setDuplicatePaymentWarning(null)
                    }}
                    className="h-4 w-4 border-gray-300 text-blue-600"
                  />
                  <Label htmlFor="playerType" className="cursor-pointer">
                    Joueur
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="staffType"
                    name="recipientType"
                    value="staff"
                    checked={salaryPaymentForm.recipientType === "staff"}
                    onChange={() => {
                      setSalaryPaymentForm({ ...salaryPaymentForm, recipientType: "staff", playerId: null, periodStart: "", periodEnd: "", payPeriod: "" })
                      setNoContractWarning(null)
                      setDuplicatePaymentWarning(null)
                    }}
                    className="h-4 w-4 border-gray-300 text-blue-600"
                  />
                  <Label htmlFor="staffType" className="cursor-pointer">
                    Staff
                  </Label>
                </div>
              </div>
            </div>

            {/* Recipient Selection */}
            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-sm font-medium">
                Bénéficiaire*
              </Label>
              <div>
                {salaryPaymentForm.recipientType === "player" ? (
                  <Select
                    value={salaryPaymentForm.playerId?.toString() || ""}
                    onValueChange={(value) => {
                      const playerId = Number.parseInt(value)
                      const selectedPlayer = players.find((p) => p.id === playerId)

                      // Auto-fill salary information when player is selected
                      const updatedForm = {
                        ...salaryPaymentForm,
                        playerId: playerId,
                      }

                      // If player has contract with salary, auto-fill the amount
                      if (selectedPlayer?.contract?.salary) {
                        updatedForm.amount = selectedPlayer.contract.salary.toString()
                        // Don't auto-calculate tax - let user enter manually or use calculate button
                      }

                      setSalaryPaymentForm(updatedForm)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un joueur" />
                    </SelectTrigger>
                    <SelectContent>
                      {playersLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                          <span className="ml-2">Chargement des joueurs...</span>
                        </div>
                      ) : players.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">Aucun joueur disponible</div>
                      ) : (
                        players.map((player) => (
                          <SelectItem key={player.id} value={player.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span>
                                {player.firstName} {player.lastName} ({player.position})
                              </span>
                              {player.contract?.salary && (
                                <span className="text-xs text-gray-500 ml-2">
                                  {formatCurrency(player.contract.salary)}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={salaryPaymentForm.staffId?.toString() || ""}
                    onValueChange={(value) => {
                      const staffId = Number.parseInt(value)
                      const selectedStaff = staff.find((s) => s.id === staffId)

                      // Auto-fill salary information when staff is selected
                      const updatedForm = {
                        ...salaryPaymentForm,
                        staffId: staffId,
                      }

                      // If staff has contract with salary, auto-fill the amount
                      if (selectedStaff?.contract?.salary) {
                        updatedForm.amount = selectedStaff.contract.salary.toString()
                        // Don't auto-calculate tax - let user enter manually or use calculate button
                      }

                      setSalaryPaymentForm(updatedForm)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un membre du staff" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                          <span className="ml-2">Chargement du staff...</span>
                        </div>
                      ) : staff.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">Aucun staff disponible</div>
                      ) : (
                        staff.map((staffMember) => (
                          <SelectItem key={staffMember.id} value={staffMember.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span>
                                {staffMember.firstName} {staffMember.lastName} ({staffMember.role})
                              </span>
                              {staffMember.contract?.salary && (
                                <span className="text-xs text-gray-500 ml-2">
                                  {formatCurrency(staffMember.contract.salary)}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Warning: No contract */}
              {noContractWarning && (
                <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-md p-3 mt-2">
                  <p className="text-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {noContractWarning}
                  </p>
                </div>
              )}

              {/* Warning: Duplicate payment */}
              {duplicatePaymentWarning && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mt-2">
                  <p className="text-sm flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {duplicatePaymentWarning}
                  </p>
                </div>
              )}

              {/* Loading payment period indicator */}
              {loadingPaymentPeriod && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calcul de la période de paie...
                </div>
              )}
            </div>

            {/* Financial Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Payment Amount */}
              <div className="space-y-1">
                <Label htmlFor="amount" className="text-sm font-medium">
                  Montant brut (MAD)*
                </Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pr-12 h-8"
                    value={salaryPaymentForm.amount}
                    onChange={(e) => setSalaryPaymentForm({ ...salaryPaymentForm, amount: e.target.value })}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                    MAD
                  </span>
                </div>
              </div>

              {/* Bonus (optional) */}
              <div className="space-y-1">
                <Label htmlFor="bonus" className="text-sm font-medium">
                  Prime (MAD)
                </Label>
                <div className="relative">
                  <Input
                    id="bonus"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pr-12 h-8"
                    value={salaryPaymentForm.bonus}
                    onChange={(e) => setSalaryPaymentForm({ ...salaryPaymentForm, bonus: e.target.value })}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                    MAD
                  </span>
                </div>
              </div>

              {/* Net Amount - Display Only */}
              <div className="space-y-1">
                <Label htmlFor="netAmount" className="text-sm font-medium">
                  Montant total (MAD)
                </Label>
                <div className="relative">
                  <Input
                    id="netAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Calculé automatiquement"
                    className="pr-12 h-8 bg-gray-50"
                    value={Number(salaryPaymentForm.amount) + Number(salaryPaymentForm.bonus || 0)}
                    onChange={(e) => setSalaryPaymentForm({ ...salaryPaymentForm, netAmount: e.target.value })}
                    disabled
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                    MAD
                  </span>
                </div>
              </div>
            </div>

            {/* Date Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Payment Date */}
              <div className="space-y-2">
                <Label htmlFor="paymentDate" className="text-sm font-medium">
                  Date de paiement*
                </Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={salaryPaymentForm.paymentDate}
                  onChange={(e) => setSalaryPaymentForm({ ...salaryPaymentForm, paymentDate: e.target.value })}
                />
              </div>

              {/* Period Start */}
              <div className="space-y-2">
                <Label htmlFor="periodStart" className="text-sm font-medium">
                  Début de période
                </Label>
                <Input
                  id="periodStart"
                  type="date"
                  value={salaryPaymentForm.periodStart}
                  onChange={(e) => setSalaryPaymentForm({ ...salaryPaymentForm, periodStart: e.target.value })}
                />
              </div>

              {/* Period End */}
              <div className="space-y-2">
                <Label htmlFor="periodEnd" className="text-sm font-medium">
                  Fin de période
                </Label>
                <Input
                  id="periodEnd"
                  type="date"
                  value={salaryPaymentForm.periodEnd}
                  onChange={(e) => setSalaryPaymentForm({ ...salaryPaymentForm, periodEnd: e.target.value })}
                />
              </div>
            </div>
          </div>
          {/* Note Section */}
          <div className="space-y-2">
            <Label htmlFor="note" className="text-sm font-medium">
              Note (optionnelle)
            </Label>
            <textarea
              id="note"
              rows={3}
              className="w-full border rounded-md p-2 text-sm bg-white dark:bg-gray-900"
              placeholder="Ajouter une note ou un commentaire sur ce paiement..."
              value={salaryPaymentForm.notes || ""}
              onChange={(e) => setSalaryPaymentForm({ ...salaryPaymentForm, notes: e.target.value })}
            />
          </div>
          {/* Payment Counter Display */}
          {paymentCounter && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-blue-900">
                    Compteur de paiements - {paymentCounter.recipientName}
                  </h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Contrat jusqu'au:{" "}
                    {paymentCounter.contractEndDate
                      ? new Date(paymentCounter.contractEndDate).toLocaleDateString("fr-FR")
                      : "Non défini"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-900">
                    {paymentCounter.remainingPayments} paiements restants
                  </div>
                  <div className="text-xs text-blue-600">
                    {paymentCounter.paidPayments} / {paymentCounter.totalMonths} mois payés
                  </div>
                </div>
              </div>
              {paymentCounter.remainingPayments === 0 && (
                <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded text-xs text-green-800">
                  ✅ Tous les paiements du contrat ont été effectués
                </div>
              )}
              {paymentCounter.remainingPayments > 0 && (
                <div className="mt-2 text-xs text-blue-600">
                  📅 Prochains paiements à prévoir selon la durée du contrat
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateSalaryPaymentDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateSalaryPayment} disabled={isSubmittingSalaryPayment}>
              {isSubmittingSalaryPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer le paiement de salaire"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Type Selection Dialog */}
      <Dialog open={isTransactionTypeDialogOpen} onOpenChange={setIsTransactionTypeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Créer une transaction depuis un paiement de salaire</DialogTitle>
            <DialogDescription>
              Sélectionnez le type et la catégorie de transaction pour ce paiement de salaire.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transactionType" className="text-right">
                Type de transaction*
              </Label>
              <div className="col-span-3">
                <Select
                  value={selectedTransactionType}
                  onValueChange={(value) => setSelectedTransactionType(value as TransactionType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TransactionType.EXPENSE}>Dépense</SelectItem>
                    <SelectItem value={TransactionType.INCOME}>Recette</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Catégorie*
              </Label>
              <div className="col-span-3">
                <Select
                  value={selectedTransactionCategory}
                  onValueChange={(value) => setSelectedTransactionCategory(value as TransactionCategory)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedTransactionType === TransactionType.EXPENSE ? (
                      <>
                        <SelectItem value={TransactionCategory.SALARY}>Salaire</SelectItem>
                        <SelectItem value={TransactionCategory.RENTAL}>Location</SelectItem>
                        <SelectItem value={TransactionCategory.EQUIPMENT}>Équipement</SelectItem>
                        <SelectItem value={TransactionCategory.UTILITY}>Service</SelectItem>
                        <SelectItem value={TransactionCategory.OTHER}>Autre</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value={TransactionCategory.SPONSORSHIP}>Sponsoring</SelectItem>
                        <SelectItem value={TransactionCategory.DONATION}>Don</SelectItem>
                        <SelectItem value={TransactionCategory.REGISTRATION}>Inscription</SelectItem>
                        <SelectItem value={TransactionCategory.OTHER}>Autre</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="col-span-3 text-xs text-gray-500 mt-2">
              <p className="mb-1">Transaction types:</p>
              <ul className="pl-5 list-disc space-y-1">
                <li>
                  <b>Expense:</b> Money going out (salary payments, equipment purchases, utilities, etc.)
                </li>
                <li>
                  <b>Income:</b> Money coming in (sponsorships, donations, registration fees, etc.)
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransactionTypeDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreateTransactionFromSalaryPayment}
              className="bg-blue-800 hover:bg-blue-900 text-white"
            >
              Créer la transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Payment Details Dialog */}
      <Dialog open={isViewDetailsDialogOpen} onOpenChange={setIsViewDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du Paiement de Salaire</DialogTitle>
            <DialogDescription>Informations complètes du paiement sélectionné</DialogDescription>
          </DialogHeader>

          {selectedPaymentForView && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <Label className="text-xs font-medium text-gray-500">ID Paiement</Label>
                  <p className="font-medium">{selectedPaymentForView.id}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">Date Paiement</Label>
                  <p className="font-medium">
                    {new Date(selectedPaymentForView.paymentDate).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500">Statut</Label>
                  <Badge
                    className={
                      selectedPaymentForView.status === TransactionPaymentStatus.PAID
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {selectedPaymentForView.status === TransactionPaymentStatus.PAID ? "Payé" : "En attente"}
                  </Badge>
                </div>
              </div>

              {/* Recipient Info */}
              <div className="border-t pt-3">
                <Label className="text-sm font-medium">Bénéficiaire</Label>
                <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
                  <div>
                    <Label className="text-xs text-gray-500">Nom</Label>
                    <p className="font-medium">
                      {selectedPaymentForView.player
                        ? `${selectedPaymentForView.player.firstName} ${selectedPaymentForView.player.lastName}`
                        : selectedPaymentForView.staff
                          ? `${selectedPaymentForView.staff.firstName} ${selectedPaymentForView.staff.lastName}`
                          : "Inconnu"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Type & Poste</Label>
                    <p className="font-medium">
                      {selectedPaymentForView.playerId || selectedPaymentForView.player
                        ? "Joueur"
                        : selectedPaymentForView.staffId || selectedPaymentForView.staff
                          ? "Staff"
                          : "Inconnu"}{" "}
                      • {selectedPaymentForView.player?.position || selectedPaymentForView.staff?.role || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Period */}
              <div className="border-t pt-3">
                <Label className="text-sm font-medium">Période</Label>
                <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
                  {selectedPaymentForView.periodStart && selectedPaymentForView.periodEnd ? (
                    <>
                      <div>
                        <Label className="text-xs text-gray-500">Du</Label>
                        <p className="font-medium">
                          {new Date(selectedPaymentForView.periodStart!).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Au</Label>
                        <p className="font-medium">
                          {new Date(selectedPaymentForView.periodEnd!).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </>
                  ) : selectedPaymentForView.payPeriod ? (
                    <div className="col-span-2">
                      <Label className="text-xs text-gray-500">Mois de paiement</Label>
                      <p className="font-medium">
                        {new Date(selectedPaymentForView.payPeriod!).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  ) : (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Aucune période spécifiée</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="border-t pt-3">
                <Label className="text-sm font-medium">Détails Financiers</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Montant Brut:</span>
                      <span className="font-medium text-blue-600">{formatCurrency(selectedPaymentForView.amount)}</span>
                    </div>
                    {selectedPaymentForView.bonus && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Bonus:</span>
                        <span className="font-medium text-green-500">
                          +{formatCurrency(selectedPaymentForView.bonus)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-center border-l pl-3">
                    <div className="text-center">
                      <Label className="text-xs text-gray-500">MONTANT NET</Label>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(
                          selectedPaymentForView.netAmount ||
                            selectedPaymentForView.amount - (selectedPaymentForView.taxAmount || 0),
                        )}
                      </p>
                    </div>
                  </div>
                  {selectedPaymentForView.notes && (
                    <div className="col-span-2 mt-2">
                      <Label className="text-xs text-gray-500">Note</Label>
                      <p className="font-medium text-gray-700 dark:text-gray-300">{selectedPaymentForView.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps - Compact */}
              {(selectedPaymentForView.createdAt || selectedPaymentForView.updatedAt) && (
                <div className="border-t pt-3 text-xs text-gray-400">
                  <div className="flex justify-between">
                    {selectedPaymentForView.createdAt && (
                      <span>Créé: {new Date(selectedPaymentForView.createdAt).toLocaleDateString("fr-FR")}</span>
                    )}
                    {selectedPaymentForView.updatedAt && (
                      <span>Modifié: {new Date(selectedPaymentForView.updatedAt).toLocaleDateString("fr-FR")}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsViewDetailsDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
