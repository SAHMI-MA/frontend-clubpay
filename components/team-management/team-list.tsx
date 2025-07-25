"use client"

import { useState } from "react"
import { Team } from "@/lib/types/team-management"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Search, Trash2, Eye, Building2, Users, DollarSign } from "lucide-react"
import { useAppDispatch } from "@/lib/redux/hooks"
import { deleteTeam } from "@/lib/redux/teamSlice"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface TeamListProps {
  teams: Team[]
  onViewDetails: (team: Team) => void
  onEditTeam?: (team: Team) => void
  isSimplified?: boolean
}

export function TeamList({ teams, onViewDetails, onEditTeam, isSimplified = false }: TeamListProps) {
  const dispatch = useAppDispatch()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null)

  const handleDeleteClick = (team: Team) => {
    setTeamToDelete(team)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!teamToDelete) return

    try {
      await dispatch(deleteTeam(teamToDelete.id)).unwrap()
      toast.success("Team deleted successfully")
    } catch (error) {
      toast.error("Failed to delete team" + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsDeleteDialogOpen(false)
      setTeamToDelete(null)
    }
  }

  // Get unique categories for the filter
  const categories = Array.from(new Set(teams.map(team => team.category)))

  // Filter teams based on search term and category
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || team.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  if (isSimplified) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeams.map(team => (
          <Card key={team.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{team.name}</CardTitle>
                  <CardDescription>
                    <Badge variant="outline" className="mr-2">{team.category}</Badge>
                    <span>Budget: ${team.budget.toLocaleString()}</span>
                  </CardDescription>
                </div>
                <Badge>{team.players?.length || 0} Players</Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {team.description || "No description available"}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => onViewDetails(team)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              {onEditTeam && (
                <Button variant="ghost" size="sm" onClick={() => onEditTeam(team)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Team List</CardTitle>
          <CardDescription>Manage your teams and their details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                      No teams found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-blue-800" />
                          {team.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{team.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-800" />
                          {team.players?.length || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-800" />
                          {team.budget.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onViewDetails(team)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {onEditTeam && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onEditTeam(team)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteClick(team)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the team &quot;{teamToDelete?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
