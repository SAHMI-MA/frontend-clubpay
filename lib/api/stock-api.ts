import { apiConfig } from "../api-config";
import { getAuthHeaders as getAuthHeadersUtil } from "../../utils/auth";

const BASE_URL = apiConfig.baseUrl || "http://localhost:8080";

function buildQuery(params?: Record<string, any>): string {
  if (!params) return "";
  const esc = encodeURIComponent;
  return (
    "?" +
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${esc(k)}=${esc(v)}`)
      .join("&")
  );
}

function getAuthHeaders() {
  const headers = getAuthHeadersUtil();
  return {
    'Content-Type': 'application/json',
    ...headers
  };
}

// Enums
export enum ArticleCategory {
  EQUIPMENT = "Equipment",
  CONSUMABLE = "Consumable",
  MAINTENANCE = "Maintenance",
  OFFICE = "Office",
  SPORTS = "Sports",
  OTHER = "Other",
}

export enum Unit {
  PIECE = "Piece",
  KG = "Kg",
  LITER = "Liter",
  BOX = "Box",
  PACK = "Pack",
  METER = "Meter",
}

export enum MovementType {
  INPUT = "Input",
  OUTPUT = "Output",
  ADJUSTMENT = "Adjustment",
  TRANSFER = "Transfer",
  RETURN = "Return",
}

export enum MovementReason {
  PURCHASE = "Purchase",
  DONATION = "Donation",
  PRODUCTION = "Production",
  SALE = "Sale",
  CONSUMPTION = "Consumption",
  DAMAGE = "Damage",
  THEFT = "Theft",
  EXPIRED = "Expired",
  INVENTORY_ADJUSTMENT = "Inventory Adjustment",
  TRANSFER_IN = "Transfer In",
  TRANSFER_OUT = "Transfer Out",
  MAINTENANCE = "Maintenance",
  OTHER = "Other",
}

// Types
export interface Article {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: ArticleCategory;
  unit: Unit;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  unitPrice?: number;
  location?: string;
  supplier?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: number;
  articleId: number;
  article?: {
    id: number;
    code: string;
    name: string;
    category: string;
    unit: string;
    currentStock: string;
    minStock: string;
    maxStock?: string;
    unitPrice?: string;
    location?: string;
    supplier?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  articleName?: string; // Fallback for backward compatibility
  type: MovementType;
  reason: string;
  quantity: number;
  unitPrice?: number;
  totalValue?: number;
  stockBefore: number;
  stockAfter: number;
  referenceDocument?: string;
  supplierCustomer?: string;
  location?: string;
  notes?: string;
  performedBy?: {
    id: number;
    name: string;
  } | string | null;
  movementDate: string;
  isValidated: boolean;
}

export interface AllocationItem {
  id: number;
  articleId: number;
  articleName?: string;
  articleCode?: string;
  quantity: number;
  unitPrice?: number;
  totalValue?: number;
  stockBefore: number;
  stockAfter: number;
  notes?: string;
  allocatedAt: string;
  returnedAt?: string;
}

export interface Allocation {
  user: any;
  id: number;
  allocationNumber: string;
  allocationType: 'Club' | 'Player' | 'Staff' | 'Employee';
  allocationDuration: 'Temporary' | 'Permanent';
  expectedReturnDate?: string;
  actualReturnDate?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'In Use' | 'Returned' | 'Cancelled';
  notes?: string;
  
  // Entity relationships
  teamId?: number;
  playerId?: number;
  staffId?: number;
  employeeId?: string;
  
  // Entity details
  entityName?: string;
  
  // User relationships
  allocatedById: number;
  allocatedBy?: string;
  approvedById?: number;
  approvedBy?: string;
  
  // Allocation items
  items: AllocationItem[];
  
  // Timestamps
  allocationDate: string;
  approvalDate?: string;
  createdAt: string;
  updatedAt: string;
  
  // Legacy field for backward compatibility
  internalPurchaseOrderPath?: string;
}

export interface StockDashboardStats {
  totalArticles: number;
  totalStockValue: number;
  lowStockCount: number;
  activeArticles: number;
  totalMovements: number;
  pendingMovements: number;
}

export interface CreateArticleDto {
  code: string;
  name: string;
  description?: string;
  category: ArticleCategory;
  unit: Unit;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  unitPrice?: number;
  location?: string;
  supplier?: string;
}

export interface UpdateArticleDto {
  code?: string;
  name?: string;
  description?: string;
  category?: ArticleCategory;
  unit?: Unit;
  minStock?: number;
  maxStock?: number;
  unitPrice?: number;
  location?: string;
  supplier?: string;
  isActive?: boolean;
}

export interface CreateStockMovementDto {
  articleId: number;
  type: MovementType;
  reason: MovementReason;
  quantity: number;
  unitPrice?: number;
  referenceDocument?: string;
  supplierCustomer?: string;
  location?: string;
  notes?: string;
}

export interface CreateAllocationItemDto {
  articleId: number;
  quantity: number;
  notes?: string;
}

export interface CreateAllocationDto {
  allocationType: string;
  allocationDuration: string;
  expectedReturnDate?: string;
  notes?: string;
  
  // Entity IDs (only one should be provided)
  teamId?: number;
  playerId?: number;
  staffId?: number;
  employeeId?: string;
  
  allocatedById: number;
  items: CreateAllocationItemDto[];
}

// API Functions
export const stockApi = {
  // Get articles with optional filters
  async getArticles(params?: {
    search?: string;
    category?: string;
    location?: string;
    isActive?: boolean;
  }): Promise<Article[] | { data: Article[]; total: number }> {
    // Map isActive to active for backend compatibility
    const mappedParams = params ? {
      search: params.search,
      category: params.category,
      location: params.location,
      active: params.isActive?.toString()
    } : {};
    
    const query = buildQuery(mappedParams);
    const headers = getAuthHeaders();
    
    const res = await fetch(`${BASE_URL}/stock/articles${query}`, {
      headers: headers,
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw errorData;
    }
    
    const response = await res.json();
    
    // Parse numeric string values to numbers for frontend compatibility
    const parseArticle = (article: any): Article => ({
      ...article,
      currentStock: typeof article.currentStock === 'string' ? parseFloat(article.currentStock) : article.currentStock,
      minStock: typeof article.minStock === 'string' ? parseFloat(article.minStock) : article.minStock,
      maxStock: article.maxStock && typeof article.maxStock === 'string' ? parseFloat(article.maxStock) : article.maxStock,
      unitPrice: article.unitPrice && typeof article.unitPrice === 'string' ? parseFloat(article.unitPrice) : article.unitPrice,
    });
    
    // Handle both array and paginated response formats
    if (Array.isArray(response)) {
      return response.map(parseArticle);
    } else if (response && Array.isArray(response.data)) {
      return {
        ...response,
        data: response.data.map(parseArticle)
      };
    }
    
    return response;
  },

  // Get article by ID
  async getArticle(id: number): Promise<Article> {
    const res = await fetch(`${BASE_URL}/stock/articles/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw await res.json();
    const article = await res.json();
    
    // Parse numeric string values to numbers for frontend compatibility
    return {
      ...article,
      currentStock: typeof article.currentStock === 'string' ? parseFloat(article.currentStock) : article.currentStock,
      minStock: typeof article.minStock === 'string' ? parseFloat(article.minStock) : article.minStock,
      maxStock: article.maxStock && typeof article.maxStock === 'string' ? parseFloat(article.maxStock) : article.maxStock,
      unitPrice: article.unitPrice && typeof article.unitPrice === 'string' ? parseFloat(article.unitPrice) : article.unitPrice,
    };
  },

  // Create article
  async createArticle(data: CreateArticleDto): Promise<Article> {
    const res = await fetch(`${BASE_URL}/stock/articles`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Update article
  async updateArticle(id: number, data: UpdateArticleDto): Promise<Article> {
    // Ensure numeric fields are numbers, not strings
    const updateData: UpdateArticleDto = {
      ...data,
      minStock: data.minStock !== undefined ? Number(data.minStock) : undefined,
      maxStock: data.maxStock !== undefined ? Number(data.maxStock) : undefined,
      unitPrice: data.unitPrice !== undefined ? Number(data.unitPrice) : undefined,
    };

    const res = await fetch(`${BASE_URL}/stock/articles/${id}`, {
      method: "PATCH",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Delete article
  async deleteArticle(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/stock/articles/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw await res.json();
  },

  // Get low stock articles
  async getLowStockArticles(): Promise<Article[]> {
    const res = await fetch(`${BASE_URL}/stock/articles/low-stock`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw await res.json();
    const articles = await res.json();
    
    // Parse numeric string values to numbers for frontend compatibility
    const parseArticle = (article: any): Article => ({
      ...article,
      currentStock: typeof article.currentStock === 'string' ? parseFloat(article.currentStock) : article.currentStock,
      minStock: typeof article.minStock === 'string' ? parseFloat(article.minStock) : article.minStock,
      maxStock: article.maxStock && typeof article.maxStock === 'string' ? parseFloat(article.maxStock) : article.maxStock,
      unitPrice: article.unitPrice && typeof article.unitPrice === 'string' ? parseFloat(article.unitPrice) : article.unitPrice,
    });
    
    return Array.isArray(articles) ? articles.map(parseArticle) : [];
  },

  // Get stock movements with optional filters
  async getStockMovements(params?: {
    articleId?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<StockMovement[] | { data: StockMovement[]; total: number }> {
    const query = buildQuery(params);
    const res = await fetch(`${BASE_URL}/stock/movements${query}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Create stock movement
  async createStockMovement(data: CreateStockMovementDto): Promise<StockMovement> {
    const res = await fetch(`${BASE_URL}/stock/movements`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Get dashboard stats
  async getDashboardStats(): Promise<StockDashboardStats> {
    const res = await fetch(`${BASE_URL}/stock/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  }
};

// Allocation Management API Service
export const allocationApi = {
  async getAllocations(params?: {
    search?: string;
    status?: string;
    allocationType?: string;
    entityType?: string;
    entityId?: number;
  }): Promise<{ data: Allocation[]; total: number }> {
    const query = buildQuery(params);
    const res = await fetch(`${BASE_URL}/allocation-requests${query}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async createAllocation(data: CreateAllocationDto): Promise<Allocation> {
    const res = await fetch(`${BASE_URL}/allocation-requests`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async approveAllocation(id: number, userId: number, reason?: string): Promise<Allocation> {
    const res = await fetch(`${BASE_URL}/allocation-requests/${id}/approve`, {
      method: "PATCH",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ userId, reason }),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async rejectAllocation(id: number, userId: number, reason?: string): Promise<Allocation> {
    const res = await fetch(`${BASE_URL}/allocation-requests/${id}/reject`, {
      method: "PATCH",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ userId, reason }),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async returnAllocation(id: number, userId: number, notes?: string, actualReturnDate?: string): Promise<Allocation> {
    const res = await fetch(`${BASE_URL}/allocation-requests/${id}/return`, {
      method: "PATCH",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ userId, notes, actualReturnDate }),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async deleteAllocation(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/allocation-requests/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw await res.json();
  }
};

// Entity API (for allocation targets)
export const entityApi = {
  async getAllEntities(): Promise<Array<{ id: number; name: string; type: string }>> {
    try {
      const allEntities: Array<{ id: number; name: string; type: string }> = [];

      // Try to fetch teams from team management API
      try {
        const teamsRes = await fetch(`${BASE_URL}/teams`, {
          headers: getAuthHeaders(),
        });
        if (teamsRes.ok) {
          const teams = await teamsRes.json();
          if (Array.isArray(teams)) {
            teams.forEach(team => {
              allEntities.push({
                id: team.id,
                name: team.name || `Team ${team.id}`,
                type: 'Team'
              });
            });
          }
        }
      } catch (error) {
        console.warn('Failed to fetch teams:', error);
      }

      // Try to fetch players from team management API
      try {
        const playersRes = await fetch(`${BASE_URL}/players`, {
          headers: getAuthHeaders(),
        });
        if (playersRes.ok) {
          const players = await playersRes.json();
          if (Array.isArray(players)) {
            players.forEach(player => {
              allEntities.push({
                id: player.id,
                name: `${player.firstName || ''} ${player.lastName || ''}`.trim() || `Player ${player.id}`,
                type: 'Player'
              });
            });
          }
        }
      } catch (error) {
        console.warn('Failed to fetch players:', error);
      }

      // Try to fetch employees from HR API
      try {
        const employeesRes = await fetch(`${BASE_URL}/hr/employees`, {
          headers: getAuthHeaders(),
        });
        if (employeesRes.ok) {
          const employees = await employeesRes.json();
          if (Array.isArray(employees)) {
            employees.forEach(emp => {
              allEntities.push({
                id: parseInt(emp.employeeId) || 0,
                name: emp.fullName || `${emp.user?.firstName || ''} ${emp.user?.lastName || ''}`.trim() || `Employee ${emp.employeeId}`,
                type: 'Employee'
              });
            });
          }
        }
      } catch (error) {
        console.warn('Failed to fetch employees:', error);
      }

      // Add mock staff data until staff endpoint is available
      // TODO: Replace with real API call when staff endpoint is available
      const mockStaff = [
        { id: 3001, name: "Mohammed Brahim - Entraîneur Principal", type: "Staff" },
        { id: 3002, name: "Abdellah Zeroual - Entraîneur Adjoint", type: "Staff" },
        { id: 3003, name: "Fatima Bouazza - Préparateur Physique", type: "Staff" },
        { id: 3004, name: "Driss Benali - Gardien de But", type: "Staff" },
        { id: 3005, name: "Nadia Alami - Kinésithérapeute", type: "Staff" },
        { id: 3006, name: "Khalid Bennani - Analyste Vidéo", type: "Staff" },
      ];

      allEntities.push(...mockStaff);

      console.log('Loaded entities:', allEntities.length, 'entities');
      console.log('Teams:', allEntities.filter(e => e.type === 'Team').length);
      console.log('Players:', allEntities.filter(e => e.type === 'Player').length);
      console.log('Employees:', allEntities.filter(e => e.type === 'Employee').length);
      console.log('Staff:', allEntities.filter(e => e.type === 'Staff').length);
      
      return allEntities;

    } catch (error) {
      console.error('Failed to fetch entities:', error);
      
      // Return at least mock data if everything fails
      return [
        // Mock Teams
        { id: 1001, name: "Équipe Senior", type: "Team" },
        { id: 1002, name: "Équipe Junior", type: "Team" },
        { id: 1003, name: "Équipe Féminine", type: "Team" },
        
        // Mock Players
        { id: 2001, name: "Ahmed El Mansouri", type: "Player" },
        { id: 2002, name: "Youssef Benali", type: "Player" },
        { id: 2003, name: "Karim Alami", type: "Player" },
        
        // Mock Staff
        { id: 3001, name: "Mohammed Brahim - Entraîneur", type: "Staff" },
        { id: 3002, name: "Abdellah Zeroual - Adjoint", type: "Staff" },
        
        // Mock Employees
        { id: 4001, name: "Admin User", type: "Employee" },
      ];
    }
  }
};

// Internal Purchase Order API
export const internalPurchaseOrderApi = {
  async previewDocumentHtml(allocationId: number): Promise<string> {
    const res = await fetch(`${BASE_URL}/stock/allocations/${allocationId}/internal-purchase-order/preview`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw await res.json();
    return res.text();
  },

  async downloadDocument(allocationId: number): Promise<Blob> {
    const res = await fetch(`${BASE_URL}/stock/allocations/${allocationId}/internal-purchase-order/download`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw await res.json();
    return res.blob();
  }
};
