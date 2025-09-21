"use client"

import { useState, useEffect } from "react"
import { apiConfig } from "@/lib/api-config"
import { authService } from "@/lib/auth-service"
import { useDispatch, useSelector } from "react-redux"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToastNotification, useToast } from "@/components/ui/toast-notification"
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Calendar,
  DollarSign,
  Award,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react"

// Redux imports
import {
  fetchAllContracts,
  createPlayerContract,
  createStaffContract,
  updatePlayerContract,
  updateStaffContract,
  // deletePlayerContract and deleteStaffContract removed as they're unused
  terminatePlayerContract,
  terminateStaffContract,
  setFilterStatus,
  // setFilterType import removed as it's only used in unused function
  clearError,
  verifyAuthentication,
  selectPlayerContracts,
  selectStaffContracts,
  selectContractsLoading,
  selectContractsError,
  selectFilterStatus,
  // selectFilterType removed as it's unused
  selectIsAuthenticated,
  deletePlayerContract,
  deleteStaffContract,
} from "@/lib/redux/contractSlice"
import { fetchAllPlayers } from "@/lib/redux/playerSlice"
import { fetchAllStaff } from "@/lib/redux/staffSlice"
import type { AppDispatch, RootState } from "@/lib/redux/store"
import type { PlayerContract, StaffContract } from "@/lib/api/contract-api"
import type { Player, Staff } from "@/lib/types/team-management"
import dayjs from "dayjs";
import "dayjs/locale/fr";

// Type for combined contract display
type CombinedContract = (PlayerContract | StaffContract) & {
  contractType: "player" | "staff"
  personName: string
  role: string
}

// Type guard helper functions
const isPlayerContract = (contract: PlayerContract | StaffContract): contract is PlayerContract => {
  return 'playerName' in contract || 'player' in contract
}

const isStaffContract = (contract: PlayerContract | StaffContract): contract is StaffContract => {
  return 'staffName' in contract || 'staff' in contract
}

/**
 * Export a list of contracts to CSV
 * @param contracts Array of Contract objects
 */
