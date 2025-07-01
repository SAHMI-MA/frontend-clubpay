"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Textarea } from "@/components/ui/textarea"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { 
  Check, 
  CreditCard, 
  DollarSign, 
  Download, 
  Eye, 
  FileText,
  Filter, 
  Plus, 
  RefreshCcw, 
  Search, 
  TrendingDown, 
  TrendingUp, 
  X, 
  Loader2 
} from "lucide-react"
import { ToastNotification, useToast, ToastType } from "@/components/ui/toast-notification"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { RootState } from "@/lib/redux/store"
import { 
  fetchTransactions, 
  createTransactionFromAcquisition,
  createTransactionFromSalaryPayment,
  updateTransactionStatus,
  fetchSalaryPayments,
  createSalaryPayment
} from "@/lib/redux/financialSlice"
import { 
  Transaction, 
  TransactionType, 
  TransactionCategory, 
  PaymentStatus as TransactionPaymentStatus,
  CreateTransactionFromAcquisitionDto,
  CreateTransactionFromSalaryPaymentDto,
  CreateSalaryPaymentDto,
  SalaryPayment
} from "@/lib/types/financial-management"
import { 
  fetchPendingApprovals,
  approveOrRejectAcquisition
} from "@/lib/redux/acquisitionSlice"
import { fetchAllPlayers } from "@/lib/redux/playerSlice"
import { fetchAllStaff } from "@/lib/redux/staffSlice"
import { 
  Acquisition, 
  ApprovalStatus,
  ApprovalDto
} from "@/lib/types/supplier-management"
import { Player, Staff } from "@/lib/types/team-management"
import { api } from "@/lib/api"

// Monthly data for reports
const monthlyData = [
  { month: "Jul", income: 15000, expenses: 12000 },
  { month: "Aug", income: 18000, expenses: 14000 },
  { month: "Sep", income: 22000, expenses: 16000 },
  { month: "Oct", income: 19000, expenses: 15000 },
  { month: "Nov", income: 25000, expenses: 18000 },
  { month: "Dec", income: 28000, expenses: 20000 },
]

// No sample data needed

