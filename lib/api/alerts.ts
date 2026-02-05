import { api } from '../api';
import type { 
  AlertsSummary, 
  LatePaymentInfo, 
  BudgetAlert, 
  UpcomingPayment 
} from '@/lib/types/alerts';

/**
 * Alerts API Service
 * Handles all API calls related to system alerts (late payments, budget overruns, etc.)
 */
export const alertsApi = {
  /**
   * Get complete alerts summary
   */
  getSummary: async (): Promise<AlertsSummary> => {
    return api.get<AlertsSummary>('/alerts/summary');
  },

  /**
   * Get all late salary payments
   */
  getLatePayments: async (): Promise<LatePaymentInfo[]> => {
    return api.get<LatePaymentInfo[]>('/alerts/late-payments');
  },

  /**
   * Get all budget alerts (exceeded or near threshold)
   */
  getBudgetAlerts: async (): Promise<BudgetAlert[]> => {
    return api.get<BudgetAlert[]>('/alerts/budget-alerts');
  },

  /**
   * Get upcoming salary payments
   * @param days Number of days to look ahead (default: 7)
   */
  getUpcomingPayments: async (days: number = 7): Promise<UpcomingPayment[]> => {
    return api.get<UpcomingPayment[]>(`/alerts/upcoming-payments?days=${days}`);
  },

  /**
   * Trigger manual check for late payments and send notifications
   */
  checkLatePayments: async (): Promise<{ message: string; latePayments: LatePaymentInfo[] }> => {
    return api.post<{ message: string; latePayments: LatePaymentInfo[] }>('/late-payments/check', {});
  },
};
