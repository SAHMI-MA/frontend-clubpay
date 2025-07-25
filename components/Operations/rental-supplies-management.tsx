"use client"

import { useState, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { 
  fetchAllAcquisitions, 
  createAcquisition, 
  updateAcquisition, 
  deleteAcquisition,
  approveOrRejectAcquisition,
  setSelectedAcquisition  
} from "@/lib/redux/acquisitionSlice"
import { fetchAllSuppliers } from "@/lib/redux/supplierSlice"
import { fetchAllTeams } from "@/lib/redux/teamSlice"
import { fetchAllPlayers } from "@/lib/redux/playerSlice"
import { fetchAllStaff } from "@/lib/redux/staffSlice"
import { 
  Acquisition, 
  AcquisitionType, 
  ApprovalStatus, 
  ItemType, 
  CreateAcquisitionDto, 
  UpdateAcquisitionDto,
  AssigneeType 
} from "@/lib/types/supplier-management"
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
import { useToast, ToastNotification } from "@/components/ui/toast-notification"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Edit,
  Search,
  Trash2,
  Plus,
  Package,
  ShoppingCart,
  Calendar,
  DollarSign,
  Building,
  User,
  Users,
  Eye,
  CheckCircle,
} from "lucide-react"



const acquisitionTypeLabels = {
  [AcquisitionType.RENTAL]: "Location",
  [AcquisitionType.PURCHASE]: "Achat"
}

const statusLabels = {
  [ApprovalStatus.PENDING]: "En attente",
  [ApprovalStatus.APPROVED]: "Approuvée",
  [ApprovalStatus.REJECTED]: "Rejetée",
  [ApprovalStatus.DELIVERED]: "Livrée",
  [ApprovalStatus.RETURNED]: "Retournée",
  [ApprovalStatus.CANCELLED]: "Annulée"
}

