import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { AppDispatch } from '@/lib/redux/store';
import { 
  addNotification, 
  setUnreadCount,
  fetchNotifications 
} from '@/lib/redux/notificationSlice';
import { apiConfig } from '@/lib/api-config';

export function useNotificationWebSocket(token: string | null) {
  const dispatch = useDispatch<AppDispatch>();
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (!token || socketRef.current?.connected) {
      return;
    }

    // Create WebSocket connection
    const socket = io(`${apiConfig.baseUrl}/notifications`, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      // Fetch initial notifications
      dispatch(fetchNotifications({ limit: 20 }));
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
    });

    // Listen for new notifications
    socket.on('newNotification', (notification) => {
      console.log('🔔 New notification received:', notification);
      dispatch(addNotification(notification));
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logos/logo.png',
          tag: `notification-${notification.id}`,
        });
      }
    });

    // Listen for unread count updates
    socket.on('unreadCount', ({ count }) => {
      console.log('📊 Unread count updated:', count);
      dispatch(setUnreadCount(count));
    });

    socketRef.current = socket;
  }, [token, dispatch]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      console.log('🔌 WebSocket disconnected manually');
    }
  }, []);

  const markAsRead = useCallback((notificationId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('markAsRead', { notificationId });
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('markAllAsRead');
    }
  }, []);

  useEffect(() => {
    if (token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  return {
    isConnected: socketRef.current?.connected || false,
    markAsRead,
    markAllAsRead,
  };
}
