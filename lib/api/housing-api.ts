import { api } from '../api';

export type HousingStatus = 'available' | 'occupied' | 'maintenance';
export type HousingType = 'apartment' | 'villa' | 'studio' | 'house';
export type AllocationType = 'employee' | 'player' | 'staff' | 'team';

export interface Housing {
  id: number;
  name: string;
  address: string;
  type: HousingType;
  capacity: number;
  status: HousingStatus;
  monthlyRent?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  allocations?: HousingAllocation[];
}

export interface HousingAllocation {
  id: number;
  housingId: number;
  allocationType: AllocationType;
  allocatedTo: string;
  allocatedToId: number;
  startDate: string;
  endDate?: string;
  monthlyRent: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  housing?: Housing;
}

export interface CreateHousingDto {
  name: string;
  address: string;
  type: HousingType;
  capacity: number;
  status: HousingStatus;
  monthlyRent?: number;
  description?: string;
}

export interface UpdateHousingDto extends Partial<CreateHousingDto> {
    temp?: string;
}

export interface CreateHousingAllocationDto {
  housingId: number;
  allocationType: AllocationType;
  allocatedTo: string;
  allocatedToId: number;
  startDate: string;
  endDate?: string;
  monthlyRent: number;
  notes?: string;
}

export interface UpdateHousingAllocationDto
  extends Partial<CreateHousingAllocationDto> {
    temp?: string;
  }

export interface HousingStatistics {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
}

// Housing API
export const housingApi = {
  // Get all housings
  getAll: async (): Promise<Housing[]> => {
    return api.fetch<Housing[]>('/housing', {
      method: 'GET',
    });
  },

  // Get housing by ID
  getById: async (id: number): Promise<Housing> => {
    return api.fetch<Housing>(`/housing/${id}`, {
      method: 'GET',
    });
  },

  // Get housing statistics
  getStatistics: async (): Promise<HousingStatistics> => {
    return api.fetch<HousingStatistics>('/housing/statistics', {
      method: 'GET',
    });
  },

  // Create housing
  create: async (data: CreateHousingDto): Promise<Housing> => {
    return api.fetch<Housing>('/housing', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update housing
  update: async (id: number, data: UpdateHousingDto): Promise<Housing> => {
    return api.fetch<Housing>(`/housing/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Delete housing
  delete: async (id: number): Promise<void> => {
    return api.fetch<void>(`/housing/${id}`, {
      method: 'DELETE',
    });
  },
};

// Housing Allocation API
export const housingAllocationApi = {
  // Get all allocations
  getAll: async (): Promise<HousingAllocation[]> => {
    return api.fetch<HousingAllocation[]>('/housing-allocations', {
      method: 'GET',
    });
  },

  // Get allocation by ID
  getById: async (id: number): Promise<HousingAllocation> => {
    return api.fetch<HousingAllocation>(`/housing-allocations/${id}`, {
      method: 'GET',
    });
  },

  // Get allocations by housing ID
  getByHousingId: async (housingId: number): Promise<HousingAllocation[]> => {
    return api.fetch<HousingAllocation[]>(
      `/housing-allocations/housing/${housingId}`,
      {
        method: 'GET',
      },
    );
  },

  // Create allocation
  create: async (
    data: CreateHousingAllocationDto,
  ): Promise<HousingAllocation> => {
    return api.fetch<HousingAllocation>('/housing-allocations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update allocation
  update: async (
    id: number,
    data: UpdateHousingAllocationDto,
  ): Promise<HousingAllocation> => {
    return api.fetch<HousingAllocation>(`/housing-allocations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Delete allocation
  delete: async (id: number): Promise<void> => {
    return api.fetch<void>(`/housing-allocations/${id}`, {
      method: 'DELETE',
    });
  },
};
