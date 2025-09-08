"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { 
  fetchCategories, 
  createCategoryAsync, 
  updateCategoryAsync, 
  deleteCategoryAsync 
} from "@/lib/redux/categorySlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CategoryFormData {
  name: string;
  code: string;
  description: string;
}

export function CategoryManagement() {
  const dispatch = useAppDispatch();
  const { categories, loading, error } = useAppSelector((state) => state.categories);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    code: "",
    description: "",
  });

  // Fetch categories on component mount
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
    });
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Le nom de la catégorie est obligatoire");
      return;
    }

    if (!formData.code.trim()) {
      toast.error("Le code de la catégorie est obligatoire");
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(createCategoryAsync({
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description.trim() || undefined,
      })).unwrap();
      
      toast.success("Catégorie créée avec succès");
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(
        typeof error === "string" 
          ? error 
          : "Échec de la création de la catégorie"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      code: category.code || "",
      description: category.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !editingCategory) {
      toast.error("Le nom de la catégorie est obligatoire");
      return;
    }

    if (!formData.code.trim()) {
      toast.error("Le code de la catégorie est obligatoire");
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(updateCategoryAsync({
        id: editingCategory.id,
        categoryData: {
          name: formData.name.trim(),
          code: formData.code.trim(),
          description: formData.description.trim() || undefined,
        },
      })).unwrap();
      
      toast.success("Catégorie mise à jour avec succès");
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      resetForm();
    } catch (error) {
      toast.error(
        typeof error === "string" 
          ? error 
          : "Échec de la mise à jour de la catégorie"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (category: any) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await dispatch(deleteCategoryAsync(categoryToDelete.id)).unwrap();
      toast.success("Catégorie supprimée avec succès");
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      toast.error(
        typeof error === "string" 
          ? error 
          : "Échec de la suppression de la catégorie"
      );
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingCategory(null);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestion des catégories
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gérez les catégories d&apos;équipes de votre club
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-blue-800 hover:bg-blue-900 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle catégorie
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-800" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Chargement des catégories...
          </span>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date de création</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    Aucune catégorie trouvée. Créez votre première catégorie.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category, index) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="font-mono text-sm">{category.code}</TableCell>
                    <TableCell>{category.description || "-"}</TableCell>
                    <TableCell>
                      {new Date(category.createdAt).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCategory(category)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Category Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une nouvelle catégorie</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle catégorie pour organiser vos équipes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCategory}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">
                  Nom de la catégorie <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="create-name"
                  name="name"
                  placeholder="Ex: Seniors, Juniors, Féminines..."
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-code">
                  Code de la catégorie <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="create-code"
                  name="code"
                  placeholder="Ex: SENIOR, JUNIOR, FEMININ..."
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-description">Description</Label>
                <Textarea
                  id="create-description"
                  name="description"
                  placeholder="Description de la catégorie (optionnel)"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseCreateDialog}
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
                    Création...
                  </>
                ) : (
                  "Créer la catégorie"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la catégorie.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCategory}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">
                  Nom de la catégorie <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  placeholder="Ex: Seniors, Juniors, Féminines..."
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-code">
                  Code de la catégorie <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-code"
                  name="code"
                  placeholder="Ex: SENIOR, JUNIOR, FEMININ..."
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  placeholder="Description de la catégorie (optionnel)"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseEditDialog}
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
                    Mise à jour...
                  </>
                ) : (
                  "Mettre à jour"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer la catégorie "{categoryToDelete?.name}"?
              <br />
              <span className="text-red-600 font-medium">Cette action est irréversible.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancelDelete}
            >
              Annuler
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
