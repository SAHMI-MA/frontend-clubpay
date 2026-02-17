"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Check } from "lucide-react";
import { toast } from "sonner";
import { associationAPI } from "@/lib/api/association-api";
import { useThemeColors } from "@/hooks/use-theme-colors";

const COLOR_PRESETS = [
  { name: "Bleu Océan", primary: "#1E3A8A", secondary: "#FFFFFF" },
  { name: "Vert Forêt", primary: "#065F46", secondary: "#FFFFFF" },
  { name: "Rouge Passion", primary: "#991B1B", secondary: "#FFFFFF" },
  { name: "Violet Royal", primary: "#5B21B6", secondary: "#FFFFFF" },
  { name: "Orange Énergie", primary: "#C2410C", secondary: "#FFFFFF" },
  { name: "Rose Moderne", primary: "#BE185D", secondary: "#FFFFFF" },
  { name: "Indigo Profond", primary: "#3730A3", secondary: "#FFFFFF" },
  { name: "Teal Frais", primary: "#0F766E", secondary: "#FFFFFF" },
  { name: "Slate Élégant", primary: "#334155", secondary: "#FFFFFF" },
  { name: "Amber Chaleureux", primary: "#B45309", secondary: "#FFFFFF" },
];

export function ColorThemeManager() {
  const { colors, updateColors, reloadColors } = useThemeColors();
  const [primaryColor, setPrimaryColor] = useState(colors.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(colors.secondaryColor);
  const [saving, setSaving] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handlePresetSelect = (preset: typeof COLOR_PRESETS[0]) => {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setSelectedPreset(preset.name);
    
    // Appliquer immédiatement pour prévisualisation
    updateColors({
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await associationAPI.updateSettings({
        primaryColor,
        secondaryColor,
      });
      
      await updateColors({ primaryColor, secondaryColor });
      await reloadColors();
      
      toast.success("Couleurs mises à jour avec succès !");
    } catch (error) {
      console.error("Error updating colors:", error);
      toast.error("Erreur lors de la mise à jour des couleurs");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setPrimaryColor(colors.primaryColor);
    setSecondaryColor(colors.secondaryColor);
    setSelectedPreset(null);
    
    await updateColors({
      primaryColor: colors.primaryColor,
      secondaryColor: colors.secondaryColor,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          <CardTitle>Thème de l'Application</CardTitle>
        </div>
        <CardDescription>
          Personnalisez les couleurs de votre application. Les changements sont appliqués en temps réel.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Presets */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Thèmes Prédéfinis</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePresetSelect(preset)}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:border-primary ${
                  selectedPreset === preset.name
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                {selectedPreset === preset.name && (
                  <Check className="absolute top-1 right-1 h-4 w-4 text-primary" />
                )}
                <div className="flex gap-1">
                  <div
                    className="w-8 h-8 rounded border border-border shadow-sm"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <div
                    className="w-8 h-8 rounded border border-border shadow-sm"
                    style={{ backgroundColor: preset.secondary }}
                  />
                </div>
                <span className="text-xs text-center font-medium">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Colors */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Couleurs Personnalisées</Label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Couleur Principale</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => {
                    setPrimaryColor(e.target.value);
                    setSelectedPreset(null);
                    updateColors({ primaryColor: e.target.value, secondaryColor });
                  }}
                  className="w-20 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => {
                    setPrimaryColor(e.target.value);
                    setSelectedPreset(null);
                    if (e.target.value.match(/^#[0-9A-F]{6}$/i)) {
                      updateColors({ primaryColor: e.target.value, secondaryColor });
                    }
                  }}
                  placeholder="#1E3A8A"
                  className="flex-1 font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Utilisée pour les boutons, liens et éléments principaux
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Couleur Secondaire</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => {
                    setSecondaryColor(e.target.value);
                    setSelectedPreset(null);
                    updateColors({ primaryColor, secondaryColor: e.target.value });
                  }}
                  className="w-20 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => {
                    setSecondaryColor(e.target.value);
                    setSelectedPreset(null);
                    if (e.target.value.match(/^#[0-9A-F]{6}$/i)) {
                      updateColors({ primaryColor, secondaryColor: e.target.value });
                    }
                  }}
                  placeholder="#FFFFFF"
                  className="flex-1 font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Utilisée pour les arrière-plans et textes secondaires
              </p>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Aperçu</Label>
          <div className="p-4 border rounded-lg space-y-3 bg-card">
            <div className="flex gap-2">
              <Button>Bouton Principal</Button>
              <Button variant="outline">Bouton Outline</Button>
              <Button variant="secondary">Bouton Secondaire</Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 px-4 flex items-center bg-primary text-primary-foreground rounded">
                Élément avec couleur principale
              </div>
              <div className="h-10 px-4 flex items-center bg-accent text-accent-foreground rounded">
                Élément accent
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? "Enregistrement..." : "Enregistrer les Couleurs"}
          </Button>
          <Button onClick={handleReset} variant="outline">
            Réinitialiser
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
