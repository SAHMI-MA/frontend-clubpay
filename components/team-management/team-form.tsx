"use client";

import { useState, useEffect } from "react";
import { useAppDispatch } from "@/lib/redux/hooks";
import { createTeam, updateTeam } from "@/lib/redux/teamSlice";
import { Team, CreateTeamDto, UpdateTeamDto } from "@/lib/types/team-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2} from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";

interface TeamFormProps {
  team?: Team | null;
  isCreating?: boolean;
  isEditing?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TeamForm({
  team,
  isCreating = false,
  isEditing = false,
  onSuccess,
  onCancel,
}: TeamFormProps) {
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<CreateTeamDto | UpdateTeamDto>({
    name: "",
    category: "",
    budget: 0,
    description: "",
    logoUrl: "",
  });

  // Prefill form if team is provided (edit mode)
  useEffect(() => {
    if (team && isEditing) {
      setFormData({
        name: team.name,
        category: team.category,
        budget: team.budget,
        description: team.description || "",
        logoUrl: team.logoUrl || "",
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
      category: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isCreating) {
        await dispatch(createTeam(formData as CreateTeamDto)).unwrap();
        toast.success("Team created successfully");
      } else if (isEditing && team) {
        await dispatch(
          updateTeam({ id: team.id, teamData: formData as UpdateTeamDto })
        ).unwrap();
        toast.success("Team updated successfully");
      }
      onSuccess?.();
    } catch (error) {
      toast.error(
        typeof error === "string" 
          ? error 
          : "Failed to save team. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Team Name *</Label>
        <Input
          id="name"
          name="name"
          placeholder="Enter team name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select
          value={formData.category}
          onValueChange={handleCategoryChange}
          required
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="senior">Senior</SelectItem>
            <SelectItem value="junior">Junior</SelectItem>
            <SelectItem value="youth">Youth</SelectItem>
            <SelectItem value="women">Women</SelectItem>
            <SelectItem value="veterans">Veterans</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget">Budget (€) *</Label>
        <Input
          id="budget"
          name="budget"
          type="number"
          placeholder="Enter budget"
          value={formData.budget}
          onChange={handleChange}
          min={0}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
              id="description"
              name="description"
              placeholder="Enter team description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              name="logoUrl"
              placeholder="Enter logo URL"
              value={formData.logoUrl}
              onChange={handleChange}
            />
            {formData.logoUrl && (
              <div className="mt-2">
                <img 
                  src={formData.logoUrl} 
                  alt="Team logo preview" 
                  className="h-16 w-16 object-contain rounded border p-1"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/placeholder-logo.png";
                  }}
                />
              </div>
            )}
          </div>
          
          <DialogFooter className="pt-4">
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
                isCreating ? "Create Team" : "Update Team"
              )}
            </Button>
          </DialogFooter>
        </form>
  );
}
