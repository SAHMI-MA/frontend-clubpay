"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Users,
  Building2,
  Briefcase,
  Plus,
  Search,
  Edit,
  Trash2,
  UserPlus,
  DollarSign,
  Calendar,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  UserX,
} from "lucide-react"
import { hrApi, Employee, Department, Position } from "@/lib/api/hr-api"
import { Combobox } from "@/components/ui/combobox"
import { userService, User } from "@/lib/services"

// statusColors and statusIcons moved above for use
const statusColors = {
  Active: "bg-green-100 text-green-800",
  Inactive: "bg-gray-100 text-gray-800",
  "On Leave": "bg-yellow-100 text-yellow-800",
  Terminated: "bg-red-100 text-red-800",
  Suspended: "bg-orange-100 text-orange-800",
}

const statusIcons = {
  Active: CheckCircle,
  Inactive: UserX,
  "On Leave": Clock,
  Terminated: AlertCircle,
  Suspended: AlertCircle,
}

export function HRManagement() {
  const [activeTab, setActiveTab] = useState("employees")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null)
  const [selectedPosition, setSelectedPosition] = useState<any>(null)
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false)
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false)
  const [showPositionDialog, setShowPositionDialog] = useState(false)

  // Dynamic state for API data
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add state for department form
  const [departmentForm, setDepartmentForm] = useState({
    name: "",
    code: "",
    description: "",
    location: "",
    budget: ""
  })
  const [isSubmittingDepartment, setIsSubmittingDepartment] = useState(false)
  const [departmentFormError, setDepartmentFormError] = useState<string | null>(null)
  const isEditDepartment = Boolean(selectedDepartment)

  // Employee form state
  const [employeeForm, setEmployeeForm] = useState({
    employeeId: "",
    userId: "",
    departmentId: "",
    positionId: "",
    hireDate: "",
    phoneNumber: "",
    personalEmail: "",
    address: "",
    dateOfBirth: "",
    maritalStatus: "Single",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    nationalId: "",
    bankAccountNumber: "",
    bankName: "",
  })
  const [isSubmittingEmployee, setIsSubmittingEmployee] = useState(false)
  const [employeeFormError, setEmployeeFormError] = useState<string | null>(null)
  const isEditEmployee = Boolean(selectedEmployee)

  // Add state for position form
  const [positionForm, setPositionForm] = useState({
    title: "",
    level: "",
    departmentId: "",
    openings: "",
    minSalary: "",
    maxSalary: "",
    description: "",
    requirements: "",
  })
  const [isSubmittingPosition, setIsSubmittingPosition] = useState(false)
  const [positionFormError, setPositionFormError] = useState<string | null>(null)
  const isEditPosition = Boolean(selectedPosition)

  // Add state for users
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      hrApi.getEmployees().catch((e) => { setError("Failed to load employees"); return [] }),
      hrApi.getDepartments().catch((e) => { setError("Failed to load departments"); return [] }),
      hrApi.getPositions ? hrApi.getPositions().catch((e) => { setError("Failed to load positions"); return [] }) : Promise.resolve([])
    ]).then(([emp, dept, pos]) => {
      setEmployees(emp)
      setDepartments(dept)
      setPositions(pos)
      setLoading(false)
    })
  }, [])

  // Fetch users for combobox
  useEffect(() => {
    setUsersLoading(true)
    userService.getAllUsers()
      .then(setUsers)
      .catch((e) => setUsersError("Failed to load users"))
      .finally(() => setUsersLoading(false))
  }, [])

  // Filter employees based on search and filters
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      (employee.user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.user.email?.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === "all" || employee.status === statusFilter
    const matchesDepartment = departmentFilter === "all" || employee.department.id.toString() === departmentFilter

    return matchesSearch && matchesStatus && matchesDepartment
  })

  // Calculate statistics
  const employeeStats = {
    total: employees.length,
    active: employees.filter((emp) => emp.status === "Active").length,
    inactive: employees.filter((emp) => emp.status === "Inactive").length,
    onLeave: employees.filter((emp) => emp.status === "On Leave").length,
    terminated: employees.filter((emp) => emp.status === "Terminated").length,
    suspended: employees.filter((emp) => emp.status === "Suspended").length,
  }

  const departmentStats = {
    totalDepartments: departments.length,
    totalEmployees: employees.length,
    totalBudget: departments.reduce((sum, dept) => sum + (dept.budget || 0), 0),
  }

  const positionStats = {
    totalPositions: positions.length,
    totalOpenings: positions.reduce((sum, pos) => sum + (pos.openings || 0), 0),
    avgSalaryRange: {
      min: positions.length ? Math.min(...positions.map((pos) => pos.minSalary || 0)) : 0,
      max: positions.length ? Math.max(...positions.map((pos) => pos.maxSalary || 0)) : 0,
    },
  }

  // Populate form when editing
  useEffect(() => {
    if (selectedDepartment) {
      setDepartmentForm({
        name: selectedDepartment.name || "",
        code: selectedDepartment.code || "",
        description: selectedDepartment.description || "",
        location: selectedDepartment.location || "",
        budget: selectedDepartment.budget?.toString() || ""
      })
    } else {
      setDepartmentForm({ name: "", code: "", description: "", location: "", budget: "" })
    }
  }, [selectedDepartment, showDepartmentDialog])

  // Handle department form change
  function handleDepartmentFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setDepartmentForm({ ...departmentForm, [e.target.id]: e.target.value })
  }

  // Handle department create/update
  async function handleDepartmentFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmittingDepartment(true)
    setDepartmentFormError(null)
    try {
      // Remove departmentId logic from department form submit (not needed for department creation)
      const payload = {
        name: departmentForm.name,
        code: departmentForm.code,
        description: departmentForm.description,
        location: departmentForm.location,
        budget: Number(departmentForm.budget),
        // managerId is required by the API type, but should not be sent from the UI
      };
      let department: import("@/lib/api/hr-api").Department;
      if (isEditDepartment) {
        department = await hrApi.updateDepartment(selectedDepartment.id, payload);
        setDepartments((prev) => prev.map((d) => (d.id === department.id ? department : d)));
      } else {
        department = await hrApi.createDepartment(payload as any);
        setDepartments((prev) => [...prev, department]);
      }
      setShowDepartmentDialog(false)
      setSelectedDepartment(null)
    } catch (err: any) {
      setDepartmentFormError(err?.message || "Failed to save department")
    } finally {
      setIsSubmittingDepartment(false)
    }
  }

  // Handle department delete
  async function handleDeleteDepartment(id: number) {
    if (!window.confirm("Are you sure you want to delete this department?")) return
    try {
      await hrApi.deleteDepartment(id)
      setDepartments((prev) => prev.filter((d) => d.id !== id))
    } catch (err: any) {
      alert(err?.message || "Failed to delete department")
    }
  }

  // Populate form when editing
  useEffect(() => {
    if (selectedEmployee) {
      setEmployeeForm({
        employeeId: selectedEmployee.employeeId || "",
        userId: selectedEmployee.user.id?.toString() || "",
        departmentId: selectedEmployee.department.id?.toString() || "",
        positionId: selectedEmployee.position.id?.toString() || "",
        hireDate: selectedEmployee.hireDate?.slice(0, 10) || "",
        phoneNumber: selectedEmployee.phoneNumber || "",
        personalEmail: selectedEmployee.personalEmail || "",
        address: selectedEmployee.address || "",
        dateOfBirth: selectedEmployee.dateOfBirth?.slice(0, 10) || "",
        maritalStatus: selectedEmployee.maritalStatus || "Single",
        emergencyContactName: selectedEmployee.emergencyContactName || "",
        emergencyContactPhone: selectedEmployee.emergencyContactPhone || "",
        emergencyContactRelationship: selectedEmployee.emergencyContactRelationship || "",
        nationalId: selectedEmployee.nationalId || "",
        bankAccountNumber: selectedEmployee.bankAccountNumber || "",
        bankName: selectedEmployee.bankName || "",
      })
    } else {
      setEmployeeForm({
        employeeId: "",
        userId: "",
        departmentId: "",
        positionId: "",
        hireDate: "",
        phoneNumber: "",
        personalEmail: "",
        address: "",
        dateOfBirth: "",
        maritalStatus: "Single",
        emergencyContactName: "",
        emergencyContactPhone: "",
        emergencyContactRelationship: "",
        nationalId: "",
        bankAccountNumber: "",
        bankName: "",
      })
    }
  }, [selectedEmployee, showEmployeeDialog])

  function handleEmployeeFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setEmployeeForm({ ...employeeForm, [e.target.id]: e.target.value })
  }
  function handleEmployeeSelectChange(id: string, value: string) {
    setEmployeeForm({ ...employeeForm, [id]: value })
  }

  async function handleEmployeeFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmittingEmployee(true)
    setEmployeeFormError(null)
    try {
      // In handleEmployeeFormSubmit, generate a random employeeId if creating
      let employeeId = employeeForm.employeeId
      if (!isEditEmployee) {
        employeeId = `EMP${Math.floor(10000 + Math.random() * 90000)}`
      }
      const payload = {
        employeeId,
        userId: Number(employeeForm.userId),
        departmentId: Number(employeeForm.departmentId),
        positionId: Number(employeeForm.positionId),
        hireDate: employeeForm.hireDate,
        phoneNumber: employeeForm.phoneNumber,
        personalEmail: employeeForm.personalEmail,
        address: employeeForm.address,
        dateOfBirth: employeeForm.dateOfBirth,
        maritalStatus: employeeForm.maritalStatus as import("@/lib/api/hr-api").MaritalStatus,
        emergencyContactName: employeeForm.emergencyContactName,
        emergencyContactPhone: employeeForm.emergencyContactPhone,
        emergencyContactRelationship: employeeForm.emergencyContactRelationship,
        nationalId: employeeForm.nationalId,
        bankAccountNumber: employeeForm.bankAccountNumber,
        bankName: employeeForm.bankName,
      }
      let employee: import("@/lib/api/hr-api").Employee
      if (isEditEmployee) {
        employee = await hrApi.updateEmployee(selectedEmployee.id, payload)
        setEmployees((prev) => prev.map((e) => (e.id === employee.id ? employee : e)))
      } else {
        employee = await hrApi.createEmployee(payload)
        setEmployees((prev) => [...prev, employee])
      }
      setShowEmployeeDialog(false)
      setSelectedEmployee(null)
    } catch (err: any) {
      setEmployeeFormError(err?.message || "Failed to save employee")
    } finally {
      setIsSubmittingEmployee(false)
    }
  }

  async function handleDeleteEmployee(id: number) {
    if (!window.confirm("Are you sure you want to delete this employee?")) return
    try {
      await hrApi.deleteEmployee(id)
      setEmployees((prev) => prev.filter((e) => e.id !== id))
    } catch (err: any) {
      alert(err?.message || "Failed to delete employee")
    }
  }

  // Populate form when editing
  useEffect(() => {
    if (selectedPosition) {
      setPositionForm({
        title: selectedPosition.title || "",
        level: selectedPosition.level || "",
        departmentId: selectedPosition.department?.id?.toString() || "",
        openings: selectedPosition.openings?.toString() || "",
        minSalary: selectedPosition.minSalary?.toString() || "",
        maxSalary: selectedPosition.maxSalary?.toString() || "",
        description: selectedPosition.description || "",
        requirements: selectedPosition.requirements || "",
      })
    } else {
      setPositionForm({
        title: "",
        level: "",
        departmentId: "",
        openings: "",
        minSalary: "",
        maxSalary: "",
        description: "",
        requirements: "",
      })
    }
  }, [selectedPosition, showPositionDialog])

  function handlePositionFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setPositionForm({ ...positionForm, [e.target.id]: e.target.value })
  }
  function handlePositionSelectChange(id: string, value: string) {
    setPositionForm({ ...positionForm, [id]: value })
  }

  async function handlePositionFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmittingPosition(true)
    setPositionFormError(null)
    try {
      const payload = {
        title: positionForm.title,
        level: positionForm.level,
        departmentId: Number(positionForm.departmentId),
        openings: Number(positionForm.openings),
        minSalary: Number(positionForm.minSalary),
        maxSalary: Number(positionForm.maxSalary),
        description: positionForm.description,
        requirements: positionForm.requirements,
      }
      let position: import("@/lib/api/hr-api").Position
      if (isEditPosition) {
        position = await hrApi.updatePosition(selectedPosition.id, payload)
        setPositions((prev) => prev.map((p) => (p.id === position.id ? position : p)))
      } else {
        position = await hrApi.createPosition(payload)
        setPositions((prev) => [...prev, position])
      }
      setShowPositionDialog(false)
      setSelectedPosition(null)
    } catch (err: any) {
      setPositionFormError(err?.message || "Failed to save position")
    } finally {
      setIsSubmittingPosition(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">HR Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage employees, departments, and positions</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {employeeStats.active} active, {employeeStats.onLeave} on leave
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departmentStats.totalDepartments}</div>
            <p className="text-xs text-muted-foreground">
              ${(departmentStats.totalBudget / 1000000).toFixed(1)}M total budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positions</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positionStats.totalPositions}</div>
            <p className="text-xs text-muted-foreground">{positionStats.totalOpenings} open positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salary Range</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(positionStats.avgSalaryRange.min / 1000).toFixed(0)}K-$
              {(positionStats.avgSalaryRange.max / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground">Average salary range</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Employee Management</CardTitle>
                  <CardDescription>Manage employee records and information</CardDescription>
                </div>
                <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setSelectedEmployee(null)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Employee
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl w-[800px] min-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>{isEditEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
                      <DialogDescription>
                        {isEditEmployee ? "Update employee information" : "Enter employee details"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEmployeeFormSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="userId">User</Label>
                          <Combobox
                            options={users.map((u) => ({
                              value: u.id.toString(),
                              label: `${u.firstName} ${u.lastName}`,
                              keywords: `${u.email} ${u.firstName} ${u.lastName}`
                            }))}
                            value={employeeForm.userId}
                            onValueChange={(v) => handleEmployeeSelectChange("userId", v)}
                            placeholder={usersLoading ? "Loading users..." : "Select user"}
                            searchPlaceholder="Search users..."
                            emptyText={usersLoading ? "Loading..." : usersError || "No users found"}
                            disabled={usersLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="departmentId">Department</Label>
                          <Select value={employeeForm.departmentId} onValueChange={(v) => handleEmployeeSelectChange("departmentId", v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="positionId">Position</Label>
                          <Select value={employeeForm.positionId} onValueChange={(v) => handleEmployeeSelectChange("positionId", v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                            <SelectContent>
                              {positions.map((pos) => (
                                <SelectItem key={pos.id} value={pos.id.toString()}>
                                  {pos.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hireDate">Hire Date</Label>
                          <Input id="hireDate" type="date" value={employeeForm.hireDate} onChange={handleEmployeeFormChange} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber">Phone Number</Label>
                          <Input id="phoneNumber" placeholder="123-456-7890" value={employeeForm.phoneNumber} onChange={handleEmployeeFormChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="personalEmail">Personal Email</Label>
                          <Input id="personalEmail" type="email" placeholder="you@example.com" value={employeeForm.personalEmail} onChange={handleEmployeeFormChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Textarea id="address" placeholder="123 Main St, Apt 4B" value={employeeForm.address} onChange={handleEmployeeFormChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth">Date of Birth</Label>
                          <Input id="dateOfBirth" type="date" value={employeeForm.dateOfBirth} onChange={handleEmployeeFormChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maritalStatus">Marital Status</Label>
                          <Select value={employeeForm.maritalStatus} onValueChange={(v) => handleEmployeeSelectChange("maritalStatus", v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Single">Single</SelectItem>
                              <SelectItem value="Married">Married</SelectItem>
                              <SelectItem value="Divorced">Divorced</SelectItem>
                              <SelectItem value="Widowed">Widowed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                          <Input id="emergencyContactName" placeholder="John Doe" value={employeeForm.emergencyContactName} onChange={handleEmployeeFormChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                          <Input id="emergencyContactPhone" placeholder="987-654-3210" value={employeeForm.emergencyContactPhone} onChange={handleEmployeeFormChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emergencyContactRelationship">Emergency Contact Relationship</Label>
                          <Input id="emergencyContactRelationship" placeholder="Brother" value={employeeForm.emergencyContactRelationship} onChange={handleEmployeeFormChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nationalId">National ID</Label>
                          <Input id="nationalId" placeholder="123456789" value={employeeForm.nationalId} onChange={handleEmployeeFormChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                          <Input id="bankAccountNumber" placeholder="Account Number" value={employeeForm.bankAccountNumber} onChange={handleEmployeeFormChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bankName">Bank Name</Label>
                          <Input id="bankName" placeholder="Bank Name" value={employeeForm.bankName} onChange={handleEmployeeFormChange} />
                        </div>
                      </div>
                      {employeeFormError && <div className="text-red-500 text-sm mb-2">{employeeFormError}</div>}
                      <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => setShowEmployeeDialog(false)} disabled={isSubmittingEmployee}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmittingEmployee}>
                          {isEditEmployee ? "Update" : "Create"} Employee
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                    <SelectItem value="Terminated">Terminated</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Employee Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Hire Date</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => {
                      const StatusIcon = statusIcons[employee.status as keyof typeof statusIcons]
                      return (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {employee.user.fullName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {employee.employeeId} • {employee.user.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{employee.department.name}</div>
                              <div className="text-sm text-gray-500">{employee.department.code}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{employee.position.title}</div>
                              <div className="text-sm text-gray-500">{employee.position.level}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[employee.status as keyof typeof statusColors]}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {employee.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                              {new Date(employee.hireDate).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center text-sm">
                                <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                {employee.phoneNumber}
                              </div>
                              <div className="flex items-center text-sm">
                                <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                {employee.personalEmail}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedEmployee(employee)
                                  setShowEmployeeDialog(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDeleteEmployee(employee.id)}>
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
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Department Management</CardTitle>
                  <CardDescription>Manage organizational departments</CardDescription>
                </div>
                <Dialog open={showDepartmentDialog} onOpenChange={setShowDepartmentDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setSelectedDepartment(null)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Department
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{isEditDepartment ? "Edit Department" : "Add New Department"}</DialogTitle>
                      <DialogDescription>
                        {isEditDepartment ? "Update department information" : "Enter department details"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleDepartmentFormSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="deptName">Department Name</Label>
                          <Input id="name" placeholder="Human Resources" value={departmentForm.name} onChange={handleDepartmentFormChange} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deptCode">Department Code</Label>
                          <Input id="code" placeholder="HR" value={departmentForm.code} onChange={handleDepartmentFormChange} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input id="location" placeholder="Building A, Floor 2" value={departmentForm.location} onChange={handleDepartmentFormChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="budget">Budget</Label>
                          <Input id="budget" type="number" placeholder="500000" value={departmentForm.budget} onChange={handleDepartmentFormChange} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="deptDescription">Description</Label>
                          <Textarea id="description" placeholder="Department description" value={departmentForm.description} onChange={handleDepartmentFormChange} />
                        </div>
                      </div>
                      {departmentFormError && <div className="text-red-500 text-sm mb-2">{departmentFormError}</div>}
                      <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => setShowDepartmentDialog(false)} disabled={isSubmittingDepartment}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmittingDepartment}>
                          {isEditDepartment ? "Update" : "Create"} Department
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((department) => (
                  <Card key={department.id} className="relative">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{department.name}</CardTitle>
                          <CardDescription>{department.code}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDepartment(department)
                              setShowDepartmentDialog(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteDepartment(department.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">{department.description}</p>

                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          {department.location}
                        </div>

                        <div className="flex items-center text-sm">
                          <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                          Budget: ${department.budget.toLocaleString()}
                        </div>

                        <div className="flex items-center text-sm">
                          <Users className="h-4 w-4 mr-2 text-gray-400" />
                          {(department.employees?.length ?? 0)} employees
                        </div>

                        <div className="pt-2 border-t">
                          <div className="text-sm font-medium">Employees:</div>
                          <div className="mt-1 space-y-1">
                            {(department.employees?.slice(0, 3) ?? []).map((emp: any) => (
                              <div key={emp.id} className="text-xs text-gray-600">
                                {emp.user.fullName} - {emp.position.title}
                              </div>
                            ))}
                            {(department.employees?.length ?? 0) > 3 && (
                              <div className="text-xs text-gray-500">+{(department.employees?.length ?? 0) - 3} more</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Position Management</CardTitle>
                  <CardDescription>Manage job positions and requirements</CardDescription>
                </div>
                <Dialog open={showPositionDialog} onOpenChange={setShowPositionDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setSelectedPosition(null)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Position
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{isEditPosition ? "Edit Position" : "Add New Position"}</DialogTitle>
                      <DialogDescription>{isEditPosition ? "Update position information" : "Enter position details"}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePositionFormSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Position Title</Label>
                          <Input id="title" placeholder="Software Engineer" value={positionForm.title} onChange={handlePositionFormChange} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="level">Level</Label>
                          <Select value={positionForm.level} onValueChange={(v) => handlePositionSelectChange("level", v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Entry Level">Entry Level</SelectItem>
                              <SelectItem value="Junior">Junior</SelectItem>
                              <SelectItem value="Senior">Senior</SelectItem>
                              <SelectItem value="Lead">Lead</SelectItem>
                              <SelectItem value="Manager">Manager</SelectItem>
                              <SelectItem value="Director">Director</SelectItem>
                              <SelectItem value="Executive">Executive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="departmentId">Department</Label>
                          <Select value={positionForm.departmentId} onValueChange={(v) => handlePositionSelectChange("departmentId", v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="openings">Openings</Label>
                          <Input id="openings" type="number" placeholder="2" value={positionForm.openings} onChange={handlePositionFormChange} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="minSalary">Min Salary</Label>
                          <Input id="minSalary" type="number" placeholder="80000" value={positionForm.minSalary} onChange={handlePositionFormChange} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxSalary">Max Salary</Label>
                          <Input id="maxSalary" type="number" placeholder="120000" value={positionForm.maxSalary} onChange={handlePositionFormChange} required />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea id="description" placeholder="Position description" value={positionForm.description} onChange={handlePositionFormChange} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="requirements">Requirements</Label>
                          <Textarea id="requirements" placeholder="Required qualifications and experience" value={positionForm.requirements} onChange={handlePositionFormChange} />
                        </div>
                      </div>
                      {positionFormError && <div className="text-red-500 text-sm mb-2">{positionFormError}</div>}
                      <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => setShowPositionDialog(false)} disabled={isSubmittingPosition}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmittingPosition}>
                          {isEditPosition ? "Update" : "Create"} Position
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Salary Range</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Openings</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((position) => (
                      <TableRow key={position.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{position.title}</div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">{position.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>{departments.find((d) => d.id === position.department?.id)?.name ?? ''}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{position.level}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1 text-gray-400" />${position.minSalary.toLocaleString()}{" "}
                            - ${position.maxSalary.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-gray-400" />
                            {(position.employees?.length ?? 0)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {position.openings > 0 ? (
                            <Badge className="bg-green-100 text-green-800">{position.openings} open</Badge>
                          ) : (
                            <Badge variant="outline">Filled</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPosition(position)
                                setShowPositionDialog(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
