import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get tactical field positions only (for players)
 * These positions match the formations used in the tactical planner
 */
export function getTacticalFieldPositions(): string[] {
  return [
    "GK",   // Goalkeeper
    "LB",   // Left Back
    "CB",   // Center Back
    "RB",   // Right Back
    "LWB",  // Left Wing Back
    "RWB",  // Right Wing Back
    "CDM",  // Defensive Midfielder
    "CM",   // Center Midfielder
    "CAM",  // Attacking Midfielder
    "LM",   // Left Midfielder
    "RM",   // Right Midfielder
    "LW",   // Left Winger
    "RW",   // Right Winger
    "ST",   // Striker
  ];
}

/**
 * Get all available positions, including both tactical field positions and staff roles
 * Use this for filtering and display purposes where staff positions might be needed
 */
export function getTacticalPositions(): string[] {
  const tacticalRoles = getTacticalFieldPositions();
  
  // Staff and non-playing roles
  const staffRoles = [
    "Coach",
    "Assistant Coach",
    "Physiotherapist",
    "Manager"
  ];
  
  return [...tacticalRoles, ...staffRoles];
}

/**
 * Extract unique tactical positions from formations array
 * This can be used to dynamically get positions if formations change
 */
export function extractPositionsFromFormations(formations: Array<{ positions: Array<{ role: string }> }>): string[] {
  const tacticalRoles = new Set<string>();
  
  formations.forEach(formation => {
    formation.positions.forEach(position => {
      tacticalRoles.add(position.role);
    });
  });
  
  // Staff and non-playing roles
  const staffRoles = [
    "Coach",
    "Assistant Coach", 
    "Physiotherapist",
    "Manager"
  ];
  
  return [...Array.from(tacticalRoles).sort(), ...staffRoles];
}

/**
 * Get position display name with full description in French
 */
export function getPositionDisplayName(position: string): string {
  const positionMap: Record<string, string> = {
    // Current tactical positions
    "GK": "GK - Gardien de but",
    "LB": "LB - Arrière gauche",
    "CB": "CB - Défenseur central",
    "RB": "RB - Arrière droit",
    "LWB": "LWB - Arrière gauche offensif",
    "RWB": "RWB - Arrière droit offensif",
    "CDM": "CDM - Milieu défensif",
    "CM": "CM - Milieu de terrain",
    "CAM": "CAM - Milieu offensif",
    "LM": "LM - Milieu gauche",
    "RM": "RM - Milieu droit",
    "LW": "LW - Ailier gauche",
    "RW": "RW - Ailier droit",
    "ST": "ST - Attaquant",
    "Coach": "Entraîneur",
    "Assistant Coach": "Entraîneur adjoint",
    "Physiotherapist": "Kinésithérapeute",
    "Manager": "Manager",
    
    // Backward compatibility for old position values
    "Goalkeeper": "GK - Gardien de but",
    "Defender": "CB - Défenseur central", // Default defenders to center back
    "Midfielder": "CM - Milieu de terrain", // Default midfielders to center mid
    "Forward": "ST - Attaquant", // Default forwards to striker
    "Assistant": "Entraîneur adjoint"
  };
  
  return positionMap[position] || position;
}