export function RentalSupplierManagement() {

  // Allowed file types for upload
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'text/plain',
  ];
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'];

  // File upload handler for quotation file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      // If file input is cleared, remove fileId and fileName from state
      setNewAcquisition((prev) => ({ ...prev, quotationFileId: undefined }));
      setUploadedFileName(null);
      return;
    }

    // Validate file type by MIME and extension
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    const hasAllowedMime = allowedMimeTypes.includes(fileType);
    const hasAllowedExt = allowedExtensions.some(ext => fileName.endsWith(ext));
    if (!hasAllowedMime && !hasAllowedExt) {
      setUploadError('Type de fichier non autorisé. Autorisés : PDF, DOC, DOCX, JPG, JPEG, PNG, TXT.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadedFileName(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Dynamically import getApiUrl and token utils
      const { getApiUrl } = await import('@/lib/api-config');
      const { tokenUtils } = await import('@/lib/api');
      const url = getApiUrl('/acquisitions/upload-file');
      const authToken = tokenUtils.getAuthToken();
      const headers: HeadersInit = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      const res = await fetch(url, {
        method: 'POST',
        body: formData,
        headers,
        credentials: 'include',
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Échec du téléversement du fichier.');
      }
      const data = await res.json();
      if (data && data.id) {
        // Force update quotationFileId in state
        setNewAcquisition((prev) => ({
          ...prev,
          quotationFileId: Number(data.id)
        }));
        setUploadedFileName(file.name);
      } else {
        setUploadError('Échec de l\'upload : Aucun ID de fichier retourné.');
        setNewAcquisition((prev) => ({
          ...prev,
          quotationFileId: undefined
        }));
        setUploadedFileName(null);
      }
    } catch (error: any) {
      setUploadError(error?.message || 'Échec du téléversement du fichier.');
    } finally {
      setUploading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSupplierId, setSelectedSupplierId] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  
  // Dialog states
  const [isAddAcquisitionDialogOpen, setIsAddAcquisitionDialogOpen] = useState(false)
  const [isEditAcquisitionDialogOpen, setIsEditAcquisitionDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  // Selected items
  const [itemToDelete, setItemToDelete] = useState<{ type: string; item: any } | null>(null)

  // Redux
  const dispatch = useAppDispatch()
  const { acquisitions: acquisitionsList, selectedAcquisition} = useAppSelector((state) => state.acquisitions)
  const { suppliers: suppliersList } = useAppSelector((state) => state.suppliers)
  const { teams } = useAppSelector((state) => state.teams)
  const { players } = useAppSelector((state) => state.players)
  const { staff } = useAppSelector((state) => state.staff)
  const { user: currentUser } = useAppSelector((state) => state.auth)
  
  // Toast notifications
  const { toastState, showToast, hideToast } = useToast()

  // Load data on component mount
  useEffect(() => {
    dispatch(fetchAllAcquisitions())
    dispatch(fetchAllSuppliers())
    dispatch(fetchAllTeams())
    dispatch(fetchAllPlayers())
    dispatch(fetchAllStaff())
  }, [dispatch])

  // Form states
  const [newAcquisition, setNewAcquisition] = useState<CreateAcquisitionDto & {
    itemName?: string;
    unitPrice?: number;
    notes?: string;
    assigneeType?: AssigneeType;
    assigneeId?: string;
    createdBy?: number;
    quotationFileId?: number;
  }>({
    acquisitionType: AcquisitionType.RENTAL,
    itemType: ItemType.EQUIPMENT,
    description: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: undefined,
    cost: 0,
    supplierId: 0,
    quantity: 1,
    // UI fields
    itemName: "",
    unitPrice: 0,
    notes: "",
    createdBy: currentUser?.id || 0,
    quotationFileId: undefined,
  })
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Approving state - track which acquisition is being approved
  const [approvingId, setApprovingId] = useState<number | null>(null);

  // Filter functions
  const filteredAcquisitions = acquisitionsList.filter((acquisition) => {
    const matchesSearch =
      acquisition.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acquisition.player?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acquisition.player?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acquisition.team?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acquisition.staff?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acquisition.staff?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSupplier = selectedSupplierId === "all" || 
      (acquisition.supplier && acquisition.supplier.id.toString() === selectedSupplierId)
    
    const matchesType = selectedType === "all" || acquisition.acquisitionType === selectedType
    
    return matchesSearch && matchesSupplier && matchesType
  })

  // Helper functions
  const getSupplierName = (acquisition: Acquisition | null) => {
    if (!acquisition) return "Fournisseur inconnu";
    
    // First, check if the acquisition has a supplier object
    if (acquisition.supplier && acquisition.supplier.name) {
      return acquisition.supplier.name;
    }
    
    // If we don't have a supplier object or it doesn't have a name, try to find it in the suppliers list
    // Note: This is a fallback for backward compatibility and should be rare if the API is returning nested supplier objects
    if (acquisition.supplier && acquisition.supplier.id) {
      const supplier = suppliersList.find((s) => s.id === acquisition.supplier?.id);
      if (supplier) {
        return supplier.name;
      }
    }
    
    return "Fournisseur inconnu";
  }

  const getAssigneeName = (acquisition: Acquisition | null): string => {
    if (!acquisition) return "Non affecté";
    
    if (acquisition.team) {
      return acquisition.team.name;
    } else if (acquisition.player) {
      return `${acquisition.player.firstName} ${acquisition.player.lastName}`;
    } else if (acquisition.staff) {
      return `${acquisition.staff.firstName} ${acquisition.staff.lastName}`;
    } else {
      return "Non affecté";
    }
  }

  const getStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case ApprovalStatus.PENDING:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case ApprovalStatus.APPROVED:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case ApprovalStatus.DELIVERED:
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case ApprovalStatus.RETURNED:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
      case ApprovalStatus.CANCELLED:
      case ApprovalStatus.REJECTED:
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getTypeColor = (type: AcquisitionType) => {
    return type === AcquisitionType.RENTAL
      ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
  }

  // Extended helper functions to bridge API model and UI needs
  const getAcquisitionDisplayName = (acquisition: Acquisition | null): string => {
    return acquisition?.description || "Article sans nom";
  }
  
  const getAcquisitionTotal = (acquisition: Acquisition | null): number => {
    if (!acquisition) return 0;
    
    // Calculate the total cost based on cost and quantity
    const cost = acquisition.cost || 0;
    const quantity = acquisition.quantity || 1;
    return cost * quantity;
  }
  
  const getAcquisitionDate = (acquisition: Acquisition | null): Date => {
    if (!acquisition) return new Date();
    
    // Try to use createdAt if available, fall back to current date
    try {
      return acquisition.createdAt ? new Date(acquisition.createdAt) : new Date();
    } catch (e) {
      console.error("Error parsing date:", e);
      return new Date();
    }
  }
  
  const getAcquisitionStatus = (acquisition: Acquisition | null): ApprovalStatus => {
    if (!acquisition) return ApprovalStatus.PENDING;
    
    // Use the approvalStatus or default to PENDING
    return acquisition.approvalStatus || ApprovalStatus.PENDING;
  }

  // Helper for mapping between assignee type and corresponding ID field
  const getAssigneeIdField = (assigneeType: AssigneeType | undefined): 'teamId' | 'playerId' | 'staffId' | null => {
    if (!assigneeType) return null;
    switch (assigneeType) {
      case AssigneeType.TEAM:
        return 'teamId';
      case AssigneeType.PLAYER:
        return 'playerId';
      case AssigneeType.STAFF:
        return 'staffId';
      default:
        return null;
    }
  }

  // Event handlers
  const handleAddAcquisition = () => {
    const acquisitionData: CreateAcquisitionDto & { createdBy: number; quotationFileId?: number } = {
      acquisitionType: newAcquisition.acquisitionType,
      itemType: newAcquisition.itemType,
      itemName: newAcquisition.itemName,
      description: newAcquisition.description || newAcquisition.itemName || '', // Use description or itemName
      startDate: newAcquisition.startDate,
      endDate: newAcquisition.endDate,
      cost: newAcquisition.unitPrice ? (newAcquisition.unitPrice * (newAcquisition.quantity || 1)) : newAcquisition.cost,
      supplierId: newAcquisition.supplierId,
      quantity: newAcquisition.quantity,
      createdBy: currentUser?.id || 0,
      quotationFileId: newAcquisition.quotationFileId,
    }
    if (newAcquisition.assigneeType && newAcquisition.assigneeId) {
      const assigneeId = parseInt(newAcquisition.assigneeId, 10);
      const assigneeField = getAssigneeIdField(newAcquisition.assigneeType);
      if (assigneeField) {
        acquisitionData[assigneeField] = assigneeId;
      }
    }
    dispatch(createAcquisition(acquisitionData))
      .unwrap()
      .then(() => {
        setIsAddAcquisitionDialogOpen(false)
        resetNewAcquisition()
      })
      .catch((error) => {
        console.error("Échec de l'ajout de l'acquisition:", error)
      })
  }

  const resetNewAcquisition = () => {
    // Reset with empty values instead of dummy data
    setNewAcquisition({
      acquisitionType: AcquisitionType.RENTAL,
      itemType: ItemType.EQUIPMENT,
      description: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: undefined,
      cost: 0,
      supplierId: 0,
      quantity: 1,
      itemName: "",
      unitPrice: 0,  
      notes: "",
      createdBy: currentUser?.id || 0,
    })
  }

  const handleEditAcquisition = (acquisition: Acquisition) => {
    console.log('Selected acquisition for edit:', acquisition);
    dispatch(setSelectedAcquisition(acquisition));
    setNewAcquisition(prev => ({
      ...prev,
      itemName: acquisition.itemName || '',
      description: acquisition.description || '',
      quantity: acquisition.quantity || 1,
      unitPrice: acquisition.cost && acquisition.quantity ? acquisition.cost / acquisition.quantity : 0,
      quotationFileId: acquisition.quotationFile ? acquisition.quotationFile.id : undefined,
    }));
    setUploadedFileName(acquisition.quotationFile?.fileName || null);
    setIsEditAcquisitionDialogOpen(true);
  }

  const handleUpdateAcquisition = () => {
    if (selectedAcquisition && selectedAcquisition.id) {
      // Always use the latest uploaded file's ID if present
      const updateData: UpdateAcquisitionDto & { createdBy: number } = {
        acquisitionType: newAcquisition.acquisitionType ?? selectedAcquisition.acquisitionType,
        itemType: newAcquisition.itemType ?? selectedAcquisition.itemType,
        itemName: newAcquisition.itemName ?? selectedAcquisition.itemName,
        description: newAcquisition.description ?? selectedAcquisition.description ?? selectedAcquisition.itemName ?? '',
        startDate: newAcquisition.startDate ?? selectedAcquisition.startDate,
        endDate: newAcquisition.endDate ?? selectedAcquisition.endDate,
        cost: newAcquisition.unitPrice !== undefined && newAcquisition.unitPrice !== null
          ? (newAcquisition.unitPrice * (newAcquisition.quantity || 1))
          : (selectedAcquisition.cost ?? 0),
        supplierId: newAcquisition.supplierId ?? selectedAcquisition.supplierId,
        quantity: newAcquisition.quantity ?? selectedAcquisition.quantity,
        quotationFileId:
          typeof newAcquisition.quotationFileId === 'number' && newAcquisition.quotationFileId > 0
            ? newAcquisition.quotationFileId
            : (typeof selectedAcquisition.quotationFile?.id === 'number' ? selectedAcquisition.quotationFile.id : 0),
        createdBy: currentUser?.id || 0,
      };
      console.log('Update acquisition payload:', updateData);
      // Handle assignee fields
      if (newAcquisition.assigneeType && newAcquisition.assigneeId) {
        const assigneeId = parseInt(newAcquisition.assigneeId, 10);
        const assigneeField = getAssigneeIdField(newAcquisition.assigneeType);
        if (assigneeField) {
          (updateData as any)[assigneeField] = assigneeId;
        }
      } else {
        // fallback to selectedAcquisition assignee fields
        if (selectedAcquisition.team?.id) updateData.teamId = selectedAcquisition.team.id;
        if (selectedAcquisition.player?.id) updateData.playerId = selectedAcquisition.player.id;
        if (selectedAcquisition.staff?.id) updateData.staffId = selectedAcquisition.staff.id;
      }
      dispatch(updateAcquisition({ id: selectedAcquisition.id, data: updateData }))
        .unwrap()
        .then(() => {
          setIsEditAcquisitionDialogOpen(false);
          resetNewAcquisition();
        })
        .catch((error) => {
          console.error("Échec de la mise à jour de l'acquisition:", error);
        });
    }
  }

  const handleDelete = (type: string, item: Acquisition) => {
    setItemToDelete({ type, item })
    dispatch(setSelectedAcquisition(item))
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (itemToDelete?.type === "acquisition" && selectedAcquisition?.id) {
      try {
        console.log(`Attempting to delete acquisition with ID: ${selectedAcquisition.id}`);
        // Using unwrap() will throw an error if the action is rejected
        await dispatch(deleteAcquisition(selectedAcquisition.id)).unwrap();
        
        console.log(`Successfully deleted acquisition ${selectedAcquisition.id}`);
        
        // Clear UI state after successful deletion
        setIsDeleteDialogOpen(false);
        setItemToDelete(null);
        
        // Show success toast
        showToast(
          "Acquisition supprimée avec succès", 
          "success", 
          "Succès"
        );
        
        // Refresh acquisitions list
        dispatch(fetchAllAcquisitions());
      } catch (error: any) {
        console.error("Échec de la suppression de l'acquisition:", error);
        
        // Show error toast with more detailed message
        showToast(
          `Échec de la suppression de l'acquisition : ${error.message || "Erreur inconnue"}`, 
          "error",
          "Erreur"
        );
      }
    }
  }

  const handleViewAcquisition = (acquisition: Acquisition) => {
    dispatch(setSelectedAcquisition(acquisition))
    setIsViewDialogOpen(true)
  }
  
  // Handle acquisition approval or rejection
  const handleApproveAcquisition = (acquisition: Acquisition) => {
    // Get the authenticated user ID from Redux or localStorage
    let approverId: number;
    
    if (currentUser?.id) {
      // Use the authenticated user from Redux state
      approverId = currentUser.id;
      console.log(`Using authenticated user ID from Redux: ${approverId}`);
    } else {
      // Fallback: Try to get user from localStorage
      const localStorageUser = localStorage.getItem('user');
      if (localStorageUser) {
        try {
          const parsedUser = JSON.parse(localStorageUser);
          approverId = parsedUser.id;
          console.log(`Using authenticated user ID from localStorage: ${approverId}`);
        } catch (error) {
          console.error('Failed to parse user from localStorage', error);
          showToast(
            `Impossible d'approuver l'acquisition : Vous devez être connecté.`,
            "error",
            "Erreur d'authentification"
          );
          return; // Exit early if we can't get a valid user ID
        }
      } else {
        showToast(
          `Impossible d'approuver l'acquisition : Vous devez être connecté.`,
          "error",
          "Erreur d'authentification"
        );
        return; // Exit early if we can't get a valid user ID
      }
    }
    
    // Create approval data with the authenticated user's ID
    const approvalData = {
      approvalStatus: ApprovalStatus.APPROVED,
      approverId, // Use the current user's ID
      approvalComments: "Approuvé depuis la gestion des locations et fournitures"
    };
    
    // Show loading state for this specific acquisition
    setApprovingId(acquisition.id);
    
    // Dispatch approve action with correct PUT endpoint format
    console.log(`Sending approval request for acquisition ID ${acquisition.id} with approverId ${approverId}:`, JSON.stringify(approvalData));
    dispatch(approveOrRejectAcquisition({ id: acquisition.id, approvalData }))
      .unwrap()
      .then(() => {
        // Show success notification
        console.log(`Successfully approved acquisition ID ${acquisition.id}`);
        showToast(
          `${getAcquisitionDisplayName(acquisition)} a été approuvée.`,
          "success",
          "Acquisition approuvée"
        );
      })
      .catch((error) => {
        console.error(`Error approving acquisition ID ${acquisition.id}:`, error);
        showToast(
          `Échec de l'approuve de ${getAcquisitionDisplayName(acquisition)} : ${error.message || 'Erreur inconnue'}`,
          "error",
          "Échec de l'approbation"
        );
      })
      .finally(() => {
        setApprovingId(null);
      });
  }

  // Statistics
  const totalAcquisitions = acquisitionsList.length
  const totalSpent = acquisitionsList.reduce((sum, a) => sum + (Number(a.cost) || 0), 0)
  const activeRentals = acquisitionsList.filter(
    (a) => a.acquisitionType === AcquisitionType.RENTAL && a.approvalStatus === ApprovalStatus.DELIVERED,
  ).length
  const pendingRequests = acquisitionsList.filter((a) => a.approvalStatus === ApprovalStatus.PENDING).length

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <ToastNotification toast={toastState} onClose={hideToast} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des locations et acquisitions</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérez les demandes de location et d'achat</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre total d'acquisitions</CardTitle>
            <Package className="h-4 w-4 text-blue-800" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalAcquisitions}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Historique</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total dépensé</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalSpent.toLocaleString()} MAD</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Cette année</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Locations actives</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{activeRentals}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Actuellement loué</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Demandes en attente</CardTitle>
            <ShoppingCart className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{pendingRequests}</div>
            <p className="text-xs text-yellow-600 mt-1">En attente d'approbation</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="acquisitions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="acquisitions" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Acquisitions
          </TabsTrigger>
        </TabsList>

        {/* Acquisitions Tab */}
        <TabsContent value="acquisitions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Acquisitions</CardTitle>
                  <CardDescription>Gérez les locations et achats pour les équipes, joueurs et staff</CardDescription>
                </div>
                <Dialog open={isAddAcquisitionDialogOpen} onOpenChange={setIsAddAcquisitionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-800 hover:bg-blue-900 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Nouvelle acquisition
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Créer une nouvelle acquisition</DialogTitle>
                      <DialogDescription>Ajouter une nouvelle demande de location ou d'achat</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="type">Type</Label>
                          <Select
                            value={newAcquisition.acquisitionType}
                            onValueChange={(value) => setNewAcquisition({ ...newAcquisition, acquisitionType: value as AcquisitionType })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner le type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={AcquisitionType.RENTAL}>Location</SelectItem>
                              <SelectItem value={AcquisitionType.PURCHASE}>Achat</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="supplier">Fournisseur</Label>
                          <Select
                            value={newAcquisition.supplierId.toString()}
                            onValueChange={(value) => setNewAcquisition({ ...newAcquisition, supplierId: parseInt(value, 10) })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un fournisseur" />
                            </SelectTrigger>
                            <SelectContent>
                              {suppliersList
                                .filter((s) => s.isActive)
                                .map((supplier) => (
                                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                    {supplier.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="itemName">Nom de l'article</Label>
                        <Input
                          id="itemName"
                          value={newAcquisition.itemName}
                          onChange={(e) => setNewAcquisition({ ...newAcquisition, itemName: e.target.value })}
                          placeholder="Entrez le nom de l'article"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newAcquisition.description}
                          onChange={(e) => setNewAcquisition({ ...newAcquisition, description: e.target.value })}
                          placeholder="Entrez la description de l'article"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="quantity">Quantité</Label>
                          <Input
                            id="quantity"
                            type="number"
                            value={newAcquisition.quantity}
                            onChange={(e) => setNewAcquisition({ ...newAcquisition, quantity: parseInt(e.target.value, 10) })}
                            placeholder="Entrez la quantité"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="unitPrice">Prix unitaire</Label>
                          <Input
                            id="unitPrice"
                            type="number"
                            step="0.01"
                            value={newAcquisition.unitPrice}
                            onChange={(e) => setNewAcquisition({ ...newAcquisition, unitPrice: parseFloat(e.target.value) })}
                            placeholder="Entrez le prix unitaire"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="assigneeType">Affecter à</Label>
                          <Select
                            value={newAcquisition.assigneeType}
                            onValueChange={(value) =>
                              setNewAcquisition({ ...newAcquisition, assigneeType: value as AssigneeType, assigneeId: "" })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner le type d'affectation" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={AssigneeType.TEAM}>Équipe</SelectItem>
                              <SelectItem value={AssigneeType.PLAYER}>Joueur</SelectItem>
                              <SelectItem value={AssigneeType.STAFF}>Staff</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="assigneeId">Affecté à</Label>
                          <Select
                            value={newAcquisition.assigneeId}
                            onValueChange={(value) => setNewAcquisition({ ...newAcquisition, assigneeId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner l'affecté" />
                            </SelectTrigger>
                            <SelectContent>
                              {newAcquisition.assigneeType === AssigneeType.TEAM && (
                                <>
                                  {teams.length > 0 ? (
                                    teams.map(team => (
                                      <SelectItem key={team.id} value={team.id.toString()}>
                                        {team.name}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <div className="px-3 py-2 text-sm text-gray-500">Aucune équipe trouvée</div>
                                  )}
                                </>
                              )}
                              {newAcquisition.assigneeType === AssigneeType.PLAYER && (
                                <>
                                  {players.length > 0 ? (
                                    players.map(player => (
                                      <SelectItem key={player.id} value={player.id.toString()}>
                                        {player.firstName} {player.lastName}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <div className="px-3 py-2 text-sm text-gray-500">Aucun joueur trouvé</div>
                                  )}
                                </>
                              )}
                              {newAcquisition.assigneeType === AssigneeType.STAFF && (
                                <>
                                  {staff.length > 0 ? (
                                    staff.map(staffMember => (
                                      <SelectItem key={staffMember.id} value={staffMember.id.toString()}>
                                        {staffMember.firstName} {staffMember.lastName} - {staffMember.role}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <div className="px-3 py-2 text-sm text-gray-500">Aucun staff trouvé</div>
                                  )}
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={newAcquisition.notes}
                          onChange={(e) => setNewAcquisition({ ...newAcquisition, notes: e.target.value })}
                          placeholder="Notes supplémentaires"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="quotationFile">Devis</Label>
                        <input
                          id="quotationFile"
                          type="file"
                          accept="application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,text/plain,.txt,image/*"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {uploading && <p className="text-xs text-blue-600">Téléversement...</p>}
                        {uploadedFileName && <p className="text-xs text-green-600">Téléversé : {uploadedFileName}</p>}
                        {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddAcquisitionDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleAddAcquisition} className="bg-blue-800 hover:bg-blue-900">
                        Créer l'acquisition
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Rechercher des acquisitions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value={AcquisitionType.RENTAL}>Location</SelectItem>
                    <SelectItem value={AcquisitionType.PURCHASE}>Achat</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les fournisseurs</SelectItem>
                    {suppliersList.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Acquisitions Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Article</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Affecté à</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Date d'approbation</TableHead>
                      <TableHead>Créé par</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAcquisitions.map((acquisition) => (
                      <TableRow key={acquisition.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{acquisition.itemName || "Article sans nom"}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                              {acquisition.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(acquisition.acquisitionType)}>{acquisitionTypeLabels[acquisition.acquisitionType] === 'Location' ? 'Location' : 'Achat'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {acquisition.team && <Building className="h-4 w-4" />}
                            {acquisition.player && <User className="h-4 w-4" />}
                            {acquisition.staff && <Users className="h-4 w-4" />}
                            <span className="text-sm">{getAssigneeName(acquisition)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getSupplierName(acquisition)}</TableCell>
                        <TableCell>{acquisition.quantity || 1}</TableCell>
                        <TableCell className="font-medium">{getAcquisitionTotal(acquisition).toLocaleString()} MAD</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(getAcquisitionStatus(acquisition))}>{statusLabels[getAcquisitionStatus(acquisition)] === 'En attente' ? 'En attente' : statusLabels[getAcquisitionStatus(acquisition)] === 'Approuvée' ? 'Approuvée' : statusLabels[getAcquisitionStatus(acquisition)] === 'Rejetée' ? 'Rejetée' : statusLabels[getAcquisitionStatus(acquisition)] === 'Livrée' ? 'Livrée' : statusLabels[getAcquisitionStatus(acquisition)] === 'Retournée' ? 'Retournée' : statusLabels[getAcquisitionStatus(acquisition)] === 'Annulée' ? 'Annulée' : statusLabels[getAcquisitionStatus(acquisition)]}</Badge>
                        </TableCell>
                        <TableCell>{getAcquisitionDate(acquisition).toLocaleDateString()}</TableCell>
                        <TableCell>{acquisition.approvalDate ? new Date(acquisition.approvalDate).toLocaleString() : '-'}</TableCell>
                        <TableCell>
                          {typeof acquisition.createdBy === 'object' && acquisition.createdBy !== null && 'firstName' in acquisition.createdBy && 'lastName' in acquisition.createdBy
                            ? `${acquisition.createdBy.firstName} ${acquisition.createdBy.lastName}`
                            : typeof acquisition.createdBy === 'number'
                              ? acquisition.createdBy
                              : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {acquisition.approvalStatus === ApprovalStatus.PENDING && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700"
                                onClick={() => handleApproveAcquisition(acquisition)}
                                title="Approuver l'acquisition"
                                disabled={approvingId === acquisition.id}
                              >
                                {approvingId === acquisition.id ? (
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent align-[-0.125em]"></span>
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleViewAcquisition(acquisition)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditAcquisition(acquisition)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() => handleDelete("acquisition", acquisition)}
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
        </TabsContent>
      </Tabs>

      {/*
        =============================
        View Acquisition Dialog
        =============================
        This section renders the dialog for viewing acquisition details.
      */}
      {/* View Acquisition Dialog with Tabs */}
      <Dialog open={isViewDialogOpen && selectedAcquisition !== null} onOpenChange={(open) => {
        if (!open) setIsViewDialogOpen(false);
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails de l'acquisition</DialogTitle>
          </DialogHeader>
          {selectedAcquisition && (
            <Tabs defaultValue="attributes" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="attributes">Attributs</TabsTrigger>
                <TabsTrigger value="quotation">Devis</TabsTrigger>
              </TabsList>
              <TabsContent value="attributes">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Article</Label>
                      <p className="font-medium">{selectedAcquisition.itemName || "Article sans nom"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Type</Label>
                      <Badge className={getTypeColor(selectedAcquisition.acquisitionType)}>
                        {acquisitionTypeLabels[selectedAcquisition.acquisitionType] === 'Location' ? 'Location' : 'Achat'}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</Label>
                    <p>{selectedAcquisition.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Quantité</Label>
                      <p>{selectedAcquisition.quantity || 1}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Coût</Label>
                      <p>{selectedAcquisition.cost} MAD</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Montant total</Label>
                      <p className="font-medium text-lg">{getAcquisitionTotal(selectedAcquisition).toLocaleString()} MAD</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Statut</Label>
                      <Badge className={getStatusColor(selectedAcquisition.approvalStatus)}>
                        {statusLabels[selectedAcquisition.approvalStatus] === 'En attente' ? 'En attente' : statusLabels[selectedAcquisition.approvalStatus] === 'Approuvée' ? 'Approuvée' : statusLabels[selectedAcquisition.approvalStatus] === 'Rejetée' ? 'Rejetée' : statusLabels[selectedAcquisition.approvalStatus] === 'Livrée' ? 'Livrée' : statusLabels[selectedAcquisition.approvalStatus] === 'Retournée' ? 'Retournée' : statusLabels[selectedAcquisition.approvalStatus] === 'Annulée' ? 'Annulée' : statusLabels[selectedAcquisition.approvalStatus]}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Fournisseur</Label>
                      <p>{getSupplierName(selectedAcquisition)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Affecté à</Label>
                      <p>{getAssigneeName(selectedAcquisition)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date de création</Label>
                      <p>{selectedAcquisition.createdAt ? new Date(selectedAcquisition.createdAt).toLocaleDateString() : "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date d'approbation</Label>
                      <p>{selectedAcquisition.approvalDate ? new Date(selectedAcquisition.approvalDate).toLocaleString() : "N/A"}</p>
                    </div>
                    {selectedAcquisition.startDate && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date de début</Label>
                        <p>{selectedAcquisition.startDate ? new Date(selectedAcquisition.startDate).toLocaleDateString() : "N/A"}</p>
                      </div>
                    )}
                  </div>

                  {selectedAcquisition.endDate && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date de fin</Label>
                      <p>{selectedAcquisition.endDate ? new Date(selectedAcquisition.endDate).toLocaleDateString() : "N/A"}</p>
                    </div>
                  )}

                  {selectedAcquisition.approvalComments && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Commentaires d'approbation</Label>
                      <p>{selectedAcquisition.approvalComments}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="quotation">
                <div className="space-y-4">
                  {selectedAcquisition.quotationFile && selectedAcquisition.quotationFile.url ? (
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Devis</Label>
                      <div className="flex flex-col gap-2">
                        {(() => {
                          const apiUrl = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : '';
                          const fileUrl = `${process.env.NEXT_PUBLIC_API_URL || apiUrl}${selectedAcquisition.quotationFile.url}`;
                          const fileType = selectedAcquisition.quotationFile.fileType;
                          if (fileType.startsWith('image/')) {
                            // Image preview
                            return <img src={fileUrl} alt="Devis" className="max-h-64 rounded border" style={{maxWidth: '100%'}} />;
                          } else if (fileType === 'application/pdf') {
                            // PDF preview
                            return <iframe src={fileUrl} title="Devis PDF" className="w-full" style={{height: '400px', border: '1px solid #ccc', borderRadius: '4px'}} />;
                          } else if (fileType === 'text/plain') {
                            // TXT preview
                            return <iframe src={fileUrl} title="Devis TXT" className="w-full" style={{height: '200px', border: '1px solid #ccc', borderRadius: '4px', background: '#fafafa'}} />;
                          } else {
                            // Fallback: download/view link
                            return (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-700 underline hover:text-blue-900"
                              >
                                {selectedAcquisition.quotationFile.fileName || 'Voir le fichier'}
                              </a>
                            );
                          }
                        })()}
                        <span className="text-xs text-gray-500">({selectedAcquisition.quotationFile.fileType}, {selectedAcquisition.quotationFile.fileSize} bytes)</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">Aucun devis disponible.</div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Acquisition Dialog */}
      <Dialog open={isEditAcquisitionDialogOpen && selectedAcquisition !== null} onOpenChange={(open) => {
        if (!open) setIsEditAcquisitionDialogOpen(false);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier l'acquisition</DialogTitle>
            <DialogDescription>Mettre à jour les informations de l'acquisition</DialogDescription>
          </DialogHeader>
          {selectedAcquisition && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="itemName">Nom de l'article</Label>
                <Input
                  id="itemName"
                  value={newAcquisition.itemName}
                  onChange={(e) => setNewAcquisition({ ...newAcquisition, itemName: e.target.value })}
                  placeholder="Entrez le nom de l'article"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newAcquisition.description}
                  onChange={(e) => setNewAcquisition({ ...newAcquisition, description: e.target.value })}
                  placeholder="Entrez la description de l'article"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantité</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newAcquisition.quantity}
                    onChange={(e) => setNewAcquisition({ ...newAcquisition, quantity: parseInt(e.target.value, 10) })}
                    placeholder="Entrez la quantité"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Prix unitaire</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    value={newAcquisition.unitPrice}
                    onChange={(e) => setNewAcquisition({ ...newAcquisition, unitPrice: parseFloat(e.target.value) })}
                    placeholder="Entrez le prix unitaire"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quotationFile">Devis</Label>
                <input
                  id="quotationFile"
                  type="file"
                  accept="application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,text/plain,.txt,image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploading && <p className="text-xs text-blue-600">Téléversement...</p>}
                {uploadedFileName && <p className="text-xs text-green-600">Téléversé : {uploadedFileName}</p>}
                {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditAcquisitionDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateAcquisition} className="bg-blue-800 hover:bg-blue-900">
              Mettre à jour l'acquisition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet élément ({itemToDelete?.type === 'acquisition' ? 'acquisition' : 'fournisseur'}) ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {itemToDelete && (
            <div className="py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {itemToDelete.type === "acquisition"
                  ? `Acquisition: ${getAcquisitionDisplayName(itemToDelete.item)}`
                  : `Fournisseur: ${itemToDelete.item.name}`}
              </p>
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

// Using imported toast types from the toast-notification component

// Using imported ToastNotification component
