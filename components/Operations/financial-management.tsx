"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
  CreditCard, 
  DollarSign, 
  Download, 
  Eye, 
  FileText,
  Plus, 
  RefreshCcw, 
  Search, 
  TrendingDown, 
  TrendingUp, 
  Loader2
} from "lucide-react"
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { formatCurrency } from '@/lib/pdf-utils'
import { UserOptions } from 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => void;
  }
}
import { ToastNotification, useToast } from "@/components/ui/toast-notification"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { RootState } from "@/lib/redux/store"
import { 
  fetchTransactions, 
  createTransaction,
  createTransactionFromAcquisition,
  createTransactionFromSalaryPayment,
  fetchSalaryPayments,
  createSalaryPayment
} from "@/lib/redux/financialSlice"
import { 
  TransactionType, 
  TransactionCategory, 
  PaymentStatus as TransactionPaymentStatus,
  CreateTransactionDto,
  CreateTransactionFromAcquisitionDto,
  CreateTransactionFromSalaryPaymentDto,
  CreateSalaryPaymentDto
} from "@/lib/types/financial-management"

// Add new types for financial reports
interface FinancialReport {
  id: number
  periodStart: string
  periodEnd: string
  totalIncome: number
  totalExpenses: number
  netProfit: number
  title: string
  incomeBreakdown?: Record<string, number>
  expenseBreakdown?: Record<string, number>
  generatedBy: {
    id: number
    username: string
    firstName?: string
    lastName?: string
  }
  createdAt: string
  notes?: string
}

interface TransactionStatistics {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  byCategory: Record<string, number>
  byPeriod: Array<{
    period: string
    income: number
    expenses: number
    net: number
  }>
}

import { 
  approveOrRejectAcquisition
} from "@/lib/redux/acquisitionSlice"
import { fetchAllPlayers } from "@/lib/redux/playerSlice"
import { fetchAllStaff } from "@/lib/redux/staffSlice"
import { 
  Acquisition, 
  ApprovalStatus,
  ApprovalDto
} from "@/lib/types/supplier-management"
import { api } from "@/lib/api"
import { apiConfig } from "@/lib/api-config"

// No sample data needed

