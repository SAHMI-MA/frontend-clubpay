import { api, tokenUtils } from "@/lib/api";
import { getApiUrl } from "@/lib/api-config";

// Helper functions to transform API responses
const transformPlayerContract = (contract: any): PlayerContract => {
  let contractFile = contract.contractFile;
  if (
    contractFile &&
    contractFile.url &&
    typeof contractFile.url === 'string' &&
    contractFile.url !== '' &&
    contractFile.url !== 'undefined'
  ) {
    contractFile = { ...contractFile, url: getApiUrl(contractFile.url) };
  } else {
    contractFile = undefined;
  }
  return {
    ...contract,
    id: contract.id?.toString(),
    salary: typeof contract.salary === 'string' ? parseFloat(contract.salary) : contract.salary,
    status: contract.status?.toLowerCase() || 'draft',
    hasBonus: contract.hasBonus || false,
    playerName: contract.player ? `${contract.player.firstName} ${contract.player.lastName}` : undefined,
    position: contract.player?.position || contract.position,
    playerId: contract.player?.id?.toString(),
    contractFile,
  };
};

const transformStaffContract = (contract: any): StaffContract => {
  let contractFile = contract.contractFile;
  if (
    contractFile &&
    contractFile.url &&
    typeof contractFile.url === 'string' &&
    contractFile.url !== '' &&
    contractFile.url !== 'undefined'
  ) {
    contractFile = { ...contractFile, url: getApiUrl(contractFile.url) };
  } else {
    contractFile = undefined;
  }
  return {
    ...contract,
    id: contract.id?.toString(),
    salary: typeof contract.salary === 'string' ? parseFloat(contract.salary) : contract.salary,
    status: contract.status?.toLowerCase() || 'draft',
    hasBonus: contract.hasBonus || false,
    staffName: contract.staff ? `${contract.staff.firstName} ${contract.staff.lastName}` : undefined,
    role: contract.staff?.role || contract.role,
    department: contract.staff?.department || contract.department,
    staffId: contract.staff?.id?.toString(),
    contractFile,
  };
};

