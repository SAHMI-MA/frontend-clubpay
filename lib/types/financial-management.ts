import { User } from '../auth-service';
import { Supplier } from './supplier-management';
import { Acquisition } from './supplier-management';

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
  supplierId?: number;
  rentalId?: number;
  salaryPaymentId?: number;
}

export interface CreateTransactionFromAcquisitionDto {
  acquisitionId: number;
  date: string;
  description?: string;
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
  taxAmount: number;
  netAmount: number;
  staffId?: number;
  playerId?: number;
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
