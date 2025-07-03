import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Player, CreatePlayerDto, UpdatePlayerDto, CreateContractDto } from '@/lib/types/team-management';
import { playerService } from '@/lib/team-management-services';

// Player state interface
interface PlayerState {
  players: Player[];
  selectedPlayer: Player | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: PlayerState = {
  players: [],
  selectedPlayer: null,
  loading: false,
  error: null,
};

// Async thunks for player operations
export const fetchAllPlayers = createAsyncThunk('players/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const players = await playerService.getAllPlayers();
    console.log('Fetched players from API:', players);
    
    // Log if any players have team objects but not teamId or vice versa
    const playersWithTeamNoId = players.filter(p => p.team && !p.teamId);
    const playersWithIdNoTeam = players.filter(p => p.teamId && !p.team);
    
    if (playersWithTeamNoId.length > 0) {
      console.log(`Found ${playersWithTeamNoId.length} players with team object but no teamId`);
    }
    
    if (playersWithIdNoTeam.length > 0) {
      console.log(`Found ${playersWithIdNoTeam.length} players with teamId but no team object`);
    }
    
    return players;
  } catch (error) {
    console.error('Error fetching players:', error);
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch players');
  }
});

export const fetchPlayerById = createAsyncThunk('players/fetchById', async (id: number, { rejectWithValue }) => {
  try {
    return await playerService.getPlayerById(id);
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch player');
  }
});

export const createPlayer = createAsyncThunk(
  'players/create',
  async (playerData: CreatePlayerDto, { rejectWithValue }) => {
    try {
      console.log('Creating player in Redux with:', playerData);
      const response = await playerService.createPlayer(playerData);
      console.log('Player created successfully, server response:', response);
      return response;
    } catch (error) {
      console.error('Failed to create player:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create player');
    }
  }
);

export const updatePlayer = createAsyncThunk(
  'players/update',
  async ({ id, playerData }: { id: number; playerData: UpdatePlayerDto }, { rejectWithValue }) => {
    try {
      return await playerService.updatePlayer(id, playerData);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update player');
    }
  }
);

export const deletePlayer = createAsyncThunk('players/delete', async (id: number, { rejectWithValue }) => {
  try {
    await playerService.deletePlayer(id);
    return id;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete player');
  }
});

export const createPlayerContract = createAsyncThunk(
  'players/createContract',
  async ({ playerId, contractData }: { playerId: number; contractData: CreateContractDto }, { rejectWithValue }) => {
    try {
      return {
        contract: await playerService.createPlayerContract(playerId, contractData),
        playerId
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create contract');
    }
  }
);

export const fetchPlayerObjectives = createAsyncThunk(
  'players/fetchObjectives',
  async (playerId: number, { rejectWithValue }) => {
    try {
      return {
        objectives: await playerService.getPlayerObjectives(playerId),
        playerId
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch player objectives');
    }
  }
);

export const fetchPlayerMatches = createAsyncThunk(
  'players/fetchMatches',
  async (playerId: number, { rejectWithValue }) => {
    try {
      return {
        matches: await playerService.getPlayerMatches(playerId),
        playerId
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch player matches');
    }
  }
);

// Player slice
const playerSlice = createSlice({
  name: 'players',
  initialState,
  reducers: {
    selectPlayer(state, action: PayloadAction<Player>) {
      state.selectedPlayer = action.payload;
    },
    clearSelectedPlayer(state) {
      state.selectedPlayer = null;
    },
    clearPlayerErrors(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all players
      .addCase(fetchAllPlayers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllPlayers.fulfilled, (state, action: PayloadAction<Player[]>) => {
        state.players = action.payload;
        state.loading = false;
      })
      .addCase(fetchAllPlayers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch player by id
      .addCase(fetchPlayerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlayerById.fulfilled, (state, action: PayloadAction<Player>) => {
        state.selectedPlayer = action.payload;
        state.loading = false;
      })
      .addCase(fetchPlayerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create player
      .addCase(createPlayer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPlayer.fulfilled, (state, action: PayloadAction<Player>) => {
        state.players.push(action.payload);
        state.selectedPlayer = action.payload;
        state.loading = false;
      })
      .addCase(createPlayer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update player
      .addCase(updatePlayer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePlayer.fulfilled, (state, action: PayloadAction<Player>) => {
        const index = state.players.findIndex(player => player.id === action.payload.id);
        if (index !== -1) {
          state.players[index] = action.payload;
        }
        state.selectedPlayer = action.payload;
        state.loading = false;
      })
      .addCase(updatePlayer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete player
      .addCase(deletePlayer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePlayer.fulfilled, (state, action: PayloadAction<number>) => {
        state.players = state.players.filter(player => player.id !== action.payload);
        if (state.selectedPlayer?.id === action.payload) {
          state.selectedPlayer = null;
        }
        state.loading = false;
      })
      .addCase(deletePlayer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create contract
      .addCase(createPlayerContract.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPlayerContract.fulfilled, (state, action) => {
        const { contract, playerId } = action.payload;
        // Update player in list
        const playerIndex = state.players.findIndex(player => player.id === playerId);
        if (playerIndex !== -1) {
          state.players[playerIndex].contract = contract;
        }
        // Update selected player if matching
        if (state.selectedPlayer?.id === playerId) {
          state.selectedPlayer = {
            ...state.selectedPlayer,
            contract
          };
        }
        state.loading = false;
      })
      .addCase(createPlayerContract.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { selectPlayer, clearSelectedPlayer, clearPlayerErrors } = playerSlice.actions;
export default playerSlice.reducer;
