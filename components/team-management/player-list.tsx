"use client";

import { useState} from "react";
import { Player, Team } from "@/lib/types/team-management";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Search, Trash2, Eye, User, UserCircle } from "lucide-react";
import { useAppDispatch } from "@/lib/redux/hooks";
import { deletePlayer, fetchAllPlayers } from "@/lib/redux/playerSlice";
import { toast } from "sonner";
import { getPositionDisplayName } from "@/lib/utils";
import { PlayerAvatar } from "./player-avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PlayerListProps {
  players: Player[];
  teams?: Team[];
  teamId?: number; // If provided, will only show players from this team
  onViewDetails?: (player: Player) => void;
  onEditPlayer?: (player: Player) => void;
  onAddNew?: () => void;
  isSimplified?: boolean; // For dashboard view
  isReadOnly?: boolean; // For view-only mode, no edit/delete
}

export function PlayerList({ 
  players, 
  teams, 
  teamId,
  onViewDetails, 
  onEditPlayer,
  onAddNew,
  isSimplified = false,
  isReadOnly = false
}: PlayerListProps) {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);

  // Get unique positions for filter
  const positions = Array.from(new Set(players.filter(p => p.position).map(p => p.position)))

  // Filter players based on search term and position
  const filteredPlayers = players.filter(player => {
    const matchesSearch = !searchTerm || 
      player.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.team?.name || "").toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPosition = positionFilter === "all" || player.position === positionFilter
    const matchesTeam = !teamId || player.teamId === teamId

    return matchesSearch && matchesPosition && matchesTeam
  })

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

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Find team name by ID or from player's team object
  const getTeamName = (player: Player): string => {
    // If player has a team object directly, use that
    if (player.team && player.team.name) {
      return player.team.name;
    }
    
    // Otherwise fall back to finding by teamId
    const teamId = player.teamId;
    if (teamId === undefined || teamId === null || !teams) return "Aucune équipe";
    
    const team = teams.find((t) => t.id === teamId);
    return team ? team.name : "Équipe inconnue";
  };

  return (
    <>
      <Card className={isSimplified ? "shadow-none border-0" : "shadow-md"}>
        {!isSimplified && (
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-blue-800" />
              Liste des joueurs
            </CardTitle>
            {!isReadOnly && onAddNew && (
              <Button 
                onClick={onAddNew} 
                className="bg-blue-800 hover:bg-blue-900 text-white"
                size="sm"
              >
                Enregistrer un nouveau joueur
              </Button>
            )}
          </CardHeader>
        )}
        <CardContent>
          {!isSimplified && (
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher des joueurs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrer par poste" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les postes</SelectItem>
                  {positions.map(position => (
                    <SelectItem key={position} value={position}>{getPositionDisplayName(position)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {filteredPlayers.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>N°</TableHead>
                    {!isSimplified && <TableHead>Âge</TableHead>}
                    <TableHead>Poste</TableHead>
                    <TableHead>Statut</TableHead>
                    {!teamId && <TableHead>Équipe</TableHead>}
                    {!isSimplified && !isReadOnly && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium flex items-center gap-3">
                        <PlayerAvatar player={player} size="sm" />
                        <span>
                          {player.firstName} {player.lastName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {player.playerNumber || '--'}
                        </Badge>
                      </TableCell>
                      {!isSimplified && (
                        <TableCell>
                          {calculateAge(player.dateOfBirth)}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant="outline">{getPositionDisplayName(player.position)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            player.playerStatus === 'ACTIVE' ? 'default' :
                            player.playerStatus === 'INJURED' ? 'destructive' :
                            player.playerStatus === 'SUSPENDED' ? 'secondary' :
                            'outline'
                          }
                        >
                          {player.playerStatus === 'ACTIVE' ? 'Actif' :
                           player.playerStatus === 'INJURED' ? 'Blessé' :
                           player.playerStatus === 'SUSPENDED' ? 'Suspendu' :
                           player.playerStatus === 'RETIRED' ? 'Retraité' : 'Actif'}
                        </Badge>
                      </TableCell>
                      {!teamId && (
                        <TableCell>
                          {getTeamName(player)}
                        </TableCell>
                      )}
                      {!isSimplified && !isReadOnly && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {onViewDetails && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onViewDetails(player)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {onEditPlayer && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEditPlayer(player)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
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
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center border rounded-md">
              <User className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-muted-foreground">Aucun joueur trouvé</p>
              {!isReadOnly && onAddNew && (
                <Button
                  variant="link"
                  onClick={onAddNew}
                  className="mt-2"
                >
                  Enregistrer un nouveau joueur
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
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
    </>
  );
}
