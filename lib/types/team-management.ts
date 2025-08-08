// Team Management Types

export interface Image {
  id: number;
  url: string;
  filename?: string;
  contentType?: string;
  size?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Team {
  id: number;
  name: string;
  code: string;        // Team code
  budget: number;
  category?: {
    id: number;
    name: string;
    code?: string;     // Category code
    description?: string;
  };
  categoryId?: number;
  clubImage?: {       // Image object from API
    id: number;
    url: string;
    filename?: string;
  };
  clubImageId?: number;
  players?: Player[];
  matches?: Match[];
  staff?: Staff[];
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
  playerStatus?: 'ACTIVE' | 'INJURED' | 'SUSPENDED' | 'RETIRED'; // NEW: Player status
  playerImage?: {       // Image object from API
    id: number;
    url: string;
    filename?: string;
  };
  playerImageId?: number;
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
  code: string;     // Required by backend - unique team code
  budget: number;
  categoryId?: number;
  description?: string;
}

export interface UpdateTeamDto {
  name?: string;
  code?: string;     // Team code can be updated
  budget?: number;
  categoryId?: number;
  description?: string;
}

export interface CreatePlayerDto {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  position: string;
  playerNumber?: number; // NEW: Jersey/shirt number
  rib?: string; // NEW: Bank account information
  playerStatus?: 'ACTIVE' | 'INJURED' | 'SUSPENDED' | 'RETIRED'; // NEW: Player status
  teamId?: number | null; // Allow both undefined and null for clarity
  ImageId?: number | null;
}

export interface UpdatePlayerDto {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  position?: string;
  playerNumber?: number; // NEW: Jersey/shirt number
  rib?: string; // NEW: Bank account information
  playerStatus?: 'ACTIVE' | 'INJURED' | 'SUSPENDED' | 'RETIRED'; // NEW: Player status
  teamId?: number | null; // Allow both undefined and null for clarity
  ImageId?: number | null;
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
  staffImage?: {       // Image object from API
    id: number;
    url: string;
    filename?: string;
  };
  staffImageId?: number;
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
  staffImageId?: number;
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
  staffImageId?: number;
  salary?: number; // NEW: Staff salary
  contractStartDate?: string; // NEW: Contract start date
  contractEndDate?: string; // NEW: Contract end date
  teamId?: number; // We still use teamId when updating staff
}

export interface CreateTeamDto {
  name: string;
  code: string;
  budget: number;
  description?: string;
  categoryId?: number;
  clubImageId?: number;
}

export interface UpdateTeamDto {
  name?: string;
  code?: string;
  budget?: number;
  description?: string;
  categoryId?: number;
  clubImageId?: number;
}

// Employee interface for HR management
export interface Employee {
  employeeId: string; // Primary key - string format like "HR001"
  fullName: string;
  department?: {
    id: number;
    name: string;
  };
  position?: {
    id: number;
    title: string;
  };
  user?: {
    id: number;
    username: string;
    email: string;
  };
  employeeStatus?: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_LEAVE' | 'SUSPENDED';
  hireDate?: string;
  terminationDate?: string;
  currentSalary?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmployeeDto {
  employeeId: string;
  fullName: string;
  departmentId?: number;
  positionId?: number;
  userId?: number;
  employeeStatus?: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_LEAVE' | 'SUSPENDED';
  hireDate?: string;
  currentSalary?: string;
}

export interface UpdateEmployeeDto {
  fullName?: string;
  departmentId?: number;
  positionId?: number;
  userId?: number;
  employeeStatus?: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_LEAVE' | 'SUSPENDED';
  hireDate?: string;
  terminationDate?: string;
  currentSalary?: string;
}
