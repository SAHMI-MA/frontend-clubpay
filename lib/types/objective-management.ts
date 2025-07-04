// Type definitions for the Objective Management System

export interface ObjectiveGroup {
  id: number;
  name: string;
  description?: string;
  objectives?: Objective[];
  assignedPlayers?: {
    id: number;
    firstName: string;
    lastName: string;
    position?: string;
  }[];
  createdAt: string | Date;
}

export interface Objective {
  id: number;
  name: string;
  description?: string;
  bonusAmount: number;
  group?: {
    id: number;
    name: string;
  };
  createdAt: string | Date;
}

export interface PlayerObjectiveProgress {
  id: number;
  player: {
    id: number;
    firstName: string;
    lastName: string;
  };
  objective: {
    id: number;
    name: string;
    bonusAmount: number;
  };
  completionDate?: string | Date;
  isCompleted: boolean;
  progressNotes?: string;
  customBonusAmount?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
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
