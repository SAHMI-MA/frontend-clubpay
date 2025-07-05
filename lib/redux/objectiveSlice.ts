import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as objectiveApi from '../api/objective-api';
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
  CompleteObjectiveDto,
  UpdateObjectiveProgressDto
} from '../types/objective-management';

interface ObjectivesState {
  groups: ObjectiveGroup[];
  objectives: Objective[];
  playerProgress: PlayerObjectiveProgress[];
  teamProgress: TeamObjectiveProgress | null;
  playerBonusSummary: PlayerBonusSummary | null;
  selectedGroupId: number | null;
  selectedObjectiveId: number | null;
  loading: {
    groups: boolean;
    objectives: boolean;
    progress: boolean;
    bonuses: boolean;
  };
  error: {
    groups: string | null;
    objectives: string | null;
    progress: string | null;
    bonuses: string | null;
  };
}

const initialState: ObjectivesState = {
  groups: [],
  objectives: [],
  playerProgress: [],
  teamProgress: null,
  playerBonusSummary: null,
  selectedGroupId: null,
  selectedObjectiveId: null,
  loading: {
    groups: false,
    objectives: false,
    progress: false,
    bonuses: false
  },
  error: {
    groups: null,
    objectives: null,
    progress: null,
    bonuses: null
  }
};

// Thunks for objective groups
export const fetchObjectiveGroups = createAsyncThunk(
  'objectives/fetchGroups',
  async (_, { rejectWithValue }) => {
    try {
      return await objectiveApi.getObjectiveGroups();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch objective groups');
    }
  }
);

