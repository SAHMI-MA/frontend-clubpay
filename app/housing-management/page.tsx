'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Home, MapPin, Plus, User, Users as UsersIcon, Calendar, Edit, Trash2, Building, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  housingApi, 
  housingAllocationApi,
  Housing,
  HousingAllocation,
  HousingStatus,
  HousingType,
  AllocationType,
  CreateHousingDto,
  CreateHousingAllocationDto,
  HousingStatistics
} from '@/lib/api/housing-api';

export default function HousingManagementPage() {
  const [activeTab, setActiveTab] = useState<'housings' | 'allocations'>('housings');
  const [housingDialogOpen, setHousingDialogOpen] = useState(false);
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [editingHousing, setEditingHousing] = useState<Housing | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [housings, setHousings] = useState<Housing[]>([]);
  const [allocations, setAllocations] = useState<HousingAllocation[]>([]);
  const [statistics, setStatistics] = useState<HousingStatistics>({
    total: 0,
    available: 0,
    occupied: 0,
    maintenance: 0,
  });

  // Form states
  const [housingForm, setHousingForm] = useState<CreateHousingDto>({
    name: '',
    address: '',
    type: 'apartment' as HousingType,
    capacity: 1,
    status: 'available' as HousingStatus,
    monthlyRent: 0,
    description: ''
  });

  const [allocationForm, setAllocationForm] = useState<CreateHousingAllocationDto>({
    housingId: 0,
    allocationType: 'employee' as AllocationType,
    allocatedTo: '',
    allocatedToId: 0,
    startDate: '',
    endDate: '',
    monthlyRent: 0,
    notes: ''
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [housingsData, allocationsData, statsData] = await Promise.all([
        housingApi.getAll(),
        housingAllocationApi.getAll(),
        housingApi.getStatistics(),
      ]);
      setHousings(housingsData);
      setAllocations(allocationsData);
      setStatistics(statsData);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHousing = async () => {
    if (!housingForm.name || !housingForm.address) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);
    try {
      await housingApi.create(housingForm);
      toast.success('Logement ajouté avec succès');
      setHousingDialogOpen(false);
      resetHousingForm();
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'ajout du logement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditHousing = async () => {
    if (!editingHousing) return;

    setSubmitting(true);
    try {
      await housingApi.update(editingHousing.id, housingForm);
      toast.success('Logement modifié avec succès');
      setHousingDialogOpen(false);
      setEditingHousing(null);
      resetHousingForm();
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la modification du logement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHousing = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce logement ?')) return;

    try {
      await housingApi.delete(id);
      toast.success('Logement supprimé avec succès');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression du logement');
    }
  };

  const handleAddAllocation = async () => {
    if (!allocationForm.housingId || !allocationForm.allocatedTo || !allocationForm.startDate) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);
    try {
      await housingAllocationApi.create(allocationForm);
      toast.success('Allocation créée avec succès');
      setAllocationDialogOpen(false);
      resetAllocationForm();
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création de l\'allocation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAllocation = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette allocation ?')) return;

    try {
      await housingAllocationApi.delete(id);
      toast.success('Allocation supprimée avec succès');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression de l\'allocation');
    }
  };

  const resetHousingForm = () => {
    setHousingForm({
      name: '',
      address: '',
      type: 'apartment',
      capacity: 1,
      status: 'available',
      monthlyRent: 0,
      description: ''
    });
  };

  const resetAllocationForm = () => {
    setAllocationForm({
      housingId: 0,
      allocationType: 'employee',
      allocatedTo: '',
      allocatedToId: 0,
      startDate: '',
      endDate: '',
      monthlyRent: 0,
      notes: ''
    });
  };

  const openEditDialog = (housing: Housing) => {
    setEditingHousing(housing);
    setHousingForm({
      name: housing.name,
      address: housing.address,
      type: housing.type,
      capacity: housing.capacity,
      status: housing.status,
      monthlyRent: housing.monthlyRent || 0,
      description: housing.description || ''
    });
    setHousingDialogOpen(true);
  };

  const getStatusBadge = (status: HousingStatus) => {
    const variants = {
      available: 'default',
      occupied: 'secondary',
      maintenance: 'destructive'
    };
    
    const labels = {
      available: 'Disponible',
      occupied: 'Occupé',
      maintenance: 'Maintenance'
    };

    return <Badge variant={variants[status] as any}>{labels[status]}</Badge>;
  };

  const getTypeLabel = (type: HousingType) => {
    const labels = {
      apartment: 'Appartement',
      villa: 'Villa',
      studio: 'Studio',
      house: 'Maison'
    };
    return labels[type];
  };

  const getAllocationTypeLabel = (type: AllocationType) => {
    const labels = {
      employee: 'Employé',
      player: 'Joueur',
      staff: 'Staff',
      team: 'Équipe'
    };
    return labels[type];
  };

  const getAllocationTypeIcon = (type: AllocationType) => {
    const icons = {
      employee: <User className="h-4 w-4" />,
      player: <User className="h-4 w-4" />,
      staff: <User className="h-4 w-4" />,
      team: <UsersIcon className="h-4 w-4" />
    };
    return icons[type];
  };

  const availableHousings = housings.filter(h => h.status === 'available');

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Allocataires</h1>
            <p className="text-muted-foreground">Gérez les logements et leurs allocations au personnel</p>
          </div>
        </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Logements</p>
                <p className="text-2xl font-bold">{statistics.total}</p>
              </div>
              <Building className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">{statistics.available}</p>
              </div>
              <Home className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Occupés</p>
                <p className="text-2xl font-bold text-orange-600">{statistics.occupied}</p>
              </div>
              <User className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Allocations Actives</p>
                <p className="text-2xl font-bold">{allocations.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestion</CardTitle>
              <CardDescription>Logements et allocations</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="housings">Logements</TabsTrigger>
              <TabsTrigger value="allocations">Allocations</TabsTrigger>
            </TabsList>

            {/* Housings Tab */}
            <TabsContent value="housings" className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={housingDialogOpen} onOpenChange={setHousingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditingHousing(null); resetHousingForm(); }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter un Logement
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingHousing ? 'Modifier le Logement' : 'Nouveau Logement'}
                      </DialogTitle>
                      <DialogDescription>
                        Renseignez les informations du logement
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nom du Logement</Label>
                          <Input
                            value={housingForm.name}
                            onChange={(e) => setHousingForm({ ...housingForm, name: e.target.value })}
                            placeholder="Ex: Appartement Centre-Ville"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select value={housingForm.type} onValueChange={(v) => setHousingForm({ ...housingForm, type: v as HousingType })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="apartment">Appartement</SelectItem>
                              <SelectItem value="villa">Villa</SelectItem>
                              <SelectItem value="studio">Studio</SelectItem>
                              <SelectItem value="house">Maison</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Adresse</Label>
                        <Input
                          value={housingForm.address}
                          onChange={(e) => setHousingForm({ ...housingForm, address: e.target.value })}
                          placeholder="Adresse complète"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Capacité</Label>
                          <Input
                            type="number"
                            min="1"
                            value={housingForm.capacity}
                            onChange={(e) => setHousingForm({ ...housingForm, capacity: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Loyer Mensuel (MAD)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={housingForm.monthlyRent}
                            onChange={(e) => setHousingForm({ ...housingForm, monthlyRent: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Statut</Label>
                          <Select value={housingForm.status} onValueChange={(v) => setHousingForm({ ...housingForm, status: v as HousingStatus })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">Disponible</SelectItem>
                              <SelectItem value="occupied">Occupé</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={housingForm.description}
                          onChange={(e) => setHousingForm({ ...housingForm, description: e.target.value })}
                          placeholder="Description du logement"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => { setHousingDialogOpen(false); setEditingHousing(null); }} disabled={submitting}>
                        Annuler
                      </Button>
                      <Button onClick={editingHousing ? handleEditHousing : handleAddHousing} disabled={submitting}>
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {editingHousing ? 'Modifier' : 'Ajouter'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Capacité</TableHead>
                    <TableHead>Loyer</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {housings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Aucun logement trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    housings.map((housing) => (
                      <TableRow key={housing.id}>
                        <TableCell className="font-medium">{housing.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{housing.address}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeLabel(housing.type)}</TableCell>
                        <TableCell>{housing.capacity} personnes</TableCell>
                        <TableCell>{housing.monthlyRent || 0} MAD/mois</TableCell>
                        <TableCell>{getStatusBadge(housing.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(housing)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteHousing(housing.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Allocations Tab */}
            <TabsContent value="allocations" className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={allocationDialogOpen} onOpenChange={setAllocationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetAllocationForm}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nouvelle Allocation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Nouvelle Allocation</DialogTitle>
                      <DialogDescription>
                        Assignez un logement à un employé, joueur, staff ou équipe
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Logement</Label>
                          <Select 
                            value={allocationForm.housingId.toString()} 
                            onValueChange={(v) => {
                              const housing = housings.find(h => h.id === parseInt(v));
                              setAllocationForm({ 
                                ...allocationForm, 
                                housingId: parseInt(v),
                                monthlyRent: housing?.monthlyRent || 0
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un logement" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableHousings.map((housing) => (
                                <SelectItem key={housing.id} value={housing.id.toString()}>
                                  {housing.name} - {housing.address}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Type d'Allocation</Label>
                          <Select value={allocationForm.allocationType} onValueChange={(v) => setAllocationForm({ ...allocationForm, allocationType: v as AllocationType })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employee">Employé</SelectItem>
                              <SelectItem value="player">Joueur</SelectItem>
                              <SelectItem value="staff">Staff</SelectItem>
                              <SelectItem value="team">Équipe</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>ID de l'Allocataire</Label>
                        <Input
                          type="number"
                          value={allocationForm.allocatedToId}
                          onChange={(e) => setAllocationForm({ ...allocationForm, allocatedToId: parseInt(e.target.value) || 0 })}
                          placeholder="ID de l'employé/joueur/staff/équipe"
                        />
                        <p className="text-xs text-muted-foreground">
                          Entrez l'ID correspondant au type sélectionné
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date de Début</Label>
                          <Input
                            type="date"
                            value={allocationForm.startDate}
                            onChange={(e) => setAllocationForm({ ...allocationForm, startDate: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Date de Fin (optionnel)</Label>
                          <Input
                            type="date"
                            value={allocationForm.endDate}
                            onChange={(e) => setAllocationForm({ ...allocationForm, endDate: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Loyer Mensuel (MAD)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={allocationForm.monthlyRent}
                          onChange={(e) => setAllocationForm({ ...allocationForm, monthlyRent: parseFloat(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Input
                          value={allocationForm.notes}
                          onChange={(e) => setAllocationForm({ ...allocationForm, notes: e.target.value })}
                          placeholder="Notes supplémentaires"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAllocationDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleAddAllocation}>
                        Ajouter
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Logement</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Allocataire</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Loyer</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allocations.map((allocation) => (
                    <TableRow key={allocation.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{allocation.housing?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getAllocationTypeIcon(allocation.allocationType)}
                          <span>{getAllocationTypeLabel(allocation.allocationType)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{allocation.allocatedTo}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>Du: {new Date(allocation.startDate).toLocaleDateString('fr-FR')}</p>
                          {allocation.endDate && (
                            <p>Au: {new Date(allocation.endDate).toLocaleDateString('fr-FR')}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{allocation.monthlyRent} MAD/mois</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAllocation(allocation.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>
    </AppLayout>
  );
}
