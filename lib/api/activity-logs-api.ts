// Activity Logs API
export interface ActivityLog {
  id: number
  timestamp: string
  userId: number
  userFullName: string
  action: string
  details: string
  type: string
  entityType?: string
  entityId?: number
  ipAddress?: string
  userAgent?: string
}

export interface ActivityLogsResponse {
  data: ActivityLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

export interface ActivityLogFilterDto {
  page?: number
  limit?: number
  search?: string
  type?: string
  userId?: number
  entityType?: string
  entityId?: number
  startDate?: string
  endDate?: string
}

const API_BASE_URL = 'http://localhost:8080/api'

class ActivityLogsAPIService {
  private baseURL = API_BASE_URL
  private token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    }
  }

  async getActivityLogs(params: ActivityLogFilterDto = {}): Promise<ActivityLogsResponse> {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })
    
    const response = await fetch(`${this.baseURL}/activity-logs?${searchParams}`, {
      headers: this.getHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch activity logs')
    return response.json()
  }

  async exportActivityLogs(params: ActivityLogFilterDto = {}): Promise<Blob> {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })
    
    const response = await fetch(`${this.baseURL}/activity-logs/export?${searchParams}`, {
      headers: this.getHeaders()
    })
    if (!response.ok) throw new Error('Failed to export logs')
    return response.blob()
  }

  async getActivityStats(): Promise<{
    today: number
    thisWeek: number
    thisMonth: number
    total: number
    byType: Record<string, number>
    topUsers: Array<{ userId: number; userFullName: string; activityCount: number }>
  }> {
    const response = await fetch(`${this.baseURL}/activity-logs/stats`, {
      headers: this.getHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch activity stats')
    return response.json()
  }
}

export const activityLogsAPI = new ActivityLogsAPIService()
