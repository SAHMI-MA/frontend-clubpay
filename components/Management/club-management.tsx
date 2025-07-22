"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building2, Plus, Search, Users, Trophy, Calendar } from "lucide-react"

const clubs = [
  {
    id: 1,
    name: "Eagles Football Club",
    division: "Premier",
    founded: "1995",
    players: 28,
    staff: 5,
    homeGround: "Eagle Stadium",
    status: "Active",
  },
  {
    id: 2,
    name: "Hawks United",
    division: "Division 1",
    founded: "2001",
    players: 24,
    staff: 4,
    homeGround: "Hawks Arena",
    status: "Active",
  },
  {
    id: 3,
    name: "Lions FC",
    division: "Division 2",
    founded: "1988",
    players: 22,
    staff: 3,
    homeGround: "Lions Ground",
    status: "Inactive",
  },
]

const teams = [
  {
    id: 1,
    name: "Eagles Senior Team",
    club: "Eagles FC",
    category: "Senior",
    players: 18,
    coach: "John Smith",
    division: "Premier League",
  },
  {
    id: 2,
    name: "Eagles Youth Team",
    club: "Eagles FC",
    category: "Youth",
    players: 16,
    coach: "Sarah Johnson",
    division: "Youth League",
  },
  {
    id: 3,
    name: "Hawks First Team",
    club: "Hawks United",
    category: "Senior",
    players: 20,
    coach: "Mike Wilson",
    division: "Division 1",
  },
]

const players = [
  {
    id: 1,
    name: "Alex Rodriguez",
    team: "Eagles Senior Team",
    position: "Forward",
    age: 24,
    joinDate: "2023-01-15",
    status: "Active",
  },
  {
    id: 2,
    name: "David Thompson",
    team: "Eagles Senior Team",
    position: "Midfielder",
    age: 26,
    joinDate: "2022-08-20",
    status: "Active",
  },
  {
    id: 3,
    name: "James Wilson",
    team: "Hawks First Team",
    position: "Defender",
    age: 23,
    joinDate: "2023-03-10",
    status: "Injured",
  },
]

export function ClubManagement() {
  const [searchTerm, setSearchTerm] = useState("")

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
      case "injured":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Club & Team Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage clubs, teams, players, and staff</p>
        </div>
        <Button className="bg-blue-800 hover:bg-blue-900 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Club
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Clubs</CardTitle>
            <Building2 className="h-4 w-4 text-blue-800" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{clubs.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Teams</CardTitle>
            <Trophy className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{teams.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Players</CardTitle>
            <Users className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{players.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Seasons</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">3</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="clubs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clubs">Clubs</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
        </TabsList>

        <TabsContent value="clubs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Clubs</CardTitle>
              <CardDescription>Manage all clubs in your association</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search clubs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Club
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Club Name</TableHead>
                      <TableHead>Division</TableHead>
                      <TableHead>Founded</TableHead>
                      <TableHead>Players</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Home Ground</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clubs.map((club) => (
                      <TableRow key={club.id}>
                        <TableCell className="font-medium">{club.name}</TableCell>
                        <TableCell>{club.division}</TableCell>
                        <TableCell>{club.founded}</TableCell>
                        <TableCell>{club.players}</TableCell>
                        <TableCell>{club.staff}</TableCell>
                        <TableCell>{club.homeGround}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(club.status)}>{club.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Teams</CardTitle>
              <CardDescription>Manage teams within clubs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input placeholder="Search teams..." className="pl-10" />
                </div>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Club</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Players</TableHead>
                      <TableHead>Coach</TableHead>
                      <TableHead>Division</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell>{team.club}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{team.category}</Badge>
                        </TableCell>
                        <TableCell>{team.players}</TableCell>
                        <TableCell>{team.coach}</TableCell>
                        <TableCell>{team.division}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Players</CardTitle>
              <CardDescription>Manage all players across teams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input placeholder="Search players..." className="pl-10" />
                </div>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Player
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player Name</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {players.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">{player.name}</TableCell>
                        <TableCell>{player.team}</TableCell>
                        <TableCell>{player.position}</TableCell>
                        <TableCell>{player.age}</TableCell>
                        <TableCell>{player.joinDate}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(player.status)}>{player.status}</Badge>
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
    </div>
  )
}
