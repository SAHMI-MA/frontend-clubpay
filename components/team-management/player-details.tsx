"use client";

import { useState, useEffect } from "react";
import { Player} from "@/lib/types/team-management";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchPlayerById } from "@/lib/redux/playerSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPositionDisplayName } from "@/lib/utils";
import { PlayerAvatar } from "./player-avatar";
import { apiConfig } from "@/lib/api-config";
import {
  User,
  MapPin,
  Medal,
  Edit,
  FileSignature,
  Calendar,
  DollarSign,
  Download,
  FileText
} from "lucide-react";

interface PlayerDetailsProps {
  player: Player;
  onEditPlayer: (player: Player) => void;
}

export function PlayerDetails({ player, onEditPlayer }: PlayerDetailsProps) {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState("info");
  const { teams } = useAppSelector(state => state.teams);

  // Fetch detailed player data when viewing
  useEffect(() => {
    dispatch(fetchPlayerById(player.id));
  }, [player.id, dispatch]);

  // Get team name from player object or ID
  const getTeamName = (player: Player) => {
    // If player has a team object directly, use that
    if (player.team && player.team.name) {
      return player.team.name;
    }
    
    // Otherwise fall back to finding by teamId
    const teamId = player.teamId;
    if (!teamId || !teams) return "Aucune équipe";
    
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : "Équipe inconnue";
  };

  // Format date for display in French
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "MAD",
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="max-h-[70vh] overflow-y-auto">
      {/* Compact Player Header */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-800 to-blue-600 rounded-t-lg text-white mb-4">
        <PlayerAvatar player={player} size="md" className="border-2 border-white" />
        <div className="flex-1">
          <h2 className="text-lg font-bold">
            {player.firstName} {player.lastName}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge className="bg-white/20 hover:bg-white/30 text-white text-xs">
              {getPositionDisplayName(player.position)}
            </Badge>
            <Badge 
              className={
                player.playerStatus === 'ACTIVE' ? 'bg-green-500/20 hover:bg-green-500/30 text-green-100' :
                player.playerStatus === 'INJURED' ? 'bg-red-500/20 hover:bg-red-500/30 text-red-100' :
                player.playerStatus === 'SUSPENDED' ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-100' :
                'bg-gray-500/20 hover:bg-gray-500/30 text-gray-100'
              }
            >
              {player.playerStatus === 'ACTIVE' ? 'Actif' :
               player.playerStatus === 'INJURED' ? 'Blessé' :
               player.playerStatus === 'SUSPENDED' ? 'Suspendu' :
               player.playerStatus === 'RETIRED' ? 'Retraité' : 'Actif'}
            </Badge>
          </div>
        </div>
        <Button
          onClick={() => onEditPlayer(player)}
          className="bg-white/20 hover:bg-white/30 text-white"
          size="sm"
        >
          <Edit className="h-4 w-4 mr-1" />
          Modifier
        </Button>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info" className="flex items-center gap-1">
            <User className="h-4 w-4" />
            Informations
          </TabsTrigger>
          <TabsTrigger value="contract" className="flex items-center gap-1" disabled={!player.contract}>
            <FileSignature className="h-4 w-4" />
            Contrat
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-1">
            <Medal className="h-4 w-4" />
            Statistiques
          </TabsTrigger>
        </TabsList>

        {/* Information Tab */}
        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Âge</p>
                    <p>{calculateAge(player.dateOfBirth)} ans</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Né le</p>
                    <p>{formatDate(player.dateOfBirth)}</p>
                  </div>
                  {player.playerNumber && (
                    <>
                      <div>
                        <p className="font-medium text-muted-foreground">N° Maillot</p>
                        <p>#{player.playerNumber}</p>
                      </div>
                      <div></div>
                    </>
                  )}
                  {player.rib && (
                    <>
                      <div className="col-span-2">
                        <p className="font-medium text-muted-foreground">RIB</p>
                        <p className="font-mono text-xs">{player.rib}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Team Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Informations sportives
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Équipe</p>
                    <p>{getTeamName(player)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Poste</p>
                    <p>{getPositionDisplayName(player.position)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Statut</p>
                    <p>
                      {player.playerStatus === 'ACTIVE' ? 'Actif' :
                       player.playerStatus === 'INJURED' ? 'Blessé' :
                       player.playerStatus === 'SUSPENDED' ? 'Suspendu' :
                       player.playerStatus === 'RETIRED' ? 'Retraité' : 'Actif'}
                    </p>
                  </div>
                  {player.createdAt && (
                    <div>
                      <p className="font-medium text-muted-foreground">Enregistré le</p>
                      <p>{formatDate(player.createdAt)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contract Tab */}
        <TabsContent value="contract" className="space-y-4">
          {player.contract ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileSignature className="h-4 w-4" />
                  Détails du contrat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Titre du contrat</p>
                    <p>{(player.contract as any).title || 'Contrat joueur'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Salaire mensuel</p>
                    <p className="font-semibold text-green-600">{formatCurrency(Number(player.contract.salary))}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Date de début</p>
                    <p className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(player.contract.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Date de fin</p>
                    <p className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(player.contract.endDate)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Statut</p>
                    <Badge variant={(player.contract as any).status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {(player.contract as any).status === 'ACTIVE' ? 'Actif' : (player.contract as any).status || 'Actif'}
                    </Badge>
                  </div>
                  {(player.contract as any).terminationDate && (
                    <div>
                      <p className="font-medium text-muted-foreground">Date de résiliation</p>
                      <p className="flex items-center gap-1 text-red-600">
                        <Calendar className="h-3 w-3" />
                        {formatDate((player.contract as any).terminationDate)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Contract File */}
                {(player.contract as any).contractFile && (
                  <div className="border-t pt-4">
                    <p className="font-medium text-muted-foreground mb-2">Fichier du contrat</p>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">{(player.contract as any).contractFile.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {((player.contract as any).contractFile.fileSize / 1024).toFixed(1)} KB • 
                            {(player.contract as any).contractFile.fileType}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <a 
                          href={`${apiConfig.baseUrl}${(player.contract as any).contractFile.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Télécharger
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="text-center p-8">
              <FileSignature className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-semibold mb-1">Aucun contrat trouvé</h3>
              <p className="text-muted-foreground">Ce joueur n'a pas de contrat actif.</p>
            </div>
          )}
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Medal className="h-4 w-4" />
                Statistiques du joueur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {player.matchParticipations?.length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Matchs joués</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {player.objectiveProgress?.filter(p => p.completedAt)?.length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Objectifs réalisés</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {player.objectiveProgress?.length || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Objectifs assignés</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {player.playerNumber || '--'}
                  </p>
                  <p className="text-xs text-muted-foreground">Numéro de maillot</p>
                </div>
              </div>
              
              {/* Additional Statistics */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground mb-2">Performance</p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Taux de réussite objectifs</span>
                      <span className="font-medium">
                        {player.objectiveProgress && player.objectiveProgress.length > 0 
                          ? Math.round(((player.objectiveProgress?.filter(p => p.completedAt)?.length || 0) / player.objectiveProgress.length) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Statut actuel</span>
                      <span className="font-medium">
                        {player.playerStatus === 'ACTIVE' ? 'Actif' :
                         player.playerStatus === 'INJURED' ? 'Blessé' :
                         player.playerStatus === 'SUSPENDED' ? 'Suspendu' :
                         player.playerStatus === 'RETIRED' ? 'Retraité' : 'Actif'}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground mb-2">Informations contractuelles</p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Contrat actif</span>
                      <span className="font-medium">{player.contract ? 'Oui' : 'Non'}</span>
                    </div>
                    {player.contract && (
                      <div className="flex justify-between">
                        <span>Salaire annuel</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(Number(player.contract.salary) * 12)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
