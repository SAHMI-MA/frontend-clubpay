"use client"

import { useState, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { 
  fetchTransactions, 
  fetchTransactionsByFilter, 
  updateTransactionStatus,
  createTransaction,
  setSelectedTransaction,
  fetchFinancialReports,
  generateFinancialReport
} from "@/lib/redux/financialSlice"
import { 
  Transaction, 
  TransactionType, 
  TransactionCategory, 
  PaymentStatus,
  CreateTransactionDto,
  UpdatePaymentStatusDto,
  TransactionFilterDto
} from "@/lib/types/financial-management"
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
  AlertCircle, Calendar, Check, CreditCard, DollarSign, Download, Eye, Filter, 
  Plus, Search, TrendingDown, TrendingUp, X
} from "lucide-react"

// For chart visualization
const monthlyData = [
  { month: "Jul", income: 15000, expenses: 12000 },
  { month: "Aug", income: 18000, expenses: 14000 },
  { month: "Sep", income: 22000, expenses: 16000 },
  { month: "Oct", income: 19000, expenses: 15000 },
  { month: "Nov", income: 25000, expenses: 18000 },
  { month: "Dec", income: 28000, expenses: 20000 },
]

// Helper functions to format data for display
const formatTransactionType = (type: TransactionType): string => {
  switch (type) {
    case TransactionType.INCOME:
      return 'Income';
    case TransactionType.EXPENSE:
      return 'Expense';
    default:
      return type;
  }
}

const formatTransactionCategory = (category: TransactionCategory): string => {
  switch (category) {
    case TransactionCategory.RENTAL:
      return 'Rental';
    case TransactionCategory.SALARY:
      return 'Salary';
    case TransactionCategory.DONATION:
      return 'Donation';
    case TransactionCategory.EQUIPMENT:
      return 'Equipment';
    case TransactionCategory.UTILITY:
      return 'Utility';
    case TransactionCategory.SPONSORSHIP:
      return 'Sponsorship';
    case TransactionCategory.REGISTRATION:
      return 'Registration';
    case TransactionCategory.OTHER:
      return 'Other';
    default:
      return category;
  }
}

const formatPaymentStatus = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.PENDING:
      return 'Pending';
    case PaymentStatus.APPROVED:
      return 'Approved';
    case PaymentStatus.REJECTED:
      return 'Rejected';
    case PaymentStatus.PAID:
      return 'Paid';
    default:
      return status;
  }
}

