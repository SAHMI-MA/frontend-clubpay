"use client"

import { useState, useEffect } from "react"
import { Alert } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
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
import { DollarSign, Plus, Search, Filter, Download, Eye, CheckCircle, XCircle, Clock, Trash2 } from "lucide-react"
import {
  listSalaryPayments,
  createSalaryPayment,
  deleteSalaryPayment,
  SalaryPayment as ApiSalaryPayment,
  CreateSalaryPaymentBody,
  createBulkSalaryPaymentForDepartement,
  CreateBulkSalaryPaymentBody,
  approveOrRejectSalaryPayment,
} from "@/lib/api/hr-salary-api"
import { Department } from "@/lib/api/hr-api";

interface Employee {
  employeeId: string
  name: string
  position: {
    id: number;
    title: string;
    level?: string;
  } | null;
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
  const [showBulkPaymentDialog, setShowBulkPaymentDialog] = useState<boolean>(false)
  const [newPayment, setNewPayment] = useState({
    employeeId: "",
    payPeriod: "",
    baseSalary: 0,
    overtime: 0,
    bonuses: 0,
    paymentMethod: "Bank Transfer",
    amount: 0,
    paymentDate: null as Date | null,
    periodStart: null as Date | null,
    periodEnd: null as Date | null,
  })
  const [departmentsList, setDepartmentsList] = useState<Department[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; payment: ApiSalaryPayment | null }>({
    open: false,
    payment: null,
  })

  const [employees, setEmployees] = useState<Employee[]>([]);
  useEffect(() => {

    import("@/lib/api/hr-api").then(({ hrApi }) => {
      hrApi.getEmployees()
        .then((empList) => {
          setEmployees(empList.map((e: any) => ({
            employeeId: e.employeeId || e.id?.toString() || "",
            name: (e.user?.firstName ? e.user.firstName : "") + (e.user?.lastName ? " " + e.user.lastName : ""),
            position: e.position ? {
              id: e.position.id,
              title: e.position.title,
              level: e.position.level,
            } : null,
            baseSalary: Number(e.currentSalary) || 0,
            taxRate: e.taxRate || 0,
            benefits: e.benefits || 0,
            bankAccount: e.bankAccountNumber ? "****" + e.bankAccountNumber.slice(-4) : "",
          })));
        })
        .catch(() => setEmployees([]));
      hrApi.getDepartments()
        .then((deptList) => setDepartmentsList(deptList))
        .catch(() => setDepartmentsList([]));
      })
  }, []);

  // Fetch payments from backend
  useEffect(() => {
    setLoading(true)
    listSalaryPayments()
      .then(setPayments)
      .catch((e) => setError("Failed to load salary payments " + e.message))
      .finally(() => setLoading(false))
  }, [])

