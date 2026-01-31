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

async function getAuthHeaders() {
  return await getAuthHeadersUtil();
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
  supplier?: {
    id: number;
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    contactPerson: string;
    rib?: string;
    isActive?: boolean;
    rating?: number;
    category?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: number;
  articleId: number;
  articleName: string;
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
  performedBy: string;
  movementDate: string;
  isValidated: boolean;
}

export interface Allocation {
  durationType: string;
  items: Array<{
    id: number;
    articleId: number;
    articleName: string;
    articleDescription?: string;
    quantity: number;
    unitPrice: string;
    totalValue?: number | null;
    stockBefore: number;
    stockAfter: number;
    notes?: string | null;
    allocatedAt: string;
    returnedAt?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  id: number;
  allocationNumber: string;
  articleId: number;
  articleName?: string;
  articleCode?: string;
  allocationType: 'Club' | 'Player' | 'Staff' | 'Employee';
  entityId: number;
  entityName?: string;
  quantity: number;
  allocatedBy: string;
  approvedBy?: string;
  allocationDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  allocationDuration: 'Temporary' | 'Permanent';
  status: 'Pending' | 'Approved' | 'Rejected' | 'In Use' | 'Returned' | 'Cancelled';
  notes?: string;
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

export interface CreateStockMovementDto {
  articleId: number;
  type: MovementType;
  reason: string;
  quantity: number;
  unitPrice?: number;
  referenceDocument?: string;
  supplierCustomer?: string;
  location?: string;
  notes?: string;
}

export interface CreateAllocationDto {
  articleId: number;
  allocationType: string;
  entityId: number;
  quantity: number;
  allocationDuration: string;
  expectedReturnDate?: string;
  notes?: string;
}

// API Functions
export const stockApi = {
  // Get articles with optional filters
  async getArticles(params?: {
    search?: string;
    category?: string;
    location?: string;
    isActive?: boolean;
  }): Promise<Article[]> {
    const query = buildQuery(params);
    const res = await fetch(`${BASE_URL}/stock/articles${query}`, {
      headers: await getAuthHeaders(),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Get article by ID
  async getArticle(id: number): Promise<Article> {
    const res = await fetch(`${BASE_URL}/stock/articles/${id}`, {
      headers: await getAuthHeaders(),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Create article
  async createArticle(data: CreateArticleDto): Promise<Article> {
    const res = await fetch(`${BASE_URL}/stock/articles`, {
      method: "POST",
      headers: { ...await getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Update article
  async updateArticle(id: number, data: Partial<CreateArticleDto>): Promise<Article> {
    const res = await fetch(`${BASE_URL}/stock/articles/${id}`, {
      method: "PATCH",
      headers: { ...await getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Delete article
  async deleteArticle(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/stock/articles/${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    if (!res.ok) throw await res.json();
  },

  // Get low stock articles
  async getLowStockArticles(): Promise<Article[]> {
    const res = await fetch(`${BASE_URL}/stock/articles/low-stock`, {
      headers: await getAuthHeaders(),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Get stock movements with optional filters
  async getStockMovements(params?: {
    articleId?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: StockMovement[]; total: number }> {
    const query = buildQuery(params);
    const res = await fetch(`${BASE_URL}/stock/movements${query}`, {
      headers: await getAuthHeaders(),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Create stock movement
  async createStockMovement(data: CreateStockMovementDto): Promise<StockMovement> {
    const res = await fetch(`${BASE_URL}/stock/movements`, {
      method: "POST",
      headers: { ...await getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Get dashboard stats
  async getDashboardStats(): Promise<StockDashboardStats> {
    const res = await fetch(`${BASE_URL}/stock/dashboard/stats`, {
      headers: await getAuthHeaders(),
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
  }): Promise<{data:Allocation[], total: number}> {
    const query = buildQuery(params);
    console.log('Allocation Query: ', query);
    const res = await fetch(`${BASE_URL}/allocation-requests${query}`, {
      headers: await getAuthHeaders(),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async createAllocation(data: CreateAllocationDto): Promise<Allocation> {
    const res = await fetch(`${BASE_URL}/stock/allocations`, {
      method: "POST",
      headers: { ...await getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async approveAllocation(id: number): Promise<Allocation> {
    const res = await fetch(`${BASE_URL}/stock/allocations/${id}/approve`, {
      method: "PATCH",
      headers: await getAuthHeaders(),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async rejectAllocation(id: number, reason?: string): Promise<Allocation> {
    const res = await fetch(`${BASE_URL}/stock/allocations/${id}/reject`, {
      method: "PATCH",
      headers: { ...await getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async returnAllocation(id: number, notes?: string): Promise<Allocation> {
    const res = await fetch(`${BASE_URL}/stock/allocations/${id}/return`, {
      method: "PATCH",
      headers: { ...await getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  async deleteAllocation(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/stock/allocations/${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    if (!res.ok) throw await res.json();
  }
};

// Entity API (for allocation targets)
export const entityApi = {
  async getAllEntities(): Promise<Array<{ id: number; name: string; type: string }>> {
    const res = await fetch(`${BASE_URL}/stock/entities`, {
      headers: await getAuthHeaders(),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  }
};

// Internal Purchase Order API
export const internalPurchaseOrderApi = {
  async previewDocumentHtml(allocationId: number): Promise<string> {
    const res = await fetch(`${BASE_URL}/stock/allocations/${allocationId}/internal-purchase-order/preview`, {
      headers: await getAuthHeaders(),
    });
    if (!res.ok) throw await res.json();
    return res.text();
  },

  async downloadDocument(allocationId: number): Promise<Blob> {
    const res = await fetch(`${BASE_URL}/stock/allocations/${allocationId}/internal-purchase-order/download`, {
      headers: await getAuthHeaders(),
    });
    if (!res.ok) throw await res.json();
    return res.blob();
  }
};
