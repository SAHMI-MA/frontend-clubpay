// lib/api/hr-files-api.ts
import { apiConfig } from "../api-config";
import { getAuthHeaders as getAuthHeadersUtil } from "../../utils/auth";
import { Employee } from "./hr-api";

const BASE_URL = apiConfig.baseUrl || "http://localhost:8080";

// --- Types ---
export interface EmployeeFile {
  id: number;
  employeeId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  expiryDate?: string | null;
  status: "active" | "archived" | "expired";
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
  description?: string | null;
}

export interface CreateEmployeeFileDto {
  employeeId: string;
  fileName: string;
  fileType: string;
  category: string;
  expiryDate?: string;
  status?: "active" | "archived" | "expired";
}

export interface UpdateEmployeeFileDto {
  expiryDate?: string;
  status?: "active" | "archived" | "expired";
}

export interface UploadEmployeeFileDto extends Omit<CreateEmployeeFileDto, 'fileName' | 'fileType'> {
  file: File;
}

export const hrFilesApi = {
  // List all employee files
  async getFiles(): Promise<EmployeeFile[]> {
    const res = await fetch(`${BASE_URL}/employee-files`, {
      method: "GET",
      headers: getAuthHeadersUtil(),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // hr-files-api.ts
  async uploadFile(data: {
    file: File;
    employeeId: string;
    category: string;
    expiryDate?: string;
    status?: string;
    description?: string;
  }): Promise<EmployeeFile> {
    const formData = new FormData();

    // Critical: The field name must match @FileInterceptor('file')
    formData.append('file', data.file);

    // Append other fields
    formData.append('employeeId', data.employeeId);
    formData.append('category', data.category);
    if (data.expiryDate) formData.append('expiryDate', data.expiryDate);
    if (data.status) formData.append('status', data.status);

    const res = await fetch(`${BASE_URL}/employee-files/upload`, {
      method: 'POST',
      headers: {
        ...getAuthHeadersUtil(),
      },
      body: formData,
    });

    if (!res.ok) {
      let error = 'Upload failed';
      try {
        const errData = await res.json();
        error = errData.message || error;
      } catch {
        error = res.statusText || error;
      }
      throw new Error(error);
    }

    return res.json();
  },

  // Download an employee file by filename
  async downloadFile(filename: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/employee-files/download/${filename}`, {
      method: "GET",
      headers: getAuthHeadersUtil(),
    });

    if (!res.ok) throw await res.json();

    // Handle the file download
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  // Get single file by ID
  async getFile(id: number): Promise<EmployeeFile> {
    const res = await fetch(`${BASE_URL}/employee-files/${id}`, {
      method: "GET",
      headers: getAuthHeadersUtil(),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Create an employee file record (metadata only, no upload)
  async createFile(data: CreateEmployeeFileDto): Promise<EmployeeFile> {
    const res = await fetch(`${BASE_URL}/employee-files`, {
      method: "POST",
      headers: {
        ...getAuthHeadersUtil(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Update an employee file record
  async updateFile(id: number, data: UpdateEmployeeFileDto): Promise<EmployeeFile> {
    const res = await fetch(`${BASE_URL}/employee-files/${id}`, {
      method: "PATCH",
      headers: {
        ...getAuthHeadersUtil(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },

  // Delete an employee file record
  async deleteFile(id: number): Promise<{ deleted: boolean }> {
    const res = await fetch(`${BASE_URL}/employee-files/${id}`, {
      method: "DELETE",
      headers: getAuthHeadersUtil(),
    });
    if (!res.ok) throw await res.json();
    return res.json();
  },
};

export default hrFilesApi;