export function FinancialManagement() {
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("all")
  const [filterStartDate, setFilterStartDate] = useState<string>("")
  const [filterEndDate, setFilterEndDate] = useState<string>("")
  
  // Dialog states
  const [isAddTransactionDialogOpen, setIsAddTransactionDialogOpen] = useState(false)
  const [isGenerateReportDialogOpen, setIsGenerateReportDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)

  // Form states for adding new transactions
  const [newTransaction, setNewTransaction] = useState<CreateTransactionDto>({
    type: TransactionType.EXPENSE,
    category: TransactionCategory.OTHER,
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: ""
  })

  // Form states for generating reports
  const [reportPeriod, setReportPeriod] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]
  })
  
  // Redux state
  const dispatch = useAppDispatch()
  const { 
    transactions, 
    filteredTransactions, 
    selectedTransaction, 
    financialReports, 
    loading, 
    error 
  } = useAppSelector((state) => state.financial)

  // Load data on component mount
  useEffect(() => {
    dispatch(fetchTransactions())
    dispatch(fetchFinancialReports())
  }, [dispatch])
  
  // Apply filters based on search term, category, type, and status
  useEffect(() => {
    const filters: TransactionFilterDto = {}
    
    if (selectedCategory !== "all") {
      filters.category = selectedCategory as TransactionCategory
    }
    
    if (selectedType !== "all") {
      filters.type = selectedType as TransactionType
    }
    
    if (selectedPaymentStatus !== "all") {
      filters.status = selectedPaymentStatus as PaymentStatus
    }
    
    if (filterStartDate) {
      filters.startDate = filterStartDate
    }
    
    if (filterEndDate) {
      filters.endDate = filterEndDate
    }
    
    // If we have any filters, fetch filtered transactions from the API
    if (Object.keys(filters).length > 0) {
      dispatch(fetchTransactionsByFilter(filters))
    }
  }, [dispatch, selectedCategory, selectedType, selectedPaymentStatus, filterStartDate, filterEndDate])
  
  // Local filtering for search term (client-side filtering for quick search)
  const localFilteredTransactions = searchTerm 
    ? filteredTransactions.filter(transaction => 
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.supplier?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    : filteredTransactions
    
  // Filter expense transactions as payment requests
  const filteredPaymentRequests = localFilteredTransactions.filter(transaction => 
    transaction.type === TransactionType.EXPENSE && 
    (selectedPaymentStatus === "all" || transaction.status.toLowerCase() === selectedPaymentStatus.toLowerCase())
  )

  const getTypeColor = (type: TransactionType) => {
    return type === TransactionType.INCOME
      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
  }

  const getCategoryColor = (category: TransactionCategory) => {
    switch (category) {
      case TransactionCategory.RENTAL:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case TransactionCategory.SALARY:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
      case TransactionCategory.DONATION:
        return "bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400"
      case TransactionCategory.EQUIPMENT:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      case TransactionCategory.UTILITY:
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400"
      case TransactionCategory.SPONSORSHIP:
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case TransactionCategory.REGISTRATION:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case PaymentStatus.APPROVED:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case PaymentStatus.REJECTED:
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case PaymentStatus.PAID:
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  // Handle transaction actions
  const handleViewTransaction = (transaction: Transaction) => {
    dispatch(setSelectedTransaction(transaction))
  }

  const handleApprovePayment = (id: number) => {
    dispatch(updateTransactionStatus({ 
      id, 
      status: PaymentStatus.APPROVED,
      notes: "Approved by Finance Manager" 
    }))
  }

  const handleRejectPayment = (id: number) => {
    dispatch(updateTransactionStatus({ 
      id, 
      status: PaymentStatus.REJECTED,
      notes: "Rejected by Finance Manager" 
    }))
  }

  const handleMarkAsPaid = (id: number) => {
    dispatch(updateTransactionStatus({ 
      id, 
      status: PaymentStatus.PAID,
      notes: "Marked as paid by Finance Manager" 
    }))
  }

  const handleAddTransaction = () => {
    dispatch(createTransaction(newTransaction))
      .unwrap()
      .then(() => {
        setIsAddTransactionDialogOpen(false)
        setNewTransaction({
          type: TransactionType.EXPENSE,
          category: TransactionCategory.OTHER,
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          description: ""
        })
      })
      .catch(error => {
        console.error("Failed to add transaction:", error)
      })
  }

  const handleGenerateReport = () => {
    dispatch(generateFinancialReport({
      periodStart: reportPeriod.startDate,
      periodEnd: reportPeriod.endDate
    }))
      .unwrap()
      .then(() => {
        setIsGenerateReportDialogOpen(false)
      })
      .catch(error => {
        console.error("Failed to generate report:", error)
      })
  }

  const handleApplyFilters = () => {
    const filters: TransactionFilterDto = {}
    
    if (selectedCategory !== "all") {
      filters.category = selectedCategory as TransactionCategory
    }
    
    if (selectedType !== "all") {
      filters.type = selectedType as TransactionType
    }
    
    if (selectedPaymentStatus !== "all") {
      filters.status = selectedPaymentStatus as PaymentStatus
    }
    
    if (filterStartDate) {
      filters.startDate = filterStartDate
    }
    
    if (filterEndDate) {
      filters.endDate = filterEndDate
    }
    
    dispatch(fetchTransactionsByFilter(filters))
    setIsFilterDialogOpen(false)
  }

  // Calculate statistics from transactions data
  const totalIncome = localFilteredTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpenses = localFilteredTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0)
  
  const netProfit = totalIncome - totalExpenses

  const pendingPayments = localFilteredTransactions
    .filter(t => t.status === PaymentStatus.PENDING && t.type === TransactionType.EXPENSE)
  
  const approvedPayments = localFilteredTransactions
    .filter(t => t.status === PaymentStatus.APPROVED && t.type === TransactionType.EXPENSE)
  
  const totalPendingAmount = pendingPayments.reduce((sum, t) => sum + t.amount, 0)
  const totalApprovedAmount = approvedPayments.reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Track income, expenses, and financial reports</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="bg-white dark:bg-gray-800" 
            onClick={() => setIsExportDialogOpen(true)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button 
            className="bg-blue-800 hover:bg-blue-900 text-white"
            onClick={() => setIsAddTransactionDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
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
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="salaries">Salaries</SelectItem>
                    <SelectItem value="sponsorship">Sponsorship</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Transactions Table */}
              <div className="flex justify-end mb-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsFilterDialogOpen(true)}
                  className="flex items-center gap-1"
                >
                  <Filter className="h-4 w-4" />
                  Advanced Filters
                </Button>
              </div>
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
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Loading transactions...
                        </TableCell>
                      </TableRow>
                    ) : localFilteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      localFilteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{transaction.description}</span>
                              {transaction.supplier && (
                                <span className="text-xs text-gray-500">
                                  Supplier: {transaction.supplier.name}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getCategoryColor(transaction.category)}>
                              {formatTransactionCategory(transaction.category)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTypeColor(transaction.type)}>
                              {formatTransactionType(transaction.type)}
                            </Badge>
                          </TableCell>
                          <TableCell className={transaction.type === TransactionType.INCOME ? "text-green-600" : "text-red-600"}>
                            ${Math.abs(transaction.amount).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getPaymentStatusColor(transaction.status)}>
                              {formatPaymentStatus(transaction.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewTransaction(transaction)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {transaction.status === PaymentStatus.PENDING && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleApprovePayment(transaction.id)}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRejectPayment(transaction.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {transaction.status === PaymentStatus.APPROVED && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsPaid(transaction.id)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  Mark Paid
                                </Button>
                              )}
                            </div>
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
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Loading payment requests...
                        </TableCell>
                      </TableRow>
                    ) : filteredPaymentRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No payment requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPaymentRequests.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{payment.description}</span>
                              {payment.supplier && (
                                <span className="text-xs text-gray-500">
                                  Supplier: {payment.supplier.name}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTypeColor(payment.type)}>
                              {formatTransactionType(payment.type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">${payment.amount.toLocaleString()}</TableCell>
                          <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge className={getCategoryColor(payment.category)}>
                              {formatTransactionCategory(payment.category)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPaymentStatusColor(payment.status)}>{formatPaymentStatus(payment.status)}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewTransaction(payment)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {payment.status === PaymentStatus.PENDING && (
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
                              {payment.status === PaymentStatus.APPROVED && (
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
                      ))
                    )}
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
                {/* Filter expense transactions that are paid */}
                <div className="text-2xl font-bold text-green-600">
                  {localFilteredTransactions.filter(t => 
                    t.type === TransactionType.EXPENSE && t.status === PaymentStatus.PAID
                  ).length}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total: $
                  {localFilteredTransactions
                    .filter(t => t.type === TransactionType.EXPENSE && t.status === PaymentStatus.PAID)
                    .reduce((sum, t) => sum + t.amount, 0)
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

      {/* View Transaction Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && dispatch(setSelectedTransaction(null))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>View transaction information and approval history</DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</Label>
                  <p className="text-sm font-medium">{selectedTransaction.description}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Type</Label>
                  <p className="text-sm font-medium">{formatTransactionType(selectedTransaction.type)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount</Label>
                  <p className="text-sm font-medium">${selectedTransaction.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</Label>
                  <Badge className={getPaymentStatusColor(selectedTransaction.status)}>
                    {formatPaymentStatus(selectedTransaction.status)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date</Label>
                  <p className="text-sm font-medium">{new Date(selectedTransaction.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</Label>
                  <p className="text-sm font-medium">{formatTransactionCategory(selectedTransaction.category)}</p>
                </div>
                {selectedTransaction.createdBy && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Created By</Label>
                    <p className="text-sm font-medium">{selectedTransaction.createdBy.lastName}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Created At</Label>
                  <p className="text-sm font-medium">{new Date(selectedTransaction.createdAt).toLocaleDateString()}</p>
                </div>
                {selectedTransaction.supplier && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Supplier</Label>
                    <p className="text-sm font-medium">{selectedTransaction.supplier.name}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => dispatch(setSelectedTransaction(null))}>
              Close
            </Button>
            {selectedTransaction?.status === PaymentStatus.PENDING && (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    handleApprovePayment(selectedTransaction.id)
                    dispatch(setSelectedTransaction(null))
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => {
                    handleRejectPayment(selectedTransaction.id)
                    dispatch(setSelectedTransaction(null))
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}
            {selectedTransaction?.status === PaymentStatus.APPROVED && (
              <Button
                onClick={() => {
                  handleMarkAsPaid(selectedTransaction.id)
                  dispatch(setSelectedTransaction(null))
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Mark as Paid
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Transaction Dialog */}
      <Dialog open={isAddTransactionDialogOpen} onOpenChange={setIsAddTransactionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
            <DialogDescription>Create a new financial transaction record</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="transaction-type">Transaction Type</Label>
              <Select 
                value={newTransaction.type} 
                onValueChange={(value) => setNewTransaction({ ...newTransaction, type: value as TransactionType })}
              >
                <SelectTrigger id="transaction-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TransactionType.INCOME}>Income</SelectItem>
                  <SelectItem value={TransactionType.EXPENSE}>Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="transaction-category">Category</Label>
              <Select 
                value={newTransaction.category} 
                onValueChange={(value) => setNewTransaction({ ...newTransaction, category: value as TransactionCategory })}
              >
                <SelectTrigger id="transaction-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TransactionCategory.RENTAL}>Rental</SelectItem>
                  <SelectItem value={TransactionCategory.SALARY}>Salary</SelectItem>
                  <SelectItem value={TransactionCategory.DONATION}>Donation</SelectItem>
                  <SelectItem value={TransactionCategory.EQUIPMENT}>Equipment</SelectItem>
                  <SelectItem value={TransactionCategory.UTILITY}>Utility</SelectItem>
                  <SelectItem value={TransactionCategory.SPONSORSHIP}>Sponsorship</SelectItem>
                  <SelectItem value={TransactionCategory.REGISTRATION}>Registration</SelectItem>
                  <SelectItem value={TransactionCategory.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="transaction-amount">Amount</Label>
              <Input 
                id="transaction-amount"
                type="number"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ 
                  ...newTransaction, 
                  amount: parseFloat(e.target.value) || 0 
                })}
              />
            </div>
            
            <div>
              <Label htmlFor="transaction-date">Date</Label>
              <Input 
                id="transaction-date"
                type="date"
                value={newTransaction.date}
                onChange={(e) => setNewTransaction({ 
                  ...newTransaction, 
                  date: e.target.value 
                })}
              />
            </div>
            
            <div>
              <Label htmlFor="transaction-description">Description</Label>
              <Textarea 
                id="transaction-description"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ 
                  ...newTransaction, 
                  description: e.target.value 
                })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTransactionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTransaction}>Add Transaction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Generate Report Dialog */}
      <Dialog open={isGenerateReportDialogOpen} onOpenChange={setIsGenerateReportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Financial Report</DialogTitle>
            <DialogDescription>Create a financial report for a specific period</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="report-start-date">Start Date</Label>
              <Input 
                id="report-start-date"
                type="date"
                value={reportPeriod.startDate}
                onChange={(e) => setReportPeriod({ 
                  ...reportPeriod, 
                  startDate: e.target.value 
                })}
              />
            </div>
            
            <div>
              <Label htmlFor="report-end-date">End Date</Label>
              <Input 
                id="report-end-date"
                type="date"
                value={reportPeriod.endDate}
                onChange={(e) => setReportPeriod({ 
                  ...reportPeriod, 
                  endDate: e.target.value 
                })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateReportDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerateReport}>Generate Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export Financial Data</DialogTitle>
            <DialogDescription>Export financial data to various formats</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="export-format">Format</Label>
              <Select defaultValue="csv">
                <SelectTrigger id="export-format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="export-date-range">Date Range</Label>
              <Select defaultValue="current-month">
                <SelectTrigger id="export-date-range">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-month">Current Month</SelectItem>
                  <SelectItem value="previous-month">Previous Month</SelectItem>
                  <SelectItem value="current-quarter">Current Quarter</SelectItem>
                  <SelectItem value="current-year">Current Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsExportDialogOpen(false)}>Export</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Advanced Filter Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
            <DialogDescription>Filter transactions by various criteria</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="filter-start-date">Start Date</Label>
              <Input 
                id="filter-start-date"
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="filter-end-date">End Date</Label>
              <Input 
                id="filter-end-date"
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="filter-category">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="filter-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.values(TransactionCategory).map((category) => (
                    <SelectItem key={category} value={category}>
                      {formatTransactionCategory(category as TransactionCategory)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="filter-type">Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger id="filter-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.values(TransactionType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatTransactionType(type as TransactionType)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="filter-status">Status</Label>
              <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                <SelectTrigger id="filter-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.values(PaymentStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatPaymentStatus(status as PaymentStatus)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFilterDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleApplyFilters}>Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
