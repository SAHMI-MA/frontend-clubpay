// Team Management Types

export interface Team {
  id: number;
  name: string;
  category: string;
  budget: number;
  players?: Player[];
  matches?: Match[];
  logoUrl?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Player {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  position: string;
  playerImage?: string;
  teamId?: number | null; // Allow null for consistency
  team?: Team;
  contract?: Contract;
  matchParticipations?: MatchParticipation[];
  objectiveProgress?: ObjectiveProgress[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Match {
  id: number;
  nomMatch: string;
  city: string;
  opposition: string;
  dateTime: string;
  teamId: number;
  team?: Team;
  matchParticipations?: MatchParticipation[];
  homeScore?: number;
  awayScore?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

export interface Contract {
  id: number;
  startDate: string;
  endDate: string;
  salary: number;
  hasBonus: boolean;
  signatureBonus?: number;
  description?: string;
  playerId: number;
  player?: Player;
  createdAt?: string;
  updatedAt?: string;
}

export interface MatchParticipation {
  id: number;
  role: string;
  bonus?: number;
  percentage?: number;
  playerId: number;
  matchId: number;
  player?: Player;
  match?: Match;
  createdAt?: string;
  updatedAt?: string;
}

export interface ObjectiveGroup {
  id: number;
  name: string;
  description?: string;
  objectives?: Objective[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Objective {
  id: number;
  name: string;
  description?: string;
  targetValue: number;
  objectiveGroupId: number;
  objectiveGroup?: ObjectiveGroup;
  objectiveProgress?: ObjectiveProgress[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ObjectiveProgress {
  id: number;
  currentValue: number;
  completedAt?: string;
  playerId: number;
  objectiveId: number;
  player?: Player;
  objective?: Objective;
  createdAt?: string;
  updatedAt?: string;
}

// DTO interfaces for API requests
export interface CreateTeamDto {
  name: string;
  category: string;
  budget: number;
  description?: string;
  logoUrl?: string;
}

export interface UpdateTeamDto {
  name?: string;
  category?: string;
  budget?: number;
  description?: string;
  logoUrl?: string;
}

export interface CreatePlayerDto {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  position: string;
  teamId?: number | null; // Allow both undefined and null for clarity
  playerImage?: string;
}

export interface UpdatePlayerDto {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  position?: string;
  teamId?: number | null; // Allow both undefined and null for clarity
  playerImage?: string;
}

export interface CreateContractDto {
  startDate: string;
  endDate: string;
  salary: number;
  hasBonus: boolean;
  signatureBonus?: number;
  description?: string;
  playerId: number;
}

export interface UpdateContractDto {
  startDate?: string;
  endDate?: string;
  salary?: number;
  hasBonus?: boolean;
  signatureBonus?: number;
  description?: string;
}
