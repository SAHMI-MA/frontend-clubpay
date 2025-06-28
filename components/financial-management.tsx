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
import { 
  fetchTransactions, 
  createTransactionFromAcquisition,
  updateTransactionStatus
} from "@/lib/redux/financialSlice"
import { 
  Transaction, 
  TransactionType, 
  TransactionCategory, 
  PaymentStatus as TransactionPaymentStatus,
  CreateTransactionFromAcquisitionDto 
} from "@/lib/types/financial-management"
import { 
  fetchPendingApprovals,
  approveOrRejectAcquisition
} from "@/lib/redux/acquisitionSlice"
import { 
  Acquisition, 
  ApprovalStatus,
  ApprovalDto
} from "@/lib/types/supplier-management"
import { api } from "@/lib/api"

// Enums for legacy payment management UI
enum PaymentType {
  ACQUISITION = "Acquisition",
  SALARY = "Salary",
  UTILITY = "Utility",
  OTHER = "Other",
}

// Interfaces
interface PaymentRequest {
  id: number
  type: PaymentType
  description: string
  amount: number
  requestedBy: string
  requestDate: string
  dueDate: string
  status: TransactionPaymentStatus
  approvedBy?: string
  approvedDate?: string
  paidDate?: string
  notes?: string
  category: string
  supplier?: string
  acquisitionId?: number
}

const monthlyData = [
  { month: "Jul", income: 15000, expenses: 12000 },
  { month: "Aug", income: 18000, expenses: 14000 },
  { month: "Sep", income: 22000, expenses: 16000 },
  { month: "Oct", income: 19000, expenses: 15000 },
  { month: "Nov", income: 25000, expenses: 18000 },
  { month: "Dec", income: 28000, expenses: 20000 },
]

// We'll replace these with real data from acquisitions
const samplePaymentRequests: PaymentRequest[] = [
  {
    id: 1,
    type: PaymentType.ACQUISITION,
    description: "Professional Soccer Balls (Set of 20)",
    amount: 800,
    requestedBy: "Coach Martinez",
    requestDate: "2024-01-15",
    dueDate: "2024-01-25",
    status: TransactionPaymentStatus.PENDING,
    category: "Equipment",
    supplier: "SportsTech Equipment",
    acquisitionId: 1,
    notes: "High-quality match balls for upcoming season",
  },
  {
    id: 2,
    type: PaymentType.ACQUISITION,
    description: "Team Jerseys (Custom Design)",
    amount: 1125,
    requestedBy: "Team Manager",
    requestDate: "2024-01-13",
    dueDate: "2024-02-01",
    status: TransactionPaymentStatus.APPROVED,
    approvedBy: "Finance Manager",
    approvedDate: "2024-01-14",
    category: "Apparel",
    supplier: "Athletic Gear Pro",
    acquisitionId: 3,
    notes: "New season jerseys with updated sponsor logos",
  },
  {
    id: 3,
    type: PaymentType.SALARY,
    description: "Coach Salary - February",
    amount: 3200,
    requestedBy: "HR Department",
    requestDate: "2024-01-28",
    dueDate: "2024-02-01",
    status: TransactionPaymentStatus.PAID,
    approvedBy: "Finance Manager",
    approvedDate: "2024-01-29",
    paidDate: "2024-02-01",
    category: "Salaries",
  },
  {
    id: 4,
    type: PaymentType.UTILITY,
    description: "Facility Electricity Bill",
    amount: 450,
    requestedBy: "Facility Manager",
    requestDate: "2024-01-20",
    dueDate: "2024-01-30",
    status: TransactionPaymentStatus.REJECTED,
    category: "Utilities",
    notes: "Rejected due to incomplete documentation",
  },
]

