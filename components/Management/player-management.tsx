"use client";

import { useEffect, useState } from "react";
import { PlayerDetails } from "@/components/team-management/player-details";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchAllPlayers } from "@/lib/redux/playerSlice";
import { fetchAllTeams } from "@/lib/redux/teamSlice";
import { Player } from "@/lib/types/team-management";
import { toast } from "sonner";
import {
  Loader2,
  UserPlus,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/auth-service";
import { loginWithDemoCredentials, testApiConnection } from "@/lib/api-utils";
import { debugAuth } from "@/lib/auth-debug";
import { debugPlayersTeamStructure } from "@/lib/team-data-debug";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PlayerForm } from "../team-management/player-form";
import { PlayerList } from "../team-management/player-list";

export function PlayerManagement() {
  const dispatch = useAppDispatch();
  const { players, loading, error } = useAppSelector((state) => state.players);
  const { teams } = useAppSelector((state) => state.teams);
  const [activeTab, setActiveTab] = useState("list");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const [apiConnectionStatus, setApiConnectionStatus] = useState<{ 
    isServerReachable: boolean;
    isAuthenticated: boolean;
    error?: string;
  }>({ 
    isServerReachable: true, 
    isAuthenticated: true 
  });

  // Test API connection and fetch players and teams on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log("Initializing player management...");
        // Debug current auth status
        debugAuth();
        // Run auth diagnostics to help debug issues
        console.log('Running authentication diagnostics...');
        await debugAuth();
        
        // Check for existing auth token
        const token = authService.getToken();
        
        if (!token) {
          // If no token exists, use demo credentials in development environment
          console.log('No auth token found');
          if (process.env.NODE_ENV === 'development') {
            console.log('Using demo credentials for development.');
            await loginWithDemoCredentials();
            // Run diagnostics again to confirm token was set
            await debugAuth();
          } else {
            toast.error("Non authentifié. Veuillez vous connecter.");
            return;
          }
        }

        // Test API connection
        const connectionStatus = await testApiConnection();
        setApiConnectionStatus(connectionStatus);
        console.log('API connection status:', connectionStatus);
        
        if (!connectionStatus.isServerReachable) {
          toast.error(`Impossible de se connecter au serveur API : ${connectionStatus.error}`);
          if (process.env.NODE_ENV === 'development') {
            toast.info("Utilisation de données de démonstration pour le développement", { duration: 5000 });
          }
        } else if (!connectionStatus.isAuthenticated) {
          toast.error("L'authentification a échoué. Veuillez vous reconnecter.");
          
          // Check if token exists but is invalid
          const token = authService.getToken();
          if (token) {
            console.warn('Token exists but authentication failed. Token might be invalid.');
          }
          
          if (process.env.NODE_ENV === 'development') {
            // In development, we can use demo credentials
            console.log('Setting up demo credentials after failed auth...');
            await loginWithDemoCredentials();
            await debugAuth(); // Check if token was set properly
          }
        }
        
        // Proceed with data fetching regardless, as the API service will handle errors
        const playersPromise = dispatch(fetchAllPlayers()).unwrap();
        dispatch(fetchAllTeams());
        
        // Debug team structure after players are fetched
        playersPromise.then(players => {
          console.log("Initial players fetched");
          debugPlayersTeamStructure(players);
        });
      } catch (err) {
        console.error('Error initializing player management:', err);
        toast.error('Échec de l\'initialisation de l\'application. Veuillez réessayer.');
      }
    };
    
    initializeData();
  }, [dispatch]);

  // Handle API errors
  useEffect(() => {
    const handleError = async () => {
      if (error) {
        toast.error(`Erreur lors du chargement des joueurs : ${error}`);
        
        // Check if error might be auth-related
        if (error.toString().toLowerCase().includes('auth') || 
            error.toString().includes('401') || 
            error.toString().includes('403')) {
          console.log('Authentication-related error detected. Running diagnostics...');
          await debugAuth();
        }
        
        if (process.env.NODE_ENV === 'development') {
          toast.info("Exécution en mode développement. Vous pouvez continuer avec des fonctionnalités limitées.");
        }
      }
    };
    
    handleError();
  }, [error]);

  // Function to retry API connection
  const handleRetryConnection = async () => {
    toast.info("Retrying API connection...");
    
    try {
      // Run auth diagnostics first
      await debugAuth();
      
      // If in development and not authenticated, set up demo credentials
      if (process.env.NODE_ENV === 'development' && !authService.getToken()) {
        console.log('Setting up demo credentials for retry...');
        await loginWithDemoCredentials();
        await debugAuth(); // Check if token was set properly
      }
      
      // Test API connection again
      const connectionStatus = await testApiConnection();
      setApiConnectionStatus(connectionStatus);
      
      if (connectionStatus.isServerReachable && connectionStatus.isAuthenticated) {
        toast.success("Connexion au serveur API réussie !");
        // Refresh data
        dispatch(fetchAllPlayers());
        dispatch(fetchAllTeams());
      } else {
        let errorMessage = "Échec de la connexion au serveur API.";
        if (connectionStatus.isServerReachable && !connectionStatus.isAuthenticated) {
          errorMessage = "Connecté au serveur mais l'authentification a échoué. Veuillez vous reconnecter.";
        }
        toast.error(errorMessage);
      }
    } catch (err) {
      toast.error("Échec de la connexion au serveur API");
      console.error(err);
    }
  };
  // Filter players based on search query, position, and team
  const filteredPlayers = players

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des joueurs</h1>
          <p className="text-gray-600 dark:text-gray-400">Enregistrez et gérez les joueurs de votre organisation</p>
        </div>
        <div className="flex gap-2">
          {!apiConnectionStatus.isServerReachable && (
            <Button 
              variant="outline" 
              className="flex items-center gap-1 text-amber-600 border-amber-600" 
              onClick={handleRetryConnection}
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">API déconnectée</span>
              <RefreshCw className="h-4 w-4 ml-1" />
            </Button>
          )}
          <Button 
            className="bg-blue-800 hover:bg-blue-900 text-white" 
            onClick={handleCreatePlayer}
          >
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
          <PlayerForm 
            isCreating={true}
            onSuccess={handleCreateSuccess}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
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

      {/* Player List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
        </div>
      ) : (
        <PlayerList 
          players={filteredPlayers}
          teams={teams}
          onViewDetails={handleViewPlayerDetails}
          onEditPlayer={handleEditPlayer}
          isSimplified={false}
        />
      )}
      
      {/* Player Details Dialog */}
      {selectedPlayer && activeTab === "details" && (
        <Dialog open={true} onOpenChange={(open) => !open && setActiveTab("list")}>
          <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Détails du joueur</DialogTitle>
              <DialogDescription>
                {`${selectedPlayer.firstName} ${selectedPlayer.lastName}`}
              </DialogDescription>
            </DialogHeader>
            <PlayerDetails 
              player={selectedPlayer}
              onEditPlayer={handleEditPlayer}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
