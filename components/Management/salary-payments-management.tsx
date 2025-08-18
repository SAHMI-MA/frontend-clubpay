"use client"

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
  FileText,
  Loader2,
  Users,
  UserCheck,
  Clock,
  CheckCircle,
  Eye,
  Building
} from "lucide-react"
import { formatCurrency } from '@/lib/pdf-utils'
import { ToastNotification, useToast } from "@/components/ui/toast-notification"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { RootState } from "@/lib/redux/store"
import { authUtils } from "@/lib/redux/auth-utils"
import { 
  fetchSalaryPayments,
  createSalaryPayment,
  createTransactionFromSalaryPayment
} from "@/lib/redux/financialSlice"
import { 
  TransactionType, 
  TransactionCategory, 
  PaymentStatus as TransactionPaymentStatus,
  CreateSalaryPaymentDto,
  CreateTransactionFromSalaryPaymentDto
} from "@/lib/types/financial-management"
import { fetchAllPlayers } from "@/lib/redux/playerSlice"
import { fetchAllStaff } from "@/lib/redux/staffSlice"

// Define SalaryPayment interface based on usage in financial management
export interface SalaryPayment {
  id: number
  amount: number
  paymentDate: string
  periodStart: string
  periodEnd: string
  bonus?: number
  taxAmount: number
  netAmount: number
  status: TransactionPaymentStatus
  playerId?: number
  staffId?: number
  player?: {
    id: number
    firstName: string
    lastName: string
    position: string
  }
  staff?: {
    id: number
    firstName: string
    lastName: string
    role: string
  }
  createdAt: string
  updatedAt: string
}

