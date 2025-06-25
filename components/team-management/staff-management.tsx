"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Search, Trash2, UserPlus, Users, Calendar, DollarSign, Phone, Mail, Briefcase, Eye, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { fetchAllStaff, createStaff, updateStaff, deleteStaff } from "@/lib/redux/staffSlice"
import { fetchAllTeams } from "@/lib/redux/teamSlice"
import { Staff, StaffRole, CreateStaffDto, UpdateStaffDto } from "@/lib/types/team-management"

export function StaffManagement() {
  const dispatch = useAppDispatch()
  const { staff, loading, error } = useAppSelector((state) => state.staff)
  const { teams } = useAppSelector((state) => state.teams)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeam, setSelectedTeam] = useState("all")
  const [selectedRole, setSelectedRole] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)

  // Fetch staff and teams when component mounts
  useEffect(() => {
    dispatch(fetchAllStaff())
    dispatch(fetchAllTeams())
  }, [dispatch])

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])
  
  const [newStaff, setNewStaff] = useState<Partial<CreateStaffDto>>({
    firstName: "",
    lastName: "",
    role: StaffRole.HEAD_COACH,
    dateOfBirth: "",
    phoneNumber: "",
    email: "",
    qualification: "",
    experience: "",
    salary: 0,
    contractStartDate: "",
    contractEndDate: "",
    teamId: teams?.[0]?.id || 0,
  })

  const filteredStaff = staff.filter((s) => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase()
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) || s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTeam = selectedTeam === "all" || s.teamId.toString() === selectedTeam
    const matchesRole = selectedRole === "all" || s.role === selectedRole
    return matchesSearch && matchesTeam && matchesRole
  })

  const getRoleColor = (role: StaffRole) => {
    switch (role) {
      case StaffRole.HEAD_COACH:
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case StaffRole.ASSISTANT_COACH:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case StaffRole.FITNESS_COACH:
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case StaffRole.PHYSIOTHERAPIST:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
      case StaffRole.TEAM_MANAGER:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      case StaffRole.MEDICAL_DOCTOR:
        return "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getTeamName = (teamId: number) => {
    return teams.find((team) => team.id === teamId)?.name || "Unknown Team"
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const isContractExpiring = (endDate: string) => {
    const today = new Date()
    const threeMonthsFromNow = new Date()
    threeMonthsFromNow.setMonth(today.getMonth() + 3)
    return new Date(endDate) <= threeMonthsFromNow
  }

  const handleAddStaff = async () => {
    await dispatch(createStaff(newStaff as CreateStaffDto))
    setIsAddDialogOpen(false)
    setNewStaff({ ...newStaff })
  }

  const handleEditStaff = (staff: Staff) => {
    setEditingStaff(staff)
    setIsEditDialogOpen(true)
  }

  const handleUpdateStaff = async () => {
    if (editingStaff) {
      await dispatch(updateStaff({ id: editingStaff.id, data: editingStaff as UpdateStaffDto }))
      setIsEditDialogOpen(false)
    }
  }

  const handleDeleteStaff = (staff: Staff) => {
    setSelectedStaff(staff)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (selectedStaff) {
      await dispatch(deleteStaff(selectedStaff.id))
      setIsDeleteDialogOpen(false)
      setSelectedStaff(null)
    }
  }

  const handleViewStaff = (staff: Staff) => {
    setSelectedStaff(staff)
    setIsViewDialogOpen(true)
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // Statistics
  const totalStaff = staff.length
  const expiringContracts = staff.filter((s) => isContractExpiring(s.contractEndDate)).length
  const averageSalary = staff.reduce((sum, s) => sum + s.salary, 0) / staff.length
  const roleDistribution = Object.values(StaffRole)
    .map((role) => ({
      role,
      count: staff.filter((s) => s.role === role).length,
    }))
    .filter((item) => item.count > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Staff Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage team staff members, contracts, and roles</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-800 hover:bg-blue-900 text-white">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>Add a new staff member to your team</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={newStaff.firstName}
                    onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newStaff.lastName}
                    onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newStaff.role} onValueChange={(value) => setNewStaff({ ...newStaff, role: value as StaffRole })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(StaffRole).map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team">Team</Label>
                  <Select
                    value={newStaff.teamId?.toString()}
                    onValueChange={(value) => setNewStaff({ ...newStaff, teamId: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={newStaff.dateOfBirth}
                    onChange={(e) => setNewStaff({ ...newStaff, dateOfBirth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={newStaff.salary}
                    onChange={(e) => setNewStaff({ ...newStaff, salary: parseInt(e.target.value) || 0 })}
                    placeholder="Enter salary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newStaff.phoneNumber}
                    onChange={(e) => setNewStaff({ ...newStaff, phoneNumber: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    placeholder="Enter email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualification">Qualification</Label>
                <Input
                  id="qualification"
                  value={newStaff.qualification}
                  onChange={(e) => setNewStaff({ ...newStaff, qualification: e.target.value })}
                  placeholder="Enter qualifications"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Experience</Label>
                <Textarea
                  id="experience"
                  value={newStaff.experience}
                  onChange={(e) => setNewStaff({ ...newStaff, experience: e.target.value })}
                  placeholder="Describe experience"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractStart">Contract Start Date</Label>
                  <Input
                    id="contractStart"
                    type="date"
                    value={newStaff.contractStartDate}
                    onChange={(e) => setNewStaff({ ...newStaff, contractStartDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractEnd">Contract End Date</Label>
                  <Input
                    id="contractEnd"
                    type="date"
                    value={newStaff.contractEndDate}
                    onChange={(e) => setNewStaff({ ...newStaff, contractEndDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddStaff} className="bg-blue-800 hover:bg-blue-900">
                Add Staff Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-blue-800" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalStaff}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Active staff members</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Expiring Contracts</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{expiringContracts}</div>
            <p className="text-xs text-orange-600 mt-1">Within 3 months</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Salary</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {staff.length > 0 ? `$${Math.round(averageSalary).toLocaleString()}` : '$0'}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Per year</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Teams</CardTitle>
            <Briefcase className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{teams.length}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">With staff assigned</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="staff" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="staff">Staff Members</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Staff Members</CardTitle>
              <CardDescription>Manage all staff members across teams</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search staff members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {Object.values(StaffRole).map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Staff Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Contract Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No staff members found matching the criteria
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStaff.map((staff) => (
                        <TableRow key={staff.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                {staff.staffImage ? (
                                  <AvatarImage src={staff.staffImage} alt={`${staff.firstName} ${staff.lastName}`} />
                                ) : null}
                                <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                  {getInitials(staff.firstName, staff.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {staff.firstName} {staff.lastName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {calculateAge(staff.dateOfBirth)} years
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(staff.role)}>{staff.role}</Badge>
                          </TableCell>
                          <TableCell>{getTeamName(staff.teamId)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              {staff.email && (
                                <a
                                  href={`mailto:${staff.email}`}
                                  className="text-sm flex items-center text-gray-600 dark:text-gray-400 hover:underline"
                                >
                                  <Mail className="h-3 w-3 mr-1" />
                                  {staff.email}
                                </a>
                              )}
                              {staff.phoneNumber && (
                                <a
                                  href={`tel:${staff.phoneNumber}`}
                                  className="text-sm flex items-center text-gray-600 dark:text-gray-400 hover:underline"
                                >
                                  <Phone className="h-3 w-3 mr-1" />
                                  {staff.phoneNumber}
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <p className="text-sm text-gray-900 dark:text-gray-200">
                                Until {new Date(staff.contractEndDate).toLocaleDateString()}
                              </p>
                              {isContractExpiring(staff.contractEndDate) && (
                                <Badge variant="outline" className="mt-1 border-orange-500 text-orange-500 w-fit">
                                  Expiring soon
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewStaff(staff)}
                                className="h-8 w-8 p-0"
                              >
                                <span className="sr-only">View details</span>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditStaff(staff)}
                                className="h-8 w-8 p-0"
                              >
                                <span className="sr-only">Edit</span>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteStaff(staff)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <span className="sr-only">Delete</span>
                                <Trash2 className="h-4 w-4" />
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

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Role Distribution</CardTitle>
                <CardDescription>Staff members by role</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roleDistribution.map((item) => (
                    <div key={item.role} className="flex items-center">
                      <div className="w-1/3">
                        <p className="text-sm font-medium">{item.role}</p>
                      </div>
                      <div className="w-2/3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full"
                              style={{
                                width: `${Math.max((item.count / totalStaff) * 100, 5)}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{item.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contract Expirations</CardTitle>
                <CardDescription>Staff members with expiring contracts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staff
                    .filter((staff) => isContractExpiring(staff.contractEndDate))
                    .sort(
                      (a, b) =>
                        new Date(a.contractEndDate).getTime() - new Date(b.contractEndDate).getTime()
                    )
                    .map((staff) => (
                      <div key={staff.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            {staff.staffImage ? (
                              <AvatarImage
                                src={staff.staffImage}
                                alt={`${staff.firstName} ${staff.lastName}`}
                              />
                            ) : null}
                            <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs">
                              {getInitials(staff.firstName, staff.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {staff.firstName} {staff.lastName}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {staff.role}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Date(staff.contractEndDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {getTeamName(staff.teamId)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* View Staff Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Staff Member Details</DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {selectedStaff.staffImage ? (
                    <AvatarImage src={selectedStaff.staffImage} alt={`${selectedStaff.firstName} ${selectedStaff.lastName}`} />
                  ) : null}
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-lg">
                    {getInitials(selectedStaff.firstName, selectedStaff.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedStaff.firstName} {selectedStaff.lastName}
                  </h3>
                  <Badge className={getRoleColor(selectedStaff.role)}>{selectedStaff.role}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Team</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">{getTeamName(selectedStaff.teamId)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Age</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">{calculateAge(selectedStaff.dateOfBirth)} years</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">{selectedStaff.phoneNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">{selectedStaff.email || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Contract Period</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {new Date(selectedStaff.contractStartDate).toLocaleDateString()} - {new Date(selectedStaff.contractEndDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Salary</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    ${selectedStaff.salary != null ? selectedStaff.salary.toLocaleString() : '-'}{`/year`}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Qualification</p>
                <p className="text-base font-medium text-gray-900 dark:text-white">{selectedStaff.qualification || "—"}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Experience</p>
                <p className="text-base font-medium text-gray-900 dark:text-white">{selectedStaff.experience || "—"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>Update staff member information</DialogDescription>
          </DialogHeader>
          {editingStaff && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">First Name</Label>
                  <Input
                    id="edit-firstName"
                    value={editingStaff.firstName}
                    onChange={(e) => setEditingStaff({ ...editingStaff, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Last Name</Label>
                  <Input
                    id="edit-lastName"
                    value={editingStaff.lastName}
                    onChange={(e) => setEditingStaff({ ...editingStaff, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select
                    value={editingStaff.role}
                    onValueChange={(value) => setEditingStaff({ ...editingStaff, role: value as StaffRole })}
                  >
                    <SelectTrigger id="edit-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(StaffRole).map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-team">Team</Label>
                  <Select
                    value={editingStaff.teamId?.toString() ?? 0}
                    onValueChange={(value) => setEditingStaff({ ...editingStaff, teamId: parseInt(value) })}
                  >
                    <SelectTrigger id="edit-team">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input
                    id="edit-phone"
                    value={editingStaff.phoneNumber || ""}
                    onChange={(e) => setEditingStaff({ ...editingStaff, phoneNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    value={editingStaff.email || ""}
                    onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-qualification">Qualification</Label>
                <Input
                  id="edit-qualification"
                  value={editingStaff.qualification || ""}
                  onChange={(e) => setEditingStaff({ ...editingStaff, qualification: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStaff} className="bg-blue-800 hover:bg-blue-900">
              Update Staff Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this staff member? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedStaff && (
            <div className="py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Staff Member: {selectedStaff.firstName} {selectedStaff.lastName} ({selectedStaff.role})
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
