"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Package,
  Search,
  Eye,
  FileText,
  Monitor,
  Smartphone,
  Car,
  Building,
  Wrench,
  MapPin,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  History,
  User,
  Clock,
  RefreshCw,
} from "lucide-react"

// Import types and thunk
import { fetchAllInventoryItems, InventoryItem, InventoryHistory } from "@/lib/redux/InventorySlice"
import type { AppDispatch, RootState } from "@/lib/redux/store"
import { associationAPI, AssociationSettings } from "@/lib/api/association-api"
import { generateInventoryItemPDF } from "@/lib/jsPDF/InventoryFilePDF"

export function AssetInventoryManagement() {
  const dispatch = useDispatch<AppDispatch>()

  // Fixed: Access inventory state directly as array
  const inventoryItems: InventoryItem[] = useSelector((state: RootState) => state.inventory || []);

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [isViewItemOpen, setIsViewItemOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [pdfExportProgress, setPdfExportProgress] = useState({ current: 0, total: 0 })
  const [showPDFExportDialog, setShowPDFExportDialog] = useState(false)
  const [clubInfo, setClubInfo] = useState<AssociationSettings | null>(null)

  useEffect(() => {
    const fetchClubInfo = async () => {
      try {
        const info = await associationAPI.getSettings()
        setClubInfo(info)
      } catch (error) {
        console.warn('Could not fetch club info, using defaults', error)
      }
    }

    fetchClubInfo()
  }, [])

  async function handleSingleItemPDF(item: InventoryItem): Promise<void> {
    try{
      setIsGeneratingPDF(true);
      setPdfExportProgress({ current: pdfExportProgress.current + 1, total: pdfExportProgress.total });
      await generateInventoryItemPDF(item, clubInfo);
    } catch (error) {
      console.error('Error generating PDF for item:', item, error);
    } finally {
      setIsGeneratingPDF(false);
      setPdfExportProgress({ current: pdfExportProgress.current , total: pdfExportProgress.total + 1 });
    }

  }

  const PDFExportProgressDialog = () => (
    <Dialog open={showPDFExportDialog} onOpenChange={setShowPDFExportDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Génération des PDFs
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Progression
            </span>
            <span className="text-sm font-medium">
              {pdfExportProgress.current} / {pdfExportProgress.total}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${pdfExportProgress.total > 0 ? (pdfExportProgress.current / pdfExportProgress.total) * 100 : 0}%` 
              }}
            />
          </div>

          {pdfExportProgress.current === pdfExportProgress.total && pdfExportProgress.total > 0 && (
            <div className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Tous les PDFs ont été générés avec succès!</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )


  // Fetch inventory items on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        await dispatch(fetchAllInventoryItems()).unwrap()
      } catch (err: any) {
        console.error('Error fetching inventory:', err)
        setError(err?.message || 'Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if we don't have data
    if (!inventoryItems.length) {
      fetchData()
    }
  }, [dispatch, inventoryItems.length])

  // Debug logging
  console.log('Inventory state:', { inventoryItems, loading, error })

  // Filter inventory items - add safety check
  const filteredItems = Array.isArray(inventoryItems) ? inventoryItems.filter((item: InventoryItem) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    const matchesLocation = locationFilter === "all" || item.location === locationFilter
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" ? item.isActive : !item.isActive)

    return matchesSearch && matchesCategory && matchesLocation && matchesStatus
  }) : []

  // Get unique locations for filter - add safety check
  const uniqueLocations = Array.from(new Set(
    Array.isArray(inventoryItems)
      ? inventoryItems
        .map((item: InventoryItem) => item.location)
        .filter(Boolean)
      : []
  )) as string[]

  // Get unique categories for filter - add safety check
  const uniqueCategories = Array.from(new Set(
    Array.isArray(inventoryItems)
      ? inventoryItems.map((item: InventoryItem) => item.category)
      : []
  )) as string[]

  // Calculate dashboard stats - add safety checks
  const totalItems = Array.isArray(inventoryItems) ? inventoryItems.length : 0
  const activeItems = Array.isArray(inventoryItems)
    ? inventoryItems.filter((item: InventoryItem) => item.isActive).length
    : 0
  const allocatedItems = Array.isArray(inventoryItems)
    ? inventoryItems.filter((item: InventoryItem) =>
      (Array.isArray(item.allocationHistory) &&
        item.allocationHistory.some((h: InventoryHistory) => ['In Use', 'Approved'].includes(h.status))) ||
      (Array.isArray(item.inUserAllocation) && item.inUserAllocation.length > 0)
    ).length
    : 0
  const pendingAllocations = Array.isArray(inventoryItems)
    ? inventoryItems.reduce((sum: number, item: InventoryItem) => {
      const historyPending = Array.isArray(item.allocationHistory)
        ? item.allocationHistory.filter((h: InventoryHistory) => h.status === 'Pending').length
        : 0
      const currentPending = Array.isArray(item.inUserAllocation)
        ? item.inUserAllocation.filter((h: InventoryHistory) => h.status === 'Pending').length
        : 0
      return sum + historyPending + currentPending
    }, 0)
    : 0



  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true)
    setError(null)
    try {
      await dispatch(fetchAllInventoryItems()).unwrap()
    } catch (err: any) {
      console.error('Error refreshing inventory:', err)
      setError(err?.message || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  // Handle view item
  const handleViewItem = (item: InventoryItem) => {
    setSelectedItem(item)
    setIsViewItemOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Chargement de l'inventaire...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-600">
        <AlertTriangle className="h-8 w-8 mr-2" />
        <span>Erreur lors du chargement: {error}</span>
        <Button onClick={handleRefresh} className="mt-4" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    )
  }

  if (!Array.isArray(inventoryItems) || inventoryItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Package className="h-12 w-12 mb-4 opacity-50" />
        <span>Aucun équipement trouvé</span>
        <Button onClick={handleRefresh} className="mt-4" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventaire des Biens</h1>
          <p className="text-muted-foreground">Visualisation et suivi des Biens et allocations</p>
        </div>
        <Button onClick={handleRefresh} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>
      {/* PDF Export Progress Dialog */}
      <PDFExportProgressDialog />

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Biens</p>
                <p className="text-2xl font-bold">{totalItems}</p>
                <p className="text-xs text-muted-foreground">{activeItems} disponibles</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Biens Alloués</p>
                <p className="text-2xl font-bold">{allocatedItems}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  En utilisation
                </p>
              </div>
              <User className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Allocations Pendantes</p>
                <p className="text-2xl font-bold text-orange-600">{pendingAllocations}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emplacements</p>
                <p className="text-2xl font-bold">{uniqueLocations.length}</p>
                <p className="text-xs text-muted-foreground">Sites disponibles</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Par Catégorie
          </TabsTrigger>
          <TabsTrigger value="allocations" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Allocations
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom, code ou emplacement..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {uniqueCategories.map((category: string) => (
                  <SelectItem key={category} value={category}>
                    {category.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="active">Disponible</SelectItem>
                <SelectItem value="inactive">Non disponible</SelectItem>
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Emplacement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous emplacements</SelectItem>
                {uniqueLocations.map((location: string) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Biens ({filteredItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Nom</th>
                      <th className="text-left p-2">Code</th>
                      <th className="text-left p-2">Catégorie</th>
                      <th className="text-left p-2">Emplacement</th>
                      <th className="text-left p-2">Unité</th>
                      <th className="text-left p-2">Statut</th>
                      <th className="text-left p-2">Allocations</th>
                      <th className="text-left p-2">Dernière Allocation</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item: InventoryItem) => {
                      const CategoryIcon = getCategoryIcon(item.category)
                      const activeAllocations = Array.isArray(item.allocationHistory)
                        ? item.allocationHistory.filter((h: InventoryHistory) =>
                          ['In Use', 'Approved'].includes(h.status)
                        ).length
                        : 0
                      return (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-2 font-mono text-sm">
                            {item.code}
                          </td>
                          <td className="p-2">
                            <Badge className={getCategoryColor(item.category)}>
                              {item.category.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {item.location || '-'}
                            </div>
                          </td>
                          <td className="p-2 text-sm">{item.unit}</td>
                          <td className="p-2">
                            <Badge className={item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {item.isActive ? 'Disponible' : 'Non disponible'}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {(Array.isArray(item.allocationHistory) ? item.allocationHistory.length : 0) +
                                  (Array.isArray(item.inUserAllocation) ? item.inUserAllocation.length : 0)}
                              </span>
                              {activeAllocations > 0 && (
                                <Badge className="bg-blue-100 text-blue-800 text-xs">
                                  {activeAllocations} en cours
                                </Badge>
                              )}
                              {Array.isArray(item.inUserAllocation) && item.inUserAllocation.length > 0 && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  {item.inUserAllocation.length} actuelle(s)
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-2 text-sm">
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{item.inUserAllocation.length !== 0 ?
                                  item.inUserAllocation.sort((a, b) => a.allocatedAt > b.allocatedAt ? -1 : 1)[0]?.entityName : 'N/A'
                                }</p>
                                <p className="text-xs text-muted-foreground">
                                  {Array.isArray(item.inUserAllocation) && item.inUserAllocation.length > 0
                                    ? (() => {
                                      const sorted = item.inUserAllocation.sort((a, b) => a.allocatedAt > b.allocatedAt ? -1 : 1);
                                      const allocatedAt = sorted[0]?.allocatedAt;
                                      return allocatedAt
                                        ? typeof allocatedAt === "string" || typeof allocatedAt === "number"
                                          ? allocatedAt
                                          : new Date(allocatedAt).toLocaleDateString('fr-FR')
                                        : 'N/A';
                                    })()
                                    : 'N/A'
                                  }
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => handleViewItem(item)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-blue-600 hover:text-blue-700"
                                onClick={() => handleSingleItemPDF(item)}
                                disabled={isGeneratingPDF}
                                title={`Générer PDF pour ${item.name}`}
                              >
                                {isGeneratingPDF ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <FileText className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uniqueCategories.map((category: string) => {
              const categoryItems = inventoryItems.filter((item: InventoryItem) => item.category === category)
              const CategoryIcon = getCategoryIcon(category)
              const allocatedInCategory = categoryItems.filter((item: InventoryItem) =>
                Array.isArray(item.allocationHistory) &&
                item.allocationHistory.some((h: InventoryHistory) => ['In Use', 'Approved'].includes(h.status))
              ).length

              return (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CategoryIcon className="h-5 w-5" />
                      {category.replace('_', ' ')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Nombre:</span>
                        <span className="font-medium">{categoryItems.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Alloués:</span>
                        <span className="font-medium">{allocatedInCategory}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Disponibles:</span>
                        <span className="font-medium">{categoryItems.filter((item: InventoryItem) => item.isActive).length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Allocations Tab */}
        <TabsContent value="allocations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique des Allocations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryItems
                  .filter((item: InventoryItem) =>
                    (Array.isArray(item.allocationHistory) && item.allocationHistory.length > 0) ||
                    (Array.isArray(item.inUserAllocation) && item.inUserAllocation.length > 0)
                  )
                  .map((item: InventoryItem) => {
                    const totalAllocations = (Array.isArray(item.allocationHistory) ? item.allocationHistory.length : 0) +
                      (Array.isArray(item.inUserAllocation) ? item.inUserAllocation.length : 0)

                    return (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">{item.code}</p>
                            </div>
                          </div>
                          <Badge className="text-xs">
                            {totalAllocations} allocation(s)
                          </Badge>
                        </div>

                        {/* Current Allocations (inUserAllocation) */}
                        {Array.isArray(item.inUserAllocation) && item.inUserAllocation.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Allocations Actuelles ({item.inUserAllocation.length})
                            </h5>
                            <div className="space-y-2">
                              {item.inUserAllocation.slice(0, 3).map((history: InventoryHistory, index: number) => (
                                <div key={`current-${index}`} className="flex items-center justify-between text-sm border-l-4 border-green-500 pl-3 bg-green-50">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{history.reference}</span>
                                    <span className="text-muted-foreground">→ {history.entityName || history.user}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={`text-xs ${getStatusColor(history.status)}`}>
                                      {history.status === 'In Use' ? 'En Utilisation' : ''}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {history.allocationType} • {history.allocationDuration}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {item.inUserAllocation.length > 3 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-green-600"
                                  onClick={() => handleViewItem(item)}
                                >
                                  Voir toutes les allocations actuelles ({item.inUserAllocation.length})
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Historical Allocations */}
                        {Array.isArray(item.allocationHistory) && item.allocationHistory.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1">
                              <History className="h-3 w-3" />
                              Historique ({item.allocationHistory.length})
                            </h5>
                            <div className="space-y-2">
                              {item.allocationHistory.slice(0, 3).map((history: InventoryHistory, index: number) => (
                                <div key={`history-${index}`} className="flex items-center justify-between text-sm border-l-2 border-gray-200 pl-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{history.reference}</span>
                                    <span className="text-muted-foreground">→ {history.entityName || history.user}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={`text-xs ${getStatusColor(history.status)}`}>
                                      {history.status === "In Use" ? 'En Utilisation' : "Rendu"}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {history.allocationType} • {history.allocationDuration}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {item.allocationHistory.length > 3 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-blue-600"
                                  onClick={() => handleViewItem(item)}
                                >
                                  Voir tout l'historique ({item.allocationHistory.length})
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                {inventoryItems.filter((item: InventoryItem) =>
                  (Array.isArray(item.allocationHistory) && item.allocationHistory.length > 0) ||
                  (Array.isArray(item.inUserAllocation) && item.inUserAllocation.length > 0)
                ).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Aucun historique d'allocation disponible</p>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Item Dialog */}
      {selectedItem && (
        <Dialog open={isViewItemOpen} onOpenChange={setIsViewItemOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails de l'Équipement</DialogTitle>
            </DialogHeader>
            <ItemDetails item={selectedItem} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Item Details Component
function ItemDetails({ item }: { item: InventoryItem }) {
  const CategoryIcon = getCategoryIcon(item.category)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CategoryIcon className="h-8 w-8 text-blue-600" />
        <div>
          <h3 className="text-xl font-bold">{item.name}</h3>
          <p className="text-muted-foreground">{item.code}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Catégorie</Label>
          <p className="font-medium">{item.category.replace('_', ' ')}</p>
        </div>
        <div>
          <Label>Unité</Label>
          <p className="font-medium">{item.unit}</p>
        </div>
        <div>
          <Label>Emplacement</Label>
          <p className="font-medium">{item.location || '-'}</p>
        </div>
        <div>
          <Label>Fournisseur</Label>
          <p className="font-medium">{item.supplier || '-'}</p>
        </div>
        <div>
          <Label>Statut</Label>
          <Badge className={item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {item.isActive ? 'Disponible' : 'Non disponible'}
          </Badge>
        </div>
      </div>

      {item.description && (
        <div>
          <Label>Description</Label>
          <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{item.description}</p>
        </div>
      )}

      {/* Allocation History */}
      <div>
        <Label>
          Historique des Allocations ({
            (Array.isArray(item.allocationHistory) ? item.allocationHistory.length : 0) +
            (Array.isArray(item.inUserAllocation) ? item.inUserAllocation.length : 0)
          })
        </Label>
        <div className="mt-2 space-y-3 max-h-64 overflow-y-auto">
          {/* Current Allocations */}
          {Array.isArray(item.inUserAllocation) && item.inUserAllocation.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Allocations Actuelles</span>
              </div>
              {item.inUserAllocation.map((history, index) => (
                <div key={`current-${index}`} className="border rounded p-3 border-green-200 bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{history.reference}</span>
                    <Badge className={`text-xs ${getStatusColor(history.status)} border-green-300`}>
                      {history.status === "In Use" ? 'En Utilisation' : "Rendu"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>Entité: {history.entityName || history.user}</div>
                    <div>Type: {history.allocationType}</div>
                    <div>Durée: {history.allocationDuration}</div>
                    <div>Alloué le: {new Date(history.allocatedAt).toLocaleDateString('fr-FR')}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Historical Allocations */}
          {Array.isArray(item.allocationHistory) && item.allocationHistory.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <History className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Historique des Allocations</span>
              </div>
              {item.allocationHistory.map((history, index) => (
                <div key={`history-${index}`} className="border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{history.reference}</span>
                    <Badge className={`text-xs ${getStatusColor(history.status)}`}>
                      {history.status === "In Use" ? 'En Utilisation' : "Rendu"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>Entité: {history.entityName || history.user}</div>
                    <div>Type: {history.allocationType}</div>
                    <div>Durée: {history.allocationDuration}</div>
                    <div>Alloué le: {new Date(history.allocatedAt).toLocaleDateString('fr-FR')}</div>
                    {history.returnedAt && (
                      <div className="col-span-2">Retourné le: {new Date(history.returnedAt).toLocaleDateString('fr-FR')}</div>
                    )}
                  </div>
                  {history.notes && (
                    <p className="mt-2 text-sm bg-gray-50 p-2 rounded">{history.notes}</p>
                  )}
                </div>
              ))}
            </>
          )}

          {(!Array.isArray(item.allocationHistory) || item.allocationHistory.length === 0) &&
            (!Array.isArray(item.inUserAllocation) || item.inUserAllocation.length === 0) && (
              <p className="text-center text-muted-foreground py-4">
                Aucun historique d'allocation
              </p>
            )}
        </div>
      </div>
    </div>
  )
}

// Helper functions (moved outside component to avoid redefinition)
function getCategoryIcon(category: string) {
  const icons: Record<string, any> = {
    "IT_EQUIPMENT": Monitor,
    "FURNITURE": Building,
    "VEHICLE": Car,
    "SPORTS_EQUIPMENT": Package,
    "ELECTRONICS": Smartphone,
    "OTHER": Wrench,
  }
  return icons[category] || Package
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    "IT_EQUIPMENT": "bg-blue-100 text-blue-800",
    "FURNITURE": "bg-green-100 text-green-800",
    "VEHICLE": "bg-purple-100 text-purple-800",
    "SPORTS_EQUIPMENT": "bg-orange-100 text-orange-800",
    "ELECTRONICS": "bg-red-100 text-red-800",
    "OTHER": "bg-gray-100 text-gray-800",
  }
  return colors[category] || colors["OTHER"]
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    "Pending": "bg-yellow-100 text-yellow-800",
    "Approved": "bg-green-100 text-green-800",
    "Rejected": "bg-red-100 text-red-800",
    "In Use": "bg-blue-100 text-blue-800",
    "Returned": "bg-gray-100 text-gray-800",
    "Cancelled": "bg-gray-100 text-gray-800",
  }
  return colors[status] || colors["Pending"]
}

