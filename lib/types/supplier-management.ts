
import { User } from "../auth-service";
export interface Supplier {
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
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string;
  acquisitions?: any[];
  supplies?: Supply[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSupplierDto {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  contactPerson: string;
  rib?: string;
  category?: string;
}

export interface UpdateSupplierDto {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  contactPerson?: string;
  rib?: string; // NEW: Bank account information
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

export interface AcquisitionFile {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  createdAt: string;
  updatedAt: string;
  description: string;
}

export interface Acquisition {
  id: number;
  acquisitionType: AcquisitionType;
  itemType: ItemType;
  itemName: string;
  description: string;
  startDate?: string;
  endDate?: string;
  cost: number;
  supplier?: { id: number; name: string };
  team?: { id: number; name: string } | null;
  player?: { id: number; firstName: string; lastName: string } | null;
  staff?: { id: number; firstName: string; lastName: string } | null;
  supplies?: { id: number; name: string } | null;
  approvalStatus: ApprovalStatus;
  approvalDate?: string | null;
  approvalComments?: string;
  createdAt?: string;
  updatedAt?: string;
  supplierId: number;
  teamId?: number;
  playerId?: number;
  staffId?: number;
  quantity?: number;
  createdBy: User;
  approver?: User | null;
  quotationFile?: AcquisitionFile | null;
}

export interface CreateAcquisitionDto {
  acquisitionType: AcquisitionType;
  itemType: ItemType;
  itemName: string;
  description: string;
  startDate?: string;
  endDate?: string;
  cost: number;
  supplierId: number;
  teamId?: number;
  playerId?: number;
  staffId?: number;
  quantity?: number;
  createdBy: number;
  quotationFileId?: number;
}

export interface UpdateAcquisitionDto {
  acquisitionType?: AcquisitionType;
  itemType?: ItemType;
  itemName?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  cost?: number;
  supplierId?: number;
  teamId?: number;
  playerId?: number;
  staffId?: number;
  quantity?: number;
  quotationFileId: number;
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
  supplier?: string; // NEW: Supplier name as string
  acquisitions?: any[]; // NEW: Array of acquisitions
  createdAt?: string;
  updatedAt?: string;
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
