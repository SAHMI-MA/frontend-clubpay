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
import { getApiUrl, apiConfig } from "@/lib/api-config"
import { useTranslation } from "react-i18next"

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
  
  // Get translation function
  const { t, i18n } = useTranslation()
  
  // Use a simple re-render trigger that doesn't create new objects
  const [, setLanguageKey] = useState(0);
  
  // Listen for language changes to force re-render - with improved stability
  useEffect(() => {
    // Prevent subscribing multiple times 
    const handleLanguageChanged = () => {
      console.log('Language change detected in AssociationSettings');
      // Use a stable update that won't cause infinite loops
      setLanguageKey(prev => prev + 1);
    };
    
    // Use a debounced version to prevent excessive updates
    let timeoutId: NodeJS.Timeout;
    const debouncedHandler = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleLanguageChanged, 50);
    };
    
    window.addEventListener('languageChanged', debouncedHandler);
    
    console.log('AssociationSettings mounted with language:', i18n?.language);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('languageChanged', debouncedHandler);
    };
  }, []); // Empty dependency array for stability
  
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
  
  // Custom tagline setter
  const updateTagline = (value: string) => {
    // We want to allow empty values too
    setTagline(value)
  }
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
    // Create a flag to track if component is mounted
    let isMounted = true;
    
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Load settings and logs separately to handle individual failures
        let settingsData = null;
        
        try {
          settingsData = await api.getSettings();
          
          if (settingsData && isMounted) {
            setSettings(settingsData);
          }
        } catch (error) {
          console.error('Failed to load settings:', error);
        }
        
        // Load initial activity logs separately from settings
        if (isMounted) {
          loadActivityLogs();
        }
      } catch (error) {
        console.error('Unexpected error in loadData:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchInitialData();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []);

  // Update form fields when settings change - using a ref to prevent infinite loops
  const initialLoad = useRef(true);
  
  useEffect(() => {
    // Only update if settings exist and it's either initial load or settings have genuinely changed
    if (settings && initialLoad.current) {
      console.log('Initial settings load, updating form fields:', settings);
      
      // Use synchronous updates to avoid async issues
      if (settings.name) setAssociationName(settings.name);
      if (settings.description) setAssociationDescription(settings.description);
      if (settings.contactEmail) setContactEmail(settings.contactEmail);
      if (settings.contactPhone) setContactPhone(settings.contactPhone);
      if (settings.address) setAddress(settings.address);
      if (settings.primaryColor) setPrimaryColor(settings.primaryColor);
      if (settings.secondaryColor) setSecondaryColor(settings.secondaryColor);
      
      // Set tagline on initial load only
      if (settings.tagline) {
        setTagline(settings.tagline);
      }
      
      // Convert relative logo URL to full URL for display
      if (settings.logoUrl && typeof apiConfig !== 'undefined' && apiConfig.baseUrl) {
        setLogoUrl(`${apiConfig.baseUrl}${settings.logoUrl}`);
      } else {
        setLogoUrl(null);
      }
      
      // Mark initial load as complete
      initialLoad.current = false;
    }
  }, [settings]); // Dependencies are safe with the initialLoad.current guard

  // Load activity logs when search term or filters change
  // Using a ref to track initial render for activity logs
  const isInitialActivityRender = useRef(true);
  
  useEffect(() => {
    // Skip initial execution to prevent double loading
    if (isInitialActivityRender.current) {
      isInitialActivityRender.current = false;
      return;
    }
    
    // Debounce to prevent excessive API calls
    const timeoutId = setTimeout(() => {
      // Prevent duplicate calls if already loading
      if (!logsLoading) {
        loadActivityLogs();
      }
    }, 300); // Debounce search and filter changes

    return () => clearTimeout(timeoutId);
  }, [searchTerm, currentPage, pageSize, activityType, userId, startDate, endDate, entityType, logsLoading]);


  // Activity logs loading with improved error handling and state management
  const loadActivityLogsRef = useRef(false);
  const loadActivityLogs = async () => {
    // Prevent running if we're already loading logs to avoid duplicate requests
    if (logsLoading) {
      console.log('Already loading logs, skipping duplicate request');
      return;
    }
    
    // Prevent duplicate calls within the same render cycle
    if (loadActivityLogsRef.current) {
      console.log('Debouncing multiple loadActivityLogs calls');
      return;
    }
    
    loadActivityLogsRef.current = true;
    
    try {
      setLogsLoading(true);
      
      const params = {
        page: currentPage,
        limit: pageSize,
        search: searchTerm || undefined,
        type: activityType === "all" ? undefined : activityType || undefined,
        userId: userId ? parseInt(userId) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        entityType: entityType || undefined
      };
      
      console.log('Fetching activity logs with params:', params);
      
      const logsData = await api.getActivityLogs(params);
      
      if (!logsData) {
        console.error('No logs data returned from API');
        setActivityLogs([]);
        setTotalPages(1);
        setTotalRecords(0);
        return;
      }
      
      console.log('Activity logs data received, processing...');
      
      // Map through the logs and ensure userId is properly set
      const processedLogs = (logsData?.data || []).map(log => {
        const processedLog = {...log}; // Create a copy to avoid mutating the original
        
        // If userId is missing or null, try to extract it from another field
        if (!processedLog.userId && processedLog.userFullName) {
          // Try to extract numeric part from the user name (assuming format like "admin 1")
          const numericMatch = processedLog.userFullName.match(/\d+/);
          if (numericMatch) {
            processedLog.userId = parseInt(numericMatch[0], 10);
          }
        }
        return processedLog;
      });
      
      // Use batch updates to minimize render cycles
      setActivityLogs(processedLogs);
      setTotalPages(logsData?.totalPages || 1);
      setTotalRecords(logsData?.total || 0);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
      toast.error(t('Failed to load activity logs'));
      // Set fallback values on error
      setActivityLogs([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLogsLoading(false);
      
      // Reset the ref after a short delay to allow for next calls
      setTimeout(() => {
        loadActivityLogsRef.current = false;
      }, 100);
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Validate required fields
      const validationErrors = [];
      
      if (!associationName.trim()) validationErrors.push("Association Name is required");
      if (!associationDescription.trim()) validationErrors.push("Description is required");
      if (!contactEmail.trim()) validationErrors.push("Contact Email is required");
      if (!contactEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) validationErrors.push("Contact Email must be valid");
      if (!contactPhone.trim()) validationErrors.push("Contact Phone is required");
      if (!address.trim()) validationErrors.push("Address is required");
      
      // If any validation errors, show them and don't submit
      if (validationErrors.length > 0) {
        toast.error(`Please correct the following errors: ${validationErrors.join(", ")}`);
        return;
      }
      
      setSaving(true)
      
      const settingsToUpdate = {
        name: associationName.trim(),
        description: associationDescription.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        address: address.trim(),
        primaryColor,
        secondaryColor,
        tagline
      }
      
      console.log('Saving settings:', settingsToUpdate)
      
      const updatedSettings = await api.updateSettings(settingsToUpdate)
      
      setSettings(updatedSettings)
      toast.success(t('common.success'), {
        duration: 4000,
        description: t('associationSettings.settingsSaved')
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
          try {
            // Try to parse the error message to get detailed validation errors
            const errorMatch = error.message.match(/\{.*\}/);
            if (errorMatch) {
              const errorJson = JSON.parse(errorMatch[0]);
              
              if (Array.isArray(errorJson.message)) {
                // Show first few validation errors
                const errorMessages = errorJson.message.slice(0, 3);
                toast.error(`Validation errors: ${errorMessages.join(", ")}${errorJson.message.length > 3 ? '...' : ''}`, {
                  duration: 8000
                });
              } else {
                toast.error(`Invalid data provided: ${errorJson.message || 'Please check your inputs'}`)
              }
            } else {
              toast.error('Invalid data provided. Please check your inputs.')
            }
          } catch (parseError) {
            // Fallback if we can't parse the JSON
            toast.error('Invalid data provided. Please check your inputs.')
            console.error('Failed to parse error message:', parseError)
          }
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
      // For branding updates, we need to ensure the primary settings are included to satisfy validation
      // First, get the current settings from state
      if (!settings) {
        toast.error("Unable to save branding: Settings data is missing");
        return;
      }
      
      setSaving(true)
      
      console.log('Saving branding with tagline:', tagline)
      
      // Include required fields from existing settings to satisfy API validation
      const updatedSettings = await api.updateSettings({
        // Include required fields from current settings
        name: settings.name || associationName,
        description: settings.description || associationDescription,
        contactEmail: settings.contactEmail || contactEmail,
        contactPhone: settings.contactPhone || contactPhone,
        address: settings.address || address,
        // Update the branding specific fields
        primaryColor,
        secondaryColor,
        tagline
      })
      
      console.log('Received updated settings from API:', updatedSettings)
      
      // Store current tagline to preserve user's input
      const currentTagline = tagline
      
      // Update settings but don't overwrite current form values
      setSettings({
        ...updatedSettings,
        // Keep the current tagline from the form state
        // This prevents the form from reverting to the server value
        tagline: currentTagline
      })
      console.log('Settings state updated with new values')
      
      toast.success(t('common.success'), {
        duration: 4000,
        description: t('associationSettings.settingsSaved')
      })
      
      // Dispatch custom event to notify other components of the update
      window.dispatchEvent(new CustomEvent('associationSettingsUpdated'))
    } catch (error) {
      console.error('Failed to save branding:', error)
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403')) {
          toast.error('Authentication failed. Please log in again.')
        } else if (error.message.includes('400')) {
          try {
            // Try to parse the error message to get detailed validation errors
            const errorMatch = error.message.match(/\{.*\}/);
            if (errorMatch) {
              const errorJson = JSON.parse(errorMatch[0]);
              
              if (Array.isArray(errorJson.message)) {
                // Show first few validation errors
                const errorMessages = errorJson.message.slice(0, 3);
                toast.error(`Validation errors: ${errorMessages.join(", ")}${errorJson.message.length > 3 ? '...' : ''}`, {
                  duration: 8000
                });
              } else {
                toast.error(`Invalid data provided: ${errorJson.message || 'Please check your inputs'}`)
              }
            } else {
              toast.error('Invalid data provided. Please check your inputs.')
            }
          } catch (parseError) {
            // Fallback if we can't parse the JSON
            toast.error('Invalid data provided. Please check your inputs.')
            console.error('Failed to parse error message:', parseError)
          }
        } else if (error.message.includes('404')) {
          toast.error('Settings endpoint not found. Please contact support.')
        } else if (error.message.includes('500')) {
          toast.error('Server error. Please try again later.')
        } else {
          toast.error(`Failed to save branding: ${error.message}`)
        }
      } else {
        toast.error('Failed to save branding. Please try again.')
      }
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
      setLogoUrl(updatedSettings.logoUrl ? `${apiConfig.baseUrl}${updatedSettings.logoUrl}` : null)
      toast.success(t('common.success'), {
        duration: 4000,
        description: t('associationSettings.logoUploaded')
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
      toast.success(t('common.success'), {
        duration: 4000,
        description: t('associationSettings.logoRemove')
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('associationSettings.title')}</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage association details, branding, and system logs</p>
            </div>
          </div>

          <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">{t('associationSettings.generalSettings')}</TabsTrigger>
          <TabsTrigger value="branding">{t('associationSettings.branding')}</TabsTrigger>
          <TabsTrigger value="users">{t('common.settings')}</TabsTrigger>
          <TabsTrigger value="logs">{t('associationSettings.activityLogs')}</TabsTrigger>
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
                  <Label htmlFor="associationName">{t('associationSettings.name')}</Label>
                  <Input
                    id="associationName"
                    value={associationName}
                    onChange={(e) => setAssociationName(e.target.value)}
                    placeholder={`${t('associationSettings.name')}...`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">{t('associationSettings.contactEmail')}</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder={`${t('associationSettings.contactEmail')}...`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">{t('associationSettings.contactPhone')}</Label>
                  <Input
                    id="contactPhone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder={`${t('associationSettings.contactPhone')}...`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">{t('associationSettings.address')}</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={`${t('associationSettings.address')}...`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('associationSettings.description')}</Label>
                <Textarea
                  id="description"
                  value={associationDescription}
                  onChange={(e) => setAssociationDescription(e.target.value)}
                  placeholder={`${t('associationSettings.description')}...`}
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
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t('associationSettings.saveSettings')}
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
                {t('associationSettings.branding')}
              </CardTitle>
              <CardDescription>Customize your association&apos;s visual identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>{t('associationSettings.logoUpload')}</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 relative">
                      {logoUrl ? (
                        <>
                          <img 
                            src={logoUrl} 
                            alt={t('associationSettings.logoUpload')} 
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
                    <Label htmlFor="primaryColor">{t('associationSettings.primaryColor')}</Label>
                    <div className="flex items-center gap-2">
                      <Input id="primaryColor" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-16 h-10 p-1 border rounded" />
                      <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="Hex color code" className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">{t('associationSettings.secondaryColor')}</Label>
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
                  <Label htmlFor="tagline">{t('associationSettings.tagline')}</Label>
                  <Input
                    id="tagline"
                    placeholder={`${t('associationSettings.tagline')}...`}
                    value={tagline}
                    onChange={(e) => updateTagline(e.target.value)}
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
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t('associationSettings.saveSettings')}
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
