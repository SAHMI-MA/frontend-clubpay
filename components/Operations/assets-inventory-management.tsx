"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  FileText,
  Monitor,
  Smartphone,
  Car,
  Building,
  Wrench,
  Calendar,
  MapPin,
  DollarSign,
  BarChart3,
  TrendingUp,
  AlertTriangle,
} from "lucide-react"

interface Asset {
  id: number
  name: string
  reference: string
  category: "Informatique" | "Mobilier" | "Véhicule" | "Équipement Sportif" | "Électronique" | "Autre"
  location: string
  purchaseDate: string
  purchasePrice?: number
  currentValue?: number
  condition: "Excellent" | "Bon" | "Moyen" | "Mauvais" | "Hors Service"
  supplier?: string
  warrantyEndDate?: string
  serialNumber?: string
  description?: string
  maintenanceDate?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// PDF Generation Function


import { useEffect, useState } from "react";
import assetApi from "../../lib/api/AssetsAPI";
import generateAssetPDF from "@/lib/jsPDF/AssetsFilePDF"

export function AssetInventoryManagement() {
  const [activeTab, setActiveTab] = useState("overview");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [isEditAssetOpen, setIsEditAssetOpen] = useState(false);
  const [isViewAssetOpen, setIsViewAssetOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Fetch assets from API
  useEffect(() => {
    async function fetchAssets() {
      try {
        const response = await assetApi.getAssets();
        setAssets(response.assets);
      } catch (error) {
        console.error("Failed to fetch assets", error);
      }
    }
    fetchAssets();
  }, []);

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || asset.category === categoryFilter
    const matchesCondition = conditionFilter === "all" || asset.condition === conditionFilter
    const matchesLocation = locationFilter === "all" || asset.location === locationFilter

    return matchesSearch && matchesCategory && matchesCondition && matchesLocation
  })

  // Get unique locations for filter
  const uniqueLocations = Array.from(new Set(assets.map((asset) => asset.location)))

