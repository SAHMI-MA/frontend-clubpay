"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, Check, Users, DollarSign, Loader2, Building2 } from "lucide-react"
import { ToastNotification, useToast } from "@/components/ui/toast-notification"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import type { RootState } from "@/lib/redux/store"
import { fetchAllPlayers } from "@/lib/redux/playerSlice"
import { fetchAllStaff } from "@/lib/redux/staffSlice"
import { formatCurrency } from "@/lib/pdf-utils"
import { authUtils } from "@/lib/redux/auth-utils"

interface GroupedPaymentItem {
  type: 'player' | 'staff'
  id: number
  name: string
  position?: string
  role?: string
  baseSalary: number
  contractSalary: number
  bonus: number
  amount: number
  payPeriod: string
  teamName?: string
  teamId?: number
}

export default function GroupedClubSalaryPaymentsPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { toastState, showToast, hideToast } = useToast()

  // Redux state
  const players = useAppSelector((state) => state.players?.players || [])
  const staff = useAppSelector((state) => state.staff?.staff || [])
  const playersLoading = useAppSelector((state) => state.players?.loading || false)
  const staffLoading = useAppSelector((state) => state.staff?.loading || false)
  const authUser = useAppSelector((state: RootState) => state.auth.user)

  // Workflow state
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1: Select teams and recipient types
  const [selectedTeams, setSelectedTeams] = useState<number[]>([])
  const [includePlayersProp, setIncludePlayersProp] = useState(true)
  const [includeStaffProp, setIncludeStaffProp] = useState(true)

  // Step 2: Individual payment adjustments
  const [paymentItems, setPaymentItems] = useState<GroupedPaymentItem[]>([])

  // Step 3: Payment configuration
  const [paymentDate, setPaymentDate] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Bank Transfer" | "Check">("Bank Transfer")
  const [bankAccountId, setBankAccountId] = useState<number | null>(null)
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(false)

  // Fetch initial data
  useEffect(() => {
  console.log('=== Fetching Players and Staff ===');
  
  const fetchPlayers = async () => {
    try {
      console.log('Dispatching fetchAllPlayers...');
      const playersData = await dispatch(fetchAllPlayers()).unwrap();
      console.log('✅ Players fetched successfully:', {
        count: playersData.length,
        samplePlayer: playersData[0],
        playersWithTeam: playersData.filter((p) => p.team).length,
        playersWithContract: playersData.filter((p) => p.contract).length,
        playersWithBothTeamAndContract: playersData.filter((p) => p.team && p.contract).length,
        playersWithTeamContractAndSalary: playersData.filter((p) => p.team && p.contract && p.contract.salary).length,
      });
      
      if (playersData.length > 0) {
        console.log('First player full details:', JSON.stringify(playersData[0], null, 2));
      }
    } catch (error) {
      console.error('❌ Failed to fetch players:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      console.log('Dispatching fetchAllStaff...');
      const staffData: any = await dispatch(fetchAllStaff()).unwrap();
      console.log('✅ Staff fetched successfully:', {
        count: staffData.length,
        sampleStaff: staffData[0],
        staffWithTeam: staffData.filter((s: any) => s.team).length,
        staffWithContract: staffData.filter((s: any) => s.contract).length,
        staffWithBothTeamAndContract: staffData.filter((s: any) => s.team && s.contract).length,
        staffWithTeamContractAndSalary: staffData.filter((s: any) => s.team && s.contract && s.contract.salary).length,
      });
      
      if (staffData.length > 0) {
        console.log('First staff full details:', JSON.stringify(staffData[0], null, 2));
      }
    } catch (error) {
      console.error('❌ Failed to fetch staff:', error);
    }
  };

  fetchPlayers();
  fetchStaff();
}, [dispatch]);


  // Fetch bank accounts when needed
  useEffect(() => {
    if (paymentMethod === "Bank Transfer" && currentStep === 3) {
      setLoadingBankAccounts(true)
      const token = authUtils.getToken()
      
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/club/bank-accounts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setBankAccounts(data)
          if (data.length > 0 && !bankAccountId) {
            setBankAccountId(data[0].id)
          }
        })
        .catch((error) => {
          console.error("Failed to fetch bank accounts:", error)
          showToast("Failed to load bank accounts", "error", "Error")
        })
        .finally(() => {
          setLoadingBankAccounts(false)
        })
    }
  }, [paymentMethod, currentStep])

  // Get unique teams from players and staff
  const availableTeams = useMemo(() => {
    console.log('\n=== Calculating Available Teams ===')
    const teamMap = new Map<number, { id: number; name: string }>()
    
    console.log('Current state:', {
      playersCount: players.length,
      staffCount: staff.length,
      playersLoading,
      staffLoading,
    })
    
    // Detailed player analysis
    console.log('Player Analysis:')
    players.forEach((player, index) => {
      const hasTeam = !!player.team
      const hasContract = !!player.contract
      const hasSalary = !!player.contract?.salary
      
      if (index < 3) { // Log first 3 players
        console.log(`  Player ${index + 1}:`, {
          name: `${player.firstName} ${player.lastName}`,
          hasTeam,
          teamId: player.team?.id,
          teamName: player.team?.name,
          hasContract,
          contractId: player.contract?.id,
          hasSalary,
          salary: player.contract?.salary,
        })
      }
      
      if (hasTeam && hasContract && hasSalary) {
        teamMap.set(player.team!.id, { id: player.team!.id, name: player.team!.name })
      }
    })
    
    // Detailed staff analysis
    console.log('Staff Analysis:')
    staff.forEach((s, index) => {
      const hasTeam = !!s.team
      const hasContract = !!s.contract
      const hasSalary = !!s.contract?.salary
      
      if (index < 3) { // Log first 3 staff
        console.log(`  Staff ${index + 1}:`, {
          name: `${s.firstName} ${s.lastName}`,
          hasTeam,
          teamId: s.team?.id,
          teamName: s.team?.name,
          hasContract,
          contractId: s.contract?.id,
          hasSalary,
          salary: s.contract?.salary,
        })
      }
      
      if (hasTeam && hasContract && hasSalary) {
        teamMap.set(s.team!.id, { id: s.team!.id, name: s.team!.name })
      }
    })
    
    const teamsArray = Array.from(teamMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    
    console.log('Summary:', {
      playersWithTeam: players.filter(p => p.team).length,
      playersWithContract: players.filter(p => p.contract).length,
      playersWithSalary: players.filter(p => p.contract?.salary).length,
      playersEligible: players.filter(p => p.team && p.contract && p.contract.salary).length,
      staffWithTeam: staff.filter(s => s.team).length,
      staffWithContract: staff.filter(s => s.contract).length,
      staffWithSalary: staff.filter(s => s.contract?.salary).length,
      staffEligible: staff.filter(s => s.team && s.contract && s.contract.salary).length,
      totalEligible: players.filter(p => p.team && p.contract && p.contract.salary).length + 
                     staff.filter(s => s.team && s.contract && s.contract.salary).length,
      teamsFound: teamsArray.length,
      teams: teamsArray,
    })
    
    console.log('=== End Available Teams Calculation ===\n')
    
    return teamsArray
  }, [players, staff, playersLoading, staffLoading])

  // Get eligible recipients based on selected teams
  const eligibleRecipients = useMemo(() => {
    const items: GroupedPaymentItem[] = []

    if (includePlayersProp && selectedTeams.length > 0) {
      players.forEach((player) => {
        if (
          player.team &&
          selectedTeams.includes(player.team.id) &&
          player.contract &&
          player.contract.salary
        ) {
          items.push({
            type: 'player',
            id: player.id,
            name: `${player.firstName} ${player.lastName}`,
            position: player.position,
            baseSalary: player.contract.salary,
            contractSalary: player.contract.salary,
            bonus: 0,
            amount: player.contract.salary,
            payPeriod: new Date().toISOString().slice(0, 7) + '-01',
            teamName: player.team.name,
            teamId: player.team.id,
          })
        }
      })
    }

    if (includeStaffProp && selectedTeams.length > 0) {
      staff.forEach((s) => {
        if (
          s.team &&
          selectedTeams.includes(s.team.id) &&
          s.contract &&
          s.contract.salary
        ) {
          items.push({
            type: 'staff',
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
            role: s.role,
            baseSalary: s.contract.salary,
            contractSalary: s.contract.salary,
            bonus: 0,
            amount: s.contract.salary,
            payPeriod: new Date().toISOString().slice(0, 7) + '-01',
            teamName: s.team.name,
            teamId: s.team.id,
          })
        }
      })
    }

    return items
  }, [players, staff, selectedTeams, includePlayersProp, includeStaffProp])

  // Calculate totals
  const totalAmount = useMemo(() => {
    return paymentItems.reduce((sum, item) => sum + item.amount, 0)
  }, [paymentItems])

  const totalBonus = useMemo(() => {
    return paymentItems.reduce((sum, item) => sum + item.bonus, 0)
  }, [paymentItems])

  // Step 1: Load eligible recipients
  const handleLoadRecipients = () => {
    if (selectedTeams.length === 0) {
      showToast("Veuillez sélectionner au moins une équipe", "error", "Erreur de validation")
      return
    }

    if (!includePlayersProp && !includeStaffProp) {
      showToast("Veuillez sélectionner au moins un type de bénéficiaire", "error", "Erreur de validation")
      return
    }

    setPaymentItems(eligibleRecipients)
    setCurrentStep(2)
  }

  // Step 2: Update individual payment
  const updatePaymentItem = (index: number, field: keyof GroupedPaymentItem, value: any) => {
    setPaymentItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const updated = { ...item, [field]: value }
          
          // Recalculate amount when bonus changes
          if (field === 'bonus') {
            updated.amount = updated.baseSalary + Number(value)
          }
          
          return updated
        }
        return item
      })
    )
  }

  // Step 2: Go to review
  const handleGoToReview = () => {
    if (paymentItems.length === 0) {
      showToast("Aucun paiement à traiter", "error", "Erreur")
      return
    }

    setCurrentStep(3)
  }

  // Step 3: Submit grouped payments
  const handleSubmitGroupedPayments = async () => {
    if (!paymentDate) {
      showToast("Veuillez sélectionner une date de paiement", "error", "Erreur de validation")
      return
    }

    if (paymentMethod === "Bank Transfer" && !bankAccountId) {
      showToast("Veuillez sélectionner un compte bancaire", "error", "Erreur de validation")
      return
    }

    if (!authUser || !authUser.id) {
      showToast("Utilisateur non authentifié", "error", "Erreur")
      return
    }

    setIsSubmitting(true)

    try {
      const token = authUtils.getToken()
      
      // Create payments one by one
      const results = await Promise.allSettled(
        paymentItems.map(async (item) => {
          const payload = {
            amount: item.baseSalary,
            bonus: item.bonus,
            paymentDate,
            payPeriod: item.payPeriod,
            periodStart: null,
            periodEnd: null,
            status: "PENDING",
            ...(item.type === 'player' ? { playerId: item.id } : { staffId: item.id }),
            bankAccountId: paymentMethod === "Bank Transfer" ? bankAccountId : undefined,
            notes: `Paiement groupé - ${item.teamName}`,
            createdBy: authUser.id,
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounting/salary-payments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || `Failed to create payment for ${item.name}`)
          }

          return response.json()
        })
      )

      const successCount = results.filter((r) => r.status === "fulfilled").length
      const failureCount = results.filter((r) => r.status === "rejected").length

      if (successCount > 0) {
        showToast(
          `${successCount} paiement(s) créé(s) avec succès${failureCount > 0 ? `, ${failureCount} échec(s)` : ""}`,
          failureCount > 0 ? "warning" : "success",
          "Paiements groupés"
        )

        if (failureCount === 0) {
          setTimeout(() => {
            router.push("/club-salary-payments")
          }, 1500)
        }
      } else {
        showToast("Échec de la création des paiements", "error", "Erreur")
      }
    } catch (error: any) {
      console.error("Failed to create grouped payments:", error)
      showToast(error.message || "Échec de la création des paiements", "error", "Erreur")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <ToastNotification
        toast={toastState}
        onClose={hideToast}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/club-salary-payments")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Paiements Groupés Club</h1>
            <p className="text-gray-500 mt-1">Créer des paiements pour plusieurs joueurs/staff</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between max-w-3xl mx-auto mt-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {currentStep > step ? <Check className="h-5 w-5" /> : step}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${currentStep >= step ? "text-blue-600" : "text-gray-500"}`}>
                  {step === 1 && "Sélection"}
                  {step === 2 && "Ajustements"}
                  {step === 3 && "Révision"}
                </p>
              </div>
              {step < 3 && (
                <div className={`flex-1 h-1 mx-4 ${currentStep > step ? "bg-blue-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Team & Type Selection */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Étape 1: Sélectionner les équipes et types
            </CardTitle>
            <CardDescription>Choisissez les équipes et types de bénéficiaires</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Team Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Équipes</Label>
              {availableTeams.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 font-medium mb-2">
                    Aucune équipe disponible avec des contrats actifs
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Pour utiliser les paiements groupés, vous devez d'abord créer des contrats pour vos joueurs/staff.
                  </p>
                  
                  {players.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left max-w-md mx-auto">
                      <p className="text-sm font-medium text-blue-900 mb-2">📊 État actuel:</p>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• {players.length} joueur(s) trouvé(s)</li>
                        <li>• {staff.length} staff trouvé(s)</li>
                        <li>• {players.filter(p => p.contract).length} joueur(s) avec contrat</li>
                        <li>• {staff.filter(s => s.contract).length} staff avec contrat</li>
                      </ul>
                    </div>
                  )}
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left max-w-md mx-auto">
                    <p className="text-sm font-medium text-yellow-900 mb-2">⚠️ Action requise:</p>
                    <ul className="text-xs text-yellow-800 space-y-1">
                      <li>1. Allez dans la section "Joueurs" ou "Staff"</li>
                      <li>2. Créez des contrats pour vos joueurs/staff</li>
                      <li>3. Assurez-vous que les contrats incluent un montant de salaire</li>
                      <li>4. Revenez ici pour créer des paiements groupés</li>
                    </ul>
                  </div>
                  
                  {(playersLoading || staffLoading) && (
                    <div className="flex items-center justify-center gap-2 mt-4 text-sm text-blue-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement des données...
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableTeams.map((team) => {
                    const playersCount = players.filter(
                      (p) => p.team?.id === team.id && p.contract && p.contract.salary
                    ).length
                    const staffCount = staff.filter(
                      (s) => s.team?.id === team.id && s.contract && s.contract.salary
                    ).length

                    return (
                      <Card
                        key={team.id}
                        className={`cursor-pointer transition-all ${
                          selectedTeams.includes(team.id)
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => {
                          setSelectedTeams((prev) =>
                            prev.includes(team.id) ? prev.filter((id) => id !== team.id) : [...prev, team.id]
                          )
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{team.name}</h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {playersCount} joueur(s), {staffCount} staff
                              </p>
                            </div>
                            <Checkbox checked={selectedTeams.includes(team.id)} />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Recipient Type Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Types de bénéficiaires</Label>
              <div className="flex flex-wrap gap-3">
                <Card
                  className={`cursor-pointer transition-all flex-1 min-w-[200px] ${
                    includePlayersProp ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setIncludePlayersProp(!includePlayersProp)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Joueurs</h3>
                        <p className="text-xs text-gray-500 mt-1">Inclure les joueurs</p>
                      </div>
                      <Checkbox checked={includePlayersProp} />
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all flex-1 min-w-[200px] ${
                    includeStaffProp ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setIncludeStaffProp(!includeStaffProp)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Staff</h3>
                        <p className="text-xs text-gray-500 mt-1">Inclure le personnel</p>
                      </div>
                      <Checkbox checked={includeStaffProp} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Summary */}
            {selectedTeams.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Résumé de la sélection:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• {selectedTeams.length} équipe(s) sélectionnée(s)</li>
                  <li>• {eligibleRecipients.length} bénéficiaire(s) éligible(s)</li>
                  {includePlayersProp && (
                    <li>• {eligibleRecipients.filter((r) => r.type === "player").length} joueur(s)</li>
                  )}
                  {includeStaffProp && (
                    <li>• {eligibleRecipients.filter((r) => r.type === "staff").length} staff(s)</li>
                  )}
                </ul>
              </div>
            )}

            {/* Next Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleLoadRecipients}
                disabled={selectedTeams.length === 0 || eligibleRecipients.length === 0}
                size="lg"
              >
                Continuer
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Adjust Individual Payments */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Étape 2: Ajuster les paiements individuels
            </CardTitle>
            <CardDescription>
              Modifiez les montants, bonus et périodes si nécessaire ({paymentItems.length} bénéficiaires)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Équipe</TableHead>
                    <TableHead>Salaire de base</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentItems.map((item, index) => (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell className="font-medium">
                        {item.name}
                        <br />
                        <span className="text-xs text-gray-500">
                          {item.type === 'player' ? item.position : item.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.type === 'player' ? 'default' : 'secondary'}>
                          {item.type === 'player' ? 'Joueur' : 'Staff'}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.teamName}</TableCell>
                      <TableCell>{formatCurrency(item.baseSalary)}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.bonus}
                          onChange={(e) => updatePaymentItem(index, "bonus", Number(e.target.value))}
                          className="w-28"
                          min="0"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="month"
                          value={item.payPeriod.slice(0, 7)}
                          onChange={(e) => updatePaymentItem(index, "payPeriod", e.target.value + '-01')}
                          className="w-40"
                        />
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-6">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Button onClick={handleGoToReview} size="lg">
                Révision
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review and Submit */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Étape 3: Révision et confirmation
            </CardTitle>
            <CardDescription>Vérifiez les détails et configurez le paiement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500">Nombre de paiements</div>
                  <div className="text-2xl font-bold">{paymentItems.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500">Total bonus</div>
                  <div className="text-2xl font-bold">{formatCurrency(totalBonus)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500">Montant total</div>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Configuration */}
            <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-4">Configuration du paiement</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payment Date */}
                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Date de paiement*</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Méthode de paiement*</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Espèces</SelectItem>
                      <SelectItem value="Bank Transfer">Virement bancaire</SelectItem>
                      <SelectItem value="Check">Chèque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bank Account (if Bank Transfer) */}
                {paymentMethod === "Bank Transfer" && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bankAccount">Compte bancaire*</Label>
                    {loadingBankAccounts ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Chargement des comptes...
                      </div>
                    ) : (
                      <Select
                        value={bankAccountId?.toString() || ""}
                        onValueChange={(value) => setBankAccountId(Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un compte" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                              {account.accountName} - {account.accountNumber} ({formatCurrency(account.balance)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Payment List Summary */}
            <div className="space-y-2">
              <h3 className="font-semibold">Liste des paiements:</h3>
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentItems.map((item) => (
                      <TableRow key={`${item.type}-${item.id}`}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>
                          <Badge variant={item.type === 'player' ? 'default' : 'secondary'}>
                            {item.type === 'player' ? 'Joueur' : 'Staff'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-6">
              <Button variant="outline" onClick={() => setCurrentStep(2)} disabled={isSubmitting}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Button onClick={handleSubmitGroupedPayments} disabled={isSubmitting} size="lg">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Créer {paymentItems.length} paiement(s)
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
