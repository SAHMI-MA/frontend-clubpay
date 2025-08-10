"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Users, UserMinus, RotateCcw, Save } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { toast } from "sonner"
import { 
  addPlayerToMatch,
  removePlayerFromMatch 
} from "@/lib/redux/matchSlice"
import { 
  Match, 
  CreateMatchParticipationDto 
} from "@/lib/types/match-management"
import { Player } from "@/lib/types/team-management"

interface FormationPosition {
  x: number // percentage from left (0-100)
  y: number // percentage from top (0-100)
  role: string // position role like GK, CB, CM, ST etc.
}

interface Formation {
  id: string
  name: string
  positions: FormationPosition[]
  description: string
}

interface TacticalPlannerProps {
  match: Match
  isOpen: boolean
  onClose: () => void
}

const formations: Formation[] = [
  {
    id: "4-4-2",
    name: "4-4-2 Classic",
    description: "Balanced formation with strong midfield presence",
    positions: [
      { x: 50, y: 85, role: "GK" }, // Goalkeeper
      { x: 15, y: 65, role: "LB" }, // Left Back
      { x: 35, y: 65, role: "CB" }, // Center Back
      { x: 65, y: 65, role: "CB" }, // Center Back
      { x: 85, y: 65, role: "RB" }, // Right Back
      { x: 15, y: 45, role: "LM" }, // Left Midfielder
      { x: 35, y: 45, role: "CM" }, // Center Midfielder
      { x: 65, y: 45, role: "CM" }, // Center Midfielder
      { x: 85, y: 45, role: "RM" }, // Right Midfielder
      { x: 35, y: 20, role: "ST" }, // Striker
      { x: 65, y: 20, role: "ST" }, // Striker
    ],
  },
  {
    id: "4-3-3",
    name: "4-3-3 Attacking",
    description: "Offensive formation with wide attacking play",
    positions: [
      { x: 50, y: 85, role: "GK" }, // Goalkeeper
      { x: 15, y: 65, role: "LB" }, // Left Back
      { x: 35, y: 65, role: "CB" }, // Center Back
      { x: 65, y: 65, role: "CB" }, // Center Back
      { x: 85, y: 65, role: "RB" }, // Right Back
      { x: 25, y: 50, role: "CM" }, // Left Center Midfielder
      { x: 50, y: 50, role: "CM" }, // Center Midfielder
      { x: 75, y: 50, role: "CM" }, // Right Center Midfielder
      { x: 15, y: 20, role: "LW" }, // Left Winger
      { x: 50, y: 15, role: "ST" }, // Striker
      { x: 85, y: 20, role: "RW" }, // Right Winger
    ],
  },
  {
    id: "3-5-2",
    name: "3-5-2 Wing-backs",
    description: "Formation with attacking wing-backs and strong midfield",
    positions: [
      { x: 50, y: 85, role: "GK" }, // Goalkeeper
      { x: 25, y: 65, role: "CB" }, // Left Center Back
      { x: 50, y: 65, role: "CB" }, // Center Back
      { x: 75, y: 65, role: "CB" }, // Right Center Back
      { x: 10, y: 45, role: "LWB" }, // Left Wing Back
      { x: 30, y: 45, role: "CM" }, // Left Center Midfielder
      { x: 50, y: 45, role: "CM" }, // Center Midfielder
      { x: 70, y: 45, role: "CM" }, // Right Center Midfielder
      { x: 90, y: 45, role: "RWB" }, // Right Wing Back
      { x: 35, y: 20, role: "ST" }, // Striker
      { x: 65, y: 20, role: "ST" }, // Striker
    ],
  },
  {
    id: "4-2-3-1",
    name: "4-2-3-1 Modern",
    description: "Modern formation with defensive midfielders and attacking midfielder",
    positions: [
      { x: 50, y: 85, role: "GK" }, // Goalkeeper
      { x: 15, y: 65, role: "LB" }, // Left Back
      { x: 35, y: 65, role: "CB" }, // Center Back
      { x: 65, y: 65, role: "CB" }, // Center Back
      { x: 85, y: 65, role: "RB" }, // Right Back
      { x: 35, y: 55, role: "CDM" }, // Defensive Midfielder
      { x: 65, y: 55, role: "CDM" }, // Defensive Midfielder
      { x: 15, y: 35, role: "LW" }, // Left Winger
      { x: 50, y: 35, role: "CAM" }, // Attacking Midfielder
      { x: 85, y: 35, role: "RW" }, // Right Winger
      { x: 50, y: 15, role: "ST" }, // Striker
    ],
  },
]

