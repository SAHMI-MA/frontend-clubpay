import { api } from './api';
import { 
  Team, 
  Player, 
  Contract, 
  Match, 
  MatchParticipation,
  ObjectiveGroup, 
  // Objective - unused
  ObjectiveProgress,
  CreateTeamDto, 
  UpdateTeamDto,
  CreatePlayerDto, 
  UpdatePlayerDto,
  CreateContractDto,
  UpdateContractDto,
  Image
} from './types/team-management';

/**
 * Team API service
 */
export const teamService = {
  /**
   * Get all teams
   * @returns List of teams
   */
  getAllTeams(): Promise<Team[]> {
    return api.get<Team[]>('teams');
  },

  /**
   * Get team by ID (with related players and matches)
   * @param id - Team ID
   * @returns Team details
   */
  getTeamById(id: number): Promise<Team> {
    return api.get<Team>(`teams/${id}`);
  },

  /**
   * Create a new team
   * @param teamData - Team data
   * @returns Created team
   */
  createTeam(teamData: CreateTeamDto): Promise<Team> {
    return api.post<Team>('teams', teamData);
  },

  /**
   * Update a team
   * @param id - Team ID
   * @param teamData - Updated team data
   * @returns Updated team
   */
  updateTeam(id: number, teamData: UpdateTeamDto): Promise<Team> {
    return api.patch<Team>(`teams/${id}`, teamData);
  },

  /**
   * Delete a team
   * @param id - Team ID
   */
  deleteTeam(id: number): Promise<void> {
    return api.delete<void>(`teams/${id}`);
  }
};

/**
 * Player API service
 */
export const playerService = {
  /**
   * Get all players
   * @returns List of players
   */
  getAllPlayers(): Promise<Player[]> {
    return api.get<Player[]>('players');
  },

  /**
   * Get player by ID (with related team and contract)
   * @param id - Player ID
   * @returns Player details
   */
  getPlayerById(id: number): Promise<Player> {
    return api.get<Player>(`players/${id}`);
  },

  /**
   * Create a new player
   * @param playerData - Player data
   * @returns Created player
   */
  createPlayer(playerData: CreatePlayerDto): Promise<Player> {
    return api.post<Player>('players', playerData);
  },

  /**
   * Update a player
   * @param id - Player ID
   * @param playerData - Updated player data
   * @returns Updated player
   */
  updatePlayer(id: number, playerData: UpdatePlayerDto): Promise<Player> {
    return api.patch<Player>(`players/${id}`, playerData);
  },

  /**
   * Delete a player
   * @param id - Player ID
   */
  deletePlayer(id: number): Promise<void> {
    return api.delete<void>(`players/${id}`);
  },

  /**
   * Get all objectives for a player
   * @param playerId - Player ID
   * @returns List of objectives for the player
   */
  getPlayerObjectives(playerId: number): Promise<ObjectiveProgress[]> {
    return api.get<ObjectiveProgress[]>(`players/${playerId}/objectives`);
  },

  /**
   * Get all match participations for a player
   * @param playerId - Player ID
   * @returns List of match participations for the player
   */
  getPlayerMatches(playerId: number): Promise<MatchParticipation[]> {
    return api.get<MatchParticipation[]>(`players/${playerId}/matches`);
  },

  /**
   * Create a contract for a player
   * @param playerId - Player ID
   * @param contractData - Contract data
   * @returns Created contract
   */
  createPlayerContract(playerId: number, contractData: CreateContractDto): Promise<Contract> {
    return api.post<Contract>(`players/${playerId}/contract`, contractData);
  },

  /**
   * Update a player's contract
   * @param playerId - Player ID
   * @param contractId - Contract ID
   * @param contractData - Updated contract data
   * @returns Updated contract
   */
  updatePlayerContract(
    playerId: number, 
    contractId: number, 
    contractData: UpdateContractDto
  ): Promise<Contract> {
    return api.patch<Contract>(
      `players/${playerId}/contract/${contractId}`, 
      contractData
    );
  }
};

/**
 * Match API service
 */
export const matchService = {
  /**
   * Get all matches
   * @returns List of matches
   */
  getAllMatches(): Promise<Match[]> {
    return api.get<Match[]>('matches');
  },

  /**
   * Get match by ID
   * @param id - Match ID
   * @returns Match details
   */
  getMatchById(id: number): Promise<Match> {
    return api.get<Match>(`matches/${id}`);
  },

  /**
   * Get matches for a team
   * @param teamId - Team ID
   * @returns Matches for the team
   */
  getTeamMatches(teamId: number): Promise<Match[]> {
    return api.get<Match[]>(`teams/${teamId}/matches`);
  }
};

/**
 * Objectives API service
 */
export const objectiveService = {
  /**
   * Get all objective groups
   * @returns List of objective groups
   */
  getAllObjectiveGroups(): Promise<ObjectiveGroup[]> {
    return api.get<ObjectiveGroup[]>('objective-groups');
  },

  /**
   * Get objectives for a player
   * @param playerId - Player ID
   * @returns List of objectives for the player
   */
  getPlayerObjectives(playerId: number): Promise<ObjectiveProgress[]> {
    return api.get<ObjectiveProgress[]>(`players/${playerId}/objectives`);
  }
};

/**
 * Image API service
 */
export const imageService = {
  /**
   * Upload an image
   * @param file - The image file to upload
   * @returns Uploaded image information
   */
  uploadImage(file: File): Promise<Image> {
    return api.uploadFile<Image>('images/upload', file);
  }
};
