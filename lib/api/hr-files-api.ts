// lib/api/hr-files-api.ts
import { apiConfig } from "../api-config";
import { getAuthHeaders as getAuthHeadersUtil } from "../../utils/auth";

const BASE_URL = apiConfig.baseUrl || "http://localhost:8080";

// --- Types ---
export interface EmployeeFile {
  id: string;
  employeeId: string;
  employeeName: string;
  fileName: string;
  fileType: string;
  category: "contract" | "insurance" | "certification" | "performance" | "personal" | "training";
  uploadDate: string;
  expiryDate?: string;
  status: "active" | "expired" | "pending" | "archived";
  fileSize: string;
  uploadedBy: string;
  description?: string;
}

export interface CreateEmployeeFileDto {
  employeeId: string;
  fileName: string;
  fileType: string;
  category: string;
  expiryDate?: string;
  status?: "active" | "archived" | "expired";
  description?: string;
}

export interface UpdateEmployeeFileDto {
  fileName?: string;
  fileType?: string;
  category?: string;
  expiryDate?: string;
  status?: "active" | "archived" | "expired";
  description?: string;
}

export const hrFilesApi = {
  // List all files
  async getFiles(): Promise<EmployeeFile[]> {
    const res = await fetch(`${BASE_URL}/hr/employee-files`, {
      headers: getAuthHeadersUtil(),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Upload a file (multipart/form-data)
  async uploadFile(formData: FormData): Promise<EmployeeFile> {
    const res = await fetch(`${BASE_URL}/hr/employee-files/upload`, {
      method: "POST",
      headers: { ...getAuthHeadersUtil() },
      body: formData,
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Download a file
  async downloadFile(filename: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/hr/employee-files/download/${filename}`, {
      headers: getAuthHeadersUtil(),
    });
    if (!res.ok) throw await res.json();
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  // Create file metadata (no upload)
  async createFileMeta(data: CreateEmployeeFileDto): Promise<EmployeeFile> {
    const res = await fetch(`${BASE_URL}/hr/employee-files`, {
      method: "POST",
      headers: { ...getAuthHeadersUtil(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Update file metadata
  async updateFile(id: string, data: UpdateEmployeeFileDto): Promise<EmployeeFile> {
    const res = await fetch(`${BASE_URL}/hr/employee-files/${id}`, {
      method: "PATCH",
      headers: { ...getAuthHeadersUtil(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Delete file
  async deleteFile(id: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/hr/employee-files/${id}`, {
      method: "DELETE",
      headers: getAuthHeadersUtil(),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },
};

export default hrFilesApi;
