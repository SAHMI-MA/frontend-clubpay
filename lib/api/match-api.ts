import { api } from '../api';
import {
  Match,
  MatchParticipation,
  Team,
  CreateMatchDto,
  UpdateMatchDto,
  CreateMatchParticipationDto,
  UpdateMatchParticipationDto
} from '../types/match-management';

// Matches API
export const getAllMatches = async (): Promise<Match[]> => {
  console.log('API: Calling getAllMatches...');
  try {
    const result = await api.get<Match[]>('/matches');
    console.log('API: getAllMatches success:', result);
    return result;
  } catch (error) {
    console.error('API: getAllMatches error:', error);
    throw error;
  }
};

export const getMatchById = async (matchId: number): Promise<Match> => {
  return api.get<Match>(`/matches/${matchId}`);
};

export const createMatch = async (matchData: CreateMatchDto): Promise<Match> => {
  console.log('API: Calling createMatch with data:', matchData);
  try {
    const result = await api.post<Match>('/matches', matchData);
    console.log('API: createMatch success:', result);
    return result;
  } catch (error: any) {
    console.error('API: createMatch error:', error);
    console.error('API: createMatch error response:', error.response?.data);
    console.error('API: createMatch error status:', error.response?.status);
    throw error;
  }
};

export const updateMatch = async (matchId: number, matchData: UpdateMatchDto): Promise<Match> => {
  return api.patch<Match>(`/matches/${matchId}`, matchData);
};

export const deleteMatch = async (matchId: number): Promise<void> => {
  return api.delete(`/matches/${matchId}`);
};

// Match Participations API
export const getMatchParticipations = async (matchId: number): Promise<MatchParticipation[]> => {
  return api.get<MatchParticipation[]>(`/matches/${matchId}/participations`);
};

export const addPlayerToMatch = async (
  matchId: number, 
  participationData: CreateMatchParticipationDto
): Promise<MatchParticipation> => {
  return api.post<MatchParticipation>(`/matches/${matchId}/participations`, participationData);
};

export const updateMatchParticipation = async (
  matchId: number,
  participationId: number,
  participationData: UpdateMatchParticipationDto
): Promise<MatchParticipation> => {
  return api.patch<MatchParticipation>(`/matches/${matchId}/participations/${participationId}`, participationData);
};

export const removePlayerFromMatch = async (matchId: number, participationId: number): Promise<void> => {
  return api.delete(`/matches/${matchId}/participations/${participationId}`);
};

// Teams API (for creating matches)
export const getAllTeams = async (): Promise<Team[]> => {
  console.log('API: Calling getAllTeams...');
  try {
    const result = await api.get<Team[]>('/teams');
    console.log('API: getAllTeams success:', result);
    return result;
  } catch (error) {
    console.error('API: getAllTeams error:', error);
    throw error;
  }
};
