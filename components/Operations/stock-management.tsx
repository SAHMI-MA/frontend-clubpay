"use client"

/**
 * Export a list of articles to CSV
 * @param articles Array of Article objects
 */
export function exportArticlesToCSV(articles: Article[]) {
  const header = ['ID', 'Code', 'Name', 'Category', 'Unit', 'Current Stock', 'Min Stock', 'Max Stock', 'Unit Price (MAD)', 'Location'];
  const rows = articles.map(article => [
    article.id,
    article.code || '',
    article.name || '',
    article.category || '',
    article.unit || '',
    article.currentStock || 0,
    article.minStock || 0,
    article.maxStock || '',
    article.unitPrice || '',
    article.location || ''
  ]);
  const csvContent = [header, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'articles.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export a list of stock movements to CSV
 * @param movements Array of StockMovement objects
 */
export function exportStockMovementsToCSV(movements: any[]) {
  const header = ['ID', 'Article', 'Type', 'Reason', 'Quantity', 'Date', 'Reference', 'Notes'];
  const rows = movements.map(movement => [
    movement.id || '',
    movement.article?.name || movement.articleName || '',
    movement.type || '',
    movement.reason || '',
    movement.quantity || 0,
    movement.date || movement.movementDate || '',
    movement.reference || '',
    movement.notes || ''
  ]);
  const csvContent = [header, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'stock-movements.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

import React, { useState, useEffect } from "react"
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
import { Package, Plus, Search, Edit, Trash2, AlertTriangle, TrendingUp, TrendingDown, RefreshCw, MapPin, DollarSign, Activity, Upload, Loader2, X, ImageIcon, Eye } from 'lucide-react'
import { useStockManagement } from "@/hooks/use-stock-management"
import { imageService } from "@/lib/team-management-services"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { fetchAllSuppliers } from "@/lib/redux/supplierSlice"
import { getApiUrl } from "@/lib/api-config"
import { 
  Article, 
  ArticleCategory, 
  Unit, 
  MovementType,
  MovementReason,
  CreateArticleDto,
  UpdateArticleDto,
  CreateStockMovementDto,
  stockApi
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

  // Redux for suppliers
  const dispatch = useAppDispatch()
  const { suppliers: suppliersList } = useAppSelector((state) => state.suppliers)

  // Local state for UI
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedLocation] = useState("all")
  const [selectedStockStatus, setSelectedStockStatus] = useState("all")
  const [selectedSupplier, setSelectedSupplier] = useState("all")
  const [selectedUnit, setSelectedUnit] = useState("all")
  const [isAddArticleOpen, setIsAddArticleOpen] = useState(false)
  const [isBatchAddOpen, setIsBatchAddOpen] = useState(false)
  const [batchArticles, setBatchArticles] = useState<CreateArticleDto[]>([])
  const [batchErrors, setBatchErrors] = useState<{ index: number; error: string }[]>([])
  const [isEditArticleOpen, setIsEditArticleOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [isViewArticleOpen, setIsViewArticleOpen] = useState(false)
  const [viewingArticle, setViewingArticle] = useState<Article | null>(null)
  const [isAddMovementOpen, setIsAddMovementOpen] = useState(false)
  const [isViewMovementOpen, setIsViewMovementOpen] = useState(false)
  const [viewingMovement, setViewingMovement] = useState<any>(null)

  // Image handling states
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false)
  const [batchImageFiles, setBatchImageFiles] = useState<{[key: number]: File}>({})
  const [batchImagePreviews, setBatchImagePreviews] = useState<{[key: number]: string}>({})

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
    supplierId: undefined,
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
    supplierId: undefined,
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
      (article.supplier?.name && article.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory
    const matchesLocation = selectedLocation === "all" || article.location === selectedLocation
    
    // Stock status filter
    let matchesStockStatus = true
    if (selectedStockStatus === "low") {
      matchesStockStatus = Number(article.currentStock) <= Number(article.minStock)
    } else if (selectedStockStatus === "normal") {
      matchesStockStatus = Number(article.currentStock) > Number(article.minStock) && 
        (!article.maxStock || Number(article.currentStock) <= Number(article.maxStock))
    } else if (selectedStockStatus === "high") {
      matchesStockStatus = article.maxStock ? Number(article.currentStock) > Number(article.maxStock) : false
    } else if (selectedStockStatus === "out") {
      matchesStockStatus = Number(article.currentStock) === 0
    }
    
    // Supplier filter
    const matchesSupplier = selectedSupplier === "all" || 
      (selectedSupplier === "none" && !article.supplier) ||
      (article.supplier?.id.toString() === selectedSupplier)
    
    // Unit filter
    const matchesUnit = selectedUnit === "all" || article.unit === selectedUnit
    
    return matchesSearch && matchesCategory && matchesLocation && matchesStockStatus && matchesSupplier && matchesUnit
  })

  // Load suppliers on mount using Redux
  useEffect(() => {
    dispatch(fetchAllSuppliers())
  }, [dispatch])

  // Initialize batch articles when dialog opens
  useEffect(() => {
    if (isBatchAddOpen && batchArticles.length === 0) {
      initializeBatchArticles()
    }
  }, [isBatchAddOpen])

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
      let imageId: number | undefined = undefined
      
      // Upload image first if there's one
      if (imageFile) {
        imageId = await uploadImage(imageFile)
        if (!imageId) {
          throw new Error('Image upload failed')
        }
      }

      const articleData = {
        ...newArticle,
        imageId,
      }

      await createArticle(articleData)
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
        supplierId: undefined,
      })
      // Reset image states
      setImageFile(null)
      setImagePreview(null)
      setIsAddArticleOpen(false)
    } catch (error) {
      console.error('Failed to create article:', error)
    }
  }

  const handleEditArticle = async () => {
    if (!editingArticle) return;
    
    try {
      let imageId: number | null | undefined = undefined
      
      // Upload image if there's a new one
      if (editImageFile) {
        const uploadedImageId = await uploadEditImage(editImageFile)
        if (!uploadedImageId) {
          throw new Error('Image upload failed')
        }
        imageId = uploadedImageId
      } else if (editImagePreview === null && editingArticle.image) {
        // User explicitly removed the image
        imageId = null
      }

      const articleData = {
        ...editArticle,
        ...(imageId !== undefined && { imageId }),
      }

      await updateArticle(editingArticle.id, articleData)
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
        supplierId: undefined,
      })
      // Reset image states
      setEditImageFile(null)
      setEditImagePreview(null)
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
      supplierId: article.supplier?.id,
    })
    // Set existing image preview
    if (article.image) {
      setEditImagePreview(getApiUrl(article.image.url))
    } else {
      setEditImagePreview(null)
    }
    setEditImageFile(null)
    setIsEditArticleOpen(true)
  }

  // Batch article functions
  const initializeBatchArticles = () => {
    setBatchArticles([
      {
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
        supplierId: undefined,
      },
      {
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
        supplierId: undefined,
      },
    ])
    setBatchErrors([])
  }

  const addBatchRow = () => {
    setBatchArticles([
      ...batchArticles,
      {
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
        supplierId: undefined,
      },
    ])
  }

  const removeBatchRow = (index: number) => {
    setBatchArticles(batchArticles.filter((_, i) => i !== index))
    setBatchErrors(batchErrors.filter((e) => e.index !== index))
    // Remove image data for this index
    const newImageFiles = {...batchImageFiles}
    const newImagePreviews = {...batchImagePreviews}
    delete newImageFiles[index]
    delete newImagePreviews[index]
    setBatchImageFiles(newImageFiles)
    setBatchImagePreviews(newImagePreviews)
  }

  const updateBatchArticle = (index: number, field: keyof CreateArticleDto, value: any) => {
    const updated = [...batchArticles]
    updated[index] = { ...updated[index], [field]: value }
    setBatchArticles(updated)
  }

  const handleBatchImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBatchImageFiles({...batchImageFiles, [index]: file})
      const reader = new FileReader()
      reader.onloadend = () => {
        setBatchImagePreviews({...batchImagePreviews, [index]: reader.result as string})
      }
      reader.readAsDataURL(file)
    }
  }

  const removeBatchImage = (index: number) => {
    const newImageFiles = {...batchImageFiles}
    const newImagePreviews = {...batchImagePreviews}
    delete newImageFiles[index]
    delete newImagePreviews[index]
    setBatchImageFiles(newImageFiles)
    setBatchImagePreviews(newImagePreviews)
  }

  const handleBatchSubmit = async () => {
    try {
      setBatchErrors([])
      
      // First upload all images and get their IDs
      const articlesWithImages = [...batchArticles]
      for (let i = 0; i < articlesWithImages.length; i++) {
        if (batchImageFiles[i]) {
          try {
            const uploadedImage = await imageService.uploadImage(batchImageFiles[i])
            articlesWithImages[i] = { ...articlesWithImages[i], imageId: uploadedImage.id }
          } catch (error) {
            console.error(`Error uploading image for article ${i}:`, error)
          }
        }
      }
      
      const result = await stockApi.createArticlesBatch(articlesWithImages)
      
      if (result.errors.length > 0) {
        setBatchErrors(result.errors)
      }
      
      if (result.success.length > 0) {
        await refreshData()
        if (result.errors.length === 0) {
          setIsBatchAddOpen(false)
          setBatchArticles([])
          setBatchImageFiles({})
          setBatchImagePreviews({})
        }
      }
    } catch (error: any) {
      console.error("Error creating batch articles:", error)
    }
  }

  // Image handling functions
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('Please select a valid image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      console.error('Image must not exceed 5MB')
      return
    }

    setImageFile(file)
    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleEditImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('Please select a valid image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      console.error('Image must not exceed 5MB')
      return
    }

    setEditImageFile(file)
    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      setEditImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    const fileInput = document.getElementById('image-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const removeEditImage = () => {
    setEditImageFile(null)
    setEditImagePreview(null)
    const fileInput = document.getElementById('edit-image-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const uploadImage = async (file: File): Promise<number | undefined> => {
    try {
      setIsUploadingImage(true)
      const response = await imageService.uploadImage(file)
      return response.id
    } catch (error) {
      console.error('Image upload error:', error)
      return undefined
    } finally {
      setIsUploadingImage(false)
    }
  }

  const uploadEditImage = async (file: File): Promise<number | undefined> => {
    try {
      setIsUploadingEditImage(true)
      const response = await imageService.uploadImage(file)
      return response.id
    } catch (error) {
      console.error('Image upload error:', error)
      return undefined
    } finally {
      setIsUploadingEditImage(false)
    }
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

  const categoryData = Object.values(ArticleCategory)
    .map(category => ({
      name: category,
      value: (articles || []).filter(a => a.category === category).length,
      color: categoryColors[category],
    }))
    .filter(item => item.value > 0) // Only show categories with articles

  // Generate real stock trend data from movements
  const stockTrendData = React.useMemo(() => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
      
      // Calculate stock value for that month based on movements
      const monthMovements = (movements || []).filter(movement => {
        const movementDate = new Date(movement.movementDate);
        return movementDate.getMonth() === date.getMonth() && 
               movementDate.getFullYear() === date.getFullYear();
      });
      
      // Calculate total value from movements for that month
      const monthValue = monthMovements.reduce((total, movement) => {
        return total + (Number(movement.totalValue) || 0);
      }, 0);
      
      // If no movements, use current stock value divided by 12 as baseline
      const baselineValue = monthValue || (totalStockValue / 12);
      
      months.push({
        month: monthName,
        value: Math.round(baselineValue)
      });
    }
    
    return months;
  }, [movements, totalStockValue])

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

      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          className="bg-blue-800 hover:bg-blue-900 text-white mb-2"
          onClick={() => exportArticlesToCSV(articles)}
        >
          Exporter les articles (CSV)
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Stocks</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérer l'inventaire, suivre les mouvements et surveiller les niveaux de stock</p>
        </div>
        <div className="flex gap-2">
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
          <Button onClick={() => setIsBatchAddOpen(true)} variant="outline" className="gap-2">
            <Package className="h-4 w-4" />
            Ajout Multiple
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
            <div className="text-2xl font-bold text-gray-900 dark:text-white">MAD {totalStockValue.toLocaleString()}</div>
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
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Unité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes Unités</SelectItem>
                    {Object.values(Unit).map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStockStatus} onValueChange={setSelectedStockStatus}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Statut Stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous Statuts</SelectItem>
                    <SelectItem value="low">Stock Faible</SelectItem>
                    <SelectItem value="normal">Stock Normal</SelectItem>
                    <SelectItem value="high">Stock Élevé</SelectItem>
                    <SelectItem value="out">Rupture</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous Fournisseurs</SelectItem>
                    <SelectItem value="none">Sans fournisseur</SelectItem>
                    {suppliersList.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Articles Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Image</TableHead>
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
                    {filteredArticles.map((article, index) => {
                      const stockStatus = getStockStatus(article)
                      return (
                        <TableRow key={article.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="font-medium">{article.code}</TableCell>
                          <TableCell>
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                              {article.image ? (
                                <img
                                  src={getApiUrl(article.image.url)}
                                  alt={article.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{article.name}</span>
                              <span className="text-xs text-gray-500">{article.supplier?.name || '-'}</span>
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
                                onClick={() => {
                                  setViewingArticle(article)
                                  setIsViewArticleOpen(true)
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Voir
                              </Button>
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
                      <TableHead>#</TableHead>
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
                    {(movements || []).map((movement, index) => (
                      <TableRow key={movement.id}>
                        <TableCell>{index + 1}</TableCell>
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
                    <Tooltip formatter={(value) => [`MAD ${Number(value).toLocaleString()}`, "Valeur Stock"]} />
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
                      label={({ name, percent }) => percent && percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
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
              <Select
                value={newArticle.supplierId?.toString() || "none"}
                onValueChange={(value) => setNewArticle({ ...newArticle, supplierId: value === "none" ? undefined : parseInt(value) })}
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder={suppliersList.length === 0 ? "Aucun fournisseur disponible" : "Sélectionner un fournisseur"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun fournisseur</SelectItem>
                  {suppliersList.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-gray-500">Aucun fournisseur disponible</div>
                  ) : (
                    suppliersList.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>Image de l'Article</Label>
              <div className="flex items-center gap-4">
                {/* Image preview */}
                <div className="flex-shrink-0">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-16 w-16 rounded-lg object-cover border-2 border-gray-200"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 text-red-600 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                      <Upload className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
                {/* Upload button */}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                    disabled={isUploadingImage}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={isUploadingImage}
                    className="w-full"
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Téléchargement...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {imagePreview ? 'Changer l\'image' : 'Ajouter une image'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
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
              <Select
                value={editArticle.supplierId?.toString() || "none"}
                onValueChange={(value) => setEditArticle({ ...editArticle, supplierId: value === "none" ? undefined : parseInt(value) })}
              >
                <SelectTrigger id="edit-supplier">
                  <SelectValue placeholder={suppliersList.length === 0 ? "Aucun fournisseur disponible" : "Sélectionner un fournisseur"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun fournisseur</SelectItem>
                  {suppliersList.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-gray-500">Aucun fournisseur disponible</div>
                  ) : (
                    suppliersList.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>Image de l'Article</Label>
              <div className="flex items-center gap-4">
                {/* Image preview */}
                <div className="flex-shrink-0">
                  {editImagePreview ? (
                    <div className="relative">
                      <img
                        src={editImagePreview}
                        alt="Preview"
                        className="h-16 w-16 rounded-lg object-cover border-2 border-gray-200"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeEditImage}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 text-red-600 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                      <Upload className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
                {/* Upload button */}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageChange}
                    className="hidden"
                    id="edit-image-upload"
                    disabled={isUploadingEditImage}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('edit-image-upload')?.click()}
                    disabled={isUploadingEditImage}
                    className="w-full"
                  >
                    {isUploadingEditImage ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Téléchargement...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {editImagePreview ? 'Changer l\'image' : 'Ajouter une image'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
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

      {/* View Article Dialog */}
      <Dialog open={isViewArticleOpen} onOpenChange={setIsViewArticleOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de l'article</DialogTitle>
            <DialogDescription>
              Informations complètes sur l'article
            </DialogDescription>
          </DialogHeader>
          {viewingArticle && (
            <div className="space-y-6">
              {/* Image and Basic Info Row */}
              <div className="grid grid-cols-3 gap-6">
                {/* Image Section */}
                {viewingArticle.image && (
                  <div className="col-span-1">
                    <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img
                        src={getApiUrl(viewingArticle.image.url)}
                        alt={viewingArticle.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Basic Information */}
                <div className={`space-y-4 ${viewingArticle.image ? 'col-span-2' : 'col-span-3'}`}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500">Code</Label>
                      <p className="font-medium">{viewingArticle.code}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Nom</Label>
                      <p className="font-medium">{viewingArticle.name}</p>
                    </div>
                  </div>

                  {viewingArticle.description && (
                    <div>
                      <Label className="text-gray-500">Description</Label>
                      <p className="font-medium">{viewingArticle.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500">Catégorie</Label>
                      <Badge style={{ backgroundColor: categoryColors[viewingArticle.category] + '20', color: categoryColors[viewingArticle.category] }}>
                        {viewingArticle.category}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-gray-500">Unité</Label>
                      <p className="font-medium">{viewingArticle.unit}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock Information */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Informations de stock</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label className="text-gray-500">Stock actuel</Label>
                    <p className="font-medium text-lg">{viewingArticle.currentStock} {viewingArticle.unit}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Stock minimum</Label>
                    <p className="font-medium">{viewingArticle.minStock} {viewingArticle.unit}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Stock maximum</Label>
                    <p className="font-medium">{viewingArticle.maxStock || 'N/A'} {viewingArticle.maxStock ? viewingArticle.unit : ''}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Statut</Label>
                    <Badge className={getStockStatusColor(getStockStatus(viewingArticle))}>
                      {getStockStatus(viewingArticle) === 'low' ? 'Stock faible' : getStockStatus(viewingArticle) === 'high' ? 'Stock élevé' : 'Normal'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Pricing & Location */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Prix et emplacement</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-500">Prix unitaire</Label>
                    <p className="font-medium">{viewingArticle.unitPrice ? `${viewingArticle.unitPrice.toFixed(2)} MAD` : 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Valeur totale</Label>
                    <p className="font-medium">
                      {viewingArticle.unitPrice 
                        ? `${(viewingArticle.currentStock * viewingArticle.unitPrice).toFixed(2)} MAD`
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Emplacement</Label>
                    <p className="font-medium">{viewingArticle.location || 'Non spécifié'}</p>
                  </div>
                </div>
              </div>

              {/* Supplier Information */}
              {viewingArticle.supplier && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Fournisseur</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-gray-500">Nom</Label>
                      <p className="font-medium">{viewingArticle.supplier.name}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Téléphone</Label>
                      <p className="font-medium">{viewingArticle.supplier.phone}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Email</Label>
                      <p className="font-medium">{viewingArticle.supplier.email}</p>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-gray-500">Adresse</Label>
                      <p className="font-medium">{viewingArticle.supplier.address}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* QR Code */}
              {viewingArticle.qrCode && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Code QR</h4>
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-4 rounded-lg border inline-block">
                      <img 
                        src={viewingArticle.qrCode} 
                        alt={`QR Code for ${viewingArticle.name}`}
                        className="w-32 h-32"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">
                        Scannez ce code QR pour accéder rapidement aux informations de l'article
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = viewingArticle.qrCode!;
                          link.download = `qrcode-${viewingArticle.code}.png`;
                          link.click();
                        }}
                      >
                        Télécharger QR Code
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Status and Timestamps */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-500">Actif</Label>
                    <Badge className={viewingArticle.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {viewingArticle.isActive ? 'Oui' : 'Non'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-gray-500">Créé le</Label>
                    <p className="text-sm">{new Date(viewingArticle.createdAt).toLocaleDateString('fr-FR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Modifié le</Label>
                    <p className="text-sm">{new Date(viewingArticle.updatedAt).toLocaleDateString('fr-FR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewArticleOpen(false)}>
              Fermer
            </Button>
            {viewingArticle && (
              <Button 
                onClick={() => {
                  setIsViewArticleOpen(false)
                  openEditDialog(viewingArticle)
                }}
                className="bg-blue-800 hover:bg-blue-900"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Add Articles Dialog */}
      <Dialog open={isBatchAddOpen} onOpenChange={setIsBatchAddOpen}>
        <DialogContent className="sm:max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter Plusieurs Articles</DialogTitle>
            <DialogDescription>
              Créez plusieurs articles en une seule fois
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {batchArticles.map((article, index) => {
              const hasError = batchErrors.some(e => e.index === index)
              const errorMsg = batchErrors.find(e => e.index === index)?.error
              
              return (
                <Card key={index} className={hasError ? 'border-red-500' : ''}>
                  <CardHeader className="flex flex-row items-center justify-between py-3">
                    <CardTitle className="text-sm">Article {index + 1}</CardTitle>
                    {batchArticles.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBatchRow(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {hasError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                        {errorMsg}
                      </div>
                    )}
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label>Code *</Label>
                        <Input
                          value={article.code}
                          onChange={(e) => updateBatchArticle(index, 'code', e.target.value)}
                          placeholder="ART001"
                        />
                      </div>
                      <div>
                        <Label>Nom *</Label>
                        <Input
                          value={article.name}
                          onChange={(e) => updateBatchArticle(index, 'name', e.target.value)}
                          placeholder="Nom de l'article"
                        />
                      </div>
                      <div>
                        <Label>Catégorie</Label>
                        <Select
                          value={article.category}
                          onValueChange={(value) => updateBatchArticle(index, 'category', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(ArticleCategory).map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Unité</Label>
                        <Select
                          value={article.unit}
                          onValueChange={(value) => updateBatchArticle(index, 'unit', value)}
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
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label>Stock Initial</Label>
                        <Input
                          type="number"
                          value={article.currentStock}
                          onChange={(e) => updateBatchArticle(index, 'currentStock', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Stock Min</Label>
                        <Input
                          type="number"
                          value={article.minStock}
                          onChange={(e) => updateBatchArticle(index, 'minStock', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Stock Max</Label>
                        <Input
                          type="number"
                          value={article.maxStock}
                          onChange={(e) => updateBatchArticle(index, 'maxStock', Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Prix Unitaire</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={article.unitPrice}
                          onChange={(e) => updateBatchArticle(index, 'unitPrice', Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Emplacement</Label>
                        <Input
                          value={article.location}
                          onChange={(e) => updateBatchArticle(index, 'location', e.target.value)}
                          placeholder="Zone A"
                        />
                      </div>
                      <div>
                        <Label>Fournisseur</Label>
                        <Select
                          value={article.supplierId?.toString() || "none"}
                          onValueChange={(value) => updateBatchArticle(index, 'supplierId', value === "none" ? undefined : Number(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucun fournisseur</SelectItem>
                            {suppliersList.map(supplier => (
                              <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Image</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleBatchImageChange(index, e)}
                          className="flex-1"
                        />
                        {batchImagePreviews[index] && (
                          <div className="relative">
                            <img
                              src={batchImagePreviews[index]}
                              alt="Preview"
                              className="w-16 h-16 object-cover rounded border"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
                              onClick={() => removeBatchImage(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            <Button
              variant="outline"
              onClick={addBatchRow}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une ligne
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsBatchAddOpen(false)
                setBatchArticles([])
                setBatchErrors([])
                setBatchImageFiles({})
                setBatchImagePreviews({})
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleBatchSubmit}
              className="bg-blue-800 hover:bg-blue-900"
              disabled={batchArticles.some(a => !a.code || !a.name)}
            >
              Créer Tous les Articles
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
