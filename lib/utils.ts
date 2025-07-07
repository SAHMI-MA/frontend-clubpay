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
 * Get position display name with full description
 */
export function getPositionDisplayName(position: string): string {
  const positionMap: Record<string, string> = {
    // Current tactical positions
    "GK": "GK - Goalkeeper",
    "LB": "LB - Left Back",
    "CB": "CB - Center Back",
    "RB": "RB - Right Back",
    "LWB": "LWB - Left Wing Back",
    "RWB": "RWB - Right Wing Back",
    "CDM": "CDM - Defensive Midfielder",
    "CM": "CM - Center Midfielder",
    "CAM": "CAM - Attacking Midfielder",
    "LM": "LM - Left Midfielder",
    "RM": "RM - Right Midfielder",
    "LW": "LW - Left Winger",
    "RW": "RW - Right Winger",
    "ST": "ST - Striker",
    "Coach": "Coach",
    "Assistant Coach": "Assistant Coach",
    "Physiotherapist": "Physiotherapist",
    "Manager": "Manager",
    
    // Backward compatibility for old position values
    "Goalkeeper": "GK - Goalkeeper",
    "Defender": "CB - Center Back", // Default defenders to center back
    "Midfielder": "CM - Center Midfielder", // Default midfielders to center mid
    "Forward": "ST - Striker", // Default forwards to striker
    "Assistant": "Assistant Coach"
  };
  
  return positionMap[position] || position;
}