// Contract types
export interface BaseContractFields {
  id: string | number;
  title: string;
  salary: number | string;
  startDate: string;
  endDate: string;
  terminationDate?: string;
  status: 'ACTIVE' | 'TERMINATED' | 'EXPIRED' | 'PENDING' | 'DRAFT' | 'active' | 'terminated' | 'expired' | 'pending' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface PlayerContract extends BaseContractFields {
  playerId?: string;
  playerName?: string; // Computed field
  position?: string;
  signatureBonus?: number;
  hasBonus?: boolean;
  description?: string;
  player?: {
    id: number;
    firstName: string;
    lastName: string;
    position: string;
    team?: {
      id: number;
      name: string;
    };
  };
  contractFile?: {
    id: number;
    fileName: string;
    fileType: string;
    fileSize: number;
    url: string;
    createdAt: string;
    updatedAt: string;
    description: string | null;
  };
}

export interface StaffContract extends BaseContractFields {
  staffId?: string;
  staffName?: string; // Computed field
  department?: string;
  role?: string;
  signatureBonus?: number;
  hasBonus?: boolean;
  benefits?: {
    healthInsurance?: boolean;
    carAllowance?: number;
    accommodation?: boolean;
    continuingEducation?: number;
    bonusStructure?: string;
    [key: string]: any;
  };
  terms?: string;
  description?: string;
  staff?: {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
    team?: {
      id: number;
      name: string;
    };
  };
  contractFile?: {
    id: number;
    fileName: string;
    fileType: string;
    fileSize: number;
    url: string;
    createdAt: string;
    updatedAt: string;
    description: string | null;
  };
}



// DTOs for contract creation and updates
export interface CreatePlayerContractDto {
  title: string;
  playerId: string;
  salary: number;
  startDate: string;
  endDate: string;
  hasBonus: boolean;
  signatureBonus?: number;
  description?: string;
}

export interface UpdatePlayerContractDto {
  title?: string;
  salary?: number;
  startDate?: string;
  endDate?: string;
  hasBonus?: boolean;
  signatureBonus?: number;
  description?: string;
  contractFileId?: number;
}

export interface CreateStaffContractDto {
  title: string;
  staffId: string;
  salary: number;
  startDate: string;
  endDate: string;
  hasBonus: boolean;
  signatureBonus?: number;
  benefits?: any;
  terms?: string;
  description?: string;
}

export interface UpdateStaffContractDto {
  title?: string;
  salary?: number;
  startDate?: string;
  endDate?: string;
  hasBonus?: boolean;
  signatureBonus?: number;
  benefits?: any;
  terms?: string;
  description?: string;
}



// Contract API functions
export const contractApi = {
  // Authentication check helper
  _ensureAuthenticated() {
    if (!tokenUtils.hasAuthToken()) {
      throw new Error('Authentication required: Please login to access contract management features.');
    }
  },

  // Get all contracts with optional filtering
  async getContracts(type?: string, status?: string): Promise<{ player: PlayerContract[]; staff: StaffContract[] } | PlayerContract[] | StaffContract[]> {
    this._ensureAuthenticated();
    
    let endpoint = 'contracts';
    if (type || status) {
      endpoint += '?';
      if (type) endpoint += `type=${type}`;
      if (type && status) endpoint += '&';
      if (status) endpoint += `status=${status}`;
    }
    
    console.log(`🔍 Fetching contracts with filters - Type: ${type || 'all'}, Status: ${status || 'all'}`);
    const response = await api.get<any>(endpoint);
    
    // Handle the response structure based on the type
    if (!type) {
      // Return all contracts (both player and staff)
      return {
        player: (response.player || []).map(transformPlayerContract),
        staff: (response.staff || []).map(transformStaffContract)
      };
    } else if (type === 'player') {
      // Return only player contracts
      return Array.isArray(response) ? response.map(transformPlayerContract) : (response.player || []).map(transformPlayerContract);
    } else if (type === 'staff') {
      // Return only staff contracts
      return Array.isArray(response) ? response.map(transformStaffContract) : (response.staff || []).map(transformStaffContract);
    }
    
    return response;
  },

  // Get specific contract by ID
  async getContractById(id: string, type: 'player' | 'staff'): Promise<PlayerContract | StaffContract> {
    this._ensureAuthenticated();
    
    console.log(`📄 Fetching ${type} contract with ID: ${id}`);
    return await api.get<PlayerContract | StaffContract>(`contracts/${id}?type=${type}`);
  },

  // Player contract endpoints
  async createPlayerContract(data: CreatePlayerContractDto): Promise<PlayerContract> {
    this._ensureAuthenticated();
    
    const playerId = data.playerId;
    console.log(`➕ Creating player contract for player ID: ${playerId}`);
    return await api.post<PlayerContract>(`contracts/player/${playerId}`, data);
  },

  async updatePlayerContract(id: string, data: UpdatePlayerContractDto): Promise<PlayerContract> {
    this._ensureAuthenticated();
    
    console.log(`✏️ Updating player contract ID: ${id}`);
    return await api.patch<PlayerContract>(`contracts/player/${id}`, data);
  },

  async deletePlayerContract(id: string): Promise<void> {
    this._ensureAuthenticated();
    
    console.log(`🗑️ Deleting player contract ID: ${id}`);
    await api.delete<void>(`contracts/player/${id}`);
  },

  // Staff contract endpoints
  async createStaffContract(data: CreateStaffContractDto): Promise<StaffContract> {
    this._ensureAuthenticated();
    
    const staffId = data.staffId;
    console.log(`➕ Creating staff contract for staff ID: ${staffId}`);
    return await api.post<StaffContract>(`contracts/staff/${staffId}`, data);
  },

  async updateStaffContract(id: string, data: UpdateStaffContractDto): Promise<StaffContract> {
    this._ensureAuthenticated();
    
    console.log(`✏️ Updating staff contract ID: ${id}`);
    return await api.patch<StaffContract>(`contracts/staff/${id}`, data);
  },

  async deleteStaffContract(id: string): Promise<void> {
    this._ensureAuthenticated();
    
    console.log(`🗑️ Deleting staff contract ID: ${id}`);
    await api.delete<void>(`contracts/staff/${id}`);
  },

  // Contract termination
  async terminatePlayerContract(id: string, terminationDate: string, reason?: string): Promise<PlayerContract> {
    this._ensureAuthenticated();
    
    console.log(`🔚 Terminating player contract ID: ${id} on ${terminationDate}`);
    return await api.patch<PlayerContract>(`contracts/player/${id}`, { 
      terminationDate, 
      reason,
      status: 'terminated'
    });
  },

  async terminateStaffContract(id: string, terminationDate: string, reason?: string): Promise<StaffContract> {
    this._ensureAuthenticated();
    
    console.log(`🔚 Terminating staff contract ID: ${id} on ${terminationDate}`);
    return await api.patch<StaffContract>(`contracts/staff/${id}`, { 
      terminationDate, 
      reason,
      status: 'terminated'
    });
  },

};
