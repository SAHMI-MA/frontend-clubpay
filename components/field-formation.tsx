"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Users, UserPlus, UserMinus, Save } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, RootState } from "@/lib/redux/store"
import { toast } from "sonner"
import { 
  addPlayerToMatch,
} from "@/lib/redux/matchSlice"
import { 
  Match, 
  CreateMatchParticipationDto 
} from "@/lib/types/match-management"

interface Player {
  id: number
  firstName: string
  lastName: string
  position: string
  playerNumber?: number | null
  playerImage?: string
  status?: "available" | "injured" | "suspended"
}

interface FieldFormationProps {
  match: Match
  isOpen: boolean
  onClose: () => void
}

// Formation definitions with precise field positions
const formations = {
  "4-4-2": {
    label: "4-4-2",
    positions: [
      { id: "GK", name: "GK", x: 5, y: 50 },
      { id: "LB", name: "LB", x: 25, y: 15 },
      { id: "CB1", name: "CB", x: 25, y: 35 },
      { id: "CB2", name: "CB", x: 25, y: 65 },
      { id: "RB", name: "RB", x: 25, y: 85 },
      { id: "LM", name: "LM", x: 50, y: 20 },
      { id: "CM1", name: "CM", x: 50, y: 40 },
      { id: "CM2", name: "CM", x: 50, y: 60 },
      { id: "RM", name: "RM", x: 50, y: 80 },
      { id: "ST1", name: "ST", x: 75, y: 35 },
      { id: "ST2", name: "ST", x: 75, y: 65 },
    ],
  },
  "4-3-3": {
    label: "4-3-3",
    positions: [
      { id: "GK", name: "GK", x: 5, y: 50 },
      { id: "LB", name: "LB", x: 25, y: 15 },
      { id: "CB1", name: "CB", x: 25, y: 35 },
      { id: "CB2", name: "CB", x: 25, y: 65 },
      { id: "RB", name: "RB", x: 25, y: 85 },
      { id: "CM1", name: "CM", x: 50, y: 30 },
      { id: "CM2", name: "CM", x: 50, y: 50 },
      { id: "CM3", name: "CM", x: 50, y: 70 },
      { id: "LW", name: "LW", x: 75, y: 20 },
      { id: "ST", name: "ST", x: 75, y: 50 },
      { id: "RW", name: "RW", x: 75, y: 80 },
    ],
  },
  "3-5-2": {
    label: "3-5-2",
    positions: [
      { id: "GK", name: "GK", x: 5, y: 50 },
      { id: "CB1", name: "CB", x: 25, y: 25 },
      { id: "CB2", name: "CB", x: 25, y: 50 },
      { id: "CB3", name: "CB", x: 25, y: 75 },
      { id: "LM", name: "LM", x: 50, y: 15 },
      { id: "CM1", name: "CM", x: 50, y: 35 },
      { id: "CM2", name: "CM", x: 50, y: 50 },
      { id: "CM3", name: "CM", x: 50, y: 65 },
      { id: "RM", name: "RM", x: 50, y: 85 },
      { id: "ST1", name: "ST", x: 75, y: 35 },
      { id: "ST2", name: "ST", x: 75, y: 65 },
    ],
  },
  "4-2-3-1": {
    label: "4-2-3-1",
    positions: [
      { id: "GK", name: "GK", x: 5, y: 50 },
      { id: "LB", name: "LB", x: 25, y: 15 },
      { id: "CB1", name: "CB", x: 25, y: 35 },
      { id: "CB2", name: "CB", x: 25, y: 65 },
      { id: "RB", name: "RB", x: 25, y: 85 },
      { id: "CDM1", name: "CDM", x: 45, y: 35 },
      { id: "CDM2", name: "CDM", x: 45, y: 65 },
      { id: "CAM", name: "CAM", x: 60, y: 50 },
      { id: "LW", name: "LW", x: 60, y: 25 },
      { id: "RW", name: "RW", x: 60, y: 75 },
      { id: "ST", name: "ST", x: 75, y: 50 },
    ],
  },
}

