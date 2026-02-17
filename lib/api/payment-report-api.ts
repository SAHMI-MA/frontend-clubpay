import { api } from '../api';

export type ReportEntityType = 'employee' | 'player' | 'staff';

export interface PaymentDetail {
  id: number;
  date: string;
  period: string;
  baseSalary: number;
  overtime?: number;
  bonuses: number;
  deductions?: number;
  totalAmount: number;
  status: string;
  paymentMethod?: string;
  bankAccountName?: string;
}

export interface FinancialSummary {
  totalPayments: number;
  totalAmount: number;
  totalBaseSalary: number;
  totalOvertimePay: number;
  totalBonuses: number;
  totalDeductions: number;
  averageMonthlyPay: number;
}

export interface EntityInfo {
  id: string;
  name: string;
  type: string;
  department?: string;
  position?: string;
  team?: string;
  role?: string;
}

export interface FinancialReport {
  entity: EntityInfo;
  summary: FinancialSummary;
  payments: PaymentDetail[];
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
}

export interface GenerateReportParams {
  entityType: ReportEntityType;
  entityId: string;
  startDate?: string;
  endDate?: string;
}

export const paymentReportApi = {
  generateReport: async (params: GenerateReportParams): Promise<FinancialReport> => {
    const queryParams = new URLSearchParams();
    queryParams.append('entityType', params.entityType);
    queryParams.append('entityId', params.entityId);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    return api.fetch(`/accounting/payment-reports?${queryParams.toString()}`);
  },

  getAllEmployeesReports: async (
    startDate?: string,
    endDate?: string,
  ): Promise<FinancialReport[]> => {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    return api.fetch(
      `/accounting/payment-reports/all-employees${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
    );
  },

  getAllPlayersReports: async (
    startDate?: string,
    endDate?: string,
  ): Promise<FinancialReport[]> => {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    return api.fetch(
      `/accounting/payment-reports/all-players${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
    );
  },

  getAllStaffReports: async (
    startDate?: string,
    endDate?: string,
  ): Promise<FinancialReport[]> => {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    return api.fetch(
      `/accounting/payment-reports/all-staff${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
    );
  },
};
