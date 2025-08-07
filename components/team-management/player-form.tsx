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
import { Combobox } from "@/components/ui/combobox";
import { toast } from "sonner";
import { Loader2, User, WifiOff, Upload } from "lucide-react";
import { testApiConnection, loginWithDemoCredentials } from "@/lib/api-utils";
import { getTacticalFieldPositions, getPositionDisplayName } from "@/lib/utils";
import { imageService } from "@/lib/team-management-services";
import { PlayerAvatar } from "./player-avatar";

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
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
    playerNumber: undefined,
    rib: "",
    playerStatus: "ACTIVE",
    teamId: undefined,
    ImageId: null,
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
          toast.warning('Utilisation de l\'authentification démo pour le développement');
          await loginWithDemoCredentials();
        }
      } catch (_error) {
        setConnectionStatus({
          isServerReachable: false,
          isAuthenticated: false,
          loading: false
        });
        toast.error('Échec de la connexion au serveur ' + _error);
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
        playerNumber: player.playerNumber,
        rib: player.rib || "",
        playerStatus: player.playerStatus || "ACTIVE",
        teamId: player.teamId,
        ImageId: player.playerImageId,
      });
      
      // Set image preview if player has an image
      if (player.playerImage?.url) {
        setImagePreview(player.playerImage.url);
      }
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
      [name]: name === "teamId" ? Number(value) : 
              name === "playerNumber" ? (value ? Number(value) : undefined) : 
              value,
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const uploadedImage = await imageService.uploadImage(file);
      setFormData(prev => ({
        ...prev,
        ImageId: uploadedImage.id
      }));
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      toast.success("Image téléchargée avec succès");
    } catch (error) {
      toast.error("Échec du téléchargement de l'image");
      console.error('Image upload error:', error);
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      ImageId: null
    }));
    setImagePreview(null);
    
    // Clear the file input
    const fileInput = document.getElementById('playerImage') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Verify connection status before submitting
    if (!connectionStatus.isServerReachable) {
      toast.error("Impossible de soumettre le formulaire : Serveur non accessible");
      setIsSubmitting(false);
      return;
    }

    if (!connectionStatus.isAuthenticated) {
      toast.error("Impossible de soumettre le formulaire : Non authentifié");
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
        toast.success("Joueur créé avec succès");
      } else if (isEditing && player) {
        // Make sure teamId is properly converted to number if it exists
        const playerData = {
          ...formData,
          teamId: formData.teamId !== undefined && formData.teamId !== null ? Number(formData.teamId) : null,
        };
        
        await dispatch(
          updatePlayer({ id: player.id, playerData: playerData as UpdatePlayerDto })
        ).unwrap();
        toast.success("Joueur mis à jour avec succès");
      }
      onSuccess?.();
    } catch (error) {
      // Check if error is auth-related
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('401') || errorMsg.toLowerCase().includes('unauthorized')) {
        setConnectionStatus(prev => ({ ...prev, isAuthenticated: false }));
        toast.error("Échec de l'authentification. Veuillez vous reconnecter.");
      } else {
        toast.error(
          typeof error === "string" 
            ? error 
            : "Échec de l'enregistrement du joueur. Veuillez réessayer."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get tactical field positions only (no staff roles for players)
  const tacticalPositions = getTacticalFieldPositions();
  
  // Prepare options for the combobox - only field positions for players
  const positionOptions = tacticalPositions.map(position => ({
    value: position,
    label: getPositionDisplayName(position)
  }));

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="border-b pb-4">
        <div className="flex items-center gap-2">
          <User className="h-6 w-6 text-blue-800" />
          <CardTitle>
            {isCreating ? "Enregistrer un nouveau joueur" : "Modifier le joueur"}
          </CardTitle>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Entrez le prénom"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nom de famille *</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Entrez le nom de famille"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date de naissance *</Label>
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
              <Label htmlFor="position">Poste *</Label>
              <Combobox
                options={positionOptions}
                value={formData.position}
                onValueChange={handlePositionChange}
                placeholder="Sélectionner un poste..."
                searchPlaceholder="Rechercher des postes tactiques..."
                emptyText="Aucun poste trouvé."
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="playerNumber">Numéro de maillot</Label>
              <Input
                id="playerNumber"
                name="playerNumber"
                type="number"
                min="1"
                max="99"
                placeholder="Numéro de maillot (1-99)"
                value={formData.playerNumber || ""}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rib">RIB (Compte bancaire)</Label>
              <Input
                id="rib"
                name="rib"
                placeholder="Informations de compte bancaire"
                value={formData.rib || ""}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="playerStatus">Statut du joueur</Label>
              <Select
                value={formData.playerStatus || "ACTIVE"}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  playerStatus: value as 'ACTIVE' | 'INJURED' | 'SUSPENDED' | 'RETIRED'
                }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner le statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Actif</SelectItem>
                  <SelectItem value="INJURED">Blessé</SelectItem>
                  <SelectItem value="SUSPENDED">Suspendu</SelectItem>
                  <SelectItem value="RETIRED">Retraité</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamId">Équipe</Label>
              <Select
                value={formData.teamId?.toString() || "none"}
                onValueChange={handleTeamChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner une équipe" />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune équipe</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-4">
            <Label htmlFor="playerImage">Image du joueur</Label>
            
            {/* Current/Preview Image */}
            {(imagePreview || player?.playerImage) && (
              <div className="flex items-center space-x-4">
                <PlayerAvatar 
                  player={{
                    id: player?.id || 0,
                    firstName: formData.firstName || 'Joueur',
                    lastName: formData.lastName || '',
                    dateOfBirth: formData.dateOfBirth || new Date().toISOString(),
                    position: formData.position || 'MIDFIELDER',
                    playerNumber: formData.playerNumber,
                    teamId: formData.teamId,
                    playerStatus: formData.playerStatus || 'ACTIVE',
                    playerImageId: formData.ImageId || undefined,
                    playerImage: imagePreview 
                      ? { id: 0, url: imagePreview, filename: 'preview' } 
                      : player?.playerImage
                  }}
                  size="lg"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeImage}
                  className="text-red-600 hover:text-red-700"
                >
                  Supprimer l'image
                </Button>
              </div>
            )}
            
            {/* Upload Button */}
            <div>
              <input
                type="file"
                id="playerImage"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={imageUploading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('playerImage')?.click()}
                disabled={imageUploading}
                className="w-full"
              >
                {imageUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Téléchargement...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {imagePreview || player?.playerImage ? 'Changer l\'image' : 'Télécharger une image'}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* TODO: Add player image upload functionality */}

          {connectionStatus.loading ? (
            <div className="flex items-center p-4 text-sm text-blue-700 bg-blue-50 rounded-lg" role="alert">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              <span>Vérification de l'état de la connexion...</span>
            </div>
          ) : !connectionStatus.isServerReachable ? (
            <div className="flex items-center p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
              <WifiOff className="h-5 w-5 mr-2" />
              <span>Serveur non accessible. Certaines fonctionnalités pourraient ne pas fonctionner correctement.</span>
            </div>
          ) : !connectionStatus.isAuthenticated ? (
            <div className="flex items-center p-4 text-sm text-amber-700 bg-amber-50 rounded-lg" role="alert">
              <WifiOff className="h-5 w-5 mr-2" />
              <span>Non authentifié. Veuillez vous reconnecter pour accéder à toutes les fonctionnalités.</span>
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            className="bg-blue-800 hover:bg-blue-900 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Enregistrement...
              </>
            ) : (
              isCreating ? "Enregistrer le joueur" : "Mettre à jour le joueur"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
