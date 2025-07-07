import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as matchApi from '../api/match-api';
import {
  Match,
  MatchParticipation,
  Team,
  CreateMatchDto,
  UpdateMatchDto,
  CreateMatchParticipationDto,
  UpdateMatchParticipationDto
} from '../types/match-management';

interface MatchState {
  matches: Match[];
  participations: MatchParticipation[];
  teams: Team[];
  selectedMatchId: number | null;
  loading: {
    matches: boolean;
    participations: boolean;
    teams: boolean;
  };
  error: {
    matches: string | null;
    participations: string | null;
    teams: string | null;
  };
}

const initialState: MatchState = {
  matches: [],
  participations: [],
  teams: [],
  selectedMatchId: null,
  loading: {
    matches: false,
    participations: false,
    teams: false,
  },
  error: {
    matches: null,
    participations: null,
    teams: null,
  },
};

// Async thunks for matches
export const fetchAllMatches = createAsyncThunk(
  'matches/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching matches...');
      const result = await matchApi.getAllMatches();
      console.log('Matches fetched successfully:', result);
      return result;
    } catch (error: any) {
      console.error('Failed to fetch matches:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error statusCode:', error.response?.data?.statusCode);
      console.error('Error detailed message:', error.response?.data?.message);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      // Log the specific error format from the API
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch matches';
      const statusCode = error.response?.status || error.response?.data?.statusCode;
      console.error(`API Error [${statusCode}]: ${Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage}`);
      
      return rejectWithValue(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    }
  }
);

