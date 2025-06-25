"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerList } from "./team-management/player-list";
import { PlayerForm } from "./team-management/player-form";
import { PlayerDetails } from "@/components/team-management/player-details";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchAllPlayers } from "@/lib/redux/playerSlice";
import { fetchAllTeams } from "@/lib/redux/teamSlice";
import { Player } from "@/lib/types/team-management";
import { toast } from "sonner";
import {
  UserCircle,
  BarChart3,
  User,
  Loader2,
  UserPlus,
  UserCog,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/auth-service";
import { loginWithDemoCredentials, testApiConnection } from "@/lib/api-utils";
import { debugAuth } from "@/lib/auth-debug";
import { debugPlayersTeamStructure } from "@/lib/team-data-debug";

export function PlayerManagement() {
  const dispatch = useAppDispatch();
  const { players, loading, error } = useAppSelector((state) => state.players);
  const { teams } = useAppSelector((state) => state.teams);
  const [activeTab, setActiveTab] = useState("list");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  const handleCreatePlayer = () => {
    setIsCreating(true);
    setSelectedPlayer(null);
    setIsEditing(false);
    setActiveTab("form");
  };

  const handleEditPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setIsEditing(true);
    setIsCreating(false);
    setActiveTab("form");
  };

  const handleViewPlayerDetails = (player: Player) => {
    setSelectedPlayer(player);
    setActiveTab("details");
  };

  const handleFormCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    setActiveTab("list");
  };

  const handleFormSuccess = () => {
    setIsCreating(false);
    setIsEditing(false);
    setActiveTab("list");
    
    // Refresh players and debug team structure after form submission
    dispatch(fetchAllPlayers())
      .unwrap()
      .then((players) => {
        console.log("Players refreshed after form submission");
        debugPlayersTeamStructure(players);
      });
  };

  // Calculate player statistics for dashboard
  const positionBreakdown = players.reduce((acc, player) => {
    const position = player.position;
    acc[position] = (acc[position] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const teamBreakdown = players.reduce((acc, player) => {
    const teamId = player.teamId;
    if (teamId) {
      acc[teamId] = (acc[teamId] || 0) + 1;
    } else {
      acc['unassigned'] = (acc['unassigned'] || 0) + 1;
    }
    return acc;
  }, {} as Record<string | 'unassigned', number>);

  const getTeamName = (teamId: number | string) => {
    if (teamId === 'unassigned') return 'Unassigned';
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown';
  };

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            Player Roster
          </TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedPlayer && !isCreating} className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            {selectedPlayer ? `${selectedPlayer.firstName} ${selectedPlayer.lastName}` : "Player Details"}
          </TabsTrigger>
        </TabsList>

        {/* Players List Tab */}
        <TabsContent value="list">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
            </div>
          ) : (
            <PlayerList 
              players={players}
              teams={teams}
              onViewDetails={handleViewPlayerDetails}
              onEditPlayer={handleEditPlayer}
              onAddNew={handleCreatePlayer}
              isSimplified={false}
            />
          )}
        </TabsContent>

        {/* Player Details Tab */}
        <TabsContent value="details">
          {selectedPlayer && (
            <PlayerDetails 
              player={selectedPlayer}
              onEditPlayer={handleEditPlayer}
            />
          )}
        </TabsContent>

        {/* Player Form Tab */}
        <TabsContent value="form">
          <PlayerForm 
            player={isEditing ? selectedPlayer : null}
            isCreating={isCreating}
            isEditing={isEditing}
            onCancel={handleFormCancel}
            onSuccess={handleFormSuccess}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
