"use client"

import { useState } from "react"
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
import { Label } from "@/components/ui/label"
import { Calendar, Clock, MapPin, Plus, Search, Trophy, Users, Target } from "lucide-react"

const matches = [
  {
    id: 1,
    homeTeam: "Eagles FC",
    awayTeam: "Lions United",
    date: "2024-01-15",
    time: "15:00",
    venue: "Eagle Stadium",
    status: "Scheduled",
    competition: "Premier League",
  },
  {
    id: 2,
    homeTeam: "Hawks FC",
    awayTeam: "Tigers FC",
    date: "2024-01-16",
    time: "17:30",
    venue: "Hawks Arena",
    status: "Scheduled",
    competition: "Division 1",
  },
  {
    id: 3,
    homeTeam: "Wolves FC",
    awayTeam: "Bears United",
    date: "2024-01-12",
    time: "14:00",
    venue: "City Stadium",
    status: "Completed",
    competition: "Premier League",
    homeScore: 2,
    awayScore: 1,
  },
  {
    id: 4,
    homeTeam: "Panthers FC",
    awayTeam: "Sharks United",
    date: "2024-01-10",
    time: "16:00",
    venue: "Panthers Ground",
    status: "Completed",
    competition: "Division 2",
    homeScore: 0,
    awayScore: 3,
  },
]

const playerParticipation = [
  {
    id: 1,
    matchId: 1,
    player: "Alex Rodriguez",
    team: "Eagles FC",
    position: "Forward",
    status: "Starting XI",
    bonus: 500,
  },
  {
    id: 2,
    matchId: 1,
    player: "David Thompson",
    team: "Eagles FC",
    position: "Midfielder",
    status: "Starting XI",
    bonus: 500,
  },
  {
    id: 3,
    matchId: 1,
    player: "Mike Johnson",
    team: "Eagles FC",
    position: "Defender",
    status: "Substitute",
    bonus: 250,
  },
]

export function MatchManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "postponed":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getParticipationColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "starting xi":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "substitute":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      case "bench":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const filteredMatches = matches.filter(
    (match) =>
      match.homeTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.competition.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const upcomingMatches = matches.filter((match) => match.status === "Scheduled").length
  const completedMatches = matches.filter((match) => match.status === "Completed").length
  const totalBonuses = playerParticipation.reduce((sum, p) => sum + p.bonus, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Match Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Schedule matches, manage participation, and track bonuses</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                Create a new match between two teams with date, time, and venue details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="homeTeam" className="text-right">
                  Home Team
                </Label>
                <Input id="homeTeam" placeholder="Select home team" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="awayTeam" className="text-right">
                  Away Team
                </Label>
                <Input id="awayTeam" placeholder="Select away team" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date
                </Label>
                <Input id="date" type="date" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">
                  Time
                </Label>
                <Input id="time" type="time" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="venue" className="text-right">
                  Venue
                </Label>
                <Input id="venue" placeholder="Match venue" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-blue-800 hover:bg-blue-900">
                Schedule Match
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
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{playerParticipation.length}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">In upcoming matches</p>
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
          <TabsTrigger value="participation">Player Participation</TabsTrigger>
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
                      <TableHead>Venue</TableHead>
                      <TableHead>Competition</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMatches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell className="font-medium">
                          {match.homeTeam} vs {match.awayTeam}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {match.date}
                            <Clock className="h-4 w-4 text-gray-400 ml-2" />
                            {match.time}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {match.venue}
                          </div>
                        </TableCell>
                        <TableCell>{match.competition}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(match.status)}>{match.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {match.status === "Completed" &&
                          match.homeScore !== undefined &&
                          match.awayScore !== undefined
                            ? `${match.homeScore} - ${match.awayScore}`
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Player Participation</CardTitle>
              <CardDescription>Manage player assignments for matches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input placeholder="Search players..." className="pl-10" />
                </div>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Player
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Participation Status</TableHead>
                      <TableHead>Match Bonus</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {playerParticipation.map((participation) => (
                      <TableRow key={participation.id}>
                        <TableCell className="font-medium">{participation.player}</TableCell>
                        <TableCell>{participation.team}</TableCell>
                        <TableCell>{participation.position}</TableCell>
                        <TableCell>
                          <Badge className={getParticipationColor(participation.status)}>{participation.status}</Badge>
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">${participation.bonus}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
    </div>
  )
}
