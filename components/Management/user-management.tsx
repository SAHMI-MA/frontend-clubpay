"use client"

import { useState, useEffect } from "react"
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Edit, Search, Trash2, UserPlus, Shield, Users, Settings, Plus, Loader2, Check, ChevronsUpDown, X } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { toast } from "sonner"
import {
  fetchAllUsers,
  createUser,
  updateUser,
  deleteUser,
  assignRoleToUser,
  removeRoleFromUser
} from "@/lib/redux/userSlice"
import {
  fetchAllRoles,
  createRole,
  updateRole,
  deleteRole,
  addPermissionToRole,
  removePermissionFromRole
} from "@/lib/redux/roleSlice"
import { fetchAllPermissions } from "@/lib/redux/permissionSlice"

import type { CreateRoleDto, CreateUserDto, Role, UpdateRoleDto, UpdateUserDto, User } from "@/lib/services"
import { parseDate } from "@/lib/utils/date-utils"

/**
 * Export a list of users to CSV (ID, First Name, Last Name, Email, Roles)
 * @param users Array of User objects
 */
export function exportUsersToCSV(users: User[]) {
  const header = ['ID', 'First Name', 'Last Name', 'Email', 'Roles'];
  const rows = users.map(user => [
    user.id,
    user.firstName,
    user.lastName,
    user.email,
    (user.roles?.map(r => r.name).join('; ') || '')
  ]);
  const csvContent = [header, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'users.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface Permission {
  id: number;
  name: string;
  description?: string;
  page: string;
}

interface SearchablePermissionsSelectorProps {
  permissions: Permission[];
  selectedPermissions: number[];
  onPermissionChange: (permissionId: number, checked: boolean) => void;
  loading?: boolean;
  placeholder?: string;
}

function SearchablePermissionsSelector({
  permissions,
  selectedPermissions,
  onPermissionChange,
  loading = false,
  placeholder = "Sélectionner des permissions..."
}: SearchablePermissionsSelectorProps) {
  const [searchValue, setSearchValue] = useState("");

  const filteredPermissions = permissions.filter(permission =>
    permission.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    permission.description?.toLowerCase().includes(searchValue.toLowerCase()) ||
    permission.page.toLowerCase().includes(searchValue.toLowerCase())
  );

  const selectedPermissionNames = permissions
    .filter(p => selectedPermissions.includes(p.id))
    .map(p => p.name);

  const handleRemovePermission = (permissionId: number) => {
    onPermissionChange(permissionId, false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-blue-800" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Selected permissions count display */}
      <div className="text-sm text-gray-600 mb-2">
        {selectedPermissions.length === 0
          ? placeholder
          : `${selectedPermissions.length} permission(s) sélectionnée(s)`}
      </div>
      
      {/* Search and select interface */}
      <div className="border rounded-md">
        <Command>
          <CommandInput
            placeholder="Rechercher des permissions..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList className="max-h-48 overflow-y-auto">
            <CommandEmpty>Aucune permission trouvée.</CommandEmpty>
            <CommandGroup>
              {filteredPermissions.map((permission) => (
                <CommandItem
                  key={permission.id}
                  value={`${permission.id}-${permission.name}`}
                  onSelect={(currentValue) => {
                    const isSelected = selectedPermissions.includes(permission.id);
                    onPermissionChange(permission.id, !isSelected);
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      selectedPermissions.includes(permission.id)
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{permission.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {permission.description || `Pour la page ${permission.page}`}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
      
      {/* Selected permissions badges */}
      {selectedPermissions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedPermissionNames.map((name, index) => {
            const permission = permissions.find(p => p.name === name);
            return (
              <Badge key={index} variant="secondary" className="text-xs">
                {name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => permission && handleRemovePermission(permission.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function UserManagement() {
  const dispatch = useAppDispatch()

  // Redux state
  const { users, loading: usersLoading, error: usersError } = useAppSelector((state) => state.users)
  const { roles, loading: rolesLoading, error: rolesError } = useAppSelector((state) => state.roles)
  const { permissions, loading: permissionsLoading } = useAppSelector((state) => state.permissions)

  // Local state
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [isAssignRoleDialogOpen, setIsAssignRoleDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState<CreateUserDto>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    isActive: true,
  })
  const [newRole, setNewRole] = useState<CreateRoleDto & { permissions: number[] }>({
    name: "",
    description: "",
    permissions: [],
  })

  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingRole, setEditingRole] = useState<(Omit<Role, 'permissions'> & { permissions: number[] }) | null>(null)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ type: 'user' | 'role', id: number } | null>(null)
  const [roleToAssign, setRoleToAssign] = useState<number | null>(null)
  const [userForRoleAssignment, setUserForRoleAssignment] = useState<number | null>(null)

  // Load data on component mount
  useEffect(() => {
    dispatch(fetchAllUsers())
    dispatch(fetchAllRoles())
    dispatch(fetchAllPermissions())
  }, [dispatch])

  // Handle errors
  useEffect(() => {
    if (usersError) {
      toast.error(usersError)
    }
    if (rolesError) {
      toast.error(rolesError)
    }
  }, [usersError, rolesError])

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole =
      selectedRole === "all" ||
      (user.roles && user.roles.some((role) => role.name.toLowerCase() === selectedRole.toLowerCase()))

    return matchesSearch && matchesRole
  })

  const getRoleColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "coach":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "manager":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "financial officer":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
      case "player":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getStatusColor = (isActive?: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
  }

  // Permission handling
  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    if (checked) {
      setNewRole((prev) => ({
        ...prev,
        permissions: [...prev.permissions, permissionId],
      }))
    } else {
      setNewRole((prev) => ({
        ...prev,
        permissions: prev.permissions.filter((p) => p !== permissionId),
      }))
    }
  }

  // User CRUD operations
  const handleCreateUser = async () => {
    try {
      await dispatch(createUser(newUser)).unwrap()
      toast.success("Utilisateur créé avec succès")
      setIsUserDialogOpen(false)
      setNewUser({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        isActive: true,
      })
    } catch (error) {
      toast.error("Échec de la création de l'utilisateur " + (error instanceof Error ? error.message : ""))
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsEditUserDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    const userData: UpdateUserDto = {
      firstName: editingUser.firstName,
      lastName: editingUser.lastName,
      email: editingUser.email,
      isActive: editingUser.isActive,
    }

    try {
      await dispatch(updateUser({ id: editingUser.id, userData })).unwrap()
      toast.success("Utilisateur mis à jour avec succès")
      setIsEditUserDialogOpen(false)
      setEditingUser(null)
    } catch (error) {
      toast.error("Échec de la mise à jour de l'utilisateur " + (error instanceof Error ? error.message : ""))
    }
  }

  const handleDeleteUser = (user: User) => {
    setItemToDelete({ type: "user", id: user.id })
    setIsDeleteDialogOpen(true)
  }

  // Role CRUD operations
  const handleCreateRole = async () => {
    try {
      // First create the role
      const roleData: CreateRoleDto = {
        name: newRole.name,
        description: newRole.description,
      }

      const createdRole = await dispatch(createRole(roleData)).unwrap()

      // Then add permissions if any
      const permissionPromises = newRole.permissions.map(permissionId =>
        dispatch(addPermissionToRole({ roleId: createdRole.id, permissionId }))
      )

      if (permissionPromises.length > 0) {
        await Promise.all(permissionPromises)
      }

      toast.success("Rôle créé avec succès")
      setIsRoleDialogOpen(false)
      setNewRole({
        name: "",
        description: "",
        permissions: [],
      })
    } catch (error) {
      toast.error("Échec de la création du rôle " + (error instanceof Error ? error.message : ""))
    }
  }

  const handleEditRole = (role: Role) => {
    // Convert Role with Permission[] to Role with number[] for editing
    setEditingRole({
      ...role,
      permissions: role.permissions?.map(p => p.id) || []
    })
    setIsEditRoleDialogOpen(true)
  }

  const handleEditRolePermissionChange = (permissionId: number, checked: boolean) => {
    if (!editingRole) return

    if (checked) {
      setEditingRole((prev) => ({
        ...prev!,
        permissions: [...(prev!.permissions || []), permissionId],
      }))
    } else {
      setEditingRole((prev) => ({
        ...prev!,
        permissions: (prev!.permissions || []).filter((p) => p !== permissionId),
      }))
    }
  }

  const handleUpdateRole = async () => {
    if (!editingRole) return

    try {
      const roleData: UpdateRoleDto = {
        name: editingRole.name,
        description: editingRole.description,
      }

      // Update basic role info
      await dispatch(updateRole({ id: editingRole.id, roleData })).unwrap()

      // Get current permissions (number[])
      const currentPermissions = editingRole.permissions || []

      // Find the original role to compare permissions
      const originalRole = roles.find(r => r.id === editingRole.id)

      // Convert Permission[] to number[] for comparison
      const originalPermissionIds = originalRole?.permissions?.map(p => p.id) || []

      // Determine which permissions to add and which to remove
      const permissionsToAdd = currentPermissions.filter(
        pId => !originalPermissionIds.includes(pId)
      )

      const permissionsToRemove = originalPermissionIds.filter(
        pId => !currentPermissions.includes(pId)
      )

      // Add new permissions
      const addPromises = permissionsToAdd.map(permissionId =>
        dispatch(addPermissionToRole({ roleId: editingRole.id, permissionId }))
      )

      // Remove permissions
      const removePromises = permissionsToRemove.map(permissionId =>
        dispatch(removePermissionFromRole({ roleId: editingRole.id, permissionId }))
      )

      // Wait for all permission operations to complete
      await Promise.all([...addPromises, ...removePromises])

      toast.success("Rôle mis à jour avec succès")
      setIsEditRoleDialogOpen(false)
      setEditingRole(null)
    } catch (error) {
      toast.error("Échec de la mise à jour du rôle " + (error instanceof Error ? error.message : ""))
    }
  }

  const handleDeleteRole = (role: Role) => {
    setItemToDelete({ type: "role", id: role.id })
    setIsDeleteDialogOpen(true)
  }

  // Role assignment operations
  const handleAssignRole = async () => {
    if (!userForRoleAssignment || !roleToAssign) return

    try {
      await dispatch(assignRoleToUser({
        userId: userForRoleAssignment,
        roleId: roleToAssign
      })).unwrap()

      toast.success("Rôle affecté avec succès")
      setIsAssignRoleDialogOpen(false)
      setUserForRoleAssignment(null)
      setRoleToAssign(null)
    } catch (error) {
      toast.error("Échec de l'affectation du rôle " + (error instanceof Error ? error.message : ""))
    }
  }

  const handleRemoveRoleFromUser = async (userId: number, roleId: number) => {
    try {
      // Show loading toast
      toast.loading("Suppression du rôle...")

      // Dispatch the action to remove the role
      await dispatch(removeRoleFromUser({ userId, roleId })).unwrap()

      // Show success toast
      toast.success("Rôle supprimé avec succès")

      // Refresh the users list to ensure UI is updated
      dispatch(fetchAllUsers())
    } catch (error) {
      console.error("Error removing role:", error)
      toast.error("Échec de la suppression du rôle")
    }
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      // Show loading toast
      toast.loading(`Suppression de ${itemToDelete.type}...`)

      if (itemToDelete.type === "user") {
        await dispatch(deleteUser(itemToDelete.id)).unwrap()
        toast.success("Utilisateur supprimé avec succès")

        // Refresh users list
        dispatch(fetchAllUsers())
      } else if (itemToDelete.type === "role") {
        await dispatch(deleteRole(itemToDelete.id)).unwrap()
        toast.success("Rôle supprimé avec succès")

        // Refresh roles list
        dispatch(fetchAllRoles())
      }
    } catch (error) {
      console.error(`Error deleting ${itemToDelete.type}:`, error)
      toast.error(`Échec de la suppression de ${itemToDelete.type}`)
    } finally {
      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Export Users CSV Button */}
      <div className="flex justify-end">
        <Button
          className="bg-blue-800 hover:bg-blue-900 text-white mb-2"
          onClick={() => exportUsersToCSV(filteredUsers)}
        >
          Exporter les utilisateurs (CSV)
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des utilisateurs</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérez les utilisateurs, les rôles et les permissions</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Rôles
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Affectations de rôles
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Utilisateurs</CardTitle>
                  <CardDescription>Créer et gérer les comptes utilisateurs</CardDescription>
                </div>
                <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-800 hover:bg-blue-900 text-white">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Ajouter un utilisateur
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                      <DialogDescription>Ajouter un nouvel utilisateur au système</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="firstName" className="text-right">
                          Prénom
                        </Label>
                        <Input
                          id="firstName"
                          placeholder="Prénom"
                          className="col-span-3"
                          value={newUser.firstName}
                          onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lastName" className="text-right">
                          Nom
                        </Label>
                        <Input
                          id="lastName"
                          placeholder="Nom"
                          className="col-span-3"
                          value={newUser.lastName}
                          onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="email@exemple.com"
                          className="col-span-3"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                          Mot de passe
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Mot de passe"
                          className="col-span-3"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="isActive" className="text-right">
                          Statut
                        </Label>
                        <Select
                          value={newUser.isActive ? "active" : "inactive"}
                          onValueChange={(value) => setNewUser({ ...newUser, isActive: value === "active" })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Sélectionner le statut" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="inactive">Inactif</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        className="bg-blue-800 hover:bg-blue-900"
                        onClick={handleCreateUser}
                        disabled={usersLoading}
                      >
                        {usersLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Créer l'utilisateur
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {/* Edit User Dialog */}
                <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Modifier l'utilisateur</DialogTitle>
                      <DialogDescription>Mettre à jour les informations de l'utilisateur</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-firstName" className="text-right">
                          Prénom
                        </Label>
                        <Input
                          id="edit-firstName"
                          value={editingUser?.firstName || ""}
                          onChange={(e) => setEditingUser((prev) => ({ ...prev!, firstName: e.target.value }))}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-lastName" className="text-right">
                          Nom
                        </Label>
                        <Input
                          id="edit-lastName"
                          value={editingUser?.lastName || ""}
                          onChange={(e) => setEditingUser((prev) => ({ ...prev!, lastName: e.target.value }))}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-email" className="text-right">
                          Email
                        </Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={editingUser?.email || ""}
                          onChange={(e) => setEditingUser((prev) => ({ ...prev!, email: e.target.value }))}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-status" className="text-right">
                          Statut
                        </Label>
                        <Select
                          value={editingUser?.isActive ? "active" : "inactive"}
                          onValueChange={(value) => setEditingUser((prev) => ({ ...prev!, isActive: value === "active" }))}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Sélectionner le statut" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="inactive">Inactif</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        className="bg-blue-800 hover:bg-blue-900"
                        onClick={handleUpdateUser}
                        disabled={usersLoading}
                      >
                        {usersLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Mettre à jour
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Rechercher des utilisateurs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrer par rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.name.toLowerCase()}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rôles</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Dernière connexion</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                            Aucun utilisateur trouvé
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user, index) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell className="font-medium">{`${user.firstName} ${user.lastName}`}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {user.roles?.map((role) => (
                                  <Badge key={role.id} className={getRoleColor(role.name)} variant="secondary">
                                    <div className="flex items-center gap-1">
                                      {role.name}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 p-2 hover:bg-transparent hover:text-red-500" // Increased size
                                        onClick={() => {
                                          console.log("Button clicked!");
                                          handleRemoveRoleFromUser(user.id, role.id);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" /> {/* Icon size smaller than button */}
                                      </Button>
                                    </div>
                                  </Badge>
                                ))}
                                {!user.roles?.length && (
                                  <span className="text-gray-400 text-sm">Aucun rôle</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(user.isActive)}>
                                {user.isActive ? "Actif" : "Inactif"}
                              </Badge>
                            </TableCell>
                            <TableCell>{parseDate(user.lastLogin)?.toString() || "Jamais"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditUser(user)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteUser(user)}
                                >
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Rôles & Permissions</CardTitle>
                  <CardDescription>Créer et gérer les rôles utilisateurs avec des permissions spécifiques</CardDescription>
                </div>
                <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-800 hover:bg-blue-900 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Créer un rôle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Créer un nouveau rôle</DialogTitle>
                      <DialogDescription>Définir un nouveau rôle avec des permissions spécifiques</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="roleName" className="text-right">
                          Nom du rôle
                        </Label>
                        <Input
                          id="roleName"
                          placeholder="Nom du rôle"
                          className="col-span-3"
                          value={newRole.name}
                          onChange={(e) => setNewRole((prev) => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="roleDescription" className="text-right mt-2">
                          Description
                        </Label>
                        <Textarea
                          id="roleDescription"
                          placeholder="Décrivez le rôle"
                          className="col-span-3"
                          value={newRole.description || ""}
                          onChange={(e) => setNewRole((prev) => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right mt-2">Permissions</Label>
                        <div className="col-span-3">
                          <SearchablePermissionsSelector
                            permissions={permissions}
                            selectedPermissions={newRole.permissions}
                            onPermissionChange={handlePermissionChange}
                            loading={permissionsLoading}
                            placeholder="Sélectionner des permissions pour ce rôle..."
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        className="bg-blue-800 hover:bg-blue-900"
                        onClick={handleCreateRole}
                        disabled={rolesLoading}
                      >
                        {rolesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Créer le rôle
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {/* Edit Role Dialog */}
                <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
                  <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Modifier le rôle</DialogTitle>
                      <DialogDescription>Mettre à jour les informations et permissions du rôle</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-roleName" className="text-right">
                          Nom du rôle
                        </Label>
                        <Input
                          id="edit-roleName"
                          value={editingRole?.name || ""}
                          onChange={(e) => setEditingRole((prev) => ({ ...prev!, name: e.target.value }))}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="edit-roleDescription" className="text-right mt-2">
                          Description
                        </Label>
                        <Textarea
                          id="edit-roleDescription"
                          value={editingRole?.description || ""}
                          onChange={(e) => setEditingRole((prev) => ({ ...prev!, description: e.target.value }))}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right mt-2">Permissions</Label>
                        <div className="col-span-3">
                          <SearchablePermissionsSelector
                            permissions={permissions}
                            selectedPermissions={(editingRole?.permissions as number[] || [])}
                            onPermissionChange={handleEditRolePermissionChange}
                            loading={permissionsLoading}
                            placeholder="Sélectionner des permissions pour ce rôle..."
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditRoleDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button
                        onClick={handleUpdateRole}
                        className="bg-blue-800 hover:bg-blue-900"
                        disabled={rolesLoading}
                      >
                        {rolesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Mettre à jour
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {rolesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
                </div>
              ) : (
                <div className="grid gap-4">
                  {roles.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Aucun rôle trouvé. Créez un nouveau rôle pour commencer.
                    </div>
                  ) : (
                    roles.map((role) => (
                      <Card key={role.id} className="border-l-4 border-l-blue-800">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{role.name}</CardTitle>
                              <CardDescription>{role.description || "Aucune description"}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{role.userCount || 0} utilisateurs</Badge>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditRole(role)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteRole(role)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Permissions:</p>
                            <div className="flex flex-wrap gap-2">
                              {role.permissions && role.permissions.length > 0 ? (
                                role.permissions.map((permission) => (
                                  <Badge key={permission.id} variant="secondary" className="text-xs">
                                    {permission.name}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-gray-400 text-sm">Aucune permission</span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Role Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Affectations de rôles</CardTitle>
                  <CardDescription>Affecter des rôles aux utilisateurs et gérer les permissions</CardDescription>
                </div>
                <Dialog open={isAssignRoleDialogOpen} onOpenChange={setIsAssignRoleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-800 hover:bg-blue-900 text-white">
                      <Settings className="h-4 w-4 mr-2" />
                      Assigner un rôle
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Assigner un rôle à un utilisateur</DialogTitle>
                      <DialogDescription>Sélectionnez un utilisateur et assignez-lui un ou plusieurs rôles</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="selectUser" className="text-right">
                          Utilisateur
                        </Label>
                        <Select onValueChange={(value) => setUserForRoleAssignment(Number(value))}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Sélectionner un utilisateur" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {`${user.firstName} ${user.lastName}`} ({user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="selectRole" className="text-right">
                          Rôle
                        </Label>
                        <Select onValueChange={(value) => setRoleToAssign(Number(value))}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Sélectionner un rôle" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id.toString()}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        className="bg-blue-800 hover:bg-blue-900"
                        onClick={handleAssignRole}
                        disabled={usersLoading || !userForRoleAssignment || !roleToAssign}
                      >
                        {usersLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Assigner le rôle
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input placeholder="Rechercher des affectations..." className="pl-10" />
                </div>

                {usersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Utilisateur</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Rôles</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                              Aucun utilisateur trouvé
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{`${user.firstName} ${user.lastName}`}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {user.roles?.map((role) => (
                                    <Badge key={role.id} className={getRoleColor(role.name)} variant="secondary">
                                      <div className="flex items-center gap-1">
                                        {role.name}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-4 w-4 p-0 ml-1 hover:bg-transparent hover:text-red-500"
                                          onClick={() => handleRemoveRoleFromUser(user.id, role.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </Badge>
                                  ))}
                                  {!user.roles?.length && (
                                    <span className="text-gray-400 text-sm">Aucun rôle</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="ml-2"
                                  onClick={() => {
                                    setUserForRoleAssignment(user.id);
                                    setIsAssignRoleDialogOpen(true);
                                  }}
                                >
                                  Assigner un rôle
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet élément ({itemToDelete?.type === 'user' ? 'utilisateur' : 'rôle'}) ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={usersLoading || rolesLoading}
            >
              {(usersLoading || rolesLoading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