export const fetchMatchById = createAsyncThunk(
  'matches/fetchById',
  async (matchId: number, { rejectWithValue }) => {
    try {
      return await matchApi.getMatchById(matchId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch match');
    }
  }
);

export const createMatch = createAsyncThunk(
  'matches/create',
  async (matchData: CreateMatchDto, { rejectWithValue }) => {
    try {
      console.log('Creating match with data:', matchData);
      const result = await matchApi.createMatch(matchData);
      console.log('Match created successfully:', result);
      return result;
    } catch (error: any) {
      console.error('Failed to create match:', error);
      console.error('Create match error message:', error.message);
      console.error('Create match error response:', error.response?.data);
      console.error('Create match error status:', error.response?.status);
      console.error('Create match error statusCode:', error.response?.data?.statusCode);
      console.error('Create match error detailed message:', error.response?.data?.message);
      console.error('Create match full error object:', JSON.stringify(error, null, 2));
      
      // Log the specific error format from the API
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create match';
      const statusCode = error.response?.status || error.response?.data?.statusCode;
      console.error(`Create Match API Error [${statusCode}]: ${Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage}`);
      
      return rejectWithValue(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    }
  }
);

export const updateMatch = createAsyncThunk(
  'matches/update',
  async ({ matchId, matchData }: { matchId: number; matchData: UpdateMatchDto }, { rejectWithValue }) => {
    try {
      return await matchApi.updateMatch(matchId, matchData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update match');
    }
  }
);

export const deleteMatch = createAsyncThunk(
  'matches/delete',
  async (matchId: number, { rejectWithValue }) => {
    try {
      await matchApi.deleteMatch(matchId);
      return matchId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete match');
    }
  }
);

// Async thunks for participations
export const fetchMatchParticipations = createAsyncThunk(
  'matches/fetchParticipations',
  async (matchId: number, { rejectWithValue }) => {
    try {
      return await matchApi.getMatchParticipations(matchId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch participations');
    }
  }
);

export const addPlayerToMatch = createAsyncThunk(
  'matches/addPlayer',
  async ({ matchId, participationData }: { matchId: number; participationData: CreateMatchParticipationDto }, { rejectWithValue }) => {
    try {
      return await matchApi.addPlayerToMatch(matchId, participationData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add player to match');
    }
  }
);

export const updateMatchParticipation = createAsyncThunk(
  'matches/updateParticipation',
  async ({ 
    matchId, 
    participationId, 
    participationData 
  }: { 
    matchId: number; 
    participationId: number; 
    participationData: UpdateMatchParticipationDto 
  }, { rejectWithValue }) => {
    try {
      return await matchApi.updateMatchParticipation(matchId, participationId, participationData);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update participation');
    }
  }
);

export const removePlayerFromMatch = createAsyncThunk(
  'matches/removePlayer',
  async ({ matchId, participationId }: { matchId: number; participationId: number }, { rejectWithValue }) => {
    try {
      await matchApi.removePlayerFromMatch(matchId, participationId);
      return participationId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove player from match');
    }
  }
);

// Async thunks for teams
export const fetchAllTeams = createAsyncThunk(
  'matches/fetchTeams',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching teams...');
      const result = await matchApi.getAllTeams();
      console.log('Teams fetched successfully:', result);
      return result;
    } catch (error: any) {
      console.error('Failed to fetch teams:', error);
      console.error('Teams error message:', error.message);
      console.error('Teams error response:', error.response?.data);
      console.error('Teams error status:', error.response?.status);
      console.error('Teams error statusCode:', error.response?.data?.statusCode);
      console.error('Teams error detailed message:', error.response?.data?.message);
      console.error('Teams full error object:', JSON.stringify(error, null, 2));
      
      // Log the specific error format from the API
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch teams';
      const statusCode = error.response?.status || error.response?.data?.statusCode;
      console.error(`Teams API Error [${statusCode}]: ${Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage}`);
      
      return rejectWithValue(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    }
  }
);

const matchSlice = createSlice({
  name: 'matches',
  initialState,
  reducers: {
    setSelectedMatch: (state, action: PayloadAction<number | null>) => {
      state.selectedMatchId = action.payload;
    },
    clearErrors: (state) => {
      state.error = {
        matches: null,
        participations: null,
        teams: null,
      };
    },
  },
  extraReducers: (builder) => {
    // Matches
    builder
      .addCase(fetchAllMatches.pending, (state) => {
        state.loading.matches = true;
        state.error.matches = null;
      })
      .addCase(fetchAllMatches.fulfilled, (state, action) => {
        state.loading.matches = false;
        state.matches = action.payload;
      })
      .addCase(fetchAllMatches.rejected, (state, action) => {
        state.loading.matches = false;
        state.error.matches = action.payload as string;
      });

    builder
      .addCase(createMatch.fulfilled, (state, action) => {
        state.matches.push(action.payload);
      });

    builder
      .addCase(updateMatch.fulfilled, (state, action) => {
        const index = state.matches.findIndex(match => match.id === action.payload.id);
        if (index !== -1) {
          state.matches[index] = action.payload;
        }
      });

    builder
      .addCase(deleteMatch.fulfilled, (state, action) => {
        state.matches = state.matches.filter(match => match.id !== action.payload);
        if (state.selectedMatchId === action.payload) {
          state.selectedMatchId = null;
        }
      });

    // Participations
    builder
      .addCase(fetchMatchParticipations.pending, (state) => {
        state.loading.participations = true;
        state.error.participations = null;
      })
      .addCase(fetchMatchParticipations.fulfilled, (state, action) => {
        state.loading.participations = false;
        state.participations = action.payload;
      })
      .addCase(fetchMatchParticipations.rejected, (state, action) => {
        state.loading.participations = false;
        state.error.participations = action.payload as string;
      });

    builder
      .addCase(addPlayerToMatch.fulfilled, (state, action) => {
        state.participations.push(action.payload);
      });

    builder
      .addCase(updateMatchParticipation.fulfilled, (state, action) => {
        const index = state.participations.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.participations[index] = action.payload;
        }
      });

    builder
      .addCase(removePlayerFromMatch.fulfilled, (state, action) => {
        state.participations = state.participations.filter(p => p.id !== action.payload);
      });

    // Teams
    builder
      .addCase(fetchAllTeams.pending, (state) => {
        state.loading.teams = true;
        state.error.teams = null;
      })
      .addCase(fetchAllTeams.fulfilled, (state, action) => {
        state.loading.teams = false;
        state.teams = action.payload;
      })
      .addCase(fetchAllTeams.rejected, (state, action) => {
        state.loading.teams = false;
        state.error.teams = action.payload as string;
      });
  },
});

export const { setSelectedMatch, clearErrors } = matchSlice.actions;
export default matchSlice.reducer;
