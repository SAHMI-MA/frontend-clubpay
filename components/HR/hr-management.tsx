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
import { hrApi, Employee, Department, Position, CreateEmployeeRequest } from "@/lib/api/hr-api"
import { Combobox } from "@/components/ui/combobox"
import { userService, User } from "@/lib/services"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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

  // Employee form state using CreateEmployeeRequest
  const [employeeForm, setEmployeeForm] = useState<CreateEmployeeRequest>({
    userId: undefined, // userId is optional
    fullName: "",
    departmentId: 0,
    positionId: 0,
    hireDate: "",
    dateOfBirth: "",
    nationalId: "",
    status: "Active",
    phoneNumber: "",
    personalEmail: "",
    address: "",
    maritalStatus: "Single",
    currentSalary: ""
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
  const [, setUsersLoading] = useState(false)
  const [, setUsersError] = useState<string | null>(null)

  // Add state for employee delete dialog
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)
  const [isDeletingEmployee, setIsDeletingEmployee] = useState(false)
  const [deleteEmployeeError, setDeleteEmployeeError] = useState<string | null>(null)

  // Add state for department and position delete dialogs
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null)
  const [isDeletingDepartment, setIsDeletingDepartment] = useState(false)
  const [deleteDepartmentError, setDeleteDepartmentError] = useState<string | null>(null)

  const [positionToDelete, setPositionToDelete] = useState<Position | null>(null)
  const [isDeletingPosition, setIsDeletingPosition] = useState(false)
  const [deletePositionError, setDeletePositionError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      hrApi.getDepartments().catch((e: any) => { setError("Failed to load departments " + e.message); return [] }),
      hrApi.getPositions ? hrApi.getPositions().catch((e: any) => { setError("Failed to load positions " + e.message); return [] }) : Promise.resolve([]),
      hrApi.getEmployees().catch((e: any) => { setError("Failed to load employees " + e.message); return [] })
    ]).then(([dept, pos, empList]) => {
      setDepartments(dept)
      setPositions(pos)
      // Use backend employees directly
      setEmployees(empList)
      setLoading(false)
    })
  }, [])

  // Fetch users for combobox
  useEffect(() => {
    setUsersLoading(true)
    userService.getAllUsers()
      .then(setUsers)
      .catch((e: any) => setUsersError("Failed to load users " + e.message))
      .finally(() => setUsersLoading(false))
  }, [])

  // Filter employees based on search and filters
  const filteredEmployees = employees.filter((employee) => {
    const user = employee.user;
    const userEmail = user && 'email' in user && user.email ? user.email : '';
    const matchesSearch =
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase())

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
        if (!department || department.id === undefined) {
          // Defensive: reload all departments if backend response is missing id
          const allDepartments = await hrApi.getDepartments();
          setDepartments(allDepartments);
        } else {
          setDepartments((prev) => [...prev, department]);
        }
      }
      setShowDepartmentDialog(false)
      setSelectedDepartment(null)
    } catch (err: any) {
      setDepartmentFormError(err?.message || "Failed to save department")
    } finally {
      setIsSubmittingDepartment(false)
    }
  }

  // Populate form when editing
  useEffect(() => {
    if (selectedEmployee) {
      setEmployeeForm({
        userId: selectedEmployee.user?.id ?? undefined, // userId is optional
        fullName: selectedEmployee.fullName || "",
        departmentId: selectedEmployee.department?.id ?? 0,
        positionId: selectedEmployee.position?.id ?? 0,
        hireDate: selectedEmployee.hireDate || "",
        dateOfBirth: selectedEmployee.dateOfBirth || "",
        nationalId: selectedEmployee.nationalId || "",
        status: selectedEmployee.status || "Active",
        phoneNumber: selectedEmployee.phoneNumber || "",
        personalEmail: selectedEmployee.personalEmail || "",
        address: selectedEmployee.address || "",
        maritalStatus: selectedEmployee.maritalStatus || "Single",
        currentSalary: selectedEmployee.currentSalary?.toString() || ""
      })
    } else {
      setEmployeeForm({
        userId: undefined, // userId is optional
        fullName: "",
        departmentId: 0,
        positionId: 0,
        hireDate: new Date().toISOString().slice(0, 10),
        dateOfBirth: "",
        nationalId: "",
        status: "Active",
        phoneNumber: "",
        personalEmail: "",
        address: "",
        maritalStatus: "Single",
        currentSalary: ""
      })
    }
  }, [selectedEmployee, showEmployeeDialog])

  // Generate Employee ID when department changes (for create only)
  useEffect(() => {
    if (!isEditEmployee && employeeForm.departmentId) {
      const dept = departments.find((d) => d.id === employeeForm.departmentId)
      if (dept && dept.code) {
        // If employeeId is part of CreateEmployeeRequest, set it here
        // setEmployeeForm((prev) => ({ ...prev, employeeId: `${prefix}${randomNum}` }))
      }
    }
    // Only run when departmentId changes and not editing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeForm.departmentId, isEditEmployee])

  function handleEmployeeFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { id, value } = e.target;
    if (id === "userId" || id === "departmentId" || id === "positionId") {
      setEmployeeForm({ ...employeeForm, [id]: value === "" ? undefined : parseInt(value, 10) })
    } else {
      setEmployeeForm({ ...employeeForm, [id]: value })
    }
  }
  function handleEmployeeSelectChange(id: string, value: string) {
    if (id === "userId" || id === "departmentId" || id === "positionId") {
      setEmployeeForm({ ...employeeForm, [id]: value === "" ? undefined : parseInt(value, 10) })
    } else {
      setEmployeeForm({ ...employeeForm, [id]: value })
    }
  }

  async function handleEmployeeFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmittingEmployee(true)
    setEmployeeFormError(null)
    // Validate fullName is not empty or whitespace
    if (!employeeForm.fullName || employeeForm.fullName.trim() === "") {
      setEmployeeFormError("Le nom complet est obligatoire.");
      setIsSubmittingEmployee(false);
      return;
    }
    try {
      if (isEditEmployee) {
        // PATCH: only allowed fields, use CreateEmployeeRequest for type safety
        // Remove userId, hireDate, dateOfBirth, nationalId from payload
        const { ...updatePayload } = employeeForm;
        // Use employee.employeeId for update, not selectedEmployee.id
        const employee = await hrApi.updateEmployee(selectedEmployee.employeeId, updatePayload);
        setEmployees((prev) => prev.map((e) => (e.employeeId === employee.employeeId ? employee : e)));
      } else {
        // CREATE: use CreateEmployeeRequest directly
        const payload: import("@/lib/api/hr-api").CreateEmployeeRequest = {
          ...employeeForm,
          userId: employeeForm.userId === undefined ? null : employeeForm.userId
        };
        const employee = await hrApi.createEmployee(payload);
        setEmployees((prev) => [...prev, employee]);
      }
      setShowEmployeeDialog(false);
      setSelectedEmployee(null);
    } catch (err: any) {
      setEmployeeFormError(err?.message || "Failed to save employee");
    } finally {
      setIsSubmittingEmployee(false);
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
        if (!position || position.id === undefined) {
          // Defensive: reload all positions if backend response is missing id
          const allPositions = await hrApi.getPositions();
          setPositions(allPositions);
        } else {
          setPositions((prev) => [...prev, position])
        }
      }
      setShowPositionDialog(false)
      setSelectedPosition(null)
    } catch (err: any) {
      setPositionFormError(err?.message || "Failed to save position")
    } finally {
      setIsSubmittingPosition(false)
    }
  }

  // Confirm employee deletion
  async function handleDeleteEmployeeConfirmed() {
    if (!employeeToDelete) return;
    setIsDeletingEmployee(true);
    setDeleteEmployeeError(null);
    try {
      await hrApi.deleteEmployee(employeeToDelete.employeeId);
      setEmployees((prev) => prev.filter((e) => e.employeeId !== employeeToDelete.employeeId));
      setEmployeeToDelete(null);
    } catch (err: any) {
      setDeleteEmployeeError(err?.message || "Failed to delete employee");
    } finally {
      setIsDeletingEmployee(false);
    }
  }

  // Fonction utilitaire pour formater les montants en MAD
  const formatMAD = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2
    }).format(amount)
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion RH</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérez les employés, départements et postes</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nombre total d'employés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {employeeStats.active} actifs, {employeeStats.onLeave} en congé
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Départements</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departmentStats.totalDepartments}</div>
            <p className="text-xs text-muted-foreground">
              {formatMAD(departmentStats.totalBudget)} budget total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Postes</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positionStats.totalPositions}</div>
            <p className="text-xs text-muted-foreground">{positionStats.totalOpenings} postes ouverts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fourchette salariale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {positionStats.avgSalaryRange.min ? `${formatMAD(positionStats.avgSalaryRange.min)} - ${formatMAD(positionStats.avgSalaryRange.max)}` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Fourchette salariale moyenne</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">    
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="employees">Employés</TabsTrigger>
          <TabsTrigger value="departments">Départements</TabsTrigger>
          <TabsTrigger value="positions">Postes</TabsTrigger>
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestion des employés</CardTitle>
                  <CardDescription>Gérez les dossiers et informations des employés</CardDescription>
                </div>
                <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setSelectedEmployee(null)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Ajouter un employé
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl w-[800px] min-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>{isEditEmployee ? "Modifier l'employé" : "Ajouter un nouvel employé"}</DialogTitle>
                      <DialogDescription>
                        {isEditEmployee ? "Mettre à jour les informations de l'employé" : "Saisissez les informations de l'employé"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEmployeeFormSubmit}>
                      <Tabs defaultValue="personal" className="space-y-4">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                          <TabsTrigger value="personal">Informations personnelles</TabsTrigger>
                          <TabsTrigger value="job">Détails du poste</TabsTrigger>
                        </TabsList>
                        <TabsContent value="personal">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="fullName">Nom complet</Label>
                              <Input id="fullName" placeholder="Nom complet" value={employeeForm.fullName} onChange={handleEmployeeFormChange} required />
                            </div>
                            {!isEditEmployee && (
                              <>
                                <div className="space-y-2 flex flex-row gap-2 items-end">
                                  <div className="flex-1">
                                    <Label htmlFor="userId">Utilisateur (optionnel)</Label>
                                    <Combobox
                                      value={employeeForm.userId ? employeeForm.userId.toString() : ""}
                                      onValueChange={(v: string) => handleEmployeeSelectChange("userId", v)}
                                      options={users.map((u) => ({ value: u.id.toString(), label: `${u.firstName || ""} ${u.lastName || ""}` }))}
                                      disabled={employeeForm.userId === null}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="hireDate">Date d'embauche</Label>
                                  <Input id="hireDate" type="date" value={employeeForm.hireDate} onChange={handleEmployeeFormChange} />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="dateOfBirth">Date de naissance</Label>
                                  <Input id="dateOfBirth" type="date" value={employeeForm.dateOfBirth} onChange={handleEmployeeFormChange} />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="nationalId">CIN</Label>
                                  <Input id="nationalId" value={employeeForm.nationalId} onChange={handleEmployeeFormChange} />
                                </div>
                              </>
                            )}
                            <div className="space-y-2">
                              <Label htmlFor="phoneNumber">Téléphone</Label>
                              <Input id="phoneNumber" placeholder="06 12 34 56 78" value={employeeForm.phoneNumber} onChange={handleEmployeeFormChange} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="personalEmail">Email personnel</Label>
                              <Input id="personalEmail" type="email" placeholder="vous@exemple.com" value={employeeForm.personalEmail} onChange={handleEmployeeFormChange} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="address">Adresse</Label>
                              <Textarea id="address" placeholder="123 rue Principale, Appt 4B" value={employeeForm.address} onChange={handleEmployeeFormChange} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="maritalStatus">Situation familiale</Label>
                              <Select value={employeeForm.maritalStatus} onValueChange={(v) => handleEmployeeSelectChange("maritalStatus", v)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner la situation" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Single">Célibataire</SelectItem>
                                  <SelectItem value="Married">Marié(e)</SelectItem>
                                  <SelectItem value="Divorced">Divorcé(e)</SelectItem>
                                  <SelectItem value="Widowed">Veuf(ve)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="job">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="departmentId">Département</Label>
                              <Select value={employeeForm.departmentId.toString()} onValueChange={(v) => handleEmployeeSelectChange("departmentId", v)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un département" />
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
                              <Label htmlFor="positionId">Poste</Label>
                              <Select value={employeeForm.positionId.toString()} onValueChange={(v) => handleEmployeeSelectChange("positionId", v)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un poste" />
                                </SelectTrigger>
                                <SelectContent>
                                  {positions
                                    .filter((pos) => pos.department.id === employeeForm.departmentId)
                                    .map((pos) => (
                                      <SelectItem key={pos.id} value={pos.id.toString()}>
                                        {pos.title}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="status">Statut</Label>
                              <Select value={employeeForm.status} onValueChange={(v) => handleEmployeeSelectChange("status", v)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner le statut" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Active">Actif</SelectItem>
                                  <SelectItem value="Inactive">Inactif</SelectItem>
                                  <SelectItem value="On Leave">En congé</SelectItem>
                                  <SelectItem value="Terminated">Terminé</SelectItem>
                                  <SelectItem value="Suspended">Suspendu</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="currentSalary">Salaire actuel (MAD)</Label>
                              <Input id="currentSalary" type="number" min="0" step="0.01" placeholder="Entrez le salaire actuel" value={employeeForm.currentSalary} onChange={handleEmployeeFormChange} />
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                      {employeeFormError && <div className="text-red-500 text-sm mb-2">{employeeFormError}</div>}
                      <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => setShowEmployeeDialog(false)} disabled={isSubmittingEmployee}>
                          Annuler
                        </Button>
                        <Button type="submit" disabled={isSubmittingEmployee}>
                          {isEditEmployee ? "Mettre à jour" : "Créer"} l'employé
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
                    placeholder="Rechercher un employé..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="Active">Actif</SelectItem>
                    <SelectItem value="Inactive">Inactif</SelectItem>
                    <SelectItem value="On Leave">En congé</SelectItem>
                    <SelectItem value="Terminated">Terminé</SelectItem>
                    <SelectItem value="Suspended">Suspendu</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrer par département" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les départements</SelectItem>
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
                      <TableHead>Employé</TableHead>
                      <TableHead>Département</TableHead>
                      <TableHead>Poste</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date d'embauche</TableHead>
                      <TableHead>Salaire actuel (MAD)</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => {
                      const StatusIcon = statusIcons[employee.status as keyof typeof statusIcons]
                      return (
                        <TableRow key={employee.employeeId}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {employee.fullName || "Nom non renseigné"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {employee.employeeId}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{employee.department?.name ?? ""}</div>
                              <div className="text-sm text-gray-500">{employee.department?.code ?? ""}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{employee.position?.title ?? ""}</div>
                              <div className="text-sm text-gray-500">{employee.position?.level ?? ""}</div>
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
                              {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : ""}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatMAD(Number(employee.currentSalary) || 0)}</div>
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
                              <Button variant="outline" size="sm" onClick={() => setEmployeeToDelete(employee)}>
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
                  <CardTitle>Gestion des départements</CardTitle>
                  <CardDescription>Gérez les départements de l'organisation</CardDescription>
                </div>
                <Dialog open={showDepartmentDialog} onOpenChange={setShowDepartmentDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setSelectedDepartment(null)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un département
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{isEditDepartment ? "Modifier le département" : "Ajouter un nouveau département"}</DialogTitle>
                      <DialogDescription>
                        {isEditDepartment ? "Mettre à jour les informations du département" : "Saisissez les informations du département"}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleDepartmentFormSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="deptName">Nom du département</Label>
                          <Input id="name" placeholder="Ressources Humaines" value={departmentForm.name} onChange={handleDepartmentFormChange} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deptCode">Code du département</Label>
                          <Input id="code" placeholder="RH" value={departmentForm.code} onChange={handleDepartmentFormChange} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Emplacement</Label>
                          <Input id="location" placeholder="Bâtiment A, 2ème étage" value={departmentForm.location} onChange={handleDepartmentFormChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="budget">Budget</Label>
                          <Input id="budget" type="number" placeholder="500000" value={departmentForm.budget} onChange={handleDepartmentFormChange} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="deptDescription">Description</Label>
                          <Textarea id="description" placeholder="Description du département" value={departmentForm.description} onChange={handleDepartmentFormChange} />
                        </div>
                      </div>
                      {departmentFormError && <div className="text-red-500 text-sm mb-2">{departmentFormError}</div>}
                      <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => setShowDepartmentDialog(false)} disabled={isSubmittingDepartment}>
                          Annuler
                        </Button>
                        <Button type="submit" disabled={isSubmittingDepartment}>
                          {isEditDepartment ? "Mettre à jour" : "Créer"} le département
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
                          <Button variant="outline" size="sm" onClick={() => setDepartmentToDelete(department)}>
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
                          Budget: {formatMAD(Number(department.budget) || 0)}
                        </div>

                        <div className="flex items-center text-sm">
                          <Users className="h-4 w-4 mr-2 text-gray-400" />
                          {(department.employees?.length ?? 0)} employés
                        </div>

                        <div className="pt-2 border-t">
                          <div className="text-sm font-medium">Employés:</div>
                          <div className="mt-1 space-y-1">
                            {(department.employees?.slice(0, 3) ?? []).map((emp: any) => {
                              const user = emp.user;
                              const position = emp.position;
                              const userDisplay = user
                                ? `${user.firstName || ""} ${user.lastName || ""} (${user.email || "Aucun email"})`
                                : "Aucun utilisateur lié";
                              return (
                                <div key={emp.id} className="text-xs text-gray-700 dark:text-gray-300">
                                  {userDisplay} - {position?.title ?? "Aucun poste"}
                                </div>
                              );
                            })}
                            {(department.employees?.length ?? 0) > 3 && (
                              <div className="text-xs text-gray-500">+{(department.employees?.length ?? 0) - 3} plus</div>
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
                  <CardTitle>Gestion des postes</CardTitle>
                  <CardDescription>Gérez les postes et exigences</CardDescription>
                </div>
                <Dialog open={showPositionDialog} onOpenChange={setShowPositionDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setSelectedPosition(null)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un poste
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{isEditPosition ? "Modifier le poste" : "Ajouter un nouveau poste"}</DialogTitle>
                      <DialogDescription>{isEditPosition ? "Mettre à jour les informations du poste" : "Saisissez les informations du poste"}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePositionFormSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Intitulé du poste</Label>
                          <Input id="title" placeholder="Ingénieur Logiciel" value={positionForm.title} onChange={handlePositionFormChange} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="level">Niveau</Label>
                          <Select value={positionForm.level} onValueChange={(v) => handlePositionSelectChange("level", v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner le niveau" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Entry Level">Débutant</SelectItem>
                              <SelectItem value="Junior">Junior</SelectItem>
                              <SelectItem value="Senior">Senior</SelectItem>
                              <SelectItem value="Lead">Lead</SelectItem>
                              <SelectItem value="Manager">Manager</SelectItem>
                              <SelectItem value="Director">Directeur</SelectItem>
                              <SelectItem value="Executive">Cadre dirigeant</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="departmentId">Département</Label>
                          <Select value={positionForm.departmentId} onValueChange={(v) => handlePositionSelectChange("departmentId", v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un département" />
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
                          <Label htmlFor="openings">Postes ouverts</Label>
                          <Input id="openings" type="number" placeholder="2" value={positionForm.openings} onChange={handlePositionFormChange} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="minSalary">Salaire min</Label>
                          <Input id="minSalary" type="number" placeholder="80000" value={positionForm.minSalary} onChange={handlePositionFormChange} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxSalary">Salaire max</Label>
                          <Input id="maxSalary" type="number" placeholder="120000" value={positionForm.maxSalary} onChange={handlePositionFormChange} required />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea id="description" placeholder="Description du poste" value={positionForm.description} onChange={handlePositionFormChange} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="requirements">Exigences</Label>
                          <Textarea id="requirements" placeholder="Qualifications et expérience requises" value={positionForm.requirements} onChange={handlePositionFormChange} />
                        </div>
                      </div>
                      {positionFormError && <div className="text-red-500 text-sm mb-2">{positionFormError}</div>}
                      <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => setShowPositionDialog(false)} disabled={isSubmittingPosition}>
                          Annuler
                        </Button>
                        <Button type="submit" disabled={isSubmittingPosition}>
                          {isEditPosition ? "Mettre à jour" : "Créer"} le poste
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
                      <TableHead>Poste</TableHead>
                      <TableHead>Département</TableHead>
                      <TableHead>Niveau</TableHead>
                      <TableHead>Fourchette salariale</TableHead>
                      <TableHead>Employés</TableHead>
                      <TableHead>Postes ouverts</TableHead>
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
                            <DollarSign className="h-4 w-4 mr-1 text-gray-400" />{formatMAD(Number(position.minSalary) || 0)} - {formatMAD(Number(position.maxSalary) || 0)}
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
                            <Badge className="bg-green-100 text-green-800">{position.openings} ouvert(s)</Badge>
                          ) : (
                            <Badge variant="outline">Pourvu</Badge>
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
                            <Button variant="outline" size="sm" onClick={() => setPositionToDelete(position)}>
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

      {/* Employee Delete Confirmation Dialog */}
      <Dialog open={!!employeeToDelete} onOpenChange={(open) => { if (!open) setEmployeeToDelete(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer l'employé</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet employé ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {deleteEmployeeError && <div className="text-red-500 text-sm mb-2">{deleteEmployeeError}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmployeeToDelete(null)} disabled={isDeletingEmployee}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteEmployeeConfirmed} disabled={isDeletingEmployee}>
              {isDeletingEmployee ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Department Delete Confirmation Dialog */}
      <Dialog open={!!departmentToDelete} onOpenChange={open => { if (!open) setDepartmentToDelete(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer le département</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce département ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {deleteDepartmentError && <div className="text-red-500 text-sm mb-2">{deleteDepartmentError}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepartmentToDelete(null)} disabled={isDeletingDepartment}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!departmentToDelete) return;
                setIsDeletingDepartment(true);
                setDeleteDepartmentError(null);
                try {
                  await hrApi.deleteDepartment(departmentToDelete.id);
                  setDepartments(prev => prev.filter(d => d.id !== departmentToDelete.id));
                  setDepartmentToDelete(null);
                } catch (err: any) {
                  setDeleteDepartmentError(err?.message || "Failed to delete department");
                } finally {
                  setIsDeletingDepartment(false);
                }
              }}
              disabled={isDeletingDepartment}
            >
              {isDeletingDepartment ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Position Delete Confirmation Dialog */}
      <Dialog open={!!positionToDelete} onOpenChange={open => { if (!open) setPositionToDelete(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer le poste</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce poste ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {deletePositionError && <div className="text-red-500 text-sm mb-2">{deletePositionError}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPositionToDelete(null)} disabled={isDeletingPosition}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!positionToDelete) return;
                setIsDeletingPosition(true);
                setDeletePositionError(null);
                try {
                  await hrApi.deletePosition(positionToDelete.id);
                  setPositions(prev => prev.filter(p => p.id !== positionToDelete.id));
                  setPositionToDelete(null);
                } catch (err: any) {
                  setDeletePositionError(err?.message || "Failed to delete position");
                } finally {
                  setIsDeletingPosition(false);
                }
              }}
              disabled={isDeletingPosition}
            >
              {isDeletingPosition ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
