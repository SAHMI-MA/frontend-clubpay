/**
 * Types for Alerts System
 */

export interface LatePaymentInfo {
  id: number;
  amount: number;
  paymentDate: Date | string;
  periodStart: Date | string;
  periodEnd: Date | string;
  daysLate: number;
  recipientType: 'player' | 'staff' | 'employee';
  recipientName: string;
  recipientId: number | string;
  employeeName?: string;
  employeeId?: string;
  teamName?: string;
  month?: number;
  year?: number;
}

export interface BudgetAlert {
  teamId: number;
  teamName: string;
  budget: number;
  currentSpending: number;
  usagePercentage: number;
  warningThreshold: number;
  status: 'EXCEEDED' | 'WARNING' | 'OK';
  overspendAmount?: number;
}

export interface UpcomingPayment {
  id: number;
  amount: number;
  paymentDate: Date | string;
  periodStart: Date | string;
  periodEnd: Date | string;
  daysUntilDue: number;
  recipientType: 'player' | 'staff' | 'employee';
  recipientName: string;
  recipientId?: number | string;
  employeeName?: string;
  employeeId?: string;
  teamName?: string;
  month?: number;
  year?: number;
}

export interface AlertsSummary {
  latePayments: {
    count: number;
    totalAmount: number;
    items: LatePaymentInfo[];
  };
  budgetAlerts: {
    count: number;
    exceededCount: number;
    warningCount: number;
    items: BudgetAlert[];
  };
  upcomingPayments: {
    count: number;
    totalAmount: number;
    items: UpcomingPayment[];
  };
  summary: {
    totalAlerts: number;
    criticalCount: number;
  };
}

export type AlertType = 'late-payment' | 'budget-exceeded' | 'budget-warning' | 'upcoming-payment';

export interface AlertNotification {
  id: string;
  type: AlertType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  timestamp: Date | string;
  data: LatePaymentInfo | BudgetAlert | UpcomingPayment;
  read: boolean;
}
