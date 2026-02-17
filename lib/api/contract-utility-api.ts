import { api } from '../api';

export enum UtilityType {
  WATER = 'Water',
  ELECTRICITY = 'Electricity',
  INTERNET = 'Internet',
  BUILDING_FEES = 'Building Fees',
}

export enum UtilityPaymentMode {
  CLUB_PAYS = 'Club Pays',
  DEDUCTED_FROM_SALARY = 'Deducted from Salary',
}

export enum UtilityBillingMode {
  FLAT_RATE = 'Flat Rate',
  ACTUAL = 'Actual',
}

export interface ContractUtility {
  id: number;
  utilityType: UtilityType;
  paymentMode: UtilityPaymentMode;
  billingMode: UtilityBillingMode;
  monthlyFlatRate?: number;
  notes?: string;
}

export interface CreateContractUtilityDto {
  utilityType: UtilityType;
  paymentMode: UtilityPaymentMode;
  billingMode: UtilityBillingMode;
  monthlyFlatRate?: number;
  notes?: string;
}

export interface UpdateContractUtilityDto {
  utilityType?: UtilityType;
  paymentMode?: UtilityPaymentMode;
  billingMode?: UtilityBillingMode;
  monthlyFlatRate?: number;
  notes?: string;
}

export const contractUtilityApi = {
  // HR Contract utilities
  createForHRContract: async (contractId: number, dto: CreateContractUtilityDto): Promise<ContractUtility> => {
    return await api.fetch<ContractUtility>(`/contract-utilities/hr-contract/${contractId}`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  getByHRContract: async (contractId: number): Promise<ContractUtility[]> => {
    return await api.fetch<ContractUtility[]>(`/contract-utilities/hr-contract/${contractId}`);
  },

  // Club Contract utilities
  createForClubContract: async (contractId: number, dto: CreateContractUtilityDto): Promise<ContractUtility> => {
    return await api.fetch<ContractUtility>(`/contract-utilities/club-contract/${contractId}`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  getByClubContract: async (contractId: number): Promise<ContractUtility[]> => {
    return await api.fetch<ContractUtility[]>(`/contract-utilities/club-contract/${contractId}`);
  },

  // Common operations
  update: async (id: number, dto: UpdateContractUtilityDto): Promise<ContractUtility> => {
    return await api.fetch<ContractUtility>(`/contract-utilities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  delete: async (id: number): Promise<void> => {
    await api.fetch<void>(`/contract-utilities/${id}`, {
      method: 'DELETE',
    });
  },
};
