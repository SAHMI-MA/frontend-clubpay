"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, MapPin, Plus, Search, Trophy, Users, Target, Loader2, Trash2, Eye, Edit, AlertTriangle, UserMinus, RotateCcw } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, RootState } from "@/lib/redux/store"
import { toast } from "sonner"
import { 
  fetchAllMatches,
  fetchMatchParticipations,
  fetchAllTeams,
  createMatch,
  updateMatch,
  deleteMatch,
  addPlayerToMatch,
  removePlayerFromMatch,
  setSelectedMatch
} from "@/lib/redux/matchSlice"
import { fetchAllPlayers } from "@/lib/redux/playerSlice"
import { 
  Match, 
  CreateMatchDto,
  UpdateMatchDto, 
  CreateMatchParticipationDto 
} from "@/lib/types/match-management"
import { TacticalPlanner } from "./tactical-planner"

export function MatchManagement() {
  // Redux state
  const dispatch = useDispatch<AppDispatch>()
  const { 
    matches, 
    participations, 
    teams,
    selectedMatchId,
    loading,
    error 
  } = useSelector((state: RootState) => state.matches)
  
  // Get players from Redux store
  const { players: availablePlayers } = useSelector((state: RootState) => state.players)

  // Get auth state to check if user is logged in
  const { isAuthenticated, user, token } = useSelector((state: RootState) => state.auth)

  // Local component state
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateMatchDialogOpen, setIsCreateMatchDialogOpen] = useState(false)
  const [isViewMatchDialogOpen, setIsViewMatchDialogOpen] = useState(false)
  const [isEditMatchDialogOpen, setIsEditMatchDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isTacticalPlannerOpen, setIsTacticalPlannerOpen] = useState(false)
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null)
  const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = useState(false)
  const [selectedMatchForView, setSelectedMatchForView] = useState<Match | null>(null)
  const [selectedMatchForTactical, setSelectedMatchForTactical] = useState<Match | null>(null)
  const [selectedMatch, setSelectedMatchForParticipation] = useState<Match | null>(null)
  
  // Form states
  const [matchForm, setMatchForm] = useState({
    nomMatch: "",
    city: "",
    opposition: "",
    dateTime: "",
    formation: "", // Formation for the match
    bonus: "", // NEW: Default participation bonus for this match
    teamId: ""
  })
  
  const [editMatchForm, setEditMatchForm] = useState({
    nomMatch: "",
    city: "",
    opposition: "",
    dateTime: "",
    formation: "", // Formation for the match
    bonus: "", // NEW: Default participation bonus for this match
    teamId: ""
  })
  
  const [participationForm, setParticipationForm] = useState({
    playerId: "",
    role: "Starter" as "Starter" | "Substitute" | "Bench",
    bonus: "",
    percentage: ""
  })

  // Load data on component mount
  useEffect(() => {
    console.log('🚀 Match Management: Loading initial data...');
    
    const loadData = async () => {
      try {
        console.log('📡 Dispatching fetchAllMatches...');
        const matchesResult = await dispatch(fetchAllMatches());
        console.log('✅ fetchAllMatches result:', matchesResult);
        
        console.log('📡 Dispatching fetchAllTeams...');
        const teamsResult = await dispatch(fetchAllTeams());
        console.log('✅ fetchAllTeams result:', teamsResult);
        
        console.log('📡 Dispatching fetchAllPlayers...');
        const playersResult = await dispatch(fetchAllPlayers());
        console.log('✅ fetchAllPlayers result:', playersResult);
        
      } catch (error) {
        console.error('❌ Error loading initial data:', error);
      }
    };
    
    loadData();
  }, [dispatch]);

  // Load participations when a match is selected
  useEffect(() => {
    if (selectedMatchId) {
      dispatch(fetchMatchParticipations(selectedMatchId))
    }
  }, [dispatch, selectedMatchId])

  // Debug logging
  useEffect(() => {
    console.log('Match Management Debug Info:');
    console.log('- Is authenticated:', isAuthenticated);
    console.log('- User:', user);
    console.log('- Token available:', !!token);
    console.log('- Token length:', token?.length);
    console.log('- Matches count:', matches.length);
    console.log('- Teams count:', teams.length);
    console.log('- Participations count:', participations.length);
    console.log('- Sample match structure:', matches[0]);
    console.log('- Sample participation structure:', participations[0]);
    console.log('- Match loading state:', loading.matches);
    console.log('- Team loading state:', loading.teams);
    console.log('- Match error:', error.matches);
    console.log('- Team error:', error.teams);
  }, [isAuthenticated, user, token, matches.length, teams.length, participations.length, loading, error]);

  // Helper functions
  const resetForms = () => {
    setMatchForm({
      nomMatch: "",
      city: "",
      opposition: "",
      dateTime: "",
      formation: "", // Formation for the match
      bonus: "", // NEW: Default participation bonus for this match
      teamId: ""
    })
    setEditMatchForm({
      nomMatch: "",
      city: "",
      opposition: "",
      dateTime: "",
      formation: "", // Formation for the match
      bonus: "", // NEW: Default participation bonus for this match
      teamId: ""
    })
    setParticipationForm({
      playerId: "",
      role: "Starter",
      bonus: "",
      percentage: ""
    })
  }

  const formatDateTime = (dateTime: string | Date) => {
    const date = new Date(dateTime)
    return {
      date: date.toISOString().split('T')[0],
      time: date.toTimeString().slice(0, 5)
    }
  }

  const getStatusColor = (match: Match) => {
    const matchDate = new Date(match.dateTime)
    const now = new Date()
    
    if (matchDate > now) {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
    } else {
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
    }
  }

  const getMatchStatus = (match: Match) => {
    const matchDate = new Date(match.dateTime)
    const now = new Date()
    
    return matchDate > now ? "Scheduled" : "Completed"
  }

  const getParticipationColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "starter":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "substitute":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      case "bench":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getTeamName = (match: Match) => {
    return match.team?.name || "Unknown Team"
  }

  const getPlayerName = (playerId: number) => {
    const player = availablePlayers.find(p => p.id === playerId)
    return player ? `${player.firstName} ${player.lastName}` : "Unknown Player"
  }

  // Event handlers
  const handleCreateMatch = async () => {
    try {
      if (!matchForm.nomMatch || !matchForm.city || !matchForm.opposition || !matchForm.dateTime || !matchForm.teamId) {
        toast.error("Please fill in all required fields")
        return
      }

      // Convert date and time to ISO string
      const dateTimeISO = new Date(matchForm.dateTime).toISOString()

      const matchData: CreateMatchDto = {
        nomMatch: matchForm.nomMatch,
        city: matchForm.city,
        opposition: matchForm.opposition,
        dateTime: dateTimeISO,
        formation: matchForm.formation, // Formation for the match
        bonus: matchForm.bonus ? parseFloat(matchForm.bonus) : undefined, // NEW: Default participation bonus for this match
        teamId: parseInt(matchForm.teamId)
      }

      const resultAction = await dispatch(createMatch(matchData))
      
      if (createMatch.fulfilled.match(resultAction)) {
        toast.success("Match created successfully!")
        setIsCreateMatchDialogOpen(false)
        resetForms()
      } else {
        toast.error("Failed to create match")
      }
    } catch (error) {
      toast.error("Error creating match")
      console.error(error)
    }
  }

  const handleDeleteMatch = async (matchId: number) => {
    try {
      const resultAction = await dispatch(deleteMatch(matchId))
      
      if (deleteMatch.fulfilled.match(resultAction)) {
        toast.success("Match deleted successfully!")
        setIsDeleteDialogOpen(false)
        setMatchToDelete(null)
      } else {
        toast.error("Failed to delete match")
      }
    } catch (error) {
      toast.error("Error deleting match")
      console.error(error)
    }
  }

  const handleViewMatch = (match: Match) => {
    setSelectedMatchForView(match)
    setIsViewMatchDialogOpen(true)
    dispatch(setSelectedMatch(match.id))
  }

  const handleEditMatch = (match: Match) => {
    setSelectedMatchForView(match)
    setEditMatchForm({
      nomMatch: match.nomMatch,
      city: match.city,
      opposition: match.opposition,
      dateTime: new Date(match.dateTime).toISOString().slice(0, 16), // Format for datetime-local input
      formation: match.formation || "", // Formation for the match
      bonus: match.bonus?.toString() || "", // NEW: Default participation bonus for this match
      teamId: match.team.id.toString()
    })
    setIsEditMatchDialogOpen(true)
  }

  const handleUpdateMatch = async () => {
    try {
      if (!selectedMatchForView) return

      const dateTimeISO = new Date(editMatchForm.dateTime).toISOString()

      const matchData: UpdateMatchDto = {
        nomMatch: editMatchForm.nomMatch,
        city: editMatchForm.city,
        opposition: editMatchForm.opposition,
        dateTime: dateTimeISO,
        formation: editMatchForm.formation, // Formation for the match
        bonus: editMatchForm.bonus ? parseFloat(editMatchForm.bonus) : undefined, // NEW: Default participation bonus for this match
        teamId: parseInt(editMatchForm.teamId)
      }

      const resultAction = await dispatch(updateMatch({
        matchId: selectedMatchForView.id,
        matchData
      }))
      
      if (updateMatch.fulfilled.match(resultAction)) {
        toast.success("Match updated successfully!")
        setIsEditMatchDialogOpen(false)
        setSelectedMatchForView(null)
        resetForms()
      } else {
        toast.error("Failed to update match")
      }
    } catch (error) {
      toast.error("Error updating match")
      console.error(error)
    }
  }

  const handleConfirmDelete = (match: Match) => {
    setMatchToDelete(match)
    setIsDeleteDialogOpen(true)
  }

  const handleOpenTacticalPlanner = (match: Match) => {
    setSelectedMatchForTactical(match)
    setIsTacticalPlannerOpen(true)
    dispatch(setSelectedMatch(match.id))
    // Load participations for this match
    dispatch(fetchMatchParticipations(match.id))
  }

  const handleAddPlayerToMatch = async () => {
    try {
      if (!selectedMatch || !participationForm.playerId || !participationForm.role) {
        toast.error("Please fill in all required fields")
        return
      }

      const participationData: CreateMatchParticipationDto = {
        playerId: parseInt(participationForm.playerId),
        role: participationForm.role,
        bonus: participationForm.bonus ? parseFloat(participationForm.bonus) : undefined,
        percentage: participationForm.percentage ? parseInt(participationForm.percentage) : undefined
      }

      const resultAction = await dispatch(addPlayerToMatch({
        matchId: selectedMatch.id,
        participationData
      }))
      
      if (addPlayerToMatch.fulfilled.match(resultAction)) {
        toast.success("Player added to match successfully!")
        setIsAddPlayerDialogOpen(false)
        resetForms()
        setSelectedMatchForParticipation(null)
      } else {
        toast.error("Failed to add player to match")
      }
    } catch (error) {
      toast.error("Error adding player to match")
      console.error(error)
    }
  }

  const handleRemovePlayerFromMatch = async (participationId: number, matchId: number) => {
    try {
      const resultAction = await dispatch(removePlayerFromMatch({
        matchId,
        participationId
      }))
      
      if (removePlayerFromMatch.fulfilled.match(resultAction)) {
        toast.success("Player removed from match successfully!")
      } else {
        toast.error("Failed to remove player from match")
      }
    } catch (error) {
      toast.error("Error removing player from match")
      console.error(error)
    }
  }

  // Computed values
  const filteredMatches = matches.filter(
    (match) =>
      match.nomMatch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.opposition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.city.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const upcomingMatches = matches.filter((match) => {
    const matchDate = new Date(match.dateTime)
    const now = new Date()
    return matchDate > now
  }).length

  const completedMatches = matches.filter((match) => {
    const matchDate = new Date(match.dateTime)
    const now = new Date()
    return matchDate <= now
  }).length

  const totalParticipations = participations.length
  const totalBonuses = participations.reduce((sum, p) => {
    const bonus = p.bonus ? (typeof p.bonus === 'string' ? parseFloat(p.bonus) : p.bonus) : 0;
    return sum + (isNaN(bonus) ? 0 : bonus);
  }, 0)

  // Show loading state
  if (loading.matches || loading.teams) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-lg font-medium">Loading matches data...</p>
      </div>
    )
  }

  // Show error state
  if (error.matches || error.teams) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 max-w-md">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Data</h3>
          <p className="text-sm text-red-700">
            {error.matches || error.teams}
          </p>
          <Button 
            className="mt-4 bg-red-600 hover:bg-red-700" 
            onClick={() => {
              dispatch(fetchAllMatches())
              dispatch(fetchAllTeams())
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Match Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Schedule matches, manage participation, and track bonuses</p>
        </div>

        <Dialog open={isCreateMatchDialogOpen} onOpenChange={setIsCreateMatchDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-800 hover:bg-blue-900 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Match
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Schedule New Match</DialogTitle>
              <DialogDescription>
                Create a new match with opponent details, date, time, and venue.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="matchName" className="text-right">
                  Match Name
                </Label>
                <Input 
                  id="matchName" 
                  placeholder="Enter match name"
                  value={matchForm.nomMatch}
                  onChange={(e) => setMatchForm({...matchForm, nomMatch: e.target.value})}
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="opposition" className="text-right">
                  Opposition
                </Label>
                <Input 
                  id="opposition" 
                  placeholder="Opposition team"
                  value={matchForm.opposition}
                  onChange={(e) => setMatchForm({...matchForm, opposition: e.target.value})}
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="city" className="text-right">
                  City
                </Label>
                <Input 
                  id="city" 
                  placeholder="Match city"
                  value={matchForm.city}
                  onChange={(e) => setMatchForm({...matchForm, city: e.target.value})}
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dateTime" className="text-right">
                  Date & Time
                </Label>
                <Input 
                  id="dateTime" 
                  type="datetime-local"
                  value={matchForm.dateTime}
                  onChange={(e) => setMatchForm({...matchForm, dateTime: e.target.value})}
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="team" className="text-right">
                  Team
                </Label>
                <Select value={matchForm.teamId} onValueChange={(value) => setMatchForm({...matchForm, teamId: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="formation" className="text-right">
                  Formation
                </Label>
                <Input 
                  id="formation" 
                  placeholder="e.g., 4-4-2, 4-3-3"
                  value={matchForm.formation}
                  onChange={(e) => setMatchForm({...matchForm, formation: e.target.value})}
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bonus" className="text-right">
                  Participation Bonus
                </Label>
                <Input 
                  id="bonus" 
                  type="number"
                  step="0.01"
                  placeholder="e.g., 500"
                  value={matchForm.bonus}
                  onChange={(e) => setMatchForm({...matchForm, bonus: e.target.value})}
                  className="col-span-3" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                className="bg-blue-800 hover:bg-blue-900"
                onClick={handleCreateMatch}
                disabled={loading.matches}
              >
                {loading.matches ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Schedule Match"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Upcoming Matches</CardTitle>
            <Calendar className="h-4 w-4 text-blue-800" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{upcomingMatches}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed Matches</CardTitle>
            <Trophy className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{completedMatches}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">This season</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Players</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalParticipations}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">In matches</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Match Bonuses</CardTitle>
            <Target className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">${totalBonuses.toLocaleString()}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total allocated</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="matches" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="squads">Squad Assignments</TabsTrigger>
          <TabsTrigger value="bonuses">Match Bonuses</TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">All Matches</CardTitle>
              <CardDescription>View and manage scheduled and completed matches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search matches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Match</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMatches.map((match) => {
                      const { date, time } = formatDateTime(match.dateTime)
                      const status = getMatchStatus(match)
                      return (
                        <TableRow 
                          key={match.id}
                          className={selectedMatchId === match.id ? "bg-blue-50 dark:bg-blue-900/20" : ""}
                        >
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-semibold">{match.nomMatch}</div>
                              <div className="text-sm text-gray-500">vs {match.opposition}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {date}
                              <Clock className="h-4 w-4 text-gray-400 ml-2" />
                              {time}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              {match.city}
                            </div>
                          </TableCell>
                          <TableCell>{getTeamName(match)}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(match)}>{status}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewMatch(match)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenTacticalPlanner(match)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Target className="h-4 w-4 mr-1" />
                                Tactics
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditMatch(match)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleConfirmDelete(match)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {filteredMatches.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          No matches found. Create a new match to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="squads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Squad Assignments</CardTitle>
              <CardDescription>View and manage player assignments for matches using the tactical planner</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Quick access to tactical planner */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-900">Use Tactical Planner</h3>
                      <p className="text-sm text-blue-700">
                        Click "Tactics" on any match to use our drag-and-drop tactical planner. 
                        Assign 11 starters (100% bonus) and up to 5 substitutes (50% bonus) with formation support.
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                {/* Current Participations Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead>Match</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Bonus</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participations.map((participation) => (
                        <TableRow key={participation.id}>
                          <TableCell className="font-medium">
                            {participation.player 
                              ? `${participation.player.firstName} ${participation.player.lastName}`
                              : "Unknown Player"
                            }
                          </TableCell>
                          <TableCell>
                            {(() => {
                              // Since we don't have matchId directly, we need to find it from context
                              // For now, we'll show "Current Match" or we could pass it as prop
                              return selectedMatchForView ? 
                                `${selectedMatchForView.nomMatch} vs ${selectedMatchForView.opposition}` : 
                                "Match Details"
                            })()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getParticipationColor(participation.role)}>{participation.role}</Badge>
                          </TableCell>
                          <TableCell className="text-green-600 font-medium">
                            ${(() => {
                              const bonus = participation.bonus ? (typeof participation.bonus === 'string' ? parseFloat(participation.bonus) : participation.bonus) : 0;
                              return isNaN(bonus) ? "0.00" : bonus.toFixed(2);
                            })()}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const percentage = participation.percentage ? (typeof participation.percentage === 'string' ? parseFloat(participation.percentage) : participation.percentage) : 0;
                              return isNaN(percentage) ? 0 : percentage;
                            })()}%
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                // We need to get matchId from context since it's not in participation
                                if (selectedMatchForView) {
                                  handleRemovePlayerFromMatch(participation.id, selectedMatchForView.id)
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {participations.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            <div className="flex flex-col items-center space-y-2">
                              <Users className="h-12 w-12 text-gray-400" />
                              <p>No squad assignments found</p>
                              <p className="text-sm">Use the "Tactics" button on matches to assign players using our tactical planner</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bonuses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Match Bonuses</CardTitle>
              <CardDescription>Configure and track performance-based bonuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Set up bonus criteria based on match performance, goals, assists, and other metrics.
                </p>
                <Button className="bg-blue-800 hover:bg-blue-900 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Configure Bonuses
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Match Dialog */}
      <Dialog open={isViewMatchDialogOpen} onOpenChange={setIsViewMatchDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Match Details</DialogTitle>
            <DialogDescription>
              View match information and details
            </DialogDescription>
          </DialogHeader>
          {selectedMatchForView && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Match Name</Label>
                  <p className="text-sm">{selectedMatchForView.nomMatch}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Opposition</Label>
                  <p className="text-sm">{selectedMatchForView.opposition}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">City</Label>
                  <p className="text-sm">{selectedMatchForView.city}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Date & Time</Label>
                  <p className="text-sm">{new Date(selectedMatchForView.dateTime).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Team</Label>
                <p className="text-sm">
                  {selectedMatchForView.team?.name || 'Unknown Team'}
                </p>
              </div>
              {selectedMatchForView.formation && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Formation</Label>
                  <p className="text-sm">{selectedMatchForView.formation}</p>
                </div>
              )}
              {selectedMatchForView.bonus && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Participation Bonus</Label>
                  <p className="text-sm">${selectedMatchForView.bonus.toLocaleString()}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-gray-600">Status</Label>
                <Badge className={getStatusColor(selectedMatchForView)}>
                  {new Date(selectedMatchForView.dateTime) > new Date() ? 'Upcoming' : 
                   new Date(selectedMatchForView.dateTime).toDateString() === new Date().toDateString() ? 'Today' : 'Completed'}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Match Dialog */}
      <Dialog open={isEditMatchDialogOpen} onOpenChange={setIsEditMatchDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Match</DialogTitle>
            <DialogDescription>
              Update match information and details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-match-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-match-name"
                value={editMatchForm.nomMatch}
                onChange={(e) => setEditMatchForm({...editMatchForm, nomMatch: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-opposition" className="text-right">
                Opposition
              </Label>
              <Input
                id="edit-opposition"
                value={editMatchForm.opposition}
                onChange={(e) => setEditMatchForm({...editMatchForm, opposition: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-city" className="text-right">
                City
              </Label>
              <Input
                id="edit-city"
                value={editMatchForm.city}
                onChange={(e) => setEditMatchForm({...editMatchForm, city: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-datetime" className="text-right">
                Date & Time
              </Label>
              <Input
                id="edit-datetime"
                type="datetime-local"
                value={editMatchForm.dateTime}
                onChange={(e) => setEditMatchForm({...editMatchForm, dateTime: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-team" className="text-right">
                Team
              </Label>
              <Select value={editMatchForm.teamId} onValueChange={(value) => setEditMatchForm({...editMatchForm, teamId: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-formation" className="text-right">
                Formation
              </Label>
              <Input
                id="edit-formation"
                placeholder="e.g., 4-4-2, 4-3-3"
                value={editMatchForm.formation}
                onChange={(e) => setEditMatchForm({...editMatchForm, formation: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-bonus" className="text-right">
                Participation Bonus
              </Label>
              <Input
                id="edit-bonus"
                type="number"
                step="0.01"
                placeholder="e.g., 500"
                value={editMatchForm.bonus}
                onChange={(e) => setEditMatchForm({...editMatchForm, bonus: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={handleUpdateMatch}
              disabled={loading.matches}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading.matches ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Match"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Delete
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this match? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {matchToDelete && (
            <div className="py-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="font-medium">{matchToDelete.nomMatch}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  vs {matchToDelete.opposition} • {new Date(matchToDelete.dateTime).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setMatchToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => matchToDelete && handleDeleteMatch(matchToDelete.id)}
              disabled={loading.matches}
            >
              {loading.matches ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Match"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tactical Planner Dialog */}
      {selectedMatchForTactical && (
        <TacticalPlanner
          match={selectedMatchForTactical}
          isOpen={isTacticalPlannerOpen}
          onClose={() => {
            setIsTacticalPlannerOpen(false)
            setSelectedMatchForTactical(null)
          }}
        />
      )}
    </div>
  )
}
