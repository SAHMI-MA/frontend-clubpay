import { apiConfig } from "../api-config";
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: apiConfig.baseUrl,
});

export interface EligibleEmployee {
  employeeId: string;
  name: string;
  currentSalary: number;
  department: string;
  position: string;
  nextPayPeriod: string;
  lastPaymentDate?: string;
  hasUnpaidPeriod: boolean;
  isEligible: boolean;
  reason?: string;
}

export interface GroupedPaymentData {
  employeeId: string;
  payPeriod: string;
  baseSalary: number;
  overtime?: number;
  bonuses?: number;
  deductions?: number;
}

export interface CreateGroupedPaymentBody {
  payments: GroupedPaymentData[];
  paymentMethod: string;
  bankAccountId?: number;
  paymentDate?: string;
  status?: "pending" | "processed" | "failed" | "cancelled";
  createdById: number;
}

export interface GroupedPaymentResponse {
  success: number;
  failed: number;
  createdPayments: any[];
  errors: Array<{ employeeId: string; error: string }>;
}

export async function getEligibleEmployees(
  departmentIds?: number[],
  positionIds?: number[]
): Promise<EligibleEmployee[]> {
  const params = new URLSearchParams();
  if (departmentIds && departmentIds.length > 0) {
    params.append('departmentIds', departmentIds.join(','));
  }
  if (positionIds && positionIds.length > 0) {
    params.append('positionIds', positionIds.join(','));
  }

  const res = await axiosInstance.get<EligibleEmployee[]>(
    `/hr/salary-payments/eligible-employees?${params.toString()}`
  );
  return res.data;
}

export async function createGroupedPayments(
  body: CreateGroupedPaymentBody
): Promise<GroupedPaymentResponse> {
  console.log("POST /hr/salary-payments/grouped", body);
  try {
    const res = await axiosInstance.post<GroupedPaymentResponse>(
      "/hr/salary-payments/grouped",
      body
    );
    return res.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      console.error("=== 400 Bad Request when creating grouped payments ===");
      console.error("Request Body:", JSON.stringify(body, null, 2));
      console.error("Error Message:", error.response?.data?.message || error.message);
      console.error("Error Details:", JSON.stringify(error.response?.data, null, 2));
    }
    throw error;
  }
}
