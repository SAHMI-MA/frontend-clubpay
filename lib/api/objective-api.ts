import { api } from '../api';
import {
  ObjectiveGroup,
  Objective,
  PlayerObjectiveProgress,
  TeamObjectiveProgress,
  PlayerBonusSummary,
  CreateObjectiveGroupDto,
  CreateObjectiveDto,
  AssignObjectiveDto,
  BulkAssignObjectiveDto,
  TeamObjectiveAssignmentDto,
  CompleteObjectiveDto,
  BatchCompleteObjectivesDto,
  UpdateObjectiveProgressDto
} from '../types/objective-management';

// Objective Groups
export const getObjectiveGroups = async (): Promise<ObjectiveGroup[]> => {
  return api.get<ObjectiveGroup[]>('/objectives/groups');
};

export const getObjectiveGroupById = async (groupId: number): Promise<ObjectiveGroup> => {
  return api.get<ObjectiveGroup>(`/objectives/groups/${groupId}`);
};

export const createObjectiveGroup = async (groupData: CreateObjectiveGroupDto): Promise<ObjectiveGroup> => {
  return api.post<ObjectiveGroup>('/objectives/groups', groupData);
};

export const updateObjectiveGroup = async (groupId: number, groupData: CreateObjectiveGroupDto): Promise<ObjectiveGroup> => {
  return api.put<ObjectiveGroup>(`/objectives/groups/${groupId}`, groupData);
};

export const deleteObjectiveGroup = async (groupId: number): Promise<void> => {
  return api.delete(`/objectives/groups/${groupId}`);
};

// Group-to-Player Assignments (New Endpoints)
export const assignGroupToPlayers = async (groupId: number, playerIds: number[]): Promise<void> => {
  return api.post(`/objectives/groups/${groupId}/assign-to-players`, { playerIds });
};

export const getGroupAssignedPlayers = async (groupId: number): Promise<any[]> => {
  return api.get(`/objectives/groups/${groupId}/assigned-players`);
};

export const removeGroupFromPlayers = async (groupId: number, playerIds: number[]): Promise<void> => {
  // Custom DELETE request with body since the api.delete() doesn't support body
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/objectives/groups/${groupId}/remove-from-players`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(typeof window !== 'undefined' && localStorage.getItem('authToken') && {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      })
    },
    body: JSON.stringify({ playerIds })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to remove group from players: ${response.statusText}`);
  }
};

// Objectives
export const getObjectives = async (): Promise<Objective[]> => {
  return api.get<Objective[]>('/objectives');
};

export const getObjectiveById = async (objectiveId: number): Promise<Objective> => {
  return api.get<Objective>(`/objectives/${objectiveId}`);
};

export const createObjective = async (objectiveData: CreateObjectiveDto): Promise<Objective> => {
  return api.post<Objective>('/objectives', objectiveData);
};

export const updateObjective = async (objectiveId: number, objectiveData: Partial<CreateObjectiveDto>): Promise<Objective> => {
  return api.put<Objective>(`/objectives/${objectiveId}`, objectiveData);
};

export const deleteObjective = async (objectiveId: number): Promise<void> => {
  return api.delete(`/objectives/${objectiveId}`);
};

// Objective Assignments
export const assignObjectiveToPlayer = async (assignData: AssignObjectiveDto): Promise<PlayerObjectiveProgress> => {
  return api.post<PlayerObjectiveProgress>('/objectives/assign', assignData);
};

export const bulkAssignObjective = async (bulkAssignData: BulkAssignObjectiveDto): Promise<PlayerObjectiveProgress[]> => {
  return api.post<PlayerObjectiveProgress[]>('/objectives/bulk-assign/players', bulkAssignData);
};

export const assignObjectivesToTeam = async (teamAssignmentData: TeamObjectiveAssignmentDto): Promise<PlayerObjectiveProgress[]> => {
  return api.post<PlayerObjectiveProgress[]>('/objectives/bulk-assign/team', teamAssignmentData);
};

// Objective Progress
export const getPlayerObjectiveProgress = async (playerId: number): Promise<PlayerObjectiveProgress[]> => {
  return api.get<PlayerObjectiveProgress[]>(`/objectives/player/${playerId}`);
};

export const getTeamObjectiveProgress = async (teamId: number): Promise<TeamObjectiveProgress> => {
  return api.get<TeamObjectiveProgress>(`/objectives/team/${teamId}/progress`);
};

export const getPlayerBonusSummary = async (playerId: number, startDate?: string, endDate?: string): Promise<PlayerBonusSummary> => {
  let url = `/objectives/player/${playerId}/bonus`;
  
  if (startDate && endDate) {
    url += `?startDate=${startDate}&endDate=${endDate}`;
  }
  
  return api.get<PlayerBonusSummary>(url);
};

export const completeObjective = async (playerId: number, objectiveId: number, completeData: CompleteObjectiveDto): Promise<PlayerObjectiveProgress> => {
  return api.post<PlayerObjectiveProgress>(`/objectives/player/${playerId}/complete/${objectiveId}`, completeData);
};

export const batchCompleteObjectives = async (playerId: number, batchData: BatchCompleteObjectivesDto): Promise<PlayerObjectiveProgress[]> => {
  return api.post<PlayerObjectiveProgress[]>(`/objectives/player/${playerId}/complete-batch`, batchData);
};

export const updateObjectiveProgress = async (playerId: number, objectiveId: number, updateData: UpdateObjectiveProgressDto): Promise<PlayerObjectiveProgress> => {
  return api.put<PlayerObjectiveProgress>(`/objectives/player/${playerId}/progress/${objectiveId}`, updateData);
};

export const deleteObjectiveProgress = async (playerId: number, objectiveId: number): Promise<void> => {
  return api.delete(`/objectives/player/${playerId}/progress/${objectiveId}`);
};

// Bonus and Salary calculations
export const calculateBonusesForPlayer = async (playerId: number, startDate?: string, endDate?: string): Promise<PlayerBonusSummary> => {
  let url = `/objectives/player/${playerId}/bonus`;
  
  if (startDate && endDate) {
    url += `?startDate=${startDate}&endDate=${endDate}`;
  }
  
  return api.get<PlayerBonusSummary>(url);
};

export const processPlayerSalaryPayment = async (playerId: number, paymentData: { amount: number; paymentDate: string }): Promise<void> => {
  return api.post(`/objectives/player/${playerId}/salary-payment`, paymentData);
};