export function TacticalPlanner({ match, isOpen, onClose }: TacticalPlannerProps) {
  const dispatch = useAppDispatch()
  
  // Redux state
  const { participations} = useAppSelector((state) => state.matches)
  const { players: availablePlayers } = useAppSelector((state) => state.players)
  
  // Local state
  const [selectedFormation, setSelectedFormation] = useState("4-4-2")
  const [startingXI, setStartingXI] = useState<{ [positionIndex: number]: Player }>({})
  const [substitutes, setSubstitutes] = useState<Player[]>([])
  const [strategy, setStrategy] = useState("")
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Player selection dialog state
  const [isPlayerSelectionOpen, setIsPlayerSelectionOpen] = useState(false)
  const [selectedPositionIndex, setSelectedPositionIndex] = useState<number | null>(null)
  const [selectedPlayerForPosition, setSelectedPlayerForPosition] = useState<string>("")

  const currentFormation = formations.find((f) => f.id === selectedFormation)!

  // Get assigned player IDs to filter available players
  const getAssignedPlayerIds = () => {
    const startingIds = Object.values(startingXI).map((p) => p.id)
    const subIds = substitutes.map((p) => p.id)
    return [...startingIds, ...subIds]
  }

  // Filter available players (only include players from the selected team and exclude already assigned ones)
  const availablePlayersFiltered = availablePlayers.filter(
    (player) => player.teamId === match.team.id && !getAssignedPlayerIds().includes(player.id)
  )

  // Reset state when match changes and load existing participations
  useEffect(() => {
    if (match && isOpen) {
      loadExistingParticipations()
    }
  }, [match, isOpen, participations])

  // Load existing participations for the match
  const loadExistingParticipations = () => {
    // Since participations are loaded per match, all current participations are for this match
    const matchParticipations = participations
    
    if (matchParticipations.length === 0) {
      resetTacticalPlan()
      return
    }

    // Separate starters and substitutes
    const starters = matchParticipations.filter(p => p.role === "Starter")
    const subs = matchParticipations.filter(p => p.role === "Substitute")

    // Find players for starters and assign them to positions (only from selected team)
    const newStartingXI: { [positionIndex: number]: Player } = {}
    starters.forEach((participation, index) => {
      const player = availablePlayers.find(p => p.id === participation.player.id && p.teamId === match.team.id)
      if (player && index < currentFormation.positions.length) {
        newStartingXI[index] = player
      }
    })

    // Find players for substitutes (only from selected team)
    const newSubstitutes: Player[] = []
    subs.forEach(participation => {
      const player = availablePlayers.find(p => p.id === participation.player.id && p.teamId === match.team.id)
      if (player) {
        newSubstitutes.push(player)
      }
    })

    setStartingXI(newStartingXI)
    setSubstitutes(newSubstitutes)
    
    toast.info(`Loaded existing squad: ${Object.keys(newStartingXI).length} starters, ${newSubstitutes.length} substitutes`)
  }

  // Helper functions
  const getPlayerDisplayName = (player: Player) => {
    return `${player.firstName} ${player.lastName}`
  }

  const getPlayerNumber = (player: Player) => {
    return player.playerNumber || player.id
  }

  const resetTacticalPlan = () => {
    setStartingXI({})
    setSubstitutes([])
    setSelectedFormation("4-4-2")
    setStrategy("")
  }

  const assignPlayerToPosition = (player: Player, positionIndex: number) => {
    setStartingXI((prev) => ({
      ...prev,
      [positionIndex]: player,
    }))
  }

  const removePlayerFromPosition = (positionIndex: number) => {
    setStartingXI((prev) => {
      const newStartingXI = { ...prev }
      delete newStartingXI[positionIndex]
      return newStartingXI
    })
  }

  const addToSubstitutes = (player: Player) => {
    if (substitutes.length < 5) {
      setSubstitutes([...substitutes, player])
    }
  }

  const removeFromSubstitutes = (playerId: number) => {
    setSubstitutes(substitutes.filter((p) => p.id !== playerId))
  }

  // Drag and drop handlers
  const handleDragStart = (player: Player) => {
    console.log('Drag start:', player)
    setDraggedPlayer(player)
  }

  const handleDragEnd = () => {
    setDraggedPlayer(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDropOnPosition = (e: React.DragEvent, positionIndex: number) => {
    e.preventDefault()
    console.log('Drop on position:', positionIndex, 'with player:', draggedPlayer)
    if (draggedPlayer && !startingXI[positionIndex]) {
      assignPlayerToPosition(draggedPlayer, positionIndex)
      setDraggedPlayer(null)
      toast.success(`${getPlayerDisplayName(draggedPlayer)} assigned to ${currentFormation.positions[positionIndex].role}`)
    } else if (startingXI[positionIndex]) {
      toast.warning(`Position already occupied by ${getPlayerDisplayName(startingXI[positionIndex])}`)
    }
  }

  const handleDropOnBench = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedPlayer && substitutes.length < 5) {
      addToSubstitutes(draggedPlayer)
      setDraggedPlayer(null)
    }
  }

  const handleFormationChange = (formationId: string) => {
    if (formationId !== selectedFormation) {
      // Ask for confirmation if there are players assigned
      if (Object.keys(startingXI).length > 0 || substitutes.length > 0) {
        if (window.confirm("Changing formation will reset all player assignments. Continue?")) {
          setSelectedFormation(formationId)
          setStartingXI({})
        }
      } else {
        setSelectedFormation(formationId)
      }
    }
  }

  // Player selection dialog handlers
  const handlePositionClick = (positionIndex: number) => {
    console.log('🎯 Position clicked:', positionIndex, 'Current player:', startingXI[positionIndex])
    // Only open dialog if position is empty
    if (!startingXI[positionIndex]) {
      console.log('✅ Opening player selection dialog for position:', currentFormation.positions[positionIndex]?.role)
      setSelectedPositionIndex(positionIndex)
      setSelectedPlayerForPosition("")
      setIsPlayerSelectionOpen(true)
    } else {
      console.log('❌ Position already occupied by:', getPlayerDisplayName(startingXI[positionIndex]))
    }
  }

  const handlePlayerSelection = () => {
    console.log('👤 Player selection triggered. Position:', selectedPositionIndex, 'Player ID:', selectedPlayerForPosition)
    if (selectedPositionIndex !== null && selectedPlayerForPosition) {
      const playerId = parseInt(selectedPlayerForPosition)
      const player = availablePlayersFiltered.find(p => p.id === playerId)
      
      if (player) {
        const position = currentFormation.positions[selectedPositionIndex]
        console.log('✅ Assigning player:', getPlayerDisplayName(player), 'to position:', position.role)
        assignPlayerToPosition(player, selectedPositionIndex)
        setIsPlayerSelectionOpen(false)
        setSelectedPositionIndex(null)
        setSelectedPlayerForPosition("")
        
        // Show success message
        toast.success(`${getPlayerDisplayName(player)} assigned to ${position.role}`)
      } else {
        console.log('❌ Player not found with ID:', playerId)
      }
    } else {
      console.log('❌ Missing data. Position:', selectedPositionIndex, 'Player:', selectedPlayerForPosition)
    }
  }

  const handleCancelPlayerSelection = () => {
    setIsPlayerSelectionOpen(false)
    setSelectedPositionIndex(null)
    setSelectedPlayerForPosition("")
  }

  // Handle keyboard shortcuts for the player selection dialog
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isPlayerSelectionOpen) {
        if (event.key === 'Escape') {
          handleCancelPlayerSelection()
        } else if (event.key === 'Enter' && selectedPlayerForPosition) {
          event.preventDefault()
          handlePlayerSelection()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isPlayerSelectionOpen, selectedPlayerForPosition])

  const saveTacticalPlan = async () => {
    try {
      setIsSaving(true)

      // First, remove all existing participations for this match
      if (participations.length > 0) {
        toast.info("Clearing existing squad assignments...")
        for (const participation of participations) {
          await dispatch(removePlayerFromMatch({
            matchId: match.id,
            participationId: participation.id
          }))
        }
      }

      // Add all starting XI players with match bonus or default
      if (Object.keys(startingXI).length > 0) {
        toast.info("Assigning starting XI...")
        for (const [, player] of Object.entries(startingXI)) {
          const participationData: CreateMatchParticipationDto = {
            playerId: player.id,
            role: "Starter",
            bonus: match.bonus || 500, // Use match bonus or default bonus for starters
            percentage: 100 // 100% for starters
          }

          const result = await dispatch(addPlayerToMatch({
            matchId: match.id,
            participationData
          }))

          if (addPlayerToMatch.rejected.match(result)) {
            throw new Error(`Failed to assign ${player.firstName} ${player.lastName}`)
          }
        }
      }

      // Add all substitute players with half match bonus or default
      if (substitutes.length > 0) {
        toast.info("Assigning substitutes...")
        for (const player of substitutes) {
          const participationData: CreateMatchParticipationDto = {
            playerId: player.id,
            role: "Substitute",
            bonus: match.bonus ? match.bonus * 0.5 : 250, // Half of match bonus or default for substitutes
            percentage: 50 // 50% for substitutes
          }

          const result = await dispatch(addPlayerToMatch({
            matchId: match.id,
            participationData
          }))

          if (addPlayerToMatch.rejected.match(result)) {
            throw new Error(`Failed to assign substitute ${player.firstName} ${player.lastName}`)
          }
        }
      }

      toast.success(`Tactical plan saved! ${Object.keys(startingXI).length} starters and ${substitutes.length} substitutes assigned.`)
      onClose()
    } catch (error) {
      toast.error(`Error saving tactical plan: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] lg:max-w-[90vw] xl:max-w-[85vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Tactical Planning - {match.nomMatch} vs {match.opposition}
          </DialogTitle>
          <DialogDescription>
            Select formation and assign players to their tactical positions. 
            {participations.length > 0 && ` Current squad: ${participations.filter(p => p.role === "Starter").length} starters, ${participations.filter(p => p.role === "Substitute").length} substitutes.`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-12 gap-6">
          {/* Available Players */}
          <div className="lg:col-span-1 xl:col-span-3 space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Available Players ({availablePlayersFiltered.length})</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {availablePlayersFiltered.length > 0 ? (
                  availablePlayersFiltered.map((player) => (
                    <div
                      key={player.id}
                      draggable
                      onDragStart={() => handleDragStart(player)}
                      onDragEnd={handleDragEnd}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-sm">{getPlayerDisplayName(player)}</div>
                        <div className="text-xs text-gray-500">
                          #{getPlayerNumber(player)} - {player.position}
                        </div>
                      </div>
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold">
                        {getPlayerNumber(player)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">All players have been assigned</p>
                    <p className="text-xs">Remove players from positions to see them here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Formation Selection */}
            <div>
              <Label htmlFor="formation">Formation</Label>
              <Select value={selectedFormation} onValueChange={handleFormationChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formations.map((formation) => (
                    <SelectItem key={formation.id} value={formation.id}>
                      {formation.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">{currentFormation.description}</p>
            </div>

            <Button variant="outline" onClick={resetTacticalPlan} className="w-full bg-transparent">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All
            </Button>

            {/* Strategy */}
            <div>
              <Label htmlFor="strategy">Match Strategy</Label>
              <Textarea
                id="strategy"
                placeholder="Enter tactical instructions and strategy..."
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Football Field */}
          <div className="lg:col-span-1 xl:col-span-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Formation: {currentFormation.name}</h3>
                <div className="text-sm text-gray-600">{Object.keys(startingXI).length}/11 positions filled</div>
              </div>

              {/* Field */}
              <div
                className="relative bg-gradient-to-b from-green-400 to-green-600 rounded-lg p-6 shadow-lg"
                style={{ aspectRatio: "3/4", minHeight: "700px" }}
              >
                {/* Field markings */}
                <div className="absolute inset-6 border-2 border-white rounded-lg">
                  {/* Center circle */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white rounded-full"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>

                  {/* Center line */}
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white"></div>

                  {/* Goal areas */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-12 border-2 border-white border-t-0 rounded-b-lg"></div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-12 border-2 border-white border-b-0 rounded-t-lg"></div>

                  {/* Penalty areas */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-20 border-2 border-white border-t-0"></div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-20 border-2 border-white border-b-0"></div>

                  {/* Penalty spots */}
                  <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                  <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                </div>

                {/* Formation positions */}
                {currentFormation.positions.map((position, index) => {
                  const assignedPlayer = startingXI[index]
                  return (
                    <div
                      key={index}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 group ${draggedPlayer ? 'z-20' : ''}`}
                      style={{
                        left: `${position.x}%`,
                        top: `${position.y}%`,
                      }}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropOnPosition(e, index)}
                      onClick={() => handlePositionClick(index)} // Open player selection dialog on click
                    >
                      {assignedPlayer ? (
                        <div className="relative">
                          <div className="w-14 h-14 bg-blue-600 border-3 border-white rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg cursor-pointer hover:bg-blue-700 transition-colors">
                            {getPlayerNumber(assignedPlayer)}
                          </div>
                          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {getPlayerDisplayName(assignedPlayer)}
                          </div>
                          <button
                            onClick={() => removePlayerFromPosition(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div 
                          className={`w-14 h-14 border-3 border-dashed rounded-full flex flex-col items-center justify-center font-bold text-xs cursor-pointer transition-all duration-200 ${
                            draggedPlayer 
                              ? 'bg-blue-100 border-blue-400 text-blue-800 hover:bg-blue-200 shadow-lg' 
                              : 'bg-gray-100 border-gray-400 text-gray-600 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 hover:shadow-md hover:scale-105'
                          }`}
                          title={`Click to assign a player or drop a player here for ${position.role}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            console.log('🖱️ Empty position clicked directly:', position.role)
                            handlePositionClick(index)
                          }}
                        >
                          <div className="text-center leading-tight">
                            <div className="text-xs font-semibold">{position.role}</div>
                            {draggedPlayer && (
                              <div className="text-xs opacity-75 mt-0.5">Drop</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Drop zone indicator when dragging */}
                {draggedPlayer && (
                  <div className="absolute top-2 left-2 right-2 bg-blue-200 bg-opacity-90 border-2 border-dashed border-blue-400 rounded-lg p-2 flex items-center justify-center z-10">
                    <div className="text-blue-800 font-semibold text-sm">Drop {getPlayerDisplayName(draggedPlayer)} on a position</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Squad Lists */}
          <div className="lg:col-span-1 xl:col-span-3 space-y-4">
            {/* Starting XI List */}
            <div>
              <h4 className="font-semibold mb-2">Starting XI ({Object.keys(startingXI).length}/11)</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {currentFormation.positions.map((position, index) => {
                  const player = startingXI[index]
                  return (
                    <div key={index} className={`p-2 rounded ${player ? "bg-blue-50" : "bg-gray-50"}`}>
                      <div className="text-xs text-gray-500 mb-1">{position.role}</div>
                      {player ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{getPlayerDisplayName(player)}</div>
                            <div className="text-xs text-gray-500">#{getPlayerNumber(player)}</div>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => removePlayerFromPosition(index)}>
                            <UserMinus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 italic">No player assigned</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Substitutes Bench */}
            <div
              className="p-4 bg-yellow-50 rounded-lg border-2 border-dashed border-yellow-300"
              onDragOver={handleDragOver}
              onDrop={handleDropOnBench}
            >
              <h4 className="font-semibold mb-2">Substitutes Bench ({substitutes.length}/5)</h4>
              <div className="space-y-2">
                {substitutes.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-2 bg-yellow-100 rounded">
                    <div>
                      <div className="font-medium text-sm">{getPlayerDisplayName(player)}</div>
                      <div className="text-xs text-gray-500">
                        #{getPlayerNumber(player)} - {player.position}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => removeFromSubstitutes(player.id)}>
                      <UserMinus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {substitutes.length === 0 && (
                  <div className="text-xs text-gray-400 italic text-center py-4">
                    Drag players here for substitutes bench
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Player Selection Dialog */}
        <Dialog open={isPlayerSelectionOpen} onOpenChange={handleCancelPlayerSelection}>
          <DialogContent className="w-full max-w-lg p-6">
            <DialogHeader>
              <DialogTitle>Select Player for {selectedPositionIndex !== null ? currentFormation.positions[selectedPositionIndex]?.role : 'Position'}</DialogTitle>
              <DialogDescription>
                Choose a player to assign to this position. Search by player name or number.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedPositionIndex !== null && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-900">Position Details:</div>
                  <div className="text-sm text-blue-700">
                    <strong>{currentFormation.positions[selectedPositionIndex]?.role}</strong> in {currentFormation.name} formation
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="player-select">Available Players ({availablePlayersFiltered.length})</Label>
                <Combobox
                  options={availablePlayersFiltered.map((player) => ({
                    value: player.id.toString(),
                    label: `${getPlayerDisplayName(player)} (#${getPlayerNumber(player)}) - ${player.position}`,
                    group: player.position,
                    // Include searchable keywords to make it easier to find by number or name
                    keywords: `${getPlayerDisplayName(player)} ${getPlayerNumber(player)} #${getPlayerNumber(player)} ${player.firstName} ${player.lastName} ${player.position}`
                  }))}
                  value={selectedPlayerForPosition}
                  onValueChange={setSelectedPlayerForPosition}
                  placeholder="Search by name or number..."
                  searchPlaceholder="Type player name or number..."
                  emptyText="No available players found."
                  className="mt-2"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Tip: You can search by player name (e.g., &ldquo;John&ldquo;), number (e.g., &ldquo;10&ldquo;), or position (e.g., &ldquo;ST&ldquo;)
                </div>
              </div>
              
              {selectedPlayerForPosition && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm font-medium text-green-900">Selected Player:</div>
                  <div className="text-sm text-green-700">
                    {(() => {
                      const player = availablePlayersFiltered.find(p => p.id.toString() === selectedPlayerForPosition)
                      return player ? `${getPlayerDisplayName(player)} (#${getPlayerNumber(player)}) - ${player.position}` : ''
                    })()}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={handleCancelPlayerSelection}>
                Cancel
              </Button>
              <Button 
                onClick={handlePlayerSelection} 
                disabled={!selectedPlayerForPosition}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Assign Player
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            onClick={saveTacticalPlan} 
            disabled={Object.keys(startingXI).length !== 11 || isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : `Save Tactical Plan (${Object.keys(startingXI).length}/11)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
