"use client"

/**
 * Export a list of suppliers to CSV
 * @param suppliers Array of Supplier objects
 */
export function exportSuppliersToCSV(suppliers: Supplier[]) {
  // Helper function to safely parse numeric values
  const parseNumericValue = (value: string | number | undefined | null): number => {
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return value || 0;
  };

  // Helper function to calculate actual total spent from acquisitions
  const calculateTotalSpent = (supplier: any): number => {
    if (!supplier.acquisitions || !Array.isArray(supplier.acquisitions)) {
      return 0;
    }
    return supplier.acquisitions.reduce((sum: number, acquisition: any) => {
      return sum + parseNumericValue(acquisition.totalCost);
    }, 0);
  };

  // Helper function to calculate total orders count from acquisitions
  const getTotalOrders = (supplier: any): number => {
    if (!supplier.acquisitions || !Array.isArray(supplier.acquisitions)) {
      return 0;
    }
    return supplier.acquisitions.length;
  };

  const header = ['ID', 'Name', 'Address', 'Phone', 'Email', 'Contact Person', 'Category', 'Rating', 'Total Orders', 'Total Spent (MAD)', 'Status'];
  const rows = suppliers.map(supplier => [
    supplier.id,
    supplier.name || '',
    supplier.address || '',
    supplier.phone || '',
    supplier.email || '',
    supplier.contactPerson || '',
    supplier.category || '',
    parseNumericValue(supplier.rating),
    getTotalOrders(supplier),
    calculateTotalSpent(supplier),
    supplier.isActive ? 'Active' : 'Inactive'
  ]);
  const csvContent = [header, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'suppliers.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

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

  // Helper function to safely parse numeric values from API
  const parseNumericValue = (value: string | number | undefined | null): number => {
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return value || 0;
  }

  // Helper function to calculate actual total spent from acquisitions
  const calculateTotalSpent = (supplier: any): number => {
    if (!supplier.acquisitions || !Array.isArray(supplier.acquisitions)) {
      return 0;
    }
    return supplier.acquisitions.reduce((sum: number, acquisition: any) => {
      return sum + parseNumericValue(acquisition.totalCost);
    }, 0);
  }

  // Helper function to calculate last order date from acquisitions
  const getLastOrderDate = (supplier: any): Date | null => {
    if (!supplier.acquisitions || !Array.isArray(supplier.acquisitions) || supplier.acquisitions.length === 0) {
      return null;
    }
    
    const dates = supplier.acquisitions
      .map((acquisition: any) => new Date(acquisition.createdAt))
      .filter((date: Date) => !isNaN(date.getTime()))
      .sort((a: Date, b: Date) => b.getTime() - a.getTime());
    
    return dates.length > 0 ? dates[0] : null;
  }

  // Helper function to calculate total orders count from acquisitions
  const getTotalOrders = (supplier: any): number => {
    if (!supplier.acquisitions || !Array.isArray(supplier.acquisitions)) {
      return 0;
    }
    return supplier.acquisitions.length;
  }

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
    rib: "", // NEW: Bank account information
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
      rib: "", // NEW: Bank account information
      category: "",
    })
  }

  const handleEditSupplier = (supplier: Supplier) => {
    dispatch(setSelectedSupplier(supplier))
    setIsEditDialogOpen(true)
  }

  const handleUpdateSupplier = () => {
    if (selectedSupplier && selectedSupplier.id) {
      // Validate and convert rating
      let validRating = 3; // Default rating
      if (selectedSupplier.rating !== undefined && selectedSupplier.rating !== null) {
        const ratingValue = typeof selectedSupplier.rating === 'string' 
          ? parseFloat(selectedSupplier.rating) 
          : selectedSupplier.rating;
        
        if (!isNaN(ratingValue) && ratingValue >= 1 && ratingValue <= 5) {
          validRating = ratingValue;
        }
      }

      const updateData: UpdateSupplierDto = {
        name: selectedSupplier.name,
        contactPerson: selectedSupplier.contactPerson,
        email: selectedSupplier.email,
        phone: selectedSupplier.phone,
        address: selectedSupplier.address,
        category: selectedSupplier.category,
        isActive: selectedSupplier.isActive,
        rating: validRating
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
  const totalSpent = suppliersList.reduce((sum, s) => sum + calculateTotalSpent(s), 0)
  const averageRating = suppliersList.length > 0 
    ? suppliersList.reduce((sum, s) => sum + parseNumericValue(s.rating), 0) / suppliersList.length 
    : 0

  const categoryStats = ["Equipment", "Uniforms", "Medical", "Maintenance", "Catering", "Transportation"].map(
    (category) => ({
      category,
      count: suppliersList.filter((s) => s.category === category).length,
      spent: suppliersList.filter((s) => s.category === category)
        .reduce((sum, s) => sum + calculateTotalSpent(s), 0),
    }),
  )

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          className="bg-blue-800 hover:bg-blue-900 text-white mb-2"
          onClick={() => exportSuppliersToCSV(filteredSuppliers)}
        >
          Exporter les fournisseurs (CSV)
        </Button>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des fournisseurs</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérez les relations et informations des fournisseurs</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-800 hover:bg-blue-900 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un fournisseur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau fournisseur</DialogTitle>
              <DialogDescription>Enregistrez un nouveau fournisseur pour votre organisation</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="supplierName">Nom de l'entreprise</Label>
                <Input
                  id="supplierName"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  placeholder="Saisir le nom de l'entreprise"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Personne à contacter</Label>
                  <Input
                    id="contactPerson"
                    value={newSupplier.contactPerson}
                    onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                    placeholder="Nom du contact"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select
                    value={newSupplier.category}
                    onValueChange={(value) => setNewSupplier({ ...newSupplier, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Equipment">Équipements</SelectItem>
                      <SelectItem value="Uniforms">Tenues</SelectItem>
                      <SelectItem value="Medical">Médical</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Catering">Restauration</SelectItem>
                      <SelectItem value="Transportation">Transport</SelectItem>
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
                    placeholder="Saisir l'email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierPhone">Téléphone</Label>
                  <Input
                    id="supplierPhone"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    placeholder="Saisir le numéro de téléphone"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierRib">RIB (Compte bancaire)</Label>
                <Input
                  id="supplierRib"
                  value={newSupplier.rib}
                  onChange={(e) => setNewSupplier({ ...newSupplier, rib: e.target.value })}
                  placeholder="Informations bancaires"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierAddress">Adresse</Label>
                <Textarea
                  id="supplierAddress"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  placeholder="Saisir l'adresse complète"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddSupplier} className="bg-blue-800 hover:bg-blue-900">
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre total de fournisseurs</CardTitle>
            <Building className="h-4 w-4 text-blue-800" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalSuppliers}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{activeSuppliers} actifs</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total dépensé</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalSpent.toLocaleString('fr-FR')} MAD</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Historique</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Note moyenne</CardTitle>
            <Star className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{averageRating.toFixed(1)}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Sur 5,0</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Catégories</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {categoryStats.filter((c) => c.count > 0).length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Catégories actives</p>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Fournisseurs</CardTitle>
          <CardDescription>Gérez toutes les informations et relations fournisseurs</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher un fournisseur..."
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
                <SelectItem value="Equipment">Équipements</SelectItem>
                <SelectItem value="Uniforms">Tenues</SelectItem>
                <SelectItem value="Medical">Médical</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Catering">Restauration</SelectItem>
                <SelectItem value="Transportation">Transport</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Suppliers Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Commandes</TableHead>
                  <TableHead>Total dépensé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière commande</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier, index) => (
                  <TableRow key={supplier.id}>
                    <TableCell>{index + 1}</TableCell>
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
                      <Badge className={getCategoryColor(supplier.category)}>{supplier.category === 'Equipment' ? 'Équipements' : supplier.category === 'Uniforms' ? 'Tenues' : supplier.category === 'Medical' ? 'Médical' : supplier.category === 'Maintenance' ? 'Maintenance' : supplier.category === 'Catering' ? 'Restauration' : supplier.category === 'Transportation' ? 'Transport' : supplier.category}</Badge>
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
                    <TableCell className="font-medium">{getTotalOrders(supplier)}</TableCell>
                    <TableCell className="font-medium">
                      {calculateTotalSpent(supplier).toLocaleString('fr-FR')} MAD
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(supplier.isActive)}>
                        {supplier.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getLastOrderDate(supplier) ? getLastOrderDate(supplier)!.toLocaleDateString('fr-FR') : "Jamais"}
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

      {/* View Supplier Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails du fournisseur</DialogTitle>
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
                    <Badge className={getCategoryColor(selectedSupplier.category)}>{selectedSupplier.category === 'Equipment' ? 'Équipements' : selectedSupplier.category === 'Uniforms' ? 'Tenues' : selectedSupplier.category === 'Medical' ? 'Médical' : selectedSupplier.category === 'Maintenance' ? 'Maintenance' : selectedSupplier.category === 'Catering' ? 'Restauration' : selectedSupplier.category === 'Transportation' ? 'Transport' : selectedSupplier.category}</Badge>
                    <Badge className={getStatusColor(selectedSupplier.isActive)}>
                      {selectedSupplier.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Personne à contacter</Label>
                  <p>{selectedSupplier.contactPerson}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Note</Label>
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
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Téléphone</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{selectedSupplier.phone}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Adresse</Label>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <span>{selectedSupplier.address}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Commandes totales</Label>
                  <p className="text-lg font-bold">{getTotalOrders(selectedSupplier)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total dépensé</Label>
                  <p className="text-lg font-bold">
                    {calculateTotalSpent(selectedSupplier).toLocaleString('fr-FR')} MAD
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Dernière commande</Label>
                  <p className="text-lg font-bold">
                    {getLastOrderDate(selectedSupplier) ? getLastOrderDate(selectedSupplier)!.toLocaleDateString('fr-FR') : "Jamais"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date d'inscription</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{selectedSupplier.createdAt ? new Date(selectedSupplier.createdAt).toLocaleDateString('fr-FR') : 'Inconnue'}</span>
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
            <DialogTitle>Modifier le fournisseur</DialogTitle>
            <DialogDescription>Mettre à jour les informations du fournisseur</DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-supplier-name">Nom de l'entreprise</Label>
                <Input
                  id="edit-supplier-name"
                  value={selectedSupplier.name}
                  onChange={(e) => handleInputChange(e, 'name')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-contact-person">Personne à contacter</Label>
                  <Input
                    id="edit-contact-person"
                    value={selectedSupplier.contactPerson}
                    onChange={(e) => handleInputChange(e, 'contactPerson')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-supplier-category">Catégorie</Label>
                  <Select
                    value={selectedSupplier.category || ''}
                    onValueChange={(value) => handleSelectChange(value, 'category')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Equipment">Équipements</SelectItem>
                      <SelectItem value="Uniforms">Tenues</SelectItem>
                      <SelectItem value="Medical">Médical</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Catering">Restauration</SelectItem>
                      <SelectItem value="Transportation">Transport</SelectItem>
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
                  <Label htmlFor="edit-supplier-phone">Téléphone</Label>
                  <Input
                    id="edit-supplier-phone"
                    value={selectedSupplier.phone}
                    onChange={(e) => handleInputChange(e, 'phone')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-supplier-rating">Note (1-5)</Label>
                  <Input
                    id="edit-supplier-rating"
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={selectedSupplier.rating || 3}
                    onChange={(e) => {
                      const rating = parseFloat(e.target.value);
                      if (!isNaN(rating) && rating >= 1 && rating <= 5) {
                        if (selectedSupplier) {
                          dispatch(setSelectedSupplier({
                            ...selectedSupplier,
                            rating: rating
                          }));
                        }
                      }
                    }}
                    placeholder="3.0"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500">{getRatingStars(selectedSupplier.rating)}</span>
                    <span className="text-xs text-gray-500">({selectedSupplier.rating || 3}/5)</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-supplier-status">Statut</Label>
                  <Select
                    value={selectedSupplier.isActive ? "active" : "inactive"}
                    onValueChange={(value) => handleCheckboxChange(value === "active", 'isActive')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-supplier-address">Adresse</Label>
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
              Annuler
            </Button>
            <Button onClick={handleUpdateSupplier} className="bg-blue-800 hover:bg-blue-900">
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmation de suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce fournisseur ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <div className="py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Fournisseur : {selectedSupplier.name}</p>
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
