// lib/api/hr-leaves-api.ts
import { apiConfig } from "../api-config";
import { getAuthHeaders as getAuthHeadersUtil } from "../../utils/auth";

const BASE_URL = apiConfig.baseUrl || "http://localhost:8080";

// --- Types ---
export type LeaveType = "annual" | "sick" | "maternity" | "paternity" | "personal" | "training";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  requestDate: string;
  approvedBy?: string;
  approvalDate?: string;
  comments?: string;
}

export interface CreateLeaveRequestDto {
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface UpdateLeaveRequestDto {
  status?: LeaveStatus;
  approverComments?: string;
  approvedBy?: string;
  approvalDate?: string;
}

export const hrLeavesApi = {
  // List all leave requests
  async getLeaves(): Promise<LeaveRequest[]> {
    const res = await fetch(`${BASE_URL}/hr/leaves`, {
      headers: getAuthHeadersUtil(),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Create leave request
  async createLeave(data: CreateLeaveRequestDto): Promise<LeaveRequest> {
    const res = await fetch(`${BASE_URL}/hr/leaves`, {
      method: "POST",
      headers: { ...getAuthHeadersUtil(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Update leave request
  async updateLeave(id: string, data: UpdateLeaveRequestDto): Promise<LeaveRequest> {
    const res = await fetch(`${BASE_URL}/hr/leaves/${id}`, {
      method: "PATCH",
      headers: { ...getAuthHeadersUtil(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Delete leave request
  async deleteLeave(id: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/hr/leaves/${id}`, {
      method: "DELETE",
      headers: getAuthHeadersUtil(),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },
};

export default hrLeavesApi;
