import { User } from '../auth-service';
import { Supplier } from './supplier-management';
import { Acquisition } from './supplier-management';
import { Player, Staff } from './team-management';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum TransactionCategory {
  RENTAL = 'RENTAL',
  SALARY = 'SALARY',
  DONATION = 'DONATION',
  EQUIPMENT = 'EQUIPMENT',
  UTILITY = 'UTILITY',
  SPONSORSHIP = 'SPONSORSHIP',
  REGISTRATION = 'REGISTRATION',
  OTHER = 'OTHER'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID'
}

export interface Transaction {
  purchaseOrder: any;
  id: number;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  date: string; // ISO format date string
  description: string;
  supplierId?: number;
  supplier?: Supplier;
  rentalId?: number;
  rental?: Rental;
  salaryPaymentId?: number;
  salaryPayment?: SalaryPayment;
  createdById?: number;
  createdBy?: User;
  createdAt: string; // ISO format date string
  updatedAt: string; // ISO format date string
  status: PaymentStatus;
}

export interface Rental {
  id: number;
  startDate: string; // ISO format date string
  endDate: string; // ISO format date string
  monthlyAmount: number;
  totalValue: number;
  notes?: string;
  acquisitionId: number;
  acquisition?: Acquisition;
  createdAt: string; // ISO format date string
  updatedAt: string; // ISO format date string
}

export interface SalaryPayment {
  id: number;
  amount: number;
  paymentDate: string; // ISO format date string
  periodStart: string; // ISO format date string
  periodEnd: string; // ISO format date string
  bonus?: number;
  taxAmount: number;
  netAmount: number;
  status: PaymentStatus;
  staffId?: number;
  playerId?: number;
  staff?: Staff | null;
  player?: Player | null;
  notes?: string;
  createdAt: string; // ISO format date string
  updatedAt: string; // ISO format date string
}

export interface FinancialReport {
  id: number;
  periodStart: string; // ISO format date string
  periodEnd: string; // ISO format date string
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  createdAt: string; // ISO format date string
  generatedById: number;
  generatedBy?: User;
  categorySummary: {
    category: TransactionCategory;
    income: number;
    expense: number;
  }[];
}

// Data transfer objects for creating/updating records

export interface CreateTransactionDto {
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  date: string;
  description: string;
  createdById: number;
  supplierId?: number;
  rentalId?: number;
  salaryPaymentId?: number;
  /**
   * ID of the uploaded file to link as purchase order (optional)
   */
  purchaseOrderId?: number;
  /**
   * Type of purchase order: "INTERNAL" or "EXTERNAL" (optional)
   */
  purchaseOrderType?: "INTERNAL" | "EXTERNAL";
}

export interface CreateTransactionFromAcquisitionDto {
  acquisitionId: number;
  createdById: number;
  customDescription?: string;
  /**
   * ID of the uploaded file to link as purchase order (optional)
   */
  purchaseOrderId?: number;
  /**
   * Type of purchase order: "INTERNAL" or "EXTERNAL" (optional)
   */
  purchaseOrderType?: "INTERNAL" | "EXTERNAL";
}

export interface CreateTransactionFromSalaryPaymentDto {
  salaryPaymentId: number;
  createdById: number;
  customDescription?: string;
  transactionType?: TransactionType; // Optional - defaults to EXPENSE if not provided
  transactionCategory?: TransactionCategory; // Optional - defaults to SALARY if not provided
}

export interface CreateRentalDto {
  startDate: string;
  endDate: string;
  monthlyAmount: number;
  totalValue: number;
  notes?: string;
  acquisitionId: number;
}

export interface CreateSalaryPaymentDto {
  amount: number;
  paymentDate: string;
  periodStart: string;
  periodEnd: string;
  bonus?: number;
  taxAmount?: number;
  status?: PaymentStatus;
  staffId?: number;
  playerId?: number;
  notes?: string;
  createdBy: number;
}

export interface UpdateTransactionDto {
  type?: TransactionType;
  category?: TransactionCategory;
  amount?: number;
  date?: string;
  description?: string;
  status?: PaymentStatus;
}

export interface UpdatePaymentStatusDto {
  status: PaymentStatus;
  notes?: string;
}

export interface GenerateReportDto {
  periodStart: string;
  periodEnd: string;
}

export interface TransactionFilterDto {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  category?: TransactionCategory;
  status?: PaymentStatus;
}

export interface CreateCustomTransactionDto {
  amount: number;
  date: string;
  description: string;
  transactionType: TransactionType; // INCOME or EXPENSE
  category: TransactionCategory; // The category of the transaction (SPONSORSHIP, DONATION, UTILITY, etc.)
  createdById: number;
}

export interface BulkSalaryPaymentDto {
  teamId?: number;
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  taxRate: number;
  includeStaff: boolean;
  includePlayers: boolean;
  description?: string;
  createdById: number;
}
