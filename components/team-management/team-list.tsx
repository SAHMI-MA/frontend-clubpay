"use client"

import { useState } from "react"
import { Team as TeamType } from "@/lib/types/team-management"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Search, Trash2, Eye, Users, DollarSign, AlertTriangle } from "lucide-react"
import { useAppDispatch } from "@/lib/redux/hooks"
import { deleteTeam } from "@/lib/redux/teamSlice"
import { toast } from "sonner"
import { TeamAvatar } from "./team-avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface TeamListProps {
  teams: TeamType[]
  onViewDetails: (team: TeamType) => void
  onEditTeam?: (team: TeamType) => void
  isSimplified?: boolean
}

export function TeamList({ teams, onViewDetails, onEditTeam, isSimplified = false }: TeamListProps) {
  const dispatch = useAppDispatch()
  const [searchTerm, setSearchTerm] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState<TeamType | null>(null)

  const handleDeleteClick = (team: TeamType) => {
    setTeamToDelete(team)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!teamToDelete) return

    try {
      await dispatch(deleteTeam(teamToDelete.id)).unwrap()
      toast.success("Équipe supprimée avec succès")
    } catch (error) {
      toast.error("Échec de la suppression de l'équipe" + (error instanceof Error ? error.message : "Erreur inconnue"))
    } finally {
      setIsDeleteDialogOpen(false)
      setTeamToDelete(null)
    }
  }

  // Filter teams based on search term only
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Helper function to check if budget is exceeded
  const isBudgetExceeded = (team: TeamType) => {
    const budget = Number(team.budget) || 0
    const spending = Number(team.currentSpending) || 0
    return spending > budget
  }

  // Helper function to get budget percentage
  const getBudgetPercentage = (team: TeamType) => {
    const budget = Number(team.budget) || 0
    const spending = Number(team.currentSpending) || 0
    if (budget === 0) return 0
    return (spending / budget) * 100
  }

  if (isSimplified) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeams.map(team => {
          const budgetExceeded = isBudgetExceeded(team)
          const budgetPercentage = getBudgetPercentage(team)
          const warningThreshold = team.budgetWarningThreshold || 80
          
          return (
          <Card key={team.id} className={`overflow-hidden ${budgetExceeded ? 'border-red-500 border-2' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <TeamAvatar team={team} size="md" />
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {team.name}
                      {budgetExceeded && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs font-mono">
                        {team.code}
                      </Badge>
                      {team.category && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {team.category.name}
                          </Badge>
                          {team.category.code && (
                            <span className="text-xs text-gray-500 font-mono">
                              {team.category.code}
                            </span>
                          )}
                        </div>
                      )}
                      {budgetExceeded && (
                        <Badge className="bg-red-500 text-white text-xs">
                          Budget dépassé!
                        </Badge>
                      )}
                      {!budgetExceeded && budgetPercentage >= warningThreshold && (
                        <Badge className="bg-orange-500 text-white text-xs">
                          {budgetPercentage.toFixed(0)}% utilisé
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  {team.numberOfPlayers || 0} Joueurs
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {team.description || "Aucune description disponible"}
                </p>
                
                {/* Budget Status Section */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Budget:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'MAD',
                        minimumFractionDigits: 0
                      }).format(Number(team.budget))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Dépenses:</span>
                    <span className={`font-medium ${budgetExceeded ? 'text-red-600' : ''}`}>
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'MAD',
                        minimumFractionDigits: 0
                      }).format(Number(team.currentSpending || 0))}
                    </span>
                  </div>
                  {/* Budget Progress Bar */}
                  <div className="w-full">
                    <div className="flex justify-between text-xs mb-1">
                      <span className={budgetExceeded ? 'text-red-600 font-medium' : 'text-gray-600'}>
                        {budgetPercentage.toFixed(1)}%
                      </span>
                      <span className="text-gray-500">
                        Reste: {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'MAD',
                          minimumFractionDigits: 0
                        }).format(Math.max(0, Number(team.budget) - Number(team.currentSpending || 0)))}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          budgetExceeded ? 'bg-red-500' : 
                          budgetPercentage >= warningThreshold ? 'bg-orange-500' : 
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm pt-2">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>{team.numberOfStaff || 0} Personnel</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => onViewDetails(team)}>
                <Eye className="h-4 w-4 mr-2" />
                Voir détails
              </Button>
              <div className="flex gap-1">
                {onEditTeam && (
                  <Button variant="ghost" size="sm" onClick={() => onEditTeam(team)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteClick(team)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </CardFooter>
          </Card>
        )})}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Liste des équipes</CardTitle>
          <CardDescription>Gérez vos équipes et leurs détails</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher des équipes..."
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
                  <TableHead>#</TableHead>
                  <TableHead>Équipe</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Joueurs</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                      Aucune équipe trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeams.map((team, index) => {
                    const budgetExceeded = isBudgetExceeded(team)
                    const budgetPercentage = getBudgetPercentage(team)
                    const warningThreshold = team.budgetWarningThreshold || 80
                    
                    return (
                    <TableRow key={team.id} className={budgetExceeded ? 'bg-red-50' : ''}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <TeamAvatar team={team} size="sm" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{team.name}</p>
                              {budgetExceeded && (
                                <Badge className="bg-red-500 text-white text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Budget dépassé
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 font-mono">{team.code}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {team.category ? (
                          <div className="space-y-1">
                            <Badge variant="secondary" className="text-xs">
                              {team.category.name}
                            </Badge>
                            {team.category.code && (
                              <p className="text-xs text-gray-500 font-mono">
                                {team.category.code}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Aucune catégorie</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-600 max-w-xs truncate" title={team.description}>
                          {team.description || "Aucune description"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-800" />
                          <span className="font-medium">{team.numberOfPlayers || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <DollarSign className={`h-4 w-4 ${budgetExceeded ? 'text-red-600' : 'text-green-800'}`} />
                            <div className="text-sm">
                              <p className="font-medium">
                                {new Intl.NumberFormat('fr-FR', {
                                  style: 'currency',
                                  currency: 'MAD',
                                  minimumFractionDigits: 0
                                }).format(Number(team.budget))}
                              </p>
                              <p className={`text-xs ${budgetExceeded ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                Dépensé: {new Intl.NumberFormat('fr-FR', {
                                  style: 'currency',
                                  currency: 'MAD',
                                  minimumFractionDigits: 0
                                }).format(Number(team.currentSpending || 0))} ({budgetPercentage.toFixed(0)}%)
                              </p>
                            </div>
                          </div>
                          {/* Mini Progress Bar */}
                          <div className="w-32 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full ${
                                budgetExceeded ? 'bg-red-500' : 
                                budgetPercentage >= warningThreshold ? 'bg-orange-500' : 
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                            />
                          </div>
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
                  )})
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
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'équipe &quot;{teamToDelete?.name}&quot; ? Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
