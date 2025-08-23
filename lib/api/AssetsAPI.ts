// types/asset.types.ts
export interface Asset {
  id: number
  name: string
  reference: string
  category: "Informatique" | "Mobilier" | "Véhicule" | "Équipement Sportif" | "Électronique" | "Autre"
  location: string
  purchaseDate: string
  purchasePrice?: number
  currentValue?: number
  condition: "Excellent" | "Bon" | "Moyen" | "Mauvais" | "Hors Service"
  supplier?: string
  warrantyEndDate?: string
  serialNumber?: string
  description?: string
  maintenanceDate?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AssetQuery {
  search?: string
  category?: string
  condition?: string
  location?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export interface AssetResponse {
  assets: Asset[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AssetStats {
  totalAssets: number
  activeAssets: number
  totalValue: number
  maintenanceNeeded: number
  uniqueLocations: number
  categoriesBreakdown: {
    category: string
    count: number
    totalValue: number
  }[]
}

export interface CreateAssetDto {
  name: string
  reference: string
  category: Asset['category']
  location: string
  purchaseDate: string
  purchasePrice?: number
  currentValue?: number
  condition: Asset['condition']
  supplier?: string
  warrantyEndDate?: string
  serialNumber?: string
  description?: string
  maintenanceDate?: string
  isActive?: boolean
}

export interface UpdateAssetDto extends Partial<CreateAssetDto> {
    isActive?: boolean
}

export interface DepreciationReport {
  asset: Asset
  depreciation: number
  depreciationPercentage: number
}

// services/assetApi.ts
import { apiConfig } from '../api-config';

class AssetApiService {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  constructor(baseURL: string = apiConfig.baseUrl) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const config: RequestInit = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return null as T
      }

      return await response.json()
    } catch (error) {
      console.error(`API Request failed: ${endpoint}`, error)
      throw error
    }
  }

  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    
    return searchParams.toString()
  }

  // Asset CRUD Operations
  async getAssets(query: AssetQuery = {}): Promise<AssetResponse> {
    const queryString = this.buildQueryString(query)
    const endpoint = queryString ? `/assets?${queryString}` : '/assets'
    return this.request<AssetResponse>(endpoint)
  }

  async getAsset(id: number): Promise<Asset> {
    return this.request<Asset>(`/assets/${id}`)
  }

  async createAsset(assetData: CreateAssetDto): Promise<Asset> {
    return this.request<Asset>('/assets', {
      method: 'POST',
      body: JSON.stringify(assetData),
    })
  }

  async updateAsset(id: number, assetData: UpdateAssetDto): Promise<Asset> {
    return this.request<Asset>(`/assets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(assetData),
    })
  }

  async deleteAsset(id: number): Promise<void> {
    return this.request<void>(`/assets/${id}`, {
      method: 'DELETE',
    })
  }

  // Bulk Operations
  async bulkUpdateStatus(ids: number[], isActive: boolean): Promise<Asset[]> {
    return this.request<Asset[]>('/assets/bulk-status', {
      method: 'PATCH',
      body: JSON.stringify({ ids, isActive }),
    })
  }

  // Statistics and Reports
  async getStats(): Promise<AssetStats> {
    return this.request<AssetStats>('/assets/stats')
  }

  async getMaintenanceReport(): Promise<Asset[]> {
    return this.request<Asset[]>('/assets/maintenance-report')
  }

  async getDepreciationReport(): Promise<DepreciationReport[]> {
    return this.request<DepreciationReport[]>('/assets/depreciation-report')
  }

  async getUniqueLocations(): Promise<string[]> {
    return this.request<string[]>('/assets/locations')
  }

  // Category and Condition Specific
  async getAssetsByCategory(category: Asset['category']): Promise<Asset[]> {
    return this.request<Asset[]>(`/assets/category/${encodeURIComponent(category)}`)
  }

  async getAssetsByCondition(condition: Asset['condition']): Promise<Asset[]> {
    return this.request<Asset[]>(`/assets/condition/${encodeURIComponent(condition)}`)
  }

  // Utility Methods
  setAuthToken(token: string): void {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      'Authorization': `Bearer ${token}`,
    }
  }

  removeAuthToken(): void {
    const { ...headersWithoutAuth } = this.defaultHeaders as any
    this.defaultHeaders = headersWithoutAuth
  }

  setBaseURL(url: string): void {
    this.baseURL = url
  }
}

// Create and export singleton instance
export const assetApi = new AssetApiService()

// Export individual methods for easier importing
export const {
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  bulkUpdateStatus,
  getStats,
  getMaintenanceReport,
  getDepreciationReport,
  getUniqueLocations,
  getAssetsByCategory,
  getAssetsByCondition,
} = assetApi

export default assetApi