  // Calculate dashboard stats
  const totalAssets = assets.length
  const activeAssets = assets.filter((a) => a.isActive).length
  const totalValue = assets.reduce((sum, asset) => sum + (Number(asset.currentValue) || 0), 0)
  const maintenanceNeeded = assets.filter(
    (a) => a.maintenanceDate && new Date(a.maintenanceDate) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  ).length

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const icons = {
      Informatique: Monitor,
      Mobilier: Building,
      Véhicule: Car,
      "Équipement Sportif": Package,
      Électronique: Smartphone,
      Autre: Wrench,
    }
    return icons[category as keyof typeof icons] || Package
  }

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors = {
      Informatique: "bg-blue-100 text-blue-800",
      Mobilier: "bg-green-100 text-green-800",
      Véhicule: "bg-purple-100 text-purple-800",
      "Équipement Sportif": "bg-orange-100 text-orange-800",
      Électronique: "bg-red-100 text-red-800",
      Autre: "bg-gray-100 text-gray-800",
    }
    return colors[category as keyof typeof colors] || colors["Autre"]
  }

  // Get condition color
  const getConditionColor = (condition: string) => {
    const colors = {
      Excellent: "bg-green-100 text-green-800",
      Bon: "bg-blue-100 text-blue-800",
      Moyen: "bg-yellow-100 text-yellow-800",
      Mauvais: "bg-red-100 text-red-800",
      "Hors Service": "bg-gray-100 text-gray-800",
    }
    return colors[condition as keyof typeof colors] || colors["Moyen"]
  }

  // Handle add asset
  const handleAddAsset = async (assetData: Partial<Asset>) => {
    try {
      const newAsset = await assetApi.createAsset(assetData as any);
      setAssets((prev) => [...prev, newAsset]);
      setIsAddAssetOpen(false);
    } catch (error) {
      console.error("Failed to add asset", error);
    }
  };

  // Handle edit asset
  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset)
    setIsEditAssetOpen(true)
  }

  // Handle update asset
  const handleUpdateAsset = async (assetData: Partial<Asset>) => {
    if (editingAsset) {
      try {
        const updated = await assetApi.updateAsset(editingAsset.id, assetData as any);
        setAssets((prev) =>
          prev.map((asset) => (asset.id === editingAsset.id ? updated : asset))
        );
        setIsEditAssetOpen(false);
        setEditingAsset(null);
      } catch (error) {
        console.error("Failed to update asset", error);
      }
    }
  };

  // Handle delete asset
  const handleDeleteAsset = async (assetId: number) => {
    try {
      await assetApi.deleteAsset(assetId);
      setAssets((prev) => prev.filter((asset) => asset.id !== assetId));
    } catch (error) {
      console.error("Failed to delete asset", error);
    }
  };

  // Handle view asset
  const handleViewAsset = (asset: Asset) => {
    setSelectedAsset(asset)
    setIsViewAssetOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventaire des Biens</h1>
          <p className="text-muted-foreground">Gérez l'inventaire des biens et équipements</p>
        </div>
        <Dialog open={isAddAssetOpen} onOpenChange={setIsAddAssetOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau Bien
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter un Nouveau Bien</DialogTitle>
            </DialogHeader>
            <AssetForm onSave={handleAddAsset} onCancel={() => setIsAddAssetOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Biens</p>
                <p className="text-2xl font-bold">{totalAssets}</p>
                <p className="text-xs text-muted-foreground">{activeAssets} actifs</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valeur Totale</p>
                <p className="text-2xl font-bold">{totalValue.toLocaleString()} MAD</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Patrimoine
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Maintenance</p>
                <p className="text-2xl font-bold text-orange-600">{maintenanceNeeded}</p>
                <p className="text-xs text-muted-foreground">À prévoir</p>
              </div>
              <Wrench className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emplacements</p>
                <p className="text-2xl font-bold">{uniqueLocations.length}</p>
                <p className="text-xs text-muted-foreground">Sites actifs</p>
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
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Maintenance
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
                  placeholder="Rechercher par nom, référence ou emplacement..."
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
                <SelectItem value="Informatique">Informatique</SelectItem>
                <SelectItem value="Mobilier">Mobilier</SelectItem>
                <SelectItem value="Véhicule">Véhicule</SelectItem>
                <SelectItem value="Équipement Sportif">Équipement Sportif</SelectItem>
                <SelectItem value="Électronique">Électronique</SelectItem>
                <SelectItem value="Autre">Autre</SelectItem>
              </SelectContent>
            </Select>
            <Select value={conditionFilter} onValueChange={setConditionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="État" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous états</SelectItem>
                <SelectItem value="Excellent">Excellent</SelectItem>
                <SelectItem value="Bon">Bon</SelectItem>
                <SelectItem value="Moyen">Moyen</SelectItem>
                <SelectItem value="Mauvais">Mauvais</SelectItem>
                <SelectItem value="Hors Service">Hors Service</SelectItem>
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Emplacement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous emplacements</SelectItem>
                {uniqueLocations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assets Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Biens ({filteredAssets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Nom</th>
                      <th className="text-left p-2">Référence</th>
                      <th className="text-left p-2">Catégorie</th>
                      <th className="text-left p-2">Emplacement</th>
                      <th className="text-left p-2">Date d'Achat</th>
                      <th className="text-left p-2">État</th>
                      <th className="text-left p-2">Valeur</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.map((asset) => {
                      const CategoryIcon = getCategoryIcon(asset.category)
                      return (
                        <tr key={asset.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{asset.name}</p>
                                {asset.serialNumber && (
                                  <p className="text-xs text-muted-foreground">S/N: {asset.serialNumber}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-2 font-mono text-sm">{asset.reference}</td>
                          <td className="p-2">
                            <Badge className={getCategoryColor(asset.category)}>{asset.category}</Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {asset.location}
                            </div>
                          </td>
                          <td className="p-2 text-sm">{new Date(asset.purchaseDate).toLocaleDateString("fr-FR")}</td>
                          <td className="p-2">
                            <Badge className={getConditionColor(asset.condition)}>{asset.condition}</Badge>
                          </td>
                          <td className="p-2 font-medium">
                            {asset.currentValue ? `${asset.currentValue.toLocaleString()} MAD` : "-"}
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => handleViewAsset(asset)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleEditAsset(asset)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => generateAssetPDF(asset)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() => handleDeleteAsset(asset.id)}
                              >
                                <Trash2 className="h-4 w-4" />
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
            {["Informatique", "Mobilier", "Véhicule", "Équipement Sportif", "Électronique", "Autre"].map((category) => {
              const categoryAssets = assets.filter((asset) => asset.category === category)
              const CategoryIcon = getCategoryIcon(category)
              const totalCategoryValue = categoryAssets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0)

              return (
                <Card key={category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CategoryIcon className="h-5 w-5" />
                      {category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Nombre:</span>
                        <span className="font-medium">{categoryAssets.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Valeur totale:</span>
                        <span className="font-medium">{totalCategoryValue.toLocaleString()} MAD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Actifs:</span>
                        <span className="font-medium">{categoryAssets.filter((a) => a.isActive).length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Suivi de Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assets
                  .filter((asset) => asset.maintenanceDate || asset.warrantyEndDate)
                  .map((asset) => {
                    const needsMaintenance =
                      asset.maintenanceDate &&
                      new Date(asset.maintenanceDate) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
                    const warrantyExpiring =
                      asset.warrantyEndDate &&
                      new Date(asset.warrantyEndDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

                    return (
                      <div key={asset.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">{asset.name}</p>
                              <p className="text-sm text-muted-foreground">{asset.reference}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {needsMaintenance && (
                              <Badge className="bg-orange-100 text-orange-800">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Maintenance due
                              </Badge>
                            )}
                            {warrantyExpiring && (
                              <Badge className="bg-red-100 text-red-800">
                                <Calendar className="h-3 w-3 mr-1" />
                                Garantie expire
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                          {asset.maintenanceDate && (
                            <div>
                              <span className="text-muted-foreground">Dernière maintenance:</span>
                              <span className="ml-2">
                                {new Date(asset.maintenanceDate).toLocaleDateString("fr-FR")}
                              </span>
                            </div>
                          )}
                          {asset.warrantyEndDate && (
                            <div>
                              <span className="text-muted-foreground">Fin de garantie:</span>
                              <span className="ml-2">
                                {new Date(asset.warrantyEndDate).toLocaleDateString("fr-FR")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                {assets.filter((asset) => asset.maintenanceDate || asset.warrantyEndDate).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Aucune information de maintenance disponible</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Asset Dialog */}
      {selectedAsset && (
        <Dialog open={isViewAssetOpen} onOpenChange={setIsViewAssetOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails du Bien</DialogTitle>
            </DialogHeader>
            <AssetDetails asset={selectedAsset} onGeneratePDF={() => generateAssetPDF(selectedAsset)} />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Asset Dialog */}
      {editingAsset && (
        <Dialog open={isEditAssetOpen} onOpenChange={setIsEditAssetOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier le Bien</DialogTitle>
            </DialogHeader>
            <AssetForm
              asset={editingAsset}
              onSave={handleUpdateAsset}
              onCancel={() => {
                setIsEditAssetOpen(false)
                setEditingAsset(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Asset Form Component
function AssetForm({
  asset,
  onSave,
  onCancel,
}: {
  asset?: Asset
  onSave: (data: Partial<Asset>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: asset?.name || "",
    reference: asset?.reference || "",
    category: asset?.category || "Autre",
    location: asset?.location || "",
    purchaseDate: asset?.purchaseDate || "",
    purchasePrice: asset?.purchasePrice || "",
    currentValue: asset?.currentValue || "",
    condition: asset?.condition || "Bon",
    supplier: asset?.supplier || "",
    warrantyEndDate: asset?.warrantyEndDate || "",
    serialNumber: asset?.serialNumber || "",
    description: asset?.description || "",
    maintenanceDate: asset?.maintenanceDate || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : undefined,
      currentValue: formData.currentValue ? Number(formData.currentValue) : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nom du bien *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="reference">Référence *</Label>
          <Input
            id="reference"
            value={formData.reference}
            onChange={(e) => setFormData((prev) => ({ ...prev, reference: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Catégorie *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Informatique">Informatique</SelectItem>
              <SelectItem value="Mobilier">Mobilier</SelectItem>
              <SelectItem value="Véhicule">Véhicule</SelectItem>
              <SelectItem value="Équipement Sportif">Équipement Sportif</SelectItem>
              <SelectItem value="Électronique">Électronique</SelectItem>
              <SelectItem value="Autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="condition">État *</Label>
          <Select
            value={formData.condition}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, condition: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Excellent">Excellent</SelectItem>
              <SelectItem value="Bon">Bon</SelectItem>
              <SelectItem value="Moyen">Moyen</SelectItem>
              <SelectItem value="Mauvais">Mauvais</SelectItem>
              <SelectItem value="Hors Service">Hors Service</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="location">Emplacement *</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="purchaseDate">Date d'achat *</Label>
          <Input
            id="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, purchaseDate: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="purchasePrice">Prix d'achat (MAD)</Label>
          <Input
            id="purchasePrice"
            type="number"
            value={formData.purchasePrice}
            onChange={(e) => setFormData((prev) => ({ ...prev, purchasePrice: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="currentValue">Valeur actuelle (MAD)</Label>
          <Input
            id="currentValue"
            type="number"
            value={formData.currentValue}
            onChange={(e) => setFormData((prev) => ({ ...prev, currentValue: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="supplier">Fournisseur</Label>
          <Input
            id="supplier"
            value={formData.supplier}
            onChange={(e) => setFormData((prev) => ({ ...prev, supplier: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="serialNumber">Numéro de série</Label>
          <Input
            id="serialNumber"
            value={formData.serialNumber}
            onChange={(e) => setFormData((prev) => ({ ...prev, serialNumber: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="warrantyEndDate">Fin de garantie</Label>
          <Input
            id="warrantyEndDate"
            type="date"
            value={formData.warrantyEndDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, warrantyEndDate: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="maintenanceDate">Dernière maintenance</Label>
          <Input
            id="maintenanceDate"
            type="date"
            value={formData.maintenanceDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, maintenanceDate: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">{asset ? "Modifier" : "Créer"}</Button>
      </div>
    </form>
  )
}

// Asset Details Component
function AssetDetails({
  asset,
  onGeneratePDF,
}: {
  asset: Asset
  onGeneratePDF: () => void
}) {
  const CategoryIcon = getCategoryIcon(asset.category)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CategoryIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h3 className="text-xl font-bold">{asset.name}</h3>
            <p className="text-muted-foreground">{asset.reference}</p>
          </div>
        </div>
        <Button onClick={onGeneratePDF} className="gap-2">
          <FileText className="h-4 w-4" />
          Générer PDF
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Catégorie</Label>
          <p className="font-medium">{asset.category}</p>
        </div>
        <div>
          <Label>État</Label>
          <Badge className={getConditionColor(asset.condition)}>{asset.condition}</Badge>
        </div>
        <div>
          <Label>Emplacement</Label>
          <p className="font-medium">{asset.location}</p>
        </div>
        <div>
          <Label>Date d'achat</Label>
          <p className="font-medium">{new Date(asset.purchaseDate).toLocaleDateString("fr-FR")}</p>
        </div>
        {asset.purchasePrice && (
          <div>
            <Label>Prix d'achat</Label>
            <p className="font-medium">{asset.purchasePrice.toLocaleString()} MAD</p>
          </div>
        )}
        {asset.currentValue && (
          <div>
            <Label>Valeur actuelle</Label>
            <p className="font-medium">{asset.currentValue.toLocaleString()} MAD</p>
          </div>
        )}
        {asset.supplier && (
          <div>
            <Label>Fournisseur</Label>
            <p className="font-medium">{asset.supplier}</p>
          </div>
        )}
        {asset.serialNumber && (
          <div>
            <Label>Numéro de série</Label>
            <p className="font-medium font-mono">{asset.serialNumber}</p>
          </div>
        )}
        {asset.warrantyEndDate && (
          <div>
            <Label>Fin de garantie</Label>
            <p className="font-medium">{new Date(asset.warrantyEndDate).toLocaleDateString("fr-FR")}</p>
          </div>
        )}
        {asset.maintenanceDate && (
          <div>
            <Label>Dernière maintenance</Label>
            <p className="font-medium">{new Date(asset.maintenanceDate).toLocaleDateString("fr-FR")}</p>
          </div>
        )}
      </div>

      {asset.description && (
        <div>
          <Label>Description</Label>
          <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{asset.description}</p>
        </div>
      )}
    </div>
  )
}

// Helper functions
function getCategoryIcon(category: string) {
  const icons = {
    Informatique: Monitor,
    Mobilier: Building,
    Véhicule: Car,
    "Équipement Sportif": Package,
    Électronique: Smartphone,
    Autre: Wrench,
  }
  return icons[category as keyof typeof icons] || Package
}

function getConditionColor(condition: string) {
  const colors = {
    Excellent: "bg-green-100 text-green-800",
    Bon: "bg-blue-100 text-blue-800",
    Moyen: "bg-yellow-100 text-yellow-800",
    Mauvais: "bg-red-100 text-red-800",
    "Hors Service": "bg-gray-100 text-gray-800",
  }
  return colors[condition as keyof typeof colors] || colors["Moyen"]
}
