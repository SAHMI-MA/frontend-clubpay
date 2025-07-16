// lib/api/hr-leaves-api.ts
import { apiConfig } from "../api-config";
import { getAuthHeaders as getAuthHeadersUtil } from "../../utils/auth";
import { Employee } from "./hr-api";

const BASE_URL = apiConfig.baseUrl || "http://localhost:8080";

// --- Types ---
export enum LeaveType {
  VACATION = 'vacation',
  SICK_LEAVE = 'sick leave',
  PERSONAL = 'personal',
  MATERNITY = 'maternity',
  PATERNITY = 'paternity',
  BEREAVEMENT = 'bereavement',
  EMERGENCY = 'emergency',
  UNPAID = 'unpaid',
  COMPENSATORY = 'compensatory',
  SABBATICAL = 'sabbatical'
}

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveRequest {
  id: number;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysRequested: string;
  reason: string;
  status: LeaveStatus;
  approvedByUserId: number | null;
  approvedAt: string | null;
  approverComments: string | null;
  isHalfDay: boolean;
  halfDayPeriod: string | null;
  documentPath: string | null;
  emergencyContact: string | null;
  coveringEmployeeId: string | null;
  isPaidLeave: boolean;
  createdAt: string;
  updatedAt: string;
  employee: Employee;
}

export interface CreateLeaveRequestDto {
  employeeId: string; // Employee ID
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  daysRequested: number;
  status?: LeaveStatus;
}

export interface UpdateLeaveRequestDto {
  approverComments?: string;
  approvedBy?: number;
  approvalDate?: string; // ISO string
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

  // Approve leave request
  async approveLeave(id: string, data: UpdateLeaveRequestDto): Promise<LeaveRequest> {
    const res = await fetch(`${BASE_URL}/hr/leaves/${id}/approve`, {
      method: "PATCH",
      headers: { ...getAuthHeadersUtil(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Reject leave request
  async rejectLeave(id: string, data: UpdateLeaveRequestDto): Promise<LeaveRequest> {
    const res = await fetch(`${BASE_URL}/hr/leaves/${id}/reject`, {
      method: "PATCH",
      headers: { ...getAuthHeadersUtil(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },
};

export default hrLeavesApi;
