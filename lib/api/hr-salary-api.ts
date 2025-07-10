// lib/api/hr-salary-api.ts
import axios from "axios"

export interface SalaryPayment {
  id: string
  employeeId: string
  employeeName: string
  position: string
  payPeriod: string
  baseSalary: number
  overtime: number
  bonuses: number
  deductions: number
  grossPay: number
  netPay: number
  paymentMethod: string
  status: "pending" | "processed" | "failed" | "cancelled"
  processedDate?: string
  paymentDate: string
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
  const res = await axios.get<SalaryPayment[]>("/hr/salary-payments")
  return res.data
}

export async function createSalaryPayment(body: CreateSalaryPaymentBody): Promise<SalaryPayment> {
  const res = await axios.post<SalaryPayment>("/hr/salary-payments", body)
  return res.data
}

export async function updateSalaryPayment(id: string, body: UpdateSalaryPaymentBody): Promise<SalaryPayment> {
  const res = await axios.patch<SalaryPayment>(`/hr/salary-payments/${id}`, body)
  return res.data
}

export async function deleteSalaryPayment(id: string): Promise<void> {
  await axios.delete(`/hr/salary-payments/${id}`)
}
