"use client"

import { useState, useEffect, useRef } from "react"
import type { Player } from "@/lib/types/team-management"
import { useReactToPrint } from "react-to-print"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { fetchPlayerById } from "@/lib/redux/playerSlice"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPositionDisplayName } from "@/lib/utils"
import { PlayerAvatar } from "./player-avatar"
import { apiConfig } from "@/lib/api-config"
import { User, MapPin, Medal, Edit, FileSignature, Calendar, Download, FileText, Printer, FileDown } from "lucide-react"
import { calculateAge } from "@/lib/utils/date-utils"
import { generatePlayerProfilePDF } from "@/lib/jsPDF/PlayerProfilePDF"

interface PlayerDetailsProps {
  player: Player
  onEditPlayer: (player: Player) => void
}

export function PlayerDetails({ player: initialPlayer, onEditPlayer }: PlayerDetailsProps) {
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState("info")
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const { teams } = useAppSelector((state) => state.teams)
  const { selectedPlayer } = useAppSelector((state) => state.players)
  
  // Use the selected player from Redux if available, otherwise use the initial player
  const player = selectedPlayer || initialPlayer

  // Fetch detailed player data when viewing
  useEffect(() => {
    dispatch(fetchPlayerById(initialPlayer.id))
  }, [initialPlayer.id, dispatch])

  // Debug logging to check if data is loaded
  useEffect(() => {
    if (player) {
      console.log('Player data for details:', {
        id: player.id,
        name: `${player.firstName} ${player.lastName}`,
        matchParticipations: player.matchParticipations?.length || 0,
        objectiveProgress: player.objectiveProgress?.length || 0,
        completedObjectives: player.objectiveProgress?.filter(p => p.completedAt)?.length || 0
      })
    }
  }, [player])

  // Enhanced PDF generation with better formatting
  const generatePDF = async () => {
    if (!printRef.current) return
    setIsGeneratingPDF(true)
    try {
      await generatePlayerProfilePDF({
        player,
        teamName: getTeamName(player),
        position: getPositionDisplayName(player.position),
      })
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error)
      alert("Erreur lors de la génération du PDF. Veuillez réessayer.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Print handler for browser printing
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
      @page {
        size: A4;
        margin: 15mm;
      }
      @media print {
        body {
          padding: 0;
          margin: 0;
          font-family: Arial, sans-serif;
        }
        .no-print {
          display: none !important;
        }
        .print-header {
          background: #1e40af !important;
          color: white !important;
          padding: 20px;
          margin-bottom: 20px;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
        .print-section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        .print-section h3 {
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
      }
    `,
    documentTitle: `Fiche_Joueur_${player.firstName}_${player.lastName}`,
  })

  // Get team name from player object or ID
  const getTeamName = (player: Player) => {
    if (player.team && player.team.name) {
      return player.team.name
    }

    const teamId = player.teamId
    if (!teamId || !teams) return "Aucune équipe"

    const team = teams.find((t) => t.id === teamId)
    return team ? team.name : "Équipe inconnue"
  }

  // Format date for display in French
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Calculate age from date of birth


  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "MAD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="max-h-[70vh] overflow-y-auto">
      {/* Print Actions */}
      <div className="flex justify-end gap-2 mb-4 no-print">
        <Button onClick={handlePrint} variant="outline" className="gap-2 bg-transparent">
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
        <Button onClick={generatePDF} disabled={isGeneratingPDF} className="gap-2">
          {isGeneratingPDF ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Génération...
            </>
          ) : (
            <>
              <FileDown className="h-4 w-4" />
              Exporter PDF
            </>
          )}
        </Button>
      </div>

      {/* Printable Content */}
      <div ref={printRef}>
        {/* Print Header (only visible when printing) */}
        <div className="print-header hidden print:block">
          <h1 className="text-2xl font-bold">FICHE JOUEUR</h1>
          <p>Généré le {new Date().toLocaleDateString("fr-FR")}</p>
        </div>

        {/* Compact Player Header */}
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-800 to-blue-600 rounded-t-lg text-white mb-4 print-header">
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
                  player.playerStatus === "ACTIVE"
                    ? "bg-green-500/20 hover:bg-green-500/30 text-green-100"
                    : player.playerStatus === "INJURED"
                      ? "bg-red-500/20 hover:bg-red-500/30 text-red-100"
                      : player.playerStatus === "SUSPENDED"
                        ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-100"
                        : "bg-gray-500/20 hover:bg-gray-500/30 text-gray-100"
                }
              >
                {player.playerStatus === "ACTIVE"
                  ? "Actif"
                  : player.playerStatus === "INJURED"
                    ? "Blessé"
                    : player.playerStatus === "SUSPENDED"
                      ? "Suspendu"
                      : player.playerStatus === "RETIRED"
                        ? "Retraité"
                        : "Actif"}
              </Badge>
            </div>
          </div>
          <Button
            onClick={() => onEditPlayer(player)}
            className="bg-white/20 hover:bg-white/30 text-white no-print"
            size="sm"
          >
            <Edit className="h-4 w-4 mr-1" />
            Modifier
          </Button>
        </div>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 no-print">
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
          <TabsContent value="info" className="space-y-4 print-section">
            <div className="print:block hidden">
              <h3>Informations Personnelles</h3>
            </div>
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

                    {player.cin && (
                      <div className="col-span-2">
                        <p className="font-medium text-muted-foreground">CIN</p>
                        <p className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{player.cin}</p>
                      </div>
                    )}

                    {player.nationality && (
                      <div className="col-span-2">
                        <p className="font-medium text-muted-foreground">Nationalité</p>
                        <p>{player.nationality}</p>
                      </div>
                    )}

                    {player.playerNumber && (
                      <>
                        <div>
                          <p className="font-medium text-muted-foreground">N° Maillot</p>
                          <p>#{player.playerNumber}</p>
                        </div>
                        <div></div>
                      </>
                    )}
                    {player.playerCode && (
                      <>
                        <div>
                          <p className="font-medium text-muted-foreground">Code Joueur</p>
                          <p className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{player.playerCode}</p>
                        </div>
                        <div></div>
                      </>
                    )}

                    <div>
                      <p className="font-medium text-muted-foreground">Prime de Signature</p>
                      {player.contract?.signatureBonus ? (
                        <p className="font-semibold text-green-600">{formatCurrency(player.contract.signatureBonus)}</p>
                      ) : (
                        <p className="text-gray-400 text-xs">Aucune prime</p>
                      )}
                    </div>
                    <div></div>
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
                        {player.playerStatus === "ACTIVE"
                          ? "Actif"
                          : player.playerStatus === "INJURED"
                            ? "Blessé"
                            : player.playerStatus === "SUSPENDED"
                              ? "Suspendu"
                              : player.playerStatus === "RETIRED"
                                ? "Retraité"
                                : "Actif"}
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
          <TabsContent value="contract" className="space-y-4 print-section">
            <div className="print:block hidden">
              <h3>Informations Contractuelles</h3>
            </div>
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
                      <p>{(player.contract as any).title || "Contrat joueur"}</p>
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
                      <p className="font-medium text-muted-foreground">Prime de signature</p>
                      {(player.contract as any).signatureBonus ? (
                        <p className="font-semibold text-blue-600">{formatCurrency((player.contract as any).signatureBonus)}</p>
                      ) : (
                        <p className="text-gray-400 text-xs">Aucune prime</p>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Bonus de performance</p>
                      <Badge variant={(player.contract as any).hasBonus ? "default" : "secondary"}>
                        {(player.contract as any).hasBonus ? "Inclus" : "Non inclus"}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Statut</p>
                      <Badge variant={(player.contract as any).status === "ACTIVE" ? "default" : "secondary"}>
                        {(player.contract as any).status === "ACTIVE"
                          ? "Actif"
                          : (player.contract as any).status || "Actif"}
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
                        <Button size="sm" variant="outline" asChild className="no-print bg-transparent">
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
          <TabsContent value="stats" className="space-y-4 print-section">
            <div className="print:block hidden">
              <h3>Statistiques du Joueur</h3>
            </div>
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
                    <p className="text-2xl font-bold text-blue-600">{player.matchParticipations?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Matchs joués</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {player.objectiveProgress?.filter((p) => p.completedAt)?.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Objectifs réalisés</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{player.objectiveProgress?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Objectifs assignés</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{player.playerNumber || "--"}</p>
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
                            ? Math.round(
                                ((player.objectiveProgress?.filter((p) => p.completedAt)?.length || 0) /
                                  player.objectiveProgress.length) *
                                  100,
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Statut actuel</span>
                        <span className="font-medium">
                          {player.playerStatus === "ACTIVE"
                            ? "Actif"
                            : player.playerStatus === "INJURED"
                              ? "Blessé"
                              : player.playerStatus === "SUSPENDED"
                                ? "Suspendu"
                                : player.playerStatus === "RETIRED"
                                  ? "Retraité"
                                  : "Actif"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground mb-2">Informations contractuelles</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Contrat actif</span>
                        <span className="font-medium">{player.contract ? "Oui" : "Non"}</span>
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
    </div>
  )
}
