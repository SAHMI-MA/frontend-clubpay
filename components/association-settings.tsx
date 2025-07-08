"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building, Camera, History, Save, Search, Settings, Upload, User, Activity, Loader2, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Filter } from "lucide-react"
import { toast } from "sonner"
import { getApiUrl } from "@/lib/api-config"

// Types
interface AssociationSettings {
  id: number
  name: string
  description: string
  contactEmail: string
  contactPhone: string
  address: string
  primaryColor: string
  secondaryColor: string
  tagline: string
  logoUrl?: string
  createdAt: string
  updatedAt: string
}

interface ActivityLog {
  id: number
  timestamp: string
  userId?: number | string | null // Make userId optional and accept different types
  userFullName: string
  action: string
  details: string
  type: string
  entityType?: string
  entityId?: number
  ipAddress?: string
  userAgent?: string
  // Add any other potential fields that might contain the user ID
  user?: {
    id?: number | string
  }
}

interface ActivityLogsResponse {
  data: ActivityLog[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// API Service
class AssociationAPI {
  private token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    
    return headers
  }

  private getUploadHeaders() {
    const headers: Record<string, string> = {}
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    
    return headers
  }

  async getSettings(): Promise<AssociationSettings> {
    const response = await fetch(getApiUrl('/associations/settings'), {
      headers: this.getHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch settings')
    return response.json()
  }

  async updateSettings(settings: Partial<AssociationSettings>): Promise<AssociationSettings> {
    console.log('Updating settings with data:', settings)
    console.log('Update URL:', getApiUrl('/associations/settings'))
    console.log('Auth token available:', !!this.token)
    
    const response = await fetch(getApiUrl('/associations/settings'), {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(settings)
    })
    
    console.log('Update response status:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Settings update failed:', response.status, errorText)
      throw new Error(`Failed to update settings: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log('Settings update successful:', result)
    return result
  }

  async uploadLogo(file: File): Promise<AssociationSettings> {
    console.log('Uploading logo file:', file.name, file.size, file.type)
    
    const formData = new FormData()
    formData.append('file', file)  // Backend expects 'file' field name
    
    console.log('Uploading logo to:', getApiUrl('/associations/logo'))
    console.log('Auth token available:', !!this.token)
    
    const response = await fetch(getApiUrl('/associations/logo'), {
      method: 'POST',
      headers: this.getUploadHeaders(),
      body: formData
    })
    
    console.log('Response status:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Logo upload failed:', response.status, errorText)
      throw new Error(`Failed to upload logo: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log('Logo upload successful! Response:', result)
    
    // The backend returns the full updated settings object
    return result
  }
  
  private getCurrentSettings(): AssociationSettings {
    // Return a minimal settings object that can be merged
    return {
      id: 1,
      name: '',
      description: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      primaryColor: '#1E3A8A',
      secondaryColor: '#F97316',
      tagline: '',
      logoUrl: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  async deleteLogo(): Promise<AssociationSettings> {
    const response = await fetch(getApiUrl('/associations/logo'), {
      method: 'DELETE',
      headers: this.getHeaders()
    })
    if (!response.ok) throw new Error('Failed to delete logo')
    return response.json()
  }

  async getActivityLogs(params: {
    page?: number
    limit?: number
    search?: string
    type?: string
    userId?: number
    startDate?: string
    endDate?: string
    entityType?: string
  } = {}): Promise<ActivityLogsResponse> {
    // Create a clean copy of params without sortBy and sortOrder
    const apiParams = { ...params }
    delete (apiParams as any).sortBy
    delete (apiParams as any).sortOrder
    
    const searchParams = new URLSearchParams()
    Object.entries(apiParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') searchParams.append(key, value.toString())
    })
    
    const url = getApiUrl(`/activity-logs?${searchParams}`)
    console.log('Fetching activity logs from:', url)
    console.log('Auth token available:', !!this.token)
    console.log('Request params:', apiParams)
    
    const response = await fetch(url, {
      headers: this.getHeaders()
    })
    
    console.log('Activity logs response status:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Activity logs fetch failed:', response.status, errorText)
      throw new Error(`Failed to fetch activity logs: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log('Activity logs response:', result)
    return result
  }

  async exportActivityLogs(params: {
    page?: number
    limit?: number
    search?: string
    type?: string
    userId?: number
    startDate?: string
    endDate?: string
    entityType?: string
  } = {}): Promise<Blob> {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') searchParams.append(key, value.toString())
    })
    
    const url = getApiUrl(`/activity-logs/export?${searchParams}`)
    console.log('Exporting activity logs from:', url)
    
    const response = await fetch(url, {
      headers: this.getHeaders()
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Activity logs export failed:', response.status, errorText)
      throw new Error(`Failed to export logs: ${response.status} ${response.statusText}`)
    }
    
    return response.blob()
  }
}

export function AssociationSettings() {
  // API instance
  const api = new AssociationAPI()
  
  // State management
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [exportingLogs, setExportingLogs] = useState(false)
  
  // Settings state
  const [settings, setSettings] = useState<AssociationSettings | null>(null)
  const [associationName, setAssociationName] = useState("")
  const [associationDescription, setAssociationDescription] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [address, setAddress] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#1E3A8A")
  const [secondaryColor, setSecondaryColor] = useState("#F97316")
  const [tagline, setTagline] = useState("")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  
  // Activity logs state
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [logsLoading, setLogsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sortBy, setSortBy] = useState<string>('timestamp')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Additional filter states
  const [activityType, setActivityType] = useState<string>("all")
  const [userId, setUserId] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [entityType, setEntityType] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)
  
  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  // Update form fields when settings change
  useEffect(() => {
    if (settings) {
      setAssociationName(settings.name)
      setAssociationDescription(settings.description)
      setContactEmail(settings.contactEmail)
      setContactPhone(settings.contactPhone)
      setAddress(settings.address)
      setPrimaryColor(settings.primaryColor)
      setSecondaryColor(settings.secondaryColor)
      setTagline(settings.tagline)
      // Convert relative logo URL to full URL for display
      setLogoUrl(settings.logoUrl ? `http://localhost:8080${settings.logoUrl}` : null)
    }
  }, [settings])

  // Load activity logs when search term or filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadActivityLogs()
    }, 300) // Debounce search and filter changes

    return () => clearTimeout(timeoutId)
  }, [searchTerm, currentPage, pageSize, activityType, userId, startDate, endDate, entityType])



  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load settings and logs separately to handle individual failures
      let settingsData = null
      let logsData = null
      
