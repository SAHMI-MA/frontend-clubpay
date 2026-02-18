/**
 * Approve or reject a salary payment
 * PATCH /hr/salary-payments/approve-reject/{id}
 * @param id Salary payment ID
 * @param status 'processed' or 'cancelled'
 */
export async function approveOrRejectSalaryPayment(id: number, status: "processed" | "cancelled"): Promise<SalaryPayment> {
  const body = { status };
  const res = await axiosInstance.patch<SalaryPayment>(`/hr/salary-payments/approve-reject/${id}`, body);
  return res.data;
}
export interface EditSalaryPaymentBody {
  employeeId: string;
  payPeriod: string;
  baseSalary: number;
  overtime: number;
  bonuses: number;
  paymentMethod: string;
  status: "pending" | "processed" | "failed" | "cancelled";
  paymentDate: string;
  periodStart?: string;
  periodEnd?: string;
}

export async function editSalaryPayment(id: string, body: EditSalaryPaymentBody): Promise<SalaryPayment> {
  // PATCH /hr/salary-payments/{id} with all editable fields
  console.log("PATCH /hr/salary-payments/" + id, body);
  const res = await axiosInstance.patch<SalaryPayment>(`/hr/salary-payments/${id}`, body);
  return res.data;
}
// lib/api/hr-salary-api.ts
import { apiConfig } from "../api-config";
import axios from "axios"
import { Employee } from "./hr-api";

const axiosInstance = axios.create({
  baseURL: apiConfig.baseUrl,
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface SalaryPayment {
  id: string | number;
  employeeId: string;
  employee?: Employee;
  payPeriod: string;
  baseSalary: string;
  overtime: string;
  bonuses: string;
  amount: string;
  paymentMethod: string;
  status: "pending" | "processed" | "failed" | "cancelled";
  createdAt: string;
  updatedAt: string;
  paymentDate: string;
  periodStart?: string;
  periodEnd?: string;
  processedDate?: string;
  bankAccountId?: number;
}

export interface CreateSalaryPaymentBody {
  employeeId: string;
  payPeriod: string;
  baseSalary: number;
  overtime: number;
  bonuses: number;
  deductions: number;
  paymentMethod: string;
  status: "pending" | "processed" | "failed" | "cancelled";
  paymentDate: string;
  periodStart?: string;
  periodEnd?: string;
  createdById: number;
  bankAccountId?: number;
}

export interface CreateBulkSalaryPaymentBody {
  payPeriod: string;
  paymentMethod: string;
  overtime: number;
  bonuses: number;
  deductions: number;
  status: "pending" | "processed" | "failed" | "cancelled";
  paymentDate: string;
  periodStart?: string;
  periodEnd?: string;
  bankAccountId?: number;
  createdById: number;
}

export async function createBulkSalaryPaymentForDepartement(
  body: CreateBulkSalaryPaymentBody, 
  departmentId: number
): Promise<SalaryPayment[]> {
  const res = await axiosInstance.post<SalaryPayment[]>(`/hr/salary-payments/bulk/department/${departmentId}`, body);
  return Array.isArray(res.data) ? res.data : [];
}

export async function createBulkSalaryPaymentForPosition(
  body: CreateBulkSalaryPaymentBody, 
  positionId: number
): Promise<SalaryPayment[]> {
  const res = await axiosInstance.post<SalaryPayment[]>(`/hr/salary-payments/bulk/position/${positionId}`, body);
  return Array.isArray(res.data) ? res.data : [];
}

export interface UpdateSalaryPaymentBody {
  status?: "pending" | "processed" | "failed" | "cancelled"
  [key: string]: any
}

export async function listSalaryPayments(): Promise<SalaryPayment[]> {
  const res = await axiosInstance.get<SalaryPayment[]>("/hr/salary-payments")
  // Ensure res.data is an array before mapping
  const data = Array.isArray(res.data) ? res.data : [];
  // Map backend response to frontend shape if needed
  return data.map((p: any) => ({
    ...p,
    id: p.id,
    employeeId: p.employeeId,
    employee: p.employee,
    payPeriod: p.payPeriod,
    baseSalary: p.baseSalary,
    overtime: p.overtime,
    bonuses: p.bonuses,
    amount: p.amount,
    paymentMethod: p.paymentMethod,
    status: p.status,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    paymentDate: p.paymentDate,
    periodStart: p.periodStart,
    periodEnd: p.periodEnd,
    processedDate: p.processedDate,
  }));
}

export async function getNextPaymentPeriod(employeeId: string): Promise<{
  periodStart: string;
  periodEnd: string;
  payPeriod: string;
}> {
  const res = await axiosInstance.get(`/hr/salary-payments/next-period/${employeeId}`);
  return res.data;
}

export async function createSalaryPayment(body: CreateSalaryPaymentBody): Promise<SalaryPayment> {
  console.log("POST /hr/salary-payments", body);
  try {
    const res = await axiosInstance.post<SalaryPayment>("/hr/salary-payments", body)
    return res.data
  } catch (error: any) {
    if (error.response?.status === 400) {
      console.error("=== 400 Bad Request when creating salary payment ===");
      console.error("Request Body:", JSON.stringify(body, null, 2));
      console.error("Error Message:", error.response?.data?.message || error.message);
      console.error("Error Details:", JSON.stringify(error.response?.data, null, 2));
      console.error("Status Text:", error.response?.statusText);
    }
    throw error;
  }
}

export async function updateSalaryPayment(id: string, body: UpdateSalaryPaymentBody): Promise<SalaryPayment> {
  // Log the PATCH request body for debugging
  const patchBody = { ...body };
  if (patchBody.status) {
    patchBody.status = patchBody.status;
  }
  console.log("PATCH /hr/salary-payments/" + id, patchBody);
  try {
    const res = await axiosInstance.patch<SalaryPayment>(`/hr/salary-payments/${id}`, patchBody)
    return res.data
  } catch (error) {
    console.error("PATCH error", error);
    throw error;
  }
}

export async function deleteSalaryPayment(id: string): Promise<void> {
  await axiosInstance.delete(`/hr/salary-payments/${id}`)
}
