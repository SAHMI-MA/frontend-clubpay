// Notification API
import { apiConfig } from '@/lib/api-config';
import { authUtils } from '@/lib/redux/auth-utils';

export interface Notification {
  id: number;
  type: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
}

class NotificationAPIService {
  private baseURL = apiConfig.baseUrl;

  private getAuthHeader(): Record<string, string> {
    const token = authUtils.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getNotifications(page = 1, limit = 10): Promise<NotificationListResponse> {
    const url = `${this.baseURL}/notifications?page=${page}&limit=${limit}`;
    const authHeader = this.getAuthHeader();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader.Authorization) headers['Authorization'] = authHeader.Authorization;
    console.log('[NotificationAPI] Fetching notifications:', { url, headers });
    const response = await fetch(url, { headers });
    console.log('[NotificationAPI] Response status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.error('[NotificationAPI] Failed to fetch notifications:', response.status, text);
      throw new Error('Failed to fetch notifications: ' + text);
    }
    return response.json();
  }

  async getUnreadCount(): Promise<number> {
    const url = `${this.baseURL}/notifications/unread-count`;
    const authHeader = this.getAuthHeader();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader.Authorization) headers['Authorization'] = authHeader.Authorization;
    console.log('[NotificationAPI] Fetching unread count:', { url, headers });
    const response = await fetch(url, { headers });
    console.log('[NotificationAPI] Response status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.error('[NotificationAPI] Failed to fetch unread count:', response.status, text);
      throw new Error('Failed to fetch unread count: ' + text);
    }
    const data = await response.json();
    return data.count;
  }

  async markAsRead(id: number): Promise<boolean> {
    const url = `${this.baseURL}/notifications/${id}/read`;
    const authHeader = this.getAuthHeader();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader.Authorization) headers['Authorization'] = authHeader.Authorization;
    console.log('[NotificationAPI] Marking as read:', { url, headers });
    const response = await fetch(url, { method: 'POST', headers });
    console.log('[NotificationAPI] Response status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.error('[NotificationAPI] Failed to mark as read:', response.status, text);
      throw new Error('Failed to mark notification as read: ' + text);
    }
    const data = await response.json();
    return data.success;
  }
}

export const notificationAPI = new NotificationAPIService(); 