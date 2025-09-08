"use client"

import { useState } from "react"
import type { Player } from "@/lib/types/team-management"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Eye, Search, Users, Trash2 } from "lucide-react"
import { getPositionDisplayName } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAppDispatch } from "@/lib/redux/hooks";
import { deletePlayer, fetchAllPlayers } from "@/lib/redux/playerSlice"
import { toast } from "sonner";

interface PlayerListProps {
  players: (Player & { displayNumber?: number })[]
  teams: any[]
  onViewDetails: (player: Player) => void
  onEditPlayer: (player: Player) => void
  onDeletePlayer?: (player: Player) => void
  isSimplified?: boolean
  showNumbering?: boolean
}

export function PlayerList({
  players,
  teams,
  onViewDetails,
  onEditPlayer,
  isSimplified = false,
  showNumbering = false,
}: PlayerListProps) {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeam, setSelectedTeam] = useState("all")
  const [selectedPosition, setSelectedPosition] = useState("all")
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Filter players based on search and filters
  const filteredPlayers = players.filter((player) => {
    const fullName = `${player.firstName} ${player.lastName}`.toLowerCase()
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      player.playerNumber?.toString().includes(searchTerm) ||
      player.playerCode?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTeam = selectedTeam === "all" || (player.team && player.team.id.toString() === selectedTeam)
    const matchesPosition = selectedPosition === "all" || player.position === selectedPosition

    return matchesSearch && matchesTeam && matchesPosition
  })

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "INJURED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "SUSPENDED":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "RETIRED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Actif"
      case "INJURED":
        return "Blessé"
      case "SUSPENDED":
        return "Suspendu"
      case "RETIRED":
        return "Retraité"
      default:
        return "Actif"
    }
  }

  const positions = ["GOALKEEPER", "DEFENDER", "MIDFIELDER", "FORWARD"]

  const handleDeleteClick = (player: Player) => {
    setPlayerToDelete(player);
    setIsDeleteDialogOpen(true);
  };

    const confirmDelete = async () => {
    if (!playerToDelete) return;
    try {
      await dispatch(deletePlayer(playerToDelete.id)).unwrap();
      toast.success("Joueur supprimé avec succès");
      // Refresh the list
      dispatch(fetchAllPlayers());
    } catch (_error) {
      toast.error("Échec de la suppression du joueur " + _error);
    } finally {
      setIsDeleteDialogOpen(false);
      setPlayerToDelete(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Liste des joueurs
        </CardTitle>
        <CardDescription>
          {filteredPlayers.length} joueur{filteredPlayers.length !== 1 ? "s" : ""} trouvé
          {filteredPlayers.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isSimplified && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, numéro ou code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrer par équipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les équipes</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrer par poste" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les postes</SelectItem>
                {positions.map((position) => (
                  <SelectItem key={position} value={position}>
                    {getPositionDisplayName(position)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {showNumbering && <TableHead className="w-12">#</TableHead>}
                <TableHead>ID</TableHead>
                <TableHead>Joueur</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead>Équipe</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>N° Maillot</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showNumbering ? 7 : 6} className="text-center py-4">
                    Aucun joueur trouvé correspondant aux critères
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlayers.map((player) => (
                  <TableRow key={player.id}>
                    {showNumbering && (
                      <TableCell className="font-medium text-gray-500">{player.displayNumber || player.id}</TableCell>
                    )}
                    <TableCell className="font-mono text-sm">{player.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {player.playerImage?.url ? (
                            <AvatarImage
                              src={player.playerImage.url || "/placeholder.svg"}
                              alt={`${player.firstName} ${player.lastName}`}
                            />
                          ) : null}
                          <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            {getInitials(player.firstName, player.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {player.firstName} {player.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {calculateAge(player.dateOfBirth)} ans
                            {player.playerCode && ` • ${player.playerCode}`}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getPositionDisplayName(player.position)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{player.team ? player.team.name : "Aucune équipe assignée"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(player.playerStatus || "ACTIVE")}>
                        {getStatusText(player.playerStatus || "ACTIVE")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{player.playerNumber ? `#${player.playerNumber}` : "—"}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => onViewDetails(player)} className="h-8 w-8 p-0">
                          <span className="sr-only">Voir les détails</span>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => onEditPlayer(player)} className="h-8 w-8 p-0">
                          <span className="sr-only">Modifier</span>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(player)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression du joueur</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer {playerToDelete?.firstName} {playerToDelete?.lastName} ?
              Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