  const filteredPayments = payments.filter((payment) => {
    // Use nested employee and string fields from API
    const employeeName = payment.employee?.employeeId
      ? payment.employee.employeeId.toLowerCase()
      : payment.employeeId?.toLowerCase() || "";
    let id = "";
    if (typeof payment.id === "string" || typeof payment.id === "number") {
      id = String(payment.id).toLowerCase();
    }
    const matchesSearch =
      employeeName.includes(searchTerm.toLowerCase()) ||
      id.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
    const employee = employees.find((emp) => emp.employeeId === newPayment.employeeId)
    const taxDeduction = employee ? grossPay * employee.taxRate : 0
    const benefitDeduction = employee ? employee.benefits : 0
    const totalDeductions = taxDeduction + benefitDeduction
    const netPay = grossPay - totalDeductions

    return { grossPay, totalDeductions, netPay }
  }

  const calculateBulkPayment = () => {
    let SalaryPayment = 0;
    const employeesList = selectedDepartment?.employees || [];
    console.log("Selected Department Employees:", employeesList);
    SalaryPayment = employeesList.reduce((sum, emp) => sum + Number(emp.currentSalary), 0);
    const grossPay = SalaryPayment + newPayment.overtime + newPayment.bonuses;
    return {
      grossPay
    }
  }

  // Replace handleCreatePayment with API call
  const handleCreatePayment = async () => {
    const employee = employees.find((emp) => emp.employeeId === newPayment.employeeId)
    if (!employee) return
    const body: CreateSalaryPaymentBody = {
      employeeId: newPayment.employeeId,
      payPeriod: newPayment.payPeriod,
      baseSalary: newPayment.baseSalary,
      overtime: newPayment.overtime,
      bonuses: newPayment.bonuses,
      paymentMethod: newPayment.paymentMethod,
      status: "pending",
      paymentDate: newPayment.paymentDate ? newPayment.paymentDate.toISOString().slice(0, 10) : "",
      periodStart: newPayment.periodStart ? newPayment.periodStart.toISOString().slice(0, 10) : undefined,
      periodEnd: newPayment.periodEnd ? newPayment.periodEnd.toISOString().slice(0, 10) : undefined,
    }
    try {
      const created = await createSalaryPayment(body)
      setPayments((prev) => [
        ...prev,
        created,
      ])
      setShowNewPaymentDialog(false)
      setNewPayment({
        employeeId: "",
        payPeriod: "",
        baseSalary: 0,
        overtime: 0,
        bonuses: 0,
        paymentMethod: "Bank Transfer",
        amount: 0,
        paymentDate: null,
        periodStart: null,
        periodEnd: null,
      })
    } catch (e: any) {
      setError("Failed to create payment " + e.message)
    }
  }

  const handleCreateBulkPayment = async () => {
    if (!selectedDepartment) {
      setError("Please select a department")
      return
    }
    // Get filtered employees for bulk payment
    const employeesList = selectedDepartment.employees || [];
    const filteredEmployees = employeesList;
    const employeeIds = filteredEmployees.map(emp => emp.employeeId);
    if (employeeIds.length === 0) {
      setError("No employees found for the selected department/position")
      return;
    }
    const body: CreateBulkSalaryPaymentBody = {
      payPeriod: newPayment.payPeriod,
      paymentMethod: newPayment.paymentMethod,
      overtime: newPayment.overtime,
      bonuses: newPayment.bonuses,
      status: "pending",
      paymentDate: newPayment.paymentDate ? newPayment.paymentDate.toISOString().slice(0, 10) : "",
      periodStart: newPayment.periodStart ? newPayment.periodStart.toISOString().slice(0, 10) : undefined,
      periodEnd: newPayment.periodEnd ? newPayment.periodEnd.toISOString().slice(0, 10) : undefined,
    }
    try {
      const created = await createBulkSalaryPaymentForDepartement(body, selectedDepartment.id)
      setPayments((prev) => [...prev, ...created])
      setShowBulkPaymentDialog(false)
      setNewPayment({
        employeeId: "",
        payPeriod: "",
        baseSalary: 0,
        overtime: 0,
        bonuses: 0,
        paymentMethod: "Bank Transfer",
        amount: 0,
        paymentDate: null,
        periodStart: null,
        periodEnd: null,
      })
    } catch (e: any) {
      setError("Failed to create bulk payment " + e.message)
    } finally {
      setSelectedDepartment(null)
    }
  }

  const handleCancelPayment = async (paymentId: number) => {
    try {
      setLoading(true);
      await approveOrRejectSalaryPayment(paymentId, "cancelled");
      // Refetch payments to update UI
      const refreshedPayments = await listSalaryPayments();
      setPayments(refreshedPayments);
      setLoading(false);
    } catch (e: any) {
      setError("Failed to cancel payment " + e.message)
      setLoading(false);
    }
  }
  const handleProcessPayment = async (paymentId: number) => {
    try {
      setLoading(true);
      await approveOrRejectSalaryPayment(paymentId, "processed");
      // Refetch payments to update UI
      const refreshedPayments = await listSalaryPayments();
      setPayments(refreshedPayments);
      setLoading(false);
    } catch (e: any) {
      setError("Failed to process payment " + e.message)
      setLoading(false);
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
          Loading salary payments...
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Salary Payment Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Process and manage employee salary payments</p>
        </div>
        <div className="flex items-center space-x-2">
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
                    const employee = employees.find((emp) => emp.employeeId === value)
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
                      <SelectItem key={employee.employeeId} value={employee.employeeId}>
                        {employee.name} - {employee.position ? employee.position.title : "No Position"}
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
                <Label htmlFor="periodStart">Period Start</Label>
                <Input
                  id="periodStart"
                  type="date"
                  value={newPayment.periodStart ? newPayment.periodStart.toISOString().slice(0, 10) : ""}
                  onChange={(e) => setNewPayment({ ...newPayment, periodStart: e.target.value ? new Date(e.target.value) : null })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodEnd">Period End</Label>
                <Input
                  id="periodEnd"
                  type="date"
                  value={newPayment.periodEnd ? newPayment.periodEnd.toISOString().slice(0, 10) : ""}
                  onChange={(e) => setNewPayment({ ...newPayment, periodEnd: e.target.value ? new Date(e.target.value) : null })}
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
                <Label htmlFor="paymentDate">Payment Date</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={newPayment.paymentDate ? newPayment.paymentDate.toISOString().slice(0, 10) : ""}
                  onChange={(e) => setNewPayment({ ...newPayment, paymentDate: e.target.value ? new Date(e.target.value) : null })}
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
                    <p className="font-semibold">{calculatePayment().grossPay.toLocaleString()} MAD</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Deductions:</span>
                    <p className="font-semibold">{calculatePayment().totalDeductions.toLocaleString()} MAD</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Net Pay:</span>
                    <p className="font-semibold text-green-600">{calculatePayment().netPay.toLocaleString()} MAD</p>
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
        <Dialog open={showBulkPaymentDialog} onOpenChange={setShowBulkPaymentDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Bulk Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Bulk Salary Payment</DialogTitle>
                <DialogDescription>Process bulk salary payments for multiple employees</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departement">Departement</Label>
                <Select
                  value={selectedDepartment?.id?.toString() || "0"}
                  onValueChange={(value) => {
                    const department = departmentsList.find((dep) => dep.id === Number(value))
                    setSelectedDepartment(department || null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Departement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key={0} value={"0"} disabled>
                      Select department
                    </SelectItem>
                    {departmentsList.map((department) => (
                      <SelectItem key={department.id} value={department.id.toString()}>
                        {department.name} - ({department.code})
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
                <Label htmlFor="periodStart">Period Start</Label>
                <Input
                  id="periodStart"
                  type="date"
                  value={newPayment.periodStart ? newPayment.periodStart.toISOString().slice(0, 10) : ""}
                  onChange={(e) => setNewPayment({ ...newPayment, periodStart: e.target.value ? new Date(e.target.value) : null })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodEnd">Period End</Label>
                <Input
                  id="periodEnd"
                  type="date"
                  value={newPayment.periodEnd ? newPayment.periodEnd.toISOString().slice(0, 10) : ""}
                  onChange={(e) => setNewPayment({ ...newPayment, periodEnd: e.target.value ? new Date(e.target.value) : null })}
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
                <Label htmlFor="paymentDate">Payment Date</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={newPayment.paymentDate ? newPayment.paymentDate.toISOString().slice(0, 10) : ""}
                  onChange={(e) => setNewPayment({ ...newPayment, paymentDate: e.target.value ? new Date(e.target.value) : null })}
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
            {selectedDepartment?.employees && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-semibold mb-2">Payment Calculation</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Gross Pay:</span>
                    <p className="font-semibold">{calculateBulkPayment().grossPay.toLocaleString()} MAD</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Deductions:</span>
                    <p className="font-semibold">{"0"} MAD</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Net Pay:</span>
                    <p className="font-semibold text-green-600">{calculateBulkPayment().grossPay.toLocaleString()} MAD</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkPaymentDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBulkPayment} disabled={!selectedDepartment || !selectedDepartment || !newPayment.payPeriod}>
                Create Bulk Payment
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
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayments.toLocaleString()} MAD</div>
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
                  <TableHead>Gross Pay (MAD)</TableHead>
                  <TableHead>Deductions (MAD)</TableHead>
                  <TableHead>Net Pay (MAD)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const employeeName = payment.employee?.employeeId || payment.employeeId || "";
                  const grossPay = Number(payment.baseSalary) + Number(payment.overtime) + Number(payment.bonuses);
                  const deductions = 0; // If you have deduction logic, update here
                  const netPay = Number(payment.amount);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{employeeName}</div>
                        </div>
                      </TableCell>
                      <TableCell>{payment.payPeriod}</TableCell>
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
                            className="text-destructive"
                            onClick={() => setDeleteDialog({ open: true, payment })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
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
                    <p className="text-lg font-semibold">{selectedPayment.employee?.employeeId || selectedPayment.employeeId}</p>
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
                      <p className="text-2xl font-bold text-blue-800">{Number(selectedPayment.baseSalary).toLocaleString()} MAD</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Label className="text-sm font-medium text-green-600">Overtime</Label>
                      <p className="text-2xl font-bold text-green-800">{Number(selectedPayment.overtime).toLocaleString()} MAD</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <Label className="text-sm font-medium text-purple-600">Bonuses</Label>
                      <p className="text-2xl font-bold text-purple-800">{Number(selectedPayment.bonuses).toLocaleString()} MAD</p>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <Label className="text-sm font-medium text-red-600">Amount</Label>
                      <p className="text-2xl font-bold text-red-800">{Number(selectedPayment.amount).toLocaleString()} MAD</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Gross Pay</Label>
                        <p className="text-xl font-semibold">{(Number(selectedPayment.baseSalary) + Number(selectedPayment.overtime) + Number(selectedPayment.bonuses)).toLocaleString()} MAD</p>
                      </div>
                      <div className="text-right">
                        <Label className="text-sm font-medium text-green-600">Net Pay</Label>
                        <p className="text-2xl font-bold text-green-800">{Number(selectedPayment.amount).toLocaleString()} MAD</p>
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
