// lib/api/hr-api.ts
import { apiConfig } from "../api-config";
import { getAuthHeaders as getAuthHeadersUtil } from "../../utils/auth";

const BASE_URL = apiConfig.baseUrl || "http://localhost:8080";

function buildQuery(params?: Record<string, any>): string {
  if (!params) return "";
  const esc = encodeURIComponent;
  return (
    "?" +
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${esc(k)}=${esc(v)}`)
      .join("&")
  );
}

// --- Types ---

// Employee
export interface Employee {
  employeeId: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  currentSalary: string;
  departmentId: number,
  department: {
    id: number;
    name: string;
    code?: string;
  };
  positionId: number;
  position: {
    id: number;
    title: string;
    level?: string;
  };
  status: EmployeeStatus;
  hireDate: string;
  phoneNumber: string;
  personalEmail: string;
  address: string;
  dateOfBirth: string;
  maritalStatus: MaritalStatus;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  nationalId: string;
  createdAt: string;
  updatedAt: string;
  // Add missing fields from API response
  bankAccountNumber?: string | null;
  bankName?: string | null;
  notes?: string | null;
  contracts?: any[];
}
export type EmployeeStatus = "Active" | "Inactive" | "Terminated" | "On Leave" | "Suspended";
export type MaritalStatus = "Single" | "Married" | "Divorced" | "Widowed";

export interface CreateEmployeeRequest {
  userId: number;
  departmentId: number;
  positionId: number;
  hireDate: string;
  phoneNumber: string;
  personalEmail: string;
  status: EmployeeStatus;
  address: string;
  dateOfBirth: string;
  maritalStatus: MaritalStatus;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  nationalId: string;
  currentSalary: string;
}
export type UpdateEmployeeRequest = Partial<Omit<CreateEmployeeRequest, "employeeId" | "userId">> & {
  departmentId?: number;
  positionId?: number;
  maritalStatus?: MaritalStatus;
  currentSalary?: string;
};
export interface UpdateEmployeeStatusRequest {
  status: EmployeeStatus;
}

// Department
export interface Department {
  id: number;
  name: string;
  code: string;
  description: string;
  location: string;
  budget: number;
  employeeCount?: number;
  employees?: Employee[];
  positions?: Position[];
  createdAt: string;
  updatedAt: string;
}
export interface CreateDepartmentRequest {
  name: string;
  code: string;
  description: string;
  location: string;
  budget: number;
  managerId: number;
}
export type UpdateDepartmentRequest = Partial<CreateDepartmentRequest>;

// Position
export interface Position {
  id: number;
  title: string;
  department: { id: number; name: string; code?: string };
  level: string;
  minSalary: number;
  maxSalary: number;
  description: string;
  requirements: string;
  openings: number;
  employeeCount?: number;
  employees?: Array<{ id: number; employeeId: string; user: { fullName: string } }>;
  createdAt: string;
  updatedAt: string;
}
export interface CreatePositionRequest {
  title: string;
  departmentId: number;
  level: string;
  minSalary: number;
  maxSalary: number;
  description: string;
  requirements: string;
  openings: number;
}
export type UpdatePositionRequest = Partial<CreatePositionRequest>;

// Contract
export interface Contract {
  id: number;
  employee: { id: number; employeeId: string; user: { fullName: string; email?: string }; department?: { name: string }; position?: { title: string } };
  contractType: string;
  status: string;
  salaryType: string;
  department: string;
  startDate: string;
  endDate: string;
  salary: number;
  jobTitle: string;
  contractNumber: string;
  benefits?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
  previousContractId?: number;
}
export interface CreateContractRequest {
  employeeId: string;
  contractType: string;
  status: string;
  salaryType: string;
  department: string;
  startDate: string;
  endDate: string;
  salary: number;
  jobTitle: string;
  contractNumber: string;
  benefits: string;
  terms: string;
}
export type UpdateContractRequest = Partial<Omit<CreateContractRequest, "employeeId" | "contractType" | "status" | "salaryType" | "department" | "startDate" | "endDate" | "contractNumber">> & {
  salary?: number;
  jobTitle?: string;
  benefits?: string;
  terms?: string;
};
export interface RenewContractRequest {
  newEndDate: string;
  newSalary: number;
  terms: string;
}
export interface TerminateContractRequest {
  terminationDate: string;
  reason: string;
  terminationTerms: string;
}

// --- API Functions ---

// Employees
export const hrApi = {
  // Employees
  async createEmployee(data: CreateEmployeeRequest): Promise<Employee> {
    const res = await fetch(`${BASE_URL}/hr/employees`, {
      method: "POST",
      headers: { ...getAuthHeadersUtil() , "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },
  async getEmployees(params?: { department?: number; position?: number; status?: EmployeeStatus }): Promise<Employee[]> {
    const res = await fetch(`${BASE_URL}/hr/employees${buildQuery(params)}`, {
      headers: getAuthHeadersUtil(),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },
  async getEmployeeStats(): Promise<any> {
    const res = await fetch(`${BASE_URL}/hr/employees/stats`, { headers: getAuthHeadersUtil() });
    if (!res.ok) throw await res.json();
    return res.json();
  },
  async getEmployeeById(id: string): Promise<Employee> {
    const res = await fetch(`${BASE_URL}/hr/employees/${id}`, { headers: getAuthHeadersUtil() });
    if (!res.ok) throw await res.json();
    return res.json();
  },
  async updateEmployee(id: string, data: UpdateEmployeeRequest): Promise<Employee> {
    const res = await fetch(`${BASE_URL}/hr/employees/${id}`, {
      method: "PATCH",
      headers: getAuthHeadersUtil(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },
  async updateEmployeeStatus(id: string, data: UpdateEmployeeStatusRequest): Promise<Employee> {
    const res = await fetch(`${BASE_URL}/hr/employees/${id}/status`, {
      method: "PATCH",
      headers: getAuthHeadersUtil(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },
  async deleteEmployee(id: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/hr/employees/${id}`, {
      method: "DELETE",
      headers: getAuthHeadersUtil(),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Departments
  async createDepartment(data: CreateDepartmentRequest): Promise<Department> {
    const res = await fetch(`${BASE_URL}/hr/departments`, {
      method: "POST",
      headers: { ...getAuthHeadersUtil(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },
  async getDepartments(): Promise<Department[]> {
    const res = await fetch(`${BASE_URL}/hr/departments`, { headers: getAuthHeadersUtil() });
    if (!res.ok) throw await res.json();
    return res.json();
  },
  async getDepartmentStats(): Promise<any> {
    const res = await fetch(`${BASE_URL}/hr/departments/stats`, { headers: getAuthHeadersUtil() });
    if (!res.ok) throw await res.json();
    return res.json();
  },
  async getDepartmentById(id: number): Promise<Department> {
    const res = await fetch(`${BASE_URL}/hr/departments/${id}`, { headers: getAuthHeadersUtil() });
    if (!res.ok) throw await res.json();
    return res.json();
  },
  async updateDepartment(id: number, data: UpdateDepartmentRequest): Promise<Department> {
    const res = await fetch(`${BASE_URL}/hr/departments/${id}`, {
      method: "PATCH",
      headers: { ...getAuthHeadersUtil(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },
  async deleteDepartment(id: number): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/hr/departments/${id}`, {
      method: "DELETE",
      headers: getAuthHeadersUtil(),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Positions
  async createPosition(data: CreatePositionRequest): Promise<Position> {
    const res = await fetch(`${BASE_URL}/hr/positions`, {
      method: "POST",
      headers: { ...getAuthHeadersUtil(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },
  async getPositions(params?: { department?: number }): Promise<Position[]> {
    const res = await fetch(`${BASE_URL}/hr/positions${buildQuery(params)}`, { headers: getAuthHeadersUtil() });
    if (!res.ok) throw await res.json();
    return res.json();
  },
  async getPositionStats(): Promise<any> {
    const res = await fetch(`${BASE_URL}/hr/positions/stats`, { headers: getAuthHeadersUtil() });
    if (!res.ok) throw await res.json();
    return res.json();
  },
  async getPositionById(id: number): Promise<Position> {
    const res = await fetch(`${BASE_URL}/hr/positions/${id}`, { headers: getAuthHeadersUtil() });
    if (!res.ok) throw await res.json();
    return res.json();
  },
  async updatePosition(id: number, data: UpdatePositionRequest): Promise<Position> {
    const res = await fetch(`${BASE_URL}/hr/positions/${id}`, {
      method: "PATCH",
      headers: { ...getAuthHeadersUtil(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },
  async deletePosition(id: number): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/hr/positions/${id}`, {
      method: "DELETE",
      headers: getAuthHeadersUtil(),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },
};

export default hrApi;