export function FieldFormation({ match, isOpen, onClose }: FieldFormationProps) {
  const dispatch = useDispatch<AppDispatch>()
  
  // Redux state
  const { loading } = useSelector((state: RootState) => state.matches)
  const { players: availablePlayers } = useSelector((state: RootState) => state.players)
  
  // Local state
  const [selectedFormation, setSelectedFormation] = useState<keyof typeof formations>("4-4-2")
  const [squadAssignments, setSquadAssignments] = useState<Record<string, Player>>({}) // position -> player
  const [substitutes, setSubstitutes] = useState<Player[]>([])
  const [strategy, setStrategy] = useState("")
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null)

  // Get current formation
  const currentFormation = formations[selectedFormation]

  // Get starting XI from squad assignments
  const startingXI = Object.values(squadAssignments)

  // Filter available players (not already assigned)
  const availablePlayersFiltered = availablePlayers.filter(
    (player) =>
      !startingXI.find((p) => p.id === player.id) &&
      !substitutes.find((p) => p.id === player.id)
  )

  // Reset state when match changes
  useEffect(() => {
    if (match && isOpen) {
      setSquadAssignments({})
      setSubstitutes([])
      setSelectedFormation("4-4-2")
      setStrategy("")
      // TODO: Load existing participations for this match
    }
  }, [match, isOpen])

  const assignPlayerToPosition = (player: Player, positionId: string) => {
    setSquadAssignments(prev => ({
      ...prev,
      [positionId]: player
    }))
  }

  const removePlayerFromPosition = (positionId: string) => {
    setSquadAssignments(prev => {
      const newAssignments = { ...prev }
      delete newAssignments[positionId]
      return newAssignments
    })
  }

  const addToStartingXI = (player: Player) => {
    // Find the first available position
    const availablePosition = currentFormation.positions.find(
      pos => !squadAssignments[pos.id]
    )
    if (availablePosition) {
      assignPlayerToPosition(player, availablePosition.id)
    }
  }

  const addToSubstitutes = (player: Player) => {
    if (substitutes.length < 5) {
      setSubstitutes([...substitutes, player])
    }
  }

  const removeFromSubstitutes = (playerId: number) => {
    setSubstitutes(substitutes.filter((p) => p.id !== playerId))
  }

  const resetFormation = () => {
    setSquadAssignments({})
    setSubstitutes([])
    setStrategy("")
  }

  const handleFormationChange = (newFormation: keyof typeof formations) => {
    if (newFormation !== selectedFormation) {
      // Ask for confirmation if there are players assigned
      if (startingXI.length > 0 || substitutes.length > 0) {
        if (window.confirm("Changing formation will reset all player assignments. Continue?")) {
          setSelectedFormation(newFormation)
          resetFormation()
        }
      } else {
        setSelectedFormation(newFormation)
      }
    }
  }

  const handleDragStart = (player: Player) => {
    setDraggedPlayer(player)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDropOnField = (e: React.DragEvent, positionId?: string) => {
    e.preventDefault()
    if (draggedPlayer) {
      if (positionId && !squadAssignments[positionId]) {
        // Drop on specific position
        assignPlayerToPosition(draggedPlayer, positionId)
      } else {
        // Drop on general field area - find first available position
        addToStartingXI(draggedPlayer)
      }
      setDraggedPlayer(null)
    }
  }

  const handleDropOnBench = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedPlayer && substitutes.length < 5) {
      addToSubstitutes(draggedPlayer)
      setDraggedPlayer(null)
    }
  }

  const saveTacticalPlan = async () => {
    try {
      // Add all starting XI players with 100% bonus
      for (const player of startingXI) {
        const participationData: CreateMatchParticipationDto = {
          playerId: player.id,
          role: "Starter",
          bonus: 500, // Default bonus for starters
          percentage: 100 // 100% for starters
        }

        await dispatch(addPlayerToMatch({
          matchId: match.id,
          participationData
        }))
      }

      // Add all substitute players with 50% bonus
      for (const player of substitutes) {
        const participationData: CreateMatchParticipationDto = {
          playerId: player.id,
          role: "Substitute",
          bonus: 250, // Default bonus for substitutes (50% of starters)
          percentage: 50 // 50% for substitutes
        }

        await dispatch(addPlayerToMatch({
          matchId: match.id,
          participationData
        }))
      }

      toast.success(`Tactical plan saved! ${startingXI.length} starters and ${substitutes.length} substitutes assigned.`)
      onClose()
    } catch (error) {
      toast.error("Error saving tactical plan")
      console.error(error)
    }
  }

  const getPlayerDisplayName = (player: Player) => {
    return `${player.firstName} ${player.lastName}`
  }

  const getPlayerNumber = (player: Player) => {
    return player.playerNumber || player.id
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-blue-50">
          <DialogHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl -m-6 mb-6">
            <DialogTitle className="text-2xl font-bold">
              <Users className="h-6 w-6 inline mr-3" />
              Tactical Planning - {match.nomMatch}
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-base mt-2">
              🎯 Drag and drop players to assign them to the field or substitutes bench. 
              <br />
              ⚡ Starters get 100% bonus (default $500), Substitutes get 50% bonus (default $250).
            </DialogDescription>
          </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Available Players */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Available Players</h3>
              <div className="text-sm text-gray-600 mb-2">
                {availablePlayersFiltered.length} players available
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availablePlayersFiltered.map((player) => (                    <div
                      key={player.id}
                      draggable
                      onDragStart={() => handleDragStart(player)}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 rounded-lg cursor-move transition-all duration-200 border border-gray-200 hover:border-blue-300 hover:shadow-md"
                    >
                    <div className="flex items-center space-x-3">
                      {player.playerImage && (
                        <img 
                          src={player.playerImage} 
                          alt={getPlayerDisplayName(player)}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">{getPlayerDisplayName(player)}</div>
                        <div className="text-sm text-gray-500">
                          #{getPlayerNumber(player)} - {player.position}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addToStartingXI(player)}
                        disabled={startingXI.length >= 11}
                        className="text-green-600 hover:text-green-700"
                      >
                        <UserPlus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addToSubstitutes(player)}
                        disabled={substitutes.length >= 5}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        Sub
                      </Button>
                    </div>
                  </div>
                ))}
                {availablePlayersFiltered.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    All players have been assigned
                  </div>
                )}
              </div>
            </div>

            {/* Formation Selection with Preview */}
            <div>
              <Label htmlFor="formation">Formation</Label>
              <Select 
                value={selectedFormation} 
                onValueChange={handleFormationChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(formations).map(([key, formation]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center space-x-2">
                        <span>{formation.label}</span>
                        <span className="text-xs text-gray-500">({formation.positions.length} players)</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Formation Quick Actions */}
              <div className="flex space-x-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Auto-assign available players to formation
                    const availableForAssignment = availablePlayersFiltered.slice(0, 11)
                    const newAssignments: Record<string, Player> = {}
                    availableForAssignment.forEach((player, index) => {
                      if (currentFormation.positions[index]) {
                        newAssignments[currentFormation.positions[index].id] = player
                      }
                    })
                    setSquadAssignments(newAssignments)
                  }}
                  disabled={availablePlayersFiltered.length === 0}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Auto-Fill
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFormation}
                  disabled={startingXI.length === 0 && substitutes.length === 0}
                  className="text-red-600 hover:text-red-700"
                >
                  Clear All
                </Button>
              </div>
            </div>

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

            {/* Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Squad Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Starting XI:</span>
                  <Badge variant={startingXI.length === 11 ? "default" : "secondary"}>
                    {startingXI.length}/11
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Substitutes:</span>
                  <Badge variant={substitutes.length > 0 ? "default" : "secondary"}>
                    {substitutes.length}/5
                  </Badge>
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  Total bonus allocation: ${(startingXI.length * 500 + substitutes.length * 250).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Football Field */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Formation: {currentFormation.label}</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFormation}
                    disabled={startingXI.length === 0 && substitutes.length === 0}
                    className="text-red-600 hover:text-red-700"
                  >
                    Reset
                  </Button>
                  <div className="text-sm text-gray-600">
                    {match.opposition ? `vs ${match.opposition}` : ""}
                  </div>
                </div>
              </div>

              {/* Field */}
              <div
                className="relative bg-gradient-to-b from-green-500 to-green-700 rounded-xl p-6 shadow-2xl border-4 border-white overflow-hidden"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnField(e)}
                style={{
                  minHeight: "600px",
                  aspectRatio: "3/4",
                  backgroundImage: `
                    radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px),
                    linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)
                  `,
                  backgroundSize: "40px 40px, 20px 20px, 20px 20px",
                }}
              >
                {/* Field markings */}
                <div className="absolute inset-6 border-4 border-white rounded-lg shadow-inner">
                  {/* Center circle */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-white rounded-full"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full"></div>

                  {/* Center line */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-white"></div>

                  {/* Goal areas - Top */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-8 border-4 border-white border-t-0 rounded-b-lg bg-green-600 bg-opacity-30"></div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-16 border-4 border-white border-t-0 bg-green-600 bg-opacity-20"></div>

                  {/* Goal areas - Bottom */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-8 border-4 border-white border-b-0 rounded-t-lg bg-green-600 bg-opacity-30"></div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-16 border-4 border-white border-b-0 bg-green-600 bg-opacity-20"></div>

                  {/* Penalty spots */}
                  <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
                  <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>

                  {/* Corner arcs */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-full"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-full"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-full"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-full"></div>
                </div>

                {/* Starting XI on field with formation positions */}
                <div className="absolute inset-0 p-8">
                  {currentFormation.positions.map((position) => {
                    const assignedPlayer = squadAssignments[position.id]
                    return (
                      <div
                        key={position.id}
                        className={`absolute w-20 h-20 rounded-full flex flex-col items-center justify-center text-sm font-bold cursor-pointer transition-all duration-300 transform hover:scale-110 shadow-2xl border-4 ${
                          assignedPlayer
                            ? "bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 text-white border-white hover:from-blue-500 hover:to-blue-800 animate-pulse"
                            : "bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 text-gray-700 border-gray-400 hover:from-gray-300 hover:to-gray-500 border-dashed"
                        }`}
                        style={{
                          left: `${position.x}%`,
                          top: `${position.y}%`,
                          transform: "translate(-50%, -50%)",
                          zIndex: assignedPlayer ? 20 : 10,
                          boxShadow: assignedPlayer 
                            ? "0 8px 32px rgba(59, 130, 246, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.3)" 
                            : "0 4px 16px rgba(0, 0, 0, 0.2)"
                        }}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropOnField(e, position.id)}
                        onClick={() => assignedPlayer && removePlayerFromPosition(position.id)}
                        title={assignedPlayer 
                          ? `${getPlayerDisplayName(assignedPlayer)} (#${getPlayerNumber(assignedPlayer)}) - Click to remove`
                          : `${position.name} position - Drop player here`
                        }
                      >
                        {assignedPlayer ? (
                          <>
                            <div className="text-lg font-bold drop-shadow-lg">{getPlayerNumber(assignedPlayer)}</div>
                            <div className="text-xs leading-none text-center px-1 drop-shadow">{position.name}</div>
                          </>
                        ) : (
                          <div className="text-xs leading-none text-center px-1 font-semibold">{position.name}</div>
                        )}
                        
                        {/* Position connection lines (subtle) */}
                        {!assignedPlayer && (
                          <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-400 opacity-50 animate-pulse"></div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Drop zone indicator for field */}
                {draggedPlayer && (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-blue-400/10 to-blue-600/20 border-4 border-dashed border-blue-400 rounded-xl flex items-center justify-center animate-pulse backdrop-blur-sm">
                    <div className="bg-white/95 backdrop-blur-md px-8 py-6 rounded-2xl shadow-2xl border border-blue-200">
                      <div className="text-blue-800 font-bold text-xl text-center mb-2">
                        🎯 Drop on formation positions
                      </div>
                      <div className="text-blue-600 text-base text-center mb-1">
                        Assign <span className="font-semibold">{getPlayerDisplayName(draggedPlayer)}</span> to starting XI
                      </div>
                      <div className="text-sm text-gray-600 text-center flex items-center justify-center gap-2">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          100% bonus • $500 default
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Starting XI List */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Starting XI ({startingXI.length}/11)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {currentFormation.positions.map((position) => {
                      const assignedPlayer = squadAssignments[position.id]
                      return (
                        <div 
                          key={position.id} 
                          className={`flex items-center justify-between p-2 rounded border ${
                            assignedPlayer 
                              ? "bg-green-50 border-green-200" 
                              : "bg-gray-50 border-gray-200 border-dashed"
                          }`}
                        >
                          <span className="text-sm font-medium">
                            {assignedPlayer ? (
                              <>#{getPlayerNumber(assignedPlayer)} {getPlayerDisplayName(assignedPlayer)}</>
                            ) : (
                              <span className="text-gray-500">{position.name}</span>
                            )}
                          </span>
                          {assignedPlayer && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => removePlayerFromPosition(position.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <UserMinus className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Substitutes Bench */}
              <div
                className={`p-6 rounded-xl border-4 transition-all duration-300 ${
                  draggedPlayer 
                    ? 'bg-gradient-to-br from-orange-100 via-orange-50 to-yellow-50 border-orange-400 border-dashed animate-pulse shadow-xl' 
                    : 'bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-300 border-dashed hover:border-orange-400 hover:shadow-lg'
                }`}
                onDragOver={handleDragOver}
                onDrop={handleDropOnBench}
              >
                <h4 className="font-bold mb-4 flex items-center text-orange-800">
                  <Users className="h-5 w-5 mr-2" />
                  Substitutes Bench ({substitutes.length}/5)
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {substitutes.map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg border border-orange-200 shadow-sm hover:shadow-md transition-all">
                      <span className="text-sm font-semibold text-orange-900">
                        #{getPlayerNumber(player)} {getPlayerDisplayName(player)}
                      </span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => removeFromSubstitutes(player.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {substitutes.length === 0 && (
                    <div className="text-center text-orange-600 py-8">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="font-medium">No substitute players assigned</p>
                      <p className="text-sm opacity-75">Drag players here for the bench</p>
                    </div>
                  )}
                </div>
                {draggedPlayer && (
                  <div className="text-center text-orange-700 text-sm mt-4 font-semibold bg-gradient-to-r from-orange-200 to-yellow-200 bg-opacity-90 py-3 rounded-lg border-2 border-dashed border-orange-400">
                    <div className="font-bold text-base">🏃‍♂️ Drop {getPlayerDisplayName(draggedPlayer)} here for substitutes</div>
                    <div className="text-xs mt-1 flex items-center justify-center gap-2">
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                        50% bonus • $250 default
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={saveTacticalPlan} 
            disabled={startingXI.length !== 11 || loading.participations}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading.participations ? "Saving..." : `Save Squad (${startingXI.length + substitutes.length} players)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
