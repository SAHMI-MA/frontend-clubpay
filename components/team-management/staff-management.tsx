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
import { Edit, Search, Trash2, UserPlus, Users, Calendar, Phone, Mail, Briefcase, Eye} from "lucide-react"
import { toast } from "sonner"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { fetchAllStaff, createStaff, updateStaff, deleteStaff } from "@/lib/redux/staffSlice"
import { fetchAllTeams } from "@/lib/redux/teamSlice"
import { Staff, StaffRole, CreateStaffDto, UpdateStaffDto } from "@/lib/types/team-management"

export function StaffManagement() {
  const dispatch = useAppDispatch()
  const { staff,error } = useAppSelector((state) => state.staff)
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
  
  const [newStaff, setNewStaff] = useState<CreateStaffDto & { selectedTeamId: number }>({
    firstName: "",
    lastName: "",
    role: StaffRole.HEAD_COACH,
    dateOfBirth: "",
    phoneNumber: "",
    email: "",
    qualification: "",
    experience: "",
    rib: "", // Bank account information
    staffImageId: undefined, // Staff image ID
    salary: undefined, // Staff salary
    contractStartDate: "", // Contract start date
    contractEndDate: "", // Contract end date
    teamId: teams?.[0]?.id || 0,
    // We'll use this for tracking team selection in UI but not send it in the API call
    selectedTeamId: teams?.[0]?.id || 0,
  })

  const filteredStaff = staff.filter((s) => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase()
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) || s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTeam = selectedTeam === "all" || (s.team && s.team.id.toString() === selectedTeam)
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

  const getTeamName = (staff: Staff) => {
    // Check if staff has a team object
    if (staff.team && staff.team.name) {
      return staff.team.name;
    }
    
    // Fallback if no team is assigned
    return "Aucune équipe assignée";
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

  // Contract expiry tracking removed as it's no longer part of the API

  const handleAddStaff = async () => {
    // Validate required fields
    if (!newStaff.firstName || !newStaff.lastName || !newStaff.role || !newStaff.dateOfBirth || !newStaff.teamId) {
      toast.error("Veuillez remplir tous les champs requis (Prénom, Nom, Rôle, Date de naissance, Équipe)")
      return
    }

    try {
      // Extract only the valid fields for the API call, excluding selectedTeamId
      const staffData: CreateStaffDto = {
        firstName: newStaff.firstName,
        lastName: newStaff.lastName,
        role: newStaff.role,
        dateOfBirth: newStaff.dateOfBirth,
        phoneNumber: newStaff.phoneNumber,
        email: newStaff.email,
        qualification: newStaff.qualification,
        experience: newStaff.experience,
        rib: newStaff.rib,
        staffImageId: newStaff.staffImageId,
        salary: newStaff.salary,
        contractStartDate: newStaff.contractStartDate,
        contractEndDate: newStaff.contractEndDate,
        teamId: newStaff.teamId // Use teamId, not selectedTeamId
      }
      
      await dispatch(createStaff(staffData))
      toast.success("Membre du staff ajouté avec succès!")
      setIsAddDialogOpen(false)
      
      // Reset form
      setNewStaff({
        firstName: "",
        lastName: "",
        role: StaffRole.HEAD_COACH,
        dateOfBirth: "",
        phoneNumber: "",
        email: "",
        qualification: "",
        experience: "",
        rib: "",
        salary: undefined,
        contractStartDate: "",
        contractEndDate: "",
        teamId: teams?.[0]?.id || 0,
        selectedTeamId: teams?.[0]?.id || 0,
      })
    } catch (error) {
      console.error("Error creating staff:", error)
      toast.error("Échec de l'ajout du membre du staff")
    }
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
  // No longer tracking contracts or salary in the API
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion du staff</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérez les membres du staff, les contrats et les rôles</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-800 hover:bg-blue-900 text-white">
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter un membre du staff
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter un membre du staff</DialogTitle>
              <DialogDescription>Ajoutez un nouveau membre du staff à votre équipe</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={newStaff.firstName}
                    onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                    placeholder="Entrez le prénom"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    value={newStaff.lastName}
                    onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                    placeholder="Entrez le nom"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle *</Label>
                  <Select value={newStaff.role} onValueChange={(value) => setNewStaff({ ...newStaff, role: value as StaffRole })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un rôle" />
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
                  <Label htmlFor="team">Équipe *</Label>
                  <Select
                    value={newStaff.selectedTeamId?.toString()}
                    onValueChange={(value) => setNewStaff({ ...newStaff, selectedTeamId: parseInt(value), teamId: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une équipe" />
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

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date de naissance *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={newStaff.dateOfBirth}
                    onChange={(e) => setNewStaff({ ...newStaff, dateOfBirth: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={newStaff.phoneNumber}
                    onChange={(e) => setNewStaff({ ...newStaff, phoneNumber: e.target.value })}
                    placeholder="Entrez le numéro de téléphone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    placeholder="Entrez l'email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualification">Qualification</Label>
                <Input
                  id="qualification"
                  value={newStaff.qualification}
                  onChange={(e) => setNewStaff({ ...newStaff, qualification: e.target.value })}
                  placeholder="Entrez les qualifications"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Expérience</Label>
                <Textarea
                  id="experience"
                  value={newStaff.experience}
                  onChange={(e) => setNewStaff({ ...newStaff, experience: e.target.value })}
                  placeholder="Décrivez l'expérience"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary">Salaire</Label>
                  <Input
                    id="salary"
                    type="number"
                    min="0"
                    value={newStaff.salary || ""}
                    onChange={(e) => setNewStaff({ ...newStaff, salary: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Entrez le salaire mensuel"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rib">RIB (Compte bancaire)</Label>
                  <Input
                    id="rib"
                    value={newStaff.rib}
                    onChange={(e) => setNewStaff({ ...newStaff, rib: e.target.value })}
                    placeholder="Informations bancaires"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractStartDate">Début du contrat</Label>
                  <Input
                    id="contractStartDate"
                    type="date"
                    value={newStaff.contractStartDate}
                    onChange={(e) => setNewStaff({ ...newStaff, contractStartDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractEndDate">Fin du contrat</Label>
                  <Input
                    id="contractEndDate"
                    type="date"
                    value={newStaff.contractEndDate}
                    onChange={(e) => setNewStaff({ ...newStaff, contractEndDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Contract details have been removed as requested */}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddStaff} className="bg-blue-800 hover:bg-blue-900">
                Ajouter le membre du staff
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre total de staff</CardTitle>
            <Users className="h-4 w-4 text-blue-800" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalStaff}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Membres du staff actifs</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Rôles du staff</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {roleDistribution.length}
            </div>
            <p className="text-xs text-orange-600 mt-1">Rôles différents</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Expérience</CardTitle>
            <Briefcase className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {staff.filter(s => s.experience && s.experience.length > 0).length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Staff avec expérience</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Équipes actives</CardTitle>
            <Briefcase className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{teams.length}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Avec staff assigné</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="staff" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="staff">Membres du staff</TabsTrigger>
          <TabsTrigger value="analytics">Analytique</TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Membres du staff</CardTitle>
              <CardDescription>Gérez tous les membres du staff des équipes</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Rechercher un membre du staff..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrer par équipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les équipes</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrer par rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
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
                      <TableHead>Membre du staff</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Équipe</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Expérience</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          Aucun membre du staff trouvé correspondant aux critères
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStaff.map((staff) => (
                        <TableRow key={staff.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                {staff.staffImage?.url ? (
                                  <AvatarImage src={staff.staffImage.url} alt={`${staff.firstName} ${staff.lastName}`} />
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
                                  {calculateAge(staff.dateOfBirth)} ans
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(staff.role)}>{staff.role}</Badge>
                          </TableCell>
                          <TableCell>{getTeamName(staff)}</TableCell>
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
                                {staff.experience || "—"}
                              </p>
                              {staff.qualification && (
                                <Badge variant="outline" className="mt-1 border-blue-500 text-blue-500 w-fit">
                                  {staff.qualification}
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
                                <span className="sr-only">Voir les détails</span>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditStaff(staff)}
                                className="h-8 w-8 p-0"
                              >
                                <span className="sr-only">Modifier</span>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteStaff(staff)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <span className="sr-only">Supprimer</span>
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
                <CardTitle className="text-gray-900 dark:text-white">Répartition des rôles</CardTitle>
                <CardDescription>Membres du staff par rôle</CardDescription>
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
                <CardTitle>Vue d'ensemble de l'expérience</CardTitle>
                <CardDescription>Membres du staff avec expérience notable</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staff
                    .filter((staff) => staff.experience && staff.experience.length > 0)
                    .sort(
                      (a, b) =>
                        a.experience!.length - b.experience!.length
                    )
                    .map((staff) => (
                      <div key={staff.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            {staff.staffImage?.url ? (
                              <AvatarImage
                                src={staff.staffImage.url}
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
                            {staff.qualification || "Aucune qualification"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {getTeamName(staff)}
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
            <DialogTitle>Détails du membre du staff</DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {selectedStaff.staffImage?.url ? (
                    <AvatarImage src={selectedStaff.staffImage.url} alt={`${selectedStaff.firstName} ${selectedStaff.lastName}`} />
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
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Équipe</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">{getTeamName(selectedStaff)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Âge</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">{calculateAge(selectedStaff.dateOfBirth)} ans</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Téléphone</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">{selectedStaff.phoneNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">{selectedStaff.email || "—"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Équipe</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {selectedStaff.team ? selectedStaff.team.name : '—'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Qualification</p>
                <p className="text-base font-medium text-gray-900 dark:text-white">{selectedStaff.qualification || "—"}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Expérience</p>
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
            <DialogTitle>Modifier le membre du staff</DialogTitle>
            <DialogDescription>Mettre à jour les informations du membre du staff</DialogDescription>
          </DialogHeader>
          {editingStaff && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">Prénom</Label>
                  <Input
                    id="edit-firstName"
                    value={editingStaff.firstName}
                    onChange={(e) => setEditingStaff({ ...editingStaff, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Nom</Label>
                  <Input
                    id="edit-lastName"
                    value={editingStaff.lastName}
                    onChange={(e) => setEditingStaff({ ...editingStaff, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Rôle</Label>
                  <Select
                    value={editingStaff.role}
                    onValueChange={(value) => setEditingStaff({ ...editingStaff, role: value as StaffRole })}
                  >
                    <SelectTrigger id="edit-role">
                      <SelectValue placeholder="Sélectionner un rôle" />
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
                  <Label htmlFor="edit-team">Équipe</Label>
                  <Select
                    value={(editingStaff.team?.id || 0).toString()}
                    onValueChange={(value) => {
                      const selectedTeam = teams.find(t => t.id.toString() === value);
                      // When updating, we need to send teamId in the API call, but we store it in a temporary field
                      setEditingStaff({ 
                        ...editingStaff, 
                        team: selectedTeam,
                        teamId: parseInt(value) 
                      });
                    }}
                  >
                    <SelectTrigger id="edit-team">
                      <SelectValue placeholder="Sélectionner une équipe" />
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
                  <Label htmlFor="edit-phone">Téléphone</Label>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-salary">Salaire</Label>
                  <Input
                    id="edit-salary"
                    type="number"
                    min="0"
                    value={editingStaff.salary || ""}
                    onChange={(e) => setEditingStaff({ ...editingStaff, salary: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Entrez le salaire mensuel"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-rib">RIB (Compte bancaire)</Label>
                  <Input
                    id="edit-rib"
                    value={editingStaff.rib || ""}
                    onChange={(e) => setEditingStaff({ ...editingStaff, rib: e.target.value })}
                    placeholder="Informations bancaires"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-contractStartDate">Début du contrat</Label>
                  <Input
                    id="edit-contractStartDate"
                    type="date"
                    value={editingStaff.contractStartDate || ""}
                    onChange={(e) => setEditingStaff({ ...editingStaff, contractStartDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-contractEndDate">Fin du contrat</Label>
                  <Input
                    id="edit-contractEndDate"
                    type="date"
                    value={editingStaff.contractEndDate || ""}
                    onChange={(e) => setEditingStaff({ ...editingStaff, contractEndDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateStaff} className="bg-blue-800 hover:bg-blue-900">
              Mettre à jour le membre du staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce membre du staff ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {selectedStaff && (
            <div className="py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Membre du staff : {selectedStaff.firstName} {selectedStaff.lastName} ({selectedStaff.role})
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
