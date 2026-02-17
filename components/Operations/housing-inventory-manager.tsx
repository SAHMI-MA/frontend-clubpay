'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Package, Plus, Edit, Trash2, AlertTriangle, Loader2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import {
  housingInventoryApi,
  HousingInventoryItem,
  ItemCondition,
  CreateHousingInventoryItemDto,
} from '@/lib/api/housing-inventory-api';

interface HousingInventoryManagerProps {
  housingId: number;
  housingName: string;
}

const CONDITION_LABELS: Record<ItemCondition, string> = {
  [ItemCondition.EXCELLENT]: 'Excellent',
  [ItemCondition.GOOD]: 'Bon',
  [ItemCondition.FAIR]: 'Moyen',
  [ItemCondition.POOR]: 'Mauvais',
  [ItemCondition.DAMAGED]: 'Endommagé',
  [ItemCondition.MISSING]: 'Manquant',
};

const CONDITION_COLORS: Record<ItemCondition, string> = {
  [ItemCondition.EXCELLENT]: 'bg-green-100 text-green-800',
  [ItemCondition.GOOD]: 'bg-blue-100 text-blue-800',
  [ItemCondition.FAIR]: 'bg-yellow-100 text-yellow-800',
  [ItemCondition.POOR]: 'bg-orange-100 text-orange-800',
  [ItemCondition.DAMAGED]: 'bg-red-100 text-red-800',
  [ItemCondition.MISSING]: 'bg-gray-100 text-gray-800',
};

export function HousingInventoryManager({ housingId, housingName }: HousingInventoryManagerProps) {
  const [items, setItems] = useState<HousingInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HousingInventoryItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [totalDeductions, setTotalDeductions] = useState(0);

  const [formData, setFormData] = useState<CreateHousingInventoryItemDto>({
    housingId,
    designation: '',
    quantity: 1,
    entryCondition: ItemCondition.GOOD,
    exitCondition: undefined,
    observation: '',
    replacementCost: 0,
  });

  useEffect(() => {
    loadInventory();
    loadDeductions();
  }, [housingId]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await housingInventoryApi.getByHousing(housingId);
      setItems(data);
    } catch (error: any) {
      toast.error('Erreur lors du chargement de l\'inventaire', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDeductions = async () => {
    try {
      const result = await housingInventoryApi.getTotalDeductions(housingId);
      setTotalDeductions(result.totalDeductions);
    } catch (error: any) {
      console.error('Error loading deductions:', error);
      toast.error('Erreur lors du chargement des déductions', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.designation) {
      toast.error('Veuillez remplir la désignation');
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await housingInventoryApi.update(editingItem.id, formData);
        toast.success('Article modifié avec succès');
      } else {
        await housingInventoryApi.create(formData);
        toast.success('Article ajouté avec succès');
      }
      setDialogOpen(false);
      resetForm();
      await loadInventory();
      await loadDeductions();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;

    try {
      await housingInventoryApi.delete(id);
      toast.success('Article supprimé avec succès');
      await loadInventory();
      await loadDeductions();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const openEditDialog = (item: HousingInventoryItem) => {
    setEditingItem(item);
    setFormData({
      housingId: item.housingId,
      designation: item.designation,
      quantity: item.quantity,
      entryCondition: item.entryCondition,
      exitCondition: item.exitCondition,
      observation: item.observation || '',
      replacementCost: item.replacementCost || 0,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      housingId,
      designation: '',
      quantity: 1,
      entryCondition: ItemCondition.GOOD,
      exitCondition: undefined,
      observation: '',
      replacementCost: 0,
    });
    setEditingItem(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventaire - {housingName}
            </CardTitle>
            <CardDescription>
              Gérer les articles et leur état pour ce logement
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {totalDeductions > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div className="text-sm">
                  <span className="text-red-600 font-semibold">{totalDeductions.toFixed(2)} MAD</span>
                  <span className="text-red-500 text-xs ml-1">à déduire</span>
                </div>
              </div>
            )}
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un Article
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun article dans l'inventaire. Commencez par en ajouter un.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Désignation</TableHead>
                <TableHead className="text-center">Qté</TableHead>
                <TableHead>État Entrée</TableHead>
                <TableHead>État Sortie</TableHead>
                <TableHead>Coût Remp.</TableHead>
                <TableHead>Déduction</TableHead>
                <TableHead>Observation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className={item.isDamaged ? 'bg-red-50' : ''}>
                  <TableCell className="font-medium">{item.designation}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell>
                    <Badge className={CONDITION_COLORS[item.entryCondition]}>
                      {CONDITION_LABELS[item.entryCondition]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.exitCondition ? (
                      <Badge className={CONDITION_COLORS[item.exitCondition]}>
                        {CONDITION_LABELS[item.exitCondition]}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.replacementCost ? `${item.replacementCost} MAD` : '-'}
                  </TableCell>
                  <TableCell>
                    {item.isDamaged ? (
                      <span className="text-red-600 font-semibold flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {item.deductionAmount?.toFixed(2)} MAD
                      </span>
                    ) : (
                      <span className="text-green-600">0 MAD</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{item.observation || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Dialog for Add/Edit */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Modifier l\'Article' : 'Ajouter un Article'}
              </DialogTitle>
              <DialogDescription>
                Renseignez les informations de l'article d'inventaire
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="designation">Désignation *</Label>
                <Input
                  id="designation"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="Ex: Réfrigérateur, Table, Chaise..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantité *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entryCondition">État à l'Entrée *</Label>
                <Select
                  value={formData.entryCondition}
                  onValueChange={(value) => setFormData({ ...formData, entryCondition: value as ItemCondition })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONDITION_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exitCondition">État à la Sortie</Label>
                <Select
                  value={formData.exitCondition || ''}
                  onValueChange={(value) => setFormData({ ...formData, exitCondition: value as ItemCondition || undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Non défini" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Non défini</SelectItem>
                    {Object.entries(CONDITION_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="replacementCost">Coût de Remplacement (MAD)</Label>
                <Input
                  id="replacementCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.replacementCost}
                  onChange={(e) => setFormData({ ...formData, replacementCost: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="observation">Observation</Label>
                <Textarea
                  id="observation"
                  value={formData.observation}
                  onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                  placeholder="Notes additionnelles sur l'état de l'article..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingItem ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
