"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { createPlayer, updatePlayer } from "@/lib/redux/playerSlice";
import { fetchAllTeams } from "@/lib/redux/teamSlice";
import { Player, CreatePlayerDto, UpdatePlayerDto } from "@/lib/types/team-management";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, User, WifiOff } from "lucide-react";
import { testApiConnection, loginWithDemoCredentials } from "@/lib/api-utils";

interface PlayerFormProps {
  player?: Player | null;
  preselectedTeamId?: number | null;
  isCreating?: boolean;
  isEditing?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PlayerForm({
  player,
  preselectedTeamId,
  isCreating = false,
  isEditing = false,
  onSuccess,
  onCancel,
}: PlayerFormProps) {
  const dispatch = useAppDispatch();
  const { teams } = useAppSelector((state) => state.teams);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    isServerReachable: true,
    isAuthenticated: true,
    loading: true
  });
  // isConnected is not used, so we'll just comment it out
  // const isConnected = connectionStatus.isServerReachable;
  
  // Form state
  const [formData, setFormData] = useState<CreatePlayerDto | UpdatePlayerDto>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    position: "",
    teamId: undefined,
    playerImage: "",
  });

  // Check API connection when component mounts
  useEffect(() => {
    const checkConnection = async () => {
      setConnectionStatus(prev => ({ ...prev, loading: true }));
      try {
        const status = await testApiConnection();
        setConnectionStatus({
          isServerReachable: status.isServerReachable,
          isAuthenticated: status.isAuthenticated,
          loading: false
        });
        
        // If server is not reachable or not authenticated in development, set up demo login
        if (process.env.NODE_ENV === 'development' && 
            (!status.isServerReachable || !status.isAuthenticated)) {
          toast.warning('Using demo authentication for development');
          await loginWithDemoCredentials();
        }
      } catch (_error) {
        setConnectionStatus({
          isServerReachable: false,
          isAuthenticated: false,
          loading: false
        });
        toast.error('Failed to connect to the server ' + _error);
      }
    };
    
    checkConnection();
  }, []);

  // Load teams for the select dropdown
  useEffect(() => {
    dispatch(fetchAllTeams());
  }, [dispatch]);

  // Prefill form if player is provided (edit mode) or preselected team
  useEffect(() => {
    if (player && isEditing) {
      setFormData({
        firstName: player.firstName,
        lastName: player.lastName,
        dateOfBirth: player.dateOfBirth.split("T")[0], // Format date for input field
        position: player.position,
        teamId: player.teamId,
        playerImage: player.playerImage || "",
      });
    } else if (preselectedTeamId) {
      setFormData(prev => ({
        ...prev,
        teamId: preselectedTeamId
      }));
    }
  }, [player, isEditing, preselectedTeamId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "teamId" ? Number(value) : value,
    }));
  };

  const handlePositionChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      position: value,
    }));
  };

  const handleTeamChange = (value: string) => {
    const teamIdValue = value === "none" ? null : Number(value);
    
    setFormData((prev) => ({
      ...prev,
      teamId: teamIdValue,
    }));
    
    // Log the selection to help with debugging
    console.log('Team selected:', value, 'Converted to:', teamIdValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Verify connection status before submitting
    if (!connectionStatus.isServerReachable) {
      toast.error("Cannot submit form: Server not reachable");
      setIsSubmitting(false);
      return;
    }

    if (!connectionStatus.isAuthenticated) {
      toast.error("Cannot submit form: Not authenticated");
      setIsSubmitting(false);
      return;
    }

    try {
      if (isCreating) {
        // Log form data before dispatching to check teamId
        console.log('Creating player with data:', formData);
        
        // Make sure teamId is properly converted to number if it exists
        const playerData = {
          ...formData,
          teamId: formData.teamId !== undefined && formData.teamId !== null ? Number(formData.teamId) : null,
        };
        
        console.log('Final player data being sent:', playerData);
        await dispatch(createPlayer(playerData as CreatePlayerDto)).unwrap();
        toast.success("Player created successfully");
      } else if (isEditing && player) {
        // Make sure teamId is properly converted to number if it exists
        const playerData = {
          ...formData,
          teamId: formData.teamId !== undefined && formData.teamId !== null ? Number(formData.teamId) : null,
        };
        
        await dispatch(
          updatePlayer({ id: player.id, playerData: playerData as UpdatePlayerDto })
        ).unwrap();
        toast.success("Player updated successfully");
      }
      onSuccess?.();
    } catch (error) {
      // Check if error is auth-related
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('401') || errorMsg.toLowerCase().includes('unauthorized')) {
        setConnectionStatus(prev => ({ ...prev, isAuthenticated: false }));
        toast.error("Authentication failed. Please log in again.");
      } else {
        toast.error(
          typeof error === "string" 
            ? error 
            : "Failed to save player. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const positions = [
    "Goalkeeper",
    "Defender",
    "Midfielder",
    "Forward",
    "Coach",
    "Assistant",
    "Physiotherapist",
    "Manager"
  ];

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="border-b pb-4">
        <div className="flex items-center gap-2">
          <User className="h-6 w-6 text-blue-800" />
          <CardTitle>
            {isCreating ? "Register New Player" : "Edit Player"}
          </CardTitle>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <Select
                value={formData.position}
                onValueChange={handlePositionChange}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((pos) => (
                    <SelectItem key={pos} value={pos}>
                      {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="teamId">Team</Label>
            <Select
              value={formData.teamId?.toString() || "none"}
              onValueChange={handleTeamChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Team</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="playerImage">Player Image URL</Label>
            <Input
              id="playerImage"
              name="playerImage"
              placeholder="Enter player image URL"
              value={formData.playerImage}
              onChange={handleChange}
            />
            {formData.playerImage && (
              <div className="mt-2">
                <img 
                  src={formData.playerImage} 
                  alt="Player preview" 
                  className="h-20 w-20 object-cover rounded-full border p-1"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/placeholder-player.png";
                  }}
                />
              </div>
            )}
          </div>

          {connectionStatus.loading ? (
            <div className="flex items-center p-4 text-sm text-blue-700 bg-blue-50 rounded-lg" role="alert">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              <span>Checking connection status...</span>
            </div>
          ) : !connectionStatus.isServerReachable ? (
            <div className="flex items-center p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
              <WifiOff className="h-5 w-5 mr-2" />
              <span>Server not reachable. Some features may not work properly.</span>
            </div>
          ) : !connectionStatus.isAuthenticated ? (
            <div className="flex items-center p-4 text-sm text-amber-700 bg-amber-50 rounded-lg" role="alert">
              <WifiOff className="h-5 w-5 mr-2" />
              <span>Not authenticated. Please log in again to access all features.</span>
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-blue-800 hover:bg-blue-900 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              isCreating ? "Register Player" : "Update Player"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
