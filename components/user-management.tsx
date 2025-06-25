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
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Search, Trash2, UserPlus, Shield, Users, Settings, Plus, Loader2 } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { toast } from "sonner"
import { 
  fetchAllUsers, 
  fetchUserById, 
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
import { CreateUserDto, UpdateUserDto, CreateRoleDto, UpdateRoleDto, User, Role, Permission } from "@/lib/services"

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
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
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
      toast.success("User created successfully")
      setIsUserDialogOpen(false)
      setNewUser({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        isActive: true,
      })
    } catch (error) {
      toast.error("Failed to create user")
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
      toast.success("User updated successfully")
      setIsEditUserDialogOpen(false)
      setEditingUser(null)
    } catch (error) {
      toast.error("Failed to update user")
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
      
      toast.success("Role created successfully")
      setIsRoleDialogOpen(false)
      setNewRole({
        name: "",
        description: "",
        permissions: [],
      })
    } catch (error) {
      toast.error("Failed to create role")
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
      
      toast.success("Role updated successfully")
      setIsEditRoleDialogOpen(false)
      setEditingRole(null)
    } catch (error) {
      toast.error("Failed to update role")
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
      
      toast.success("Role assigned successfully")
      setIsAssignRoleDialogOpen(false)
      setUserForRoleAssignment(null)
      setRoleToAssign(null)
    } catch (error) {
      toast.error("Failed to assign role")
    }
  }

  const handleRemoveRoleFromUser = async (userId: number, roleId: number) => {
    try {
      // Show loading toast
      toast.loading("Removing role...")
      
      // Dispatch the action to remove the role
      await dispatch(removeRoleFromUser({ userId, roleId })).unwrap()
      
      // Show success toast
      toast.success("Role removed successfully")
      
      // Refresh the users list to ensure UI is updated
      dispatch(fetchAllUsers())
    } catch (error) {
      console.error("Error removing role:", error)
      toast.error("Failed to remove role")
    }
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return
    
    try {
      // Show loading toast
      toast.loading(`Deleting ${itemToDelete.type}...`)
      
      if (itemToDelete.type === "user") {
        await dispatch(deleteUser(itemToDelete.id)).unwrap()
        toast.success("User deleted successfully")
        
        // Refresh users list
        dispatch(fetchAllUsers())
      } else if (itemToDelete.type === "role") {
        await dispatch(deleteRole(itemToDelete.id)).unwrap()
        toast.success("Role deleted successfully")
        
        // Refresh roles list
        dispatch(fetchAllRoles())
      }
    } catch (error) {
      console.error(`Error deleting ${itemToDelete.type}:`, error)
      toast.error(`Failed to delete ${itemToDelete.type}`)
    } finally {
      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage users, roles, and permissions</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Role Assignments
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Users</CardTitle>
                  <CardDescription>Create and manage user accounts</CardDescription>
                </div>
                <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-800 hover:bg-blue-900 text-white">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>Add a new user to the system</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="firstName" className="text-right">
                          First Name
                        </Label>
                        <Input 
                          id="firstName" 
                          placeholder="First name" 
                          className="col-span-3" 
                          value={newUser.firstName}
                          onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lastName" className="text-right">
                          Last Name
                        </Label>
                        <Input 
                          id="lastName" 
                          placeholder="Last name" 
                          className="col-span-3" 
                          value={newUser.lastName}
                          onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          Email
                        </Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="email@example.com" 
                          className="col-span-3" 
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                          Password
                        </Label>
                        <Input 
                          id="password" 
                          type="password" 
                          placeholder="Password" 
                          className="col-span-3" 
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="isActive" className="text-right">
                          Status
                        </Label>
                        <Select 
                          value={newUser.isActive ? "active" : "inactive"}
                          onValueChange={(value) => setNewUser({...newUser, isActive: value === "active"})}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
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
                        Create User
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {/* Edit User Dialog */}
                <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Edit User</DialogTitle>
                      <DialogDescription>Update user information</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-firstName" className="text-right">
                          First Name
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
                          Last Name
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
                          Status
                        </Label>
                        <Select
                          value={editingUser?.isActive ? "active" : "inactive"}
                          onValueChange={(value) => setEditingUser((prev) => ({ ...prev!, isActive: value === "active" }))}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-blue-800 hover:bg-blue-900"
                        onClick={handleUpdateUser}
                        disabled={usersLoading}
                      >
                        {usersLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Update User
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
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
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
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                            No users found
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
                                  <span className="text-gray-400 text-sm">No roles</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(user.isActive)}>
                                {user.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>{user.lastLogin || "Never"}</TableCell>
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
                  <CardTitle className="text-gray-900 dark:text-white">Roles & Permissions</CardTitle>
                  <CardDescription>Create and manage user roles with specific permissions</CardDescription>
                </div>
                <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-800 hover:bg-blue-900 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Role</DialogTitle>
                      <DialogDescription>Define a new role with specific permissions</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="roleName" className="text-right">
                          Role Name
                        </Label>
                        <Input
                          id="roleName"
                          placeholder="Enter role name"
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
                          placeholder="Describe the role's purpose"
                          className="col-span-3"
                          value={newRole.description || ""}
                          onChange={(e) => setNewRole((prev) => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right mt-2">Permissions</Label>
                        <div className="col-span-3 space-y-3">
                          {permissionsLoading ? (
                            <div className="flex justify-center py-4">
                              <Loader2 className="h-6 w-6 animate-spin text-blue-800" />
                            </div>
                          ) : (
                            permissions.map((permission) => (
                              <div key={permission.id} className="flex items-start space-x-3">
                                <Checkbox
                                  id={`permission-${permission.id}`}
                                  checked={newRole.permissions.includes(permission.id)}
                                  onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                                />
                                <div className="grid gap-1.5 leading-none">
                                  <Label
                                    htmlFor={`permission-${permission.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {permission.name}
                                  </Label>
                                  <p className="text-xs text-muted-foreground">{permission.description || `For ${permission.page} page`}</p>
                                </div>
                              </div>
                            ))
                          )}
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
                        Create Role
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {/* Edit Role Dialog */}
                <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
                  <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Role</DialogTitle>
                      <DialogDescription>Update role information and permissions</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-roleName" className="text-right">
                          Role Name
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
                        <div className="col-span-3 space-y-3">
                          {permissionsLoading ? (
                            <div className="flex justify-center py-4">
                              <Loader2 className="h-6 w-6 animate-spin text-blue-800" />
                            </div>
                          ) : (
                            permissions.map((permission) => (
                              <div key={permission.id} className="flex items-start space-x-3">
                                <Checkbox
                                  id={`edit-permission-${permission.id}`}
                                  checked={(editingRole?.permissions as number[] || []).includes(permission.id)}
                                  onCheckedChange={(checked) =>
                                    handleEditRolePermissionChange(permission.id, checked as boolean)
                                  }
                                />
                                <div className="grid gap-1.5 leading-none">
                                  <Label
                                    htmlFor={`edit-permission-${permission.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {permission.name}
                                  </Label>
                                  <p className="text-xs text-muted-foreground">{permission.description || `For ${permission.page} page`}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditRoleDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleUpdateRole} 
                        className="bg-blue-800 hover:bg-blue-900"
                        disabled={rolesLoading}
                      >
                        {rolesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Update Role
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
                      No roles found. Create a new role to get started.
                    </div>
                  ) : (
                    roles.map((role) => (
                      <Card key={role.id} className="border-l-4 border-l-blue-800">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{role.name}</CardTitle>
                              <CardDescription>{role.description || "No description"}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{role.userCount || 0} users</Badge>
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
                                <span className="text-gray-400 text-sm">No permissions</span>
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
                  <CardTitle className="text-gray-900 dark:text-white">Role Assignments</CardTitle>
                  <CardDescription>Assign roles to users and manage permissions</CardDescription>
                </div>
                <Dialog open={isAssignRoleDialogOpen} onOpenChange={setIsAssignRoleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-800 hover:bg-blue-900 text-white">
                      <Settings className="h-4 w-4 mr-2" />
                      Assign Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Assign Role to User</DialogTitle>
                      <DialogDescription>Select a user and assign them to one or more roles</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="selectUser" className="text-right">
                          User
                        </Label>
                        <Select onValueChange={(value) => setUserForRoleAssignment(Number(value))}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select user" />
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
                          Role
                        </Label>
                        <Select onValueChange={(value) => setRoleToAssign(Number(value))}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select role" />
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
                        Assign Role
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
                  <Input placeholder="Search user assignments..." className="pl-10" />
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
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Roles</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                              No users found
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
                                    <span className="text-gray-400 text-sm">No roles</span>
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
                                  Assign Role
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
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={usersLoading || rolesLoading}
            >
              {(usersLoading || rolesLoading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