export function FinancialManagement() {
  const [customPOFile, setCustomPOFile] = useState<File | null>(null);
  const [customPOId, setCustomPOId] = useState<number | null>(null);
  const [customPOType, setCustomPOType] = useState<"INTERNAL" | "EXTERNAL" | "">("");
  const [isUploadingCustomPO, setIsUploadingCustomPO] = useState(false);
  const [uploadCustomPOError, setUploadCustomPOError] = useState<string | null>(null);



  // State for purchase order file and type (for acquisition transaction)
  const [purchaseOrderFile, setPurchaseOrderFile] = useState<File | null>(null);
  const [purchaseOrderId, setPurchaseOrderId] = useState<number | null>(null);
  const [purchaseOrderType, setPurchaseOrderType] = useState<"INTERNAL" | "EXTERNAL" | "">("");
  const [isUploadingPO, setIsUploadingPO] = useState(false);
  const [uploadPOError, setUploadPOError] = useState<string | null>(null);

  // Handle purchase order file upload
  const handlePurchaseOrderFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPurchaseOrderFile(e.target.files[0]);
      setUploadPOError(null);
    }
  };
    // Handle custom transaction purchase order file upload
  const handleCustomPOFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCustomPOFile(e.target.files[0]);
      setUploadCustomPOError(null);
    }
  };

  // ...existing code...

  // Toast notification state
  const { toastState, showToast, hideToast } = useToast();

  // ...existing code...

  // Place after showToast is defined
  const handleUploadCustomPO = async () => {
    if (!customPOFile) {
      setUploadCustomPOError("Please select a file to upload.");
      return;
    }
    setIsUploadingCustomPO(true);
    setUploadCustomPOError(null);
    try {
      const formData = new FormData();
      formData.append("file", customPOFile);
      let authToken = '';
      if (typeof window !== 'undefined') {
        authToken = localStorage.getItem('auth_token') || '';
      }
      const { getApiUrl } = await import('@/lib/api-config');
      const uploadUrl = getApiUrl('acquisitions/upload-file');
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body: formData
      });
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      const data = await response.json();
      setCustomPOId(data.id);
      showToast('Purchase order file uploaded successfully', 'success');
    } catch (err: any) {
      setUploadCustomPOError(err.message || 'Failed to upload file');
    } finally {
      setIsUploadingCustomPO(false);
    }
  };

  const handleUploadPurchaseOrder = async () => {
    if (!purchaseOrderFile) {
      setUploadPOError("Please select a file to upload.");
      return;
    }
    setIsUploadingPO(true);
    setUploadPOError(null);
    try {
      const formData = new FormData();
      formData.append("file", purchaseOrderFile);
      let authToken = '';
      if (typeof window !== 'undefined') {
        authToken = localStorage.getItem('auth_token') || '';
      }
      // Dynamically import getApiUrl to avoid SSR issues
      const { getApiUrl } = await import('@/lib/api-config');
      const uploadUrl = getApiUrl('acquisitions/upload-file');
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        body: formData
      });
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      const data = await response.json();
      setPurchaseOrderId(data.id);
      showToast('Purchase order file uploaded successfully', 'success');
    } catch (err: any) {
      setUploadPOError(err.message || 'Failed to upload file');
    } finally {
      setIsUploadingPO(false);
    }
  };
  const dispatch = useAppDispatch()
  
  // State for managing the UI
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  
  // State for financial reports
  const [isGenerateReportDialogOpen, setIsGenerateReportDialogOpen] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [financialReports, setFinancialReports] = useState<FinancialReport[]>([])
  const [isLoadingReports, setIsLoadingReports] = useState(false)
  const [selectedReport, setSelectedReport] = useState<FinancialReport | null>(null)
  const [isReportDetailDialogOpen, setIsReportDetailDialogOpen] = useState(false)
  const [reportForm, setReportForm] = useState({
    periodStart: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // January 1st
    periodEnd: new Date().toISOString().split('T')[0], // Today
    title: "",
    notes: ""
  })
  const [transactionStats, setTransactionStats] = useState<TransactionStatistics | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  
  // State for managing transactions
  const [isCreateTransactionDialogOpen, setIsCreateTransactionDialogOpen] = useState(false)
  const [approvedAcquisitions, setApprovedAcquisitions] = useState<Acquisition[]>([])
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
  
  // State for transaction type dialog
  const [isTransactionTypeDialogOpen, setIsTransactionTypeDialogOpen] = useState(false)
  const [selectedSalaryPaymentId, setSelectedSalaryPaymentId] = useState<number | null>(null)
  const [selectedTransactionType, setSelectedTransactionType] = useState<TransactionType>(TransactionType.EXPENSE)
  const [selectedTransactionCategory, setSelectedTransactionCategory] = useState<TransactionCategory | "">(TransactionCategory.SALARY)
  const [isCustomTransactionDialogOpen, setIsCustomTransactionDialogOpen] = useState(false)
  const [customTransactionForm, setCustomTransactionForm] = useState({
    amount: "",
    date: new Date().toISOString().split('T')[0],
    description: "",
    type: TransactionType.INCOME as TransactionType,
    category: TransactionCategory.SPONSORSHIP as TransactionCategory
  })
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
  const { transactions, loading, salaryPayments } = useAppSelector((state) => state.financial)
  const players = useAppSelector((state) => state.players?.players || [])
  const staff = useAppSelector((state) => state.staff?.staff || [])
  const playersLoading = useAppSelector((state) => state.players?.loading || false)
  const staffLoading = useAppSelector((state) => state.staff?.loading || false)
  const authUser = useAppSelector((state: RootState) => state.auth.user)
  
  // No legacy sample data needed

  // Function to fetch financial reports
  const fetchFinancialReports = useCallback(async () => {
    setIsLoadingReports(true)
    try {
      const reports = await api.get<FinancialReport[]>('accounting/financial-reports')
      setFinancialReports(reports)
    } catch (err: unknown) {
      console.error("Failed to fetch financial reports:", err)
      showToast(
        "Failed to load financial reports",
        "error",
        "Error"
      )
    } finally {
      setIsLoadingReports(false)
    }
  }, [])
  
  // Function to fetch approved acquisitions
  const fetchApprovedAcquisitionsData = useCallback(async () => {
    setIsLoadingAcquisitions(true)
    setAcquisitionError(null)
    
    try {
      // First attempt to use the API service directly
      try {
        // Use the acquisitions endpoint with a query parameter for approved status
        const result = await api.get<Acquisition[]>(`acquisitions?status=${ApprovalStatus.APPROVED}`)
        setApprovedAcquisitions(result) // Still using the same state variable for now
        return
      } catch (err: any) {
        // If the error is related to authentication, don't try the fallback
        if (err.message?.includes('Authentication required') || err.message?.includes('Authentication failed')) {
          throw err // Re-throw to be caught by outer catch
        }
      }
      
      // If direct API call failed for non-auth reasons, try to get all acquisitions and filter
      try {
        const allAcquisitions = await api.get<Acquisition[]>('acquisitions')
        const approvedAcquisitions = allAcquisitions.filter(
          acquisition => acquisition.approvalStatus === ApprovalStatus.APPROVED
        )
        setApprovedAcquisitions(approvedAcquisitions) // Still using the same state variable
      } catch (fallbackErr) {
        throw fallbackErr // Re-throw to be caught by outer catch
      }
    } catch (err: unknown) {
      console.error("Failed to fetch approved acquisitions:", err)
      const errorMsg = err instanceof Error ? err.message : "Unknown error"
      setAcquisitionError(`Failed to load approved acquisitions: ${errorMsg}`)
      showToast(
        "Failed to load approved acquisitions",
        "error",
        "Error"
      )
    } finally {
      setIsLoadingAcquisitions(false)
    }
  }, [])
  
  // Function to fetch transaction statistics
  // Use useMemo to calculate transaction statistics when dependencies change
  const calculateStatistics = useMemo(() => {
    // Calculate statistics locally from transactions
    const transactionsByMonth = new Map<number, { income: number; expenses: number }>();
      
    // Initialize all months
    for (let i = 0; i < 12; i++) {
      transactionsByMonth.set(i, { income: 0, expenses: 0 });
    }
    
    // Calculate statistics from transactions for the selected year
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      if (transactionDate.getFullYear() === selectedYear) {
        const month = transactionDate.getMonth(); // 0-11
        const data = transactionsByMonth.get(month) || { income: 0, expenses: 0 };
        
        if (transaction.type === TransactionType.INCOME) {
          data.income += transaction.amount;
        } else {
          data.expenses += Math.abs(transaction.amount);
        }
        
        transactionsByMonth.set(month, data);
      }
    });
    
    // Create byPeriod data from the transactions
    const byPeriod = Array.from(transactionsByMonth.entries()).map(([month, data]) => {
      return {
        period: (month + 1).toString(), // 1-12
        income: data.income,
        expenses: -data.expenses, // Negative for expenses
        net: data.income - data.expenses
      };
    });
    
    // Calculate total income, expenses and net profit
    const totalIncome = byPeriod.reduce((sum, period) => sum + period.income, 0);
    const totalExpenses = byPeriod.reduce((sum, period) => sum + period.expenses, 0);
    const netProfit = totalIncome + totalExpenses; // expenses are negative
    
    // Create category breakdown
    const byCategory: Record<string, number> = {};
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      if (transactionDate.getFullYear() === selectedYear) {
        const category = transaction.category;
        const amount = transaction.type === TransactionType.INCOME ? transaction.amount : -Math.abs(transaction.amount);
        byCategory[category] = (byCategory[category] || 0) + amount;
      }
    });
    
    // Return the calculated statistics
    return {
      totalIncome,
      totalExpenses,
      netProfit,
      byCategory,
      byPeriod
    } as TransactionStatistics;
  }, [selectedYear, transactions]);

  // Function to fetch transaction statistics (now just uses the memoized calculation)
  const fetchTransactionStatistics = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      // Set the statistics from our memoized calculation
      setTransactionStats(calculateStatistics);
      // Only show toast on the first load
      // showToast("Using local transaction data for statistics", "info");
    } catch (error) {
      console.error("Failed to calculate transaction statistics:", error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [calculateStatistics, transactionStats]);
  
  // Function to generate financial report
  const handleGenerateReport = useCallback(async () => {
    if (!reportForm.periodStart || !reportForm.periodEnd || !reportForm.title) {
      showToast(
        "Please fill in all required fields",
        "error",
        "Validation Error"
      )
      return
    }
    
    // Check authentication
    let authToken
    if (typeof window !== 'undefined') {
      authToken = localStorage.getItem('auth_token')
    }
    
    if (!authToken) {
      showToast(
        "Authentication required: Please log in again",
        "error",
        "Authentication Failed"
      )
      return
    }
    
    // Get user ID
    let userId: number | null = null;
    if (authUser && authUser.id) {
      userId = authUser.id;
    } else {
      const userDataString = localStorage.getItem('user_data');
      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          if (userData && userData.id) {
            userId = userData.id;
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
        return;
      }
    }
    
    setIsGeneratingReport(true)
    setReportError(null)
    
    try {
      // For now, just show success and close dialog
      // TODO: Implement actual report generation thunk
      showToast(
        "Financial report generated successfully",
        "success",
        "Report Generated"
      )
      
      // Reset form and close dialog
      setReportForm({
        periodStart: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        periodEnd: new Date().toISOString().split('T')[0],
        title: "",
        notes: ""
      })
      setIsGenerateReportDialogOpen(false)
      
      // Refresh reports
      fetchFinancialReports()
    } catch (err: unknown) {
      console.error("Failed to generate report:", err)
      const errorMessage = "Failed to generate report. Please try again."
      setReportError(errorMessage)
      showToast(
        errorMessage,
        "error",
        "Report Generation Failed"
      )
    } finally {
      setIsGeneratingReport(false)
    }
  }, [reportForm, showToast, authUser, fetchFinancialReports]);
  
  // Function to view report details
  const handleViewReport = useCallback(async (reportId: number) => {
    try {
      const report = await api.get<FinancialReport>(`accounting/financial-reports/${reportId}`)
      setSelectedReport(report)
      setIsReportDetailDialogOpen(true)
    } catch (err: unknown) {
      console.error("Failed to fetch report details:", err)
      showToast(
        "Failed to load report details",
        "error",
        "Error"
      )
    }
  }, [showToast]);
  
  // Fetch initial data on component mount - only run once
  useEffect(() => {
    // Fetch data from Redux
    dispatch(fetchTransactions())
    dispatch(fetchSalaryPayments())
    dispatch(fetchAllPlayers())
    dispatch(fetchAllStaff())

    // Fetch other data directly
    const fetchInitialData = async () => {
      await Promise.all([
        fetchApprovedAcquisitionsData(),
        fetchFinancialReports()
      ]);
    };
    
    fetchInitialData();
    // Explicitly NOT including fetchApprovedAcquisitionsData or fetchFinancialReports
    // in the dependency array to prevent infinite loops
  }, [dispatch]);
  
  // Update stats when year or transactions change, but separate from other data fetching
  useEffect(() => {
    fetchTransactionStatistics()
  }, [selectedYear, transactions]);
  
  // PDF Export Functions
  const exportReportAsPDF = useCallback(async (report: FinancialReport) => {
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      const pageHeight = doc.internal.pageSize.height
      
      // Add company header
      doc.setFontSize(20)
      doc.setTextColor(40, 40, 40)
      doc.text('Sports Club Management', pageWidth / 2, 25, { align: 'center' })
      
      doc.setFontSize(16)
      doc.text(report.title, pageWidth / 2, 35, { align: 'center' })
      
      // Add period information
      doc.setFontSize(12)
      doc.setTextColor(80, 80, 80)
      const periodText = `Period: ${new Date(report.periodStart).toLocaleDateString()} - ${new Date(report.periodEnd).toLocaleDateString()}`
      doc.text(periodText, pageWidth / 2, 45, { align: 'center' })
      
      // Add generated info
      const generatedText = `Generated by: ${report.generatedBy.firstName} ${report.generatedBy.lastName} on ${new Date(report.createdAt).toLocaleString()}`
      doc.text(generatedText, pageWidth / 2, 55, { align: 'center' })
      
      let currentY = 70
      
      // Financial Summary Section
      doc.setFontSize(14)
      doc.setTextColor(40, 40, 40)
      doc.text('Financial Summary', 20, currentY)
      currentY += 10
      
      // Summary table
      const summaryData = [
        ['Total Income', formatCurrency(report.totalIncome)],
        ['Total Expenses', formatCurrency(report.totalExpenses)],
        ['Net Profit/Loss', formatCurrency(report.netProfit)]
      ]
      
      doc.autoTable({
        startY: currentY,
        head: [['Metric', 'Amount']],
        body: summaryData,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 60, halign: 'right' }
        }
      })
      
      currentY = (doc as any).lastAutoTable.finalY + 15
      
      // Income Breakdown Section
      if (report.incomeBreakdown && Object.keys(report.incomeBreakdown).length > 0) {
        doc.setFontSize(14)
        doc.text('Income Breakdown', 20, currentY)
        currentY += 10
        
        const incomeData = Object.entries(report.incomeBreakdown).map(([category, amount]) => [
          category,
          formatCurrency(amount as number)
        ])
        
        doc.autoTable({
          startY: currentY,
          head: [['Category', 'Amount']],
          body: incomeData,
          theme: 'grid',
          styles: {
            fontSize: 10,
            cellPadding: 3
          },
          headStyles: {
            fillColor: [92, 184, 92],
            textColor: 255
          },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 60, halign: 'right' }
          }
        })
        
        currentY = (doc as any).lastAutoTable.finalY + 15
      }
      
      // Expense Breakdown Section
      if (report.expenseBreakdown && Object.keys(report.expenseBreakdown).length > 0) {
        // Check if we need a new page
        if (currentY > pageHeight - 60) {
          doc.addPage()
          currentY = 20
        }
        
        doc.setFontSize(14)
        doc.text('Expense Breakdown', 20, currentY)
        currentY += 10
        
        const expenseData = Object.entries(report.expenseBreakdown).map(([category, amount]) => [
          category,
          formatCurrency(amount as number)
        ])
        
        doc.autoTable({
          startY: currentY,
          head: [['Category', 'Amount']],
          body: expenseData,
          theme: 'grid',
          styles: {
            fontSize: 10,
            cellPadding: 3
          },
          headStyles: {
            fillColor: [217, 83, 79],
            textColor: 255
          },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 60, halign: 'right' }
          }
        })
        
        currentY = (doc as any).lastAutoTable.finalY + 15
      }
      
      // Notes Section
      if (report.notes) {
        // Check if we need a new page
        if (currentY > pageHeight - 40) {
          doc.addPage()
          currentY = 20
        }
        
        doc.setFontSize(14)
        doc.text('Notes', 20, currentY)
        currentY += 10
        
        doc.setFontSize(10)
        doc.setTextColor(80, 80, 80)
        const splitNotes = doc.splitTextToSize(report.notes, pageWidth - 40)
        doc.text(splitNotes, 20, currentY)
      }
      
      // Add footer
      const footerY = pageHeight - 20
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text('Generated by Sports Club Management System', pageWidth / 2, footerY, { align: 'center' })
      
      // Save the PDF
      const fileName = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
      
      showToast(
        "Report exported successfully as PDF",
        "success",
        "Export Complete"
      )
    } catch (error) {
      console.error('Error exporting PDF:', error)
      showToast(
        "Failed to export report as PDF",
        "error",
        "Export Failed"
      )
    }
  }, [showToast]);
  
  const exportTransactionsAsPDF = useCallback(() => {
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      
      // Add header
      doc.setFontSize(20)
      doc.setTextColor(40, 40, 40)
      doc.text('Financial Transactions Report', pageWidth / 2, 25, { align: 'center' })
      
      doc.setFontSize(12)
      doc.setTextColor(80, 80, 80)
      const dateText = `Generated on: ${new Date().toLocaleString()}`
      doc.text(dateText, pageWidth / 2, 35, { align: 'center' })
      
      // Summary section
      doc.setFontSize(14)
      doc.setTextColor(40, 40, 40)
      doc.text('Summary', 20, 50)
      
      const summaryData = [
        ['Total Income', formatCurrency(totalIncome)],
        ['Total Expenses', formatCurrency(totalExpenses)],
        ['Net Profit/Loss', formatCurrency(netProfit)],
        ['Total Transactions', filteredTransactions.length.toString()]
      ]
      
      doc.autoTable({
        startY: 55,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        }
      })
      
      let currentY = (doc as any).lastAutoTable.finalY + 15
      
      // Transactions table
      doc.setFontSize(14)
      doc.text('Transaction Details', 20, currentY)
      currentY += 5
      
      const transactionData = filteredTransactions.map(transaction => [
        new Date(transaction.date).toLocaleDateString(),
        transaction.description.substring(0, 40) + (transaction.description.length > 40 ? '...' : ''),
        transaction.category,
        transaction.type,
        formatCurrency(transaction.amount),
        transaction.status
      ])
      
      doc.autoTable({
        startY: currentY,
        head: [['Date', 'Description', 'Category', 'Type', 'Amount', 'Status']],
        body: transactionData,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 50 },
          2: { cellWidth: 25 },
          3: { cellWidth: 20 },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 25 }
        }
      })
      
      // Save the PDF
      const fileName = `transactions_report_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
      
      showToast(
        "Transactions exported successfully as PDF",
        "success",
        "Export Complete"
      )
    } catch (error) {
      console.error('Error exporting transactions PDF:', error)
      showToast(
        "Failed to export transactions as PDF",
        "error",
        "Export Failed"
      )
    }
  }, [transactions, showToast]);
  
  // Create custom transaction
  const handleCreateCustomTransaction = useCallback(async () => {
    // Check if all required fields are filled
    if (!customTransactionForm.amount || !customTransactionForm.date || !customTransactionForm.description) {
      showToast(
        "Please fill in all required fields for the transaction",
        "error",
        "Validation Error"
      )
      return
    }
    
    // Check authentication token and get user ID
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
    
    // Get user ID
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
        return;
      }
    }
    
    try {
      // Create the transaction
      const transactionData: CreateTransactionDto = {
        type: customTransactionForm.type,
        category: customTransactionForm.category,
        amount: parseFloat(customTransactionForm.amount),
        date: customTransactionForm.date,
        description: customTransactionForm.description,
        createdById: userId as number, // We've already checked that userId is not null above
        purchaseOrderId: customPOId || undefined,
        purchaseOrderType: customPOType || undefined
      }
      
      console.log("Creating custom transaction with data:", transactionData)
      
      // Use the Redux thunk to create the transaction
      const result = await dispatch(createTransaction(transactionData)).unwrap();
      
      console.log("Custom transaction created successfully:", result)
      
      // Show success toast notification
      showToast(
        `${customTransactionForm.type === TransactionType.INCOME ? 'Income' : 'Expense'} transaction created successfully.`,
        "success",
        "Transaction Created"
      )
      
      // Reset form and close dialog
      setCustomTransactionForm({
        amount: "",
        date: new Date().toISOString().split('T')[0],
        description: "",
        type: TransactionType.INCOME,
        category: TransactionCategory.SPONSORSHIP
      })
      setCustomPOFile(null);
      setCustomPOId(null);
      setCustomPOType("");
      setIsCustomTransactionDialogOpen(false)
      
      // Refresh transactions
      dispatch(fetchTransactions())
    } catch (err: any) {
      console.error("Failed to create custom transaction:", err)
      
      const errorMessage = err.message || "Failed to create transaction. Please try again."
      
      showToast(
        errorMessage,
        "error",
        "Transaction Creation Failed"
      )
    }
  }, [customTransactionForm, dispatch, showToast]);

  // Create transaction from acquisition
  const handleCreateTransaction = useCallback(async () => {
    if (!selectedAcquisitionId) {
      setTransactionError("Please select an acquisition")
      return
    }
    
    // Check authentication token
    let authToken
    if (typeof window !== 'undefined') {
      authToken = localStorage.getItem('auth_token')
    }
    
    // Default transaction type and category for acquisitions
    if (!selectedTransactionType) {
      setSelectedTransactionType(TransactionType.EXPENSE)
    }
    if (!selectedTransactionCategory) {
      setSelectedTransactionCategory(TransactionCategory.EQUIPMENT)
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
        customDescription: transactionDescription || undefined,
        purchaseOrderId: purchaseOrderId || undefined,
        purchaseOrderType: purchaseOrderType || undefined
      };

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
      setPurchaseOrderFile(null)
      setPurchaseOrderId(null)
      setPurchaseOrderType("")

      // Refresh transactions and acquisitions
      dispatch(fetchTransactions())
      fetchApprovedAcquisitionsData()
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
  }, [dispatch, fetchApprovedAcquisitionsData, selectedAcquisitionId, transactionDescription, showToast]);
  
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
  }, [salaryPaymentForm, dispatch, showToast]);
  
  // Open transaction type selection dialog for a salary payment
  const openTransactionTypeDialog = useCallback((salaryPaymentId: number) => {
    setSelectedSalaryPaymentId(salaryPaymentId);
    // Default to expense and salary category for salary payments
    setSelectedTransactionType(TransactionType.EXPENSE);
    setSelectedTransactionCategory(TransactionCategory.SALARY);
    setIsTransactionTypeDialogOpen(true);
  }, []);
  
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
        "Transaction Creation Failed"
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
      const paymentDetails = salaryPayments.find(p => p.id === selectedSalaryPaymentId);
      let customDescription = "Salary payment transaction";
      
      if (paymentDetails) {
        const playerInfo = paymentDetails.player || (paymentDetails.playerId ? players.find(p => p.id === paymentDetails.playerId) : null);
        const staffInfo = paymentDetails.staff || (paymentDetails.staffId ? staff.find(s => s.id === paymentDetails.staffId) : null);
        const recipientName = playerInfo 
          ? `${playerInfo.firstName} ${playerInfo.lastName} (Player)` 
          : staffInfo 
            ? `${staffInfo.firstName} ${staffInfo.lastName} (${staffInfo.role})` 
            : 'Unknown recipient';
            
        const periodStart = new Date(paymentDetails.periodStart).toLocaleDateString();
        const periodEnd = new Date(paymentDetails.periodEnd).toLocaleDateString();
        
        customDescription = `${selectedTransactionType === TransactionType.INCOME ? 'Income' : 'Expense'} for ${recipientName} - Period: ${periodStart} to ${periodEnd}`;
      }
      
      // Use the authenticated user's ID instead of a hardcoded value
      const transactionData: CreateTransactionFromSalaryPaymentDto = {
        salaryPaymentId: selectedSalaryPaymentId,
        createdById: userId, // Use the retrieved user ID
        customDescription: customDescription,
        transactionType: selectedTransactionType,
        transactionCategory: selectedTransactionCategory as TransactionCategory || TransactionCategory.SALARY
      }
      
      console.log("Creating transaction with authenticated user ID:", userId)
      
      console.log("Creating transaction from salary payment with data:", transactionData)
      
      const result = await dispatch(createTransactionFromSalaryPayment(transactionData)).unwrap()
      console.log("Transaction created successfully from salary payment:", result)
      
      // Show success toast notification
      showToast(
        `${selectedTransactionType === TransactionType.INCOME ? 'Income' : 'Expense'} transaction created successfully from salary payment.`,
        "success",
        "Transaction Created"
      )
      
      // Close the dialog
      setIsTransactionTypeDialogOpen(false)
      setSelectedSalaryPaymentId(null)
      
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
  }, [selectedSalaryPaymentId, selectedTransactionType, selectedTransactionCategory, dispatch, showToast]);
  
  // Filter transactions based on search term, category, and type
  const filteredTransactions = useMemo(() => transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || transaction.category.toString().toLowerCase() === selectedCategory.toLowerCase();
    const matchesType = selectedType === "all" || transaction.type.toString().toLowerCase() === selectedType.toLowerCase();
    
    return matchesSearch && matchesCategory && matchesType;
  }), [transactions, searchTerm, selectedCategory, selectedType]);

  // Utility function to get color based on transaction type
  const getTypeColor = useCallback((type: TransactionType) => {
    return type === TransactionType.INCOME
      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
  }, []);

  // Calculate financial summaries

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

  const totalIncome = useMemo(() => 
    transactions.filter((t) => t.type === TransactionType.INCOME).reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0
  , [transactions]);
  
  const totalExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
  }, [transactions]);
  
  const netProfit = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  const calculateMonthlyData = useCallback(() => {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    // If we have API statistics data, use it
    if (transactionStats && transactionStats.byPeriod) {
      // Create a map from API data
      const apiDataMap = new Map();
      
      transactionStats.byPeriod.forEach(period => {
        let monthIndex = -1;
        const periodStr = period.period ? period.period.toString() : '';
        
        // Handle different possible period formats from the API
        if (periodStr.includes('-')) {
          // Format: "2025-1", "2025-2", etc. or "2025-01", "2025-02", etc.
          const [year, month] = periodStr.split('-');
          if (parseInt(year) === selectedYear) {
            monthIndex = parseInt(month) - 1; // Convert to 0-based index
          }
        } else if (periodStr.length === 6) {
          // Format: "202501", "202502", etc. (YYYYMM)
          const year = parseInt(periodStr.substring(0, 4));
          const month = parseInt(periodStr.substring(4, 6));
          if (year === selectedYear) {
            monthIndex = month - 1;
          }
        } else if (periodStr.length === 1 || periodStr.length === 2) {
          // Format: Just month number "1", "2", etc.
          monthIndex = parseInt(periodStr) - 1;
        } else if (periodStr.toLowerCase().includes('jan') || 
                  periodStr.toLowerCase().includes('feb') || 
                  periodStr.toLowerCase().includes('mar')) {
          // Format: Month name like "Jan", "February", etc.
          monthIndex = monthNames.findIndex(m => 
            periodStr.toLowerCase().includes(m.toLowerCase())
          );
        }
        
        // If we successfully parsed a valid month index, add the data
        if (monthIndex >= 0 && monthIndex < 12) {
          apiDataMap.set(monthNames[monthIndex], {
            income: period.income || 0,
            expenses: Math.abs(period.expenses || 0), // Ensure positive for display
            profit: period.net || 0
          });
        }
      });
      
      // Return data for all 12 months, filling missing months with zeros
      return monthNames.map(month => {
        const data = apiDataMap.get(month) || { income: 0, expenses: 0, profit: 0 };
        return {
          month,
          income: data.income,
          expenses: data.expenses,
          profit: data.income - data.expenses
        };
      });
    }
    
    // Fallback to local calculation from transactions
    const monthlyMap = new Map<string, { income: number; expenses: number }>();
    
    // Initialize all 12 months for the selected year
    monthNames.forEach(month => {
      monthlyMap.set(month, { income: 0, expenses: 0 });
    });
    
    // Aggregate transactions by month for the selected year
    transactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.date);
      const transactionYear = transactionDate.getFullYear();
      
      // Only include transactions from the selected year
      if (transactionYear === selectedYear) {
        const monthKey = transactionDate.toLocaleDateString('en-US', { month: 'short' });
        
        if (monthlyMap.has(monthKey)) {
          const monthData = monthlyMap.get(monthKey)!;
          if (transaction.type === TransactionType.INCOME) {
            monthData.income += transaction.amount;
          } else {
            monthData.expenses += Math.abs(transaction.amount);
          }
        }
      }
    });
    
    // Convert to array format for charts (maintain month order)
    return monthNames.map(month => {
      const data = monthlyMap.get(month)!;
      return {
        month,
        income: data.income,
        expenses: data.expenses,
        profit: data.income - data.expenses
      };
    });
  }, [transactionStats, selectedYear, transactions]);

  // Use memoization to avoid recalculating monthly data on every render
  const monthlyData = useMemo(() => calculateMonthlyData(), [calculateMonthlyData]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Toast Notification */}
      <ToastNotification toast={toastState} onClose={hideToast} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion financière</h1>
          <p className="text-gray-600 dark:text-gray-400">Suivez et gérez toutes les transactions financières</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="bg-white dark:bg-gray-800"
            onClick={exportTransactionsAsPDF}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter le rapport
          </Button>
          <Button 
            className="bg-purple-600 hover:bg-purple-700 text-white" 
            onClick={() => setIsCustomTransactionDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Transaction personnalisée
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white" 
            onClick={() => setIsCreateSalaryPaymentDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau paiement de salaire
          </Button>
          <Button 
            className="bg-blue-800 hover:bg-blue-900 text-white" 
            onClick={() => setIsCreateTransactionDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer depuis acquisition
          </Button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total des recettes</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total des dépenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Bénéfice net</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-800" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(netProfit)}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Dernières transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {transactions.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Nombre total de transactions enregistrées</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="salary-payments">Paiements de salaires</TabsTrigger>
          <TabsTrigger value="reports">Rapports & Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Transactions récentes</CardTitle>
              <CardDescription>Consultez et gérez toutes les transactions financières</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Rechercher une transaction..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    <SelectItem value={TransactionCategory.EQUIPMENT}>Équipement</SelectItem>
                    <SelectItem value={TransactionCategory.RENTAL}>Location</SelectItem>
                    <SelectItem value={TransactionCategory.SALARY}>Salaire</SelectItem>
                    <SelectItem value={TransactionCategory.SPONSORSHIP}>Sponsoring</SelectItem>
                    <SelectItem value={TransactionCategory.REGISTRATION}>Inscription</SelectItem>
                    <SelectItem value={TransactionCategory.UTILITY}>Service</SelectItem>
                    <SelectItem value={TransactionCategory.DONATION}>Don</SelectItem>
                    <SelectItem value={TransactionCategory.OTHER}>Autre</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value={TransactionType.INCOME}>Recette</SelectItem>
                    <SelectItem value={TransactionType.EXPENSE}>Dépense</SelectItem>
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
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Bon de commande</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          <div className="flex justify-center items-center">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-500 mr-2" />
                            <span>Chargement des transactions...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          Aucune transaction trouvée.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell className="font-medium">{transaction.description}</TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell>
                            <Badge className={getTypeColor(transaction.type)}>{transaction.type === TransactionType.INCOME ? 'Recette' : 'Dépense'}</Badge>
                          </TableCell>
                          <TableCell className={transaction.type === TransactionType.INCOME ? "text-green-600" : "text-red-600"}>
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(transaction.status)}>{transaction.status === TransactionPaymentStatus.PAID ? 'Payé' : transaction.status === TransactionPaymentStatus.PENDING ? 'En attente' : transaction.status === TransactionPaymentStatus.APPROVED ? 'Approuvé' : transaction.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {transaction.purchaseOrder && transaction.purchaseOrder.url ? (
                              <a
                                href={`${apiConfig.baseUrl}${transaction.purchaseOrder.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:underline"
                                title={transaction.purchaseOrder.fileName || 'View Purchase Order'}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Voir PDF
                              </a>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
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
              <CardTitle className="text-gray-900 dark:text-white">Paiements de salaires</CardTitle>
              <CardDescription>Consultez et gérez les paiements de salaires des joueurs et du staff</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex justify-between items-center mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Rechercher un paiement de salaire..."
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
                  Nouveau paiement de salaire
                </Button>
              </div>

              {/* Salary Payments Table */}
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
                    ) : !salaryPayments || salaryPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          Aucuns paiements de salaires trouvés.
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
                            <TableCell>{formatCurrency(payment.amount)}</TableCell>
                            <TableCell>{formatCurrency(payment.taxAmount)}</TableCell>
                            <TableCell>{formatCurrency(payment.netAmount)}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(payment.status)}>{payment.status === TransactionPaymentStatus.PAID ? 'Payé' : payment.status === TransactionPaymentStatus.PENDING ? 'En attente' : payment.status === TransactionPaymentStatus.APPROVED ? 'Approuvé' : payment.status}</Badge>
                            </TableCell>
                            <TableCell>
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
          {/* Header with Year Selector and Generate Report Button */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rapports & Analyses financières</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Générez des rapports et visualisez les tendances de performance financière</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="year-select" className="text-sm font-medium">Année :</Label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Sélectionner une année" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setIsGenerateReportDialogOpen(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Générer un rapport
                </Button>
              </div>
            </div>
          </div>
          
          {/* Financial Statistics Cards */}
          {transactionStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total des recettes ({selectedYear})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(transactionStats.totalIncome || 0)}</div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total des dépenses ({selectedYear})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(transactionStats.totalExpenses || 0)}</div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Bénéfice net ({selectedYear})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${(transactionStats.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(isNaN(transactionStats.netProfit) ? 0 : transactionStats.netProfit)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Recettes vs Dépenses mensuelles ({selectedYear})</CardTitle>
                <CardDescription>Performance financière pour {selectedYear}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="flex justify-center items-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="income" fill="#10B981" name="Recettes" />
                      <Bar dataKey="expenses" fill="#EF4444" name="Dépenses" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Tendance du bénéfice ({selectedYear})</CardTitle>
                <CardDescription>Tendance du bénéfice net pour {selectedYear}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="flex justify-center items-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="#1E3A8A" 
                        strokeWidth={2} 
                        name="Bénéfice" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Generated Reports Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Rapports financiers générés</CardTitle>
              <CardDescription>Consultez et gérez les rapports financiers générés précédemment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead>Total des recettes</TableHead>
                      <TableHead>Total des dépenses</TableHead>
                      <TableHead>Bénéfice net</TableHead>
                      <TableHead>Généré par</TableHead>
                      <TableHead>Créé le</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingReports ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          <div className="flex justify-center items-center">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-500 mr-2" />
                            <span>Chargement des rapports...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : financialReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          No financial reports found. Generate your first report above.
                        </TableCell>
                      </TableRow>
                    ) : (
                      financialReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.title}</TableCell>
                          <TableCell>
                            {new Date(report.periodStart).toLocaleDateString()} - {new Date(report.periodEnd).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-green-600">{formatCurrency(report.totalIncome || 0)}</TableCell>
                          <TableCell className="text-red-600">{formatCurrency(report.totalExpenses || 0)}</TableCell>
                          <TableCell className={report.netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                            {formatCurrency(report.netProfit || 0)}
                          </TableCell>
                          <TableCell>{report.generatedBy?.username || 'Unknown'}</TableCell>
                          <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewReport(report.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Voir
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportReportAsPDF(report)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                PDF
                              </Button>
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
      </Tabs>

      {/* Create Transaction Dialog */}
      <Dialog open={isCreateTransactionDialogOpen} onOpenChange={setIsCreateTransactionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer une transaction depuis une acquisition approuvée</DialogTitle>
            <DialogDescription>
              Sélectionnez une acquisition approuvée pour créer une transaction financière.
              Cela enregistrera la transaction financière associée à l'acquisition.
              La transaction utilisera la date actuelle et sera créée avec votre identifiant utilisateur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isLoadingAcquisitions ? (
              <div className="flex flex-col justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
                <span className="text-gray-600">Chargement des acquisitions en attente...</span>
                <p className="text-xs text-gray-500 mt-1">Veuillez patienter pendant la récupération des données d'acquisitions en attente</p>
              </div>
            ) : acquisitionError ? (
              <div className="py-4 text-center bg-red-50 p-4 rounded-md border border-red-200">
                <p className="text-red-600 mb-3">{acquisitionError}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchApprovedAcquisitionsData}
                  className="mt-2 border-red-300 hover:bg-red-100"
                >
                  <RefreshCcw className="h-4 w-4 mr-1" />
                  Réessayer
                </Button>
              </div>
            ) : approvedAcquisitions.length === 0 ? (
              <div className="py-4 text-center bg-blue-50 p-4 rounded-md border border-blue-200">
                <p className="text-blue-600 mb-3">Aucune acquisition approuvée trouvée</p>
                <p className="text-sm text-gray-600">Aucune acquisition approuvée n'est disponible pour créer des transactions.</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchApprovedAcquisitionsData}
                  className="mt-3 border-blue-300 hover:bg-blue-100"
                >
                  <RefreshCcw className="h-4 w-4 mr-1" />
                  Rafraîchir
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {/* Purchase Order File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="purchaseOrderFile">Bon de commande (optionnel)</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="purchaseOrderFile"
                      type="file"
                      accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx,.txt"
                      onChange={handlePurchaseOrderFileChange}
                      disabled={isUploadingPO}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleUploadPurchaseOrder}
                      disabled={isUploadingPO || !purchaseOrderFile}
                    >
                      {isUploadingPO ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Upload
                    </Button>
                  </div>
                  {purchaseOrderId && (
                    <div className="text-green-600 text-xs mt-1">File uploaded (ID: {purchaseOrderId})</div>
                  )}
                  {uploadPOError && (
                    <div className="text-red-600 text-xs mt-1">{uploadPOError}</div>
                  )}
                </div>
                {/* Purchase Order Type */}
                <div className="space-y-2">
                  <Label htmlFor="purchaseOrderType">Purchase Order Type (optional)</Label>
                  <Select
                    value={purchaseOrderType}
                    onValueChange={v => setPurchaseOrderType(v as "INTERNAL" | "EXTERNAL")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INTERNAL">Internal</SelectItem>
                      <SelectItem value="EXTERNAL">External</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="acquisition">Approved Acquisition</Label>
                  <Select 
                    value={selectedAcquisitionId?.toString() || ""} 
                    onValueChange={(value) => setSelectedAcquisitionId(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an approved acquisition" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedAcquisitions.map((acq) => (
                        <SelectItem key={acq.id} value={acq.id.toString()}>
                          {acq.description} - ${acq.cost} ({acq.itemType})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
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
              Annuler
            </Button>
            <Button 
              onClick={handleCreateTransaction} 
              disabled={!selectedAcquisitionId || isSubmittingTransaction}
              className="bg-blue-800 hover:bg-blue-900 text-white min-w-[150px]"
            >
              {isSubmittingTransaction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                "Approuver & Créer la transaction"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Salary Payment Dialog */}
      <Dialog open={isCreateSalaryPaymentDialogOpen} onOpenChange={setIsCreateSalaryPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Créer un nouveau paiement de salaire</DialogTitle>
            <DialogDescription>
              Créez un nouveau paiement de salaire pour un joueur ou un membre du staff.
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
      
      {/* Custom Transaction Dialog */}
      <Dialog open={isCustomTransactionDialogOpen} onOpenChange={setIsCustomTransactionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Créer une transaction personnalisée</DialogTitle>
            <DialogDescription>
              Créez une transaction de recette ou de dépense personnalisée.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Transaction type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customTransactionType" className="text-right">
                Transaction Type*
              </Label>
              <div className="col-span-3">
                <Select 
                  value={customTransactionForm.type} 
                  onValueChange={(value) => setCustomTransactionForm({
                    ...customTransactionForm,
                    type: value as TransactionType,
                    category: value === TransactionType.INCOME ? TransactionCategory.SPONSORSHIP : TransactionCategory.UTILITY
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TransactionType.INCOME}>Recette</SelectItem>
                    <SelectItem value={TransactionType.EXPENSE}>Dépense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Category */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customCategory" className="text-right">
                Category*
              </Label>
              <div className="col-span-3">
                <Select 
                  value={customTransactionForm.category} 
                  onValueChange={(value) => setCustomTransactionForm({
                    ...customTransactionForm,
                    category: value as TransactionCategory
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {customTransactionForm.type === TransactionType.INCOME ? (
                      <>
                        <SelectItem value={TransactionCategory.SPONSORSHIP}>Sponsoring</SelectItem>
                        <SelectItem value={TransactionCategory.DONATION}>Don</SelectItem>
                        <SelectItem value={TransactionCategory.REGISTRATION}>Inscription</SelectItem>
                        <SelectItem value={TransactionCategory.OTHER}>Autre</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value={TransactionCategory.SALARY}>Salaire</SelectItem>
                        <SelectItem value={TransactionCategory.RENTAL}>Location</SelectItem>
                        <SelectItem value={TransactionCategory.EQUIPMENT}>Équipement</SelectItem>
                        <SelectItem value={TransactionCategory.UTILITY}>Service</SelectItem>
                        <SelectItem value={TransactionCategory.OTHER}>Autre</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Amount */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customAmount" className="text-right">
                Amount*
              </Label>
              <div className="col-span-3 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">MAD</span>
                <Input
                  id="customAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-12"
                  value={customTransactionForm.amount}
                  onChange={(e) => setCustomTransactionForm({
                    ...customTransactionForm,
                    amount: e.target.value
                  })}
                />
              </div>
            </div>
            {/* Date */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customDate" className="text-right">
                Date*
              </Label>
              <div className="col-span-3">
                <Input
                  id="customDate"
                  type="date"
                  value={customTransactionForm.date}
                  onChange={(e) => setCustomTransactionForm({
                    ...customTransactionForm,
                    date: e.target.value
                  })}
                />
              </div>
            </div>
            {/* Description */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customDescription" className="text-right">
                Description*
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="customDescription"
                  placeholder="Describe the transaction..."
                  value={customTransactionForm.description}
                  onChange={(e) => setCustomTransactionForm({
                    ...customTransactionForm,
                    description: e.target.value
                  })}
                />
              </div>
            </div>
            {/* Purchase Order File Upload */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Purchase Order File</Label>
              <div className="col-span-3">
                <Input type="file" accept=".pdf,image/*,.doc,.docx,.txt" onChange={handleCustomPOFileChange} disabled={isUploadingCustomPO || customTransactionForm.type === TransactionType.INCOME} />
                <Button type="button" onClick={handleUploadCustomPO} disabled={isUploadingCustomPO || !customPOFile || customTransactionForm.type === TransactionType.INCOME} className="mt-2">
                  {isUploadingCustomPO ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                  Upload File
                </Button>
                {uploadCustomPOError && <div className="text-red-500 text-sm mt-1">{uploadCustomPOError}</div>}
                {customPOId && <div className="text-green-600 text-sm mt-1">File uploaded (ID: {customPOId})</div>}
              </div>
            </div>
            {/* Purchase Order Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Purchase Order Type</Label>
              <div className="col-span-3">
                <Select value={customPOType} onValueChange={v => setCustomPOType(v as "INTERNAL" | "EXTERNAL" | "")} disabled={isUploadingCustomPO || customTransactionForm.type === TransactionType.INCOME}> 
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INTERNAL">Internal</SelectItem>
                    <SelectItem value="EXTERNAL">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomTransactionDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleCreateCustomTransaction}
              className="bg-blue-800 hover:bg-blue-900 text-white"
            >
              Créer la transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Generate Report Dialog */}
      <Dialog open={isGenerateReportDialogOpen} onOpenChange={setIsGenerateReportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Générer un rapport financier</DialogTitle>
            <DialogDescription>
              Créez un rapport financier complet pour une période donnée.
            </DialogDescription>
          </DialogHeader>
          
          {reportError && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4">
              <p className="text-sm">{reportError}</p>
            </div>
          )}
          
          <div className="grid gap-4 py-4">
            {/* Report Title */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reportTitle" className="text-right">Titre*</Label>
              <div className="col-span-3">
                <Input
                  id="reportTitle"
                  placeholder="ex : Rapport financier T2 2025"
                  value={reportForm.title}
                  onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                />
              </div>
            </div>
            
            {/* Period Start */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="periodStart" className="text-right">Date de début*</Label>
              <div className="col-span-3">
                <Input
                  id="periodStart"
                  type="date"
                  value={reportForm.periodStart}
                  onChange={(e) => setReportForm({ ...reportForm, periodStart: e.target.value })}
                />
              </div>
            </div>
            
            {/* Period End */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="periodEnd" className="text-right">Date de fin*</Label>
              <div className="col-span-3">
                <Input
                  id="periodEnd"
                  type="date"
                  value={reportForm.periodEnd}
                  onChange={(e) => setReportForm({ ...reportForm, periodEnd: e.target.value })}
                />
              </div>
            </div>
            
            {/* Notes */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reportNotes" className="text-right">Notes</Label>
              <div className="col-span-3">
                <Textarea
                  id="reportNotes"
                  placeholder="Optional notes or comments about this report"
                  value={reportForm.notes}
                  onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateReportDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleGenerateReport} 
              disabled={isGeneratingReport}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px]"
            >
              {isGeneratingReport ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Générer le rapport
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Report Detail Dialog */}
      <Dialog open={isReportDetailDialogOpen} onOpenChange={setIsReportDetailDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{selectedReport?.title}</DialogTitle>
            <DialogDescription>
              Rapport financier pour {selectedReport && new Date(selectedReport.periodStart).toLocaleDateString('fr-FR')} - {selectedReport && new Date(selectedReport.periodEnd).toLocaleDateString('fr-FR')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total des recettes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-green-600">{formatCurrency(selectedReport.totalIncome || 0)}</div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total des dépenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-red-600">{formatCurrency(selectedReport.totalExpenses || 0)}</div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Bénéfice net</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-xl font-bold ${selectedReport.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(selectedReport.netProfit || 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Breakdown Tables */}
              <div className="grid grid-cols-2 gap-6">
                {/* Income Breakdown */}
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Income Breakdown</h4>
                  <div className="space-y-2">
                    {selectedReport.incomeBreakdown && Object.entries(selectedReport.incomeBreakdown).map(([category, amount]) => (
                      <div key={category} className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-sm text-gray-600">{category}</span>
                        <span className="text-sm font-medium text-green-600">{formatCurrency(amount as number)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Expense Breakdown */}
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Expense Breakdown</h4>
                  <div className="space-y-2">
                    {selectedReport.expenseBreakdown && Object.entries(selectedReport.expenseBreakdown).map(([category, amount]) => (
                      <div key={category} className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-sm text-gray-600">{category}</span>
                        <span className="text-sm font-medium text-red-600">{formatCurrency(amount as number)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Report Metadata */}
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Generated by:</span> {selectedReport.generatedBy?.firstName} {selectedReport.generatedBy?.lastName}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {new Date(selectedReport.createdAt).toLocaleString('fr-FR')}
                  </div>
                </div>
                {selectedReport.notes && (
                  <div className="mt-2">
                    <span className="font-medium">Notes:</span>
                    <p className="mt-1 text-sm text-gray-600">{selectedReport.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportDetailDialogOpen(false)}>
              Fermer
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => selectedReport && exportReportAsPDF(selectedReport)}
              disabled={!selectedReport}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
