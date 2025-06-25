import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Team, CreateTeamDto, UpdateTeamDto } from '@/lib/types/team-management';
import { teamService } from '@/lib/team-management-services';

// Team state interface
interface TeamState {
  teams: Team[];
  selectedTeam: Team | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: TeamState = {
  teams: [],
  selectedTeam: null,
  loading: false,
  error: null,
};

// Async thunks for team operations
export const fetchAllTeams = createAsyncThunk('teams/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await teamService.getAllTeams();
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch teams');
  }
});

export const fetchTeamById = createAsyncThunk('teams/fetchById', async (id: number, { rejectWithValue }) => {
  try {
    return await teamService.getTeamById(id);
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch team');
  }
});

export const createTeam = createAsyncThunk(
  'teams/create',
  async (teamData: CreateTeamDto, { rejectWithValue }) => {
    try {
      return await teamService.createTeam(teamData);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create team');
    }
  }
);

export const updateTeam = createAsyncThunk(
  'teams/update',
  async ({ id, teamData }: { id: number; teamData: UpdateTeamDto }, { rejectWithValue }) => {
    try {
      return await teamService.updateTeam(id, teamData);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update team');
    }
  }
);

export const deleteTeam = createAsyncThunk('teams/delete', async (id: number, { rejectWithValue }) => {
  try {
    await teamService.deleteTeam(id);
    return id;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete team');
  }
});

// Team slice
const teamSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    selectTeam(state, action: PayloadAction<Team>) {
      state.selectedTeam = action.payload;
    },
    clearSelectedTeam(state) {
      state.selectedTeam = null;
    },
    clearTeamErrors(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all teams
      .addCase(fetchAllTeams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllTeams.fulfilled, (state, action: PayloadAction<Team[]>) => {
        state.teams = action.payload;
        state.loading = false;
      })
      .addCase(fetchAllTeams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch team by id
      .addCase(fetchTeamById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamById.fulfilled, (state, action: PayloadAction<Team>) => {
        state.selectedTeam = action.payload;
        state.loading = false;
      })
      .addCase(fetchTeamById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create team
      .addCase(createTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTeam.fulfilled, (state, action: PayloadAction<Team>) => {
        state.teams.push(action.payload);
        state.selectedTeam = action.payload;
        state.loading = false;
      })
      .addCase(createTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update team
      .addCase(updateTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTeam.fulfilled, (state, action: PayloadAction<Team>) => {
        const index = state.teams.findIndex(team => team.id === action.payload.id);
        if (index !== -1) {
          state.teams[index] = action.payload;
        }
        state.selectedTeam = action.payload;
        state.loading = false;
      })
      .addCase(updateTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete team
      .addCase(deleteTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTeam.fulfilled, (state, action: PayloadAction<number>) => {
        state.teams = state.teams.filter(team => team.id !== action.payload);
        if (state.selectedTeam?.id === action.payload) {
          state.selectedTeam = null;
        }
        state.loading = false;
      })
      .addCase(deleteTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { selectTeam, clearSelectedTeam, clearTeamErrors } = teamSlice.actions;
export default teamSlice.reducer;
