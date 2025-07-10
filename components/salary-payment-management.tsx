"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { DollarSign, Plus, Search, Filter, Download, Eye, CheckCircle, XCircle, Clock, FileText } from "lucide-react"
import {
  listSalaryPayments,
  createSalaryPayment,
  updateSalaryPayment,
  deleteSalaryPayment,
  SalaryPayment as ApiSalaryPayment,
  CreateSalaryPaymentBody,
} from "@/lib/api/hr-salary-api"

interface Employee {
  id: string
  name: string
  position: string
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
  const [selectedPayment, setSelectedPayment] = useState<ApiSalaryPayment | null>(null)
  const [showNewPaymentDialog, setShowNewPaymentDialog] = useState(false)
  const [newPayment, setNewPayment] = useState({
    employeeId: "",
    payPeriod: "",
    baseSalary: 0,
    overtime: 0,
    bonuses: 0,
    paymentMethod: "Bank Transfer",
  })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; payment: ApiSalaryPayment | null }>({
    open: false,
    payment: null,
  })

  const [employees] = useState<Employee[]>([
    {
      id: "EMP001",
      name: "John Smith",
      position: "Head Coach",
      baseSalary: 5000,
      taxRate: 0.18,
      benefits: 200,
      bankAccount: "****1234",
    },
    {
      id: "EMP002",
      name: "Sarah Johnson",
      position: "Assistant Coach",
      baseSalary: 3500,
      taxRate: 0.15,
      benefits: 150,
      bankAccount: "****5678",
    },
    {
      id: "EMP003",
      name: "Mike Wilson",
      position: "Fitness Trainer",
      baseSalary: 2800,
      taxRate: 0.12,
      benefits: 120,
      bankAccount: "****9012",
    },
  ])

  // Fetch payments from backend
  useEffect(() => {
    setLoading(true)
    listSalaryPayments()
      .then(setPayments)
      .catch((e) => setError("Failed to load salary payments"))
      .finally(() => setLoading(false))
  }, [])

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Processed
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        )
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">Cancelled</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const calculatePayment = () => {
    const grossPay = newPayment.baseSalary + newPayment.overtime + newPayment.bonuses
    const employee = employees.find((emp) => emp.id === newPayment.employeeId)
    const taxDeduction = employee ? grossPay * employee.taxRate : 0
    const benefitDeduction = employee ? employee.benefits : 0
    const totalDeductions = taxDeduction + benefitDeduction
    const netPay = grossPay - totalDeductions

    return { grossPay, totalDeductions, netPay }
  }

  // Replace handleCreatePayment with API call
  const handleCreatePayment = async () => {
    const employee = employees.find((emp) => emp.id === newPayment.employeeId)
    if (!employee) return
    const { grossPay, totalDeductions } = calculatePayment()
    const body: CreateSalaryPaymentBody = {
      employeeId: newPayment.employeeId,
      payPeriod: newPayment.payPeriod,
      baseSalary: newPayment.baseSalary,
      overtime: newPayment.overtime,
      bonuses: newPayment.bonuses,
      paymentMethod: newPayment.paymentMethod,
      status: "pending",
    }
    try {
      const created = await createSalaryPayment(body)
      setPayments((prev) => [
        ...prev,
        { ...created, deductions: totalDeductions, grossPay: created.grossPay, netPay: created.netPay },
      ])
      setShowNewPaymentDialog(false)
      setNewPayment({
        employeeId: "",
        payPeriod: "",
        baseSalary: 0,
        overtime: 0,
        bonuses: 0,
        paymentMethod: "Bank Transfer",
      })
    } catch (e) {
      setError("Failed to create payment")
    }
  }

  // Replace handleProcessPayment and handleFailPayment with API calls
  const handleProcessPayment = async (paymentId: string) => {
    try {
      const updated = await updateSalaryPayment(paymentId, {
        status: "processed",
        processedDate: new Date().toISOString().split("T")[0],
      })
      setPayments((prev) => prev.map((p) => (p.id === paymentId ? updated : p)))
    } catch (e) {
      setError("Failed to process payment")
    }
  }
  const handleFailPayment = async (paymentId: string) => {
    try {
      const updated = await updateSalaryPayment(paymentId, { status: "failed" })
      setPayments((prev) => prev.map((p) => (p.id === paymentId ? updated : p)))
    } catch (e) {
      setError("Failed to mark payment as failed")
    }
  }

  // Add delete dialog state and handler
  const handleDeletePayment = async () => {
    if (!deleteDialog.payment) return
    try {
      await deleteSalaryPayment(deleteDialog.payment.id)
      setPayments((prev) => prev.filter((p) => p.id !== deleteDialog.payment!.id))
      setDeleteDialog({ open: false, payment: null })
    } catch (e) {
      setError("Failed to delete payment")
    }
  }

  const totalPayments = payments.reduce((sum, payment) => sum + payment.netPay, 0)
  const pendingPayments = payments.filter((p) => p.status === "pending").length
  const processedPayments = payments.filter((p) => p.status === "processed").length
  const failedPayments = payments.filter((p) => p.status === "failed").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Salary Payment Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Process and manage employee salary payments</p>
        </div>
        <Dialog open={showNewPaymentDialog} onOpenChange={setShowNewPaymentDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Salary Payment</DialogTitle>
              <DialogDescription>Process a new salary payment for an employee</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Employee</Label>
                <Select
                  value={newPayment.employeeId}
                  onValueChange={(value) => {
                    const employee = employees.find((emp) => emp.id === value)
                    setNewPayment({
                      ...newPayment,
                      employeeId: value,
                      baseSalary: employee?.baseSalary || 0,
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payPeriod">Pay Period</Label>
                <Input
                  id="payPeriod"
                  value={newPayment.payPeriod}
                  onChange={(e) => setNewPayment({ ...newPayment, payPeriod: e.target.value })}
                  placeholder="e.g., December 2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseSalary">Base Salary</Label>
                <Input
                  id="baseSalary"
                  type="number"
                  value={newPayment.baseSalary}
                  onChange={(e) => setNewPayment({ ...newPayment, baseSalary: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="overtime">Overtime</Label>
                <Input
                  id="overtime"
                  type="number"
                  value={newPayment.overtime}
                  onChange={(e) => setNewPayment({ ...newPayment, overtime: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bonuses">Bonuses</Label>
                <Input
                  id="bonuses"
                  type="number"
                  value={newPayment.bonuses}
                  onChange={(e) => setNewPayment({ ...newPayment, bonuses: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={newPayment.paymentMethod}
                  onValueChange={(value) => setNewPayment({ ...newPayment, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Direct Deposit">Direct Deposit</SelectItem>
                    <SelectItem value="Check">Check</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {newPayment.employeeId && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold mb-2">Payment Calculation</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Gross Pay:</span>
                    <p className="font-semibold">${calculatePayment().grossPay.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Deductions:</span>
                    <p className="font-semibold">${calculatePayment().totalDeductions.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Net Pay:</span>
                    <p className="font-semibold text-green-600">${calculatePayment().netPay.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewPaymentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePayment} disabled={!newPayment.employeeId || !newPayment.payPeriod}>
                Create Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processedPayments}</div>
            <p className="text-xs text-muted-foreground">Successfully paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedPayments}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
          <CardDescription>Manage and track all salary payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by employee name, position, or payment ID..."
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
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Pay Period</TableHead>
                  <TableHead>Gross Pay</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.employeeName}</div>
                        <div className="text-sm text-gray-500">{payment.position}</div>
                      </div>
                    </TableCell>
                    <TableCell>{payment.payPeriod}</TableCell>
                    <TableCell>${payment.grossPay.toLocaleString()}</TableCell>
                    <TableCell>${payment.deductions.toLocaleString()}</TableCell>
                    <TableCell className="font-semibold text-green-600">${payment.netPay.toLocaleString()}</TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
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
                              onClick={() => handleProcessPayment(payment.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFailPayment(payment.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDeleteDialog({ open: true, payment })}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
              <DialogTitle>Payment Details - {selectedPayment.id}</DialogTitle>
              <DialogDescription>Complete payment information and breakdown</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Payment Details</TabsTrigger>
                <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Employee</Label>
                    <p className="text-lg font-semibold">{selectedPayment.employeeName}</p>
                    <p className="text-sm text-gray-600">{selectedPayment.position}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Pay Period</Label>
                    <p className="text-lg">{selectedPayment.payPeriod}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Payment Method</Label>
                    <p className="text-lg">{selectedPayment.paymentMethod}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Payment Date</Label>
                    <p className="text-lg">{selectedPayment.paymentDate}</p>
                  </div>
                  {selectedPayment.processedDate && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Processed Date</Label>
                      <p className="text-lg">{selectedPayment.processedDate}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="breakdown" className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Label className="text-sm font-medium text-blue-600">Base Salary</Label>
                      <p className="text-2xl font-bold text-blue-800">${selectedPayment.baseSalary.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Label className="text-sm font-medium text-green-600">Overtime</Label>
                      <p className="text-2xl font-bold text-green-800">${selectedPayment.overtime.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <Label className="text-sm font-medium text-purple-600">Bonuses</Label>
                      <p className="text-2xl font-bold text-purple-800">${selectedPayment.bonuses.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <Label className="text-sm font-medium text-red-600">Deductions</Label>
                      <p className="text-2xl font-bold text-red-800">${selectedPayment.deductions.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Gross Pay</Label>
                        <p className="text-xl font-semibold">${selectedPayment.grossPay.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <Label className="text-sm font-medium text-green-600">Net Pay</Label>
                        <p className="text-2xl font-bold text-green-800">${selectedPayment.netPay.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedPayment(null)}>
                Close
              </Button>
              <Button>
                <FileText className="w-4 h-4 mr-2" />
                Download Slip
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
            <DialogTitle>Delete Salary Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete payment {deleteDialog.payment?.id}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, payment: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePayment}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
