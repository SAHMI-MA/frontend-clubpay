"use client"

import { useState, useEffect } from "react"
import { Team, Player, Match, Staff } from "@/lib/types/team-management"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Edit, 
  Calendar, 
  Users, 
  DollarSign, 
  UserPlus,
  MapPin,
  Clock,
  Loader2
} from "lucide-react"
import { fetchTeamById } from "@/lib/redux/teamSlice"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { fetchAllStaff } from "@/lib/redux/staffSlice"
import { TeamAvatar } from "./team-avatar"

interface TeamDetailsProps {
  team: Team
  onEditTeam?: (team: Team) => void
}

export function TeamDetails({ team, onEditTeam }: TeamDetailsProps) {
  const dispatch = useAppDispatch()
  const { staff: allStaff, loading: staffLoading } = useAppSelector((state) => state.staff)
  const [activeTab, setActiveTab] = useState("overview")

  // Fetch detailed team data when viewing
  useEffect(() => {
    dispatch(fetchTeamById(team.id))
    dispatch(fetchAllStaff())
  }, [team.id, dispatch])

  // Get staff for this team from the global staff list
  const staffList: Staff[] = allStaff.filter((s: Staff) => 
    s && s.id && s.team && s.team.id === team.id
  )

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filter upcoming matches
  const upcomingMatches = team.matches?.filter(match => 
    new Date(match.dateTime) > new Date() && match.status === 'scheduled'
  ) || []

  // Filter past matches
  const pastMatches = team.matches?.filter(match => 
    new Date(match.dateTime) <= new Date() || match.status === 'completed'
  ) || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <TeamAvatar team={team} size="xl" />
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">{team.name}</CardTitle>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {team.code}
                  </Badge>
                </div>
                <CardDescription className="mt-1">
                  <span>Created: {team.createdAt ? formatDate(team.createdAt) : 'N/A'}</span>
                </CardDescription>
              </div>
            </div>
            {onEditTeam && (
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => onEditTeam(team)}
              >
                <Edit className="h-4 w-4" />
                Edit Team
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 border rounded-md bg-gray-50 dark:bg-gray-900">
              <Users className="h-6 w-6 text-blue-800" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Players</div>
                <div className="text-xl font-bold">{team.players?.length || 0}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-md bg-gray-50 dark:bg-gray-900">
              <DollarSign className="h-6 w-6 text-green-800" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Budget</div>
                <div className="text-xl font-bold">${team.budget.toLocaleString()}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-md bg-gray-50 dark:bg-gray-900">
              <Calendar className="h-6 w-6 text-purple-800" />
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Upcoming Matches</div>
                <div className="text-xl font-bold">{upcomingMatches.length}</div>
              </div>
            </div>
          </div>
          <p className="mt-6 text-gray-700 dark:text-gray-300">
            {team.description || "No team description available."}
          </p>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="players" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Players
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="matches" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Matches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Team Players</h3>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Contract</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {team.players && team.players.length > 0 ? (
                    team.players.map((player: Player) => (
                      <TableRow key={player.id}>
                        <TableCell>
                          <div className="font-medium">
                            {player.firstName} {player.lastName}
                          </div>
                        </TableCell>
                        <TableCell>{player.position}</TableCell>
                        <TableCell>
                          {player.dateOfBirth ? 
                            Math.floor((new Date().getTime() - new Date(player.dateOfBirth).getTime()) / 31557600000) 
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {player.contract ? (
                            <Badge variant="outline" className="gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${player.contract.salary.toLocaleString()}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                              No Contract
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-gray-500">
                        No players in this team
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Team Staff</h3>
          </div>
          <Card>
            <CardContent className="p-0">
              {staffLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffList.length > 0 ? (
                      staffList.map((staffMember: Staff) => (
                        <TableRow key={staffMember.id}>
                          <TableCell>{staffMember.firstName} {staffMember.lastName}</TableCell>
                          <TableCell>{staffMember.role}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-10 text-gray-500">
                          No staff assigned to this team
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="space-y-4 mt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Team Matches</h3>
          </div>

          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Upcoming Matches</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Match</TableHead>
                    <TableHead>Opposition</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingMatches.length > 0 ? (
                    upcomingMatches.map((match: Match) => (
                      <TableRow key={match.id}>
                        <TableCell className="font-medium">{match.nomMatch}</TableCell>
                        <TableCell>vs. {match.opposition}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-500" />
                            {match.city}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-500" />
                            {formatDate(match.dateTime)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                            Scheduled
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                        No upcoming matches
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Past Matches</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Match</TableHead>
                    <TableHead>Opposition</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastMatches.length > 0 ? (
                    pastMatches.map((match: Match) => {
                      const homeScore = match.homeScore || 0;
                      const awayScore = match.awayScore || 0;
                      let resultBadge;
                      
                      if (match.status !== 'completed') {
                        resultBadge = (
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                            {match.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                          </Badge>
                        );
                      } else if (homeScore > awayScore) {
                        resultBadge = (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            Win
                          </Badge>
                        );
                      } else if (homeScore < awayScore) {
                        resultBadge = (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                            Loss
                          </Badge>
                        );
                      } else {
                        resultBadge = (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                            Draw
                          </Badge>
                        );
                      }
                      
                      return (
                        <TableRow key={match.id}>
                          <TableCell className="font-medium">{match.nomMatch}</TableCell>
                          <TableCell>vs. {match.opposition}</TableCell>
                          <TableCell>
                            {match.status === 'completed' ? `${homeScore} - ${awayScore}` : 'N/A'}
                          </TableCell>
                          <TableCell>{formatDate(match.dateTime)}</TableCell>
                          <TableCell className="text-right">{resultBadge}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                        No past matches
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
