// Team Management Types

export interface Team {
  id: number;
  name: string;
  category: string;
  budget: number;
  players?: Player[];
  matches?: Match[];
  staff?: Staff[];
  logoUrl?: string;
  description?: string;
  numberOfPlayers?: number;
  numberOfStaff?: number;
  numberOfMatches?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Player {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  position: string;
  playerNumber?: number; // NEW: Jersey/shirt number
  rib?: string; // NEW: Bank account information
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
  formation?: string; // NEW: Formation used in this match
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
  position?: string; // NEW: Player's position in this specific match
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
  playerNumber?: number; // NEW: Jersey/shirt number
  rib?: string; // NEW: Bank account information
  teamId?: number | null; // Allow both undefined and null for clarity
  playerImage?: string;
}

export interface UpdatePlayerDto {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  position?: string;
  playerNumber?: number; // NEW: Jersey/shirt number
  rib?: string; // NEW: Bank account information
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

export enum StaffRole {
  HEAD_COACH = "Head Coach",
  ASSISTANT_COACH = "Assistant Coach",
  FITNESS_COACH = "Fitness Coach",
  PHYSIOTHERAPIST = "Physiotherapist",
  TEAM_MANAGER = "Team Manager",
  SCOUT = "Scout",
  ANALYST = "Analyst",
  EQUIPMENT_MANAGER = "Equipment Manager",
  MEDICAL_DOCTOR = "Medical Doctor",
  NUTRITIONIST = "Nutritionist",
}

export interface Staff {
  id: number;
  firstName: string;
  lastName: string;
  role: StaffRole;
  dateOfBirth: string;
  phoneNumber?: string;
  email?: string;
  qualification?: string;
  experience?: string;
  rib?: string; // NEW: Bank account information
  staffImage?: string | null;
  salary?: number; // NEW: Staff salary
  contractStartDate?: string; // NEW: Contract start date
  contractEndDate?: string; // NEW: Contract end date
  teamId?: number; // NEW: Team association
  team?: Team;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStaffDto {
  firstName: string;
  lastName: string;
  role: StaffRole;
  dateOfBirth: string;
  phoneNumber?: string;
  email?: string;
  qualification?: string;
  experience?: string;
  rib?: string; // NEW: Bank account information
  staffImage?: string;
  salary?: number; // NEW: Staff salary
  contractStartDate?: string; // NEW: Contract start date
  contractEndDate?: string; // NEW: Contract end date
  teamId: number; // We still use teamId when creating staff
}

export interface UpdateStaffDto {
  firstName?: string;
  lastName?: string;
  role?: StaffRole;
  dateOfBirth?: string;
  phoneNumber?: string;
  email?: string;
  qualification?: string;
  experience?: string;
  rib?: string; // NEW: Bank account information
  staffImage?: string;
  salary?: number; // NEW: Staff salary
  contractStartDate?: string; // NEW: Contract start date
  contractEndDate?: string; // NEW: Contract end date
  teamId?: number; // We still use teamId when updating staff
}
