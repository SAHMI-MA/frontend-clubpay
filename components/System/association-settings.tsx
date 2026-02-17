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
import { Building, Camera, History, Save, Search, Upload, Activity, Loader2, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Filter, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { getApiUrl, apiConfig } from "@/lib/api-config"
import { authUtils } from '@/lib/redux/auth-utils';
import { ColorThemeManager } from "./color-theme-manager";

// Types
interface AssociationSettings {
  legalIdentifiers: any
  id: number
  name: string
  nameInArabic?: string
  foundedAt: Date
  description: string
  contactEmail: string
  contactPhone: string
  address: string
  primaryColor: string
  secondaryColor: string
  tagline: string
  logoUrl?: string
  headerUrl?: string
  createdAt: string
  updatedAt: string
}

interface ActivityLog {
  id: number
  timestamp: string
  userId?: number | string | null
  userFullName: string
  action: string
  details: string
  type: string
  entityType?: string
  entityId?: number
  ipAddress?: string
  userAgent?: string
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
    formData.append('file', file)

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

    return result
  }

  async deleteLogo(): Promise<AssociationSettings> {
    const response = await fetch(getApiUrl('/associations/logo'), {
      method: 'DELETE',
      headers: this.getHeaders()
    })
    if (!response.ok) throw new Error('Failed to delete logo')
    return response.json()
  }

  async uploadHeader(file: File): Promise<AssociationSettings> {
    console.log('Uploading header file:', file.name, file.size, file.type)

    const formData = new FormData()
    formData.append('file', file)

    console.log('Uploading header to:', getApiUrl('/associations/header'))
    console.log('Auth token available:', !!this.token)

    const response = await fetch(getApiUrl('/associations/header'), {
      method: 'POST',
      headers: this.getUploadHeaders(),
      body: formData
    })

    console.log('Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Header upload failed:', response.status, errorText)
      throw new Error(`Failed to upload header: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log('Header upload successful! Response:', result)

    return result
  }

  async deleteHeader(): Promise<AssociationSettings> {
    const response = await fetch(getApiUrl('/associations/header'), {
      method: 'DELETE',
      headers: this.getHeaders()
    })
    if (!response.ok) throw new Error('Failed to delete header')
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

// --- BankAccountManagement Component ---
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface BankAccount {
  id: number;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  RIB: string;
  createdAt: string;
  updatedAt: string;
}

function BankAccountManagement() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editAccount, setEditAccount] = useState<BankAccount | null>(null);
  const [form, setForm] = useState<Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>>({
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    RIB: '',
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const getAuthHeaders = () => {
    const token = authUtils.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl('/bank-accounts'), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Erreur lors du chargement des comptes bancaires');
      const data = await res.json();
      setAccounts(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleOpenCreate = () => {
    setEditAccount(null);
    setForm({ accountHolderName: '', bankName: '', accountNumber: '', RIB: '' });
    setShowDialog(true);
  };

  const handleOpenEdit = (account: BankAccount) => {
    setEditAccount(account);
    setForm({
      accountHolderName: account.accountHolderName,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      RIB: account.RIB,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let res;
      const payload = {
        accountHolderName: form.accountHolderName,
        bankName: form.bankName,
        accountNumber: form.accountNumber,
        RIB: form.RIB,
      };
      if (editAccount) {
        res = await fetch(getApiUrl(`/bank-accounts/${editAccount.id}`), {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(getApiUrl('/bank-accounts'), {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) {
        let errorMsg = `Erreur lors de la sauvegarde du compte bancaire (status: ${res.status} ${res.statusText})`;
        let errorBody = '';
        try {
          errorBody = await res.text();
          try {
            const json = JSON.parse(errorBody);
            if (json && json.message) {
              errorMsg += `: ${Array.isArray(json.message) ? json.message.join(', ') : json.message}`;
            } else {
              errorMsg += `: ${errorBody}`;
            }
          } catch {
            errorMsg += `: ${errorBody}`;
          }
        } catch { }
        console.error('Bank account save error:', errorMsg, errorBody);
        setError(errorMsg);
        throw new Error(errorMsg);
      }
      setShowDialog(false);
      fetchAccounts();

      toast.success('Succès', {
        duration: 4000,
        description: 'Compte bancaire sauvegardé'
      })

      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(getApiUrl(`/bank-accounts/${id}`), { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Erreur lors de la suppression du compte bancaire');
      fetchAccounts();

      toast.success('Succès', {
        duration: 4000,
        description: 'Compte bancaire supprimé'
      })

      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Button className="bg-blue-800 hover:bg-blue-900 text-white" onClick={handleOpenCreate}>
          Ajouter un compte bancaire
        </Button>
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nom du titulaire</TableHead>
              <TableHead>Banque</TableHead>
              <TableHead>Numéro de compte</TableHead>
              <TableHead>RIB</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead>Mis à jour le</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8}>Chargement...</TableCell></TableRow>
            ) : accounts.length === 0 ? (
              <TableRow><TableCell colSpan={8}>Aucun compte bancaire trouvé</TableCell></TableRow>
            ) : accounts.map(account => (
              <TableRow key={account.id}>
                <TableCell>{account.id}</TableCell>
                <TableCell>{account.accountHolderName}</TableCell>
                <TableCell>{account.bankName}</TableCell>
                <TableCell>{account.accountNumber}</TableCell>
                <TableCell>{account.RIB}</TableCell>
                <TableCell>{new Date(account.createdAt).toLocaleString('fr-FR')}</TableCell>
                <TableCell>{new Date(account.updatedAt).toLocaleString('fr-FR')}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => handleOpenEdit(account)} className="mr-2">Modifier</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(account.id)} disabled={deletingId === account.id}>
                    {deletingId === account.id ? 'Suppression...' : 'Supprimer'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editAccount ? 'Modifier le compte bancaire' : 'Ajouter un compte bancaire'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom du titulaire</Label>
              <Input value={form.accountHolderName} onChange={e => setForm(f => ({ ...f, accountHolderName: e.target.value }))} />
            </div>
            <div>
              <Label>Banque</Label>
              <Input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} />
            </div>
            <div>
              <Label>Numéro de compte</Label>
              <Input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} />
            </div>
            <div>
              <Label>RIB</Label>
              <Input value={form.RIB} onChange={e => setForm(f => ({ ...f, RIB: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-800 hover:bg-blue-900 text-white">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>Annuler</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AssociationSettings() {
  const api = new AssociationAPI()
  const [, setLanguageKey] = useState(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const debouncedHandler = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('Language change detected in AssociationSettings');
        setLanguageKey(prev => prev + 1);
      }, 50);
    };

    window.addEventListener('languageChanged', debouncedHandler);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('languageChanged', debouncedHandler);
    };
  }, []);

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingHeader, setUploadingHeader] = useState(false)
  const [exportingLogs, setExportingLogs] = useState(false)
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [settings, setSettings] = useState<AssociationSettings | null>(null)
  const [associationName, setAssociationName] = useState("")
  const [associationNameInArabic, setAssociationNameInArabic] = useState<string>('نادي المدينة لكرة القدم')
  const [foundedAt, setFoundedAt] = useState<Date>(new Date('1900-01-01'))
  const [associationDescription, setAssociationDescription] = useState("")
  const [legalIdentifiers, setLegalIdentifiers] = useState<string>("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [address, setAddress] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#1E3A8A")
  const [secondaryColor, setSecondaryColor] = useState("#FFFFFF")
  const [tagline, setTagline] = useState("")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [headerUrl, setHeaderUrl] = useState<string | null>(null)

  const updateTagline = (value: string) => {
    setTagline(value)
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const headerInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        let settingsData = null;

        try {
          settingsData = await api.getSettings();
          if (settingsData && isMounted) {
            setSettings(settingsData);
          }
        } catch (error) {
          console.error('Failed to load settings:', error);
        }

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

    return () => {
      isMounted = false;
    };
  }, []);

  const initialLoad = useRef(true);

  useEffect(() => {
    if (settings && initialLoad.current) {
      console.log('Initial settings load, updating form fields:', settings);

      if (settings.name) setAssociationName(settings.name);
      if (settings.nameInArabic) setAssociationNameInArabic(settings.nameInArabic);
      if (settings.foundedAt) setFoundedAt(new Date(settings.foundedAt));
      if (settings.description) setAssociationDescription(settings.description);
      if (settings.legalIdentifiers) setLegalIdentifiers(settings.legalIdentifiers);
      if (settings.contactEmail) setContactEmail(settings.contactEmail);
      if (settings.contactPhone) setContactPhone(settings.contactPhone);
      if (settings.address) setAddress(settings.address);
      if (settings.primaryColor) setPrimaryColor(settings.primaryColor);
      if (settings.secondaryColor) setSecondaryColor(settings.secondaryColor);
      if (settings.tagline) setTagline(settings.tagline);

      if (settings.logoUrl && typeof apiConfig !== 'undefined' && apiConfig.baseUrl) {
        setLogoUrl(`${apiConfig.baseUrl}${settings.logoUrl}`);
      } else {
        setLogoUrl(null);
      }

      if (settings.headerUrl && typeof apiConfig !== 'undefined' && apiConfig.baseUrl) {
        setHeaderUrl(`${apiConfig.baseUrl}${settings.headerUrl}`);
      } else {
        setHeaderUrl(null);
      }

      initialLoad.current = false;
    }
  }, [settings]);

  const isInitialActivityRender = useRef(true);

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [sortBy, setSortBy] = useState<string>('timestamp')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [activityType, setActivityType] = useState<string>("all")
  const [userId, setUserId] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [entityType, setEntityType] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (isInitialActivityRender.current) {
      isInitialActivityRender.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      if (!logsLoading) {
        loadActivityLogs();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, currentPage, pageSize, activityType, userId, startDate, endDate, entityType]);

  const loadActivityLogsRef = useRef(false);
  const loadActivityLogs = async () => {
    if (logsLoading) {
      console.log('Already loading logs, skipping duplicate request');
      return;
    }

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

      const processedLogs = (logsData?.data || []).map(log => {
        const processedLog = { ...log };

        if (!processedLog.userId && processedLog.userFullName) {
          const numericMatch = processedLog.userFullName.match(/\d+/);
          if (numericMatch) {
            processedLog.userId = parseInt(numericMatch[0], 10);
          }
        }
        return processedLog;
      });

      setActivityLogs(processedLogs);
      setTotalPages(logsData?.totalPages || 1);
      setTotalRecords(logsData?.total || 0);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
      toast.error('Échec du chargement des journaux d\'activité');
      setActivityLogs([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLogsLoading(false);
      setTimeout(() => {
        loadActivityLogsRef.current = false;
      }, 100);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const validationErrors = [];

      if (!associationName.trim()) validationErrors.push("Nom de l'association requis");
      if (!associationNameInArabic.trim()) validationErrors.push("Nom de l'association (Arabe) requis");
      if (!foundedAt) validationErrors.push("Date de fondation requise");
      if (!associationDescription.trim()) validationErrors.push("Description requise");
      if (!contactEmail.trim()) validationErrors.push("Email de contact requis");
      if (!contactEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) validationErrors.push("Email de contact invalide");
      if (!contactPhone.trim()) validationErrors.push("Téléphone de contact requis");
      if (!address.trim()) validationErrors.push("Adresse requise");

      if (validationErrors.length > 0) {
        toast.error(`Veuillez corriger les erreurs suivantes : ${validationErrors.join(", ")}`);
        return;
      }

      setSaving(true)

      const settingsToUpdate = {
        name: associationName.trim(),
        nameInArabic: associationNameInArabic.trim(),
        foundedAt: foundedAt,
        description: associationDescription.trim(),
        legalIdentifiers: legalIdentifiers.trim(),
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
      toast.success('Succès', {
        duration: 4000,
        description: 'Paramètres de l\'association sauvegardés'
      })

      window.dispatchEvent(new CustomEvent('associationSettingsUpdated'))

      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Failed to save settings:', error)

      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403')) {
          toast.error('Échec de l\'authentification. Veuillez vous reconnecter.')
        } else if (error.message.includes('400')) {
          try {
            const errorMatch = error.message.match(/\{.*\}/);
            if (errorMatch) {
              const errorJson = JSON.parse(errorMatch[0]);

              if (Array.isArray(errorJson.message)) {
                const errorMessages = errorJson.message.slice(0, 3);
                toast.error(`Erreurs de validation : ${errorMessages.join(", ")}${errorJson.message.length > 3 ? '...' : ''}`, {
                  duration: 8000
                });
              } else {
                toast.error(`Données invalides fournies : ${errorJson.message || 'Veuillez vérifier vos entrées'}`)
              }
            } else {
              toast.error('Données invalides. Veuillez vérifier vos entrées.')
            }
          } catch (parseError) {
            toast.error('Données invalides. Veuillez vérifier vos entrées.')
            console.error('Failed to parse error message:', parseError)
          }
        } else if (error.message.includes('404')) {
          toast.error('Point de terminaison des paramètres non trouvé. Veuillez contacter le support.')
        } else if (error.message.includes('500')) {
          toast.error('Erreur de serveur. Veuillez réessayer plus tard.')
        } else {
          toast.error(`Échec de la sauvegarde des paramètres : ${error.message}`)
        }
      } else {
        toast.error('Échec de la sauvegarde des paramètres. Veuillez réessayer.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBranding = async () => {
    try {
      if (!settings) {
        toast.error("Impossible de sauvegarder l'identité visuelle : les données des paramètres sont manquantes");
        return;
      }

      setSaving(true)

      console.log('Saving branding with tagline:', tagline)

      const updatedSettings = await api.updateSettings({
        name: settings.name || associationName,
        description: settings.description || associationDescription,
        contactEmail: settings.contactEmail || contactEmail,
        contactPhone: settings.contactPhone || contactPhone,
        address: settings.address || address,
        primaryColor,
        secondaryColor,
        tagline
      })

      console.log('Received updated settings from API:', updatedSettings)

      const currentTagline = tagline

      setSettings({
        ...updatedSettings,
        tagline: currentTagline
      })
      console.log('Settings state updated with new values')

      toast.success('Succès', {
        duration: 4000,
        description: 'Paramètres de l\'association sauvegardés'
      })

      window.dispatchEvent(new CustomEvent('associationSettingsUpdated'))

      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Failed to save branding:', error)

      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403')) {
          toast.error('Échec de l\'authentification. Veuillez vous reconnecter.')
        } else if (error.message.includes('400')) {
          try {
            const errorMatch = error.message.match(/\{.*\}/);
            if (errorMatch) {
              const errorJson = JSON.parse(errorMatch[0]);

              if (Array.isArray(errorJson.message)) {
                const errorMessages = errorJson.message.slice(0, 3);
                toast.error(`Erreurs de validation : ${errorMessages.join(", ")}${errorJson.message.length > 3 ? '...' : ''}`, {
                  duration: 8000
                });
              } else {
                toast.error(`Données invalides fournies : ${errorJson.message || 'Veuillez vérifier vos entrées'}`)
              }
            } else {
              toast.error('Données invalides. Veuillez vérifier vos entrées.')
            }
          } catch (parseError) {
            toast.error('Données invalides. Veuillez vérifier vos entrées.')
            console.error('Failed to parse error message:', parseError)
          }
        } else if (error.message.includes('404')) {
          toast.error('Point de terminaison des paramètres non trouvé. Veuillez contacter le support.')
        } else if (error.message.includes('500')) {
          toast.error('Erreur de serveur. Veuillez réessayer plus tard.')
        } else {
          toast.error(`Échec de la sauvegarde de l\'identité visuelle : ${error.message}`)
        }
      } else {
        toast.error('Échec de la sauvegarde de l\'identité visuelle. Veuillez réessayer.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('La taille du fichier doit être inférieure à 10Mo')
      return
    }

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error('Veuillez télécharger un fichier d\'image valide (JPG, PNG, GIF, WebP)')
      return
    }

    try {
      setUploadingLogo(true)
      console.log('Uploading logo file:', file.name, file.size, file.type)

      const updatedSettings = await api.uploadLogo(file)
      console.log('Logo upload successful, updated settings:', updatedSettings)

      setSettings(updatedSettings)
      setLogoUrl(updatedSettings.logoUrl ? `${apiConfig.baseUrl}${updatedSettings.logoUrl}` : null)
      toast.success('Succès', {
        duration: 4000,
        description: 'Logo de l\'association téléchargé'
      })

      window.dispatchEvent(new CustomEvent('associationSettingsUpdated'))

      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Failed to upload logo:', error)

      if (error instanceof Error) {
        if (error.message.includes('413')) {
          toast.error('Fichier trop volumineux. Veuillez choisir une image plus petite.')
        } else if (error.message.includes('415')) {
          toast.error('Type de fichier non supporté. Veuillez utiliser JPG, PNG, GIF ou WebP.')
        } else if (error.message.includes('401') || error.message.includes('403')) {
          toast.error('Échec de l\'authentification. Veuillez vous reconnecter.')
        } else if (error.message.includes('500')) {
          toast.error('Erreur de serveur. Veuillez réessayer plus tard.')
        } else {
          toast.error(`Échec du téléchargement : ${error.message}`)
        }
      } else {
        toast.error('Échec du téléchargement du logo. Veuillez réessayer.')
      }
    } finally {
      setUploadingLogo(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleHeaderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(""); // Reset error state
    setSuccess(false); // Reset success state
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      setError('La taille du fichier doit être inférieure à 10Mo');
      toast.error('La taille du fichier doit être inférieure à 10Mo');
      return;
    }

    // Validate file type
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setError('Veuillez télécharger un fichier d\'image valide (PNG, JPG, JPEG)');
      toast.error('Veuillez télécharger un fichier d\'image valide (PNG, JPG, JPEG)');
      return;
    }

    // Validate image dimensions (A4 at 300 DPI: 2480x3508 pixels)
    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      if (img.width < 1211 || img.height < 289) {
        setError('L\'image doit avoir des dimensions minimales de 1211x289 pixels');
        toast.error('L\'image doit avoir des dimensions minimales de 1211x289 pixels');
        URL.revokeObjectURL(img.src);
        return;
      }
      URL.revokeObjectURL(img.src);
    } catch (error) {
      console.error('Failed to validate image dimensions:', error);
      setError('Erreur lors de la validation des dimensions de l\'image');
      toast.error('Erreur lors de la validation des dimensions de l\'image');
      return;
    }

    try {
      setUploadingHeader(true);
      console.log('Uploading header file:', { name: file.name, size: file.size, type: file.type });

      const updatedSettings = await api.uploadHeader(file);
      console.log('Header upload successful, updated settings:', updatedSettings);

      setSettings(updatedSettings);
      setHeaderUrl(updatedSettings.headerUrl ? `${apiConfig.baseUrl}${updatedSettings.headerUrl}` : null);
      setSuccess(true);
      toast.success('En-tête de l\'association téléchargé', { duration: 4000 });

      window.dispatchEvent(new CustomEvent('associationSettingsUpdated'));
    } catch (error) {
      console.error('Failed to upload header:', error);
      let errorMessage = 'Échec du téléchargement de l\'en-tête. Veuillez réessayer.';
      if (error instanceof Error) {
        if (error.message.includes('413')) {
          errorMessage = 'Fichier trop volumineux. Veuillez choisir une image plus petite.';
        } else if (error.message.includes('415')) {
          errorMessage = 'Type de fichier non supporté. Veuillez utiliser PNG, JPG ou JPEG.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'Échec de l\'authentification. Veuillez vous reconnecter.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Erreur de serveur. Veuillez réessayer plus tard.';
        } else {
          errorMessage = `Échec du téléchargement : ${error.message}`;
        }
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setUploadingHeader(false);
      if (headerInputRef.current) {
        headerInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    try {
      setUploadingLogo(true)
      const updatedSettings = await api.deleteLogo()
      setSettings(updatedSettings)
      setLogoUrl(null)
      toast.success('Succès', {
        duration: 4000,
        description: 'Logo de l\'association supprimé'
      })

      window.dispatchEvent(new CustomEvent('associationSettingsUpdated'))

      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Failed to remove header:', error)
      toast.error('Échec de la suppression de l\'en-tête')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleRemoveHeader = async () => {
    try {
      setUploadingHeader(true);
      const updatedSettings = await api.deleteHeader();
      setSettings(updatedSettings);
      setHeaderUrl(null);
      toast.success('Succès', {
        duration: 4000,
        description: "En-tête de l'association supprimé"
      });

      window.dispatchEvent(new CustomEvent('associationSettingsUpdated'));

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Failed to remove header:', error);
      toast.error("Échec de la suppression de l'en-tête");
    } finally {
      setUploadingHeader(false);
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

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `journaux-activite-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Journaux d\'activité exportés avec succès !')
    } catch (error) {
      console.error('Failed to export logs:', error)
      toast.error('Échec de l\'exportation des journaux')
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

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }

    if (activityLogs.length > 0) {
      const sortedLogs = [...activityLogs].sort((a: any, b: any) => {
        const valueA = a[column] || '';
        const valueB = b[column] || '';

        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return sortOrder === 'asc'
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        } else {
          return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
        }
      });

      setActivityLogs(sortedLogs);
    }
  }

  const getPageNumbers = () => {
    const delta = 2
    const pages: (number | string)[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
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
            <p className="mt-2 text-gray-600 dark:text-gray-400">Chargement des paramètres de l'association...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paramètres de l'association</h1>
              <p className="text-gray-600 dark:text-gray-400">Gérez les informations, l'identité visuelle et les journaux système de l'association</p>
            </div>
          </div>

          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="branding">Identité visuelle</TabsTrigger>
              <TabsTrigger value="theme">Thème</TabsTrigger>
              <TabsTrigger value="bankAccounts">Comptes bancaires du club</TabsTrigger>
              <TabsTrigger value="logs">Journaux d'activité</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Informations de l'association
                  </CardTitle>
                  <CardDescription>Mettez à jour les informations de base et les coordonnées de votre association</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="associationName">Nom de l'association</Label>
                      <Input
                        id="associationName"
                        value={associationName}
                        onChange={(e) => setAssociationName(e.target.value)}
                        placeholder="Nom de l'association..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="associationNameInArabic">Nom de l'association (Arabe)</Label>
                      <Input
                        id="associationNameInArabic"
                        value={associationNameInArabic}
                        onChange={(e) => setAssociationNameInArabic(e.target.value)}
                        placeholder="Nom de l'association (Arabe)..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="foundedAt">Date de fondation</Label>
                      <Input
                        id="foundedAt"
                        type="date"
                        value={foundedAt.toISOString().split('T')[0]}
                        onChange={(e) => setFoundedAt(new Date(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Email de contact</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="Email de contact..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Téléphone</Label>
                      <Input
                        id="contactPhone"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="Téléphone..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Adresse</Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Adresse..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={associationDescription}
                      onChange={(e) => setAssociationDescription(e.target.value)}
                      placeholder="Description..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legalIdentifiers">Références légales</Label>
                    <Textarea
                      id="legalIdentifiers"
                      value={legalIdentifiers}
                      onChange={(e) => setLegalIdentifiers(e.target.value)}
                      placeholder="Références légales sous format (RC + CNSS + IF)"
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
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Enregistrer
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
                    Identité visuelle
                  </CardTitle>
                  <CardDescription>Personnalisez l'identité visuelle de votre association</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Logo de l'association</Label>
                      <div className="mt-2 flex items-center gap-4">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 relative">
                          {logoUrl ? (
                            <>
                              <img
                                src={logoUrl}
                                alt="Logo de l'association"
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
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
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
                                Télécharger le logo
                              </>
                            )}
                          </Button>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Recommandé : 200x200px, JPG, PNG, GIF ou WebP (Max 10Mo)</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="primaryColor">Couleur principale</Label>
                        <div className="flex items-center gap-2">
                          <Input id="primaryColor" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-16 h-10 p-1 border rounded" />
                          <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="Code hexadécimal" className="flex-1" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondaryColor">Couleur de la police</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="secondaryColor"
                            type="color"
                            value={secondaryColor}
                            onChange={(e) => setSecondaryColor(e.target.value)}
                            className="w-16 h-10 p-1 border rounded"
                          />
                          <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} placeholder="Code hexadécimal" className="flex-1" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tagline">Slogan</Label>
                      <Input
                        id="tagline"
                        placeholder="Slogan..."
                        value={tagline}
                        onChange={(e) => updateTagline(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>En-tête pour documents PDF</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Téléchargez une image d'en-tête qui sera utilisée dans les documents PDF générés par le système.
                        L'en-tête apparaîtra en haut de chaque page des documents officiels.
                      </p>
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-48 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed ${error ? 'border-red-500' : success ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'
                            } relative`}
                        >
                          {headerUrl ? (
                            <>
                              <img
                                src={headerUrl}
                                alt="En-tête de l'association"
                                className="w-full h-full object-contain rounded-lg"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600"
                                onClick={handleRemoveHeader}
                                disabled={uploadingHeader}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                              {success && (
                                <CheckCircle className="absolute -bottom-2 -right-2 h-6 w-6 text-green-500" />
                              )}
                            </>
                          ) : (
                            <Camera className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div className="space-y-2">
                          <input
                            ref={headerInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={handleHeaderUpload}
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            className="bg-white dark:bg-gray-800"
                            onClick={() => headerInputRef.current?.click()}
                            disabled={uploadingHeader}
                          >
                            {uploadingHeader ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Télécharger l'en-tête
                              </>
                            )}
                          </Button>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Obligatoire : 1211x289px (A4 à 300 DPI), PNG, JPG ou JPEG (Max 10Mo)
                          </p>
                          {error && (
                            <p className="text-sm text-red-500">
                              {error}
                            </p>
                          )}
                          {success && !error && (
                            <p className="text-sm text-green-500">
                              En-tête téléchargé avec succès
                            </p>
                          )}
                        </div>
                      </div>
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
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Enregistrer
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="theme" className="space-y-4">
              <ColorThemeManager />
            </TabsContent>

            <TabsContent value="bankAccounts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Comptes bancaires du club
                  </CardTitle>
                  <CardDescription>Gérez les comptes bancaires de l'association</CardDescription>
                </CardHeader>
                <CardContent>
                  <BankAccountManagement />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Journaux d'activité
                  </CardTitle>
                  <CardDescription>Surveillez les activités du système et les actions des utilisateurs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Rechercher dans les journaux..."
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
                        {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
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
                            Exporter les journaux
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {showFilters && (
                    <div className="mb-6 p-4 border rounded-md bg-gray-50 dark:bg-gray-800/50 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="activityType">Type d'activité</Label>
                          <Select value={activityType} onValueChange={setActivityType}>
                            <SelectTrigger>
                              <SelectValue placeholder="Tous les types" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tous les types</SelectItem>
                              <SelectItem value="Create">Création</SelectItem>
                              <SelectItem value="Update">Mise à jour</SelectItem>
                              <SelectItem value="Delete">Suppression</SelectItem>
                              <SelectItem value="Payment">Paiement</SelectItem>
                              <SelectItem value="Schedule">Planification</SelectItem>
                              <SelectItem value="System">Système</SelectItem>
                              <SelectItem value="Login">Connexion</SelectItem>
                              <SelectItem value="Logout">Déconnexion</SelectItem>
                              <SelectItem value="Approve">Approbation</SelectItem>
                              <SelectItem value="Reject">Rejet</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="userId">ID utilisateur</Label>
                          <Input
                            id="userId"
                            type="number"
                            placeholder="Filtrer par ID utilisateur"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="entityType">Type d'entité</Label>
                          <Input
                            id="entityType"
                            placeholder="ex : joueur, équipe, contrat"
                            value={entityType}
                            onChange={(e) => setEntityType(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="startDate">Date de début</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="endDate">Date de fin</Label>
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
                          Appliquer les filtres
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
                              <p className="mt-2 text-gray-500">Chargement des journaux d'activité...</p>
                            </TableCell>
                          </TableRow>
                        ) : activityLogs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              <p className="text-gray-500">Aucun journal d'activité trouvé</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          activityLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="font-mono text-sm">
                                {new Date(log.timestamp).toLocaleString('fr-FR')}
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

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <span>Afficher</span>
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
                        <span>entrées</span>
                      </div>
                      {totalRecords > 0 && (
                        <div className="hidden sm:block">
                          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} entries
                        </div>
                      )}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1 || logsLoading}
                          className="hidden sm:flex"
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1 || logsLoading}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Précédent</span>
                        </Button>

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

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages || logsLoading}
                        >
                          <span className="hidden sm:inline mr-1">Suivant</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>

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