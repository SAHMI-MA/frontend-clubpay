// Type definitions for the Match Management System

export interface Match {
  id: number;
  nomMatch: string;  // Match name/title
  city: string;      // City where match is played
  opposition: string; // Opposition team name
  dateTime: string | Date; // Match date and time
  formation?: string; // Formation used in this match
  bonus?: number; // NEW: Default participation bonus for this match
  status?: 'Scheduled' | 'Completed' | 'Cancelled'; // NEW: Match status
  result?: string; // NEW: Match result (e.g., "1-1")
  team: {
    id: number;
    name: string;
    description?: string;
    category?: string;
    budget?: string;
    logoUrl?: string;
    numberOfPlayers?: number;
    numberOfMatches?: number;
    numberOfStaff?: number;
    createdAt?: string | Date;
    updatedAt?: string | Date;
  };
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface MatchParticipation {
  id: number;
  role: "Starter" | "Substitute" | "Bench";
  bonus?: string | number; // Can be string from API
  percentage?: string | number; // Can be string from API
  position?: string; // NEW: Player's position in this specific match
  player: {
    id: number;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    position: string;
    playerNumber?: number | null;
    rib?: string | null;
    playerImage?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
  };
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// DTOs for API requests
export interface CreateMatchDto {
  nomMatch: string;
  city: string;
  opposition: string;
  dateTime: string;
  formation?: string; // Formation for the match
  bonus?: number; // NEW: Default participation bonus for this match
  status?: 'Scheduled' | 'Completed' | 'Cancelled'; // NEW: Match status
  result?: string; // NEW: Match result
  teamId: number;
}

export interface UpdateMatchDto {
  nomMatch?: string;
  city?: string;
  opposition?: string;
  dateTime?: string;
  formation?: string; // Formation for the match
  bonus?: number; // NEW: Default participation bonus for this match
  status?: 'Scheduled' | 'Completed' | 'Cancelled'; // NEW: Match status
  result?: string; // NEW: Match result
  teamId?: number;
}

export interface CreateMatchParticipationDto {
  role: "Starter" | "Substitute" | "Bench";
  bonus?: number;
  percentage?: number;
  position?: string; // NEW: Player's position in this match
  playerId: number;
}

export interface UpdateMatchParticipationDto {
  role?: "Starter" | "Substitute" | "Bench";
  bonus?: number;
  percentage?: number;
  position?: string; // NEW: Player's position in this match
}

// Extended types for UI
export interface MatchWithParticipations extends Match {
  participations?: MatchParticipation[];
  participationCount?: number;
  totalBonuses?: number;
}

export interface MatchStats {
  upcomingMatches: number;
  completedMatches: number;
  totalParticipations: number;
  totalBonuses: number;
}