export function ClubSalaryPaymentsManagement() {
  // Toast notification state
  const { toastState, showToast, hideToast } = useToast()

  // State for managing salary payments
  const [isCreateSalaryPaymentDialogOpen, setIsCreateSalaryPaymentDialogOpen] = useState(false)
  const [isSubmittingSalaryPayment, setIsSubmittingSalaryPayment] = useState(false)
  const [salaryPaymentError, setSalaryPaymentError] = useState<string | null>(null)
  
  // State for transaction creation from salary payment
  const [selectedSalaryPaymentId, setSelectedSalaryPaymentId] = useState<number | null>(null)
  const [selectedTransactionType, setSelectedTransactionType] = useState<TransactionType>(TransactionType.EXPENSE)
  const [selectedTransactionCategory, setSelectedTransactionCategory] = useState<TransactionCategory | "">(TransactionCategory.SALARY)
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
    bonus: "",
    taxAmount: "",
    netAmount: "",
    recipientType: "player" as "player" | "staff",
    playerId: null as number | null,
    staffId: null as number | null,
  })

  const dispatch = useAppDispatch()
  
  // Get data from Redux store
  const { salaryPayments, loading } = useAppSelector((state) => state.financial)
  const players = useAppSelector((state) => state.players?.players || [])
  const staff = useAppSelector((state) => state.staff?.staff || [])
  const playersLoading = useAppSelector((state) => state.players?.loading || false)
  const staffLoading = useAppSelector((state) => state.staff?.loading || false)
  const authUser = useAppSelector((state: RootState) => state.auth.user)

  // Fetch initial data on component mount
  useEffect(() => {
    dispatch(fetchSalaryPayments())
    dispatch(fetchAllPlayers())
    dispatch(fetchAllStaff())
  }, [dispatch])

  // Create salary payment
  const handleCreateSalaryPayment = useCallback(async () => {
    // Validation
    if (!salaryPaymentForm.amount || !salaryPaymentForm.paymentDate || 
        !salaryPaymentForm.periodStart || !salaryPaymentForm.periodEnd ||
        !salaryPaymentForm.taxAmount || !salaryPaymentForm.netAmount) {
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
    if (typeof window !== 'undefined') {
      authToken = localStorage.getItem('auth_token')
    }
    
    if (!authToken) {
      setSalaryPaymentError("Authentication required: Please log in again to create a salary payment")
      return
    }

    setIsSubmittingSalaryPayment(true)
    setSalaryPaymentError(null)

    try {
      const currentUser = authUtils.getUser()
      if (!currentUser) {
        showToast("Utilisateur non authentifié", "error")
        return
      }

      const salaryPaymentData: CreateSalaryPaymentDto = {
        amount: parseFloat(salaryPaymentForm.amount),
        paymentDate: salaryPaymentForm.paymentDate,
        periodStart: salaryPaymentForm.periodStart,
        periodEnd: salaryPaymentForm.periodEnd,
        bonus: salaryPaymentForm.bonus ? parseFloat(salaryPaymentForm.bonus) : undefined,
        playerId: salaryPaymentForm.recipientType === "player" ? salaryPaymentForm.playerId! : undefined,
        staffId: salaryPaymentForm.recipientType === "staff" ? salaryPaymentForm.staffId! : undefined,
        createdBy: currentUser.id, // Add the required createdBy field
      }

      console.log("Creating salary payment with data:", salaryPaymentData)
      
      const result = await dispatch(createSalaryPayment(salaryPaymentData)).unwrap()
      console.log("Salary payment created successfully:", result)
      
      setIsCreateSalaryPaymentDialogOpen(false)
      
      // Show success toast notification
      showToast(
        "Salary payment created successfully.",
        "success",
        "Salary Payment Created"
      )
      
      // Reset form
      setSalaryPaymentForm({
        amount: "",
        paymentDate: "",
        periodStart: "",
        periodEnd: "",
        bonus: "",
        taxAmount: "",
        netAmount: "",
        recipientType: "player",
        playerId: null,
        staffId: null,
      })
      
      // Refresh data
      dispatch(fetchSalaryPayments())
    } catch (err: any) {
      console.error("Failed to create salary payment:", err)
      
      const errorMessage = err.message || "Failed to create salary payment. Please try again."
      
      // Show error toast notification
      showToast(
        errorMessage,
        "error",
        "Salary Payment Creation Failed"
      )
      
      if (err.message?.includes('401') || err.message?.includes('auth')) {
        setSalaryPaymentError("Authentication failed: Your session may have expired. Please log in again.")
      } else {
        setSalaryPaymentError(errorMessage)
      }
    } finally {
      setIsSubmittingSalaryPayment(false)
    }
  }, [salaryPaymentForm, dispatch, showToast])

  // Open transaction type selection dialog for a salary payment
  const openTransactionTypeDialog = useCallback((salaryPaymentId: number) => {
    setSelectedSalaryPaymentId(salaryPaymentId)
    // Default to expense and salary category for salary payments
    setSelectedTransactionType(TransactionType.EXPENSE)
    setSelectedTransactionCategory(TransactionCategory.SALARY)
    setIsTransactionTypeDialogOpen(true)
  }, [])

  // Create transaction from salary payment with specified type
  const handleCreateTransactionFromSalaryPayment = useCallback(async () => {
    // Check authentication token and user
    let authToken
    if (typeof window !== 'undefined') {
      authToken = localStorage.getItem('auth_token')
    }
    
    if (!authToken || !selectedSalaryPaymentId) {
      showToast(
        "Authentication required or invalid salary payment",
        "error",
        "Error"
      )
      return
    }
    
    // Check if we have a valid authenticated user
    let userId: number | null = null
    
    if (authUser && authUser.id) {
      userId = authUser.id
    } else {
      showToast(
        "Unable to get user information for transaction creation",
        "error", 
        "Error"
      )
      return
    }

    try {
      // Create the transaction from salary payment
      // First, find the salary payment to get recipient details for description
      const salaryPayment = salaryPayments.find(sp => sp.id === selectedSalaryPaymentId)
      if (!salaryPayment) {
        showToast("Salary payment not found", "error", "Error")
        return
      }

      const playerInfo = salaryPayment.player || (salaryPayment.playerId ? players.find(p => p.id === salaryPayment.playerId) : null)
      const staffInfo = salaryPayment.staff || (salaryPayment.staffId ? staff.find(s => s.id === salaryPayment.staffId) : null)
      const recipientName = playerInfo 
        ? `${playerInfo.firstName} ${playerInfo.lastName} (Player)` 
        : staffInfo 
          ? `${staffInfo.firstName} ${staffInfo.lastName} (${staffInfo.role})` 
          : 'Unknown'

      const transactionData: CreateTransactionFromSalaryPaymentDto = {
        salaryPaymentId: selectedSalaryPaymentId,
        createdById: userId,
        customDescription: `Salary payment for ${recipientName} - Period: ${new Date(salaryPayment.periodStart).toLocaleDateString()} to ${new Date(salaryPayment.periodEnd).toLocaleDateString()}`,
        transactionType: selectedTransactionType,
        transactionCategory: selectedTransactionCategory as TransactionCategory
      }

      await dispatch(createTransactionFromSalaryPayment(transactionData)).unwrap()
      
      setIsTransactionTypeDialogOpen(false)
      setSelectedSalaryPaymentId(null)

      showToast(
        "Transaction created successfully from salary payment",
        "success",
        "Transaction Created"
      )

      // Refresh salary payments to get updated status
      dispatch(fetchSalaryPayments())
    } catch (err: any) {
      console.error("Failed to create transaction from salary payment:", err)
      showToast(
        err.message || "Failed to create transaction from salary payment",
        "error",
        "Transaction Creation Failed"
      )
    }
  }, [selectedSalaryPaymentId, selectedTransactionType, selectedTransactionCategory, authUser, salaryPayments, players, staff, dispatch, showToast])

  // Filter salary payments based on search term, status, and recipient type
  const filteredSalaryPayments = useMemo(() => salaryPayments.filter((payment) => {
    const playerInfo = payment.player || (payment.playerId ? players.find(p => p.id === payment.playerId) : null)
    const staffInfo = payment.staff || (payment.staffId ? staff.find(s => s.id === payment.staffId) : null)
    const recipientName = playerInfo 
      ? `${playerInfo.firstName} ${playerInfo.lastName}` 
      : staffInfo 
        ? `${staffInfo.firstName} ${staffInfo.lastName}` 
        : ''

    const matchesSearch = recipientName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || payment.status.toString().toLowerCase() === selectedStatus.toLowerCase()
    const matchesRecipientType = selectedRecipientType === "all" || 
      (selectedRecipientType === "player" && payment.playerId) ||
      (selectedRecipientType === "staff" && payment.staffId)

    return matchesSearch && matchesStatus && matchesRecipientType
  }), [salaryPayments, players, staff, searchTerm, selectedStatus, selectedRecipientType])

  // Utility function to get color based on payment status
  const getStatusColor = useCallback((status: TransactionPaymentStatus) => {
    switch (status) {
      case TransactionPaymentStatus.PAID:
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case TransactionPaymentStatus.APPROVED:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case TransactionPaymentStatus.PENDING:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case TransactionPaymentStatus.REJECTED:
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }, [])

  // Calculate salary payment statistics
  const totalSalaryPayments = useMemo(() => 
    salaryPayments.reduce((sum, payment) => sum + payment.netAmount, 0)
  , [salaryPayments])

  const pendingPayments = useMemo(() => 
    salaryPayments.filter(payment => payment.status === TransactionPaymentStatus.PENDING).length
  , [salaryPayments])

  const completedPayments = useMemo(() => 
    salaryPayments.filter(payment => payment.status === TransactionPaymentStatus.PAID).length
  , [salaryPayments])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <ToastNotification toast={toastState} onClose={hideToast} />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Salaires du Club</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérez les paiements de salaires pour les joueurs et le staff du club</p>
        </div>
        <Button
          onClick={() => setIsCreateSalaryPaymentDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Paiement
        </Button>
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
            <p className="text-xs text-muted-foreground">
              Montant total net versé
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paiements en Attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              En attente de traitement
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paiements Complétés</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedPayments}</div>
            <p className="text-xs text-muted-foreground">
              Paiements effectués
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total des Paiements</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salaryPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              Nombre total de paiements
            </p>
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
                placeholder="Rechercher par nom..."
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
                <SelectItem value="approved">Approuvé</SelectItem>
                <SelectItem value="paid">Payé</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
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
                  <TableHead>Date de paiement</TableHead>
                  <TableHead>Bénéficiaire</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Montant brut</TableHead>
                  <TableHead>Montant des taxes</TableHead>
                  <TableHead>Montant net</TableHead>
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
                  filteredSalaryPayments.map((payment) => {
                    // Use recipient details directly from API response if available
                    // Fall back to our local state if not available
                    const playerInfo = payment.player || (payment.playerId ? players.find(p => p.id === payment.playerId) : null)
                    const staffInfo = payment.staff || (payment.staffId ? staff.find(s => s.id === payment.staffId) : null)
                    const recipientName = playerInfo 
                      ? `${playerInfo.firstName} ${playerInfo.lastName} (Player)` 
                      : staffInfo 
                        ? `${staffInfo.firstName} ${staffInfo.lastName} (${staffInfo.role})` 
                        : 'Unknown'
                    
                    return (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {playerInfo && <UserCheck className="h-4 w-4 text-blue-600" />}
                            {staffInfo && <Building className="h-4 w-4 text-purple-600" />}
                            {recipientName}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(payment.periodStart).toLocaleDateString()} - {new Date(payment.periodEnd).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{formatCurrency(payment.taxAmount)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(payment.netAmount)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status === TransactionPaymentStatus.PAID ? 'Payé' : 
                             payment.status === TransactionPaymentStatus.PENDING ? 'En attente' : 
                             payment.status === TransactionPaymentStatus.APPROVED ? 'Approuvé' : 
                             payment.status === TransactionPaymentStatus.REJECTED ? 'Rejeté' : 
                             payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {payment.status === TransactionPaymentStatus.PENDING && (
                              <Button 
                                size="sm"
                                variant="outline"
                                className="border-blue-300 hover:bg-blue-100"
                                onClick={() => openTransactionTypeDialog(payment.id)}
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                Créer la transaction
                              </Button>
                            )}
                            <Button 
                              size="sm"
                              variant="ghost"
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Voir
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
        </CardContent>
      </Card>

      {/* Create Salary Payment Dialog */}
      <Dialog open={isCreateSalaryPaymentDialogOpen} onOpenChange={setIsCreateSalaryPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
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
          
          <div className="grid gap-4 py-4">
            {/* Recipient Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recipientType" className="text-right">
                Type de bénéficiaire*
              </Label>
              <div className="col-span-3 flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="playerType"
                    name="recipientType"
                    value="player"
                    checked={salaryPaymentForm.recipientType === "player"}
                    onChange={() => setSalaryPaymentForm({ ...salaryPaymentForm, recipientType: "player", staffId: null })}
                    className="h-4 w-4 border-gray-300 text-blue-600"
                  />
                  <Label htmlFor="playerType" className="cursor-pointer">Joueur</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="staffType"
                    name="recipientType"
                    value="staff"
                    checked={salaryPaymentForm.recipientType === "staff"}
                    onChange={() => setSalaryPaymentForm({ ...salaryPaymentForm, recipientType: "staff", playerId: null })}
                    className="h-4 w-4 border-gray-300 text-blue-600"
                  />
                  <Label htmlFor="staffType" className="cursor-pointer">Staff</Label>
                </div>
              </div>
            </div>
            
            {/* Recipient Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recipient" className="text-right">
                Bénéficiaire*
              </Label>
              <div className="col-span-3">
                {salaryPaymentForm.recipientType === "player" ? (
                  <Select
                    value={salaryPaymentForm.playerId?.toString() || ""}
                    onValueChange={(value) => setSalaryPaymentForm({ ...salaryPaymentForm, playerId: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a player" />
                    </SelectTrigger>
                    <SelectContent>
                      {playersLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                          <span className="ml-2">Loading players...</span>
                        </div>
                      ) : players.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">No players available</div>
                      ) : (
                        players.map((player) => (
                          <SelectItem key={player.id} value={player.id.toString()}>
                            {player.firstName} {player.lastName} ({player.position})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={salaryPaymentForm.staffId?.toString() || ""}
                    onValueChange={(value) => setSalaryPaymentForm({ ...salaryPaymentForm, staffId: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                          <span className="ml-2">Loading staff...</span>
                        </div>
                      ) : staff.length === 0 ? (
                        <div className="p-2 text-sm text-gray-500">No staff available</div>
                      ) : (
                        staff.map((staffMember) => (
                          <SelectItem key={staffMember.id} value={staffMember.id.toString()}>
                            {staffMember.firstName} {staffMember.lastName} ({staffMember.role})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Payment Amount */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Montant brut*
              </Label>
              <div className="col-span-3 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">MAD</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-8"
                  value={salaryPaymentForm.amount}
                  onChange={(e) => setSalaryPaymentForm({ ...salaryPaymentForm, amount: e.target.value })}
                />
              </div>
            </div>
            
            {/* Payment Date */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paymentDate" className="text-right">
                Date de paiement*
              </Label>
              <div className="col-span-3">
                <Input
                  id="paymentDate"
                  type="date"
                  value={salaryPaymentForm.paymentDate}
                  onChange={(e) => setSalaryPaymentForm({ ...salaryPaymentForm, paymentDate: e.target.value })}
                />
              </div>
            </div>
            
            {/* Period Start */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="periodStart" className="text-right">
                Début de période*
              </Label>
              <div className="col-span-3">
                <Input
                  id="periodStart"
                  type="date"
                  value={salaryPaymentForm.periodStart}
                  onChange={(e) => setSalaryPaymentForm({ ...salaryPaymentForm, periodStart: e.target.value })}
                />
              </div>
            </div>
            
            {/* Period End */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="periodEnd" className="text-right">
                Fin de période*
              </Label>
              <div className="col-span-3">
                <Input
                  id="periodEnd"
                  type="date"
                  value={salaryPaymentForm.periodEnd}
                  onChange={(e) => setSalaryPaymentForm({ ...salaryPaymentForm, periodEnd: e.target.value })}
                />
              </div>
            </div>
            
            {/* Bonus (optional) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bonus" className="text-right">
                Prime
              </Label>
              <div className="col-span-3 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">MAD</span>
                <Input
                  id="bonus"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-8"
                  value={salaryPaymentForm.bonus}
                  onChange={(e) => setSalaryPaymentForm({ ...salaryPaymentForm, bonus: e.target.value })}
                />
              </div>
            </div>
            
            {/* Tax Amount */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taxAmount" className="text-right">
                Montant des taxes*
              </Label>
              <div className="col-span-3 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">MAD</span>
                <Input
                  id="taxAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-8"
                  value={salaryPaymentForm.taxAmount}
                  onChange={(e) => setSalaryPaymentForm({ ...salaryPaymentForm, taxAmount: e.target.value })}
                />
              </div>
            </div>
            
            {/* Net Amount */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="netAmount" className="text-right">
                Montant net*
              </Label>
              <div className="col-span-3 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">MAD</span>
                <Input
                  id="netAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-8"
                  value={salaryPaymentForm.netAmount}
                  onChange={(e) => setSalaryPaymentForm({ ...salaryPaymentForm, netAmount: e.target.value })}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateSalaryPaymentDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateSalaryPayment}
              disabled={isSubmittingSalaryPayment}
            >
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
                <li><b>Expense:</b> Money going out (salary payments, equipment purchases, utilities, etc.)</li>
                <li><b>Income:</b> Money coming in (sponsorships, donations, registration fees, etc.)</li>
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
    </div>
  )
}
