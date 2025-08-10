"use client"

import { Bell, Moon, Search, Sun, User, Globe, Info, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { notificationAPI, Notification } from "@/lib/api/notification-api"

interface TopBarProps {
  darkMode: boolean
  setDarkMode: (darkMode: boolean) => void
  user: { name: string; email: string; role: string } | null
  onLogout: () => void
  onNavigateToProfile?: () => void
  onNavigateToSettings?: () => void
}

export function TopBar({ darkMode, setDarkMode, user, onLogout, onNavigateToProfile, onNavigateToSettings }: TopBarProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  // Fetch unread count on mount and when notifications change
  useEffect(() => {
    if (!user) return;
    notificationAPI.getUnreadCount().then(setUnreadCount).catch(() => setUnreadCount(0));
  }, [user]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (notifDropdownOpen && user) {
      setLoading(true);
      notificationAPI.getNotifications(1, 10)
        .then(res => setNotifications(res.data))
        .finally(() => setLoading(false));
    }
  }, [notifDropdownOpen, user]);

  const handleMarkAsRead = async (id: number) => {
    await notificationAPI.markAsRead(id);
    setNotifications(notifications => notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(count => Math.max(0, count - 1));
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    await Promise.all(
      notifications.filter(n => !n.isRead).map(n => notificationAPI.markAsRead(n.id))
    );
    setNotifications(notifications => notifications.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    setMarkingAll(false);
  };

  // Icon by type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 w-full">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            className="w-64 pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Sélecteur de langue (désactivé car i18n supprimé) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600 dark:text-gray-400"
              title="Langue"
            >
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className={'fr' === 'fr' ? 'bg-gray-100 dark:bg-gray-700' : ''}>
              Français
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dark Mode Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDarkMode(!darkMode)}
          className="text-gray-600 dark:text-gray-400"
          title={darkMode ? 'Mode clair' : 'Mode sombre'}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <DropdownMenu open={notifDropdownOpen} onOpenChange={setNotifDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-gray-600 dark:text-gray-400"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-orange-500 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 max-h-96 overflow-y-auto p-0">
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              {unreadCount > 0 && (
                <button
                  className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                  onClick={handleMarkAllAsRead}
                  disabled={markingAll}
                >
                  {markingAll ? 'Chargement...' : 'Tout marquer comme lu'}
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            {loading ? (
              <div className="flex flex-col items-center p-6 text-gray-400">
                <Info className="h-8 w-8 mb-2 animate-pulse" />
                <span>Chargement...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center p-6 text-gray-400">
                <Bell className="h-8 w-8 mb-2" />
                <span>Aucune notification</span>
              </div>
            ) : notifications.map(n => {
              const title = n.data?.title || n.type;
              const message = n.data?.message || '';
              return (
                <DropdownMenuItem
                  key={n.id}
                  onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 transition-colors cursor-pointer ${!n.isRead ? 'bg-orange-50 dark:bg-gray-700 font-semibold' : 'bg-white dark:bg-gray-800'}`}
                >
                  <span className="mt-1">{getTypeIcon(n.type)}</span>
                  <span className="flex-1">
                    <span className="block text-sm">{title}</span>
                    {message && <span className="block text-xs text-gray-500 dark:text-gray-400">{message}</span>}
                    <span className="block text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</span>
                  </span>
                  {!n.isRead && <span className="text-xs text-orange-500 mt-1">Non lu</span>}
                </DropdownMenuItem>
              );
            })}
            <div className="px-4 py-2 text-center text-xs text-blue-600 hover:underline cursor-pointer border-t border-gray-100 dark:border-gray-700">
              Voir toutes les notifications
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <User className="h-4 w-4" />
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onNavigateToProfile}>Profil</DropdownMenuItem>
            <DropdownMenuItem onClick={onNavigateToSettings}>Paramètres</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-red-600 dark:text-red-400">
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
