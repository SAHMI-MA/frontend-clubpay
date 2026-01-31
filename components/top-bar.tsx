"use client"

import { Bell, Moon, Search, Sun, User, Globe, Info, AlertCircle, Package, DollarSign, UserPlus, FileText } from "lucide-react"
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
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, RootState } from "@/lib/redux/store"
import { fetchNotifications, markAsRead, markAllAsRead } from "@/lib/redux/notificationSlice"
import { useRouter } from "next/navigation"

interface TopBarProps {
  darkMode: boolean
  setDarkMode: (darkMode: boolean) => void
  user: { name: string; email: string; role: string } | null
  isWebSocketConnected: boolean
  onLogout: () => void
  onNavigateToProfile?: () => void
  onNavigateToSettings?: () => void
}

export function TopBar({ darkMode, setDarkMode, user, isWebSocketConnected, onLogout, onNavigateToProfile, onNavigateToSettings }: TopBarProps) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { notifications, unreadCount, loading } = useSelector((state: RootState) => state.notifications)
  
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  // Fetch initial notifications on mount
  useEffect(() => {
    dispatch(fetchNotifications({ limit: 20 }))
  }, [dispatch])

  const handleMarkAsRead = async (id: number) => {
    await dispatch(markAsRead(id))
  }

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true)
    await dispatch(markAllAsRead())
    setMarkingAll(false)
  }

  const handleNotificationClick = (notification: any) => {
    // Mark as read if unread
    if (notification.status === 'unread') {
      handleMarkAsRead(notification.id)
    }
    
    // Close dropdown
    setNotifDropdownOpen(false)
    
    // Navigate if action URL exists
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  // Icon by notification type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'acquisition_created':
      case 'acquisition_approved':
      case 'acquisition_rejected':
        return <Package className="h-4 w-4 text-purple-500" />
      case 'salary_payment_created':
      case 'salary_payment_approved':
      case 'salary_payment_rejected':
        return <DollarSign className="h-4 w-4 text-green-500" />
      case 'stock_low':
      case 'stock_out':
      case 'stock_movement':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'employee_added':
      case 'employee_updated':
        return <UserPlus className="h-4 w-4 text-blue-500" />
      case 'system_alert':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'reminder':
        return <Info className="h-4 w-4 text-blue-500" />
      case 'info':
        return <FileText className="h-4 w-4 text-gray-500" />
      default: 
        return <Bell className="h-4 w-4 text-blue-500" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgent'
      case 'high': return 'Élevé'
      case 'medium': return 'Moyen'
      case 'low': return 'Faible'
      default: return priority
    }
  }

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
              title={isWebSocketConnected ? "Notifications (Connecté en temps réel)" : "Notifications"}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs p-0 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
              {/* WebSocket connection indicator */}
              {isWebSocketConnected && (
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-white dark:border-gray-800" 
                  title="Connecté en temps réel"
                />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 max-h-[500px] overflow-y-auto p-0">
            <div className="flex items-center justify-between px-4 pt-3 pb-2 sticky top-0 bg-white dark:bg-gray-800 border-b">
              <DropdownMenuLabel className="text-base">Notifications</DropdownMenuLabel>
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
            {loading ? (
              <div className="flex items-center justify-center p-8 text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center p-8 text-gray-400">
                <Bell className="h-12 w-12 mb-3 opacity-30" />
                <span className="text-sm">Aucune notification</span>
              </div>
            ) : (
              notifications.map((notification) => {
                const formattedDate = new Date(notification.createdAt).toLocaleString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })
                
                return (
                  <DropdownMenuItem
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 transition-all duration-200 ${
                      notification.actionUrl 
                        ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer' 
                        : 'cursor-default'
                    } ${
                      notification.status === 'unread' 
                        ? 'bg-blue-50 dark:bg-blue-900/10' 
                        : 'bg-white dark:bg-gray-800'
                    }`}
                  >
                    <span className="mt-1 flex-shrink-0">{getTypeIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`block text-sm ${notification.status === 'unread' ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </span>
                        {notification.status === 'unread' && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>
                      <span className="block text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {notification.message}
                      </span>
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <span className="text-xs text-gray-400">{formattedDate}</span>
                        <Badge className={`text-xs px-2 py-0 ${getPriorityBadge(notification.priority)}`}>
                          {getPriorityLabel(notification.priority)}
                        </Badge>
                      </div>
                      {notification.actionLabel && notification.actionUrl && (
                        <span className="inline-flex items-center text-xs text-blue-600 mt-1.5 font-medium group-hover:underline">
                          <span>→ {notification.actionLabel}</span>
                        </span>
                      )}
                    </div>
                  </DropdownMenuItem>
                )
              })
            )}
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
