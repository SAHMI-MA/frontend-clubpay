"use client"

import React, { useState } from "react"
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
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Plus, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RotateCcw, 
  FileText, 
  Download, 
  Users, 
  User, 
  UserCheck, 
  Building2, 
  RefreshCw, 
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  Trash2,
  Package
} from 'lucide-react'
import { useAllocationManagement, useInternalPurchaseOrders } from "@/hooks/use-stock-management"
import { useStockManagement } from "@/hooks/use-stock-management"
import { 
  Allocation, 
  CreateAllocationDto,
  Article
} from "@/lib/api/stock-api"

// Types for the allocation form
interface AllocationFormItem {
  articleId: number;
  quantity: number;
  article?: Article;
}

interface AllocationFormState {
  type: 'team' | 'player' | 'staff' | 'employee';
  duration: 'temporary' | 'permanent';
  entityId: number;
  entityName?: string;
  items: AllocationFormItem[];
  remarks: string;
  expectedReturnDate?: string;
}

export function AllocationManagement() {
  // Use our custom hooks for data management
  const {
    allocations,
    entities,
    loading,
    error,
    createAllocation,
    approveAllocation,
    rejectAllocation,
    returnAllocation,
    refreshData
  } = useAllocationManagement()

  const { articles, refreshData: refreshArticles } = useStockManagement()
  const { downloadDocument } = useInternalPurchaseOrders()

  // Local state for UI
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [viewingAllocation, setViewingAllocation] = useState<Allocation | null>(null)
  const [currentStep, setCurrentStep] = useState(1)

  const [newAllocation, setNewAllocation] = useState<AllocationFormState>({
    type: 'team',
    duration: 'temporary',
    entityId: 0,
    items: [],
    remarks: "",
    expectedReturnDate: "",
  })

  // Filter allocations (with defensive programming)
  const filteredAllocations = (allocations || []).filter((allocation) => {
    const matchesSearch = 
      allocation.allocationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.items?.some(item => 
        // Search by article ID for now since we don't have article details populated
        item.articleId.toString().includes(searchTerm)
      )
    const matchesStatus = selectedStatus === "all" || allocation.status === selectedStatus
    const matchesType = selectedType === "all" || allocation.allocationType === selectedType
    return matchesSearch && matchesStatus && matchesType
  })

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
      case "En Attente":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "Approved":
      case "Approuvé":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "In Use":
      case "En Utilisation":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "Returned":
      case "Retourné":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
      case "Rejected":
      case "Rejeté":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "Cancelled":
      case "Annulé":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Club": return Building2
      case "Player":
      case "Joueur": return User
      case "Staff":
      case "Personnel": return UserCheck
      case "Employee":
      case "Employé": return Users
      default: return Users
    }
  }

  // Handle approve allocation
  const handleApproveAllocation = async (id: number) => {
    try {
      await approveAllocation(id)
    } catch (error) {
      console.error('Failed to approve allocation:', error)
    }
  }

  // Handle reject allocation
  const handleRejectAllocation = async (id: number) => {
    try {
      await rejectAllocation(id, "Rejeté par l'utilisateur")
    } catch (error) {
      console.error('Failed to reject allocation:', error)
    }
  }

  // Handle return allocation
  const handleReturnAllocation = async (id: number) => {
    try {
      await returnAllocation(id, "Retourné par l'utilisateur")
    } catch (error) {
      console.error('Failed to return allocation:', error)
    }
  }

  // Handle create allocation
  const handleCreateAllocation = async () => {
    try {
      // Validate form data
      if (newAllocation.items.length === 0) {
        alert('Aucun article sélectionné pour l\'allocation')
        return
      }
      
      if (!newAllocation.entityId) {
        alert('Aucune entité sélectionnée pour l\'allocation')
        return
      }
      
      if (newAllocation.duration === 'temporary' && !newAllocation.expectedReturnDate) {
        alert('La date de retour prévue est requise pour les allocations temporaires')
        return
      }

      // Validate that all selected articles still exist and have sufficient stock
      const invalidItems = newAllocation.items.filter(item => {
        const article = articles?.find(a => a.id === item.articleId)
        if (!article) {
          console.error(`Article with ID ${item.articleId} not found`)
          return true
        }
        if (article.currentStock < item.quantity) {
          console.error(`Article ${article.name} has insufficient stock. Required: ${item.quantity}, Available: ${article.currentStock}`)
          return true
        }
        return false
      })

      if (invalidItems.length > 0) {
        const missingArticles = invalidItems.filter(item => !articles?.find(a => a.id === item.articleId))
        const insufficientStock = invalidItems.filter(item => {
          const article = articles?.find(a => a.id === item.articleId)
          return article && article.currentStock < item.quantity
        })

        let errorMessage = 'Échec de la validation :\n'
        if (missingArticles.length > 0) {
          errorMessage += `- Articles non trouvés : ${missingArticles.map(item => `ID ${item.articleId}`).join(', ')}\n`
        }
        if (insufficientStock.length > 0) {
          errorMessage += `- Stock insuffisant pour : ${insufficientStock.map(item => {
            const article = articles?.find(a => a.id === item.articleId)
            return `${article?.name} (besoin ${item.quantity}, disponible ${article?.currentStock})`
          }).join(', ')}`
        }
        
        alert(errorMessage)
        return
      }

      // Transform the form state to CreateAllocationDto
      const createDto: CreateAllocationDto = {
        allocationType: newAllocation.type === 'team' ? 'Club' :
                       newAllocation.type === 'player' ? 'Joueur' :
                       newAllocation.type === 'staff' ? 'Personnel' : 'Employé',
        allocationDuration: newAllocation.duration === 'temporary' ? 'Temporaire' : 'Permanent',
        items: newAllocation.items.map(item => ({
          articleId: item.articleId,
          quantity: item.quantity
        })),
        teamId: newAllocation.type === 'team' ? newAllocation.entityId : undefined,
        playerId: newAllocation.type === 'player' ? newAllocation.entityId : undefined,
        staffId: newAllocation.type === 'staff' ? newAllocation.entityId : undefined,
        employeeId: newAllocation.type === 'employee' ? newAllocation.entityId.toString() : undefined,
        notes: newAllocation.remarks || undefined,
        expectedReturnDate: newAllocation.expectedReturnDate ? new Date(newAllocation.expectedReturnDate).toISOString() : undefined,
        allocatedById: 1 // This should come from auth context
      }

      console.log('Creating allocation with data:', createDto)
      console.log('Available articles in dropdown:', articles?.map(a => ({
        id: a.id, 
        name: a.name, 
        code: a.code,
        currentStock: a.currentStock
      })))
      console.log('Selected items to allocate:', newAllocation.items.map(item => {
        const article = articles?.find(a => a.id === item.articleId)
        return {
          articleId: item.articleId,
          quantity: item.quantity,
          articleName: article?.name,
          articleExists: !!article,
          availableStock: article?.currentStock
        }
      }))

      await createAllocation(createDto)
      resetForm()
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Failed to create allocation:', error)
      // Show user-friendly error message
      alert(`Échec de la création de l'allocation : ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  // Helper function to reset form
  const resetForm = () => {
    setNewAllocation({
      type: 'team',
      duration: 'temporary',
      entityId: 0,
      items: [],
      remarks: "",
      expectedReturnDate: "",
    })
    setCurrentStep(1)
    setSelectedArticleId(0)
    setSelectedQuantity(1)
  }

  // Reset dialog state when closed
  const handleDialogClose = (open: boolean) => {
    setIsCreateDialogOpen(open)
    if (!open) {
      resetForm()
    }
  }

  // Multi-step dialog navigation
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  // Additional state for multi-article management
  const [selectedArticleId, setSelectedArticleId] = useState<number>(0)
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1)

  // Helper function to check if article is already added
  const isArticleAdded = (articleId: number) => {
    return newAllocation.items.some(item => item.articleId === articleId)
  }

  // Helper function to add article to allocation
  const addArticleToAllocation = () => {
    if (selectedArticleId && selectedQuantity > 0 && !isArticleAdded(selectedArticleId)) {
      const article = articles?.find(a => a.id === selectedArticleId)
      if (article) {
        setNewAllocation(prev => ({
          ...prev,
          items: [...prev.items, {
            articleId: selectedArticleId,
            quantity: selectedQuantity,
            article
          }]
        }))
        setSelectedArticleId(0)
        setSelectedQuantity(1)
      }
    }
  }

  // Helper function to remove article from allocation
  const removeArticleFromAllocation = (articleId: number) => {
    setNewAllocation(prev => ({
      ...prev,
      items: prev.items.filter(item => item.articleId !== articleId)
    }))
  }

  // Helper function to update article quantity
  const updateArticleQuantity = (articleId: number, quantity: number) => {
    setNewAllocation(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.articleId === articleId ? { ...item, quantity } : item
      )
    }))
  }

  // Helper data using real API data
  const entitiesByType = (entities || []).filter(entity => {
    // Map the form type values to the actual entity types
    const typeMapping = {
      "team": "Club",
      "player": "Joueur", 
      "staff": "Personnel",
      "employee": "Employé"
    };
    
    const expectedType = typeMapping[newAllocation.type];
    console.log(`🔍 Entity filtering for type "${newAllocation.type}":`, {
      expectedType,
      totalEntities: entities?.length || 0,
      entityTypes: entities?.map(e => e.type) || [],
      filteredEntities: entities?.filter(e => e.type === expectedType).length || 0
    });
    
    return entity.type === expectedType;
  })

  // Handle download document
  const handleDownloadDocument = async (allocationId: number) => {
    try {
      await downloadDocument(allocationId)
    } catch (error) {
      console.error('Failed to download document:', error)
    }
  }

  // Statistics (with defensive programming)
  const totalAllocations = (allocations || []).length
  const pendingAllocations = (allocations || []).filter(a => a.status === "Pending").length
  const activeAllocations = (allocations || []).filter(a => a.status === "In Use").length
  const returnedAllocations = (allocations || []).filter(a => a.status === "Returned").length

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Chargement des données d'allocation...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Erreur lors du chargement des données : {error}</span>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des Allocations</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérer les allocations d'équipements pour les clubs, joueurs, personnel et employés</p>
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
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-800 hover:bg-blue-900 text-white gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle Allocation
          </Button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Allocations</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalAllocations}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingAllocations}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Actives</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeAllocations}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-gray-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Retournées</CardTitle>
            <RotateCcw className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{returnedAllocations}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="allocations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="allocations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Allocations d'Équipements</CardTitle>
              <CardDescription>Voir et gérer toutes les allocations d'équipements</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher des allocations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les Statuts</SelectItem>
                    <SelectItem value="Pending">En Attente</SelectItem>
                    <SelectItem value="Approved">Approuvé</SelectItem>
                    <SelectItem value="In Use">En Utilisation</SelectItem>
                    <SelectItem value="Returned">Retourné</SelectItem>
                    <SelectItem value="Rejected">Rejeté</SelectItem>
                    <SelectItem value="Cancelled">Annulé</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filtrer par type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les Types</SelectItem>
                    <SelectItem value="Club">Club</SelectItem>
                    <SelectItem value="Player">Joueur</SelectItem>
                    <SelectItem value="Staff">Personnel</SelectItem>
                    <SelectItem value="Employee">Employé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Allocations Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Allocation #</TableHead>
                    <TableHead>Article</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Entité</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAllocations.map((allocation) => (
                    <TableRow key={allocation.id}>
                      <TableCell className="font-medium">{allocation.allocationNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {allocation.items && allocation.items.length === 1 
                              ? `Article ID: ${allocation.items[0].articleId}`
                              : `${allocation.items?.length || 0} articles`
                            }
                          </div>
                          <div className="text-sm text-gray-500">
                            {allocation.items && allocation.items.length === 1 
                              ? `Qté: ${allocation.items[0].quantity}`
                              : 'Allocation multiple'
                            }
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {React.createElement(getTypeIcon(allocation.allocationType), { className: "h-4 w-4 text-gray-400" })}
                          {allocation.allocationType}
                        </div>
                      </TableCell>
                      <TableCell>{allocation.entityName || 'N/A'}</TableCell>
                      <TableCell>
                        {allocation.items?.reduce((total, item) => total + item.quantity, 0) || 0}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(allocation.status)}>
                          {allocation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{allocation.allocationDate}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingAllocation(allocation)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {allocation.status === "Pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApproveAllocation(allocation.id)}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRejectAllocation(allocation.id)}
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          {allocation.status === "In Use" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReturnAllocation(allocation.id)}
                            >
                              <RotateCcw className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                          {allocation.internalPurchaseOrderPath && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadDocument(allocation.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Allocation Distribution by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Type</CardTitle>
                <CardDescription>Distribution des allocations par type d'entité</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Club', 'Joueur', 'Personnel', 'Employé'].map(type => {
                    const count = (allocations || []).filter(a => a.allocationType === type).length;
                    const percentage = totalAllocations > 0 ? Math.round((count / totalAllocations) * 100) : 0;
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {React.createElement(getTypeIcon(type), { className: "h-4 w-4 text-gray-500" })}
                          <span className="text-sm font-medium">{type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500 w-12">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Statut</CardTitle>
                <CardDescription>Distribution des allocations par statut</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { status: 'En Attente', color: 'bg-yellow-500' },
                    { status: 'Approuvé', color: 'bg-green-500' },
                    { status: 'En Utilisation', color: 'bg-blue-500' },
                    { status: 'Retourné', color: 'bg-gray-500' },
                    { status: 'Rejeté', color: 'bg-red-500' }
                  ].map(({ status, color }) => {
                    const count = (allocations || []).filter(a => a.status === status).length;
                    const percentage = totalAllocations > 0 ? Math.round((count / totalAllocations) * 100) : 0;
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${color}`}></div>
                          <span className="text-sm font-medium">{status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${color}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500 w-12">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Activité Récente</CardTitle>
                <CardDescription>Dernières allocations créées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(allocations || [])
                    .sort((a, b) => new Date(b.allocationDate).getTime() - new Date(a.allocationDate).getTime())
                    .slice(0, 5)
                    .map(allocation => (
                      <div key={allocation.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-2">
                          {React.createElement(getTypeIcon(allocation.allocationType), { className: "h-4 w-4 text-gray-400" })}
                          <div>
                            <div className="text-sm font-medium">{allocation.allocationNumber}</div>
                            <div className="text-xs text-gray-500">{allocation.allocationType}</div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(allocation.status)}>
                          {allocation.status}
                        </Badge>
                      </div>
                    ))}
                  {(allocations || []).length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Aucune allocation trouvée</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Tendances Mensuelles</CardTitle>
                <CardDescription>Évolution des allocations au fil du temps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Simple trend visualization */}
                  <div className="flex items-end gap-1 h-32">
                    {[...Array(12)].map((_, index) => {
                      const monthAllocations = (allocations || []).filter(a => {
                        const allocDate = new Date(a.allocationDate);
                        const currentDate = new Date();
                        const targetMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - (11 - index), 1);
                        return allocDate.getMonth() === targetMonth.getMonth() && 
                               allocDate.getFullYear() === targetMonth.getFullYear();
                      }).length;
                      const maxHeight = Math.max(...[...Array(12)].map((_, i) => {
                        const date = new Date();
                        const month = new Date(date.getFullYear(), date.getMonth() - (11 - i), 1);
                        return (allocations || []).filter(a => {
                          const allocDate = new Date(a.allocationDate);
                          return allocDate.getMonth() === month.getMonth() && 
                                 allocDate.getFullYear() === month.getFullYear();
                        }).length;
                      }));
                      const height = maxHeight > 0 ? (monthAllocations / maxHeight) * 100 : 0;
                      return (
                        <div 
                          key={index} 
                          className="bg-blue-500 rounded-t flex-1 min-h-[4px]"
                          style={{ height: `${Math.max(height, 4)}%` }}
                          title={`${monthAllocations} allocations`}
                        ></div>
                      );
                    })}
                  </div>
                  <div className="text-center text-sm text-gray-500">
                    Derniers 12 mois
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Allocation Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Créer Nouvelle Allocation</DialogTitle>
            <DialogDescription>
              Suivez les étapes pour créer une nouvelle allocation d'équipement
            </DialogDescription>
          </DialogHeader>

          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Étape {currentStep} sur 4</span>
              <span className="text-sm text-gray-500">{Math.round((currentStep / 4) * 100)}% Terminé</span>
            </div>
            <Progress value={(currentStep / 4) * 100} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Sélectionner Article</span>
              <span>Choisir Entité</span>
              <span>Détails</span>
              <span>Confirmer</span>
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[300px] max-h-[400px] overflow-y-auto">
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Sélectionner Articles</h3>
                    <p className="text-sm text-gray-600">Choisissez les articles que vous voulez allouer</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      refreshArticles()
                      console.log('🔍 Debug - Current articles state:', articles?.map(a => ({
                        id: a.id,
                        name: a.name,
                        code: a.code,
                        currentStock: a.currentStock
                      })))
                    }}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Actualiser Articles
                  </Button>
                </div>
                
                {/* Article Selection */}
                <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
                  <h4 className="font-medium mb-4">Ajouter un article</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="articleSelect">Article</Label>
                        <Select 
                          value={selectedArticleId.toString()} 
                          onValueChange={(value) => setSelectedArticleId(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un article" />
                          </SelectTrigger>
                          <SelectContent>
                            {(articles || []).map(article => (
                              <SelectItem 
                                key={article.id} 
                                value={article.id.toString()}
                                disabled={isArticleAdded(article.id)}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{article.name} ({article.code})</span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    Stock: {article.currentStock}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="quantity">Quantité</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          max={articles?.find(a => a.id === selectedArticleId)?.currentStock || 1}
                          value={selectedQuantity}
                          onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={addArticleToAllocation}
                        disabled={!selectedArticleId || selectedQuantity <= 0 || isArticleAdded(selectedArticleId)}
                        className="px-6"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Selected Articles List */}
                {newAllocation.items.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Articles sélectionnés ({newAllocation.items.length})</h4>
                    <div className="space-y-2">
                      {newAllocation.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Package className="h-4 w-4 text-blue-500" />
                            <div>
                              <p className="font-medium">{item.article?.name || `Article ID: ${item.articleId}`}</p>
                              <p className="text-sm text-gray-500">
                                {item.article?.code} - Quantité: {item.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              max={item.article?.currentStock || 999}
                              value={item.quantity}
                              onChange={(e) => updateArticleQuantity(item.articleId, parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeArticleFromAllocation(item.articleId)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {newAllocation.items.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">
                        Total: {newAllocation.items.length} articles, {newAllocation.items.reduce((sum, item) => sum + item.quantity, 0)} unités
                      </span>
                    </div>
                  </div>
                )}

                {newAllocation.items.length === 0 && (
                  <div className="text-center p-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Aucun article sélectionné</p>
                    <p className="text-sm">Ajoutez des articles pour continuer</p>
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Choisir Entité</h3>
                <p className="text-sm text-gray-600">Sélectionnez le type d'entité et le destinataire spécifique</p>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="allocationType">Type d'Entité</Label>
                    <Select
                      value={newAllocation.type}
                      onValueChange={(value: 'team' | 'player' | 'staff' | 'employee') => setNewAllocation({ 
                        ...newAllocation, 
                        type: value,
                        entityId: 0 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="team">Équipe</SelectItem>
                        <SelectItem value="player">Joueur</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="employee">Employé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="entityId">Sélectionner {
                      newAllocation.type === 'team' ? 'Équipe' :
                      newAllocation.type === 'player' ? 'Joueur' :
                      newAllocation.type === 'staff' ? 'Staff' : 'Employé'
                    }</Label>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto mt-2">
                      {loading ? (
                        <div className="flex items-center justify-center p-4">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          <span>Chargement des entités...</span>
                        </div>
                      ) : entitiesByType.length === 0 ? (
                        <div className="text-center p-4 text-gray-500">
                          <p>Aucune entité de type {newAllocation.type} disponible</p>
                        </div>
                      ) : (
                        entitiesByType.map(entity => (
                          <div
                            key={entity.id}
                            className={`p-3 border rounded cursor-pointer transition-colors ${
                              newAllocation.entityId === entity.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setNewAllocation({ ...newAllocation, entityId: entity.id })}
                          >
                            <div className="flex items-center gap-2">
                              {React.createElement(getTypeIcon(entity.type), { className: "h-4 w-4 text-gray-400" })}
                              <span className="font-medium">{entity.name}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Détails de l'Allocation</h3>
                <p className="text-sm text-gray-600">Configurer la durée et autres détails</p>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Durée</Label>
                    <Select
                      value={newAllocation.duration}
                      onValueChange={(value: 'temporary' | 'permanent') => setNewAllocation({ 
                        ...newAllocation, 
                        duration: value 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="temporary">Temporaire</SelectItem>
                        <SelectItem value="permanent">Permanente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newAllocation.duration === 'temporary' && (
                    <div className="space-y-2">
                      <Label htmlFor="expectedReturnDate">Date de Retour Prévue</Label>
                      <Input
                        id="expectedReturnDate"
                        type="date"
                        value={newAllocation.expectedReturnDate}
                        onChange={(e) => setNewAllocation({ ...newAllocation, expectedReturnDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optionnel)</Label>
                    <Textarea
                      id="notes"
                      value={newAllocation.remarks}
                      onChange={(e) => setNewAllocation({ ...newAllocation, remarks: e.target.value })}
                      placeholder="Ajoutez des notes ou exigences supplémentaires"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Confirmer Allocation</h3>
                <p className="text-sm text-gray-600">Vérifiez les détails de l'allocation avant de soumettre</p>
                
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg space-y-3">
                  {/* Summary Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Articles:</span>
                      <span>{newAllocation.items.length} article(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Quantité totale:</span>
                      <span>{newAllocation.items.reduce((sum, item) => sum + item.quantity, 0)} unité(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Destinataire:</span>
                      <span className="truncate">{(entities || []).find(e => e.id === newAllocation.entityId)?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Type:</span>
                      <span>{
                        newAllocation.type === 'team' ? 'Équipe' :
                        newAllocation.type === 'player' ? 'Joueur' :
                        newAllocation.type === 'staff' ? 'Staff' : 'Employé'
                      }</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Durée:</span>
                      <span>{newAllocation.duration === 'temporary' ? "Temporaire" : "Permanente"}</span>
                    </div>
                    {newAllocation.expectedReturnDate && (
                      <div className="flex justify-between">
                        <span className="font-medium">Date de Retour:</span>
                        <span>{newAllocation.expectedReturnDate}</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Articles List - Compact */}
                  <div className="space-y-2">
                    <span className="font-medium text-sm">Détail des articles:</span>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {newAllocation.items.map((item, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded border text-sm">
                          <div className="flex justify-between items-center">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{item.article?.name || `Article ID: ${item.articleId}`}</p>
                              <p className="text-xs text-gray-500">{item.article?.code}</p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="font-medium">Qté: {item.quantity}</p>
                              <p className="text-xs text-gray-500">{item.article?.unit || 'unité'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {newAllocation.remarks && (
                    <>
                      <Separator />
                      <div>
                        <span className="font-medium text-sm">Notes:</span>
                        <p className="text-sm text-gray-600 mt-1 bg-white dark:bg-gray-800 p-2 rounded max-h-16 overflow-y-auto">
                          {newAllocation.remarks}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-blue-800 dark:text-blue-400 text-sm">Important</span>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Cette allocation sera soumise pour approbation. Le stock sera réservé une fois approuvé.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {currentStep > 1 && (
                <Button variant="outline" onClick={prevStep}>
                  Précédent
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleDialogClose(false)}>
                Annuler
              </Button>
              {currentStep < 4 ? (
                <Button 
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && newAllocation.items.length === 0) ||
                    (currentStep === 2 && !newAllocation.entityId) ||
                    (currentStep === 3 && newAllocation.duration === 'temporary' && !newAllocation.expectedReturnDate)
                  }
                  className="bg-blue-800 hover:bg-blue-900 text-white gap-2"
                >
                  Suivant
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleCreateAllocation} className="bg-blue-800 hover:bg-blue-900 text-white">
                  Créer Allocation
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Allocation Dialog */}
      <Dialog open={!!viewingAllocation} onOpenChange={() => setViewingAllocation(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'Allocation</DialogTitle>
            <DialogDescription>
              Voir les informations complètes de l'allocation
            </DialogDescription>
          </DialogHeader>
          {viewingAllocation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Numéro d'Allocation</Label>
                  <p className="text-lg font-semibold">{viewingAllocation.allocationNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Statut</Label>
                  <Badge className={getStatusColor(viewingAllocation.status)}>
                    {viewingAllocation.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Articles</Label>
                  <div className="space-y-2">
                    {viewingAllocation.items?.map((item, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <p className="font-medium">Article ID: {item.articleId}</p>
                        <p className="text-sm text-gray-600">Quantité: {item.quantity}</p>
                      </div>
                    )) || (
                      <p>Aucun article</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Total Quantity</Label>
                  <p>{viewingAllocation.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Entity</Label>
                  <p>{viewingAllocation.entityName} ({viewingAllocation.allocationType})</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Duration</Label>
                  <p>{viewingAllocation.allocationDuration}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Allocation Date</Label>
                  <p>{viewingAllocation.allocationDate}</p>
                </div>
                {viewingAllocation.expectedReturnDate && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Expected Return</Label>
                    <p>{viewingAllocation.expectedReturnDate}</p>
                  </div>
                )}
                {viewingAllocation.actualReturnDate && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Actual Return</Label>
                    <p>{viewingAllocation.actualReturnDate}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-500">Allocated By</Label>
                  <p>{viewingAllocation.allocatedBy}</p>
                </div>
                {viewingAllocation.approvedBy && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Approved By</Label>
                    <p>{viewingAllocation.approvedBy}</p>
                  </div>
                )}
              </div>
              {viewingAllocation.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Notes</Label>
                  <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded">{viewingAllocation.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingAllocation(null)}>
              Close
            </Button>
            {viewingAllocation?.internalPurchaseOrderPath && (
              <Button onClick={() => handleDownloadDocument(viewingAllocation.id)}>
                <Download className="h-4 w-4 mr-2" />
                Download Document
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