export function FinancialManagement() {
  const dispatch = useAppDispatch()
  
  // Toast notification state
  const { toastState, showToast, hideToast } = useToast();
  
  // State for managing the UI
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  
  // State for managing transactions
  const [isCreateTransactionDialogOpen, setIsCreateTransactionDialogOpen] = useState(false)
  const [pendingAcquisitions, setPendingAcquisitions] = useState<Acquisition[]>([])
  const [selectedAcquisitionId, setSelectedAcquisitionId] = useState<number | null>(null)
  const [transactionDescription, setTransactionDescription] = useState("")
  const [isSubmittingTransaction, setIsSubmittingTransaction] = useState(false)
  const [transactionError, setTransactionError] = useState<string | null>(null)
  
  // Add new state for acquisition loading
  const [isLoadingAcquisitions, setIsLoadingAcquisitions] = useState(false)
  const [acquisitionError, setAcquisitionError] = useState<string | null>(null)
  
  // State for managing salary payments
  const [isCreateSalaryPaymentDialogOpen, setIsCreateSalaryPaymentDialogOpen] = useState(false)
  const [isSubmittingSalaryPayment, setIsSubmittingSalaryPayment] = useState(false)
  const [salaryPaymentError, setSalaryPaymentError] = useState<string | null>(null)
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
  
  // Get data from Redux store
  const { transactions, loading, error, salaryPayments } = useAppSelector((state) => state.financial)
  const players = useAppSelector((state) => state.players?.players || [])
  const staff = useAppSelector((state) => state.staff?.staff || [])
  const playersLoading = useAppSelector((state) => state.players?.loading || false)
  const staffLoading = useAppSelector((state) => state.staff?.loading || false)
  const authUser = useAppSelector((state: RootState) => state.auth.user)
  
  // No legacy sample data needed

  // Fetch transactions, salary payments, and pending acquisitions on component mount
  useEffect(() => {
    dispatch(fetchTransactions())
    dispatch(fetchSalaryPayments())
    dispatch(fetchAllPlayers())
    dispatch(fetchAllStaff())
    fetchPendingAcquisitionsData()
  }, [dispatch])
  
  // Function to fetch pending acquisitions
  const fetchPendingAcquisitionsData = async () => {
    setIsLoadingAcquisitions(true)
    setAcquisitionError(null)
    
    try {
      console.log("Fetching pending acquisitions...")
      // First attempt to use the API service directly
      try {
        const result = await api.get<Acquisition[]>('acquisitions/pending')
        setPendingAcquisitions(result)
        console.log("Successfully loaded pending acquisitions:", result.length)
        return
      } catch (err: any) {
        console.error("Direct API call failed:", err)
        // If the error is related to authentication, don't try the fallback
        if (err.message?.includes('Authentication required') || err.message?.includes('Authentication failed')) {
          throw err // Re-throw to be caught by outer catch
        }
      }
      
      // If direct API call failed for non-auth reasons, try Redux thunk as fallback
      console.log("Attempting to fetch acquisitions via Redux thunk...")
      const thunkResult = await dispatch(fetchPendingApprovals()).unwrap()
      setPendingAcquisitions(thunkResult)
      console.log("Successfully loaded pending acquisitions via thunk:", thunkResult.length)
    } catch (err: any) {
      console.error("All attempts to fetch pending acquisitions failed:", err)
      const errorMessage = err.message?.includes('Authentication') 
        ? "Authentication failed: Please log in again to view pending acquisitions." 
        : `Failed to load acquisitions: ${err?.message || 'Unknown error'}`;
      
      setAcquisitionError(errorMessage);
      
      // Show error toast notification
      showToast(
        errorMessage,
        "error",
        "Failed to Load Acquisitions"
      );
    } finally {
      setIsLoadingAcquisitions(false)
    }
  }
  
  // Create transaction from acquisition
  const handleCreateTransaction = async () => {
    if (!selectedAcquisitionId) {
      setTransactionError("Please select an acquisition")
      return
    }
    
    // Check authentication token
    let authToken
    if (typeof window !== 'undefined') {
      authToken = localStorage.getItem('auth_token')
    }
    
    if (!authToken) {
      setTransactionError("Authentication required: Please log in again to create a transaction")
      return
    }
    
    // Check if we have a valid authenticated user
    let userId: number | null = null;
    
    if (authUser && authUser.id) {
      userId = authUser.id;
    } else {
      // Fallback: Try to get user ID from localStorage if not in Redux state
      const userDataString = localStorage.getItem('user_data');
      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          if (userData && userData.id) {
            userId = userData.id;
            console.log("Retrieved user ID from localStorage:", userId);
          }
        } catch (e) {
          console.error("Failed to parse user data from localStorage:", e);
        }
      }
      
      if (!userId) {
        setTransactionError("Authentication issue: Cannot retrieve your user information");
        console.error("User ID not found in auth state or localStorage");
        return;
      }
    }
    
    setIsSubmittingTransaction(true)
    setTransactionError(null)
    
    try {
      // First, approve the acquisition
      console.log("Approving acquisition:", selectedAcquisitionId)
      const approvalData: ApprovalDto = {
        approvalStatus: ApprovalStatus.APPROVED,
        approverId: userId, // Using authenticated user's ID
        approvalComments: "Approved for transaction creation"
      }
      
      console.log("Sending approval data:", JSON.stringify(approvalData))
      
      try {
        await dispatch(approveOrRejectAcquisition({ 
          id: selectedAcquisitionId, 
          approvalData 
        })).unwrap()
        
        console.log("Acquisition approved successfully")
      } catch (approvalError: any) {
        console.error("Failed to approve acquisition:", approvalError)
        throw new Error(`Failed to approve acquisition: ${approvalError.message || 'Unknown error'}`)
      }
      
      // Then create the transaction
      const transactionData: CreateTransactionFromAcquisitionDto = {
        acquisitionId: selectedAcquisitionId,
        createdById: userId, // Using authenticated user's ID
        customDescription: transactionDescription || undefined
      }
      
      console.log("Creating transaction with data:", transactionData)
      
      const result = await dispatch(createTransactionFromAcquisition(transactionData)).unwrap()
      console.log("Transaction created successfully:", result)
      setIsCreateTransactionDialogOpen(false)
      
      // Show success toast notification
      showToast(
        "Transaction created successfully from acquisition.",
        "success",
        "Transaction Created"
      )
      
      // Reset form and refetch data
      setSelectedAcquisitionId(null)
      setTransactionDescription("")
      
      // Refresh transactions and acquisitions
      dispatch(fetchTransactions())
      fetchPendingAcquisitionsData()
    } catch (err: any) {
      console.error("Failed to approve acquisition or create transaction:", err)
      
      const errorMessage = err.message || "Failed to create transaction. Please try again."
      
      // Show error toast notification
      showToast(
        errorMessage,
        "error",
        "Transaction Creation Failed"
      )
      
      if (err.message?.includes('401') || err.message?.includes('auth')) {
        setTransactionError("Authentication failed: Your session may have expired. Please log in again.")
      } else if (err.message?.includes('approve')) {
        setTransactionError(`Failed to approve acquisition: ${err.message}`)
      } else {
        setTransactionError(errorMessage)
      }
    } finally {
      setIsSubmittingTransaction(false)
    }
  }
  
  // Create salary payment
  const handleCreateSalaryPayment = async () => {
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
      const salaryPaymentData: CreateSalaryPaymentDto = {
        amount: parseFloat(salaryPaymentForm.amount),
        paymentDate: salaryPaymentForm.paymentDate,
        periodStart: salaryPaymentForm.periodStart,
        periodEnd: salaryPaymentForm.periodEnd,
        bonus: salaryPaymentForm.bonus ? parseFloat(salaryPaymentForm.bonus) : undefined,
        taxAmount: parseFloat(salaryPaymentForm.taxAmount),
        netAmount: parseFloat(salaryPaymentForm.netAmount),
        playerId: salaryPaymentForm.recipientType === "player" ? salaryPaymentForm.playerId! : undefined,
        staffId: salaryPaymentForm.recipientType === "staff" ? salaryPaymentForm.staffId! : undefined,
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
      dispatch(fetchTransactions()) // Salary payments may create transactions
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
  }
  
  // Create transaction from salary payment
  const handleCreateTransactionFromSalaryPayment = async (salaryPaymentId: number) => {
    // Check authentication token and user
    let authToken
    if (typeof window !== 'undefined') {
      authToken = localStorage.getItem('auth_token')
    }
    
    if (!authToken) {
      showToast(
        "Authentication required: Please log in again to create a transaction",
        "error",
        "Authentication Failed"
      )
      return
    }
    
    // Check if we have a valid authenticated user
    let userId: number | null = null;
    
    if (authUser && authUser.id) {
      userId = authUser.id;
    } else {
      // Fallback: Try to get user ID from localStorage if not in Redux state
      const userDataString = localStorage.getItem('user_data');
      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          if (userData && userData.id) {
            userId = userData.id;
            console.log("Retrieved user ID from localStorage:", userId);
          }
        } catch (e) {
          console.error("Failed to parse user data from localStorage:", e);
        }
      }
      
      if (!userId) {
        showToast(
          "Authentication issue: Cannot retrieve your user information",
          "error",
          "User ID Not Found"
        );
        console.error("User ID not found in auth state or localStorage");
        return;
      }
    }
    
    try {
      // Create the transaction from salary payment
      // First, find the salary payment to get recipient details for description
      const paymentDetails = salaryPayments.find(p => p.id === salaryPaymentId);
      let customDescription = "Salary payment transaction";
      
      if (paymentDetails) {
        const playerInfo = paymentDetails.player || (paymentDetails.playerId ? players.find(p => p.id === paymentDetails.playerId) : null);
        const staffInfo = paymentDetails.staff || (paymentDetails.staffId ? staff.find(s => s.id === paymentDetails.staffId) : null);
        const recipientName = playerInfo 
          ? `${playerInfo.firstName} ${playerInfo.lastName} (Player)` 
          : staffInfo 
            ? `${staffInfo.firstName} ${staffInfo.lastName} (${staffInfo.role})` 
            : 'Unknown recipient';
            
        const paymentDate = new Date(paymentDetails.paymentDate).toLocaleDateString();
        const periodStart = new Date(paymentDetails.periodStart).toLocaleDateString();
        const periodEnd = new Date(paymentDetails.periodEnd).toLocaleDateString();
        
        customDescription = `Salary payment for ${recipientName} - Period: ${periodStart} to ${periodEnd}`;
      }
      
      // Use the authenticated user's ID instead of a hardcoded value
      const transactionData: CreateTransactionFromSalaryPaymentDto = {
        salaryPaymentId: salaryPaymentId,
        createdById: userId, // Use the retrieved user ID
        customDescription: customDescription
      }
      
      console.log("Creating transaction with authenticated user ID:", userId)
      
      console.log("Creating transaction from salary payment with data:", transactionData)
      
      const result = await dispatch(createTransactionFromSalaryPayment(transactionData)).unwrap()
      console.log("Transaction created successfully from salary payment:", result)
      
      // Show success toast notification
      showToast(
        "Transaction created successfully from salary payment.",
        "success",
        "Transaction Created"
      )
      
      // Refresh transactions and salary payments
      dispatch(fetchTransactions())
      dispatch(fetchSalaryPayments())
    } catch (err: any) {
      console.error("Failed to create transaction from salary payment:", err)
      
      // Log detailed error information to help diagnose the issue
      console.error("Error details:", {
        response: err.response,
        status: err.status || err.statusCode,
        data: err.data,
        message: err.message,
        userId,
        fullError: err
      });
      
      // Try to get more detailed error message from the response if available
      const serverErrorMessage = err.response?.data?.message || err.data?.message;
      const detailedError = serverErrorMessage || err.message || "Failed to create transaction. Please try again.";
      
      console.log("Detailed API error:", detailedError);
      // Log the actual data that was attempted to be sent to the API
      console.log("Request data that was being sent to the API endpoint:");
      
      // Show error toast notification with more details if available
      showToast(
        `Error: ${detailedError}`,
        "error",
        "Transaction Creation Failed"
      )
    }
  }
  
  // Filter transactions based on search term, category, and type
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategory === "all" || transaction.category.toString().toLowerCase() === selectedCategory.toLowerCase()
    const matchesType = selectedType === "all" || transaction.type.toString().toLowerCase() === selectedType.toLowerCase()
    return matchesSearch && matchesCategory && matchesType
  })

  // No filteredPaymentRequests needed

  const getTypeColor = (type: TransactionType) => {
    return type === TransactionType.INCOME
      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
  }

  const getStatusColor = (status: TransactionPaymentStatus) => {
    switch (status) {
      case TransactionPaymentStatus.PAID:
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case TransactionPaymentStatus.PENDING:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case TransactionPaymentStatus.APPROVED:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  // No payment-related functions needed

  const totalIncome = transactions.filter((t) => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = Math.abs(transactions.filter((t) => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0))
  const netProfit = totalIncome - totalExpenses

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Toast Notification */}
      <ToastNotification toast={toastState} onClose={hideToast} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Track and manage all financial transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white dark:bg-gray-800">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white" 
            onClick={() => setIsCreateSalaryPaymentDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Salary Payment
          </Button>
          <Button 
            className="bg-blue-800 hover:bg-blue-900 text-white" 
            onClick={() => setIsCreateTransactionDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create from Acquisition
          </Button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">${totalIncome.toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1">+12.5% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">${totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-red-600 mt-1">+5.2% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-800" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">${netProfit.toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1">+18.2% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Latest Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {transactions.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total recorded transactions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="salary-payments">Salary Payments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Recent Transactions</CardTitle>
              <CardDescription>View and manage all financial transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value={TransactionCategory.EQUIPMENT}>Equipment</SelectItem>
                    <SelectItem value={TransactionCategory.RENTAL}>Rental</SelectItem>
                    <SelectItem value={TransactionCategory.SALARY}>Salary</SelectItem>
                    <SelectItem value={TransactionCategory.SPONSORSHIP}>Sponsorship</SelectItem>
                    <SelectItem value={TransactionCategory.REGISTRATION}>Registration</SelectItem>
                    <SelectItem value={TransactionCategory.UTILITY}>Utility</SelectItem>
                    <SelectItem value={TransactionCategory.DONATION}>Donation</SelectItem>
                    <SelectItem value={TransactionCategory.OTHER}>Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value={TransactionType.INCOME}>Income</SelectItem>
                    <SelectItem value={TransactionType.EXPENSE}>Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Transactions Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          <div className="flex justify-center items-center">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-500 mr-2" />
                            <span>Loading transactions...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No transactions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell className="font-medium">{transaction.description}</TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell>
                            <Badge className={getTypeColor(transaction.type)}>{transaction.type}</Badge>
                          </TableCell>
                          <TableCell className={transaction.type === TransactionType.INCOME ? "text-green-600" : "text-red-600"}>
                            ${Math.abs(transaction.amount).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="salary-payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Salary Payments</CardTitle>
              <CardDescription>View and manage salary payments for players and staff</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex justify-between items-center mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search salary payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white ml-2" 
                  onClick={() => setIsCreateSalaryPaymentDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Salary Payment
                </Button>
              </div>

              {/* Salary Payments Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Gross Amount</TableHead>
                      <TableHead>Tax Amount</TableHead>
                      <TableHead>Net Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          <div className="flex justify-center items-center">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-500 mr-2" />
                            <span>Loading salary payments...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : !salaryPayments || salaryPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          No salary payments found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      salaryPayments.map((payment) => {
                        // Use recipient details directly from API response if available
                        // Fall back to our local state if not available
                        const playerInfo = payment.player || (payment.playerId ? players.find(p => p.id === payment.playerId) : null);
                        const staffInfo = payment.staff || (payment.staffId ? staff.find(s => s.id === payment.staffId) : null);
                        const recipientName = playerInfo 
                          ? `${playerInfo.firstName} ${playerInfo.lastName} (Player)` 
                          : staffInfo 
                            ? `${staffInfo.firstName} ${staffInfo.lastName} (${staffInfo.role})` 
                            : 'Unknown';
                        
                        return (
                          <TableRow key={payment.id}>
                            <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                            <TableCell className="font-medium">{recipientName}</TableCell>
                            <TableCell>
                              {new Date(payment.periodStart).toLocaleDateString()} - {new Date(payment.periodEnd).toLocaleDateString()}
                            </TableCell>
                            <TableCell>${payment.amount.toLocaleString()}</TableCell>
                            <TableCell>${payment.taxAmount.toLocaleString()}</TableCell>
                            <TableCell>${payment.netAmount.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                            </TableCell>
                            <TableCell>
                              {payment.status === TransactionPaymentStatus.PENDING && (
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  className="border-blue-300 hover:bg-blue-100"
                                  onClick={() => handleCreateTransactionFromSalaryPayment(payment.id)}
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Create Transaction
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Monthly Income vs Expenses</CardTitle>
                <CardDescription>Financial performance over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="income" fill="#10B981" name="Income" />
                    <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Profit Trend</CardTitle>
                <CardDescription>Net profit trend over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="income" stroke="#1E3A8A" strokeWidth={2} name="Profit" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Budget Planning</CardTitle>
              <CardDescription>Set and track budgets for different categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">Budget planning features coming soon...</p>
                <Button className="mt-4 bg-blue-800 hover:bg-blue-900 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Budget
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Transaction Dialog */}
      <Dialog open={isCreateTransactionDialogOpen} onOpenChange={setIsCreateTransactionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Transaction from Pending Acquisition</DialogTitle>
            <DialogDescription>
              Select a pending acquisition to create a financial transaction.
              The acquisition will be approved automatically when the transaction is created.
              The transaction will use the current date and will be created with your user ID.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isLoadingAcquisitions ? (
              <div className="flex flex-col justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
                <span className="text-gray-600">Loading pending acquisitions...</span>
                <p className="text-xs text-gray-500 mt-1">Please wait while we retrieve the pending acquisitions data</p>
              </div>
            ) : acquisitionError ? (
              <div className="py-4 text-center bg-red-50 p-4 rounded-md border border-red-200">
                <p className="text-red-600 mb-3">{acquisitionError}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchPendingAcquisitionsData}
                  className="mt-2 border-red-300 hover:bg-red-100"
                >
                  <RefreshCcw className="h-4 w-4 mr-1" />
                  Retry Loading Acquisitions
                </Button>
              </div>
            ) : pendingAcquisitions.length === 0 ? (
              <div className="py-4 text-center bg-blue-50 p-4 rounded-md border border-blue-200">
                <p className="text-blue-600 mb-3">No pending acquisitions found</p>
                <p className="text-sm text-gray-600">There are no pending acquisitions available to create transactions from.</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchPendingAcquisitionsData}
                  className="mt-3 border-blue-300 hover:bg-blue-100"
                >
                  <RefreshCcw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="acquisition">Pending Acquisition</Label>
                  <Select 
                    value={selectedAcquisitionId?.toString() || ""} 
                    onValueChange={(value) => setSelectedAcquisitionId(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a pending acquisition" />
                    </SelectTrigger>
                    <SelectContent>
                      {pendingAcquisitions.map((acq) => (
                        <SelectItem key={acq.id} value={acq.id.toString()}>
                          {acq.description} - ${acq.cost} ({acq.itemType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Custom Description (Optional)</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Additional details about this transaction"
                    value={transactionDescription}
                    onChange={(e) => setTransactionDescription(e.target.value)}
                  />
                </div>
              </div>
            )}
            </div>

          {transactionError && (
            <div className="bg-red-50 p-3 rounded-md border border-red-200">
              <p className="text-red-600 text-sm font-medium">{transactionError}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTransactionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTransaction} 
              disabled={!selectedAcquisitionId || isSubmittingTransaction}
              className="bg-blue-800 hover:bg-blue-900 text-white min-w-[150px]"
            >
              {isSubmittingTransaction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Approve & Create Transaction"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Salary Payment Dialog */}
      <Dialog open={isCreateSalaryPaymentDialogOpen} onOpenChange={setIsCreateSalaryPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create New Salary Payment</DialogTitle>
            <DialogDescription>
              Create a new salary payment for a player or staff member.
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
                Recipient Type*
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
                  <Label htmlFor="playerType" className="cursor-pointer">Player</Label>
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
                Recipient*
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
                Gross Amount*
              </Label>
              <div className="col-span-3 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
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
                Payment Date*
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
                Period Start*
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
                Period End*
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
                Bonus
              </Label>
              <div className="col-span-3 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
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
                Tax Amount*
              </Label>
              <div className="col-span-3 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
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
                Net Amount*
              </Label>
              <div className="col-span-3 relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
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
              Cancel
            </Button>
            <Button
              onClick={handleCreateSalaryPayment}
              disabled={isSubmittingSalaryPayment}
            >
              {isSubmittingSalaryPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Salary Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
