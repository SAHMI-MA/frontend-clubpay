"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { Package, Plus, Search, Edit, Trash2, AlertTriangle, TrendingUp, TrendingDown, Download, Upload, Filter, RefreshCw, MapPin, DollarSign, Activity } from 'lucide-react'
import { useStockManagement } from "@/hooks/use-stock-management"
import { 
  Article, 
  ArticleCategory, 
  Unit, 
  MovementType,
  MovementReason,
  CreateArticleDto,
  UpdateArticleDto,
  CreateStockMovementDto 
} from "@/lib/api/stock-api"

const categoryColors = {
  [ArticleCategory.EQUIPMENT]: "#3B82F6",
  [ArticleCategory.CONSUMABLE]: "#10B981",
  [ArticleCategory.MAINTENANCE]: "#F59E0B",
  [ArticleCategory.OFFICE]: "#8B5CF6",
  [ArticleCategory.SPORTS]: "#EF4444",
  [ArticleCategory.OTHER]: "#6B7280",
}

export function StockManagement() {
  // Use our custom hook for data management
  const {
    articles,
    movements,
    dashboardStats,
    loading,
    error,
    createArticle,
    deleteArticle,
    updateArticle,
    createStockMovement,
    refreshData
  } = useStockManagement()

  // Local state for UI
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [isAddArticleOpen, setIsAddArticleOpen] = useState(false)
  const [isEditArticleOpen, setIsEditArticleOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [isAddMovementOpen, setIsAddMovementOpen] = useState(false)
  const [isViewMovementOpen, setIsViewMovementOpen] = useState(false)
  const [viewingMovement, setViewingMovement] = useState<any>(null)

  const [newArticle, setNewArticle] = useState<CreateArticleDto>({
    code: "",
    name: "",
    description: "",
    category: ArticleCategory.EQUIPMENT,
    unit: Unit.PIECE,
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    unitPrice: 0,
    location: "",
    supplier: "",
  })

  const [editArticle, setEditArticle] = useState<UpdateArticleDto>({
    code: "",
    name: "",
    description: "",
    category: ArticleCategory.EQUIPMENT,
    unit: Unit.PIECE,
    minStock: 0,
    maxStock: 0,
    unitPrice: 0,
    location: "",
    supplier: "",
  })

  const [newMovement, setNewMovement] = useState<CreateStockMovementDto>({
    articleId: 0,
    type: MovementType.INPUT,
    reason: MovementReason.OTHER,
    quantity: 0,
    unitPrice: 0,
    referenceDocument: "",
    supplierCustomer: "",
    location: "",
    notes: "",
  })

  const filteredArticles = (articles || []).filter((article) => {
    const matchesSearch = 
      article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.supplier && article.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory
    const matchesLocation = selectedLocation === "all" || article.location === selectedLocation
    return matchesSearch && matchesCategory && matchesLocation
  })

  const lowStockArticles = (articles || []).filter(article => Number(article.currentStock) <= Number(article.minStock))
  const totalStockValue = Number(dashboardStats?.totalStockValue || (articles || []).reduce((sum, article) => sum + (Number(article.currentStock) * Number(article.unitPrice || 0)), 0))
  const totalArticles = dashboardStats?.totalArticles || (articles || []).length
  const activeArticles = dashboardStats?.activeArticles || (articles || []).filter(article => article.isActive).length

  const getStockStatus = (article: Article) => {
    const currentStock = Number(article.currentStock)
    const minStock = Number(article.minStock)
    const maxStock = article.maxStock ? Number(article.maxStock) : null
    
    if (currentStock <= minStock) return "low"
    if (maxStock && currentStock >= maxStock * 0.9) return "high"
    return "normal"
  }

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case "low": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "high": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      default: return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
    }
  }

  const getMovementTypeColor = (type: MovementType) => {
    switch (type) {
      case MovementType.INPUT: return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case MovementType.OUTPUT: return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case MovementType.ADJUSTMENT: return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case MovementType.TRANSFER: return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case MovementType.RETURN: return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const handleAddArticle = async () => {
    try {
      await createArticle(newArticle)
      setNewArticle({
        code: "",
        name: "",
        description: "",
        category: ArticleCategory.EQUIPMENT,
        unit: Unit.PIECE,
        currentStock: 0,
        minStock: 0,
        maxStock: 0,
        unitPrice: 0,
        location: "",
        supplier: "",
      })
      setIsAddArticleOpen(false)
    } catch (error) {
      console.error('Failed to create article:', error)
    }
  }

  const handleEditArticle = async () => {
    if (!editingArticle) return;
    
    try {
      await updateArticle(editingArticle.id, editArticle)
      setEditArticle({
        code: "",
        name: "",
        description: "",
        category: ArticleCategory.EQUIPMENT,
        unit: Unit.PIECE,
        minStock: 0,
        maxStock: 0,
        unitPrice: 0,
        location: "",
        supplier: "",
      })
      setEditingArticle(null)
      setIsEditArticleOpen(false)
      await refreshData()
    } catch (error) {
      console.error('Failed to update article:', error)
    }
  }

  const openEditDialog = (article: Article) => {
    setEditingArticle(article)
    setEditArticle({
      code: article.code,
      name: article.name,
      description: article.description || "",
      category: article.category,
      unit: article.unit,
      minStock: article.minStock,
      maxStock: article.maxStock || 0,
      unitPrice: article.unitPrice || 0,
      location: article.location || "",
      supplier: article.supplier || "",
    })
    setIsEditArticleOpen(true)
  }

  const handleAddMovement = async () => {
    try {
      await createStockMovement(newMovement)
      setNewMovement({
        articleId: 0,
        type: MovementType.INPUT,
        reason: MovementReason.OTHER,
        quantity: 0,
        unitPrice: 0,
        referenceDocument: "",
        supplierCustomer: "",
        location: "",
        notes: "",
      })
      setIsAddMovementOpen(false)
      // Refresh all data to show updated article stock, movements, and dashboard stats
      await refreshData()
    } catch (error) {
      console.error('Failed to create stock movement:', error)
    }
  }

  const handleDeleteArticle = async (id: number) => {
    try {
      await deleteArticle(id)
      await refreshData();
    } catch (error) {
      console.error('Failed to delete article:', error)
    }
  }

  const categoryData = Object.values(ArticleCategory).map(category => ({
    name: category,
    value: (articles || []).filter(a => a.category === category).length,
    color: categoryColors[category],
  }))

  const stockTrendData = [
    { month: 'Jan', value: 85000 },
    { month: 'Feb', value: 92000 },
    { month: 'Mar', value: 78000 },
    { month: 'Apr', value: 95000 },
    { month: 'May', value: 88000 },
    { month: 'Jun', value: 102000 },
  ]

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Chargement des données de stock...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Erreur lors du chargement des données: {error}</span>
            </div>
            <Button 
              onClick={refreshData} 
              variant="outline" 
              size="sm" 
              className="mt-3"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Stocks</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérer l'inventaire, suivre les mouvements et surveiller les niveaux de stock</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Importer
          </Button>
          <Button 
            onClick={refreshData} 
            variant="outline" 
            className="gap-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button onClick={() => setIsAddArticleOpen(true)} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
            <Plus className="h-4 w-4" />
            Ajouter Article
          </Button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Articles</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalArticles}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{activeArticles} actifs</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Valeur du Stock</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">${totalStockValue.toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1">+5.2% par rapport au mois dernier</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Alertes Stock Faible</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{(lowStockArticles || []).length}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Nécessitent attention</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Mouvements Récents</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{(movements || []).length}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Ce mois</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="articles" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="movements">Mouvements</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Inventaire des Articles</CardTitle>
              <CardDescription>Gérer vos articles de stock et niveaux d'inventaire</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Rechercher articles..."
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
                    <SelectItem value="all">Toutes Catégories</SelectItem>
                    {Object.values(ArticleCategory).map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Articles Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Article</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Stock Actuel</TableHead>
                      <TableHead>Stock Min</TableHead>
                      <TableHead>Prix Unitaire</TableHead>
                      <TableHead>Emplacement</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArticles.map((article) => {
                      const stockStatus = getStockStatus(article)
                      return (
                        <TableRow key={article.id}>
                          <TableCell className="font-medium">{article.code}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{article.name}</span>
                              <span className="text-xs text-gray-500">{article.supplier}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge style={{ backgroundColor: categoryColors[article.category] + '20', color: categoryColors[article.category] }}>
                              {article.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={stockStatus === 'low' ? 'text-red-600 font-bold' : ''}>{article.currentStock}</span>
                              <span className="text-xs text-gray-500">{article.unit}</span>
                              {stockStatus === 'low' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                            </div>
                          </TableCell>
                          <TableCell>{article.minStock} {article.unit}</TableCell>
                          <TableCell>MAD {Number(article.unitPrice || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="text-xs">{article.location}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStockStatusColor(stockStatus)}>
                              {stockStatus === 'low' ? 'Stock Faible' : stockStatus === 'high' ? 'Stock Élevé' : 'Normal'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(article)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Modifier
                              </Button>
                              <DeleteArticleDialog articleId={article.id} articleName={article.name} onDelete={handleDeleteArticle} />
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

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Mouvements de Stock</CardTitle>
                  <CardDescription>Suivre tous les mouvements et transactions de stock</CardDescription>
                </div>
                <Button onClick={() => setIsAddMovementOpen(true)} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter Mouvement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Article</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Stock Avant/Après</TableHead>
                      <TableHead>Valeur</TableHead>
                      <TableHead>Effectué Par</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(movements || []).map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>{new Date(movement.movementDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="font-medium">{movement.article?.name || movement.articleName || 'N/A'}</span>
                            <span className="text-xs text-gray-500">{movement.article?.code || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getMovementTypeColor(movement.type)}>
                            {movement.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {movement.type === MovementType.INPUT ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                            <span>{Number(movement.quantity).toFixed(2)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs">
                            {Number(movement.stockBefore).toFixed(2)} → {Number(movement.stockAfter).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {movement.totalValue ? `MAD ${Number(movement.totalValue).toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell>
                          {typeof movement.performedBy === 'object' && movement.performedBy?.name 
                            ? movement.performedBy.name 
                            : typeof movement.performedBy === 'string' 
                            ? movement.performedBy 
                            : 'Système'}
                        </TableCell>
                        <TableCell>
                          <Badge className={movement.isValidated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {movement.isValidated ? 'Validé' : 'En Attente'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setViewingMovement(movement)
                              setIsViewMovementOpen(true)
                            }}
                          >
                            <Package className="h-4 w-4 mr-1" />
                            Détails
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Alertes de Stock</CardTitle>
              <CardDescription>Articles nécessitant une attention immédiate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(lowStockArticles || []).map((article) => (
                  <div key={article.id} className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/10">
                    <div className="flex items-center gap-4">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium text-red-800 dark:text-red-400">{article.name}</p>
                        <p className="text-sm text-red-600 dark:text-red-500">
                          Stock actuel: {article.currentStock} {article.unit} (Min: {article.minStock} {article.unit})
                        </p>
                      </div>
                    </div>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                      Recommander
                    </Button>
                  </div>
                ))}
                {(lowStockArticles || []).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune alerte de stock pour le moment</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Tendance Valeur Stock</CardTitle>
                <CardDescription>Progression mensuelle de la valeur du stock</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stockTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Valeur Stock"]} />
                    <Line type="monotone" dataKey="value" stroke="#1E3A8A" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Distribution par Catégorie</CardTitle>
                <CardDescription>Articles par catégorie</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Article Dialog */}
      <Dialog open={isAddArticleOpen} onOpenChange={setIsAddArticleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter Nouvel Article</DialogTitle>
            <DialogDescription>Créer un nouvel article dans votre inventaire</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code Article</Label>
              <Input
                id="code"
                value={newArticle.code}
                onChange={(e) => setNewArticle({ ...newArticle, code: e.target.value })}
                placeholder="ex., FB001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nom Article</Label>
              <Input
                id="name"
                value={newArticle.name}
                onChange={(e) => setNewArticle({ ...newArticle, name: e.target.value })}
                placeholder="ex., Ballon de Football Professionnel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={newArticle.category}
                onValueChange={(value) => setNewArticle({ ...newArticle, category: value as ArticleCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ArticleCategory).map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unité</Label>
              <Select
                value={newArticle.unit}
                onValueChange={(value) => setNewArticle({ ...newArticle, unit: value as Unit })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Unit).map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentStock">Stock Actuel</Label>
              <Input
                id="currentStock"
                type="number"
                value={newArticle.currentStock}
                onChange={(e) => setNewArticle({ ...newArticle, currentStock: parseInt(e.target.value) })}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Stock Minimum</Label>
              <Input
                id="minStock"
                type="number"
                value={newArticle.minStock}
                onChange={(e) => setNewArticle({ ...newArticle, minStock: parseInt(e.target.value) })}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxStock">Stock Maximum</Label>
              <Input
                id="maxStock"
                type="number"
                value={newArticle.maxStock}
                onChange={(e) => setNewArticle({ ...newArticle, maxStock: parseInt(e.target.value) })}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Prix Unitaire (MAD)</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                value={newArticle.unitPrice}
                onChange={(e) => setNewArticle({ ...newArticle, unitPrice: parseFloat(e.target.value) })}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Emplacement</Label>
              <Input
                id="location"
                value={newArticle.location}
                onChange={(e) => setNewArticle({ ...newArticle, location: e.target.value })}
                placeholder="ex., Salle Équipement Sport A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Fournisseur</Label>
              <Input
                id="supplier"
                value={newArticle.supplier}
                onChange={(e) => setNewArticle({ ...newArticle, supplier: e.target.value })}
                placeholder="ex., SportsTech Ltd"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newArticle.description}
                onChange={(e) => setNewArticle({ ...newArticle, description: e.target.value })}
                placeholder="Entrer la description de l'article"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddArticleOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddArticle} className="bg-blue-800 hover:bg-blue-900 text-white">
              Ajouter Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Article Dialog */}
      <Dialog open={isEditArticleOpen} onOpenChange={setIsEditArticleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier l'Article</DialogTitle>
            <DialogDescription>Modifier les détails de l'article dans votre inventaire</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-code">Code Article</Label>
              <Input
                id="edit-code"
                value={editArticle.code}
                onChange={(e) => setEditArticle({ ...editArticle, code: e.target.value })}
                placeholder="ex., FB001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom Article</Label>
              <Input
                id="edit-name"
                value={editArticle.name}
                onChange={(e) => setEditArticle({ ...editArticle, name: e.target.value })}
                placeholder="ex., Ballon de Football Professionnel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Catégorie</Label>
              <Select
                value={editArticle.category}
                onValueChange={(value) => setEditArticle({ ...editArticle, category: value as ArticleCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ArticleCategory).map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-unit">Unité</Label>
              <Select
                value={editArticle.unit}
                onValueChange={(value) => setEditArticle({ ...editArticle, unit: value as Unit })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Unit).map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-minStock">Stock Minimum</Label>
              <Input
                id="edit-minStock"
                type="number"
                value={editArticle.minStock}
                onChange={(e) => setEditArticle({ ...editArticle, minStock: parseInt(e.target.value) })}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-maxStock">Stock Maximum</Label>
              <Input
                id="edit-maxStock"
                type="number"
                value={editArticle.maxStock}
                onChange={(e) => setEditArticle({ ...editArticle, maxStock: parseInt(e.target.value) })}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-unitPrice">Prix Unitaire (MAD)</Label>
              <Input
                id="edit-unitPrice"
                type="number"
                step="0.01"
                value={editArticle.unitPrice}
                onChange={(e) => setEditArticle({ ...editArticle, unitPrice: parseFloat(e.target.value) })}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Emplacement</Label>
              <Input
                id="edit-location"
                value={editArticle.location}
                onChange={(e) => setEditArticle({ ...editArticle, location: e.target.value })}
                placeholder="ex., Salle Équipement Sport A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-supplier">Fournisseur</Label>
              <Input
                id="edit-supplier"
                value={editArticle.supplier}
                onChange={(e) => setEditArticle({ ...editArticle, supplier: e.target.value })}
                placeholder="ex., SportsTech Ltd"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editArticle.description}
                onChange={(e) => setEditArticle({ ...editArticle, description: e.target.value })}
                placeholder="Entrer la description de l'article"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditArticleOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditArticle} className="bg-blue-800 hover:bg-blue-900 text-white">
              Modifier Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Movement Dialog */}
      <Dialog open={isAddMovementOpen} onOpenChange={setIsAddMovementOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter Mouvement de Stock</DialogTitle>
            <DialogDescription>Enregistrer une nouvelle transaction de mouvement de stock</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="articleId">Article</Label>
              <Select
                value={newMovement.articleId?.toString()}
                onValueChange={(value) => setNewMovement({ ...newMovement, articleId: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner article" />
                </SelectTrigger>
                <SelectContent>
                  {(articles || []).map(article => (
                    <SelectItem key={article.id} value={article.id.toString()}>
                      {article.code} - {article.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type de Mouvement</Label>
              <Select
                value={newMovement.type}
                onValueChange={(value) => setNewMovement({ ...newMovement, type: value as MovementType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MovementType).map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité</Label>
              <Input
                id="quantity"
                type="number"
                value={newMovement.quantity}
                onChange={(e) => setNewMovement({ ...newMovement, quantity: parseInt(e.target.value) })}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Prix Unitaire (MAD)</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                value={newMovement.unitPrice}
                onChange={(e) => setNewMovement({ ...newMovement, unitPrice: parseFloat(e.target.value) })}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Raison</Label>
              <Select
                value={newMovement.reason}
                onValueChange={(value) => setNewMovement({ ...newMovement, reason: value as MovementReason })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MovementReason).map(reason => (
                    <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="referenceDocument">Document de Référence</Label>
              <Input
                id="referenceDocument"
                value={newMovement.referenceDocument}
                onChange={(e) => setNewMovement({ ...newMovement, referenceDocument: e.target.value })}
                placeholder="ex., PO-2024-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierCustomer">Fournisseur/Client</Label>
              <Input
                id="supplierCustomer"
                value={newMovement.supplierCustomer}
                onChange={(e) => setNewMovement({ ...newMovement, supplierCustomer: e.target.value })}
                placeholder="ex., SportsTech Ltd"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Emplacement</Label>
              <Input
                id="location"
                value={newMovement.location}
                onChange={(e) => setNewMovement({ ...newMovement, location: e.target.value })}
                placeholder="ex., Salle Équipement Sport A"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newMovement.notes}
                onChange={(e) => setNewMovement({ ...newMovement, notes: e.target.value })}
                placeholder="Notes supplémentaires sur ce mouvement"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMovementOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddMovement} className="bg-blue-800 hover:bg-blue-900 text-white">
              Ajouter Mouvement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Movement Details Dialog */}
      <Dialog open={isViewMovementOpen} onOpenChange={setIsViewMovementOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Détails du Mouvement de Stock</DialogTitle>
            <DialogDescription>
              Informations complètes sur le mouvement #{viewingMovement?.id}
            </DialogDescription>
          </DialogHeader>
          {viewingMovement && (
            <div className="grid grid-cols-2 gap-6">
              {/* Movement Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Informations du Mouvement</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">ID Mouvement:</span>
                    <span className="text-sm text-gray-900 dark:text-white">#{viewingMovement.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Date:</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {new Date(viewingMovement.movementDate).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Type:</span>
                    <Badge className={getMovementTypeColor(viewingMovement.type)}>
                      {viewingMovement.type}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Raison:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{viewingMovement.reason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Quantité:</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {Number(viewingMovement.quantity).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Prix Unitaire:</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {viewingMovement.unitPrice ? `MAD ${Number(viewingMovement.unitPrice).toFixed(2)}` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Valeur Totale:</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {viewingMovement.totalValue ? `MAD ${Number(viewingMovement.totalValue).toFixed(2)}` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Statut:</span>
                    <Badge className={viewingMovement.isValidated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {viewingMovement.isValidated ? 'Validé' : 'En Attente'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Article Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Informations de l'Article</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Code Article:</span>
                    <span className="text-sm font-mono text-gray-900 dark:text-white">
                      {viewingMovement.article?.code || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Nom Article:</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {viewingMovement.article?.name || viewingMovement.articleName || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Catégorie:</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {viewingMovement.article?.category || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Unité:</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {viewingMovement.article?.unit || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Stock Avant:</span>
                    <span className="text-sm text-red-600 font-medium">
                      {Number(viewingMovement.stockBefore).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Stock Après:</span>
                    <span className="text-sm text-green-600 font-medium">
                      {Number(viewingMovement.stockAfter).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Emplacement:</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {viewingMovement.location || viewingMovement.article?.location || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="col-span-2 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Détails Supplémentaires</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-500">Document de Référence:</span>
                    <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      {viewingMovement.referenceDocument || 'Aucun'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-500">Fournisseur/Client:</span>
                    <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      {viewingMovement.supplierCustomer || 'Aucun'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-500">Effectué Par:</span>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    {typeof viewingMovement.performedBy === 'object' && viewingMovement.performedBy?.name 
                      ? viewingMovement.performedBy.name 
                      : typeof viewingMovement.performedBy === 'string' 
                      ? viewingMovement.performedBy 
                      : 'Système'}
                  </p>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-500">Notes:</span>
                  <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded min-h-[60px]">
                    {viewingMovement.notes || 'Aucune note'}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewMovementOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Confirmation dialog component for deleting an article
function DeleteArticleDialog({ articleId, articleName, onDelete }: { articleId: number; articleName: string; onDelete: (id: number) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4 mr-1" /> Supprimer
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'article <span className="font-bold">{articleName}</span> ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await onDelete(articleId);
                setOpen(false);
              }}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