export const createObjectiveGroup = createAsyncThunk(
  'objectives/createGroup',
  async (groupData: CreateObjectiveGroupDto, { rejectWithValue }) => {
    try {
      return await objectiveApi.createObjectiveGroup(groupData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create objective group');
    }
  }
);

export const updateObjectiveGroup = createAsyncThunk(
  'objectives/updateGroup',
  async ({ groupId, groupData }: { groupId: number; groupData: CreateObjectiveGroupDto }, { rejectWithValue }) => {
    try {
      return await objectiveApi.updateObjectiveGroup(groupId, groupData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update objective group');
    }
  }
);

export const deleteObjectiveGroup = createAsyncThunk(
  'objectives/deleteGroup',
  async (groupId: number, { rejectWithValue }) => {
    try {
      await objectiveApi.deleteObjectiveGroup(groupId);
      return groupId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete objective group');
    }
  }
);

// Group-to-Player Assignment thunks
export const assignGroupToPlayers = createAsyncThunk(
  'objectives/assignGroupToPlayers',
  async ({ groupId, playerIds }: { groupId: number; playerIds: number[] }, { rejectWithValue }) => {
    try {
      await objectiveApi.assignGroupToPlayers(groupId, playerIds);
      return { groupId, playerIds };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign group to players');
    }
  }
);

export const fetchGroupAssignedPlayers = createAsyncThunk(
  'objectives/fetchGroupAssignedPlayers',
  async (groupId: number, { rejectWithValue }) => {
    try {
      const players = await objectiveApi.getGroupAssignedPlayers(groupId);
      return { groupId, players };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch group assigned players');
    }
  }
);

export const removeGroupFromPlayers = createAsyncThunk(
  'objectives/removeGroupFromPlayers',
  async ({ groupId, playerIds }: { groupId: number; playerIds: number[] }, { rejectWithValue }) => {
    try {
      await objectiveApi.removeGroupFromPlayers(groupId, playerIds);
      return { groupId, playerIds };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove group from players');
    }
  }
);

// Thunks for objectives
export const fetchObjectives = createAsyncThunk(
  'objectives/fetchObjectives',
  async (_, { rejectWithValue }) => {
    try {
      return await objectiveApi.getObjectives();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch objectives');
    }
  }
);

export const createObjective = createAsyncThunk(
  'objectives/createObjective',
  async (objectiveData: CreateObjectiveDto, { rejectWithValue }) => {
    try {
      return await objectiveApi.createObjective(objectiveData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create objective');
    }
  }
);

export const updateObjective = createAsyncThunk(
  'objectives/updateObjective',
  async ({ objectiveId, objectiveData }: { objectiveId: number; objectiveData: Partial<CreateObjectiveDto> }, { rejectWithValue }) => {
    try {
      return await objectiveApi.updateObjective(objectiveId, objectiveData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update objective');
    }
  }
);

export const deleteObjective = createAsyncThunk(
  'objectives/deleteObjective',
  async (objectiveId: number, { rejectWithValue }) => {
    try {
      await objectiveApi.deleteObjective(objectiveId);
      return objectiveId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete objective');
    }
  }
);

// Thunks for objective assignments and progress
export const assignObjectiveToPlayer = createAsyncThunk(
  'objectives/assignToPlayer',
  async (assignData: AssignObjectiveDto, { rejectWithValue }) => {
    try {
      return await objectiveApi.assignObjectiveToPlayer(assignData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign objective to player');
    }
  }
);

export const bulkAssignObjective = createAsyncThunk(
  'objectives/bulkAssign',
  async (bulkAssignData: BulkAssignObjectiveDto, { rejectWithValue }) => {
    try {
      return await objectiveApi.bulkAssignObjective(bulkAssignData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to bulk assign objective');
    }
  }
);

export const fetchPlayerObjectiveProgress = createAsyncThunk(
  'objectives/fetchPlayerProgress',
  async (playerId: number, { rejectWithValue }) => {
    try {
      const progress = await objectiveApi.getPlayerObjectiveProgress(playerId);
      // Add player ID to each progress item for easier filtering in UI
      return {
        playerId,
        progress: progress.map(p => ({ ...p, __playerId: playerId }))
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch player objective progress');
    }
  }
);

export const fetchTeamObjectiveProgress = createAsyncThunk(
  'objectives/fetchTeamProgress',
  async (teamId: number, { rejectWithValue }) => {
    try {
      return await objectiveApi.getTeamObjectiveProgress(teamId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch team objective progress');
    }
  }
);

export const fetchPlayerBonusSummary = createAsyncThunk(
  'objectives/fetchPlayerBonuses',
  async ({ playerId, startDate, endDate }: { playerId: number; startDate?: string; endDate?: string }, { rejectWithValue }) => {
    try {
      return await objectiveApi.getPlayerBonusSummary(playerId, startDate, endDate);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch player bonus summary');
    }
  }
);

export const completeObjective = createAsyncThunk(
  'objectives/completeObjective',
  async ({ playerId, objectiveId, completeData }: { playerId: number; objectiveId: number; completeData: CompleteObjectiveDto }, { rejectWithValue }) => {
    try {
      return await objectiveApi.completeObjective(playerId, objectiveId, completeData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to complete objective');
    }
  }
);

export const updateObjectiveProgress = createAsyncThunk(
  'objectives/updateProgress',
  async ({ playerId, objectiveId, updateData }: { playerId: number; objectiveId: number; updateData: UpdateObjectiveProgressDto }, { rejectWithValue }) => {
    try {
      return await objectiveApi.updateObjectiveProgress(playerId, objectiveId, updateData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update objective progress');
    }
  }
);

export const deleteObjectiveProgress = createAsyncThunk(
  'objectives/deleteProgress',
  async ({ playerId, objectiveId }: { playerId: number; objectiveId: number }, { rejectWithValue }) => {
    try {
      await objectiveApi.deleteObjectiveProgress(playerId, objectiveId);
      return { playerId, objectiveId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete objective progress');
    }
  }
);

const objectivesSlice = createSlice({
  name: 'objectives',
  initialState,
  reducers: {
    setSelectedGroup(state, action: PayloadAction<number | null>) {
      state.selectedGroupId = action.payload;
    },
    setSelectedObjective(state, action: PayloadAction<number | null>) {
      state.selectedObjectiveId = action.payload;
    },
    clearErrors(state) {
      state.error = {
        groups: null,
        objectives: null,
        progress: null,
        bonuses: null
      };
    }
  },
  extraReducers: (builder) => {
    // Objective groups
    builder
      .addCase(fetchObjectiveGroups.pending, (state) => {
        state.loading.groups = true;
        state.error.groups = null;
      })
      .addCase(fetchObjectiveGroups.fulfilled, (state, action) => {
        state.loading.groups = false;
        state.groups = action.payload;
      })
      .addCase(fetchObjectiveGroups.rejected, (state, action) => {
        state.loading.groups = false;
        state.error.groups = action.payload as string;
      });

    builder
      .addCase(createObjectiveGroup.fulfilled, (state, action) => {
        state.groups.push(action.payload);
      });

    builder
      .addCase(updateObjectiveGroup.fulfilled, (state, action) => {
        const index = state.groups.findIndex((group: ObjectiveGroup) => group.id === action.payload.id);
        if (index !== -1) {
          state.groups[index] = action.payload;
        }
      });

    builder
      .addCase(deleteObjectiveGroup.fulfilled, (state, action) => {
        state.groups = state.groups.filter((group: ObjectiveGroup) => group.id !== action.payload);
        if (state.selectedGroupId === action.payload) {
          state.selectedGroupId = null;
        }
      });

    // Group-to-Player Assignment reducers
    builder
      .addCase(assignGroupToPlayers.fulfilled, () => {
        // Re-fetch groups to get updated assignedPlayers data
        // The thunk should trigger a re-fetch in the component
      });

    builder
      .addCase(fetchGroupAssignedPlayers.fulfilled, (state, action) => {
        const { groupId, players } = action.payload;
        const groupIndex = state.groups.findIndex((group: ObjectiveGroup) => group.id === groupId);
        if (groupIndex !== -1) {
          state.groups[groupIndex].assignedPlayers = players;
        }
      });

    builder
      .addCase(removeGroupFromPlayers.fulfilled, () => {
        // Re-fetch groups to get updated assignedPlayers data
        // The thunk should trigger a re-fetch in the component
      });

    // Objectives
    builder
      .addCase(fetchObjectives.pending, (state) => {
        state.loading.objectives = true;
        state.error.objectives = null;
      })
      .addCase(fetchObjectives.fulfilled, (state, action) => {
        state.loading.objectives = false;
        state.objectives = action.payload;
      })
      .addCase(fetchObjectives.rejected, (state, action) => {
        state.loading.objectives = false;
        state.error.objectives = action.payload as string;
      });

    builder
      .addCase(createObjective.fulfilled, (state, action) => {
        state.objectives.push(action.payload);
      });

    builder
      .addCase(updateObjective.fulfilled, (state, action) => {
        const index = state.objectives.findIndex((objective: Objective) => objective.id === action.payload.id);
        if (index !== -1) {
          state.objectives[index] = action.payload;
        }
      });

    builder
      .addCase(deleteObjective.fulfilled, (state, action) => {
        state.objectives = state.objectives.filter((objective: Objective) => objective.id !== action.payload);
        if (state.selectedObjectiveId === action.payload) {
          state.selectedObjectiveId = null;
        }
      });

    // Player progress
    builder
      .addCase(fetchPlayerObjectiveProgress.pending, (state) => {
        state.loading.progress = true;
        state.error.progress = null;
      })
      .addCase(fetchPlayerObjectiveProgress.fulfilled, (state, action) => {
        state.loading.progress = false;
        const { playerId, progress } = action.payload;
        console.log(`[Redux] Player ${playerId} progress received:`, progress.length, 'items');
        
        // Remove existing progress for this player and add new progress
        // Use a Map to ensure uniqueness by progress ID + player ID
        const progressMap = new Map();
        
        // Add existing progress (except for this player)
        state.playerProgress
          .filter(p => (p as any).__playerId !== playerId)
          .forEach(p => {
            const key = `${p.id}-${(p as any).__playerId}`;
            progressMap.set(key, p);
          });
        
        // Add new progress for this player
        progress.forEach(p => {
          const key = `${p.id}-${playerId}`;
          progressMap.set(key, p);
        });
        
        // Convert back to array
        state.playerProgress = Array.from(progressMap.values());
      })
      .addCase(fetchPlayerObjectiveProgress.rejected, (state, action) => {
        state.loading.progress = false;
        state.error.progress = action.payload as string;
      });

    // Team progress
    builder
      .addCase(fetchTeamObjectiveProgress.pending, (state) => {
        state.loading.progress = true;
        state.error.progress = null;
      })
      .addCase(fetchTeamObjectiveProgress.fulfilled, (state, action) => {
        state.loading.progress = false;
        state.teamProgress = action.payload;
      })
      .addCase(fetchTeamObjectiveProgress.rejected, (state, action) => {
        state.loading.progress = false;
        state.error.progress = action.payload as string;
      });

    // Bonuses
    builder
      .addCase(fetchPlayerBonusSummary.pending, (state) => {
        state.loading.bonuses = true;
        state.error.bonuses = null;
      })
      .addCase(fetchPlayerBonusSummary.fulfilled, (state, action) => {
        state.loading.bonuses = false;
        state.playerBonusSummary = action.payload;
      })
      .addCase(fetchPlayerBonusSummary.rejected, (state, action) => {
        state.loading.bonuses = false;
        state.error.bonuses = action.payload as string;
      });

    builder
      .addCase(bulkAssignObjective.fulfilled, (state, action) => {
        // API returns clean data with proper IDs - use Map to prevent duplicates
        console.log('[Redux] Bulk assign - received:', action.payload.length, 'items');
        
        const progressMap = new Map();
        
        // Add existing progress
        state.playerProgress.forEach(p => {
          const key = `${p.id}-${(p as any).__playerId}`;
          progressMap.set(key, p);
        });
        
        // Add new progress (will overwrite if duplicate keys exist)
        action.payload.forEach(p => {
          const key = `${p.id}-${(p as any).__playerId}`;
          progressMap.set(key, p);
        });
        
        // Convert back to array
        state.playerProgress = Array.from(progressMap.values());
      });

    builder
      .addCase(completeObjective.fulfilled, (state, action) => {
        const index = state.playerProgress.findIndex((progress: PlayerObjectiveProgress) => progress.id === action.payload.id);
        if (index !== -1) {
          state.playerProgress[index] = action.payload;
        }
      });

    builder
      .addCase(updateObjectiveProgress.fulfilled, (state, action) => {
        const index = state.playerProgress.findIndex((progress: PlayerObjectiveProgress) => progress.id === action.payload.id);
        if (index !== -1) {
          state.playerProgress[index] = action.payload;
        }
      });

    builder
      .addCase(deleteObjectiveProgress.fulfilled, (state, action) => {
        const { objectiveId } = action.payload;
        // Since progress is fetched per player, we can filter by objective ID only
        state.playerProgress = state.playerProgress.filter(
          (progress: PlayerObjectiveProgress) => 
            progress.objective.id !== objectiveId
        );
      });
  }
});

export const { setSelectedGroup, setSelectedObjective, clearErrors } = objectivesSlice.actions;
export default objectivesSlice.reducer;
