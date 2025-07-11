// lib/api/hr-salary-api.ts
import { apiConfig } from "../api-config";
import axios from "axios"

const axiosInstance = axios.create({
  baseURL: apiConfig.baseUrl,
});

export interface SalaryPayment {
  id: string | number;
  employeeId: string;
  employee?: {
    id: number;
    employeeId: string;
    hireDate: string;
    status: string;
    phoneNumber: string;
    personalEmail: string;
    address: string;
    dateOfBirth: string;
    maritalStatus: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelationship: string;
    nationalId: string;
    bankAccountNumber: string;
    bankName: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
    currentSalary: string;
  };
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
}

export interface CreateSalaryPaymentBody {
  employeeId: string
  payPeriod: string
  baseSalary: number
  overtime: number
  bonuses: number
  paymentMethod: string
  status: "pending" | "processed" | "failed" | "cancelled"
}

export interface UpdateSalaryPaymentBody {
  status?: "pending" | "processed" | "failed" | "cancelled"
  [key: string]: any
}

export async function listSalaryPayments(): Promise<SalaryPayment[]> {
  const res = await axiosInstance.get<SalaryPayment[]>("/hr/salary-payments")
  // Map backend response to frontend shape if needed
  return res.data.map((p: any) => ({
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

export async function createSalaryPayment(body: CreateSalaryPaymentBody): Promise<SalaryPayment> {
  const res = await axiosInstance.post<SalaryPayment>("/hr/salary-payments", body)
  return res.data
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