export function FinancialManagement() {
  const dispatch = useAppDispatch()
  
  // Toast notification state
  const { toastState, showToast, hideToast } = useToast();
  
  // State for managing the UI
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("all")
  const [viewingPayment, setViewingPayment] = useState<PaymentRequest | null>(null)
  
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
  
  // Get transactions from the Redux store
  const { transactions, loading, error } = useAppSelector((state) => state.financial)
  
  // Legacy sample data for the payments tab until we fully migrate
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(samplePaymentRequests)

  // Fetch transactions and pending acquisitions on component mount
  useEffect(() => {
    dispatch(fetchTransactions())
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
    
    setIsSubmittingTransaction(true)
    setTransactionError(null)
    
    try {
      // First, approve the acquisition
      console.log("Approving acquisition:", selectedAcquisitionId)
      const approvalData: ApprovalDto = {
        approvalStatus: ApprovalStatus.APPROVED,
        approverId: 1, // Using default user ID 1
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
        createdById: 1, // Using a default userId of 1 since we don't have user context
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
  
  // Filter transactions based on search term, category, and type
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategory === "all" || transaction.category.toString().toLowerCase() === selectedCategory.toLowerCase()
    const matchesType = selectedType === "all" || transaction.type.toString().toLowerCase() === selectedType.toLowerCase()
    return matchesSearch && matchesCategory && matchesType
  })

  // Filter payment requests based on search term and status
  const filteredPaymentRequests = paymentRequests.filter((payment) => {
    const matchesSearch =
      payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      selectedPaymentStatus === "all" || payment.status.toLowerCase() === selectedPaymentStatus.toLowerCase()
    return matchesSearch && matchesStatus
  })

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

  const getPaymentStatusColor = (status: TransactionPaymentStatus) => {
    switch (status) {
      case TransactionPaymentStatus.PENDING:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case TransactionPaymentStatus.APPROVED:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case TransactionPaymentStatus.REJECTED:
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case TransactionPaymentStatus.PAID:
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const handleApprovePayment = (id: number) => {
    // Find the payment to get its name for the toast message
    const paymentToApprove = paymentRequests.find(payment => payment.id === id);
    const paymentName = paymentToApprove?.description || `Payment #${id}`;
    
    setPaymentRequests(
      paymentRequests.map((payment) =>
        payment.id === id
          ? {
              ...payment,
              status: TransactionPaymentStatus.APPROVED,
              approvedBy: "Finance Manager",
              approvedDate: new Date().toISOString().split("T")[0],
            }
          : payment,
      ),
    )
    
    // Show success toast notification
    showToast(
      `${paymentName} has been approved successfully.`,
      "success",
      "Payment Approved"
    );
  }

  const handleRejectPayment = (id: number) => {
    // Find the payment to get its name for the toast message
    const paymentToReject = paymentRequests.find(payment => payment.id === id);
    const paymentName = paymentToReject?.description || `Payment #${id}`;
    
    setPaymentRequests(
      paymentRequests.map((payment) =>
        payment.id === id
          ? {
              ...payment,
              status: TransactionPaymentStatus.REJECTED,
              notes: "Rejected by Finance Manager",
            }
          : payment,
      ),
    )
    
    // Show info toast notification
    showToast(
      `${paymentName} has been rejected.`,
      "info",
      "Payment Rejected"
    );
  }

  const handleMarkAsPaid = (id: number) => {
    // Find the payment to get its name for the toast message
    const paymentToPaid = paymentRequests.find(payment => payment.id === id);
    const paymentName = paymentToPaid?.description || `Payment #${id}`;
    
    setPaymentRequests(
      paymentRequests.map((payment) =>
        payment.id === id
          ? {
              ...payment,
              status: TransactionPaymentStatus.PAID,
              paidDate: new Date().toISOString().split("T")[0],
            }
          : payment,
      ),
    )
    
    // Show success toast notification
    showToast(
      `${paymentName} has been marked as paid.`,
      "success",
      "Payment Completed"
    );
  }

  const totalIncome = transactions.filter((t) => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = Math.abs(transactions.filter((t) => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0))
  const netProfit = totalIncome - totalExpenses

  const pendingPayments = paymentRequests.filter((p) => p.status === TransactionPaymentStatus.PENDING)
  const approvedPayments = paymentRequests.filter((p) => p.status === TransactionPaymentStatus.APPROVED)
  const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalApprovedAmount = approvedPayments.reduce((sum, p) => sum + p.amount, 0)

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
          <Button className="bg-blue-800 hover:bg-blue-900 text-white" onClick={() => setIsCreateTransactionDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Approve & Create Transaction
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
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${totalPendingAmount.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{pendingPayments.length} pending requests</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
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

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Payment Requests</CardTitle>
              <CardDescription>
                Approve and manage payment requests from acquisitions and other expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Payment Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search payment requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Requests Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPaymentRequests.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{payment.description}</span>
                            {payment.supplier && (
                              <span className="text-xs text-gray-500">Supplier: {payment.supplier}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{payment.type}</TableCell>
                        <TableCell className="font-medium">${payment.amount.toLocaleString()}</TableCell>
                        <TableCell>{payment.requestedBy}</TableCell>
                        <TableCell>{payment.dueDate}</TableCell>
                        <TableCell>
                          <Badge className={getPaymentStatusColor(payment.status)}>{payment.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setViewingPayment(payment)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {payment.status === TransactionPaymentStatus.PENDING && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApprovePayment(payment.id)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRejectPayment(payment.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {payment.status === TransactionPaymentStatus.APPROVED && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsPaid(payment.id)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                Mark Paid
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total: ${totalPendingAmount.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Approved Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{approvedPayments.length}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total: ${totalApprovedAmount.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Paid This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {paymentRequests.filter((p) => p.status === TransactionPaymentStatus.PAID).length}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total: $
                  {paymentRequests
                    .filter((p) => p.status === TransactionPaymentStatus.PAID)
                    .reduce((sum, p) => sum + p.amount, 0)
                    .toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
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
      
      {/* View Payment Dialog */}
      <Dialog open={!!viewingPayment} onOpenChange={() => setViewingPayment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Request Details</DialogTitle>
            <DialogDescription>View payment request information and approval history</DialogDescription>
          </DialogHeader>
          {viewingPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</Label>
                  <p className="text-sm font-medium">{viewingPayment.description}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Type</Label>
                  <p className="text-sm font-medium">{viewingPayment.type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount</Label>
                  <p className="text-sm font-medium">${viewingPayment.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</Label>
                  <Badge className={getPaymentStatusColor(viewingPayment.status)}>{viewingPayment.status}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Requested By</Label>
                  <p className="text-sm font-medium">{viewingPayment.requestedBy}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Request Date</Label>
                  <p className="text-sm font-medium">{viewingPayment.requestDate}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Due Date</Label>
                  <p className="text-sm font-medium">{viewingPayment.dueDate}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</Label>
                  <p className="text-sm font-medium">{viewingPayment.category}</p>
                </div>
                {viewingPayment.supplier && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Supplier</Label>
                    <p className="text-sm font-medium">{viewingPayment.supplier}</p>
                  </div>
                )}
                {viewingPayment.approvedBy && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved By</Label>
                    <p className="text-sm font-medium">{viewingPayment.approvedBy}</p>
                  </div>
                )}
                {viewingPayment.approvedDate && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved Date</Label>
                    <p className="text-sm font-medium">{viewingPayment.approvedDate}</p>
                  </div>
                )}
                {viewingPayment.paidDate && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid Date</Label>
                    <p className="text-sm font-medium">{viewingPayment.paidDate}</p>
                  </div>
                )}
              </div>
              {viewingPayment.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Notes</Label>
                  <p className="text-sm mt-1">{viewingPayment.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingPayment(null)}>
              Close
            </Button>
            {viewingPayment?.status === TransactionPaymentStatus.PENDING && (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    handleApprovePayment(viewingPayment.id)
                    setViewingPayment(null)
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => {
                    handleRejectPayment(viewingPayment.id)
                    setViewingPayment(null)
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}
            {viewingPayment?.status === TransactionPaymentStatus.APPROVED && (
              <Button
                onClick={() => {
                  handleMarkAsPaid(viewingPayment.id)
                  setViewingPayment(null)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Mark as Paid
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
