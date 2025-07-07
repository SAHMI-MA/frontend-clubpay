"use client";

import { useEffect, useState } from "react";
import { PlayerList } from "./team-management/player-list";
import { PlayerForm } from "./team-management/player-form";
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getPositionDisplayName } from "@/lib/utils";

export function PlayerManagement() {
  const dispatch = useAppDispatch();
  const { players, loading, error } = useAppSelector((state) => state.players);
  const { teams } = useAppSelector((state) => state.teams);
  const [activeTab, setActiveTab] = useState("list");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPosition, setFilterPosition] = useState<string>("all")
  const [filterTeam, setFilterTeam] = useState<string>("all")

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
            toast.error("Not authenticated. Please log in.");
            return;
          }
        }

        // Test API connection
        const connectionStatus = await testApiConnection();
        setApiConnectionStatus(connectionStatus);
        console.log('API connection status:', connectionStatus);
        
        if (!connectionStatus.isServerReachable) {
          toast.error(`Cannot connect to API server: ${connectionStatus.error}`);
          if (process.env.NODE_ENV === 'development') {
            toast.info("Using demo data for development", { duration: 5000 });
          }
        } else if (!connectionStatus.isAuthenticated) {
          toast.error("Authentication failed. Please log in again.");
          
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
        toast.error('Failed to initialize application. Please try again.');
      }
    };
    
    initializeData();
  }, [dispatch]);

  // Handle API errors
  useEffect(() => {
    const handleError = async () => {
      if (error) {
        toast.error(`Error loading players: ${error}`);
        
        // Check if error might be auth-related
        if (error.toString().toLowerCase().includes('auth') || 
            error.toString().includes('401') || 
            error.toString().includes('403')) {
          console.log('Authentication-related error detected. Running diagnostics...');
          await debugAuth();
        }
        
        if (process.env.NODE_ENV === 'development') {
          toast.info("Running in development mode. You can continue with limited functionality.");
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
        toast.success("Successfully connected to API server!");
        // Refresh data
        dispatch(fetchAllPlayers());
        dispatch(fetchAllTeams());
      } else {
        let errorMessage = "Failed to connect to API server.";
        if (connectionStatus.isServerReachable && !connectionStatus.isAuthenticated) {
          errorMessage = "Connected to server but authentication failed. Please log in again.";
        }
        toast.error(errorMessage);
      }
    } catch (err) {
      toast.error("Failed to test API connection");
      console.error(err);
    }
  };
  // Filter players based on search query, position, and team
  const filteredPlayers = players.filter(player => {
    const matchesSearch = searchQuery.toLowerCase() === "" ||
      player.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.team?.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesPosition = filterPosition === "all" || player.position === filterPosition
    const matchesTeam = filterTeam === "all" || 
      (player.teamId && player.teamId.toString() === filterTeam) ||
      (player.team && player.team.id && player.team.id.toString() === filterTeam)

    return matchesSearch && matchesPosition && matchesTeam
  })

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
    toast.success("Player created successfully")
  }

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false)
    dispatch(fetchAllPlayers())
    toast.success("Player updated successfully")
  }

  const handleViewPlayerDetails = (player: Player) => {
    setSelectedPlayer(player)
    setActiveTab("details")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Player Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Register and manage players across your organization</p>
        </div>
        <div className="flex gap-2">
          {!apiConnectionStatus.isServerReachable && (
            <Button 
              variant="outline" 
              className="flex items-center gap-1 text-amber-600 border-amber-600" 
              onClick={handleRetryConnection}
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">API Disconnected</span>
              <RefreshCw className="h-4 w-4 ml-1" />
            </Button>
          )}
          <Button 
            className="bg-blue-800 hover:bg-blue-900 text-white" 
            onClick={handleCreatePlayer}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Register Player
          </Button>
        </div>
      </div>

      {/* Create Player Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Player</DialogTitle>
            <DialogDescription>Add a new player to your organization</DialogDescription>
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
            <DialogTitle>Edit Player</DialogTitle>
            <DialogDescription>Update player information</DialogDescription>
          </DialogHeader>
          <PlayerForm 
            player={selectedPlayer}
            isEditing={true}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search players or teams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterPosition} onValueChange={setFilterPosition}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by position" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Positions</SelectItem>
            {Array.from(new Set(players.map(p => p.position))).filter(Boolean).map(position => (
              <SelectItem key={position} value={position}>{getPositionDisplayName(position)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterTeam} onValueChange={setFilterTeam}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams.filter(team => team && team.id && team.name).map(team => (
              <SelectItem key={team.id} value={team.id.toString()}>{team.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
          onAddNew={handleCreatePlayer}
          isSimplified={false}
        />
      )}
      
      {/* Player Details Dialog */}
      {selectedPlayer && activeTab === "details" && (
        <Dialog open={true} onOpenChange={(open) => !open && setActiveTab("list")}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Player Details</DialogTitle>
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
