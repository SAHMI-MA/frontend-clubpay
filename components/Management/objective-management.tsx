"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Plus, Trophy, Target, Eye, Edit, Trash2, DollarSign, Award, CheckCircle, Loader2, RefreshCw } from "lucide-react"
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
  updateObjective,
  completeObjective,
  assignGroupToPlayers,
  assignObjectiveToPlayer,
  bulkAssignObjective
} from "@/lib/redux/objectiveSlice"
import { fetchAllPlayers } from "@/lib/redux/playerSlice"
import { fetchAllTeams } from "@/lib/redux/teamSlice"
import { 
  ObjectiveGroup, 
  CreateObjectiveGroupDto,
  CreateObjectiveDto,
  AssignObjectiveDto,
  BulkAssignObjectiveDto
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
  
  // Get teams from Redux store
  const { teams } = useSelector((state: RootState) => state.teams)
  
  // Local component state
  const [activeTab, setActiveTab] = useState("groups")
  const [isObjectiveDialogOpen, setIsObjectiveDialogOpen] = useState(false)
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [objectiveForm, setObjectiveForm] = useState({
    title: "",
    description: "",
    bonusAmount: "",
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
  
  // State for objective editing
  const [isEditObjectiveDialogOpen, setIsEditObjectiveDialogOpen] = useState(false)
  const [editObjectiveForm, setEditObjectiveForm] = useState({
    id: 0,
    title: "",
    description: "",
    bonusAmount: "",
    groupId: undefined as number | undefined
  })
  
  // State for confirmation dialogs
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [deleteConfirmData, setDeleteConfirmData] = useState<{
    type: 'objective' | 'group'
    id: number
    name: string
  } | null>(null)
  
  // State for individual objective assignment
  const [isObjectiveAssignDialogOpen, setIsObjectiveAssignDialogOpen] = useState(false)
  const [selectedObjectiveForAssignment, setSelectedObjectiveForAssignment] = useState<number | null>(null)
  const [objectiveAssignmentPlayers, setObjectiveAssignmentPlayers] = useState<number[]>([])
  
  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchObjectiveGroups())
    dispatch(fetchObjectives())
    dispatch(fetchAllPlayers()) // Fetch real players from the API
    dispatch(fetchAllTeams()) // Fetch teams from the API
    
    // If there are teams available, fetch team progress for the first team
    // Only after teams are loaded
  }, [dispatch])
  
  // Load team progress when teams are available
  useEffect(() => {
    if (teams.length > 0) {
      const firstTeamId = teams[0].id
      dispatch(fetchTeamObjectiveProgress(firstTeamId))
        .catch((error) => {
          console.warn(`Failed to fetch team objective progress for team ${firstTeamId}:`, error)
          // Don't show error toast as this is optional functionality
        })
    }
  }, [dispatch, teams])
  
  // Load player progress when players are available
  useEffect(() => {
    if (availablePlayers.length > 0) {
      // Load progress for all players
      availablePlayers.forEach(player => {
        dispatch(fetchPlayerObjectiveProgress(player.id))
      })
    }
  }, [dispatch, availablePlayers])

  // Debug data state (only log when counts change, not on every data update)
  useEffect(() => {
    console.log('📊 Current data state:', {
      objectiveGroups: objectiveGroups.length,
      objectives: objectives.length,
      availablePlayers: availablePlayers.length,
      playerProgress: playerProgress.length,
      objectiveGroupsData: objectiveGroups.map(g => ({
        id: g.id,
        name: g.name,
        hasObjectivesArray: !!g.objectives,
        objectivesArrayLength: g.objectives?.length || 0,
        filteredObjectivesCount: objectives.filter(obj => obj.objectiveGroupId === g.id).length
      })),
      playerProgressSample: playerProgress.slice(0, 3).map(p => ({
        playerId: (p as any).__playerId,
        playerName: `Player ID ${(p as any).__playerId}`, // We don't have player name in progress data anymore
        objectiveId: p.objective?.id,
        objectiveTitle: p.objective?.title,
        isCompleted: p.isCompleted
      }))
    })
    
    // Removed automatic sync to prevent infinite loops
    // Users can manually sync using the "Sync Assignments" button on each group
    
  }, [objectiveGroups.length, objectives.length, availablePlayers.length, playerProgress.length, objectiveGroups, objectives, playerProgress])

  // Filter objectives based on search term and calculate accurate summaries
  const mappedObjectiveGroups = objectiveGroups.map(group => {
    // Use objectives from the group object itself (API includes them)
    const groupObjectives = group.objectives || []
    const groupObjectiveIds = groupObjectives.map(obj => obj.id)
    const groupTotalBonus = groupObjectives.reduce((sum, obj) => sum + Number(obj.bonusAmount), 0)
    
    return {
      ...group,
      objectiveIds: groupObjectiveIds,  // Keep IDs separate
      totalBonusPotential: groupTotalBonus,
      isActive: true,
      objectiveCount: groupObjectives.length
    }
  })
  
  // Statistics
  const totalActiveObjectives = objectives.length
  const completedObjectives = playerProgress.filter(p => p.isCompleted).length
  
  // Calculate total bonus potential based on group assignments
  const totalBonusPotential = objectiveGroups.reduce((sum, group) => {
    const assignedPlayersCount = group.assignedPlayers?.length || 0
    // Use objectives from the group object itself (API includes them)
    const groupObjectives = group.objectives || []
    const groupObjectivesBonus = groupObjectives.reduce((objSum, obj) => objSum + Number(obj.bonusAmount), 0)
    return sum + (assignedPlayersCount * groupObjectivesBonus)
  }, 0)
  
  const bonusesEarned = playerProgress
    .filter(p => p.isCompleted)
    .reduce((sum, p) => {
      const bonusAmount = Number(p.bonus) || Number(p.objective?.bonusAmount) || 0
      return sum + bonusAmount
    }, 0)

  // Utility functions
  const resetForms = () => {
    setObjectiveForm({
      title: "",
      description: "",
      bonusAmount: "",
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
    setObjectiveAssignmentPlayers([])
    setSelectedObjectiveForAssignment(null)
  }

  const handleCreateObjective = async () => {
    try {
      // Validate that a group is selected
      if (!objectiveForm.groupId) {
        toast.error("Veuillez sélectionner un groupe d'objectifs")
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
        const newObjective = resultAction.payload
        toast.success("Objectif créé avec succès !")
        
        // Find the group and assign the new objective to all players in that group
        const targetGroup = objectiveGroups.find(group => group.id === objectiveForm.groupId)
        if (targetGroup && targetGroup.assignedPlayers && targetGroup.assignedPlayers.length > 0) {
          // Assign the new objective to each player in the group
          for (const player of targetGroup.assignedPlayers) {
            try {
              const assignData: AssignObjectiveDto = {
                objectiveId: newObjective.id,
                playerId: player.id
              }
              await dispatch(assignObjectiveToPlayer(assignData))
            } catch (error) {
              console.error(`Échec de l'attribution de l'objectif au joueur ${player.id}:`, error)
            }
          }
          
          // Refresh player progress for all affected players
          targetGroup.assignedPlayers.forEach(player => {
            dispatch(fetchPlayerObjectiveProgress(player.id))
          })
          
          toast.success(`Objectif attribué à ${targetGroup.assignedPlayers.length} joueur(s) !`)
        }
        
        setIsObjectiveDialogOpen(false)
        resetForms()
        // Refresh both objectives and groups to update the UI
        dispatch(fetchObjectives())
        dispatch(fetchObjectiveGroups())
      } else {
        toast.error("Échec de la création de l'objectif")
      }
    } catch (error) {
      toast.error("Erreur lors de la création de l'objectif")
      console.error(error)
    }
  }

  const handleCreateGroup = async () => {
    try {
      // Validate form
      if (!groupForm.name.trim()) {
        toast.error("Veuillez entrer un nom de groupe")
        return
      }
      
      // Create the group
      const newGroupData: CreateObjectiveGroupDto = {
        name: groupForm.name
        // Note: API doesn't accept description field for groups
      }
      
      const resultAction = await dispatch(createObjectiveGroup(newGroupData))
      
      if (createObjectiveGroup.fulfilled.match(resultAction)) {
        toast.success("Groupe d'objectifs créé avec succès !")
        setIsGroupDialogOpen(false)
        resetForms()
        
        // Refresh objective groups
        dispatch(fetchObjectiveGroups())
      } else {
        toast.error("Échec de la création du groupe d'objectifs")
      }
    } catch (error) {
      toast.error("Erreur lors de la création du groupe d'objectifs")
      console.error(error)
    }
  }

  // Function to assign a group to players (using new API)
  const handleAssignGroupToPlayers = async (groupId: number, playerIds: number[]) => {
    try {
      const resultAction = await dispatch(assignGroupToPlayers({ groupId, playerIds }))
      
      if (assignGroupToPlayers.fulfilled.match(resultAction)) {
        toast.success(`Groupe attribué à ${playerIds.length} joueur(s) avec succès !`)
        
        // Find the group objectives from the group object itself (API includes them)
        const targetGroup = objectiveGroups.find(group => group.id === groupId)
        const groupObjectives = targetGroup?.objectives || []
        
        if (groupObjectives.length > 0) {
          let assignmentCount = 0
          
          // Assign each objective in the group to each newly assigned player
          for (const objective of groupObjectives) {
            for (const playerId of playerIds) {
              try {
                const assignData: AssignObjectiveDto = {
                  objectiveId: objective.id,
                  playerId: playerId
                }
                await dispatch(assignObjectiveToPlayer(assignData))
                assignmentCount++
              } catch (error) {
                console.error(`Échec de l'attribution de l'objectif ${objective.id} au joueur ${playerId}:`, error)
              }
            }
          }
          
          if (assignmentCount > 0) {
            toast.success(`${assignmentCount} attributions d'objectifs créées !`)
          }
        }
        
        // Refresh objective groups and player progress
        dispatch(fetchObjectiveGroups())
        playerIds.forEach(playerId => {
          dispatch(fetchPlayerObjectiveProgress(playerId))
        })
      } else {
        toast.error("Échec de l'attribution du groupe aux joueurs")
      }
    } catch (error) {
      toast.error("Erreur lors de l'attribution du groupe aux joueurs")
      console.error(error)
    }
  }

  // Helper function to sync all objectives in a group with all assigned players
  const syncGroupObjectivesWithPlayers = async (groupId: number) => {
    try {
      console.log('🔄 Synchronisation manuelle déclenchée pour le groupe', groupId)
      const targetGroup = objectiveGroups.find(group => group.id === groupId)
      const groupObjectives = targetGroup?.objectives || []
      
      if (!targetGroup || !targetGroup.assignedPlayers || groupObjectives.length === 0) {
        console.log('❌ Impossible de synchroniser : données de groupe manquantes', { targetGroup, objectiveCount: groupObjectives.length })
        return
      }

      let assignmentCount = 0
      
      // Assign each objective in the group to each assigned player
      for (const objective of groupObjectives) {
        for (const player of targetGroup.assignedPlayers) {
          try {
            // Check if this assignment already exists in progress data
            const existingProgress = playerProgress.find(
              p => (p as any).__playerId === player.id && p.objective?.id === objective.id
            )
            
            if (!existingProgress) {
              console.log('➕ Création d\'attribution:', { objectiveId: objective.id, playerId: player.id })
              const assignData: AssignObjectiveDto = {
                objectiveId: objective.id,
                playerId: player.id
              }
              await dispatch(assignObjectiveToPlayer(assignData))
              assignmentCount++
            } else {
              console.log('✅ Attribution déjà existante:', { objectiveId: objective.id, playerId: player.id })
            }
          } catch (error) {
            console.error(`Échec de l'attribution de l'objectif ${objective.id} au joueur ${player.id}:`, error)
          }
        }
      }
      
      if (assignmentCount > 0) {
        toast.success(`${assignmentCount} attributions d'objectifs manquantes créées !`)
        
        // Only refresh progress for affected players
        targetGroup.assignedPlayers.forEach((player, index) => {
          setTimeout(() => {
            dispatch(fetchPlayerObjectiveProgress(player.id))
          }, index * 100)
        })
      } else {
        toast.info("Tous les objectifs sont déjà attribués aux joueurs de ce groupe.")
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation des objectifs du groupe avec les joueurs:', error)
      toast.error("Erreur lors de la synchronisation des attributions")
    }
  }

  // Function to handle objective completion
  const handleCompleteObjective = async (playerId: number, objectiveId: number) => {
    try {
      // First, check if this objective is actually assigned to the player
      const playerProgressForObjective = playerProgress.find(
        p => (p as any).__playerId === playerId && p.objective?.id === objectiveId
      )
      
      if (!playerProgressForObjective) {
        toast.error("Cet objectif n'est pas attribué au joueur. Veuillez d'abord attribuer le groupe d'objectifs.")
        return
      }
      
      if (playerProgressForObjective.isCompleted) {
        toast.info("Cet objectif est déjà complété.")
        return
      }
      
      // Send empty object - API doesn't accept completionDate property
      const completeData = {}
      
      const resultAction = await dispatch(completeObjective({ playerId, objectiveId, completeData }))
      
      if (completeObjective.fulfilled.match(resultAction)) {
        toast.success("Objectif marqué comme complété !")
        // Refresh player progress
        dispatch(fetchPlayerObjectiveProgress(playerId))
      } else {
        toast.error("Échec de la complétion de l'objectif")
      }
    } catch (error) {
      toast.error("Erreur lors de la complétion de l'objectif")
      console.error(error)
    }
  }
  
  // Function to delete an objective
  const handleObjectiveDelete = async (objectiveId: number) => {
    const objective = objectives.find(obj => obj.id === objectiveId)
    if (!objective) return
    
    setDeleteConfirmData({
      type: 'objective',
      id: objectiveId,
      name: objective.title || objective.name || 'Objectif sans nom'
    })
    setIsDeleteConfirmOpen(true)
  }

  // Function to delete a group
  const handleDeleteGroup = async (groupId: number) => {
    const group = objectiveGroups.find(g => g.id === groupId)
    if (!group) return
    
    // Check if group has objectives
    const groupObjectives = objectives.filter(obj => obj.objectiveGroupId === groupId)
    
    if (groupObjectives.length > 0) {
      toast.error("Impossible de supprimer le groupe qui contient des objectifs. Veuillez supprimer ou réassigner les objectifs d'abord.")
      return
    }

    setDeleteConfirmData({
      type: 'group',
      id: groupId,
      name: group.name
    })
    setIsDeleteConfirmOpen(true)
  }

  // Function to execute the confirmed delete action
  const executeDelete = async () => {
    if (!deleteConfirmData) return
    
    try {
      if (deleteConfirmData.type === 'objective') {
        const resultAction = await dispatch(deleteObjective(deleteConfirmData.id))
        
        if (deleteObjective.fulfilled.match(resultAction)) {
          toast.success("Objectif supprimé avec succès !")
          // Refresh both objectives and groups to update the UI
          dispatch(fetchObjectives())
          dispatch(fetchObjectiveGroups())
        } else {
          toast.error("Échec de la suppression de l'objectif")
        }
      } else if (deleteConfirmData.type === 'group') {
        const resultAction = await dispatch(deleteObjectiveGroup(deleteConfirmData.id))

        if (deleteObjectiveGroup.fulfilled.match(resultAction)) {
          toast.success("Groupe supprimé avec succès !")
          // Refresh objective groups
          dispatch(fetchObjectiveGroups())
        } else {
          toast.error("Échec de la suppression du groupe")
        }
      }
    } catch (error) {
      toast.error(`Erreur lors de la suppression de ${deleteConfirmData.type}`)
      console.error(error)
    } finally {
      setIsDeleteConfirmOpen(false)
      setDeleteConfirmData(null)
    }
  }

  // Function to handle objective editing
  const handleEditObjective = (objective: any) => {
    setEditObjectiveForm({
      id: objective.id,
      title: objective.title,
      description: objective.description,
      bonusAmount: objective.bonusAmount?.toString() || "",
      groupId: objective.objectiveGroupId
    })
    setIsEditObjectiveDialogOpen(true)
  }

  // Function to submit objective update
  const handleObjectiveUpdate = async () => {
    try {
      if (!editObjectiveForm.title.trim()) {
        toast.error("Veuillez fournir un titre d'objectif")
        return
      }

      const updateData = {
        title: editObjectiveForm.title,
        description: editObjectiveForm.description,
        objectiveGroupId: editObjectiveForm.groupId,
        bonusAmount: parseFloat(editObjectiveForm.bonusAmount) || 0
      }

      const resultAction = await dispatch(updateObjective({ 
        objectiveId: editObjectiveForm.id, 
        objectiveData: updateData 
      }))
      
      if (updateObjective.fulfilled.match(resultAction)) {
        // If the group was changed, assign the objective to all players in the new group
        if (editObjectiveForm.groupId) {
          const targetGroup = objectiveGroups.find(group => group.id === editObjectiveForm.groupId)
          if (targetGroup && targetGroup.assignedPlayers && targetGroup.assignedPlayers.length > 0) {
            // Assign the updated objective to each player in the new group
            for (const player of targetGroup.assignedPlayers) {
              try {
                const assignData: AssignObjectiveDto = {
                  objectiveId: editObjectiveForm.id,
                  playerId: player.id
                }
                await dispatch(assignObjectiveToPlayer(assignData))
              } catch (error) {
                console.error(`Échec de l'attribution de l'objectif au joueur ${player.id}:`, error)
              }
            }
            
            // Refresh player progress for all affected players
            targetGroup.assignedPlayers.forEach(player => {
              dispatch(fetchPlayerObjectiveProgress(player.id))
            })
          }
        }
        
        toast.success("Objectif mis à jour avec succès !")
        setEditObjectiveForm({
          id: 0,
          title: "",
          description: "",
          bonusAmount: "",
          groupId: undefined
        })
        setIsEditObjectiveDialogOpen(false)
        // Refresh both objectives and groups to update the UI
        dispatch(fetchObjectives())
        dispatch(fetchObjectiveGroups())
      } else {
        toast.error("Échec de la mise à jour de l'objectif")
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour de l'objectif")
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
        toast.error("Veuillez entrer un nom de groupe")
        return
      }

      const updateData = {
        name: editGroupForm.name
        // Note: API doesn't accept description field for groups
      }

      const resultAction = await dispatch(updateObjectiveGroup({ groupId: editGroupForm.id, groupData: updateData }))

      if (updateObjectiveGroup.fulfilled.match(resultAction)) {
        toast.success("Groupe mis à jour avec succès !")
        setIsEditGroupDialogOpen(false)
        setEditGroupForm({ id: 0, name: "" })
        // Refresh objective groups
        dispatch(fetchObjectiveGroups())
      } else {
        toast.error("Échec de la mise à jour du groupe")
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du groupe")
      console.error(error)
    }
  }

  // Function to refresh all data
  const refreshAllData = () => {
    console.log('🔄 Rafraîchissement manuel déclenché')
    dispatch(fetchObjectiveGroups())
    dispatch(fetchObjectives())
    dispatch(fetchAllPlayers())
    
    // Refresh player progress for all players (with a small delay to avoid rate limiting)
    setTimeout(() => {
      if (availablePlayers.length > 0) {
        availablePlayers.forEach((player, index) => {
          setTimeout(() => {
            dispatch(fetchPlayerObjectiveProgress(player.id))
          }, index * 100) // Stagger the requests
        })
      }
    }, 500)
    
    // Refresh team progress (only if teams are available)
    if (teams.length > 0) {
      const firstTeamId = teams[0].id
      dispatch(fetchTeamObjectiveProgress(firstTeamId))
        .catch((error) => {
          console.warn(`Failed to fetch team objective progress for team ${firstTeamId}:`, error)
        })
    }
    
    toast.success("Données rafraîchies avec succès !")
  }

  // Function to view group details
  const handleViewGroupDetails = (group: ObjectiveGroup) => {
    setSelectedGroupForDetails(group)
    setIsGroupDetailsDialogOpen(true)
  }

  // Function to handle individual objective assignment to multiple players
  const handleAssignObjectiveToPlayers = async (objectiveId: number, playerIds: number[]) => {
    try {
      console.log('🎯 Attribution de l\'objectif', objectiveId, 'aux joueurs', playerIds)
      
      const bulkAssignData: BulkAssignObjectiveDto = {
        objectiveId: objectiveId,
        playerIds: playerIds
      }
      
      console.log('📤 Envoi de la requête d\'attribution en masse:', bulkAssignData)
      
      const resultAction = await dispatch(bulkAssignObjective(bulkAssignData))
      
      if (bulkAssignObjective.fulfilled.match(resultAction)) {
        console.log('✅ Attribution réussie:', resultAction.payload)
        toast.success(`Objectif attribué à ${playerIds.length} joueur(s) avec succès !`)
        
        // Only refresh data for the affected players, not everything
        playerIds.forEach(playerId => {
          console.log('🔄 Rafraîchissement de la progression pour le joueur', playerId)
          dispatch(fetchPlayerObjectiveProgress(playerId))
        })
        
        // Refresh groups to show updated assignments
        dispatch(fetchObjectiveGroups())
        
      } else {
        console.error('❌ Attribution échouée:', resultAction)
        toast.error("Échec de l'attribution de l'objectif aux joueurs")
      }
    } catch (error) {
      console.error('💥 Erreur d\'attribution:', error)
      toast.error("Erreur lors de l'attribution de l'objectif aux joueurs")
    }
  }

  // Show loading state when data is being fetched
  if (loading.groups || loading.objectives || loading.progress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-lg font-medium">Chargement des données des objectifs...</p>
      </div>
    )
  }
  
  // Show error state if there's an issue with loading the data
  if (error.groups || error.objectives || error.progress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 max-w-md">
          <h3 className="text-lg font-medium text-red-800 mb-2">Erreur de chargement des données</h3>
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
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des objectifs et récompenses</h1>
          <p className="text-gray-600 dark:text-gray-400">Créez des groupes d'objectifs, assignez-les aux joueurs et suivez les primes de performance</p>
          {/* Debug info */}
          <div className="text-xs text-gray-500 mt-1">
            Entrées de progression : {playerProgress.length} | Joueurs : {availablePlayers.length} | Groupes : {objectiveGroups.length} | Objectifs : {objectives.length}
            <br />
            Mappage groupe-objectif : {objectiveGroups.map(g => {
              const count = g.objectives?.length || 0;
              return `${g.name}:${count}`;
            }).join(', ')}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={refreshAllData}
            className="bg-gray-50 hover:bg-gray-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Rafraîchir les données
          </Button>
          <Dialog open={isObjectiveDialogOpen} onOpenChange={setIsObjectiveDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouvel objectif
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un nouvel objectif</DialogTitle>
                <DialogDescription>Définissez un nouvel objectif de performance avec prime</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre de l'objectif</Label>
                  <Input
                    id="title"
                    value={objectiveForm.title}
                    onChange={(e) => setObjectiveForm({ ...objectiveForm, title: e.target.value })}
                    placeholder="ex : Marquer 10 buts cette saison"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={objectiveForm.description}
                    onChange={(e) => setObjectiveForm({ ...objectiveForm, description: e.target.value })}
                    placeholder="Description détaillée de l'objectif"
                  />
                </div>

                <div>
                  <Label htmlFor="bonusAmount">Montant de la prime (MAD)</Label>
                  <Input
                    id="bonusAmount"
                    type="number"
                    value={objectiveForm.bonusAmount}
                    onChange={(e) => setObjectiveForm({ ...objectiveForm, bonusAmount: e.target.value })}
                    placeholder="5000"
                  />
                </div>

                <div>
                  <Label htmlFor="groupSelect">Groupe d'objectifs *</Label>
                  <Select 
                    value={objectiveForm.groupId?.toString()} 
                    onValueChange={(value) => setObjectiveForm({ ...objectiveForm, groupId: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un groupe d'objectifs" />
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
                    Créez d'abord un groupe si aucun n'existe. Les joueurs sont assignés aux groupes, pas aux objectifs individuels.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsObjectiveDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateObjective}>Créer l'objectif</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Groupe d'objectifs
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Créer un groupe d'objectifs</DialogTitle>
                <DialogDescription>Regroupez plusieurs objectifs pour une gestion facilitée. Vous pouvez assigner des joueurs après création.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="groupName">Nom du groupe</Label>
                  <Input 
                    id="groupName" 
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                    placeholder="ex : Pack performance attaquants" 
                  />
                </div>
                {/* Description field removed - not supported by API */}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateGroup}>Créer le groupe</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objectifs actifs</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalActiveObjectives}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">En suivi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complétés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedObjectives}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Objectifs atteints</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potentiel de primes</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalBonusPotential.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total disponible</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Primes gagnées</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{bonusesEarned.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Cette période</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="groups">Groupes d'objectifs</TabsTrigger>
          <TabsTrigger value="progress">Progression joueurs</TabsTrigger>
          <TabsTrigger value="rewards">Synthèse des primes</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Suivi de la progression des joueurs</CardTitle>
              <CardDescription>Suivez la progression individuelle des joueurs sur les objectifs assignés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {playersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-gray-500">Chargement de la progression des joueurs...</span>
                  </div>
                ) : availablePlayers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Aucun joueur trouvé. Veuillez créer des joueurs dans la gestion d'équipe.</p>
                  </div>
                ) : (
                  availablePlayers.map((player) => {
                    // Filter player progress data from Redux store using the __playerId field
                    const playerProgressData = playerProgress.filter(p => (p as any).__playerId === player.id)
                    
                    // Debug logging for this player
                    if (player.id <= 3) { // Only log for first few players to avoid spam
                      console.log(`[UI] Joueur ${player.firstName} ${player.lastName} (ID: ${player.id}):`)
                      console.log('  - Total d\'éléments de progression dans le store:', playerProgress.length)
                      console.log('  - Éléments de progression pour ce joueur:', playerProgressData.length)
                      if (playerProgressData.length > 0) {
                        console.log('  - Éléments de progression:', playerProgressData.map(p => ({ 
                          id: p.id, 
                          playerId: (p as any).__playerId, 
                          objectiveId: p.objective?.id,
                          objectiveTitle: p.objective?.title
                        })))
                      }
                    }
                    
                    // Check if player is assigned to any groups
                    const assignedGroups = objectiveGroups.filter(group => 
                      group.assignedPlayers?.some(assignedPlayer => assignedPlayer.id === player.id)
                    )
                    
                    // Only show players that have actual progress data (assigned objectives) OR are assigned to groups
                    if (playerProgressData.length === 0 && assignedGroups.length === 0) {
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
                            Aucun objectif assigné à ce joueur. Utilisez l'onglet "Groupes d'objectifs" pour assigner des objectifs.
                          </p>
                        </div>
                      )
                    }

                    // If player is in groups but has no progress data, show a warning
                    if (playerProgressData.length === 0 && assignedGroups.length > 0) {
                      return (
                        <div key={player.id} className="border rounded-lg p-4 bg-yellow-50">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-semibold">{player.firstName} {player.lastName}</h3>
                              <p className="text-sm text-gray-500">
                                {player.position}
                              </p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={refreshAllData}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Rafraîchir
                            </Button>
                          </div>
                          <div className="text-sm text-amber-700">
                            <p className="font-medium">⚠️ Problème d'attribution détecté</p>
                            <p className="text-xs mt-1">
                              Le joueur est assigné à {assignedGroups.length} groupe(s) mais aucune progression d'objectif trouvée.
                            </p>
                            <p className="text-xs">
                              Groupes : {assignedGroups.map(g => g.name).join(', ')}
                            </p>
                            <p className="text-xs mt-2">
                              Cela signifie généralement que les données de progression de l'arrière-plan retournent des données invalides (IDs définis sur 0).
                              Essayez de cliquer sur "Rafraîchir" ou utilisez "Synchroniser les attributions" sur le groupe.
                            </p>
                          </div>
                        </div>
                      )
                    }

                    // Calculate potential bonus from actual assigned objectives
                    const potentialBonus = playerProgressData.reduce((sum, p) => sum + Number(p.objective.bonusAmount), 0)

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
                            <p className="text-sm text-gray-500">Prime potentielle</p>
                            <p className="font-semibold text-green-600">
                              {potentialBonus.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {playerProgressData.map((progressItem) => {
                            const objective = progressItem.objective
                            const isCompleted = progressItem.isCompleted
                            const completionDate = progressItem.completedAt
                            const customBonusAmount = progressItem.bonus

                            return (
                              <div
                                key={`${player.id}-${objective.id}`}
                                className={`flex items-center justify-between p-3 rounded ${
                                  isCompleted 
                                    ? 'bg-green-50 border-l-4 border-green-500 dark:bg-green-900/20' 
                                    : 'bg-gray-50 dark:bg-gray-800'
                                }`}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-sm">{objective.title}</p>
                                    <Badge variant={isCompleted ? "default" : "outline"}>
                                      {isCompleted ? "Complété" : "En cours"}
                                    </Badge>
                                  </div>
                                  {completionDate && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Terminé : {completionDate && new Date(completionDate).toLocaleDateString('fr-FR')}
                                    </p>
                                  )}

                                </div>
                                <div className="ml-4 text-right">
                                  <p className="text-sm font-medium text-green-600">
                                    {(Number(customBonusAmount) || Number(objective.bonusAmount)).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}
                                  </p>
                                  {!isCompleted && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="mt-2"
                                      onClick={() => handleCompleteObjective(player.id, objective.id)}
                                    >
                                      Marquer comme complété
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
              <CardTitle>Groupes d'objectifs</CardTitle>
              <CardDescription>Gérez les groupes d'objectifs pour une attribution et un suivi facilités</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mappedObjectiveGroups.map((group) => (
                  <Card key={group.id} className="border-l-4 border-l-blue-600">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{group.name}</CardTitle>
                          {/* Description removed - not in API response */}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Potentiel total de primes</p>
                          <p className="text-lg font-bold text-green-600">
                            {group.totalBonusPotential.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          {(() => {
                            // Use objectives from the group object itself (API includes them)
                            const groupObjectives = group.objectives || [];
                            console.log(`📋 Groupe ${group.id} (${group.name}):`, {
                              groupId: group.id,
                              totalObjectives: objectives.length,
                              groupObjectives: groupObjectives.length,
                              groupObjectiveData: groupObjectives.map(o => ({ id: o.id, title: o.title, bonusAmount: o.bonusAmount }))
                            });
                            return (
                              <>
                                <Label className="text-sm font-medium">Objectifs ({groupObjectives.length})</Label>
                                <div className="space-y-1 mt-1">
                                  {groupObjectives.map((objective) => (
                                    <div key={objective.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                                      <div className="flex-1">
                                        <span className="font-medium">{objective.title || objective.name}</span>
                                        {objective.description && (
                                          <p className="text-xs text-gray-500 mt-1">{objective.description}</p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 ml-4">
                                        <span className="text-green-600 font-medium text-xs">{Number(objective.bonusAmount).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}</span>
                                        {/* Removed individual "Assign to players" button for objectives in groups */}
                                        {/* Use the group-level assignment instead */}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditObjective(objective)}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleObjectiveDelete(objective.id)}
                                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                  {groupObjectives.length === 0 && (
                                    <p className="text-xs text-gray-500 italic">Aucun objectif dans ce groupe</p>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-2 w-full text-xs"
                                  onClick={() => {
                                    setObjectiveForm({
                                      ...objectiveForm,
                                      groupId: group.id
                                    })
                                    setIsObjectiveDialogOpen(true)
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Ajouter un objectif
                                </Button>
                              </>
                            );
                          })()}
                        </div>
                        <div>
                          <Label className="text-sm font-medium">
                            Joueurs assignés ({group.assignedPlayers?.length || 0})
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
                            const originalGroup = objectiveGroups.find(g => g.id === group.id)
                            setSelectedGroupForAssignment(group.id)
                            // Pre-populate with already assigned players
                            const currentlyAssignedPlayerIds = originalGroup?.assignedPlayers?.map(p => p.id) || []
                            setGroupAssignmentPlayers(currentlyAssignedPlayerIds)
                            setIsGroupAssignDialogOpen(true)
                          }}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-100"
                        >
                          <Target className="h-4 w-4 mr-1" />
                          Assigner aux joueurs
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
                          Modifier le groupe
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          const originalGroup = objectiveGroups.find(g => g.id === group.id)
                          if (originalGroup) handleViewGroupDetails(originalGroup)
                        }}>
                          <Eye className="h-4 w-4 mr-1" />
                          Voir détails
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => syncGroupObjectivesWithPlayers(group.id)}
                          className="bg-purple-50 text-purple-600 hover:bg-purple-100"
                          title="Synchroniser tous les objectifs de ce groupe avec tous les joueurs assignés"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Synchroniser les attributions
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent"
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Supprimer
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
                <CardTitle>Synthèse des primes par joueur</CardTitle>
                <CardDescription>Primes gagnées et potentielles actuelles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {playersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span className="text-gray-500">Chargement de la synthèse des primes...</span>
                    </div>
                  ) : availablePlayers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Aucun joueur trouvé. Veuillez créer des joueurs dans la gestion d'équipe.</p>
                    </div>
                  ) : (
                    availablePlayers.map((player) => {
                      const playerProgressData = playerProgress.filter(p => (p as any).__playerId === player.id)
                      const potentialBonus = playerProgressData.reduce((sum, p) => sum + Number(p.objective.bonusAmount), 0)
                      const earnedBonus = playerProgressData
                        .filter(p => p.isCompleted)
                        .reduce((sum, p) => sum + (Number(p.bonus) || Number(p.objective.bonusAmount)), 0)

                      // Only show players that have actual progress data
                      if (playerProgressData.length === 0) {
                        return null
                      }

                    return (
                      <div key={player.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{player.firstName} {player.lastName}</p>
                          <p className="text-sm text-gray-500">{player.position}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Gagné / Potentiel</p>
                          <p className="font-semibold">
                            <span className="text-green-600">{earnedBonus.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}</span>
                            <span className="text-gray-400"> / </span>
                            <span className="text-blue-600">{potentialBonus.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}</span>
                          </p>
                        </div>
                      </div>
                    )
                  }).filter(Boolean))}
                  {availablePlayers.filter(player => 
                    playerProgress.filter(p => (p as any).__playerId === player.id).length > 0
                  ).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Aucun joueur n'a d'objectifs assignés pour le moment.</p>
                      <p className="text-sm text-gray-400">Utilisez l'onglet "Groupes d'objectifs" pour assigner des objectifs aux joueurs.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Synthèse par groupe d'objectifs</CardTitle>
                <CardDescription>Progression par groupe d'objectifs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mappedObjectiveGroups.map((group) => {
                    // Use objectives from the group object itself (API includes them)
                    const groupObjectives = objectiveGroups.find(g => g.id === group.id)?.objectives || []
                    const totalBonus = groupObjectives.reduce((sum, obj) => sum + Number(obj.bonusAmount), 0)

                    return (
                      <div key={group.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {group.name}
                          </Badge>
                          <span className="text-sm text-gray-500">({groupObjectives.length} objectifs)</span>
                        </div>
                        <p className="font-semibold text-blue-600">{totalBonus.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Réalisations récentes</CardTitle>
              <CardDescription>Objectifs récemment complétés et primes gagnées</CardDescription>
            </CardHeader>
            <CardContent>
              {playerProgress.filter(p => p.isCompleted).length > 0 ? (
                <div className="space-y-3">
                  {playerProgress
                    .filter(p => p.isCompleted)
                    .sort((a, b) => new Date(b.completedAt || '').getTime() - new Date(a.completedAt || '').getTime())
                    .slice(0, 10)
                    .map((progress) => (
                      <div key={`${progress.id}-${(progress as any).__playerId}`} className="flex items-center justify-between p-3 bg-green-50 border-l-4 border-green-500 rounded dark:bg-green-900/20">
                        <div>
                          <p className="font-medium text-sm">{progress.objective.title}</p>
                          <p className="text-sm text-gray-600">
                            ID du joueur : {(progress as any).__playerId || 'Inconnu'}
                          </p>
                          {progress.completedAt && (
                            <p className="text-xs text-gray-500">
                              {new Date(progress.completedAt).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            +{(Number(progress.bonus) || Number(progress.objective.bonusAmount)).toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune réalisation récente à afficher</p>
                  <p className="text-sm">Les objectifs complétés apparaîtront ici</p>
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
            <DialogTitle>Assigner le groupe aux joueurs</DialogTitle>
            <DialogDescription>
              Sélectionnez les joueurs à qui assigner tous les objectifs de ce groupe. Les joueurs déjà assignés sont pré-sélectionnés.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Show currently assigned players count */}
            {groupAssignmentPlayers.length > 0 && (
              <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                {groupAssignmentPlayers.length} joueur(s) actuellement assigné(s) à ce groupe
              </div>
            )}
            <div>
              <Label>Sélectionner les joueurs</Label>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded p-2">
                {playersLoading ? (
                  <div className="col-span-2 flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">Chargement des joueurs...</span>
                  </div>
                ) : availablePlayers.length === 0 ? (
                  <div className="col-span-2 text-center py-4">
                    <span className="text-sm text-gray-500">Aucun joueur disponible</span>
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
              Annuler
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
              Assigner le groupe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Details Dialog */}
      <Dialog open={isGroupDetailsDialogOpen} onOpenChange={setIsGroupDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du groupe d'objectifs</DialogTitle>
            <DialogDescription>
              Voir et gérer les détails du groupe d'objectifs
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedGroupForDetails && (
              <div>
                <h3 className="text-lg font-semibold">{selectedGroupForDetails.name}</h3>
                {/* Description removed - not in API response */}
                
                <div className="mt-4">
                  <Label className="text-sm font-medium">Objectifs ({selectedGroupForDetails.objectives?.length || 0})</Label>
                  <div className="space-y-1 mt-1">
                    {(selectedGroupForDetails.objectives || []).map((objective) => {
                      // Handle Objective[] type from API
                      return (
                        <div key={objective.id} className="flex items-center justify-between text-sm">
                          <span>{objective.title || objective.name}</span>
                          <span className="text-green-600">{objective.bonusAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 })}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-4">
                  <Label className="text-sm font-medium">
                    Joueurs assignés ({selectedGroupForDetails.assignedPlayers?.length || 0})
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
                      /* Fallback to showing a message since we can't calculate from progress data anymore */
                      <Badge variant="secondary" className="text-xs">
                        Aucun joueur assigné
                      </Badge>
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
              Fermer
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setIsGroupDetailsDialogOpen(false)
                if (selectedGroupForDetails) {
                  setSelectedGroupForAssignment(selectedGroupForDetails.id)
                  // Pre-populate with already assigned players
                  const currentlyAssignedPlayerIds = selectedGroupForDetails.assignedPlayers?.map(p => p.id) || []
                  setGroupAssignmentPlayers(currentlyAssignedPlayerIds)
                  setIsGroupAssignDialogOpen(true)
                }
              }}
            >
              Ajouter des joueurs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={isEditGroupDialogOpen} onOpenChange={setIsEditGroupDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Modifier le groupe d'objectifs</DialogTitle>
            <DialogDescription>
              Mettre à jour les détails du groupe d'objectifs
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editGroupName">Nom du groupe</Label>
              <Input 
                id="editGroupName" 
                value={editGroupForm.name}
                onChange={(e) => setEditGroupForm({ ...editGroupForm, name: e.target.value })}
                placeholder="ex : Pack performance attaquants" 
              />
            </div>
            {/* Description field removed - not supported by API */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditGroupDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleUpdateGroup}
            >
              Enregistrer les modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Objective Dialog */}
      <Dialog open={isEditObjectiveDialogOpen} onOpenChange={setIsEditObjectiveDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Modifier l'objectif</DialogTitle>
            <DialogDescription>
              Mettre à jour les détails de l'objectif
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editObjectiveTitle">Titre de l'objectif *</Label>
              <Input 
                id="editObjectiveTitle" 
                value={editObjectiveForm.title}
                onChange={(e) => setEditObjectiveForm({ ...editObjectiveForm, title: e.target.value })}
                placeholder="ex : Marquer 10 buts cette saison" 
              />
            </div>
            <div>
              <Label htmlFor="editObjectiveDescription">Description</Label>
              <Textarea 
                id="editObjectiveDescription" 
                value={editObjectiveForm.description}
                onChange={(e) => setEditObjectiveForm({ ...editObjectiveForm, description: e.target.value })}
                placeholder="Description optionnelle des critères de l'objectif"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="editBonusAmount">Montant de la prime (MAD)</Label>
              <Input 
                id="editBonusAmount" 
                type="number" 
                value={editObjectiveForm.bonusAmount}
                onChange={(e) => setEditObjectiveForm({ ...editObjectiveForm, bonusAmount: e.target.value })}
                placeholder="0" 
              />
            </div>
            <div>
              <Label htmlFor="editGroupSelect">Groupe d'objectifs *</Label>
              <Select 
                value={editObjectiveForm.groupId?.toString()} 
                onValueChange={(value) => setEditObjectiveForm({ ...editObjectiveForm, groupId: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un groupe d'objectifs" />
                </SelectTrigger>
                <SelectContent>
                  {objectiveGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditObjectiveDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleObjectiveUpdate}>
              Enregistrer les modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce {deleteConfirmData?.type === 'objective' ? 'objectif' : 'groupe'} ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">
                <strong>{deleteConfirmData?.type === 'objective' ? 'Objectif' : 'Groupe'} :</strong> {deleteConfirmData?.name}
              </p>
              {deleteConfirmData?.type === 'objective' && (
                <p className="text-xs text-red-600 mt-1">
                  Toute la progression des joueurs pour cet objectif sera définitivement perdue.
                </p>
              )}
              {deleteConfirmData?.type === 'group' && (
                <p className="text-xs text-red-600 mt-1">
                  Ce groupe et toutes les attributions de joueurs seront définitivement supprimés.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteConfirmOpen(false)
                setDeleteConfirmData(null)
              }}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive"
              onClick={executeDelete}
            >
              Supprimer {deleteConfirmData?.type === 'objective' ? 'objectif' : 'groupe'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Individual Objective Assignment Dialog */}
      <Dialog open={isObjectiveAssignDialogOpen} onOpenChange={setIsObjectiveAssignDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Assigner l'objectif aux joueurs</DialogTitle>
            <DialogDescription>
              Sélectionnez les joueurs à qui assigner cet objectif spécifique
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedObjectiveForAssignment && (
              <div className="p-3 bg-blue-50 rounded-lg border">
                <h4 className="font-medium text-sm text-blue-900">
                  {objectives.find(obj => obj.id === selectedObjectiveForAssignment)?.title || 'Objectif'}
                </h4>
                <p className="text-xs text-blue-700 mt-1">
                  Prime : {objectives.find(obj => obj.id === selectedObjectiveForAssignment)?.bonusAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 2 }) || '0'}
                </p>
              </div>
            )}
            <div>
              <Label>Sélectionner les joueurs</Label>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded p-2">
                {playersLoading ? (
                  <div className="col-span-2 flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-500">Chargement des joueurs...</span>
                  </div>
                ) : availablePlayers.length === 0 ? (
                  <div className="col-span-2 text-center py-4">
                    <span className="text-sm text-gray-500">Aucun joueur disponible</span>
                  </div>
                ) : (
                  availablePlayers.map((player) => (
                    <div key={player.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`assign-objective-player-${player.id}`}
                        checked={objectiveAssignmentPlayers.includes(player.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setObjectiveAssignmentPlayers([...objectiveAssignmentPlayers, player.id])
                          } else {
                            setObjectiveAssignmentPlayers(objectiveAssignmentPlayers.filter(id => id !== player.id))
                          }
                        }}
                      />
                      <Label 
                        htmlFor={`assign-objective-player-${player.id}`} 
                        className="text-sm cursor-pointer"
                      >
                        {player.firstName} {player.lastName}
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
                setIsObjectiveAssignDialogOpen(false)
                setObjectiveAssignmentPlayers([])
                setSelectedObjectiveForAssignment(null)
              }}
            >
              Annuler
            </Button>
            <Button 
              onClick={async () => {
                if (selectedObjectiveForAssignment && objectiveAssignmentPlayers.length > 0) {
                  await handleAssignObjectiveToPlayers(selectedObjectiveForAssignment, objectiveAssignmentPlayers)
                  setIsObjectiveAssignDialogOpen(false)
                  setObjectiveAssignmentPlayers([])
                  setSelectedObjectiveForAssignment(null)
                }
              }}
              disabled={objectiveAssignmentPlayers.length === 0}
            >
              Assigner l'objectif
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
