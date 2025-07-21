import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface Notification {
  id: number;
  type: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("notifications?page=1&limit=10");
      // If using axios, res.data is the payload. If fetch, res is the payload.
      const data = (res && (res as any).data) ? (res as any).data : res;
      setNotifications(data || []);
    } catch (err) {
      // handle error
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("notifications/unread-count");
      const count = (res && (res as any).count) ? (res as any).count : (res as any).data?.count;
      setUnreadCount(count || 0);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
      // handle error
    }
  };

  // Mark notification as read
  const markAsRead = async (id: number) => {
    try {
      await api.post(`notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      fetchUnreadCount();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
        <Badge color="red" className="relative">
          <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-orange-500 text-xs flex items-center justify-center">
            {unreadCount}
          </span>
          <span className="sr-only">Notifications</span>
        </Badge>
        <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 shadow-lg rounded-lg p-4 z-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Close</Button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loading ? (
              <div>Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="text-gray-500">No notifications</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-2 rounded border ${n.isRead ? "bg-gray-100" : "bg-blue-50"}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{n.type.replace(/_/g, " ")}</span>
                      <span className="ml-2 text-xs text-gray-400">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {!n.isRead && (
                      <Button size="sm" onClick={() => markAsRead(n.id)}>
                        Mark as read
                      </Button>
                    )}
                  </div>
                  {/* Optionally render n.data details here */}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