export function exportContractsToCSV(contracts: any[]) {
  const header = ['ID', 'Start Date', 'End Date', 'Salary (MAD)', 'Has Bonus', 'Signature Bonus (MAD)', 'Type', 'Person', 'Description'];
  const rows = contracts.map(contract => [
    contract.id,
    contract.startDate,
    contract.endDate,
    contract.salary || 0,
    contract.hasBonus ? 'Yes' : 'No',
    contract.signatureBonus || 0,
    contract.player ? 'Player' : 'Staff',
    contract.player
      ? `${contract.player.firstName} ${contract.player.lastName}`
      : (contract.staff ? `${contract.staff.firstName} ${contract.staff.lastName}` : ''),
    contract.description || ''
  ]);
  const csvContent = [header, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'contracts.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ContractManagement() {
  // All hooks must be declared before any return
  const dispatch = useDispatch<AppDispatch>()

  // Redux state
  const playerContracts = useSelector(selectPlayerContracts)
  const staffContracts = useSelector(selectStaffContracts)
  const loading = useSelector(selectContractsLoading)
  const error = useSelector(selectContractsError)
  const filterStatus = useSelector(selectFilterStatus)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  // Player and Staff data for dropdowns with proper type safety
  const players = useSelector((state: RootState) => state.players?.players || [])
  const staff = useSelector((state: RootState) => state.staff?.staff || [])
  const playersLoading = useSelector((state: RootState) => state.players?.loading || false)
  const staffLoading = useSelector((state: RootState) => state.staff?.loading || false)
  const playersError = useSelector((state: RootState) => state.players?.error || null)
  const staffError = useSelector((state: RootState) => state.staff?.error || null)

  // Local state (all hooks at the top)
  const [activeTab, setActiveTab] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [contractTypeFilter, setContractTypeFilter] = useState<"all" | "player" | "staff">("all")
  const [selectedContract, setSelectedContract] = useState<PlayerContract | StaffContract | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [contractForm, setContractForm] = useState({
    title: "",
    playerId: "",
    staffId: "",
    salary: "",
    signatureBonus: "",
    startDate: "",
    endDate: "",
    hasBonus: false,
    description: "",
    benefits: "",
    terms: "",
    contractType: "player" as "player" | "staff",
  })
  const [contractFile, setContractFile] = useState<File | null>(null)
  const [fileUploading, setFileUploading] = useState(false)
  const [fileUploadError, setFileUploadError] = useState<string | null>(null)
  const [uploadedFileId, setUploadedFileId] = useState<number | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contractToTerminate, setContractToTerminate] = useState<{ id: string; type: "player" | "staff" } | null>(null)
  const [contractToDelete, setContractToDelete] = useState<{ id: string; type: "player" | "staff" } | null>(null)
  const [terminationReason, setTerminationReason] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [contractToEdit, setContractToEdit] = useState<PlayerContract | StaffContract | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editFileUploading, setEditFileUploading] = useState(false);
  const [editUploadedFileId, setEditUploadedFileId] = useState<number | null>(null);
  const [editFileUploadError, setEditFileUploadError] = useState<string | null>(null);

  // Toast notification hook
  const { toastState, showToast, hideToast } = useToast()

  // All useEffect hooks here
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('🔄 Initializing contract management data...')
        const authResult = await dispatch(verifyAuthentication())
        if (verifyAuthentication.fulfilled.match(authResult)) {
          console.log('✅ Authentication verified, loading data...')
          const results = await Promise.allSettled([
            dispatch(fetchAllContracts()),
            fetch(`${apiConfig.baseUrl}/players`).then(r => r.json()),
            fetch(`${apiConfig.baseUrl}/staff`).then(r => r.json())
          ])
          results.forEach((result, index) => {
            const dataTypes = ['contracts', 'players', 'staff']
            if (result.status === 'fulfilled') {
              console.log(`✅ ${dataTypes[index]} loaded successfully:`, result.value)
            } else {
              console.error(`❌ Failed to load ${dataTypes[index]}:`, result.reason)
            }
          })
        } else {
          console.error('❌ Authentication failed:', authResult.payload)
        }
      } catch (error) {
        console.error('❌ Failed to initialize contract data:', error)
      }
    }
    initializeData()
  }, [dispatch])

  useEffect(() => {
    console.log('🔍 Players data:', players, 'Length:', players.length)
    console.log('🔍 Staff data:', staff, 'Length:', staff.length)
    console.log('🔍 Players loading:', playersLoading)
    console.log('🔍 Staff loading:', staffLoading)
    console.log('🔍 Players error:', playersError)
    console.log('🔍 Staff error:', staffError)
  }, [players, staff, playersLoading, staffLoading, playersError, staffError])

  useEffect(() => {
    if (isAuthenticated) {
      const statusParam = filterStatus === null || filterStatus === "all" ? undefined : filterStatus
      dispatch(fetchAllContracts(statusParam))
    }
  }, [dispatch, filterStatus, isAuthenticated])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, dispatch])

  // Handle filter changes
  // Define a type for contract status to avoid 'any'
  type ContractStatus = 'active' | 'expired' | 'terminated' | 'pending' | 'all' | null;

  const handleStatusFilterChange = (status: string) => {
    if (status === "all") {
      dispatch(setFilterStatus(null))
    } else {
      dispatch(setFilterStatus(status as ContractStatus))
    }
  }

  // Refresh data when filters change
  useEffect(() => {
    if (isAuthenticated) {
      // Refresh contracts when filter status changes
      // Note: "all" means no filter, so pass undefined
      const statusParam = filterStatus === null || filterStatus === "all" ? undefined : filterStatus
      dispatch(fetchAllContracts(statusParam))
    }
  }, [dispatch, filterStatus, isAuthenticated])

  // Clear errors when component mounts or user takes action
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError())
      }, 5000) // Clear error after 5 seconds

      return () => clearTimeout(timer)
    }
  }, [error, dispatch])

  // Authentication check - show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
              <h3 className="text-lg font-semibold">Authentification requise</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Veuillez vous connecter pour accéder aux fonctionnalités de gestion des contrats.
              </p>
              <Button
                onClick={() => window.location.href = '/login'}
                className="w-full"
              >
                Aller à la connexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des données des contrats...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && error.includes('Authentication required')) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h3 className="text-lg font-semibold">Erreur d'authentification</h3>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
              <div className="space-y-2">
                <Button
                  onClick={() => window.location.href = '/login'}
                  className="w-full"
                >
                  Aller à la connexion
                </Button>
                <Button
                  variant="outline"
                  onClick={() => dispatch(clearError())}
                  className="w-full"
                >
                  Dismisser
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusBadge = (status: string, terminationDate?: string) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      terminated: { color: "bg-red-100 text-red-800", icon: XCircle },
      expired: { color: "bg-gray-100 text-gray-800", icon: Clock },
      draft: { color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
    }

    // Add fallback for unknown status
    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: "bg-gray-100 text-gray-800",
      icon: AlertTriangle
    }
    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Inconnu'}
        {terminationDate && status === "terminated" && <span className="ml-1 text-xs">({terminationDate})</span>}
      </Badge>
    )
  }

  const handleCreateContract = async () => {
    try {
      setFileUploadError(null)

      // Validation
      if (contractForm.contractType === "player" && !contractForm.playerId) {
        showToast("Veuillez sélectionner un joueur dans le menu déroulant", "error", "Erreur de validation")
        return
      }

      if (contractForm.contractType === "staff" && !contractForm.staffId) {
        showToast("Veuillez sélectionner un membre du staff dans le menu déroulant", "error", "Erreur de validation")
        return
      }

      // Date validation
      const dateValidation = validateContractDates(contractForm.startDate, contractForm.endDate);
      if (!dateValidation.isValid) {
        showToast(dateValidation.error || "Erreur de validation des dates", "error", "Erreur de validation");
        return;
      }

      // Ensure contractFileId is a number or undefined to avoid validation errors
      const contractFileId = uploadedFileId ? Number(uploadedFileId) : undefined

      const contractData = {
        title: contractForm.title,
        salary: Number(contractForm.salary),
        startDate: contractForm.startDate,
        endDate: contractForm.endDate,
        hasBonus: contractForm.hasBonus,
        signatureBonus: contractForm.hasBonus ? Number(contractForm.signatureBonus) : undefined,
        description: contractForm.description,
        contractFileId: contractFileId,
      }

      console.log("Creating contract with data:", contractData)

      if (contractForm.contractType === "player") {
        const result = await dispatch(createPlayerContract({
          ...contractData,
          playerId: contractForm.playerId,
        }))

        if (createPlayerContract.fulfilled.match(result)) {
          console.log("✅ Contrat joueur créé avec succès")
          showToast("Contrat joueur créé avec succès", "success", "Succès")
          setIsCreateDialogOpen(false)
          resetForm()
        } else if (createPlayerContract.rejected.match(result)) {
          const errorMessage = (result.payload as any)?.message || (result.error as any)?.message || "Erreur lors de la création du contrat"
          console.error("❌ Erreur création contrat joueur:", errorMessage)
          showToast(errorMessage, "error", "Erreur de création")
        }
      } else {
        const result = await dispatch(createStaffContract({
          ...contractData,
          staffId: Number(contractForm.staffId),
          benefits: contractForm.benefits ? JSON.parse(contractForm.benefits) : undefined,
          terms: contractForm.terms,
        }))

        if (createStaffContract.fulfilled.match(result)) {
          console.log("✅ Contrat staff créé avec succès")
          showToast("Contrat staff créé avec succès", "success", "Succès")
          setIsCreateDialogOpen(false)
          resetForm()
        } else if (createStaffContract.rejected.match(result)) {
          const errorMessage = (result.payload as any)?.message || (result.error as any)?.message || "Erreur lors de la création du contrat"
          console.error("❌ Erreur création contrat staff:", errorMessage)
          showToast(errorMessage, "error", "Erreur de création")
        }
      }
    } catch (error: any) {
      console.error("Échec de la création du contrat:", error)
      const errorMessage = error?.message || "Erreur inattendue lors de la création du contrat"
      showToast(errorMessage, "error", "Erreur")
    }
  }

  // Helper function to reset form
  const resetForm = () => {
    setContractForm({
      title: "",
      playerId: "",
      staffId: "",
      salary: "",
      signatureBonus: "",
      startDate: "",
      endDate: "",
      hasBonus: false,
      description: "",
      benefits: "",
      terms: "",
      contractType: "player",
    })
    setContractFile(null)
    setUploadedFileId(null)
    setUploadedFileName(null)
  }

  // File upload handler
  const handleFileUpload = async () => {
    setFileUploadError(null)
    if (!contractFile) {
      setFileUploadError('Veuillez sélectionner un fichier à télécharger.')
      showToast('Veuillez sélectionner un fichier à télécharger.', 'error', 'Erreur de fichier')
      return
    }
    setFileUploading(true)
    console.log('Téléchargement du fichier:', contractFile);
    const formData = new FormData()
    formData.append('contractFile', contractFile)
    try {
      const token = authService.getToken();
      console.log('Token:', token)
      const res = await fetch(`${apiConfig.baseUrl}/contracts/upload-file`, {
        method: 'POST',
        body: formData,
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      })
      console.log('Statut de la réponse de téléchargement de fichier:', res.status)
      const responseText = await res.text();
      console.log('Texte de la réponse de téléchargement de fichier:', responseText)
      if (!res.ok) {
        const errorMessage = responseText || 'Échec du téléchargement du fichier'
        throw new Error(errorMessage)
      }
      const fileData = JSON.parse(responseText)
      setUploadedFileId(fileData.id)
      setUploadedFileName(contractFile.name)
      showToast('Fichier téléchargé avec succès', 'success', 'Succès')
    } catch (err: any) {
      const errorMessage = 'Échec du téléchargement du fichier: ' + (err.message || err)
      setFileUploadError(errorMessage)
      showToast(errorMessage, 'error', 'Erreur de téléchargement')
      console.error('Erreur de téléchargement de fichier:', err)
    }
    setFileUploading(false)
  }

  const handleTerminateContract = async () => {
    if (!contractToTerminate) return;
    const terminationDate = new Date().toISOString().split("T")[0];
    try {
      if (contractToTerminate.type === "player") {
        const result = await dispatch(terminatePlayerContract({
          id: contractToTerminate.id,
          terminationDate,
          reason: terminationReason || undefined
        }));
        if (terminatePlayerContract.fulfilled.match(result)) {
          console.log("✅ Contrat joueur résilié avec succès");
          showToast("Contrat joueur résilié avec succès", "success", "Succès")
        } else {
          showToast("Erreur lors de la résiliation du contrat joueur", "error", "Erreur")
        }
      } else {
        const result = await dispatch(terminateStaffContract({
          id: contractToTerminate.id,
          terminationDate,
          reason: terminationReason || undefined
        }));
        if (terminateStaffContract.fulfilled.match(result)) {
          console.log("✅ Contrat staff résilié avec succès");
          showToast("Contrat staff résilié avec succès", "success", "Succès")
        } else {
          showToast("Erreur lors de la résiliation du contrat staff", "error", "Erreur")
        }
      }
    } catch (error: any) {
      console.error("Échec de la résiliation du contrat:", error);
      const errorMessage = error?.message || "Erreur lors de la résiliation du contrat"
      showToast(errorMessage, "error", "Erreur")
    }
    setTerminateDialogOpen(false);
    setContractToTerminate(null);
    setTerminationReason("");
  };

  const handleDeleteContract = async () => {
    if (!contractToDelete) return;
    try {
      if (contractToDelete.type === "player") {
        const result = await dispatch(deletePlayerContract(contractToDelete.id));
        if (deletePlayerContract.fulfilled.match(result)) {
          showToast("Contrat joueur supprimé avec succès", "success", "Succès")
        } else {
          showToast("Erreur lors de la suppression du contrat joueur", "error", "Erreur")
        }
      } else {
        const result = await dispatch(deleteStaffContract(contractToDelete.id));
        if (deleteStaffContract.fulfilled.match(result)) {
          showToast("Contrat staff supprimé avec succès", "success", "Succès")
        } else {
          showToast("Erreur lors de la suppression du contrat staff", "error", "Erreur")
        }
      }
    } catch (error: any) {
      console.error("Échec de la suppression du contrat:", error);
      const errorMessage = error?.message || "Erreur lors de la suppression du contrat"
      showToast(errorMessage, "error", "Erreur")
    }
    setDeleteDialogOpen(false);
    setContractToDelete(null);
  };

  // Filtered contracts based on search and Redux filters
  const filteredPlayerContracts = playerContracts.filter((contract) => {
    const playerName = contract.playerName || (contract.player ? `${contract.player.firstName} ${contract.player.lastName}` : '');
    const matchesSearch =
      playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.title.toLowerCase().includes(searchTerm.toLowerCase())

    // Fix: Ensure both sides are lowercase for comparison
    const currentStatusFilter = (filterStatus || "all").toLowerCase()
    const contractStatus = (contract.status || 'draft').toLowerCase()
    const matchesStatus = currentStatusFilter === "all" || contractStatus === currentStatusFilter

    return matchesSearch && matchesStatus
  });

  const filteredStaffContracts = staffContracts.filter((contract) => {
    const staffName = contract.staffName || (contract.staff ? `${contract.staff.firstName} ${contract.staff.lastName}` : '');
    const matchesSearch =
      staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.title.toLowerCase().includes(searchTerm.toLowerCase())

    // Fix: Ensure both sides are lowercase for comparison
    const currentStatusFilter = (filterStatus || "all").toLowerCase()
    const contractStatus = (contract.status || 'draft').toLowerCase()
    const matchesStatus = currentStatusFilter === "all" || contractStatus === currentStatusFilter

    return matchesSearch && matchesStatus
  });

  const contractStats = {
    player: {
      active: playerContracts.filter((c) => c.status?.toLowerCase() === "active").length,
      expired: playerContracts.filter((c) => c.status?.toLowerCase() === "expired").length,
      terminated: playerContracts.filter((c) => c.status?.toLowerCase() === "terminated").length,
      totalValue: playerContracts.filter((c) => c.status?.toLowerCase() === "active").reduce((sum, c) => {
        const salary = typeof c.salary === 'string' ? parseFloat(c.salary) : c.salary;
        return sum + (salary || 0);
      }, 0),
    },
    staff: {
      active: staffContracts.filter((c) => c.status?.toLowerCase() === "active").length,
      expired: staffContracts.filter((c) => c.status?.toLowerCase() === "expired").length,
      terminated: staffContracts.filter((c) => c.status?.toLowerCase() === "terminated").length,
      totalValue: staffContracts.filter((c) => c.status?.toLowerCase() === "active").reduce((sum, c) => {
        const salary = typeof c.salary === 'string' ? parseFloat(c.salary) : c.salary;
        return sum + (salary || 0);
      }, 0),
    },
  }

  const validateContractDates = (startDate: string, endDate: string) => {
    const today = new Date().toISOString().split('T')[0];

    if (startDate && startDate < today) {
      return { isValid: false, error: "La date de début ne peut pas être dans le passé" };
    }

    if (endDate && endDate < today) {
      return { isValid: false, error: "La date de fin ne peut pas être dans le passé" };
    }

    if (startDate && endDate && startDate >= endDate) {
      return { isValid: false, error: "La date de fin doit être postérieure à la date de début" };
    }

    return { isValid: true, error: null };
  };

  return (
    <div className="space-y-6">
      {/* Export Contracts CSV Button */}
      <div className="flex justify-end">
        <Button
          className="bg-blue-800 hover:bg-blue-900 text-white mb-2"
          onClick={() => exportContractsToCSV([...playerContracts, ...staffContracts])}
        >
          Exporter les contrats (CSV)
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des contrats</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérez les contrats des joueurs et du staff</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              console.log('🔄 Rafraîchir toutes les données...')
              try {
                const results = await Promise.allSettled([
                  dispatch(fetchAllContracts()),
                  dispatch(fetchAllPlayers()),
                  dispatch(fetchAllStaff())
                ])

                results.forEach((result, index) => {
                  const dataTypes = ['contracts', 'players', 'staff']
                  if (result.status === 'fulfilled') {
                    console.log(`✅ Rafraîchi ${dataTypes[index]} avec succès`)
                  } else {
                    console.error(`❌ Échec du rafraîchissement de ${dataTypes[index]}:`, result.reason)
                  }
                })
              } catch (error) {
                console.error('❌ Erreur lors du rafraîchissement:', error)
              }
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Rafraîchir
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau contrat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un nouveau contrat</DialogTitle>
                <DialogDescription>Créer un nouveau contrat joueur ou staff avec conditions</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contractType">Type de contrat</Label>
                    <Select
                      value={contractForm.contractType}
                      onValueChange={(value) => setContractForm({ ...contractForm, contractType: value as "player" | "staff" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type de contrat" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="player">Contrat joueur</SelectItem>
                        <SelectItem value="staff">Contrat staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="title">Titre du contrat</Label>
                    <Input
                      id="title"
                      value={contractForm.title}
                      onChange={(e) => setContractForm({ ...contractForm, title: e.target.value })}
                      placeholder="ex : Contrat joueur professionnel"
                    />
                  </div>

                  {contractForm.contractType === "player" ? (
                    <div>
                      <Label htmlFor="playerId">Sélectionner un joueur</Label>
                      <Select
                        value={contractForm.playerId}
                        onValueChange={(value) => setContractForm({ ...contractForm, playerId: value })}
                        disabled={playersLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={playersLoading ? "Chargement des joueurs..." : players.length === 0 ? "Aucun joueur disponible" : "Sélectionner un joueur"} />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            console.log('🔍 Rendu du menu déroulant des joueurs, joueurs:', players, 'chargement:', playersLoading)
                            if (players.length === 0 && !playersLoading) {
                              return (
                                <SelectItem value="no-players" disabled>
                                  Aucun joueur disponible
                                </SelectItem>
                              )
                            }
                            return players.map((player: Player) => {
                              console.log('🔍 Rendu du joueur:', player)
                              return (
                                <SelectItem key={player.id} value={player.id.toString()}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {player.firstName} {player.lastName}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      {player.position} {player.team?.name ? `• ${player.team.name}` : ''}
                                    </span>
                                  </div>
                                </SelectItem>
                              )
                            })
                          })()}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="staffId">Sélectionner un membre du staff</Label>
                      <Select
                        value={contractForm.staffId}
                        onValueChange={(value) => setContractForm({ ...contractForm, staffId: value })}
                        disabled={staffLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={staffLoading ? "Chargement du staff..." : staff.length === 0 ? "Aucun staff disponible" : "Sélectionner un membre du staff"} />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            console.log('🔍 Rendu du menu déroulant du staff, staff:', staff, 'chargement:', staffLoading)
                            if (staff.length === 0 && !staffLoading) {
                              return (
                                <SelectItem value="no-staff" disabled>
                                  Aucun staff disponible
                                </SelectItem>
                              )
                            }
                            return staff.map((staffMember: Staff) => {
                              console.log('🔍 Rendu du membre du staff:', staffMember)
                              return (
                                <SelectItem key={staffMember.id} value={staffMember.id.toString()}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {staffMember.firstName} {staffMember.lastName}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      {staffMember.role} {staffMember.team?.name ? `• ${staffMember.team.name}` : ''}
                                    </span>
                                  </div>
                                </SelectItem>
                              )
                            })
                          })()}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="salary">Salaire Mensuel (MAD)</Label>
                    <Input
                      id="salary"
                      type="number"
                      value={contractForm.salary}
                      onChange={(e) => setContractForm({ ...contractForm, salary: e.target.value })}
                      placeholder="85000"
                    />
                  </div>

                  {/* Has Bonus checkbox */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="hasBonus"
                        checked={contractForm.hasBonus || false}
                        onChange={(e) => setContractForm({ ...contractForm, hasBonus: e.target.checked })}
                      />
                      <Label htmlFor="hasBonus">Inclure des primes dans le contrat</Label>
                    </div>
                  </div>

                  {/* Signature Bonus - only shown if hasBonus is true */}
                  {contractForm.hasBonus && (
                    <div>
                      <Label htmlFor="signatureBonus">Prime de signature (MAD)</Label>
                      <Input
                        id="signatureBonus"
                        type="number"
                        value={contractForm.signatureBonus}
                        onChange={(e) => setContractForm({ ...contractForm, signatureBonus: e.target.value })}
                        placeholder="15000"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="startDate">Date de début</Label>
                    <Input
                      id="startDate"
                      type="date"
                      min={new Date().toISOString().split('T')[0]} // Prevent past dates
                      value={contractForm.startDate}
                      onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">Date de fin</Label>
                    <Input
                      id="endDate"
                      type="date"
                      min={contractForm.startDate || new Date().toISOString().split('T')[0]} // End date must be after start date
                      value={contractForm.endDate}
                      onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={contractForm.description}
                    onChange={(e) => setContractForm({ ...contractForm, description: e.target.value })}
                    placeholder="Description du contrat et détails clés..."
                  />
                </div>
                <div>
                  <Label htmlFor="terms">Conditions générales</Label>
                  <Textarea
                    id="terms"
                    value={contractForm.terms}
                    onChange={(e) => setContractForm({ ...contractForm, terms: e.target.value })}
                    placeholder="Conditions, clauses et spécificités..."
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="contractFile">Fichier du contrat (PDF, DOCX, etc.)</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="contractFile"
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          setContractFile(e.target.files[0])
                          setUploadedFileId(null)
                          setUploadedFileName(null)
                        } else {
                          setContractFile(null)
                          setUploadedFileId(null)
                          setUploadedFileName(null)
                        }
                      }}
                      disabled={fileUploading}
                    />
                    <Button type="button" onClick={handleFileUpload} disabled={!contractFile || fileUploading || !!uploadedFileId}>
                      {fileUploading ? 'Téléversement...' : uploadedFileId ? 'Téléversé' : 'Téléverser le fichier'}
                    </Button>
                  </div>
                  {contractFile && !uploadedFileId && (
                    <div className="text-xs text-gray-600 mt-1">Sélectionné : {contractFile.name}</div>
                  )}
                  {uploadedFileId && uploadedFileName && (
                    <div className="text-xs text-green-600 mt-1">Téléversé : {uploadedFileName}</div>
                  )}
                  {fileUploadError && (
                    <div className="text-xs text-red-600 mt-1">{fileUploadError}</div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateContract}>Créer le contrat</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Tous les contrats</TabsTrigger>
          <TabsTrigger value="players">Contrats joueurs</TabsTrigger>
          <TabsTrigger value="staff">Contrats staff</TabsTrigger>
          <TabsTrigger value="analytics">Statistiques</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Combined Contract Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contrats actifs</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {contractStats.player.active + contractStats.staff.active}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {contractStats.player.active} joueurs, {contractStats.staff.active} staff
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valeur totale</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {(contractStats.player.totalValue + contractStats.staff.totalValue).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Engagement salarial total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expirés</CardTitle>
                <Clock className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">
                  {contractStats.player.expired + contractStats.staff.expired}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">À renouveler</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Résiliés</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {contractStats.player.terminated + contractStats.staff.terminated}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Résiliations anticipées</p>
              </CardContent>
            </Card>
          </div>

          {/* All Contracts Management */}
          <Card>
            <CardHeader>
              <CardTitle>Tous les contrats</CardTitle>
              <CardDescription>Gérez tous les contrats joueurs et staff</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher un contrat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={contractTypeFilter} onValueChange={(value: "all" | "player" | "staff") => setContractTypeFilter(value)}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrer par type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="player">Joueurs uniquement</SelectItem>
                    <SelectItem value="staff">Staff uniquement</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus || "all"} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="expired">Expiré</SelectItem>
                    <SelectItem value="terminated">Résilié</SelectItem>
                    <SelectItem value="draft">Brouillon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Combined Contracts Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Personne</TableHead>
                    <TableHead>Poste/Rôle</TableHead>
                    <TableHead>Titre du contrat</TableHead>
                    <TableHead>Salaire</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    // Combine and filter contracts
                    const allContracts: CombinedContract[] = [];

                    // Add player contracts
                    if (contractTypeFilter === "all" || contractTypeFilter === "player") {
                      filteredPlayerContracts.forEach(contract => {
                        allContracts.push({
                          ...contract,
                          contractType: "player" as const,
                          personName: contract.playerName || (contract.player ? `${contract.player.firstName} ${contract.player.lastName}` : 'Inconnu'),
                          role: contract.position || contract.player?.position || 'N/A'
                        });
                      });
                    }

                    // Add staff contracts
                    if (contractTypeFilter === "all" || contractTypeFilter === "staff") {
                      filteredStaffContracts.forEach(contract => {
                        allContracts.push({
                          ...contract,
                          contractType: "staff" as const,
                          personName: contract.staffName || (contract.staff ? `${contract.staff.firstName} ${contract.staff.lastName}` : 'Inconnu'),
                          role: contract.role || contract.staff?.role || 'N/A'
                        });
                      });
                    }

                    // Sort by creation date or ID
                    allContracts.sort((a, b) => {
                      if (a.createdAt && b.createdAt) {
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                      }
                      return Number(b.id) - Number(a.id);
                    });

                    return allContracts.map((contract, index) => (
                      <TableRow key={`${contract.contractType}-${contract.id}`}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Badge className={contract.contractType === "player" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}>
                            {contract.contractType === "player" ? "Joueur" : "Staff"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{contract.personName}</TableCell>
                        <TableCell>{contract.role}</TableCell>
                        <TableCell>{contract.title}</TableCell>
                        <TableCell className="font-medium">
                          {(typeof contract.salary === 'string' ? parseFloat(contract.salary) : contract.salary).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{dayjs(contract.startDate).locale('fr').format('DD/MM/YYYY')}</div>
                            <div className="text-gray-500">à {dayjs(contract.endDate).locale('fr').format('DD/MM/YYYY')}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(contract.status, contract.terminationDate)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedContract(contract)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>Détails du contrat {contract.contractType === "player" ? "joueur" : "staff"}</DialogTitle>
                                  <DialogDescription>
                                    Informations complètes du contrat pour {contract.personName}
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedContract && (
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-sm font-medium">ID du contrat</Label>
                                        <p className="text-sm text-gray-600">{selectedContract.id}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Type</Label>
                                        <p className="text-sm font-bold">
                                          {contract.contractType === "player" ? "Contrat joueur" : "Contrat staff"}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Personne</Label>
                                        <p className="text-sm font-bold">{contract.personName}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">{contract.contractType === "player" ? "Poste" : "Rôle"}</Label>
                                        <p className="text-sm text-gray-600">{contract.role}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Salaire mensuel (MAD)</Label>
                                        <p className="text-sm font-bold">{(typeof selectedContract.salary === 'string' ? parseFloat(selectedContract.salary) : selectedContract.salary).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}</p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Prime de signature</Label>
                                        <p className="text-sm text-gray-600">
                                          {selectedContract.signatureBonus ? (typeof selectedContract.signatureBonus === 'string' ? parseFloat(selectedContract.signatureBonus) : selectedContract.signatureBonus).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 }) : '-'}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">Période du contrat</Label>
                                        <p className="text-sm text-gray-600">
                                          {dayjs(selectedContract.startDate).locale('fr').format('DD/MM/YYYY')} à {dayjs(selectedContract.endDate).locale('fr').format('DD/MM/YYYY')}
                                        </p>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Statut</Label>
                                      <div className="mt-1">
                                        {getStatusBadge(selectedContract.status, selectedContract.terminationDate)}
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Description</Label>
                                      <p className="text-sm text-gray-600">{selectedContract.description}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Bonus de performance</Label>
                                      <p className="text-sm text-gray-600">
                                        {selectedContract.hasBonus ? 'Inclus dans le contrat' : 'Non inclus'}
                                      </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                                      <div>
                                        <Label className="text-xs font-medium">Créé le</Label>
                                        <p>{selectedContract.createdAt}</p>
                                      </div>
                                      <div>
                                        <Label className="text-xs font-medium">Dernière modification</Label>
                                        <p>{selectedContract.updatedAt}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Fichier du contrat</Label>
                                      {selectedContract.contractFile && selectedContract.contractFile.url ? (
                                        <Button
                                          className="mt-2"
                                          onClick={() => {
                                            const fileUrl = selectedContract.contractFile?.url || '';
                                            const isAbsolute = fileUrl.startsWith('http://') || fileUrl.startsWith('https://');
                                            const urlToOpen = isAbsolute ? fileUrl : `${apiConfig.baseUrl}${fileUrl}`;
                                            window.open(urlToOpen, '_blank', 'noopener,noreferrer');
                                          }}
                                        >
                                          Voir le contrat
                                        </Button>
                                      ) : (
                                        <p className="text-gray-400 mt-2">Aucun fichier de contrat disponible.</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            <Button variant="outline" size="sm" onClick={() => {
                              setContractToEdit(contract);
                              setEditForm({ ...contract });
                              setEditUploadedFileId(contract.contractFile?.id || null);
                              setIsEditDialogOpen(true);
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 bg-transparent"
                              onClick={() => {
                                setContractToDelete({
                                  id: contract.id.toString(),
                                  type: contract.contractType
                                });
                                setDeleteDialogOpen(true);
                              }}
                            >
                              Supprimer
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players" className="space-y-6">
          {/* Player Contract Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contrats actifs</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{contractStats.player.active}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Actuellement actifs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valeur totale</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {(contractStats.player.totalValue).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Engagement salarial annuel</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expirés</CardTitle>
                <Clock className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{contractStats.player.expired}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">À renouveler</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Résiliés</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{contractStats.player.terminated}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Résiliations anticipées</p>
              </CardContent>
            </Card>
          </div>

          {/* Player Contracts Management */}
          <Card>
            <CardHeader>
              <CardTitle>Contrats joueurs</CardTitle>
              <CardDescription>Gérez tous les contrats et accords des joueurs</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher un contrat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus || "all"} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="expired">Expiré</SelectItem>
                    <SelectItem value="terminated">Résilié</SelectItem>
                    <SelectItem value="draft">Brouillon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Player Contracts Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Joueur</TableHead>
                    <TableHead>Poste</TableHead>
                    <TableHead>Titre du contrat</TableHead>
                    <TableHead>Salaire</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayerContracts.map((contract, index) => (
                    <TableRow key={contract.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {contract.playerName || (contract.player ? `${contract.player.firstName} ${contract.player.lastName}` : 'Inconnu')}
                      </TableCell>
                      <TableCell>{contract.position || contract.player?.position || 'N/A'}</TableCell>
                      <TableCell>{contract.title}</TableCell>
                      <TableCell className="font-medium">
                        {(typeof contract.salary === 'string' ? parseFloat(contract.salary) : contract.salary).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{dayjs(contract.startDate).locale('fr').format('DD/MM/YYYY')}</div>
                          <div className="text-gray-500">à {dayjs(contract.endDate).locale('fr').format('DD/MM/YYYY')}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(contract.status, contract.terminationDate)}</TableCell>
                      <TableCell>
                        {contract.hasBonus ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Award className="h-3 w-3 mr-1" />
                            Oui
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Non</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedContract(contract)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Détails du contrat joueur</DialogTitle>
                                <DialogDescription>
                                  Informations complètes du contrat pour {selectedContract && isPlayerContract(selectedContract) ? selectedContract.playerName : 'N/A'}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedContract && isPlayerContract(selectedContract) && (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">ID du contrat</Label>
                                      <p className="text-sm text-gray-600">{selectedContract.id}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Joueur</Label>
                                      <p className="text-sm font-bold">{selectedContract.playerName}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Poste</Label>
                                      <p className="text-sm text-gray-600">{selectedContract.position || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Salaire mensuel (MAD)</Label>
                                      <p className="text-sm font-bold">{(typeof selectedContract.salary === 'string' ? parseFloat(selectedContract.salary) : selectedContract.salary).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Prime de signature</Label>
                                      <p className="text-sm text-gray-600">
                                        {selectedContract.signatureBonus ? (typeof selectedContract.signatureBonus === 'string' ? parseFloat(selectedContract.signatureBonus) : selectedContract.signatureBonus).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 }) : '-'}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Période du contrat</Label>
                                      <p className="text-sm text-gray-600">
                                        {dayjs(selectedContract.startDate).locale('fr').format('DD/MM/YYYY')} à {dayjs(selectedContract.endDate).locale('fr').format('DD/MM/YYYY')}
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Statut</Label>
                                    <div className="mt-1">
                                      {getStatusBadge(selectedContract.status, selectedContract.terminationDate)}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Description</Label>
                                    <p className="text-sm text-gray-600">{selectedContract.description}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Bonus de performance</Label>
                                    <p className="text-sm text-gray-600">
                                      {selectedContract.hasBonus ? 'Inclus dans le contrat' : 'Non inclus'}
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                                    <div>
                                      <Label className="text-xs font-medium">Créé le</Label>
                                      <p>{selectedContract.createdAt}</p>
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium">Dernière modification</Label>
                                      <p>{selectedContract.updatedAt}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Fichier du contrat</Label>
                                    {selectedContract.contractFile && selectedContract.contractFile.url ? (
                                      <Button
                                        className="mt-2"
                                        onClick={() => {
                                          const fileUrl = selectedContract.contractFile?.url || '';
                                          const isAbsolute = fileUrl.startsWith('http://') || fileUrl.startsWith('https://');
                                          const urlToOpen = isAbsolute ? fileUrl : `${apiConfig.baseUrl}${fileUrl}`;
                                          window.open(urlToOpen, '_blank', 'noopener,noreferrer');
                                        }}
                                      >
                                        Voir le contrat
                                      </Button>
                                    ) : (
                                      <p className="text-gray-400 mt-2">Aucun fichier de contrat disponible.</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Button variant="outline" size="sm" onClick={() => {
                            setContractToEdit(contract);
                            setEditForm({ ...contract });
                            setEditUploadedFileId(contract.contractFile?.id || null);
                            setIsEditDialogOpen(true);
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 bg-transparent"
                            onClick={() => {
                              setContractToDelete({ id: contract.id.toString(), type: "player" });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          {/* Staff Contract Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contrats actifs</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{contractStats.staff.active}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Actuellement actifs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valeur totale</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {(contractStats.staff.totalValue).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Engagement salarial annuel</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expirés</CardTitle>
                <Clock className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{contractStats.staff.expired}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">À renouveler</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Résiliés</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{contractStats.staff.terminated}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Résiliations anticipées</p>
              </CardContent>
            </Card>
          </div>

          {/* Staff Contracts Management */}
          <Card>
            <CardHeader>
              <CardTitle>Contrats staff</CardTitle>
              <CardDescription>Gérez tous les contrats et accords du staff</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher un contrat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus || "all"} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="expired">Expiré</SelectItem>
                    <SelectItem value="terminated">Résilié</SelectItem>
                    <SelectItem value="draft">Brouillon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Staff Contracts Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Membre du staff</TableHead>
                    <TableHead>Département</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Salaire</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Avantages</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaffContracts.map((contract, index) => (
                    <TableRow key={contract.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {contract.staffName || (contract.staff ? `${contract.staff.firstName} ${contract.staff.lastName}` : 'Inconnu')}
                      </TableCell>
                      <TableCell>{contract.department || contract.staff?.team?.name || 'N/A'}</TableCell>
                      <TableCell>{contract.role || contract.staff?.role || 'N/A'}</TableCell>
                      <TableCell className="font-medium">
                        {(typeof contract.salary === 'string' ? parseFloat(contract.salary) : contract.salary).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{dayjs(contract.startDate).locale('fr').format('DD/MM/YYYY')}</div>
                          <div className="text-gray-500">à {dayjs(contract.endDate).locale('fr').format('DD/MM/YYYY')}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(contract.status, contract.terminationDate)}</TableCell>
                      <TableCell>
                        {contract.benefits?.healthInsurance && (
                          <Badge className="bg-blue-100 text-blue-800 mr-1">Santé</Badge>
                        )}
                        {contract.benefits?.carAllowance && contract.benefits.carAllowance > 0 && (
                          <Badge className="bg-green-100 text-green-800">Véhicule</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedContract(contract)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Détails du contrat staff</DialogTitle>
                                <DialogDescription>
                                  Informations complètes du contrat pour {selectedContract && isStaffContract(selectedContract) ? selectedContract.staffName : 'N/A'}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedContract && isStaffContract(selectedContract) && (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">ID du contrat</Label>
                                      <p className="text-sm text-gray-600">{selectedContract.id}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Membre du staff</Label>
                                      <p className="text-sm font-bold">{selectedContract.staffName}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Département</Label>
                                      <p className="text-sm text-gray-600">{selectedContract.department || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Rôle</Label>
                                      <p className="text-sm text-gray-600">{selectedContract.role || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Salaire mensuel (MAD)</Label>
                                      <p className="text-sm font-bold">{(typeof selectedContract.salary === 'string' ? parseFloat(selectedContract.salary) : selectedContract.salary).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Prime de signature</Label>
                                      <p className="text-sm text-gray-600">
                                        {selectedContract.signatureBonus ? (typeof selectedContract.signatureBonus === 'string' ? parseFloat(selectedContract.signatureBonus) : selectedContract.signatureBonus).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 }) : '-'}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Période du contrat</Label>
                                      <p className="text-sm text-gray-600">
                                        {dayjs(selectedContract.startDate).locale('fr').format('DD/MM/YYYY')} à {dayjs(selectedContract.endDate).locale('fr').format('DD/MM/YYYY')}
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Statut</Label>
                                    <div className="mt-1">
                                      {getStatusBadge(selectedContract.status, selectedContract.terminationDate)}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Avantages</Label>
                                    <div className="mt-2 space-y-2">
                                      {selectedContract.benefits?.healthInsurance && (
                                        <Badge className="bg-blue-100 text-blue-800 mr-2">Assurance santé</Badge>
                                      )}
                                      {selectedContract.benefits?.carAllowance &&
                                        selectedContract.benefits.carAllowance > 0 && (
                                          <Badge className="bg-green-100 text-green-800 mr-2">
                                            Véhicule : {(selectedContract.benefits.carAllowance || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}/mois
                                          </Badge>
                                        )}
                                      {selectedContract.benefits?.continuingEducation && (
                                        <Badge className="bg-purple-100 text-purple-800 mr-2">
                                          Formation : {(selectedContract.benefits.continuingEducation || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Conditions générales</Label>
                                    <p className="text-sm text-gray-600">{selectedContract.terms || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Description</Label>
                                    <p className="text-sm text-gray-600">{selectedContract.description}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Bonus de performance</Label>
                                    <p className="text-sm text-gray-600">
                                      {selectedContract.hasBonus ? 'Inclus dans le contrat' : 'Non inclus'}
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                                    <div>
                                      <Label className="text-xs font-medium">Créé le</Label>
                                      <p>{selectedContract.createdAt}</p>
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium">Dernière modification</Label>
                                      <p>{selectedContract.updatedAt}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Button variant="outline" size="sm" onClick={() => {
                            setContractToEdit(contract);
                            setEditForm({ ...contract });
                            setEditUploadedFileId(contract.contractFile?.id || null);
                            setIsEditDialogOpen(true);
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 bg-transparent"
                            onClick={() => {
                              setContractToDelete({ id: contract.id.toString(), type: "staff" });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Répartition de la valeur des contrats</CardTitle>
                <CardDescription>Répartition des valeurs des contrats par type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Contrats joueurs</span>
                    <span className="font-bold">{contractStats.player.totalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(contractStats.player.totalValue / (contractStats.player.totalValue + contractStats.staff.totalValue)) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Contrats staff</span>
                    <span className="font-bold">{contractStats.staff.totalValue.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${(contractStats.staff.totalValue / (contractStats.player.totalValue + contractStats.staff.totalValue)) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statut des contrats</CardTitle>
                <CardDescription>Statut actuel de tous les contrats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Contrats actifs
                    </span>
                    <span className="font-bold">{contractStats.player.active + contractStats.staff.active}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      Contrats expirés
                    </span>
                    <span className="font-bold">{contractStats.player.expired + contractStats.staff.expired}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Contrats résiliés
                    </span>
                    <span className="font-bold">
                      {contractStats.player.terminated + contractStats.staff.terminated}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Renouvellements à venir</CardTitle>
              <CardDescription>Contrats expirant dans les 6 prochains mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun contrat expirant dans les 6 prochains mois</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Terminate Confirmation Dialog */}
      <Dialog open={terminateDialogOpen} onOpenChange={setTerminateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la résiliation</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir résilier ce contrat ? Vous pouvez indiquer une raison (optionnel) :
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Raison de la résiliation (optionnel)"
            value={terminationReason}
            onChange={e => setTerminationReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setTerminateDialogOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleTerminateContract}>Résilier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement ce contrat ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDeleteContract}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Contract Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le contrat</DialogTitle>
            <DialogDescription>Modifiez les détails du contrat et sauvegardez les changements.</DialogDescription>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Titre du contrat</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Titre du contrat"
                />
              </div>

              <div>
                <Label htmlFor="edit-salary">Salaire mensuel (MAD)</Label>
                <Input
                  id="edit-salary"
                  type="number"
                  value={editForm.salary}
                  onChange={e => setEditForm({ ...editForm, salary: e.target.value })}
                  placeholder="Salaire en MAD"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-startDate">Date de début</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={editForm.startDate ? editForm.startDate.slice(0, 10) : ''}
                    onChange={e => setEditForm({ ...editForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-endDate">Date de fin</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    min={editForm.startDate ? editForm.startDate.slice(0, 10) : new Date().toISOString().split('T')[0]}
                    value={editForm.endDate ? editForm.endDate.slice(0, 10) : ''}
                    onChange={e => setEditForm({ ...editForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Has Bonus and Signature Bonus fields */}
              <div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-hasBonus"
                    checked={editForm.hasBonus || false}
                    onChange={e => setEditForm({ ...editForm, hasBonus: e.target.checked })}
                  />
                  <Label htmlFor="edit-hasBonus">Inclure des primes dans le contrat</Label>
                </div>
              </div>

              {editForm.hasBonus && (
                <div>
                  <Label htmlFor="edit-signatureBonus">Prime de signature (MAD)</Label>
                  <Input
                    id="edit-signatureBonus"
                    type="number"
                    value={editForm.signatureBonus || ''}
                    onChange={e => setEditForm({ ...editForm, signatureBonus: e.target.value })}
                    placeholder="Montant de la prime de signature"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description || ''}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Description du contrat"
                />
              </div>
              {/* File upload for edit */}
              <div>
                <Label>Fichier de contrat (PDF, DOCX, etc.)</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setEditFile(e.target.files[0]);
                        setEditUploadedFileId(null);
                      } else {
                        setEditFile(null);
                        setEditUploadedFileId(null);
                      }
                    }}
                    disabled={editFileUploading}
                  />
                  <Button type="button" onClick={async () => {
                    setEditFileUploadError(null);
                    if (!editFile) {
                      setEditFileUploadError('Veuillez sélectionner un fichier à télécharger.');
                      return;
                    }
                    setEditFileUploading(true);
                    const formData = new FormData();
                    formData.append('contractFile', editFile);
                    try {
                      const token = authService.getToken();
                      const res = await fetch(`${apiConfig.baseUrl}/contracts/upload-file`, {
                        method: 'POST',
                        body: formData,
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                      });
                      const responseText = await res.text();
                      if (!res.ok) throw new Error(responseText || 'File upload failed');
                      const fileData = JSON.parse(responseText);
                      setEditUploadedFileId(fileData.id);
                    } catch (err: any) {
                      setEditFileUploadError('Échec du téléchargement: ' + (err.message || err));
                    }
                    setEditFileUploading(false);
                  }} disabled={!editFile || editFileUploading || !!editUploadedFileId}>
                    {editFileUploading ? 'Téléchargement...' : editUploadedFileId ? 'Téléchargé' : 'Télécharger'}
                  </Button>
                </div>
                {editFile && !editUploadedFileId && (
                  <div className="text-xs text-gray-600 mt-1">Sélectionné: {editFile.name}</div>
                )}
                {editUploadedFileId && (
                  <div className="text-xs text-green-600 mt-1">Téléchargé avec succès</div>
                )}
                {editFileUploadError && (
                  <div className="text-xs text-red-600 mt-1">{editFileUploadError}</div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Annuler</Button>
            <Button onClick={async () => {
              if (!contractToEdit) return;
              try {
                let updateData: any;
                if (isPlayerContract(contractToEdit)) {
                  updateData = {
                    title: editForm.title,
                    salary: Number(editForm.salary),
                    startDate: editForm.startDate,
                    endDate: editForm.endDate,
                    hasBonus: editForm.hasBonus,
                    signatureBonus: editForm.signatureBonus ? Number(editForm.signatureBonus) : undefined,
                    description: editForm.description,
                    playerId: editForm.playerId ? Number(editForm.playerId) : undefined,
                    contractFileId: editUploadedFileId
                      ? editUploadedFileId
                      : contractToEdit.contractFile?.id
                        ? contractToEdit.contractFile.id
                        : undefined,
                  };
                  const result = await dispatch(updatePlayerContract({ id: contractToEdit.id.toString(), data: updateData }));
                  if (updatePlayerContract.fulfilled.match(result)) {
                    showToast("Contrat joueur mis à jour avec succès", "success", "Succès")
                  } else {
                    showToast("Erreur lors de la mise à jour du contrat joueur", "error", "Erreur")
                  }
                } else if (isStaffContract(contractToEdit)) {
                  updateData = {
                    title: editForm.title,
                    salary: Number(editForm.salary),
                    startDate: editForm.startDate,
                    endDate: editForm.endDate,
                    hasBonus: editForm.hasBonus,
                    signatureBonus: editForm.signatureBonus ? Number(editForm.signatureBonus) : undefined,
                    description: editForm.description,
                    staffId: editForm.staffId ? Number(editForm.staffId) : undefined,
                    benefits: editForm.benefits,
                    terms: editForm.terms,
                    contractFileId: editUploadedFileId
                      ? editUploadedFileId
                      : contractToEdit.contractFile?.id
                        ? contractToEdit.contractFile.id
                        : undefined,
                  };
                  const result = await dispatch(updateStaffContract({ id: contractToEdit.id.toString(), data: updateData }));
                  if (updateStaffContract.fulfilled.match(result)) {
                    showToast("Contrat staff mis à jour avec succès", "success", "Succès")
                  } else {
                    showToast("Erreur lors de la mise à jour du contrat staff", "error", "Erreur")
                  }
                }
                setIsEditDialogOpen(false);
                setContractToEdit(null);
                setEditForm(null);
                setEditFile(null);
                setEditUploadedFileId(null);
                setEditFileUploadError(null);
                // Refresh contract list after update
                dispatch(fetchAllContracts());
              } catch (error: any) {
                console.error("Erreur lors de la mise à jour:", error);
                const errorMessage = error?.message || "Erreur lors de la mise à jour du contrat"
                showToast(errorMessage, "error", "Erreur")
              }
            }}>Sauvegarder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Notification */}
      <ToastNotification toast={toastState} onClose={hideToast} />
    </div>
  )
}