      try {
        settingsData = await api.getSettings()
        setSettings(settingsData)
      } catch (error) {
        console.error('Failed to load settings:', error)
        toast.error('Failed to load association settings')
      }
      
      try {
        logsData = await api.getActivityLogs({ page: 1, limit: pageSize })
        setActivityLogs(logsData?.data || [])
        setTotalPages(logsData?.totalPages || 1)
        setTotalRecords(logsData?.total || 0)
      } catch (error) {
        console.error('Failed to load activity logs:', error)
        toast.error('Failed to load activity logs')
        setActivityLogs([])
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Unexpected error in loadData:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadActivityLogs = async () => {
    try {
      setLogsLoading(true)
      const logsData = await api.getActivityLogs({
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
        type: activityType === "all" ? undefined : activityType || undefined,
        userId: userId ? parseInt(userId) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        entityType: entityType || undefined
      })
      
      console.log('Activity logs data structure:', logsData?.data?.[0])
      
      // Map through the logs and ensure userId is properly set
      const processedLogs = (logsData?.data || []).map(log => {
        // If userId is missing or null, try to extract it from another field
        if (!log.userId && log.userFullName) {
          // Try to extract numeric part from the user name (assuming format like "admin 1")
          const numericMatch = log.userFullName.match(/\d+/);
          if (numericMatch) {
            log.userId = parseInt(numericMatch[0], 10);
          }
        }
        return log;
      });
      
      setActivityLogs(processedLogs)
      setTotalPages(logsData?.totalPages || 1)
      setTotalRecords(logsData?.total || 0)
    } catch (error) {
      console.error('Failed to load activity logs:', error)
      toast.error('Failed to load activity logs')
      // Set fallback values on error
      setActivityLogs([])
      setTotalPages(1)
      setTotalRecords(0)
    } finally {
      setLogsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      
      const settingsToUpdate = {
        name: associationName,
        description: associationDescription,
        contactEmail,
        contactPhone,
        address,
        primaryColor,
        secondaryColor,
        tagline
      }
      
      console.log('Saving settings:', settingsToUpdate)
      
      const updatedSettings = await api.updateSettings(settingsToUpdate)
      
      setSettings(updatedSettings)
      toast.success('✅ Association settings have been saved successfully!', {
        duration: 4000,
        description: 'All changes to your association information have been updated.'
      })
      
      // Dispatch custom event to notify other components of the update
      window.dispatchEvent(new CustomEvent('associationSettingsUpdated'))
    } catch (error) {
      console.error('Failed to save settings:', error)
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403')) {
          toast.error('Authentication failed. Please log in again.')
        } else if (error.message.includes('400')) {
          toast.error('Invalid data provided. Please check your inputs.')
        } else if (error.message.includes('404')) {
          toast.error('Settings endpoint not found. Please contact support.')
        } else if (error.message.includes('500')) {
          toast.error('Server error. Please try again later.')
        } else {
          toast.error(`Failed to save settings: ${error.message}`)
        }
      } else {
        toast.error('Failed to save settings. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBranding = async () => {
    try {
      setSaving(true)
      
      const updatedSettings = await api.updateSettings({
        primaryColor,
        secondaryColor,
        tagline
      })
      
      setSettings(updatedSettings)
      toast.success('✅ Branding settings have been saved successfully!', {
        duration: 4000,
        description: 'Your association branding has been updated.'
      })
      
      // Dispatch custom event to notify other components of the update
      window.dispatchEvent(new CustomEvent('associationSettingsUpdated'))
    } catch (error) {
      console.error('Failed to save branding:', error)
      toast.error('Failed to save branding')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast.error('File size must be less than 10MB')
      return
    }

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error('Please upload a valid image file (JPG, PNG, GIF, WebP)')
      return
    }

    try {
      setUploadingLogo(true)
      console.log('Uploading logo file:', file.name, file.size, file.type)
      
      const updatedSettings = await api.uploadLogo(file)
      console.log('Logo upload successful, updated settings:', updatedSettings)
      
      setSettings(updatedSettings)
      // Convert relative logo URL to full URL for display
      setLogoUrl(updatedSettings.logoUrl ? `http://localhost:8080${updatedSettings.logoUrl}` : null)
      toast.success('✅ Logo uploaded successfully!', {
        duration: 4000,
        description: 'Your association logo has been updated and is now visible.'
      })
      
      // Dispatch custom event to notify other components of the update
      window.dispatchEvent(new CustomEvent('associationSettingsUpdated'))
    } catch (error) {
      console.error('Failed to upload logo:', error)
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('413')) {
          toast.error('File is too large. Please choose a smaller image.')
        } else if (error.message.includes('415')) {
          toast.error('Unsupported file type. Please use JPG, PNG, GIF, or WebP.')
        } else if (error.message.includes('401') || error.message.includes('403')) {
          toast.error('Authentication failed. Please log in again.')
        } else if (error.message.includes('500')) {
          toast.error('Server error. Please try again later.')
        } else {
          toast.error(`Upload failed: ${error.message}`)
        }
      } else {
        toast.error('Failed to upload logo. Please try again.')
      }
    } finally {
      setUploadingLogo(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveLogo = async () => {
    try {
      setUploadingLogo(true)
      const updatedSettings = await api.deleteLogo()
      setSettings(updatedSettings)
      setLogoUrl(null)
      toast.success('✅ Logo removed successfully!', {
        duration: 4000,
        description: 'Your association logo has been removed.'
      })
      
      // Dispatch custom event to notify other components of the update
      window.dispatchEvent(new CustomEvent('associationSettingsUpdated'))
    } catch (error) {
      console.error('Failed to remove logo:', error)
      toast.error('Failed to remove logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleExportLogs = async () => {
    try {
      setExportingLogs(true)
      const blob = await api.exportActivityLogs({
        search: searchTerm || undefined,
        type: activityType === "all" ? undefined : activityType || undefined,
        userId: userId ? parseInt(userId) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        entityType: entityType || undefined
      })
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Activity logs exported successfully!')
    } catch (error) {
      console.error('Failed to export logs:', error)
      toast.error('Failed to export activity logs')
    } finally {
      setExportingLogs(false)
    }
  }

  const resetFilters = () => {
    setSearchTerm("")
    setActivityType("all")
    setUserId("")
    setStartDate("")
    setEndDate("")
    setEntityType("")
    setCurrentPage(1)
  }

  // Pagination helpers
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
    
    // Perform client-side sorting
    if (activityLogs.length > 0) {
      const sortedLogs = [...activityLogs].sort((a: any, b: any) => {
        const valueA = a[column] || '';
        const valueB = b[column] || '';
        
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return sortOrder === 'asc' 
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        } else {
          // Handle numeric or other types
          return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
        }
      });
      
      setActivityLogs(sortedLogs);
    }
  }

  const getPageNumbers = () => {
    const delta = 2 // Number of pages to show on each side of current page
    const pages: (number | string)[] = []
    
    if (totalPages <= 7) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show condensed pagination
      pages.push(1)
      
      if (currentPage > delta + 2) {
        pages.push('...')
      }
      
      const start = Math.max(2, currentPage - delta)
      const end = Math.min(totalPages - 1, currentPage + delta)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (currentPage < totalPages - delta - 1) {
        pages.push('...')
      }
      
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  const getActionColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "create":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "update":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "payment":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      case "schedule":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
      case "system":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-800" />
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading association settings...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Association Settings</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage association details, branding, and system logs</p>
            </div>
          </div>

          <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="users">User Settings</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <Building className="h-5 w-5" />
                Association Information
              </CardTitle>
              <CardDescription>Update your association&apos;s basic information and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="associationName">Association Name</Label>
                  <Input
                    id="associationName"
                    value={associationName}
                    onChange={(e) => setAssociationName(e.target.value)}
                    placeholder="Enter association name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Enter contact email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Enter contact phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter association address"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={associationDescription}
                  onChange={(e) => setAssociationDescription(e.target.value)}
                  placeholder="Enter association description"
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveSettings}
                  disabled={saving || loading}
                  className="bg-blue-800 hover:bg-blue-900 text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Branding & Logo
              </CardTitle>
              <CardDescription>Customize your association&apos;s visual identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Association Logo</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 relative">
                      {logoUrl ? (
                        <>
                          <img 
                            src={logoUrl} 
                            alt="Association Logo" 
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600"
                            onClick={handleRemoveLogo}
                            disabled={uploadingLogo}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <Camera className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button 
                        variant="outline" 
                        className="bg-white dark:bg-gray-800"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingLogo}
                      >
                        {uploadingLogo ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Logo
                          </>
                        )}
                      </Button>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Recommended: 200x200px, PNG or JPG (Max 10MB)</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input id="primaryColor" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-16 h-10 p-1 border rounded" />
                      <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="Hex color code" className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} placeholder="Hex color code" className="flex-1" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Association Tagline</Label>
                  <Input
                    id="tagline"
                    placeholder="Enter a memorable tagline"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveBranding}
                  disabled={saving || loading}
                  className="bg-blue-800 hover:bg-blue-900 text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Branding
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <User className="h-5 w-5" />
                User Management Settings
              </CardTitle>
              <CardDescription>Configure user roles, permissions, and access controls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Advanced user management settings and role configurations.
                </p>
                <Button className="bg-blue-800 hover:bg-blue-900 text-white">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Permissions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <History className="h-5 w-5" />
                Activity Logs
              </CardTitle>
              <CardDescription>Monitor system activities and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search activity logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    disabled={logsLoading}
                  />
                  {logsLoading && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="bg-white dark:bg-gray-800"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className={`h-4 w-4 mr-2 ${showFilters ? 'text-blue-600' : ''}`} />
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="bg-white dark:bg-gray-800"
                    onClick={handleExportLogs}
                    disabled={exportingLogs || logsLoading}
                  >
                    {exportingLogs ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Activity className="h-4 w-4 mr-2" />
                        Export Logs
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {showFilters && (
                <div className="mb-6 p-4 border rounded-md bg-gray-50 dark:bg-gray-800/50 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="activityType">Activity Type</Label>
                      <Select value={activityType} onValueChange={setActivityType}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="Create">Create</SelectItem>
                          <SelectItem value="Update">Update</SelectItem>
                          <SelectItem value="Delete">Delete</SelectItem>
                          <SelectItem value="Payment">Payment</SelectItem>
                          <SelectItem value="Schedule">Schedule</SelectItem>
                          <SelectItem value="System">System</SelectItem>
                          <SelectItem value="Login">Login</SelectItem>
                          <SelectItem value="Logout">Logout</SelectItem>
                          <SelectItem value="Approve">Approve</SelectItem>
                          <SelectItem value="Reject">Reject</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="userId">User ID</Label>
                      <Input 
                        id="userId"
                        type="number"
                        placeholder="Filter by user ID"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="entityType">Entity Type</Label>
                      <Input 
                        id="entityType"
                        placeholder="e.g., player, team, contract"
                        value={entityType}
                        onChange={(e) => setEntityType(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input 
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input 
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={resetFilters}
                      disabled={logsLoading}
                    >
                      Clear Filters
                    </Button>
                    <Button 
                      onClick={() => loadActivityLogs()}
                      disabled={logsLoading}
                      className="bg-blue-800 hover:bg-blue-900 text-white"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              )}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" 
                        onClick={() => handleSortChange('timestamp')}
                      >
                        <div className="flex items-center gap-2">
                          Timestamp
                          {sortBy === 'timestamp' ? (
                            sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" 
                        onClick={() => handleSortChange('userId')}
                      >
                        <div className="flex items-center gap-2">
                          User ID
                          {sortBy === 'userId' ? (
                            sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" 
                        onClick={() => handleSortChange('userFullName')}
                      >
                        <div className="flex items-center gap-2">
                          User Name
                          {sortBy === 'userFullName' ? (
                            sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" 
                        onClick={() => handleSortChange('action')}
                      >
                        <div className="flex items-center gap-2">
                          Action
                          {sortBy === 'action' ? (
                            sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" 
                        onClick={() => handleSortChange('type')}
                      >
                        <div className="flex items-center gap-2">
                          Type
                          {sortBy === 'type' ? (
                            sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                          ) : (
                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                          )}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          <p className="mt-2 text-gray-500">Loading activity logs...</p>
                        </TableCell>
                      </TableRow>
                    ) : activityLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <p className="text-gray-500">No activity logs found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      activityLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-center">
                            {log.userId ? log.userId : "—"}
                          </TableCell>
                          <TableCell className="font-medium">{log.userFullName}</TableCell>
                          <TableCell>{log.action}</TableCell>
                          <TableCell className="max-w-xs truncate" title={log.details}>
                            {log.details}
                          </TableCell>
                          <TableCell>
                            <Badge className={getActionColor(log.type)}>{log.type}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Enhanced Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <span>Show</span>
                    <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span>entries</span>
                  </div>
                  {totalRecords > 0 && (
                    <div className="hidden sm:block">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} entries
                    </div>
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    {/* First Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1 || logsLoading}
                      className="hidden sm:flex"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>

                    {/* Previous Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || logsLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Previous</span>
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, index) => (
                        <div key={index}>
                          {page === '...' ? (
                            <span className="px-2 text-gray-400">...</span>
                          ) : (
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page as number)}
                              disabled={logsLoading}
                              className={`w-10 h-8 p-0 ${currentPage === page ? 'bg-blue-800 hover:bg-blue-900' : ''}`}
                            >
                              {page}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Next Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || logsLoading}
                    >
                      <span className="hidden sm:inline mr-1">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    {/* Last Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages || logsLoading}
                      className="hidden sm:flex"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </>
      )}
    </div>
  )
}
