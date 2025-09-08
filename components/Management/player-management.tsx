"use client"

import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { fetchAllPlayers } from "@/lib/redux/playerSlice"
import { fetchAllTeams } from "@/lib/redux/teamSlice"
import type { Player } from "@/lib/types/team-management"
import { toast } from "sonner"
import {
  Loader2,
  UserPlus,
  AlertTriangle,
  RefreshCw,
  Users,
  Calendar,
  MapPin,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authService } from "@/lib/auth-service"
import { loginWithDemoCredentials, testApiConnection } from "@/lib/api-utils"
import { debugAuth } from "@/lib/auth-debug"
import { debugPlayersTeamStructure } from "@/lib/team-data-debug"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PlayerForm } from "../team-management/player-form"
import { PlayerList } from "../team-management/player-list"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlayerDetails } from "../team-management/player-details"

/**
 * Export a list of players to CSV
 * @param players Array of Player objects
 */
export function exportPlayersToCSV(players: Player[]) {
  const header = [
    "ID",
    "First Name",
    "Last Name",
    "Position",
    "Player Number",
    "Date of Birth",
    "Team",
    "Status",
    "RIB",
  ]
  const rows = players.map((player) => [
    player.id,
    player.firstName,
    player.lastName,
    player.position,
    player.playerNumber || "",
    player.dateOfBirth,
    player.team?.name || "",
    player.playerStatus || "",
    player.rib || "",
  ])
  const csvContent = [header, ...rows]
    .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
    .join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", "players.csv")
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function PlayerManagement() {
  const dispatch = useAppDispatch()
  const { players, loading, error } = useAppSelector((state) => state.players)
  const { teams } = useAppSelector((state) => state.teams)
  const [activeTab, setActiveTab] = useState("list")
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [playersPerPage, setPlayersPerPage] = useState(10)

  const [apiConnectionStatus, setApiConnectionStatus] = useState<{
    isServerReachable: boolean
    isAuthenticated: boolean
    error?: string
  }>({
    isServerReachable: true,
    isAuthenticated: true,
  })

  // Test API connection and fetch players and teams on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log("Initializing player management...")
        // Debug current auth status
        debugAuth()
        // Run auth diagnostics to help debug issues
        console.log("Running authentication diagnostics...")
        await debugAuth()

        // Check for existing auth token
        const token = authService.getToken()

        if (!token) {
          // If no token exists, use demo credentials in development environment
          console.log("No auth token found")
          if (process.env.NODE_ENV === "development") {
            console.log("Using demo credentials for development.")
            await loginWithDemoCredentials()
            // Run diagnostics again to confirm token was set
            await debugAuth()
          } else {
            toast.error("Non authentifié. Veuillez vous connecter.")
            return
          }
        }

        // Test API connection
        const connectionStatus = await testApiConnection()
        setApiConnectionStatus(connectionStatus)
        console.log("API connection status:", connectionStatus)

        if (!connectionStatus.isServerReachable) {
          toast.error(`Impossible de se connecter au serveur API : ${connectionStatus.error}`)
          if (process.env.NODE_ENV === "development") {
            toast.info("Utilisation de données de démonstration pour le développement", { duration: 5000 })
          }
        } else if (!connectionStatus.isAuthenticated) {
          toast.error("L'authentification a échoué. Veuillez vous reconnecter.")

          // Check if token exists but is invalid
          const token = authService.getToken()
          if (token) {
            console.warn("Token exists but authentication failed. Token might be invalid.")
          }

          if (process.env.NODE_ENV === "development") {
            // In development, we can use demo credentials
            console.log("Setting up demo credentials after failed auth...")
            await loginWithDemoCredentials()
            await debugAuth() // Check if token was set properly
          }
        }

        // Proceed with data fetching regardless, as the API service will handle errors
        const playersPromise = dispatch(fetchAllPlayers()).unwrap()
        dispatch(fetchAllTeams())

        // Debug team structure after players are fetched
        playersPromise.then((players) => {
          console.log("Initial players fetched")
          debugPlayersTeamStructure(players)
        })
      } catch (err) {
        console.error("Error initializing player management:", err)
        toast.error("Échec de l'initialisation de l'application. Veuillez réessayer.")
      }
    }

    initializeData()
  }, [dispatch])

  // Handle API errors
  useEffect(() => {
    const handleError = async () => {
      if (error) {
        toast.error(`Erreur lors du chargement des joueurs : ${error}`)

        // Check if error might be auth-related
        if (
          error.toString().toLowerCase().includes("auth") ||
          error.toString().includes("401") ||
          error.toString().includes("403")
        ) {
          console.log("Authentication-related error detected. Running diagnostics...")
          await debugAuth()
        }

        if (process.env.NODE_ENV === "development") {
          toast.info("Exécution en mode développement. Vous pouvez continuer avec des fonctionnalités limitées.")
        }
      }
    }

    handleError()
  }, [error])

  // Function to retry API connection
  const handleRetryConnection = async () => {
    toast.info("Retrying API connection...")

    try {
      // Run auth diagnostics first
      await debugAuth()

      // If in development and not authenticated, set up demo credentials
      if (process.env.NODE_ENV === "development" && !authService.getToken()) {
        console.log("Setting up demo credentials for retry...")
        await loginWithDemoCredentials()
        await debugAuth() // Check if token was set properly
      }

      // Test API connection again
      const connectionStatus = await testApiConnection()
      setApiConnectionStatus(connectionStatus)

      if (connectionStatus.isServerReachable && connectionStatus.isAuthenticated) {
        toast.success("Connexion au serveur API réussie !")
        // Refresh data
        dispatch(fetchAllPlayers())
        dispatch(fetchAllTeams())
      } else {
        let errorMessage = "Échec de la connexion au serveur API."
        if (connectionStatus.isServerReachable && !connectionStatus.isAuthenticated) {
          errorMessage = "Connecté au serveur mais l'authentification a échoué. Veuillez vous reconnecter."
        }
        toast.error(errorMessage)
      }
    } catch (err) {
      toast.error("Échec de la connexion au serveur API")
      console.error(err)
    }
  }

  // Calculate statistics
  const calculatePlayerStats = () => {
    if (!players.length) {
      return {
        totalPlayers: 0,
        averageAge: 0,
        regionStats: {},
        ageGroups: {
          youth: 0, // Under 18
          adult: 0, // 18-30
          veteran: 0, // Over 30
        },
      }
    }

    const currentYear = new Date().getFullYear()
    let totalAge = 0
    const regionStats: Record<string, number> = {}
    const ageGroups = { youth: 0, adult: 0, veteran: 0 }

    players.forEach((player) => {
      // Calculate age
      const birthYear = new Date(player.dateOfBirth).getFullYear()
      const age = currentYear - birthYear
      totalAge += age

      // Age groups
      if (age < 18) {
        ageGroups.youth++
      } else if (age <= 30) {
        ageGroups.adult++
      } else {
        ageGroups.veteran++
      }

      // Region stats (using nationality as region)
      const region = player.nationality || "Non spécifié"
      regionStats[region] = (regionStats[region] || 0) + 1
    })

    return {
      totalPlayers: players.length,
      averageAge: Math.round(totalAge / players.length),
      regionStats,
      ageGroups,
    }
  }

  const stats = calculatePlayerStats()

  // Filter players based on search query, position, and team
  const filteredPlayers = players

  // Pagination logic
  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage)
  const startIndex = (currentPage - 1) * playersPerPage
  const endIndex = startIndex + playersPerPage
  const currentPlayers = filteredPlayers.slice(startIndex, endIndex)

  // Add numbering to players (global numbering, not per page)
  const numberedPlayers = currentPlayers.map((player, index) => ({
    ...player,
    displayNumber: startIndex + index + 1,
  }))

  const handleCreatePlayer = () => {
    setIsCreateDialogOpen(true)
  }

  const handleEditPlayer = (player: Player) => {
    setSelectedPlayer(player)
    setIsEditDialogOpen(true)
  }

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false)
    dispatch(fetchAllPlayers())
    toast.success("Joueur créé avec succès")
  }

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false)
    dispatch(fetchAllPlayers())
    toast.success("Joueur mis à jour avec succès")
  }

  const handleViewPlayerDetails = (player: Player) => {
    setSelectedPlayer(player)
    setActiveTab("details")
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePlayersPerPageChange = (value: string) => {
    setPlayersPerPage(Number(value))
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  return (
    <div className="space-y-6">
      {/* Export Players CSV Button */}
      <div className="flex justify-end">
        <Button
          className="bg-blue-800 hover:bg-blue-900 text-white mb-2"
          onClick={() => exportPlayersToCSV(filteredPlayers)}
        >
          Exporter les joueurs (CSV)
        </Button>
      </div>
      {/* Statistics Report */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Joueurs</CardTitle>
            <Users className="h-4 w-4 text-blue-800" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPlayers}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Joueurs enregistrés</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Âge Moyen</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageAge} ans</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Moyenne d'âge</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Régions</CardTitle>
            <MapPin className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Object.keys(stats.regionStats).length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Nationalités différentes</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Répartition</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Jeunes (&lt;18):</span>
                <span className="font-medium">{stats.ageGroups.youth}</span>
              </div>
              <div className="flex justify-between">
                <span>Adultes (18-30):</span>
                <span className="font-medium">{stats.ageGroups.adult}</span>
              </div>
              <div className="flex justify-between">
                <span>Vétérans (&gt;30):</span>
                <span className="font-medium">{stats.ageGroups.veteran}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regional Statistics */}
      {Object.keys(stats.regionStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Répartition par Nationalité</CardTitle>
            <CardDescription>Distribution des joueurs par région/nationalité</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(stats.regionStats)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([region, count]) => (
                  <div key={region} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium truncate">{region}</span>
                    <span className="text-sm font-bold text-blue-600 ml-2">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des joueurs</h1>
          <p className="text-gray-600 dark:text-gray-400">Enregistrez et gérez les joueurs de votre organisation</p>
        </div>
        <div className="flex gap-2">
          {!apiConnectionStatus.isServerReachable && (
            <Button
              variant="outline"
              className="flex items-center gap-1 text-amber-600 border-amber-600 bg-transparent"
              onClick={handleRetryConnection}
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">API déconnectée</span>
              <RefreshCw className="h-4 w-4 ml-1" />
            </Button>
          )}
          <Button className="bg-blue-800 hover:bg-blue-900 text-white" onClick={handleCreatePlayer}>
            <UserPlus className="h-4 w-4 mr-2" />
            Enregistrer un joueur
          </Button>
        </div>
      </div>

      {/* Create Player Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Créer un nouveau joueur</DialogTitle>
            <DialogDescription>Ajoutez un nouveau joueur à votre organisation</DialogDescription>
          </DialogHeader>
          <PlayerForm isCreating={true} onSuccess={handleCreateSuccess} onCancel={() => setIsCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Player Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modifier le joueur</DialogTitle>
            <DialogDescription>Mettre à jour les informations du joueur</DialogDescription>
          </DialogHeader>
          <PlayerForm
            player={selectedPlayer}
            isEditing={true}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Afficher</span>
          <Select value={playersPerPage.toString()} onValueChange={handlePlayersPerPageChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-600 dark:text-gray-400">joueurs par page</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {startIndex + 1}-{Math.min(endIndex, filteredPlayers.length)} sur {filteredPlayers.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-3 py-1 bg-blue-100 text-blue-800 rounded">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Player List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
        </div>
      ) : (
        <PlayerList
          players={numberedPlayers}
          teams={teams}
          onViewDetails={handleViewPlayerDetails}
          onEditPlayer={handleEditPlayer}
          isSimplified={false}
          showNumbering={true}
        />
      )}

      {/* Player Details Dialog */}
      {selectedPlayer && activeTab === "details" && (
        <Dialog open={true} onOpenChange={(open) => !open && setActiveTab("list")}>
          <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Détails du joueur</DialogTitle>
              <DialogDescription>{`${selectedPlayer.firstName} ${selectedPlayer.lastName}`}</DialogDescription>
            </DialogHeader>
            <PlayerDetails player={selectedPlayer} onEditPlayer={handleEditPlayer} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
