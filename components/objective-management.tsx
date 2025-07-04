"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Search, Trophy, Target, Eye, Edit, Trash2, DollarSign, Award, CheckCircle, Loader2 } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, RootState } from "@/lib/redux/store"
import { toast } from "sonner"
import { 
  fetchObjectiveGroups, 
  fetchObjectives,
  fetchPlayerObjectiveProgress,
  fetchTeamObjectiveProgress,
  createObjectiveGroup,
  updateObjectiveGroup,
  deleteObjectiveGroup,
  createObjective,
  deleteObjective,
  completeObjective,
  assignGroupToPlayers
} from "@/lib/redux/objectiveSlice"
import { fetchAllPlayers } from "@/lib/redux/playerSlice"
import { 
  ObjectiveGroup, 
  CreateObjectiveGroupDto,
  CreateObjectiveDto,
  CompleteObjectiveDto
} from "@/lib/types/objective-management"

export function ObjectivesManagement() {
  // Redux state
  const dispatch = useDispatch<AppDispatch>()
  const { 
    groups: objectiveGroups, 
    objectives,
    playerProgress,
    loading,
    error
  } = useSelector((state: RootState) => state.objectives)
  
  // Get players from Redux store
  const { players: availablePlayers, loading: playersLoading } = useSelector((state: RootState) => state.players)
  
  // Local component state
  const [activeTab, setActiveTab] = useState("objectives")
  const [searchTerm, setSearchTerm] = useState("")
  const [isObjectiveDialogOpen, setIsObjectiveDialogOpen] = useState(false)
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [objectiveForm, setObjectiveForm] = useState({
    title: "",
    description: "",
    bonusAmount: "",
    assignedPlayers: [] as number[],
    groupId: undefined as number | undefined
  })
  
  const [groupForm, setGroupForm] = useState({
    name: "",
    selectedObjectives: [] as number[]
    // description removed - not supported by API
  })
  
  const [isGroupAssignDialogOpen, setIsGroupAssignDialogOpen] = useState(false)
  const [selectedGroupForAssignment, setSelectedGroupForAssignment] = useState<number | null>(null)
  const [groupAssignmentPlayers, setGroupAssignmentPlayers] = useState<number[]>([])
  
  // Additional state for group management
  const [isGroupDetailsDialogOpen, setIsGroupDetailsDialogOpen] = useState(false)
  const [selectedGroupForDetails, setSelectedGroupForDetails] = useState<ObjectiveGroup | null>(null)
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false)
  const [editGroupForm, setEditGroupForm] = useState({
    id: 0,
    name: ""
    // description removed - not supported by API
  })
  
  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchObjectiveGroups())
    dispatch(fetchObjectives())
    dispatch(fetchAllPlayers()) // Fetch real players from the API
    
    // If there's an active team in your app state, you can fetch team progress
    // For now, assuming we have a team with ID 1
    const activeTeamId = 1
    dispatch(fetchTeamObjectiveProgress(activeTeamId))
  }, [dispatch])
  
  // Load player progress when players are available
  useEffect(() => {
    if (availablePlayers.length > 0) {
      // Load progress for the first few players or all players depending on your needs
      const playerIds = availablePlayers.slice(0, 10).map(p => p.id) // Limit to first 10 for performance
      playerIds.forEach(playerId => {
        dispatch(fetchPlayerObjectiveProgress(playerId))
      })
    }
  }, [dispatch, availablePlayers])

  // Filter objectives based on search term
  const mappedObjectiveGroups = objectiveGroups.map(group => {
    const groupObjectiveIds = group.objectives?.map(obj => obj.id) || []
    const groupTotalBonus = group.objectives?.reduce((sum, obj) => sum + obj.bonusAmount, 0) || 0
    
    return {
      ...group,
      objectives: groupObjectiveIds,
      totalBonusPotential: groupTotalBonus,
      isActive: true
    }
  })
  
  // Filter objectives based on search term
  const filteredObjectives = objectives.filter((objective) => {
    const matchesSearch =
      objective.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (objective.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  // Statistics
  const totalActiveObjectives = objectives.length
  const completedObjectives = playerProgress.filter(p => p.isCompleted).length
  const totalBonusPotential = objectives.reduce((sum, o) => sum + o.bonusAmount, 0)
  const bonusesEarned = playerProgress
    .filter(p => p.isCompleted)
    .reduce((sum, p) => {
      const bonusAmount = p.customBonusAmount || (p.objective?.bonusAmount || 0)
      return sum + bonusAmount
    }, 0)

  // Utility functions
  const resetForms = () => {
    setObjectiveForm({
      title: "",
      description: "",
      bonusAmount: "",
      assignedPlayers: [],
      groupId: undefined
    })
    setGroupForm({
      name: "",
      selectedObjectives: []
      // description removed - not supported by API
    })
    setGroupAssignmentPlayers([])
    setSelectedGroupForAssignment(null)
    setEditGroupForm({ id: 0, name: "" })
  }

  const handleCreateObjective = async () => {
    try {
      // Validate that a group is selected
      if (!objectiveForm.groupId) {
        toast.error("Please select an objective group")
        return
      }
      
      // Create the objective
      const newObjectiveData: CreateObjectiveDto = {
        title: objectiveForm.title,
        description: objectiveForm.description,
        objectiveGroupId: objectiveForm.groupId,
        bonusAmount: parseFloat(objectiveForm.bonusAmount) || 0
      }
      
      const resultAction = await dispatch(createObjective(newObjectiveData))
      
      if (createObjective.fulfilled.match(resultAction)) {
        toast.success("Objective created successfully!")
        setIsObjectiveDialogOpen(false)
        resetForms()
      } else {
        toast.error("Failed to create objective")
      }
    } catch (error) {
      toast.error("Error creating objective")
      console.error(error)
    }
  }

  const handleCreateGroup = async () => {
    try {
      // Validate form
      if (!groupForm.name.trim()) {
        toast.error("Please enter a group name")
        return
      }
      
      // Create the group
      const newGroupData: CreateObjectiveGroupDto = {
        name: groupForm.name
        // Note: API doesn't accept description field for groups
      }
      
      const resultAction = await dispatch(createObjectiveGroup(newGroupData))
      
      if (createObjectiveGroup.fulfilled.match(resultAction)) {
        toast.success("Objective group created successfully!")
        setIsGroupDialogOpen(false)
        resetForms()
        
        // Refresh objective groups
        dispatch(fetchObjectiveGroups())
      } else {
        toast.error("Failed to create objective group")
      }
    } catch (error) {
      toast.error("Error creating objective group")
      console.error(error)
    }
  }

  // Function to assign a group to players (using new API)
  const handleAssignGroupToPlayers = async (groupId: number, playerIds: number[]) => {
    try {
      const resultAction = await dispatch(assignGroupToPlayers({ groupId, playerIds }))
      
      if (assignGroupToPlayers.fulfilled.match(resultAction)) {
        toast.success("Group assigned to players successfully!")
        // Refresh objective groups and player progress
        dispatch(fetchObjectiveGroups())
        playerIds.forEach(playerId => {
          dispatch(fetchPlayerObjectiveProgress(playerId))
        })
      } else {
        toast.error("Failed to assign group to players")
      }
    } catch (error) {
      toast.error("Error assigning group to players")
      console.error(error)
    }
  }

  // Function to handle objective completion
  const handleCompleteObjective = async (playerId: number, objectiveId: number) => {
    try {
      const completeData: CompleteObjectiveDto = {
        completionDate: new Date().toISOString()
      }
      
      const resultAction = await dispatch(completeObjective({ playerId, objectiveId, completeData }))
      
      if (completeObjective.fulfilled.match(resultAction)) {
        toast.success("Objective marked as completed!")
        // Refresh player progress
        dispatch(fetchPlayerObjectiveProgress(playerId))
      } else {
        toast.error("Failed to complete objective")
      }
    } catch (error) {
      toast.error("Error completing objective")
      console.error(error)
    }
  }
  
  // Function to delete an objective
  const handleObjectiveDelete = async (objectiveId: number) => {
    try {
      const resultAction = await dispatch(deleteObjective(objectiveId))
      
      if (deleteObjective.fulfilled.match(resultAction)) {
        toast.success("Objective deleted successfully!")
      } else {
        toast.error("Failed to delete objective")
      }
    } catch (error) {
      toast.error("Error deleting objective")
      console.error(error)
    }
  }

  // Function to handle group editing
  const handleEditGroup = (group: ObjectiveGroup) => {
    setEditGroupForm({
      id: group.id,
      name: group.name
      // description removed - not supported by API
    })
    setIsEditGroupDialogOpen(true)
  }

  // Function to update a group
  const handleUpdateGroup = async () => {
    try {
      if (!editGroupForm.name.trim()) {
        toast.error("Please enter a group name")
        return
      }

      const updateData = {
        name: editGroupForm.name
        // Note: API doesn't accept description field for groups
      }

      const resultAction = await dispatch(updateObjectiveGroup({ groupId: editGroupForm.id, groupData: updateData }))

      if (updateObjectiveGroup.fulfilled.match(resultAction)) {
        toast.success("Group updated successfully!")
        setIsEditGroupDialogOpen(false)
        setEditGroupForm({ id: 0, name: "" })
        // Refresh objective groups
        dispatch(fetchObjectiveGroups())
      } else {
        toast.error("Failed to update group")
      }
    } catch (error) {
      toast.error("Error updating group")
      console.error(error)
    }
  }

  // Function to view group details
  const handleViewGroupDetails = (group: ObjectiveGroup) => {
    setSelectedGroupForDetails(group)
    setIsGroupDetailsDialogOpen(true)
  }

  // Function to delete a group
  const handleDeleteGroup = async (groupId: number) => {
    try {
      // Check if group has objectives
      const groupObjectives = objectives.filter(obj => obj.group?.id === groupId)
      
      if (groupObjectives.length > 0) {
        toast.error("Cannot delete group that contains objectives. Please delete or reassign objectives first.")
        return
      }

      const resultAction = await dispatch(deleteObjectiveGroup(groupId))

      if (deleteObjectiveGroup.fulfilled.match(resultAction)) {
        toast.success("Group deleted successfully!")
        // Refresh objective groups
        dispatch(fetchObjectiveGroups())
      } else {
        toast.error("Failed to delete group")
      }
    } catch (error) {
      toast.error("Error deleting group")
      console.error(error)
    }
  }

  // Show loading state when data is being fetched
  if (loading.groups || loading.objectives || loading.progress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-lg font-medium">Loading objectives data...</p>
      </div>
    )
  }
  
  // Show error state if there's an issue with loading the data
  if (error.groups || error.objectives || error.progress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 max-w-md">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Data</h3>
          <p className="text-sm text-red-700">
            {error.groups || error.objectives || error.progress}
          </p>
          <Button 
            className="mt-4 bg-red-600 hover:bg-red-700" 
            onClick={() => {
              dispatch(fetchObjectiveGroups())
              dispatch(fetchObjectives())
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Objectives & Rewards Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Create objective groups, assign them to players, and track performance bonuses</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isObjectiveDialogOpen} onOpenChange={setIsObjectiveDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Objective
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Objective</DialogTitle>
                <DialogDescription>Set up a new performance objective with bonus rewards</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Objective Title</Label>
                  <Input
                    id="title"
                    value={objectiveForm.title}
                    onChange={(e) => setObjectiveForm({ ...objectiveForm, title: e.target.value })}
                    placeholder="e.g., Score 10 goals this season"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={objectiveForm.description}
                    onChange={(e) => setObjectiveForm({ ...objectiveForm, description: e.target.value })}
                    placeholder="Detailed description of the objective"
                  />
                </div>

                <div>
                  <Label htmlFor="bonusAmount">Bonus Amount ($)</Label>
                  <Input
                    id="bonusAmount"
                    type="number"
                    value={objectiveForm.bonusAmount}
                    onChange={(e) => setObjectiveForm({ ...objectiveForm, bonusAmount: e.target.value })}
                    placeholder="5000"
                  />
                </div>

                <div>
                  <Label htmlFor="groupSelect">Objective Group *</Label>
                  <Select 
                    value={objectiveForm.groupId?.toString()} 
                    onValueChange={(value) => setObjectiveForm({ ...objectiveForm, groupId: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an objective group" />
                    </SelectTrigger>
                    <SelectContent>
                      {objectiveGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    Create a group first if none exist. Players will be assigned to groups, not individual objectives.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsObjectiveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateObjective}>Create Objective</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Objective Group
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Create Objective Group</DialogTitle>
                <DialogDescription>Group multiple objectives together for easier management. You can assign players to the group after creation.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input 
                    id="groupName" 
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                    placeholder="e.g., Forward Performance Package" 
                  />
                </div>
                {/* Description field removed - not supported by API */}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateGroup}>Create Group</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Objectives</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalActiveObjectives}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Currently tracking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedObjectives}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Objectives achieved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bonus Potential</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">${totalBonusPotential.toLocaleString()}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bonuses Earned</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">${bonusesEarned.toLocaleString()}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">This period</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="objectives">Objectives</TabsTrigger>
          <TabsTrigger value="progress">Player Progress</TabsTrigger>
          <TabsTrigger value="groups">Objective Groups</TabsTrigger>
          <TabsTrigger value="rewards">Rewards Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="objectives" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Objectives</CardTitle>
              <CardDescription>Manage individual and team performance objectives</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search objectives..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Objectives Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Objective</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Bonus Amount</TableHead>
                    <TableHead>Assigned Players</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredObjectives.map((objective) => {
                    const assignedPlayers = playerProgress
                      .filter(p => p.objective.id === objective.id)
                      .map(p => p.player)
                    
                    return (
                      <TableRow key={objective.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{objective.name}</p>
                            <p className="text-sm text-gray-500">{objective.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {objective.group ? (
                            <Badge variant="outline">{objective.group.name}</Badge>
                          ) : (
                            <span className="text-gray-400">No group</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-600">
                            ${objective.bonusAmount.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          {assignedPlayers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {assignedPlayers.slice(0, 3).map((player) => (
                                <Badge key={player.id} variant="secondary" className="text-xs">
                                  {player.firstName} {player.lastName}
                                </Badge>
                              ))}
                              {assignedPlayers.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{assignedPlayers.length - 3} more
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 bg-transparent"
                              onClick={() => handleObjectiveDelete(objective.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Player Progress Tracking</CardTitle>
              <CardDescription>Monitor individual player progress on assigned objectives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {playersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-gray-500">Loading player progress...</span>
                  </div>
                ) : availablePlayers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No players found. Please ensure players are created in the team management section.</p>
                  </div>
                ) : (
                  availablePlayers.map((player) => {
                    // Filter player progress data from Redux store
                  const playerProgressData = playerProgress.filter(p => p.player?.id === player.id)

                  if (playerProgressData.length === 0) {
                    return (
                      <div key={player.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">{player.firstName} {player.lastName}</h3>
                            <p className="text-sm text-gray-500">
                              {player.position}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 text-center py-4">
                          No objectives assigned to this player
                        </p>
                      </div>
                    )
                  }

                  return (
                    <div key={player.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{player.firstName} {player.lastName}</h3>
                          <p className="text-sm text-gray-500">
                            {player.position}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Potential Bonus</p>
                          <p className="font-semibold text-green-600">
                            ${playerProgressData.reduce((sum, p) => sum + p.objective.bonusAmount, 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {playerProgressData.map((progress) => {
                          return (
                            <div
                              key={progress.id}
                              className={`flex items-center justify-between p-3 rounded ${
                                progress.isCompleted 
                                  ? 'bg-green-50 border-l-4 border-green-500 dark:bg-green-900/20' 
                                  : 'bg-gray-50 dark:bg-gray-800'
                              }`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-sm">{progress.objective.name}</p>
                                  <Badge variant={progress.isCompleted ? "default" : "outline"}>
                                    {progress.isCompleted ? "Completed" : "In Progress"}
                                  </Badge>
                                </div>
                                {progress.completionDate && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Completed: {new Date(progress.completionDate).toLocaleDateString()}
                                  </p>
                                )}
                                {progress.progressNotes && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    Notes: {progress.progressNotes}
                                  </p>
                                )}
                              </div>
                              <div className="ml-4 text-right">
                                <p className="text-sm font-medium text-green-600">
                                  ${(progress.customBonusAmount || progress.objective.bonusAmount).toLocaleString()}
                                </p>
                                {!progress.isCompleted && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-2"
                                    onClick={() => handleCompleteObjective(progress.player.id, progress.objective.id)}
                                  >
                                    Mark Complete
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                }))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Objective Groups</CardTitle>
              <CardDescription>Manage grouped objectives for easier assignment and tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mappedObjectiveGroups.map((group) => (
                  <Card key={group.id} className="border-l-4 border-l-blue-600">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{group.name}</CardTitle>
                          <CardDescription>{group.description}</CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Total Bonus Potential</p>
                          <p className="text-lg font-bold text-green-600">
                            ${group.totalBonusPotential.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Objectives ({group.objectives?.length || 0})</Label>
                          <div className="space-y-1 mt-1">
                            {(group.objectives || []).map((objId: number) => {
                              const objective = objectives.find((o) => o.id === objId)
                              return objective ? (
                                <div key={objId} className="flex items-center justify-between text-sm">
                                  <span>{objective.name}</span>
                                  <span className="text-green-600">${objective.bonusAmount.toLocaleString()}</span>
                                </div>
                              ) : null
                            })}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">
                            Assigned Players ({group.assignedPlayers?.length || 0})
                          </Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(group.assignedPlayers || []).slice(0, 6).map((player) => {
                              return (
                                <Badge key={player.id} variant="secondary" className="text-xs">
                                  {player.firstName}
                                </Badge>
                              )
                            })}
                            {(group.assignedPlayers?.length || 0) > 6 && (
                              <Badge variant="secondary" className="text-xs">
                                +{(group.assignedPlayers?.length || 0) - 6}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedGroupForAssignment(group.id)
                            setIsGroupAssignDialogOpen(true)
                          }}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-100"
                        >
                          <Target className="h-4 w-4 mr-1" />
                          Assign to Players
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const originalGroup = objectiveGroups.find(g => g.id === group.id)
                            if (originalGroup) handleEditGroup(originalGroup)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit Group
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          const originalGroup = objectiveGroups.find(g => g.id === group.id)
                          if (originalGroup) handleViewGroupDetails(originalGroup)
                        }}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent"
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bonus Summary by Player</CardTitle>
                <CardDescription>Current bonus earnings and potential</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {playersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span className="text-gray-500">Loading bonus summary...</span>
                    </div>
                  ) : availablePlayers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No players found. Please ensure players are created in the team management section.</p>
                    </div>
                  ) : (
                    availablePlayers.map((player) => {
                      const playerProgressData = playerProgress.filter(p => p.player?.id === player.id)
                      const potentialBonus = playerProgressData.reduce((sum, p) => sum + p.objective.bonusAmount, 0)
                      const earnedBonus = playerProgressData
                        .filter(p => p.isCompleted)
                      .reduce((sum, p) => sum + (p.customBonusAmount || p.objective.bonusAmount), 0)

                    return (
                      <div key={player.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{player.firstName} {player.lastName}</p>
                          <p className="text-sm text-gray-500">{player.position}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Earned / Potential</p>
                          <p className="font-semibold">
                            <span className="text-green-600">${earnedBonus.toLocaleString()}</span>
                            <span className="text-gray-400"> / </span>
                            <span className="text-blue-600">${potentialBonus.toLocaleString()}</span>
                          </p>
                        </div>
                      </div>
                    )
                  }))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Objective Groups Summary</CardTitle>
                <CardDescription>Progress by objective groups</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mappedObjectiveGroups.map((group) => {
                    const groupObjectives = objectives.filter(obj => obj.group?.id === group.id)
                    const totalBonus = groupObjectives.reduce((sum, obj) => sum + obj.bonusAmount, 0)

                    return (
                      <div key={group.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {group.name}
                          </Badge>
                          <span className="text-sm text-gray-500">({groupObjectives.length} objectives)</span>
                        </div>
                        <p className="font-semibold text-blue-600">${totalBonus.toLocaleString()}</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
              <CardDescription>Recently completed objectives and bonuses earned</CardDescription>
            </CardHeader>
            <CardContent>
              {playerProgress.filter(p => p.isCompleted).length > 0 ? (
                <div className="space-y-3">
                  {playerProgress
                    .filter(p => p.isCompleted)
                    .sort((a, b) => new Date(b.completionDate || '').getTime() - new Date(a.completionDate || '').getTime())
                    .slice(0, 10)
                    .map((progress) => (
                      <div key={progress.id} className="flex items-center justify-between p-3 bg-green-50 border-l-4 border-green-500 rounded dark:bg-green-900/20">
                        <div>
                          <p className="font-medium text-sm">{progress.objective.name}</p>
                          <p className="text-sm text-gray-600">
                            {progress.player.firstName} {progress.player.lastName}
                          </p>
                          {progress.completionDate && (
                            <p className="text-xs text-gray-500">
                              {new Date(progress.completionDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            +${(progress.customBonusAmount || progress.objective.bonusAmount).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent achievements to display</p>
                  <p className="text-sm">Completed objectives will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Group Assignment Dialog */}
      <Dialog open={isGroupAssignDialogOpen} onOpenChange={setIsGroupAssignDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Assign Group to Players</DialogTitle>
            <DialogDescription>
              Select players to assign all objectives in this group to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Players</Label>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded p-2">
                {playersLoading ? (
                  <div className="col-span-2 flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">Loading players...</span>
                  </div>
                ) : availablePlayers.length === 0 ? (
                  <div className="col-span-2 text-center py-4">
                    <span className="text-sm text-gray-500">No players available</span>
                  </div>
                ) : (
                  availablePlayers.map((player) => (
                    <div key={player.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`assign-player-${player.id}`}
                        checked={groupAssignmentPlayers.includes(player.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setGroupAssignmentPlayers(prev => [...prev, player.id])
                          } else {
                            setGroupAssignmentPlayers(prev => prev.filter(id => id !== player.id))
                          }
                        }}
                      />
                      <Label htmlFor={`assign-player-${player.id}`} className="text-sm">
                        {player.firstName} {player.lastName} ({player.position})
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsGroupAssignDialogOpen(false)
                setGroupAssignmentPlayers([])
                setSelectedGroupForAssignment(null)
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (selectedGroupForAssignment && groupAssignmentPlayers.length > 0) {
                  await handleAssignGroupToPlayers(selectedGroupForAssignment, groupAssignmentPlayers)
                  setIsGroupAssignDialogOpen(false)
                  setGroupAssignmentPlayers([])
                  setSelectedGroupForAssignment(null)
                  // Refresh player progress data
                  groupAssignmentPlayers.forEach(playerId => {
                    dispatch(fetchPlayerObjectiveProgress(playerId))
                  })
                }
              }}
              disabled={groupAssignmentPlayers.length === 0}
            >
              Assign Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Details Dialog */}
      <Dialog open={isGroupDetailsDialogOpen} onOpenChange={setIsGroupDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Objective Group Details</DialogTitle>
            <DialogDescription>
              View and manage details of the objective group
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedGroupForDetails && (
              <div>
                <h3 className="text-lg font-semibold">{selectedGroupForDetails.name}</h3>
                <p className="text-sm text-gray-500">{selectedGroupForDetails.description}</p>
                
                <div className="mt-4">
                  <Label className="text-sm font-medium">Objectives ({selectedGroupForDetails.objectives?.length || 0})</Label>
                  <div className="space-y-1 mt-1">
                    {(selectedGroupForDetails.objectives || []).map((objective) => {
                      // Handle Objective[] type from API
                      return (
                        <div key={objective.id} className="flex items-center justify-between text-sm">
                          <span>{objective.name}</span>
                          <span className="text-green-600">${objective.bonusAmount.toLocaleString()}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-4">
                  <Label className="text-sm font-medium">
                    Assigned Players ({selectedGroupForDetails.assignedPlayers?.length || 0})
                  </Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {/* Use assignedPlayers from API response if available */}
                    {selectedGroupForDetails.assignedPlayers?.length ? (
                      selectedGroupForDetails.assignedPlayers.slice(0, 6).map((player) => (
                        <Badge key={player.id} variant="secondary" className="text-xs">
                          {player.firstName} {player.lastName}
                        </Badge>
                      ))
                    ) : (
                      /* Fallback to calculating from progress data */
                      Array.from(new Set(
                        playerProgress
                          .filter(p => selectedGroupForDetails.objectives?.some(obj => obj.id === p.objective.id))
                          .map(p => p.player)
                      )).slice(0, 6).map((player) => (
                        <Badge key={player.id} variant="secondary" className="text-xs">
                          {player.firstName} {player.lastName}
                        </Badge>
                      ))
                    )}
                    
                    {/* Show "+X more" badge */}
                    {selectedGroupForDetails.assignedPlayers?.length && selectedGroupForDetails.assignedPlayers.length > 6 && (
                      <Badge variant="secondary" className="text-xs">
                        +{selectedGroupForDetails.assignedPlayers.length - 6}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGroupDetailsDialogOpen(false)}>
              Close
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setIsGroupDetailsDialogOpen(false)
                if (selectedGroupForDetails) {
                  setSelectedGroupForAssignment(selectedGroupForDetails.id)
                  setIsGroupAssignDialogOpen(true)
                }
              }}
            >
              Add More Players
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={isEditGroupDialogOpen} onOpenChange={setIsEditGroupDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Objective Group</DialogTitle>
            <DialogDescription>
              Update the details of the objective group
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editGroupName">Group Name</Label>
              <Input 
                id="editGroupName" 
                value={editGroupForm.name}
                onChange={(e) => setEditGroupForm({ ...editGroupForm, name: e.target.value })}
                placeholder="e.g., Forward Performance Package" 
              />
            </div>
            {/* Description field removed - not supported by API */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditGroupDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateGroup}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
