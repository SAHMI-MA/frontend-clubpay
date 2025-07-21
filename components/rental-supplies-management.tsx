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
  [AcquisitionType.RENTAL]: "Rental",
  [AcquisitionType.PURCHASE]: "Purchase"
}

const statusLabels = {
  [ApprovalStatus.PENDING]: "Pending",
  [ApprovalStatus.APPROVED]: "Approved",
  [ApprovalStatus.REJECTED]: "Rejected",
  [ApprovalStatus.DELIVERED]: "Delivered",
  [ApprovalStatus.RETURNED]: "Returned",
  [ApprovalStatus.CANCELLED]: "Cancelled"
}

export function RentalSupplierManagement() {
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
    // UI-only fields that aren't part of the API DTO
    itemName?: string;
    unitPrice?: number;
    notes?: string;
    assigneeType?: AssigneeType;
    assigneeId?: string;
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
    notes: ""
  })

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
    if (!acquisition) return "Unknown Supplier";
    
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
    
    return "Unknown Supplier";
  }

  const getAssigneeName = (acquisition: Acquisition | null): string => {
    if (!acquisition) return "Unassigned";
    
    if (acquisition.team) {
      return acquisition.team.name;
    } else if (acquisition.player) {
      return `${acquisition.player.firstName} ${acquisition.player.lastName}`;
    } else if (acquisition.staff) {
      return `${acquisition.staff.firstName} ${acquisition.staff.lastName}`;
    } else {
      return "Unassigned";
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
    return acquisition?.description || "Unnamed item";
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
    // Ensure itemName is present and non-empty for API
    const itemName = newAcquisition.itemName && newAcquisition.itemName.trim() !== "" ? newAcquisition.itemName : "Acquisition Item";
    const acquisitionData: CreateAcquisitionDto & { createdBy?: number; itemName?: string } = {
      acquisitionType: newAcquisition.acquisitionType,
      itemType: newAcquisition.itemType,
      description: newAcquisition.description || itemName,
      startDate: newAcquisition.startDate,
      endDate: newAcquisition.endDate,
      cost: newAcquisition.unitPrice ? (newAcquisition.unitPrice * (newAcquisition.quantity || 1)) : newAcquisition.cost,
      supplierId: newAcquisition.supplierId,
      quantity: newAcquisition.quantity,
      createdBy: currentUser?.id ?? undefined,
      itemName
    }

    // Add the correct assignee ID based on assigneeType
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
        console.error("Failed to add acquisition:", error)
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
      supplierId: 0, // Keep default as 0, will need user selection
      quantity: 1,
      // UI fields
      itemName: "",
      unitPrice: 0,  // Keep default as 0, but clear in UI
      notes: ""
    })
  }

  const handleEditAcquisition = (acquisition: Acquisition) => {
    dispatch(setSelectedAcquisition(acquisition))
    setIsEditAcquisitionDialogOpen(true)
  }

  const handleUpdateAcquisition = () => {
    if (selectedAcquisition && selectedAcquisition.id) {
      const updateData: UpdateAcquisitionDto = {
        acquisitionType: selectedAcquisition.acquisitionType,
        itemType: selectedAcquisition.itemType,
        description: selectedAcquisition.description,
        startDate: selectedAcquisition.startDate,
        endDate: selectedAcquisition.endDate,
        cost: selectedAcquisition.cost,
        supplierId: selectedAcquisition.supplier?.id || 0
      }

      dispatch(updateAcquisition({ id: selectedAcquisition.id, data: updateData }))
        .unwrap()
        .then(() => {
          setIsEditAcquisitionDialogOpen(false)
        })
        .catch((error) => {
          console.error("Failed to update acquisition:", error)
        })
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
          "Acquisition successfully deleted", 
          "success", 
          "Success"
        );
        
        // Refresh acquisitions list
        dispatch(fetchAllAcquisitions());
      } catch (error: any) {
        console.error("Failed to delete acquisition:", error);
        
        // Show error toast with more detailed message
        showToast(
          `Failed to delete acquisition: ${error.message || "Unknown error"}`, 
          "error",
          "Error"
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
            `Cannot approve acquisition: You need to be logged in.`,
            "error",
            "Authentication Error"
          );
          return; // Exit early if we can't get a valid user ID
        }
      } else {
        showToast(
          `Cannot approve acquisition: You need to be logged in.`,
          "error",
          "Authentication Error"
        );
        return; // Exit early if we can't get a valid user ID
      }
    }
    
    // Create approval data with the authenticated user's ID
    const approvalData = {
      approvalStatus: ApprovalStatus.APPROVED,
      approverId, // Use the current user's ID
      approvalComments: "Approved from rental & supplies management"
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
          `${getAcquisitionDisplayName(acquisition)} has been approved.`,
          "success",
          "Acquisition Approved"
        );
      })
      .catch((error) => {
        console.error(`Error approving acquisition ID ${acquisition.id}:`, error);
        showToast(
          `Failed to approve ${getAcquisitionDisplayName(acquisition)}: ${error.message || 'Unknown error'}`,
          "error",
          "Approval Failed"
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rental & Acquisitions Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage rental and purchase requests</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Acquisitions</CardTitle>
            <Package className="h-4 w-4 text-blue-800" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalAcquisitions}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">${totalSpent.toLocaleString()}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">This year</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Rentals</CardTitle>
            <Calendar className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{activeRentals}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Currently rented</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Requests</CardTitle>
            <ShoppingCart className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{pendingRequests}</div>
            <p className="text-xs text-yellow-600 mt-1">Awaiting approval</p>
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
                  <CardDescription>Manage rentals and purchases for teams, players, and staff</CardDescription>
                </div>
                <Dialog open={isAddAcquisitionDialogOpen} onOpenChange={setIsAddAcquisitionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-800 hover:bg-blue-900 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      New Acquisition
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Acquisition</DialogTitle>
                      <DialogDescription>Add a new rental or purchase request</DialogDescription>
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
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={AcquisitionType.RENTAL}>Rental</SelectItem>
                              <SelectItem value={AcquisitionType.PURCHASE}>Purchase</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="supplier">Supplier</Label>
                          <Select
                            value={newAcquisition.supplierId.toString()}
                            onValueChange={(value) => setNewAcquisition({ ...newAcquisition, supplierId: parseInt(value, 10) })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select supplier" />
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
                        <Label htmlFor="itemName">Item Name</Label>
                        <Input
                          id="itemName"
                          value={newAcquisition.itemName}
                          onChange={(e) => setNewAcquisition({ ...newAcquisition, itemName: e.target.value })}
                          placeholder="Enter item name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newAcquisition.description}
                          onChange={(e) => setNewAcquisition({ ...newAcquisition, description: e.target.value })}
                          placeholder="Enter item description"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="quantity">Quantity</Label>
                          <Input
                            id="quantity"
                            type="number"
                            value={newAcquisition.quantity}
                            onChange={(e) => setNewAcquisition({ ...newAcquisition, quantity: parseInt(e.target.value, 10) })}
                            placeholder="Enter quantity"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="unitPrice">Unit Price</Label>
                          <Input
                            id="unitPrice"
                            type="number"
                            step="0.01"
                            value={newAcquisition.unitPrice}
                            onChange={(e) => setNewAcquisition({ ...newAcquisition, unitPrice: parseFloat(e.target.value) })}
                            placeholder="Enter unit price"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="assigneeType">Assign To</Label>
                          <Select
                            value={newAcquisition.assigneeType}
                            onValueChange={(value) =>
                              setNewAcquisition({ ...newAcquisition, assigneeType: value as AssigneeType, assigneeId: "" })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select assignee type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={AssigneeType.TEAM}>Team</SelectItem>
                              <SelectItem value={AssigneeType.PLAYER}>Player</SelectItem>
                              <SelectItem value={AssigneeType.STAFF}>Staff</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="assigneeId">Assignee</Label>
                          <Select
                            value={newAcquisition.assigneeId}
                            onValueChange={(value) => setNewAcquisition({ ...newAcquisition, assigneeId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select assignee" />
                            </SelectTrigger>
                            <SelectContent>
                              {newAcquisition.assigneeType === AssigneeType.TEAM && (
                                teams.length > 0
                                  ? teams.map(team => (
                                      <SelectItem key={team.id} value={team.id.toString()}>
                                        {team.name}
                                      </SelectItem>
                                    ))
                                  : <SelectItem value="no-team" disabled>No teams found</SelectItem>
                              )}
                              {newAcquisition.assigneeType === AssigneeType.PLAYER && (
                                players.length > 0
                                  ? players.map(player => (
                                      <SelectItem key={player.id} value={player.id.toString()}>
                                        {player.firstName} {player.lastName}
                                      </SelectItem>
                                    ))
                                  : <SelectItem value="no-player" disabled>No players found</SelectItem>
                              )}
                              {newAcquisition.assigneeType === AssigneeType.STAFF && (
                                staff.length > 0
                                  ? staff.map(staffMember => (
                                      <SelectItem key={staffMember.id} value={staffMember.id.toString()}>
                                        {staffMember.firstName} {staffMember.lastName} - {staffMember.role}
                                      </SelectItem>
                                    ))
                                  : <SelectItem value="no-staff" disabled>No staff found</SelectItem>
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
                          placeholder="Additional notes"
                          rows={2}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddAcquisitionDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddAcquisition} className="bg-blue-800 hover:bg-blue-900">
                        Create Acquisition
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
                    placeholder="Search acquisitions..."
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
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value={AcquisitionType.RENTAL}>Rental</SelectItem>
                    <SelectItem value={AcquisitionType.PURCHASE}>Purchase</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
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
                      <TableHead>Item</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAcquisitions.map((acquisition) => (
                      <TableRow key={acquisition.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{getAcquisitionDisplayName(acquisition)}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                              {acquisition.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(acquisition.acquisitionType)}>{acquisitionTypeLabels[acquisition.acquisitionType]}</Badge>
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
                        <TableCell>
                          {acquisition.createdBy && acquisition.createdBy.firstName && acquisition.createdBy.lastName
                            ? `${acquisition.createdBy.firstName} ${acquisition.createdBy.lastName}`
                            : "Unknown"}
                        </TableCell>
                        <TableCell>{acquisition.quantity || 1}</TableCell>
                        <TableCell className="font-medium">${getAcquisitionTotal(acquisition).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(getAcquisitionStatus(acquisition))}>{statusLabels[getAcquisitionStatus(acquisition)]}</Badge>
                        </TableCell>
                        <TableCell>{getAcquisitionDate(acquisition).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {acquisition.approvalStatus === ApprovalStatus.PENDING && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700"
                                onClick={() => handleApproveAcquisition(acquisition)}
                                title="Approve Acquisition"
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

      {/* View Acquisition Dialog */}
      <Dialog open={isViewDialogOpen && selectedAcquisition !== null} onOpenChange={(open) => {
        if (!open) setIsViewDialogOpen(false);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Acquisition Details</DialogTitle>
          </DialogHeader>
          {selectedAcquisition && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Item</Label>
                  <p className="font-medium">{getAcquisitionDisplayName(selectedAcquisition)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Type</Label>
                  <Badge className={getTypeColor(selectedAcquisition.acquisitionType)}>
                    {acquisitionTypeLabels[selectedAcquisition.acquisitionType]}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</Label>
                <p>{selectedAcquisition.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Quantity</Label>
                  <p>{selectedAcquisition.quantity || 1}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Cost</Label>
                  <p>${selectedAcquisition.cost}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</Label>
                  <p className="font-medium text-lg">${getAcquisitionTotal(selectedAcquisition).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</Label>
                  <Badge className={getStatusColor(selectedAcquisition.approvalStatus)}>
                    {statusLabels[selectedAcquisition.approvalStatus]}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Supplier</Label>
                  <p>{getSupplierName(selectedAcquisition)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Assigned To</Label>
                  <p>{getAssigneeName(selectedAcquisition)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Created Date</Label>
                  <p>{selectedAcquisition.createdAt ? new Date(selectedAcquisition.createdAt).toLocaleDateString() : "N/A"}</p>
                </div>
                {selectedAcquisition.startDate && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Start Date</Label>
                    <p>{selectedAcquisition.startDate ? new Date(selectedAcquisition.startDate).toLocaleDateString() : "N/A"}</p>
                  </div>
                )}
              </div>

              {selectedAcquisition.endDate && (
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">End Date</Label>
                  <p>{selectedAcquisition.endDate ? new Date(selectedAcquisition.endDate).toLocaleDateString() : "N/A"}</p>
                </div>
              )}

              {selectedAcquisition.approvalComments && (
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">Approval Comments</Label>
                  <p>{selectedAcquisition.approvalComments}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Acquisition Dialog */}
      <Dialog open={isEditAcquisitionDialogOpen && selectedAcquisition !== null} onOpenChange={(open) => {
        if (!open) setIsEditAcquisitionDialogOpen(false);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Acquisition</DialogTitle>
            <DialogDescription>Update acquisition information</DialogDescription>
          </DialogHeader>
          {selectedAcquisition && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  value={selectedAcquisition.quantity || 1}
                  onChange={(e) => {
                    if (selectedAcquisition) {
                      dispatch(setSelectedAcquisition({
                        ...selectedAcquisition,
                        quantity: parseInt(e.target.value, 10)
                      }));
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedAcquisition.description || ""}
                  onChange={(e) => {
                    if (selectedAcquisition) {
                      dispatch(setSelectedAcquisition({
                        ...selectedAcquisition,
                        description: e.target.value
                      }));
                    }
                  }}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditAcquisitionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAcquisition} className="bg-blue-800 hover:bg-blue-900">
              Update Acquisition
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
              Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {itemToDelete && (
            <div className="py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {itemToDelete.type === "acquisition"
                  ? `Acquisition: ${getAcquisitionDisplayName(itemToDelete.item)}`
                  : `Supplier: ${itemToDelete.item.name}`}
              </p>
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

// Using imported toast types from the toast-notification component

// Using imported ToastNotification component
