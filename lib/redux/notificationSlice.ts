import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getApiUrl } from '@/lib/api-config';
import { authUtils } from './auth-utils';

export interface Notification {
  id: number;
  type: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  recipient: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  actionUrl?: string;
  actionLabel?: string;
  status: 'unread' | 'read' | 'archived';
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  loading: boolean;
  error: string | null;
  lastFetched: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  total: 0,
  loading: false,
  error: null,
  lastFetched: null,
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ limit = 50, status }: { limit?: number; status?: string } = {}) => {
    const token = authUtils.getToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (status) params.append('status', status);

    const response = await fetch(
      `${getApiUrl('/notifications')}?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }

    return response.json();
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async () => {
    const token = authUtils.getToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(
      `${getApiUrl('/notifications/unread/count')}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch unread count');
    }

    const data = await response.json();
    return data.count;
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id: number) => {
    const token = authUtils.getToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(
      `${getApiUrl(`/notifications/${id}/read`)}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }

    return id;
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async () => {
    const token = authUtils.getToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(
      `${getApiUrl('/notifications/mark-all-read')}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }

    return response.json();
  }
);

export const archiveNotification = createAsyncThunk(
  'notifications/archive',
  async (id: number) => {
    const token = authUtils.getToken();
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(
      `${getApiUrl(`/notifications/${id}/archive`)}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to archive notification');
    }

    return id;
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      // Add new notification to the beginning of the list
      state.notifications.unshift(action.payload);
      state.total += 1;
      if (action.payload.status === 'unread') {
        state.unreadCount += 1;
      }
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.total = 0;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch notifications
    builder.addCase(fetchNotifications.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<{ notifications: Notification[]; total: number }>) => {
      state.loading = false;
      state.notifications = action.payload.notifications;
      state.total = action.payload.total;
      state.lastFetched = new Date().toISOString();
      // Update unread count
      state.unreadCount = action.payload.notifications.filter(n => n.status === 'unread').length;
    });
    builder.addCase(fetchNotifications.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch notifications';
    });

    // Fetch unread count
    builder.addCase(fetchUnreadCount.fulfilled, (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    });

    // Mark as read
    builder.addCase(markAsRead.fulfilled, (state, action: PayloadAction<number>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.status = 'read';
        notification.readAt = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    });

    // Mark all as read
    builder.addCase(markAllAsRead.fulfilled, (state) => {
      state.notifications.forEach(notification => {
        if (notification.status === 'unread') {
          notification.status = 'read';
          notification.readAt = new Date().toISOString();
        }
      });
      state.unreadCount = 0;
    });

    // Archive notification
    builder.addCase(archiveNotification.fulfilled, (state, action: PayloadAction<number>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        if (notification.status === 'unread') {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        notification.status = 'archived';
      }
      // Optionally remove from list
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    });
  },
});

export const { clearNotifications, clearError, addNotification, setUnreadCount } = notificationSlice.actions;
export default notificationSlice.reducer;
