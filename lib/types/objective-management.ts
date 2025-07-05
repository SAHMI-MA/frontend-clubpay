// Type definitions for the Objective Management System

export interface ObjectiveGroup {
  id: number;
  name: string;
  bonusAmount?: number; // Added to match API
  objectives?: Objective[];
  assignedPlayers?: {
    id: number;
    firstName: string;
    lastName: string;
    position: string;
    assignedAt: string | Date; // Added to match API
  }[];
  createdAt: string | Date;
  updatedAt: string | Date; // Added to match API
}

export interface Objective {
  id: number;
  title: string;  // Changed from 'name' to 'title' to match API
  name?: string;  // Keep 'name' as optional for backwards compatibility
  description?: string;
  bonusAmount: number;
  objectiveGroupId?: number; // Added to match API response
  group?: {
    id: number;
    name: string;
  };
  createdAt: string | Date;
}

export interface PlayerObjectiveProgress {
  id: number;
  isCompleted: boolean;
  completedAt: string | Date | null;
  bonus?: number | null;
  objective: {
    id: number;
    title: string;
    description?: string;
    bonusAmount: string; // API returns as string
    objectiveGroup: {
      id: number;
      name: string;
      bonusAmount: string;
      createdAt: string | Date;
      updatedAt: string | Date;
    };
    createdAt: string | Date;
    updatedAt: string | Date;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
  __playerId?: number; // Added by Redux to track which player this belongs to
}

export interface TeamObjectiveProgress {
  totalObjectives: number;
  completedObjectives: number;
  progressPercentage: number;
  playerProgress: PlayerProgressSummary[];
}

export interface PlayerProgressSummary {
  playerId: number;
  playerName: string;
  totalAssigned: number;
  completed: number;
  progressPercentage: number;
}

export interface PlayerBonusSummary {
  playerId: number;
  playerName: string;
  totalBonusAmount: number;
  completedObjectives: {
    objectiveId: number;
    name: string;
    standardBonusAmount: number;
    customBonusAmount?: number;
    bonusAwarded: number;
    completionDate: string | Date;
  }[];
}

export interface SalaryPaymentBonusDetails {
  playerId: number;
  playerName: string;
  totalBonusAmount: number;
  bonusDetails: {
    objectiveId: number;
    name: string;
    bonusAmount: number;
    completionDate: string | Date;
  }[];
  periodStart: string | Date;
  periodEnd: string | Date;
}

// DTOs for API requests
export interface CreateObjectiveGroupDto {
  name: string;
  // Note: description is not supported by the API
}

export interface CreateObjectiveDto {
  title: string;
  description?: string;
  objectiveGroupId: number;
  bonusAmount: number;
}

export interface AssignObjectiveDto {
  objectiveId: number;
  playerId: number;
}

export interface AssignObjectiveResponseDto {
  isCompleted: boolean;
  completedAt: string;
  bonus: number;
  playerId: number;
  objectiveId: number;
}

export interface BulkAssignObjectiveDto {
  objectiveId: number;
  playerIds: number[];
}

export interface TeamObjectiveAssignmentDto {
  teamId: number;
  objectiveIds: number[];
}

export interface CompleteObjectiveDto {
  completionDate?: string | Date;
  progressNotes?: string;
  customBonusAmount?: number;
}

export interface BatchCompleteObjectivesDto {
  objectiveIds: number[];
  completionDate?: string | Date;
  progressNotes?: string;
  customBonusAmount?: number;
}

export interface UpdateObjectiveProgressDto {
  isCompleted?: boolean;
  completionDate?: string | Date;
  progressNotes?: string;
  customBonusAmount?: number;
}

export interface BulkSalaryPaymentDto {
  teamId: number;
  paymentDate: string | Date;
  periodStart: string | Date;
  periodEnd: string | Date;
  includePlayers: boolean;
  includeStaff: boolean;
  includeAutomaticBonuses: boolean;
  taxRate: number;
  status: string;
  notes?: string;
}
