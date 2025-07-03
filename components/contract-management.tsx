"use client"

import { useState, useEffect } from "react"
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
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
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
  selectIsAuthenticated
} from "@/lib/redux/contractSlice"
import { fetchAllPlayers } from "@/lib/redux/playerSlice"
import { fetchAllStaff } from "@/lib/redux/staffSlice"
import type { AppDispatch, RootState } from "@/lib/redux/store"
import type { PlayerContract, StaffContract } from "@/lib/api/contract-api"
import type { Player, Staff } from "@/lib/types/team-management"

// Type guard helper functions
const isPlayerContract = (contract: PlayerContract | StaffContract): contract is PlayerContract => {
  return 'playerName' in contract || 'player' in contract
}

const isStaffContract = (contract: PlayerContract | StaffContract): contract is StaffContract => {
  return 'staffName' in contract || 'staff' in contract
}

export function ContractManagement() {
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
  
  // Local state
  const [activeTab, setActiveTab] = useState("players")
  const [searchTerm, setSearchTerm] = useState("")
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

  // Authentication and data loading
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('🔄 Initializing contract management data...')
        
        // Verify authentication first
        const authResult = await dispatch(verifyAuthentication())
        
        if (verifyAuthentication.fulfilled.match(authResult)) {
          console.log('✅ Authentication verified, loading data...')
          
          // Load all contract data and players/staff for dropdowns
          const results = await Promise.allSettled([
            dispatch(fetchAllContracts()),
            dispatch(fetchAllPlayers()),
            dispatch(fetchAllStaff())
          ])
          
          // Log results for debugging
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

  // Debug logging for players and staff data
  useEffect(() => {
    console.log('🔍 Players data:', players, 'Length:', players.length)
    console.log('🔍 Staff data:', staff, 'Length:', staff.length)
    console.log('🔍 Players loading:', playersLoading)
    console.log('🔍 Staff loading:', staffLoading)
    console.log('🔍 Players error:', playersError)
    console.log('🔍 Staff error:', staffError)
  }, [players, staff, playersLoading, staffLoading, playersError, staffError])

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
              <h3 className="text-lg font-semibold">Authentication Required</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Please log in to access contract management features.
              </p>
              <Button 
                onClick={() => window.location.href = '/login'}
                className="w-full"
              >
                Go to Login
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
          <p className="text-gray-600 dark:text-gray-400">Loading contract data...</p>
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
              <h3 className="text-lg font-semibold">Authentication Error</h3>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
              <div className="space-y-2">
                <Button 
                  onClick={() => window.location.href = '/login'}
                  className="w-full"
                >
                  Go to Login
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => dispatch(clearError())}
                  className="w-full"
                >
                  Dismiss
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
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
        {terminationDate && status === "terminated" && <span className="ml-1 text-xs">({terminationDate})</span>}
      </Badge>
    )
  }

  const handleCreateContract = async () => {
    try {
      const contractData = {
        title: contractForm.title,
        salary: Number(contractForm.salary),
        startDate: contractForm.startDate,
        endDate: contractForm.endDate,
        hasBonus: contractForm.hasBonus,
        signatureBonus: contractForm.hasBonus ? Number(contractForm.signatureBonus) : undefined,
        description: contractForm.description,
      }

      if (contractForm.contractType === "player") {
        if (!contractForm.playerId) {
          alert("Please select a player from the dropdown")
          return
        }
        
        const result = await dispatch(createPlayerContract({
          ...contractData,
          playerId: contractForm.playerId,
        }))
        
        if (createPlayerContract.fulfilled.match(result)) {
          console.log("✅ Player contract created successfully")
        }
      } else {
        if (!contractForm.staffId) {
          alert("Please select a staff member from the dropdown")
          return
        }
        
        const result = await dispatch(createStaffContract({
          ...contractData,
          staffId: contractForm.staffId,
          benefits: contractForm.benefits ? JSON.parse(contractForm.benefits) : undefined,
          terms: contractForm.terms,
        }))
        
        if (createStaffContract.fulfilled.match(result)) {
          console.log("✅ Staff contract created successfully")
        }
      }

      // Reset form and close dialog
      setIsCreateDialogOpen(false)
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
    } catch (error) {
      console.error("Failed to create contract:", error)
    }
  }

  const handleTerminateContract = async (contractId: string, type: "player" | "staff") => {
    const terminationDate = new Date().toISOString().split("T")[0]
    const reason = prompt("Please provide a reason for termination (optional):")

    try {
      if (type === "player") {
        const result = await dispatch(terminatePlayerContract({
          id: contractId,
          terminationDate,
          reason: reason || undefined
        }))
        
        if (terminatePlayerContract.fulfilled.match(result)) {
          console.log("✅ Player contract terminated successfully")
        }
      } else {
        const result = await dispatch(terminateStaffContract({
          id: contractId,
          terminationDate,
          reason: reason || undefined
        }))
        
        if (terminateStaffContract.fulfilled.match(result)) {
          console.log("✅ Staff contract terminated successfully")
        }
      }
    } catch (error) {
      console.error("Failed to terminate contract:", error)
    }
  }

  // Filtered contracts based on search and Redux filters
  const filteredPlayerContracts = playerContracts.filter((contract) => {
    const playerName = contract.playerName || (contract.player ? `${contract.player.firstName} ${contract.player.lastName}` : '');
    const matchesSearch =
      playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.title.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Use Redux filter state instead of local state
    const currentStatusFilter = filterStatus || "all"
    const contractStatus = contract.status?.toLowerCase() || 'draft'
    const matchesStatus = currentStatusFilter === "all" || contractStatus === currentStatusFilter
    
    return matchesSearch && matchesStatus
  })

  const filteredStaffContracts = staffContracts.filter((contract) => {
    const staffName = contract.staffName || (contract.staff ? `${contract.staff.firstName} ${contract.staff.lastName}` : '');
    const matchesSearch =
      staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.title.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Use Redux filter state instead of local state
    const currentStatusFilter = filterStatus || "all"
    const contractStatus = contract.status?.toLowerCase() || 'draft'
    const matchesStatus = currentStatusFilter === "all" || contractStatus === currentStatusFilter
    
    return matchesSearch && matchesStatus
  })

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contract Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage player and staff contracts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={async () => {
              console.log('🔄 Refreshing all data...')
              try {
                const results = await Promise.allSettled([
                  dispatch(fetchAllContracts()),
                  dispatch(fetchAllPlayers()),
                  dispatch(fetchAllStaff())
                ])
                
                results.forEach((result, index) => {
                  const dataTypes = ['contracts', 'players', 'staff']
                  if (result.status === 'fulfilled') {
                    console.log(`✅ Refreshed ${dataTypes[index]} successfully`)
                  } else {
                    console.error(`❌ Failed to refresh ${dataTypes[index]}:`, result.reason)
                  }
                })
              } catch (error) {
                console.error('❌ Error during refresh:', error)
              }
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Contract
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Contract</DialogTitle>
              <DialogDescription>Create a new player or staff contract with terms and conditions</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contractType">Contract Type</Label>
                  <Select 
                    value={contractForm.contractType} 
                    onValueChange={(value) => setContractForm({ ...contractForm, contractType: value as "player" | "staff" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select contract type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="player">Player Contract</SelectItem>
                      <SelectItem value="staff">Staff Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title">Contract Title</Label>
                  <Input
                    id="title"
                    value={contractForm.title}
                    onChange={(e) => setContractForm({ ...contractForm, title: e.target.value })}
                    placeholder="e.g., Professional Player Contract"
                  />
                </div>
                
                {contractForm.contractType === "player" ? (
                  <div>
                    <Label htmlFor="playerId">Select Player</Label>
                    <Select 
                      value={contractForm.playerId} 
                      onValueChange={(value) => setContractForm({ ...contractForm, playerId: value })}
                      disabled={playersLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          playersLoading 
                            ? "Loading players..." 
                            : players.length === 0 
                              ? "No players available" 
                              : "Select a player"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          console.log('🔍 Rendering player dropdown, players:', players, 'loading:', playersLoading)
                          if (players.length === 0 && !playersLoading) {
                            return (
                              <SelectItem value="no-players" disabled>
                                No players available
                              </SelectItem>
                            )
                          }
                          return players.map((player: Player) => {
                            console.log('🔍 Rendering player:', player)
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
                    <Label htmlFor="staffId">Select Staff Member</Label>
                    <Select 
                      value={contractForm.staffId} 
                      onValueChange={(value) => setContractForm({ ...contractForm, staffId: value })}
                      disabled={staffLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          staffLoading 
                            ? "Loading staff..." 
                            : staff.length === 0 
                              ? "No staff available" 
                              : "Select a staff member"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          console.log('🔍 Rendering staff dropdown, staff:', staff, 'loading:', staffLoading)
                          if (staff.length === 0 && !staffLoading) {
                            return (
                              <SelectItem value="no-staff" disabled>
                                No staff available
                              </SelectItem>
                            )
                          }
                          return staff.map((staffMember: Staff) => {
                            console.log('🔍 Rendering staff:', staffMember)
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
                  <Label htmlFor="salary">Annual Salary</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={contractForm.salary}
                    onChange={(e) => setContractForm({ ...contractForm, salary: e.target.value })}
                    placeholder="85000"
                  />
                </div>
                <div>
                  <Label htmlFor="signatureBonus">Signature Bonus</Label>
                  <Input
                    id="signatureBonus"
                    type="number"
                    value={contractForm.signatureBonus}
                    onChange={(e) => setContractForm({ ...contractForm, signatureBonus: e.target.value })}
                    placeholder="15000"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasBonus"
                    checked={contractForm.hasBonus}
                    onCheckedChange={(checked) => setContractForm({ ...contractForm, hasBonus: checked as boolean })}
                  />
                  <Label htmlFor="hasBonus">Include Performance Bonuses</Label>
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={contractForm.startDate}
                    onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
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
                  placeholder="Contract description and key details..."
                />
              </div>
              <div>
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  value={contractForm.terms}
                  onChange={(e) => setContractForm({ ...contractForm, terms: e.target.value })}
                  placeholder="Specific terms, clauses, and conditions..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateContract}>Create Contract</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="players">Player Contracts</TabsTrigger>
          <TabsTrigger value="staff">Staff Contracts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="space-y-6">
          {/* Player Contract Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{contractStats.player.active}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Currently active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ${contractStats.player.totalValue.toLocaleString()}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Annual salary commitment</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expired</CardTitle>
                <Clock className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{contractStats.player.expired}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Need renewal</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Terminated</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{contractStats.player.terminated}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Early terminations</p>
              </CardContent>
            </Card>
          </div>

          {/* Player Contracts Management */}
          <Card>
            <CardHeader>
              <CardTitle>Player Contracts</CardTitle>
              <CardDescription>Manage all player contracts and agreements</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search contracts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus || "all"} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Player Contracts Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Contract Title</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayerContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        {contract.playerName || (contract.player ? `${contract.player.firstName} ${contract.player.lastName}` : 'Unknown')}
                      </TableCell>
                      <TableCell>{contract.position || contract.player?.position || 'N/A'}</TableCell>
                      <TableCell>{contract.title}</TableCell>
                      <TableCell className="font-medium">
                        ${(typeof contract.salary === 'string' ? parseFloat(contract.salary) : contract.salary).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{contract.startDate}</div>
                          <div className="text-gray-500">to {contract.endDate}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(contract.status, contract.terminationDate)}</TableCell>
                      <TableCell>
                        {contract.hasBonus ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Award className="h-3 w-3 mr-1" />
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
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
                                <DialogTitle>Player Contract Details</DialogTitle>
                                <DialogDescription>
                                  Complete contract information for {selectedContract && isPlayerContract(selectedContract) ? selectedContract.playerName : 'N/A'}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedContract && isPlayerContract(selectedContract) && (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Contract ID</Label>
                                      <p className="text-sm text-gray-600">{selectedContract.id}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Player</Label>
                                      <p className="text-sm font-bold">{selectedContract.playerName}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Position</Label>
                                      <p className="text-sm text-gray-600">{selectedContract.position || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Annual Salary</Label>
                                      <p className="text-sm font-bold">${selectedContract.salary?.toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Signature Bonus</Label>
                                      <p className="text-sm text-gray-600">
                                        ${selectedContract.signatureBonus?.toLocaleString()}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Contract Period</Label>
                                      <p className="text-sm text-gray-600">
                                        {selectedContract.startDate} to {selectedContract.endDate}
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Status</Label>
                                    <div className="mt-1">
                                      {getStatusBadge(selectedContract.status, selectedContract.terminationDate)}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Description</Label>
                                    <p className="text-sm text-gray-600">{selectedContract.description}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Performance Bonuses</Label>
                                    <p className="text-sm text-gray-600">
                                      {selectedContract.hasBonus ? "Included in contract" : "Not included"}
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                                    <div>
                                      <Label className="text-xs font-medium">Created</Label>
                                      <p>{selectedContract.createdAt}</p>
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium">Last Updated</Label>
                                      <p>{selectedContract.updatedAt}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>

                          {contract.status === "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 bg-transparent"
                              onClick={() => handleTerminateContract(contract.id.toString(), "player")}
                            >
                              <XCircle className="h-4 w-4" />
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

        <TabsContent value="staff" className="space-y-6">
          {/* Staff Contract Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{contractStats.staff.active}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Currently active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ${contractStats.staff.totalValue.toLocaleString()}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Annual salary commitment</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expired</CardTitle>
                <Clock className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{contractStats.staff.expired}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Need renewal</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Terminated</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{contractStats.staff.terminated}</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Early terminations</p>
              </CardContent>
            </Card>
          </div>

          {/* Staff Contracts Management */}
          <Card>
            <CardHeader>
              <CardTitle>Staff Contracts</CardTitle>
              <CardDescription>Manage all staff contracts and employment agreements</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search contracts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus || "all"} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Staff Contracts Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Benefits</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaffContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        {contract.staffName || (contract.staff ? `${contract.staff.firstName} ${contract.staff.lastName}` : 'Unknown')}
                      </TableCell>
                      <TableCell>{contract.department || contract.staff?.team?.name || 'N/A'}</TableCell>
                      <TableCell>{contract.role || contract.staff?.role || 'N/A'}</TableCell>
                      <TableCell className="font-medium">
                        ${(typeof contract.salary === 'string' ? parseFloat(contract.salary) : contract.salary).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{contract.startDate}</div>
                          <div className="text-gray-500">to {contract.endDate}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(contract.status, contract.terminationDate)}</TableCell>
                      <TableCell>
                        {contract.benefits?.healthInsurance && (
                          <Badge className="bg-blue-100 text-blue-800 mr-1">Health</Badge>
                        )}
                        {contract.benefits?.carAllowance && contract.benefits.carAllowance > 0 && (
                          <Badge className="bg-green-100 text-green-800">Car</Badge>
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
                                <DialogTitle>Staff Contract Details</DialogTitle>
                                <DialogDescription>
                                  Complete contract information for {selectedContract && isStaffContract(selectedContract) ? selectedContract.staffName : 'N/A'}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedContract && isStaffContract(selectedContract) && (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Contract ID</Label>
                                      <p className="text-sm text-gray-600">{selectedContract.id}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Staff Member</Label>
                                      <p className="text-sm font-bold">{selectedContract.staffName}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Department</Label>
                                      <p className="text-sm text-gray-600">{selectedContract.department || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Role</Label>
                                      <p className="text-sm text-gray-600">{selectedContract.role || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Annual Salary</Label>
                                      <p className="text-sm font-bold">${selectedContract.salary?.toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Signature Bonus</Label>
                                      <p className="text-sm text-gray-600">
                                        ${selectedContract.signatureBonus?.toLocaleString()}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Contract Period</Label>
                                      <p className="text-sm text-gray-600">
                                        {selectedContract.startDate} to {selectedContract.endDate}
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Status</Label>
                                    <div className="mt-1">
                                      {getStatusBadge(selectedContract.status, selectedContract.terminationDate)}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Benefits Package</Label>
                                    <div className="mt-2 space-y-2">
                                      {selectedContract.benefits?.healthInsurance && (
                                        <Badge className="bg-blue-100 text-blue-800 mr-2">Health Insurance</Badge>
                                      )}
                                      {selectedContract.benefits?.carAllowance &&
                                        selectedContract.benefits.carAllowance > 0 && (
                                          <Badge className="bg-green-100 text-green-800 mr-2">
                                            Car Allowance: ${selectedContract.benefits.carAllowance}/month
                                          </Badge>
                                        )}
                                      {selectedContract.benefits?.continuingEducation && (
                                        <Badge className="bg-purple-100 text-purple-800 mr-2">
                                          Education: ${selectedContract.benefits.continuingEducation}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Terms & Conditions</Label>
                                    <p className="text-sm text-gray-600">{selectedContract.terms || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Description</Label>
                                    <p className="text-sm text-gray-600">{selectedContract.description}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Performance Bonuses</Label>
                                    <p className="text-sm text-gray-600">
                                      {selectedContract.hasBonus ? "Included in contract" : "Not included"}
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                                    <div>
                                      <Label className="text-xs font-medium">Created</Label>
                                      <p>{selectedContract.createdAt}</p>
                                    </div>
                                    <div>
                                      <Label className="text-xs font-medium">Last Updated</Label>
                                      <p>{selectedContract.updatedAt}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>

                          {contract.status === "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 bg-transparent"
                              onClick={() => handleTerminateContract(contract.id.toString(), "staff")}
                            >
                              <XCircle className="h-4 w-4" />
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

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contract Value Distribution</CardTitle>
                <CardDescription>Breakdown of contract values by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Player Contracts</span>
                    <span className="font-bold">${contractStats.player.totalValue.toLocaleString()}</span>
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
                    <span>Staff Contracts</span>
                    <span className="font-bold">${contractStats.staff.totalValue.toLocaleString()}</span>
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
                <CardTitle>Contract Status Overview</CardTitle>
                <CardDescription>Current status of all contracts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Active Contracts
                    </span>
                    <span className="font-bold">{contractStats.player.active + contractStats.staff.active}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      Expired Contracts
                    </span>
                    <span className="font-bold">{contractStats.player.expired + contractStats.staff.expired}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Terminated Contracts
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
              <CardTitle>Upcoming Contract Renewals</CardTitle>
              <CardDescription>Contracts expiring in the next 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No contracts expiring in the next 6 months</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
