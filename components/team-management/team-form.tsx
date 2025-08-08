"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { createTeam, updateTeam } from "@/lib/redux/teamSlice";
import { fetchCategories } from "@/lib/redux/categorySlice";
import { Team, CreateTeamDto, UpdateTeamDto } from "@/lib/types/team-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertCircle, Loader2, Trash2, Upload, X } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { imageService } from "@/lib/team-management-services";

interface TeamFormProps {
  team?: Team | null;
  isCreating?: boolean;
  isEditing?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  onDelete?: (team: Team) => void; // Add delete handler
}

export function TeamForm({
  team,
  isCreating = false,
  isEditing = false,
  onSuccess,
  onCancel,
  onDelete,
}: TeamFormProps) {
  const dispatch = useAppDispatch();
  const { categories, loading: categoriesLoading } = useAppSelector((state) => state.categories);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<CreateTeamDto | UpdateTeamDto>({
    name: "",
    code: "",
    budget: 0,
    description: "",
    categoryId: undefined,
    clubImageId: undefined,
  });

  // Fetch categories on component mount
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Prefill form if team is provided (edit mode)
  useEffect(() => {
    if (team && isEditing) {
      console.log("Editing team:", team);
      
      setFormData({
        name: team.name,
        code: team.code || "",
        budget: team.budget,
        description: team.description || "",
        categoryId: team.categoryId,
        clubImageId: team.clubImageId,
      });
    }
  }, [team, isEditing]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "budget" ? Number(value) : value,
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryId: value ? Number(value) : undefined,
    }));
  };

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner un fichier image valide');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 5MB');
        return;
      }

      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({
      ...prev,
      clubImageId: undefined,
    }));
  };

  // Upload image to server
  const uploadImage = async (file: File): Promise<number | undefined> => {
    try {
      setIsUploadingImage(true);
      const response = await imageService.uploadImage(file);
      return response.id;
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Échec du téléchargement de l\'image');
      return undefined;
    } finally {
      setIsUploadingImage(false);
    }
  };
  
  // Handle team deletion with confirmation
  const handleDelete = () => {
    if (!team) return;
    
    // Show confirmation dialog
    const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir supprimer l'équipe "${team.name}"? Cette action est irréversible.`);
    
    if (confirmDelete && onDelete) {
      onDelete(team);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const errors: string[] = [];
    
    if (!formData.name || !formData.name.trim()) {
      errors.push("Nom de l'équipe est obligatoire");
    }

    if (!formData.code || !formData.code.trim()) {
      errors.push("Code de l'équipe est obligatoire");
    }
    
    if (!formData.budget || formData.budget <= 0) {
      errors.push("Budget doit être supérieur à zéro");
    }

    if (!formData.description || !formData.description.trim()) {
      errors.push("Description est obligatoire");
    }
    
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Upload image first if there's a new image file
      let clubImageId = formData.clubImageId;
      if (imageFile) {
        clubImageId = await uploadImage(imageFile);
        if (!clubImageId) {
          throw new Error('Image upload failed');
        }
      }

      // Prepare data to submit
      const dataToSubmit = {
        ...formData,
        clubImageId,
      };

      if (isCreating) {
        await dispatch(createTeam(dataToSubmit as CreateTeamDto)).unwrap();
        toast.success("Équipe créée avec succès");
      } else if (isEditing && team) {
        await dispatch(
          updateTeam({ id: team.id, teamData: dataToSubmit as UpdateTeamDto })
        ).unwrap();
        toast.success("Équipe mise à jour avec succès");
      }
      onSuccess?.();
    } catch (error) {
      toast.error(
        typeof error === "string" 
          ? error 
          : "Échec de la sauvegarde de l'équipe. Veuillez réessayer."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // State to track if form validation has been attempted
  const [validationAttempted, setValidationAttempted] = useState(false);

  // Updated handleSubmit to track validation attempts
  const handleSubmitWithValidation = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationAttempted(true);
    
    // Validate required fields
    const errors: string[] = [];
    
    if (!formData.name || !formData.name.trim()) {
      errors.push("Nom de l'équipe est obligatoire");
    }
    
    if (!formData.code || !formData.code.trim()) {
      errors.push("Code de l'équipe est obligatoire");
    }
    
    if (!formData.budget || formData.budget <= 0) {
      errors.push("Budget doit être supérieur à zéro");
    }

    if (!formData.categoryId) {
      errors.push("Catégorie est obligatoire");
    }

    if (!formData.description || !formData.description.trim()) {
      errors.push("Description est obligatoire");
    }
    
    if (errors.length > 0) {
      return; // Stop submission if we have errors
    }
    
    // Continue with original submit handler if no errors
    handleSubmit(e);
  };
  
  return (
    <form onSubmit={handleSubmitWithValidation} className="space-y-6 py-4">
      {validationAttempted && (!formData.name?.trim() || !formData.code?.trim() ||
                              !formData.budget || formData.budget <= 0 || 
                              !formData.categoryId ||
                              !formData.description?.trim()) && (
        <Alert className="mb-4" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tous les champs sont obligatoires
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-1">
          Nom de l'équipe <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Entrez le nom de l'équipe"
          value={String(formData.name || "")}
          onChange={handleChange}
          required
          className={validationAttempted && !formData.name?.trim() ? "border-red-500" : ""}
        />
        {validationAttempted && !formData.name?.trim() && (
          <p className="text-sm text-red-500 mt-1">Ce champ est obligatoire</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="code" className="flex items-center gap-1">
          Code de l'équipe <span className="text-red-500">*</span>
        </Label>
        <Input
          id="code"
          name="code"
          placeholder="Entrez le code de l'équipe (ex: FT001)"
          value={String(formData.code || "")}
          onChange={handleChange}
          required
          className={validationAttempted && !formData.code?.trim() ? "border-red-500" : ""}
        />
        {validationAttempted && !formData.code?.trim() && (
          <p className="text-sm text-red-500 mt-1">Ce champ est obligatoire</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget" className="flex items-center gap-1">
          Budget (MAD) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="budget"
          name="budget"
          type="number"
          placeholder="Entrez le budget"
          value={Number(formData.budget || 0)}
          onChange={handleChange}
          min={0}
          required
          className={validationAttempted && (!formData.budget || formData.budget <= 0) ? "border-red-500" : ""}
        />
        {validationAttempted && (!formData.budget || formData.budget <= 0) && (
          <p className="text-sm text-red-500 mt-1">Le budget doit être supérieur à zéro</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category" className="flex items-center gap-1">
          Catégorie <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.categoryId ? String(formData.categoryId) : ""}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className={validationAttempted && !formData.categoryId ? "border-red-500" : ""}>
            <SelectValue placeholder="Sélectionnez une catégorie" />
          </SelectTrigger>
          <SelectContent>
            {categoriesLoading ? (
              <SelectItem value="loading" disabled>
                Chargement des catégories...
              </SelectItem>
            ) : categories.length === 0 ? (
              <SelectItem value="empty" disabled>
                Aucune catégorie disponible
              </SelectItem>
            ) : (
              categories.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {validationAttempted && !formData.categoryId && (
          <p className="text-sm text-red-500 mt-1">Veuillez sélectionner une catégorie</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="flex items-center gap-1">
          Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Entrez la description de l'équipe"
          value={String(formData.description || "")}
          onChange={handleChange}
          rows={3}
          required
          className={validationAttempted && !formData.description?.trim() ? "border-red-500" : ""}
        />
        {validationAttempted && !formData.description?.trim() && (
          <p className="text-sm text-red-500 mt-1">Ce champ est obligatoire</p>
        )}
      </div>

      {/* Team Image Upload */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1">
          Logo de l'équipe
        </Label>
        <div className="flex items-center gap-4">
          {/* Current or preview image */}
          <div className="flex-shrink-0">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-16 w-16 rounded-lg object-cover border-2 border-gray-200"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={handleRemoveImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : team?.clubImage?.url ? (
              <div className="relative">
                <img
                  src={team.clubImage.url}
                  alt={`${team.name} logo`}
                  className="h-16 w-16 rounded-lg object-cover border-2 border-gray-200"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={handleRemoveImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="h-16 w-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                <Upload className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Upload button */}
          <div className="flex-1">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
              disabled={isUploadingImage}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('image-upload')?.click()}
              disabled={isUploadingImage}
              className="w-full"
            >
              {isUploadingImage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Téléchargement...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {imagePreview || team?.clubImage ? 'Changer l\'image' : 'Télécharger une image'}
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              Formats acceptés: JPG, PNG, GIF, WebP (max 5MB)
            </p>
          </div>
        </div>
      </div>
          
      <DialogFooter className="pt-4">
        <div className="flex w-full justify-between items-center">
          {/* Delete button - only show for existing teams */}
          {isEditing && team && onDelete && (
            <Button 
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer l'équipe
            </Button>
          )}
          
          <div className="flex gap-2">
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
                isCreating ? "Créer l'équipe" : "Mettre à jour l'équipe"
              )}
            </Button>
          </div>
        </div>
      </DialogFooter>
    </form>
  );
}
