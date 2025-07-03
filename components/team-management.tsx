"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { fetchAllTeams } from "@/lib/redux/teamSlice"
import { Team} from "@/lib/types/team-management"
import { toast } from "sonner"
import {
  Building2,
  BarChart3,
  Users,
  Loader2,
  PlusCircle,
  Briefcase,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { TeamDetails } from "./team-management/team-details"
import { TeamForm } from "./team-management/team-form"
import { TeamList } from "./team-management/team-list"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

export function TeamManagement() {
  const dispatch = useAppDispatch()
  const { teams, loading, error } = useAppSelector((state) => state.teams)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null)

  // Fetch teams on component mount
  useEffect(() => {
    dispatch(fetchAllTeams())
  }, [dispatch])

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  // Ensure dropdowns filter out invalid values
  const validTeams = teams.filter(team => team && team.id && team.name)

  // Ensure teams have a fallback category
  const teamsWithFallbackCategory = validTeams.map(team => ({
    ...team,
    category: team.category || "Uncategorized",
  }));

  const handleViewTeamDetails = (team: Team) => {
    if (!team || !team.id) {
      toast.error("Invalid team selected")
      return
    }
    setSelectedTeam(team)
    setActiveTab("details")
  }
  
  const handleCreateTeamClick = () => {
    setIsCreateDialogOpen(true)
  }

  const handleEditTeamClick = (team: Team) => {
    setTeamToEdit(team)
    setIsEditDialogOpen(true)
  }

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false)
    dispatch(fetchAllTeams()) // Refresh teams
    toast.success("Team created successfully")
  }

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false)
    dispatch(fetchAllTeams()) // Refresh teams
    toast.success("Team updated successfully")
  }

  const totalTeams = teamsWithFallbackCategory.length

  // Use numberOfStaff from each team to calculate total
  const totalStaff = teamsWithFallbackCategory.reduce((acc, team) => 
    acc + (team.numberOfStaff || 0), 0)

  // User numberOfPlayers from each team to calculate total
  const totalPlayersCount = teamsWithFallbackCategory.reduce((acc, team) => 
    acc + (team.numberOfPlayers || 0), 0)

  const totalBudget = teamsWithFallbackCategory.reduce((acc, team) => {
    let budget = 0;
    if (typeof team.budget === 'number' && !isNaN(team.budget)) {
      budget = team.budget;
    } else if (team.budget) {
      const parsed = parseFloat(String(team.budget));
      budget = !isNaN(parsed) ? parsed : 0;
    }
    return acc + budget;
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage team rosters, players, and matches</p>
        </div>
        <Button 
          className="bg-blue-800 hover:bg-blue-900 text-white" 
          onClick={handleCreateTeamClick}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>
      
      {/* Create Team Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>Add a new team to your organization</DialogDescription>
          </DialogHeader>
          <TeamForm 
            isCreating={true} 
            onSuccess={handleCreateSuccess}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Team Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>Update team information</DialogDescription>
          </DialogHeader>
          <TeamForm 
            team={teamToEdit}
            isEditing={true}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Teams
          </TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedTeam} className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {selectedTeam ? `${selectedTeam.name} Details` : "Team Details"}
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-blue-800" />
                  <span className="text-3xl font-bold">{totalTeams}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Players</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-800" />
                  <span className="text-3xl font-bold">{totalPlayersCount}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-indigo-800" />
                  <span className="text-3xl font-bold">{totalStaff}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-800" />
                  <span className="text-3xl font-bold">${totalBudget.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
            </div>
          ) : (
            <TeamList 
              teams={teamsWithFallbackCategory} 
              onViewDetails={handleViewTeamDetails} 
              onEditTeam={handleEditTeamClick}
              isSimplified={true}
            />
          )}
        </TabsContent>

        {/* Teams List Tab */}
        <TabsContent value="list">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
            </div>
          ) : (
            <TeamList 
              teams={teamsWithFallbackCategory} 
              onViewDetails={handleViewTeamDetails} 
              onEditTeam={handleEditTeamClick}
              isSimplified={false}
            />
          )}
        </TabsContent>

        {/* Team Details Tab */}
        <TabsContent value="details">
          {selectedTeam && (
            <TeamDetails team={selectedTeam} onEditTeam={handleEditTeamClick} />
          )}
        </TabsContent>

        {/* We've replaced the form tab with dialogs */}
      </Tabs>
    </div>
  )
}
