import { api } from '../api';

// Report filter types
export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  category?: string;
  type?: string;
  status?: string;
  teamId?: number;
  departmentId?: number;
}

// Financial Report Types
export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
  byCategory: {
    category: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
}

export interface FinancialReport {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: FinancialSummary;
  transactions: any[];
}

// Salary Report Types
export interface SalaryReport {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalPaid: number;
    totalPending: number;
    paymentCount: number;
    clubPayments: number;
    hrPayments: number;
  };
  byMonth: {
    month: string;
    totalAmount: number;
    paymentCount: number;
    clubAmount: number;
    hrAmount: number;
  }[];
  byType: {
    type: string;
    amount: number;
    count: number;
  }[];
  payments: any[];
}

// Acquisition Report Types
export interface AcquisitionReport {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalSpent: number;
    totalItems: number;
    pendingAmount: number;
    completedAmount: number;
  };
  byCategory: {
    category: string;
    totalAmount: number;
    itemCount: number;
    percentage: number;
  }[];
  byStatus: {
    status: string;
    count: number;
    totalAmount: number;
  }[];
  bySupplier: {
    supplier: string;
    totalAmount: number;
    itemCount: number;
  }[];
  topSuppliers: {
    supplier: string;
    totalAmount: number;
    itemCount: number;
  }[];
  acquisitions: any[];
}

// Comprehensive Report Types
export interface ComprehensiveReport {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    totalSalaries: number;
    totalAcquisitions: number;
    netBalance: number;
  };
  financialReport: FinancialReport;
  salaryReport: SalaryReport;
  acquisitionReport: AcquisitionReport;
}

// API functions
export const reportsApi = {
  /**
   * Get financial report
   */
  getFinancialReport: async (filter?: ReportFilter): Promise<FinancialReport> => {
    const params = new URLSearchParams();
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.category) params.append('category', filter.category);

    const response = await api.get(`/reports/financial?${params.toString()}`) as { data: FinancialReport };
    return response.data;
  },

  /**
   * Get salary report
   */
  getSalaryReport: async (filter?: ReportFilter): Promise<SalaryReport> => {
    const params = new URLSearchParams();
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.teamId) params.append('teamId', filter.teamId.toString());

    const response = await api.get(`/reports/salary?${params.toString()}`) as { data: SalaryReport };
    return response.data;
  },

  /**
   * Get acquisition report
   */
  getAcquisitionReport: async (filter?: ReportFilter): Promise<AcquisitionReport> => {
    const params = new URLSearchParams();
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.status) params.append('status', filter.status);

    const response = await api.get(`/reports/acquisitions?${params.toString()}`) as { data: AcquisitionReport };
    return response.data;
  },

  /**
   * Get comprehensive report (all modules)
   */
  getComprehensiveReport: async (filter?: ReportFilter): Promise<ComprehensiveReport> => {
    const params = new URLSearchParams();
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);

    const response = await api.get(`/reports/comprehensive?${params.toString()}`) as { data: ComprehensiveReport };
    return response.data;
  },
};
