"use client"

import { useState, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { 
  fetchAllSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  setSelectedSupplier
} from "@/lib/redux/supplierSlice"
import { Supplier, CreateSupplierDto, UpdateSupplierDto } from "@/lib/types/supplier-management"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Edit,
  Search,
  Trash2,
  Plus,
  Truck,
  Phone,
  Mail,
  MapPin,
  Building,
  Star,
  Calendar,
  Package,
  DollarSign,
} from "lucide-react"

// Supplier categories are local to UI but suppliers are fetched from API

export function SupplierManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  // Form state
  const [newSupplier, setNewSupplier] = useState<CreateSupplierDto>({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    category: "",
  })

  // Redux
  const dispatch = useAppDispatch()
  const { suppliers: suppliersList, selectedSupplier} = useAppSelector((state) => state.suppliers)

  // Load suppliers on component mount
  useEffect(() => {
    dispatch(fetchAllSuppliers())
  }, [dispatch])

  // Filter functions
  const filteredSuppliers = suppliersList.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || supplier.category === selectedCategory
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" && supplier.isActive) ||
      (selectedStatus === "inactive" && !supplier.isActive)
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Helper functions
  const getRatingStars = (rating?: number) => {
    if (rating === undefined) return "☆☆☆☆☆"
    
    const fullStars = Math.floor(rating)
    const halfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0)

    return "★".repeat(fullStars) + (halfStar ? "½" : "") + "☆".repeat(emptyStars)
  }

  const getStatusColor = (isActive?: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
  }

  const getCategoryColor = (category?: string) => {
    if (!category) return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    
    switch (category.toLowerCase()) {
      case "equipment":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "uniforms":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
      case "medical":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "maintenance":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      case "catering":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "transportation":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  // Event handlers
  const handleAddSupplier = () => {
    dispatch(createSupplier(newSupplier))
      .unwrap()
      .then(() => {
        resetNewSupplier()
        setIsAddDialogOpen(false)
      })
      .catch((error) => {
        console.error("Failed to add supplier:", error)
      })
  }

  const resetNewSupplier = () => {
    setNewSupplier({
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      category: "",
    })
  }

  const handleEditSupplier = (supplier: Supplier) => {
    dispatch(setSelectedSupplier(supplier))
    setIsEditDialogOpen(true)
  }

  const handleUpdateSupplier = () => {
    if (selectedSupplier && selectedSupplier.id) {
      const updateData: UpdateSupplierDto = {
        name: selectedSupplier.name,
        contactPerson: selectedSupplier.contactPerson,
        email: selectedSupplier.email,
        phone: selectedSupplier.phone,
        address: selectedSupplier.address,
        category: selectedSupplier.category,
        isActive: selectedSupplier.isActive,
        rating: selectedSupplier.rating
      }

      dispatch(updateSupplier({ id: selectedSupplier.id, data: updateData }))
        .unwrap()
        .then(() => {
          setIsEditDialogOpen(false)
        })
        .catch((error) => {
          console.error("Failed to update supplier:", error)
        })
    }
  }

  const handleDeleteSupplier = (supplier: Supplier) => {
    dispatch(setSelectedSupplier(supplier))
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (selectedSupplier && selectedSupplier.id) {
      dispatch(deleteSupplier(selectedSupplier.id))
        .unwrap()
        .then(() => {
          setIsDeleteDialogOpen(false)
        })
        .catch((error) => {
          console.error("Failed to delete supplier:", error)
        })
    }
  }

  const handleViewSupplier = (supplier: Supplier) => {
    dispatch(setSelectedSupplier(supplier))
    setIsViewDialogOpen(true)
  }

  // Handler for input changes in edit dialog
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof UpdateSupplierDto) => {
    if (selectedSupplier) {
      dispatch(setSelectedSupplier({
        ...selectedSupplier,
        [field]: e.target.value
      }))
    }
  }

  const handleSelectChange = (value: string, field: keyof UpdateSupplierDto) => {
    if (selectedSupplier) {
      dispatch(setSelectedSupplier({
        ...selectedSupplier,
        [field]: value
      }))
    }
  }

  const handleCheckboxChange = (checked: boolean, field: keyof UpdateSupplierDto) => {
    if (selectedSupplier) {
      dispatch(setSelectedSupplier({
        ...selectedSupplier,
        [field]: checked
      }))
    }
  }

  // Statistics
  const totalSuppliers = suppliersList.length
  const activeSuppliers = suppliersList.filter((s) => s.isActive).length
  const totalSpent = suppliersList.reduce((sum, s) => sum + (s.totalSpent || 0), 0)
  const averageRating = suppliersList.length > 0 
    ? suppliersList.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliersList.length 
    : 0

  const categoryStats = ["Equipment", "Uniforms", "Medical", "Maintenance", "Catering", "Transportation"].map(
    (category) => ({
      category,
      count: suppliersList.filter((s) => s.category === category).length,
      spent: suppliersList.filter((s) => s.category === category)
        .reduce((sum, s) => sum + (s.totalSpent || 0), 0),
    }),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Supplier Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage supplier relationships and vendor information</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-800 hover:bg-blue-900 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
              <DialogDescription>Register a new supplier for your organization</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="supplierName">Company Name</Label>
                <Input
                  id="supplierName"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={newSupplier.contactPerson}
                    onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                    placeholder="Contact person name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newSupplier.category}
                    onValueChange={(value) => setNewSupplier({ ...newSupplier, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Equipment">Equipment</SelectItem>
                      <SelectItem value="Uniforms">Uniforms</SelectItem>
                      <SelectItem value="Medical">Medical</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Catering">Catering</SelectItem>
                      <SelectItem value="Transportation">Transportation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplierEmail">Email</Label>
                  <Input
                    id="supplierEmail"
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    placeholder="Enter email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierPhone">Phone</Label>
                  <Input
                    id="supplierPhone"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierAddress">Address</Label>
                <Textarea
                  id="supplierAddress"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  placeholder="Enter full address"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSupplier} className="bg-blue-800 hover:bg-blue-900">
                Add Supplier
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Suppliers</CardTitle>
            <Building className="h-4 w-4 text-blue-800" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalSuppliers}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{activeSuppliers} active</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">${totalSpent.toLocaleString()}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{averageRating.toFixed(1)}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Out of 5.0</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Categories</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {categoryStats.filter((c) => c.count > 0).length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Active categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Suppliers</CardTitle>
          <CardDescription>Manage all supplier information and relationships</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search suppliers..."
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
                <SelectItem value="Equipment">Equipment</SelectItem>
                <SelectItem value="Uniforms">Uniforms</SelectItem>
                <SelectItem value="Medical">Medical</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Catering">Catering</SelectItem>
                <SelectItem value="Transportation">Transportation</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Suppliers Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-100 text-blue-800">
                            {supplier.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{supplier.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{supplier.contactPerson}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(supplier.category)}>{supplier.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {supplier.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {supplier.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">{getRatingStars(supplier.rating)}</span>
                        <span className="text-sm font-medium">{supplier.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{supplier.totalOrders}</TableCell>
                    <TableCell className="font-medium">${supplier.totalSpent?.toLocaleString() || '0'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(supplier.isActive)}>
                        {supplier.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {supplier.lastOrderDate ? supplier.lastOrderDate.toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewSupplier(supplier)}
                        >
                          <Truck className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditSupplier(supplier)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteSupplier(supplier)}
                        >
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

      {/* Category Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Category Analytics</CardTitle>
          <CardDescription>Supplier distribution and spending by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryStats
              .filter((stat) => stat.count > 0)
              .map((stat) => (
                <div
                  key={stat.category}
                  className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getCategoryColor(stat.category)}>{stat.category}</Badge>
                    <span className="text-sm font-medium">{stat.count} suppliers</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">${stat.spent.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total spent</p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* View Supplier Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Supplier Details</DialogTitle>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-blue-100 text-blue-800 text-lg">
                    {selectedSupplier.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedSupplier.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getCategoryColor(selectedSupplier.category)}>{selectedSupplier.category}</Badge>
                    <Badge className={getStatusColor(selectedSupplier.isActive)}>
                      {selectedSupplier.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Contact Person</Label>
                  <p>{selectedSupplier.contactPerson}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Rating</Label>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">{getRatingStars(selectedSupplier.rating)}</span>
                    <span className="font-medium">{selectedSupplier.rating}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{selectedSupplier.email}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{selectedSupplier.phone}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</Label>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <span>{selectedSupplier.address}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</Label>
                  <p className="text-lg font-bold">{selectedSupplier.totalOrders}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</Label>
                  <p className="text-lg font-bold">${selectedSupplier.totalSpent?.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Order</Label>
                  <p className="text-lg font-bold">
                    {selectedSupplier.lastOrderDate ? selectedSupplier.lastOrderDate.toLocaleDateString() : "Never"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Registration Date</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{selectedSupplier.createdAt ? new Date(selectedSupplier.createdAt).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>Update supplier information</DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-supplier-name">Company Name</Label>
                <Input
                  id="edit-supplier-name"
                  value={selectedSupplier.name}
                  onChange={(e) => handleInputChange(e, 'name')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-contact-person">Contact Person</Label>
                  <Input
                    id="edit-contact-person"
                    value={selectedSupplier.contactPerson}
                    onChange={(e) => handleInputChange(e, 'contactPerson')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-supplier-category">Category</Label>
                  <Select
                    value={selectedSupplier.category || ''}
                    onValueChange={(value) => handleSelectChange(value, 'category')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Equipment">Equipment</SelectItem>
                      <SelectItem value="Uniforms">Uniforms</SelectItem>
                      <SelectItem value="Medical">Medical</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Catering">Catering</SelectItem>
                      <SelectItem value="Transportation">Transportation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-supplier-email">Email</Label>
                  <Input
                    id="edit-supplier-email"
                    type="email"
                    value={selectedSupplier.email}
                    onChange={(e) => handleInputChange(e, 'email')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-supplier-phone">Phone</Label>
                  <Input
                    id="edit-supplier-phone"
                    value={selectedSupplier.phone}
                    onChange={(e) => handleInputChange(e, 'phone')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-supplier-rating">Rating</Label>
                  <Input
                    id="edit-supplier-rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={selectedSupplier.rating || 0}
                    onChange={(e) => {
                      const rating = Number.parseFloat(e.target.value);
                      if (!isNaN(rating)) {
                        handleInputChange({ target: { value: rating.toString() } } as React.ChangeEvent<HTMLInputElement>, 'rating');
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-supplier-status">Status</Label>
                  <Select
                    value={selectedSupplier.isActive ? "active" : "inactive"}
                    onValueChange={(value) => handleCheckboxChange(value === "active", 'isActive')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-supplier-address">Address</Label>
                <Textarea
                  id="edit-supplier-address"
                  value={selectedSupplier.address}
                  onChange={(e) => handleInputChange(e, 'address')}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSupplier} className="bg-blue-800 hover:bg-blue-900">
              Update Supplier
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
              Are you sure you want to delete this supplier? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <div className="py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Supplier: {selectedSupplier.name}</p>
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
