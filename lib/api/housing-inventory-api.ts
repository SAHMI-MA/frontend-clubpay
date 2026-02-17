import { api } from '../api';

export enum ItemCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  DAMAGED = 'damaged',
  MISSING = 'missing',
}

export interface HousingInventoryItem {
  id: number;
  housingId: number;
  designation: string;
  quantity: number;
  entryCondition: ItemCondition;
  exitCondition?: ItemCondition;
  observation?: string;
  replacementCost?: number;
  isDamaged: boolean;
  deductionAmount?: number;
  createdAt: string;
  updatedAt: string;
  housing?: {
    id: number;
    name: string;
  };
}

export interface CreateHousingInventoryItemDto {
  housingId: number;
  designation: string;
  quantity: number;
  entryCondition: ItemCondition;
  exitCondition?: ItemCondition;
  observation?: string;
  replacementCost?: number;
}

export interface UpdateHousingInventoryItemDto {
  designation?: string;
  quantity?: number;
  entryCondition?: ItemCondition;
  exitCondition?: ItemCondition;
  observation?: string;
  replacementCost?: number;
}

export const housingInventoryApi = {
  getAll: async (): Promise<HousingInventoryItem[]> => {
    return api.fetch('/housing-inventory');
  },

  getByHousing: async (housingId: number): Promise<HousingInventoryItem[]> => {
    return api.fetch(`/housing-inventory/housing/${housingId}`);
  },

  getOne: async (id: number): Promise<HousingInventoryItem> => {
    return api.fetch(`/housing-inventory/${id}`);
  },

  create: async (data: CreateHousingInventoryItemDto): Promise<HousingInventoryItem> => {
    return api.fetch('/housing-inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: UpdateHousingInventoryItemDto): Promise<HousingInventoryItem> => {
    return api.fetch(`/housing-inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return api.fetch(`/housing-inventory/${id}`, {
      method: 'DELETE',
    });
  },

  getDamaged: async (): Promise<HousingInventoryItem[]> => {
    return api.fetch('/housing-inventory/damaged');
  },

  getTotalDeductions: async (housingId: number): Promise<{ housingId: number; totalDeductions: number }> => {
    return api.fetch(`/housing-inventory/deductions/${housingId}`);
  },
};
