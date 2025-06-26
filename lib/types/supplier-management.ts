// Supplier and Acquisition Types

// Supplier
export interface Supplier {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  contactPerson: string;
  createdAt?: string;
  updatedAt?: string;
  // Additional fields for UI
  isActive?: boolean;
  rating?: number;
  category?: string;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: Date;
}

export interface CreateSupplierDto {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  contactPerson: string;
  category?: string; // Optional for UI categorization
}

export interface UpdateSupplierDto {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  contactPerson?: string;
  category?: string;
  isActive?: boolean;
  rating?: number;
}

// Acquisition Types
export enum AcquisitionType {
  RENTAL = "RENTAL",
  PURCHASE = "PURCHASE",
}

export enum ItemType {
  APARTMENT = "APARTMENT",
  EQUIPMENT = "EQUIPMENT",
  VEHICLE = "VEHICLE",
  UNIFORM = "UNIFORM",
  MEDICAL = "MEDICAL",
  OTHER = "OTHER",
}

export enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  DELIVERED = "DELIVERED",
  RETURNED = "RETURNED",
  CANCELLED = "CANCELLED",
}

export enum AssigneeType {
  TEAM = "TEAM",
  PLAYER = "PLAYER",
  STAFF = "STAFF",
}

export interface Acquisition {
  id: number;
  acquisitionType: AcquisitionType;
  itemType: ItemType;
  description: string;
  startDate?: string;
  endDate?: string;
  cost: number;
  approvalStatus: ApprovalStatus;
  approvalDate?: string | null;
  approvalComments?: string;
  createdAt?: string;
  updatedAt?: string;
  supplier?: {
    id: number;
    name: string;
  };
  team?: {
    id: number;
    name: string;
  } | null;
  player?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  staff?: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  supplies?: {
    id: number;
    name: string;
  } | null;
  // Additional fields
  supplierId: number;
  teamId?: number;
  playerId?: number;
  staffId?: number;
  quantity?: number;
}

export interface CreateAcquisitionDto {
  acquisitionType: AcquisitionType;
  itemType: ItemType;
  description: string;
  startDate?: string;
  endDate?: string;
  cost: number;
  supplierId: number;
  teamId?: number;
  playerId?: number;
  staffId?: number;
  quantity?: number;
}

export interface UpdateAcquisitionDto {
  acquisitionType?: AcquisitionType;
  itemType?: ItemType;
  description?: string;
  startDate?: string;
  endDate?: string;
  cost?: number;
  supplierId?: number;
  teamId?: number;
  playerId?: number;
  staffId?: number;
  quantity?: number;
}

export interface ApprovalDto {
  approvalStatus: ApprovalStatus;
  approverId: number;
  approvalComments?: string;
}

// Supply Types
export enum SupplyCondition {
  NEW = "NEW",
  GOOD = "GOOD",
  FAIR = "FAIR",
  POOR = "POOR",
}

export interface Supply {
  id: number;
  name: string;
  description: string;
  itemType: ItemType;
  quantity: number;
  condition: SupplyCondition;
  createdAt?: string;
  updatedAt?: string;
  supplier?: {
    id: number;
    name: string;
  };
  supplierId: number;
  acquisitions?: any[];
}

export interface CreateSupplyDto {
  name: string;
  description: string;
  itemType: ItemType;
  quantity: number;
  condition: SupplyCondition;
  supplierId: number;
}

export interface UpdateSupplyDto {
  name?: string;
  description?: string;
  itemType?: ItemType;
  quantity?: number;
  condition?: SupplyCondition;
  supplierId?: number;
}
