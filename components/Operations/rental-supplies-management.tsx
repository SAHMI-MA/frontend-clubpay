"use client"



/**
 * Export a list of acquisitions to CSV
 * @param acquisitions Array of Acquisition objects
 */
export function exportAcquisitionsToCSV(acquisitions: Acquisition[]) {
  const header = ['ID', 'Name', 'Type', 'Supplier', 'Status', 'Total Cost (MAD)', 'Start Date', 'End Date', 'Assignee'];
  const rows = acquisitions.map(acquisition => [
    acquisition.id,
    acquisition.acquisitionName || '',
    acquisition.acquisitionType || '',
    acquisition.supplier?.name || '',
    acquisition.approvalStatus || '',
    acquisition.totalCost || 0,
    acquisition.startDate || '',
    acquisition.endDate || '',
    acquisition.team?.name || acquisition.player?.firstName + ' ' + acquisition.player?.lastName || acquisition.staff?.firstName + ' ' + acquisition.staff?.lastName || acquisition.employee?.fullName || ''
  ]);
  const csvContent = [header, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'acquisitions.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export a list of supplies to CSV
 * @param supplies Array of Supply objects
 */
export function exportSupplesToCSV(supplies: Supply[]) {
  const header = ['ID', 'Name', 'Description', 'Item Type', 'Condition', 'Quantity', 'Supplier'];
  const rows = supplies.map(supply => [
    supply.id,
    supply.name || '',
    supply.description || '',
    supply.itemType || '',
    supply.condition || '',
    supply.quantity || 0,
    supply.supplier?.name || ''
  ]);
  const csvContent = [header, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'supplies.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

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
import {
  fetchAllSupplies,
  createSupply,
  updateSupply,
  deleteSupply,
} from "@/lib/redux/suppliesSlice"
import { fetchAllTeams } from "@/lib/redux/teamSlice"
import { fetchAllPlayers } from "@/lib/redux/playerSlice"
import { fetchAllStaff } from "@/lib/redux/staffSlice"
import { fetchAllEmployees } from "@/lib/redux/employeeSlice"
import {
  Acquisition,
  AcquisitionType,
  ApprovalStatus,
  CreateAcquisitionDto,
  CreateAcquisitionSupplyDto,
  UpdateAcquisitionDto,
  AssigneeType,
  Supply,
  CreateSupplyDto,
  ItemType,
  SupplyCondition
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
  FileText,
  XCircle,
  Clock,
  Truck,
  RotateCcw,
  Ban,
  Briefcase,
} from "lucide-react"
import { AcquisitionForPDF } from "@/lib/jsPDF/pdf-export-utils";
import { generatePurchaseOrderPDF } from "@/lib/jsPDF/PurchaseOrderPDF";



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
  const { acquisitions: acquisitionsList, selectedAcquisition } = useAppSelector((state) => state.acquisitions)
  const { suppliers: suppliersList } = useAppSelector((state) => state.suppliers)
  const { supplies: suppliesList } = useAppSelector((state) => state.supplies)
  const { teams } = useAppSelector((state) => state.teams)
  const { players } = useAppSelector((state) => state.players)
  const { staff } = useAppSelector((state) => state.staff)
  const { employees } = useAppSelector((state) => state.employees)
  const { user: currentUser } = useAppSelector((state) => state.auth)

  // Toast notifications
  const { toastState, showToast, hideToast } = useToast()

  // Load data on component mount
  useEffect(() => {
    dispatch(fetchAllAcquisitions())
    dispatch(fetchAllSuppliers())
    dispatch(fetchAllSupplies())
    dispatch(fetchAllTeams())
    dispatch(fetchAllPlayers())
    dispatch(fetchAllStaff())
    dispatch(fetchAllEmployees())
  }, [dispatch])

  // Form states
  const [newAcquisition, setNewAcquisition] = useState<CreateAcquisitionDto & {
    assigneeType?: AssigneeType;
    assigneeId?: string;
    createdBy?: number;
    quotationFileId?: number;
  }>({
    acquisitionType: AcquisitionType.RENTAL,
    acquisitionName: "",
    description: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: undefined,
    supplies: [],
    supplierId: 0,
    // UI fields
    createdBy: currentUser?.id || 0,
    quotationFileId: undefined,
  })

  // State for managing supplies in the form
  const [currentSupply, setCurrentSupply] = useState<CreateAcquisitionSupplyDto>({
    supplyId: 0,
    quantity: 1,
    unitPrice: 0
  })

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Approving state - track which acquisition is being approved
  const [approvingId, setApprovingId] = useState<number | null>(null);

  // Supplies management state
  const [isAddSupplyDialogOpen, setIsAddSupplyDialogOpen] = useState(false)
  const [isEditSupplyDialogOpen, setIsEditSupplyDialogOpen] = useState(false)
  const [isDeleteSupplyDialogOpen, setIsDeleteSupplyDialogOpen] = useState(false)
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null)
  const [newSupply, setNewSupply] = useState<CreateSupplyDto>({
    name: "",
    description: "",
    itemType: ItemType.EQUIPMENT,
    quantity: 0,
    condition: SupplyCondition.NEW,
    supplierId: 0
  })

  // Debug: Log supplies data and add mock data if empty
  useEffect(() => {
    console.log('Supplies list:', suppliesList);
    console.log('Current supply state:', currentSupply);
    console.log('New acquisition state:', newAcquisition);

    // If no supplies loaded, you can create some mock supplies for testing
    if (suppliesList.length === 0) {
      console.log('No supplies loaded. This might be because the backend API endpoint for supplies is not yet implemented.');
      console.log('Try navigating to the supplies management page first to create some supplies, or check if the backend supplies endpoint exists.');
    }
  }, [suppliesList, currentSupply, newAcquisition])

  // Filter functions
  const filteredAcquisitions = acquisitionsList.filter((acquisition) => {
    const matchesSearch =
      acquisition.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acquisition.player?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acquisition.player?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acquisition.team?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acquisition.staff?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acquisition.staff?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acquisition.employee?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())

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
    } else if (acquisition.employee) {
      return acquisition.employee.fullName;
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

  // Helper functions for managing supplies
  const addSupplyToAcquisition = () => {
    if (currentSupply.supplyId > 0 && currentSupply.quantity > 0 && currentSupply.unitPrice > 0) {
      const supplyItem = suppliesList.find(s => s.id === currentSupply.supplyId);
      if (supplyItem) {
        // Check if supply already exists in the list
        const existingIndex = newAcquisition.supplies.findIndex(s => s.supplyId === currentSupply.supplyId);
        if (existingIndex >= 0) {
          // Update existing supply
          const updatedSupplies = [...newAcquisition.supplies];
          updatedSupplies[existingIndex] = { ...currentSupply };
          setNewAcquisition({ ...newAcquisition, supplies: updatedSupplies });
        } else {
          // Add new supply
          setNewAcquisition({
            ...newAcquisition,
            supplies: [...newAcquisition.supplies, { ...currentSupply }]
          });
        }
        // Reset current supply form
        setCurrentSupply({ supplyId: 0, quantity: 1, unitPrice: 0 });
      }
    }
  };

  const removeSupplyFromAcquisition = (index: number) => {
    const updatedSupplies = newAcquisition.supplies.filter((_, i) => i !== index);
    setNewAcquisition({ ...newAcquisition, supplies: updatedSupplies });
  };

  const getTotalSupplyCost = () => {
    return newAcquisition.supplies.reduce((total, supply) => total + (supply.quantity * supply.unitPrice), 0);
  };

  // Helper functions to bridge API model and UI needs
  const getAcquisitionDisplayName = (acquisition: Acquisition | null): string => {
    return acquisition?.acquisitionName || acquisition?.description || "Acquisition sans nom";
  }

  const getAcquisitionTotal = (acquisition: Acquisition | null): number => {
    if (!acquisition) return 0;
    return acquisition.totalCost || 0;
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
  const getAssigneeIdField = (assigneeType: AssigneeType | undefined): 'teamId' | 'playerId' | 'staffId' | 'employeeId' | null => {
    if (!assigneeType) return null;
    switch (assigneeType) {
      case AssigneeType.TEAM:
        return 'teamId';
      case AssigneeType.PLAYER:
        return 'playerId';
      case AssigneeType.STAFF:
        return 'staffId';
      case AssigneeType.EMPLOYEE:
        return 'employeeId';
      default:
        return null;
    }
  }

  // Event handlers
  const handleAddAcquisition = () => {
    const acquisitionData: CreateAcquisitionDto & { createdBy: number; quotationFileId?: number } = {
      acquisitionType: newAcquisition.acquisitionType,
      acquisitionName: newAcquisition.acquisitionName,
      description: newAcquisition.description,
      startDate: newAcquisition.startDate,
      endDate: newAcquisition.endDate,
      supplies: newAcquisition.supplies,
      supplierId: newAcquisition.supplierId || undefined,
      createdBy: currentUser?.id || 0,
      quotationFileId: newAcquisition.quotationFileId,
    }

    if (newAcquisition.assigneeType && newAcquisition.assigneeId) {
      const assigneeField = getAssigneeIdField(newAcquisition.assigneeType);
      if (assigneeField) {
        if (assigneeField === 'employeeId') {
          // For employees, use the string ID directly
          acquisitionData[assigneeField] = newAcquisition.assigneeId;
        } else {
          // For other assignees, parse as integer
          const assigneeId = parseInt(newAcquisition.assigneeId, 10);
          acquisitionData[assigneeField] = assigneeId;
        }
      }
    }

    dispatch(createAcquisition(acquisitionData))
      .unwrap()
      .then(() => {
        setIsAddAcquisitionDialogOpen(false)
        resetNewAcquisition()
        showToast("Acquisition créée avec succès", "success", "Succès")
      })
      .catch((error) => {
        console.error("Échec de l'ajout de l'acquisition:", error)
        showToast(`Échec de la création de l'acquisition: ${error.message}`, "error", "Erreur")
      })
  }

  const resetNewAcquisition = () => {
    // Reset with empty values instead of dummy data
    setNewAcquisition({
      acquisitionType: AcquisitionType.RENTAL,
      acquisitionName: "",
      description: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: undefined,
      supplies: [],
      supplierId: 0,
      createdBy: currentUser?.id || 0,
    })
    setCurrentSupply({
      supplyId: 0,
      quantity: 1,
      unitPrice: 0
    })
    setUploadedFileName(null)
    setUploadError(null)
  }

  const handleEditAcquisition = (acquisition: Acquisition) => {
    console.log('Selected acquisition for edit:', acquisition);
    dispatch(setSelectedAcquisition(acquisition));
    setNewAcquisition(prev => ({
      ...prev,
      acquisitionName: acquisition.acquisitionName || '',
      description: acquisition.description || '',
      supplies: acquisition.acquisitionSupplies?.map(as => ({
        supplyId: as.supply.id,
        quantity: as.quantity,
        unitPrice: as.unitPrice
      })) || [],
      quotationFileId: acquisition.quotationFile ? acquisition.quotationFile.id : undefined,
    }));
    setUploadedFileName(acquisition.quotationFile?.fileName || null);
    setIsEditAcquisitionDialogOpen(true);
  }

  const handleUpdateAcquisition = () => {
    if (selectedAcquisition && selectedAcquisition.id) {
      const updateData: UpdateAcquisitionDto & { createdBy: number } = {
        acquisitionType: newAcquisition.acquisitionType ?? selectedAcquisition.acquisitionType,
        acquisitionName: newAcquisition.acquisitionName ?? selectedAcquisition.acquisitionName,
        description: newAcquisition.description ?? selectedAcquisition.description,
        startDate: newAcquisition.startDate ?? selectedAcquisition.startDate,
        endDate: newAcquisition.endDate ?? selectedAcquisition.endDate,
        supplies: newAcquisition.supplies && newAcquisition.supplies.length > 0 ? newAcquisition.supplies : undefined,
        supplierId: newAcquisition.supplierId ?? selectedAcquisition.supplierId,
        quotationFileId:
          typeof newAcquisition.quotationFileId === 'number' && newAcquisition.quotationFileId > 0
            ? newAcquisition.quotationFileId
            : (typeof selectedAcquisition.quotationFile?.id === 'number' ? selectedAcquisition.quotationFile.id : undefined),
        createdBy: currentUser?.id || 0,
      };

      // Handle assignee fields
      if (newAcquisition.assigneeType && newAcquisition.assigneeId) {
        const assigneeField = getAssigneeIdField(newAcquisition.assigneeType);
        if (assigneeField) {
          if (assigneeField === 'employeeId') {
            // For employees, use the string ID directly
            (updateData as any)[assigneeField] = newAcquisition.assigneeId;
          } else {
            // For other assignees, parse as integer
            const assigneeId = parseInt(newAcquisition.assigneeId, 10);
            (updateData as any)[assigneeField] = assigneeId;
          }
        }
      } else {
        // fallback to selectedAcquisition assignee fields
        if (selectedAcquisition.team?.id) updateData.teamId = selectedAcquisition.team.id;
        if (selectedAcquisition.player?.id) updateData.playerId = selectedAcquisition.player.id;
        if (selectedAcquisition.staff?.id) updateData.staffId = selectedAcquisition.staff.id;
        if (selectedAcquisition.employee?.employeeId) updateData.employeeId = selectedAcquisition.employee.employeeId;
      }

      dispatch(updateAcquisition({ id: selectedAcquisition.id, data: updateData }))
        .unwrap()
        .then(() => {
          setIsEditAcquisitionDialogOpen(false);
          resetNewAcquisition();
          showToast("Acquisition mise à jour avec succès", "success", "Succès");
        })
        .catch((error) => {
          console.error("Échec de la mise à jour de l'acquisition:", error);
          showToast(`Échec de la mise à jour: ${error.message}`, "error", "Erreur");
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

  // Supplies CRUD handlers
  const handleAddSupply = () => {
    dispatch(createSupply(newSupply))
      .unwrap()
      .then(() => {
        setIsAddSupplyDialogOpen(false)
        resetNewSupply()
        showToast("Fourniture créée avec succès", "success", "Succès")
      })
      .catch((error) => {
        console.error("Échec de l'ajout de la fourniture:", error)
        showToast(`Échec de la création de la fourniture: ${error.message}`, "error", "Erreur")
      })
  }

  const resetNewSupply = () => {
    setNewSupply({
      name: "",
      description: "",
      itemType: ItemType.EQUIPMENT,
      quantity: 0,
      condition: SupplyCondition.NEW,
      supplierId: 0
    })
  }

  const handleEditSupply = (supply: Supply) => {
    setSelectedSupply(supply)
    setNewSupply({
      name: supply.name || '',
      description: supply.description || '',
      itemType: supply.itemType || ItemType.EQUIPMENT,
      quantity: supply.quantity || 0,
      condition: supply.condition || SupplyCondition.NEW,
      supplierId: 0 // We'll need to handle this properly
    })
    setIsEditSupplyDialogOpen(true)
  }

  const handleUpdateSupply = () => {
    if (selectedSupply && selectedSupply.id) {
      dispatch(updateSupply({ id: selectedSupply.id, data: newSupply }))
        .unwrap()
        .then(() => {
          setIsEditSupplyDialogOpen(false)
          resetNewSupply()
          setSelectedSupply(null)
          showToast("Fourniture mise à jour avec succès", "success", "Succès")
        })
        .catch((error) => {
          console.error("Échec de la mise à jour de la fourniture:", error)
          showToast(`Échec de la mise à jour: ${error.message}`, "error", "Erreur")
        })
    }
  }

  const handleDeleteSupply = (supply: any) => {
    setSelectedSupply(supply)
    setIsDeleteSupplyDialogOpen(true)
  }

  const confirmDeleteSupply = async () => {
    if (selectedSupply?.id) {
      try {
        await dispatch(deleteSupply(selectedSupply.id)).unwrap()
        setIsDeleteSupplyDialogOpen(false)
        setSelectedSupply(null)
        showToast("Fourniture supprimée avec succès", "success", "Succès")
        dispatch(fetchAllSupplies())
      } catch (error: any) {
        console.error("Échec de la suppression de la fourniture:", error)
        showToast(`Échec de la suppression: ${error.message}`, "error", "Erreur")
      }
    }
  }

  // Export acquisition as purchase order PDF
  const handleExportPurchaseOrder = (acquisition: Acquisition) => {
    try {
      // Convert the acquisition to the format expected by the PDF generator
      const acquisitionForPDF: AcquisitionForPDF = {
        id: acquisition.id,
        acquisitionName: acquisition.acquisitionName,
        description: acquisition.description,
        acquisitionType: acquisition.acquisitionType,
        startDate: acquisition.startDate || new Date().toISOString().split('T')[0],
        endDate: acquisition.endDate,
        totalCost: acquisition.totalCost || 0,
        approvalStatus: acquisition.approvalStatus,
        createdAt: acquisition.createdAt || new Date().toISOString(),
        supplier: acquisition.supplier ? {
          name: acquisition.supplier.name,
          address: (acquisition.supplier as any).address || '',
          phone: (acquisition.supplier as any).phone || '',
          email: (acquisition.supplier as any).email || ''
        } : undefined,
        acquisitionSupplies: acquisition.acquisitionSupplies?.map(as => ({
          supply: {
            name: as.supply.name,
            description: as.supply.description
          },
          quantity: as.quantity,
          unitPrice: as.unitPrice
        })),
        team: acquisition.team ? { name: acquisition.team.name } : undefined,
        player: acquisition.player ? {
          firstName: acquisition.player.firstName,
          lastName: acquisition.player.lastName
        } : undefined,
        staff: acquisition.staff ? {
          firstName: acquisition.staff.firstName,
          lastName: acquisition.staff.lastName
        } : undefined,
        employee: acquisition.employee ? {
          fullName: acquisition.employee.fullName
        } : undefined
      };

      generatePurchaseOrderPDF(acquisitionForPDF);
      showToast("Bon de réception généré avec succès", "success", "Export PDF");
    } catch (error: any) {
      console.error("Erreur lors de l'export PDF:", error);
      showToast(`Échec de l'export PDF: ${error.message}`, "error", "Erreur");
    }
  }

  // Statistics
  const totalAcquisitions = acquisitionsList.length
  const totalSpent = acquisitionsList.reduce((sum, a) => sum + (Number(a.totalCost) || 0), 0)
  const activeRentals = acquisitionsList.filter(
    (a) => a.acquisitionType === AcquisitionType.RENTAL && a.approvalStatus === ApprovalStatus.DELIVERED,
  ).length
  const pendingRequests = acquisitionsList.filter((a) => a.approvalStatus === ApprovalStatus.PENDING).length

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <ToastNotification toast={toastState} onClose={hideToast} />

      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          className="bg-blue-800 hover:bg-blue-900 text-white mb-2"
          onClick={() => exportAcquisitionsToCSV(acquisitionsList)}
        >
          Exporter les acquisitions (CSV)
        </Button>
      </div>

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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="acquisitions" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Acquisitions
          </TabsTrigger>
          <TabsTrigger value="supplies" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Fournitures
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
                  <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Créer une nouvelle acquisition</DialogTitle>
                      <DialogDescription>Ajouter une nouvelle demande de location ou d'achat</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                      <div className="grid grid-cols-2 gap-6">
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
                            value={newAcquisition.supplierId?.toString() || "0"}
                            onValueChange={(value) => setNewAcquisition({ ...newAcquisition, supplierId: parseInt(value, 10) })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un fournisseur" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Aucun fournisseur</SelectItem>
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
                        <Label htmlFor="acquisitionName">Nom de l'acquisition</Label>
                        <Input
                          id="acquisitionName"
                          value={newAcquisition.acquisitionName}
                          onChange={(e) => setNewAcquisition({ ...newAcquisition, acquisitionName: e.target.value })}
                          placeholder="Entrez le nom de l'acquisition"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newAcquisition.description}
                          onChange={(e) => setNewAcquisition({ ...newAcquisition, description: e.target.value })}
                          placeholder="Entrez la description de l'acquisition"
                          rows={3}
                        />
                      </div>

                      {/* Supplies Management Section */}
                      <div className="space-y-4 border-t pt-4">
                        <h4 className="font-medium text-gray-900 dark:text-white">Fournitures</h4>

                        {/* Add Supply Form */}
                        <div className="grid grid-cols-4 gap-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="col-span-2 space-y-2">
                            <Label htmlFor="supplySelect">Fourniture</Label>
                            <Select
                              value={currentSupply.supplyId.toString()}
                              onValueChange={(value) => setCurrentSupply({ ...currentSupply, supplyId: parseInt(value, 10) })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une fourniture" />
                              </SelectTrigger>
                              <SelectContent>
                                {suppliesList.length === 0 ? (
                                  <SelectItem value="0" disabled>Aucune fourniture disponible</SelectItem>
                                ) : (
                                  suppliesList.map((supply) => (
                                    <SelectItem key={supply.id} value={supply.id.toString()}>
                                      {supply.name} - {supply.quantity} disponible(s)
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="supplyQuantity">Quantité</Label>
                            <Input
                              id="supplyQuantity"
                              type="number"
                              min="1"
                              value={currentSupply.quantity}
                              onChange={(e) => setCurrentSupply({ ...currentSupply, quantity: parseInt(e.target.value, 10) })}
                              placeholder="Quantité"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="supplyUnitPrice">Prix unitaire</Label>
                            <Input
                              id="supplyUnitPrice"
                              type="number"
                              step="0.01"
                              min="0"
                              value={currentSupply.unitPrice}
                              onChange={(e) => setCurrentSupply({ ...currentSupply, unitPrice: parseFloat(e.target.value) })}
                              placeholder="Prix unitaire"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              onClick={addSupplyToAcquisition}
                              disabled={currentSupply.supplyId === 0 || currentSupply.quantity <= 0 || currentSupply.unitPrice <= 0}
                              className="bg-green-600 hover:bg-green-700 w-full"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Ajouter
                            </Button>
                          </div>
                        </div>

                        {/* Supplies List */}
                        {newAcquisition.supplies.length > 0 && (
                          <div className="space-y-2">
                            <Label>Fournitures sélectionnées</Label>
                            <div className="border rounded-lg p-3">
                              {newAcquisition.supplies.map((supply, index) => {
                                const supplyItem = suppliesList.find(s => s.id === supply.supplyId);
                                return (
                                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                                    <div>
                                      <span className="font-medium">{supplyItem?.name || `Fourniture #${supply.supplyId}`}</span>
                                      <span className="text-sm text-gray-500 ml-2">
                                        {supply.quantity} × {supply.unitPrice} MAD = {(supply.quantity * supply.unitPrice).toFixed(2)} MAD
                                      </span>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeSupplyFromAcquisition(index)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                              <div className="pt-2 mt-2 border-t">
                                <span className="font-medium">Total: {getTotalSupplyCost().toFixed(2)} MAD</span>
                              </div>
                            </div>
                          </div>
                        )}
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
                              <SelectItem value={AssigneeType.EMPLOYEE}>Employé</SelectItem>
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
                              {newAcquisition.assigneeType === AssigneeType.EMPLOYEE && (
                                <>
                                  {employees.length > 0 ? (
                                    employees.map(employee => (
                                      <SelectItem key={employee.employeeId} value={employee.employeeId}>
                                        {employee.fullName} ({employee.employeeId})
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <div className="px-3 py-2 text-sm text-gray-500">Aucun employé trouvé</div>
                                  )}
                                </>
                              )}
                            </SelectContent>
                          </Select>
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
                      <TableHead>ID</TableHead>
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
                        <TableCell className="font-medium">{acquisition.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{acquisition.acquisitionName || "Acquisition sans nom"}</p>
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
                            {acquisition.employee && <Briefcase className="h-4 w-4" />}
                            <span className="text-sm">{getAssigneeName(acquisition)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getSupplierName(acquisition)}</TableCell>
                        <TableCell>{acquisition.acquisitionSupplies?.length || 0} fourniture(s)</TableCell>
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

        {/* Supplies Tab */}
        <TabsContent value="supplies" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Fournitures</CardTitle>
                  <CardDescription>Gérez l'inventaire des fournitures et équipements</CardDescription>
                </div>
                <Dialog open={isAddSupplyDialogOpen} onOpenChange={setIsAddSupplyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-800 hover:bg-blue-900 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Nouvelle fourniture
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Créer une nouvelle fourniture</DialogTitle>
                      <DialogDescription>Ajouter une nouvelle fourniture à l'inventaire</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="supplyName">Nom de la fourniture</Label>
                        <Input
                          id="supplyName"
                          value={newSupply.name}
                          onChange={(e) => setNewSupply({ ...newSupply, name: e.target.value })}
                          placeholder="Entrez le nom de la fourniture"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supplyDescription">Description</Label>
                        <Textarea
                          id="supplyDescription"
                          value={newSupply.description}
                          onChange={(e) => setNewSupply({ ...newSupply, description: e.target.value })}
                          placeholder="Entrez la description de la fourniture"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="itemType">Type d'article</Label>
                          <Select
                            value={newSupply.itemType}
                            onValueChange={(value) => setNewSupply({ ...newSupply, itemType: value as ItemType })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner le type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ItemType.EQUIPMENT}>Équipement</SelectItem>
                              <SelectItem value={ItemType.UNIFORM}>Uniforme</SelectItem>
                              <SelectItem value={ItemType.MEDICAL}>Médical</SelectItem>
                              <SelectItem value={ItemType.VEHICLE}>Véhicule</SelectItem>
                              <SelectItem value={ItemType.APARTMENT}>Appartement</SelectItem>
                              <SelectItem value={ItemType.OTHER}>Autre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="condition">Condition</Label>
                          <Select
                            value={newSupply.condition}
                            onValueChange={(value) => setNewSupply({ ...newSupply, condition: value as SupplyCondition })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner la condition" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={SupplyCondition.NEW}>Neuf</SelectItem>
                              <SelectItem value={SupplyCondition.GOOD}>Bon</SelectItem>
                              <SelectItem value={SupplyCondition.FAIR}>Correct</SelectItem>
                              <SelectItem value={SupplyCondition.POOR}>Mauvais</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="quantity">Quantité</Label>
                          <Input
                            id="quantity"
                            type="number"
                            min="0"
                            value={newSupply.quantity}
                            onChange={(e) => setNewSupply({ ...newSupply, quantity: parseInt(e.target.value) || 0 })}
                            placeholder="Quantité disponible"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="supplierId">Fournisseur</Label>
                          <Select
                            value={newSupply.supplierId.toString()}
                            onValueChange={(value) => setNewSupply({ ...newSupply, supplierId: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un fournisseur" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Aucun fournisseur</SelectItem>
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
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddSupplyDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleAddSupply} className="bg-blue-800 hover:bg-blue-900">
                        Créer la fourniture
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Supplies Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliesList.map((supply) => (
                      <TableRow key={supply.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{supply.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                            {supply.description}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{supply.itemType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{supply.condition}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{supply.quantity}</TableCell>
                        <TableCell>{supply.supplier?.name || 'Non assigné'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditSupply(supply)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSupply(supply)}
                              className="text-red-600 hover:text-red-700"
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
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Détails de l'acquisition</DialogTitle>
                <DialogDescription>
                  {selectedAcquisition?.acquisitionName || "Acquisition sans nom"} - {selectedAcquisition && acquisitionTypeLabels[selectedAcquisition.acquisitionType]}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedAcquisition && (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5 mb-4">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Aperçu
                </TabsTrigger>
                <TabsTrigger value="supplies" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Fournitures
                </TabsTrigger>
                <TabsTrigger value="assignment" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Affectation
                </TabsTrigger>
                <TabsTrigger value="approval" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Approbation
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <Card className="p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Informations générales</h4>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Nom de l'acquisition</Label>
                          <p className="font-medium">{selectedAcquisition.acquisitionName || "Acquisition sans nom"}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Type</Label>
                          <div className="mt-1">
                            <Badge className={getTypeColor(selectedAcquisition.acquisitionType)}>
                              {acquisitionTypeLabels[selectedAcquisition.acquisitionType]}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</Label>
                          <p className="text-sm">{selectedAcquisition.description}</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Informations financières</h4>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Montant total</Label>
                          <p className="font-bold text-lg text-green-600">{getAcquisitionTotal(selectedAcquisition).toLocaleString()} MAD</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Fournisseur</Label>
                          <p className="font-medium">{getSupplierName(selectedAcquisition)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Statut</Label>
                          <div className="mt-1">
                            <Badge className={getStatusColor(selectedAcquisition.approvalStatus)}>
                              {statusLabels[selectedAcquisition.approvalStatus]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <Card className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Chronologie</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date de création</Label>
                        <p>{selectedAcquisition.createdAt ? new Date(selectedAcquisition.createdAt).toLocaleDateString() : "N/A"}</p>
                      </div>
                      {selectedAcquisition.startDate && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date de début</Label>
                          <p>{new Date(selectedAcquisition.startDate).toLocaleDateString()}</p>
                        </div>
                      )}
                      {selectedAcquisition.endDate && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date de fin</Label>
                          <p>{new Date(selectedAcquisition.endDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Bon de Réception</h4>
                    <div className="flex justify-between items-center">
                      {selectedAcquisition.approvalStatus === ApprovalStatus.APPROVED && (
                        <Button
                          onClick={() => selectedAcquisition && handleExportPurchaseOrder(selectedAcquisition)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Bon de réception
                        </Button>
                      )}
                      {selectedAcquisition.endDate && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date de fin</Label>
                          <p>{new Date(selectedAcquisition.endDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </Card>

                </div>
              </TabsContent>

              {/* Supplies Tab */}
              <TabsContent value="supplies">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Liste des fournitures</h4>
                    <Badge variant="secondary">
                      {selectedAcquisition.acquisitionSupplies?.length || 0} fourniture(s)
                    </Badge>
                  </div>

                  {selectedAcquisition.acquisitionSupplies && selectedAcquisition.acquisitionSupplies.length > 0 ? (
                    <div className="space-y-3">
                      {selectedAcquisition.acquisitionSupplies.map((acquisitionSupply, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <h5 className="font-medium text-gray-900 dark:text-white">{acquisitionSupply.supply.name}</h5>
                              <p className="text-sm text-gray-500">{acquisitionSupply.supply.description}</p>
                              <div className="flex gap-4 text-sm">
                                <span><strong>Type:</strong> {acquisitionSupply.supply.itemType}</span>
                                <span><strong>État:</strong> {acquisitionSupply.supply.condition}</span>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <p className="font-medium text-lg">{acquisitionSupply.quantity} × {acquisitionSupply.unitPrice} MAD</p>
                              <p className="text-sm text-gray-500">Sous-total: <span className="font-medium">{acquisitionSupply.totalCost} MAD</span></p>
                            </div>
                          </div>
                        </Card>
                      ))}
                      <Card className="p-4 bg-gray-50 dark:bg-gray-800">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-900 dark:text-white">Total général</span>
                          <span className="font-bold text-xl text-green-600">{selectedAcquisition.totalCost} MAD</span>
                        </div>
                      </Card>
                    </div>
                  ) : (
                    <Card className="p-8 text-center">
                      <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Aucune fourniture associée à cette acquisition</p>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Assignment Tab */}
              <TabsContent value="assignment">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Informations d'affectation</h4>

                  <Card className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      {selectedAcquisition.team && <Building className="h-8 w-8 text-blue-600" />}
                      {selectedAcquisition.player && <User className="h-8 w-8 text-green-600" />}
                      {selectedAcquisition.staff && <Users className="h-8 w-8 text-purple-600" />}
                      {selectedAcquisition.employee && <Briefcase className="h-8 w-8 text-orange-600" />}

                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Affecté à</Label>
                        <p className="font-medium text-lg">{getAssigneeName(selectedAcquisition)}</p>
                      </div>
                    </div>

                    {selectedAcquisition.team && (
                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Type d'entité</Label>
                          <p>Équipe</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Nom de l'équipe</Label>
                          <p>{selectedAcquisition.team.name}</p>
                        </div>
                      </div>
                    )}

                    {selectedAcquisition.player && (
                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Type d'entité</Label>
                          <p>Joueur</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Nom du joueur</Label>
                          <p>{selectedAcquisition.player.firstName} {selectedAcquisition.player.lastName}</p>
                        </div>
                      </div>
                    )}

                    {selectedAcquisition.staff && (
                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Type d'entité</Label>
                          <p>Staff</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Nom du staff</Label>
                          <p>{selectedAcquisition.staff.firstName} {selectedAcquisition.staff.lastName}</p>
                        </div>
                      </div>
                    )}

                    {selectedAcquisition.employee && (
                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Type d'entité</Label>
                          <p>Employé</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Nom de l'employé</Label>
                          <p>{selectedAcquisition.employee.fullName} ({selectedAcquisition.employee.employeeId})</p>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              </TabsContent>

              {/* Approval Tab */}
              <TabsContent value="approval">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Statut d'approbation</h4>

                  <Card className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        {selectedAcquisition.approvalStatus === ApprovalStatus.APPROVED && <CheckCircle className="h-6 w-6 text-green-600" />}
                        {selectedAcquisition.approvalStatus === ApprovalStatus.REJECTED && <XCircle className="h-6 w-6 text-red-600" />}
                        {selectedAcquisition.approvalStatus === ApprovalStatus.PENDING && <Clock className="h-6 w-6 text-yellow-600" />}
                        {selectedAcquisition.approvalStatus === ApprovalStatus.DELIVERED && <Truck className="h-6 w-6 text-blue-600" />}
                        {selectedAcquisition.approvalStatus === ApprovalStatus.RETURNED && <RotateCcw className="h-6 w-6 text-purple-600" />}
                        {selectedAcquisition.approvalStatus === ApprovalStatus.CANCELLED && <Ban className="h-6 w-6 text-gray-600" />}

                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Statut actuel</Label>
                          <div className="mt-1">
                            <Badge className={getStatusColor(selectedAcquisition.approvalStatus)}>
                              {statusLabels[selectedAcquisition.approvalStatus]}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date d'approbation</Label>
                          <p>{selectedAcquisition.approvalDate ? new Date(selectedAcquisition.approvalDate).toLocaleString() : "En attente"}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Créé par</Label>
                          <p>
                            {typeof selectedAcquisition.createdBy === 'object' && selectedAcquisition.createdBy !== null && 'firstName' in selectedAcquisition.createdBy && 'lastName' in selectedAcquisition.createdBy
                              ? `${selectedAcquisition.createdBy.firstName} ${selectedAcquisition.createdBy.lastName}`
                              : typeof selectedAcquisition.createdBy === 'number'
                                ? `Utilisateur #${selectedAcquisition.createdBy}`
                                : "Inconnu"}
                          </p>
                        </div>
                      </div>

                      {selectedAcquisition.approvalComments && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Commentaires d'approbation</Label>
                          <Card className="p-3 mt-2 bg-gray-50 dark:bg-gray-800">
                            <p className="text-sm">{selectedAcquisition.approvalComments}</p>
                          </Card>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Documents associés</h4>

                  {selectedAcquisition.quotationFile && selectedAcquisition.quotationFile.url ? (
                    <Card className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-6 w-6 text-blue-600" />
                          <div>
                            <h5 className="font-medium">Devis</h5>
                            <p className="text-sm text-gray-500">{selectedAcquisition.quotationFile.fileName || 'Document sans nom'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Type de fichier</Label>
                            <p>{selectedAcquisition.quotationFile.fileType}</p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Taille</Label>
                            <p>{selectedAcquisition.quotationFile.fileSize} bytes</p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Actions</Label>
                            <a
                              href={`${process.env.NEXT_PUBLIC_API_URL || ''}${selectedAcquisition.quotationFile.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              Télécharger
                            </a>
                          </div>
                        </div>

                        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                          <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">Aperçu du document</Label>
                          {(() => {
                            const apiUrl = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : '';
                            const fileUrl = `${process.env.NEXT_PUBLIC_API_URL || apiUrl}${selectedAcquisition.quotationFile.url}`;
                            const fileType = selectedAcquisition.quotationFile.fileType;

                            if (fileType.startsWith('image/')) {
                              return <img src={fileUrl} alt="Devis" className="max-h-64 rounded border mx-auto" style={{ maxWidth: '100%' }} />;
                            } else if (fileType === 'application/pdf') {
                              return <iframe src={fileUrl} title="Devis PDF" className="w-full" style={{ height: '400px', border: '1px solid #ccc', borderRadius: '4px' }} />;
                            } else if (fileType === 'text/plain') {
                              return <iframe src={fileUrl} title="Devis TXT" className="w-full" style={{ height: '200px', border: '1px solid #ccc', borderRadius: '4px', background: '#fafafa' }} />;
                            } else {
                              return (
                                <div className="text-center py-8">
                                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                  <p className="text-gray-500">Aperçu non disponible pour ce type de fichier</p>
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
                                  >
                                    Cliquez ici pour ouvrir le fichier
                                  </a>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Card className="p-8 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Aucun document associé à cette acquisition</p>
                    </Card>
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
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Modifier l'acquisition</DialogTitle>
            <DialogDescription>Mettre à jour les informations de l'acquisition</DialogDescription>
          </DialogHeader>
          {selectedAcquisition && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="acquisitionName">Nom de l'acquisition</Label>
                <Input
                  id="acquisitionName"
                  value={newAcquisition.acquisitionName}
                  onChange={(e) => setNewAcquisition({ ...newAcquisition, acquisitionName: e.target.value })}
                  placeholder="Entrez le nom de l'acquisition"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newAcquisition.description}
                  onChange={(e) => setNewAcquisition({ ...newAcquisition, description: e.target.value })}
                  placeholder="Entrez la description de l'acquisition"
                  rows={3}
                />
              </div>

              {/* Note: Full supplies editing will be implemented in a separate iteration */}
              <div className="text-sm text-gray-500">
                Note: Modification des fournitures sera disponible prochainement
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

      {/* Edit Supply Dialog */}
      <Dialog open={isEditSupplyDialogOpen} onOpenChange={setIsEditSupplyDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modifier la fourniture</DialogTitle>
            <DialogDescription>Mettre à jour les informations de la fourniture</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editSupplyName">Nom de la fourniture</Label>
              <Input
                id="editSupplyName"
                value={newSupply.name}
                onChange={(e) => setNewSupply({ ...newSupply, name: e.target.value })}
                placeholder="Entrez le nom de la fourniture"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editSupplyDescription">Description</Label>
              <Textarea
                id="editSupplyDescription"
                value={newSupply.description}
                onChange={(e) => setNewSupply({ ...newSupply, description: e.target.value })}
                placeholder="Entrez la description de la fourniture"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editItemType">Type d'article</Label>
                <Select
                  value={newSupply.itemType}
                  onValueChange={(value) => setNewSupply({ ...newSupply, itemType: value as ItemType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ItemType.EQUIPMENT}>Équipement</SelectItem>
                    <SelectItem value={ItemType.UNIFORM}>Uniforme</SelectItem>
                    <SelectItem value={ItemType.MEDICAL}>Médical</SelectItem>
                    <SelectItem value={ItemType.VEHICLE}>Véhicule</SelectItem>
                    <SelectItem value={ItemType.APARTMENT}>Appartement</SelectItem>
                    <SelectItem value={ItemType.OTHER}>Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCondition">Condition</Label>
                <Select
                  value={newSupply.condition}
                  onValueChange={(value) => setNewSupply({ ...newSupply, condition: value as SupplyCondition })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner la condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SupplyCondition.NEW}>Neuf</SelectItem>
                    <SelectItem value={SupplyCondition.GOOD}>Bon</SelectItem>
                    <SelectItem value={SupplyCondition.FAIR}>Correct</SelectItem>
                    <SelectItem value={SupplyCondition.POOR}>Mauvais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editQuantity">Quantité</Label>
                <Input
                  id="editQuantity"
                  type="number"
                  min="0"
                  value={newSupply.quantity}
                  onChange={(e) => setNewSupply({ ...newSupply, quantity: parseInt(e.target.value) || 0 })}
                  placeholder="Quantité disponible"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSupplierId">Fournisseur</Label>
                <Select
                  value={newSupply.supplierId.toString()}
                  onValueChange={(value) => setNewSupply({ ...newSupply, supplierId: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Aucun fournisseur</SelectItem>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditSupplyDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateSupply} className="bg-blue-800 hover:bg-blue-900">
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Supply Dialog */}
      <Dialog open={isDeleteSupplyDialogOpen} onOpenChange={setIsDeleteSupplyDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette fourniture ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {selectedSupply && (
            <div className="py-4">
              <p className="font-medium">{selectedSupply.name}</p>
              <p className="text-sm text-gray-500">{selectedSupply.description}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteSupplyDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDeleteSupply}>
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
