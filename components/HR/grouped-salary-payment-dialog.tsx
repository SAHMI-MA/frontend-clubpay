"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getEligibleEmployees, createGroupedPayments, type EligibleEmployee } from "@/lib/api/hr-grouped-salary-api"
import { type Department } from "@/lib/api/hr-api"
import { authUtils } from "@/lib/redux/auth-utils"
import { getApiUrl } from "@/lib/api-config"

interface SelectedEmployee extends EligibleEmployee {
  selected: boolean
  overtime: number
  bonuses: number
  deductions: number
  customPayPeriod?: Date
}

export function GroupedSalaryPaymentDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [step, setStep] = useState<"select-dept" | "select-employees" | "review">("select-dept")
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([])
  const [employees, setEmployees] = useState<SelectedEmployee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bankAccounts, setBankAccounts] = useState<{ id: number; bankName: string; accountNumber: string }[]>([])
  
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer")
  const [bankAccountId, setBankAccountId] = useState<number>()
  const [paymentDate, setPaymentDate] = useState<Date>(new Date())

  useEffect(() => {
    if (open) {
      // Fetch departments
      import("@/lib/api/hr-api").then(({ hrApi }) => {
        hrApi.getDepartments().then(setDepartments).catch(console.error)
      })
      
      const token = authUtils.getToken()
      fetch(getApiUrl("/bank-accounts"), {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setBankAccounts(Array.isArray(data) ? data : []))
        .catch(() => setBankAccounts([]))
    }
  }, [open])

  const handleDepartmentToggle = (deptId: number) => {
    setSelectedDepartments((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    )
  }

  const handleFetchEmployees = async () => {
    if (selectedDepartments.length === 0) {
      setError("Veuillez sélectionner au moins un département")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const eligible = await getEligibleEmployees(selectedDepartments)
      setEmployees(
        eligible.map((emp) => ({
          ...emp,
          selected: emp.isEligible,
          overtime: 0,
          bonuses: 0,
          deductions: 0,
        }))
      )
      setStep("select-employees")
    } catch (e: any) {
      setError("Erreur lors de la récupération des employés: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEmployeeToggle = (employeeId: string) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.employeeId === employeeId ? { ...emp, selected: !emp.selected } : emp
      )
    )
  }

  const handleUpdateEmployee = (
    employeeId: string,
    field: "overtime" | "bonuses" | "deductions" | "customPayPeriod",
    value: number | Date
  ) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.employeeId === employeeId ? { ...emp, [field]: value } : emp
      )
    )
  }

  const selectedEmployees = employees.filter((emp) => emp.selected)

  const totalAmount = selectedEmployees.reduce(
    (sum, emp) => sum + emp.currentSalary + emp.overtime + emp.bonuses - emp.deductions,
    0
  )

  const handleCreatePayments = async () => {
    const currentUser = authUtils.getUser()
    if (!currentUser) {
      setError("Utilisateur non connecté")
      return
    }

    if (paymentMethod === "Bank Transfer" && !bankAccountId) {
      setError("Veuillez sélectionner un compte bancaire")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await createGroupedPayments({
        payments: selectedEmployees.map((emp) => ({
          employeeId: emp.employeeId,
          payPeriod: emp.customPayPeriod
            ? emp.customPayPeriod.toISOString().split("T")[0]
            : emp.nextPayPeriod,
          baseSalary: emp.currentSalary,
          overtime: emp.overtime,
          bonuses: emp.bonuses,
          deductions: emp.deductions,
        })),
        paymentMethod,
        bankAccountId: paymentMethod === "Bank Transfer" ? bankAccountId : undefined,
        paymentDate: paymentDate.toISOString().split("T")[0],
        status: "pending",
        createdById: currentUser.id,
      })

      if (result.failed > 0) {
        setError(
          `${result.success} paiements créés avec succès. ${result.failed} ont échoué: ${result.errors.map((e) => `${e.employeeId}: ${e.error}`).join(", ")}`
        )
      }

      if (result.success > 0) {
        onSuccess()
        onOpenChange(false)
        // Reset state
        setStep("select-dept")
        setSelectedDepartments([])
        setEmployees([])
      }
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || e.message || "Erreur lors de la création des paiements"
      const displayMessage = Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage
      setError(displayMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[100vw] max-w-none max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Paiements Groupés de Salaires</DialogTitle>
          <DialogDescription>
            {step === "select-dept" && "Étape 1/3: Sélectionnez les départements"}
            {step === "select-employees" && "Étape 2/3: Sélectionnez et configurez les employés"}
            {step === "review" && "Étape 3/3: Vérifiez et confirmez"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <p className="whitespace-normal">{String(error)}</p>
          </Alert>
        )}

        {/* Step 1: Select Departments */}
        {step === "select-dept" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {departments.map((dept) => (
                <Card
                  key={dept.id}
                  className={`cursor-pointer transition-all ${
                    selectedDepartments.includes(dept.id)
                      ? "border-blue-500 bg-blue-50"
                      : "hover:border-gray-400"
                  }`}
                  onClick={() => handleDepartmentToggle(dept.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={selectedDepartments.includes(dept.id)}
                        onCheckedChange={() => handleDepartmentToggle(dept.id)}
                      />
                      <div>
                        <h3 className="font-medium">{dept.name}</h3>
                        <p className="text-xs text-muted-foreground">{dept.code}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Employees */}
        {step === "select-employees" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {employees.length} employés trouvés, {selectedEmployees.length} sélectionnés
                </p>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedEmployees.length === employees.filter((e) => e.isEligible).length}
                        onCheckedChange={(checked) => {
                          setEmployees((prev) =>
                            prev.map((emp) => ({ ...emp, selected: emp.isEligible && !!checked }))
                          )
                        }}
                      />
                    </TableHead>
                    <TableHead>Employé</TableHead>
                    <TableHead>Département</TableHead>
                    <TableHead>Salaire de Base</TableHead>
                    <TableHead>Heures Sup.</TableHead>
                    <TableHead>Primes</TableHead>
                    <TableHead>Déductions</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.employeeId} className={!emp.isEligible ? "opacity-50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={emp.selected}
                          disabled={!emp.isEligible}
                          onCheckedChange={() => handleEmployeeToggle(emp.employeeId)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{emp.employeeId}</div>
                          <div className="text-xs text-muted-foreground">{emp.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{emp.department}</TableCell>
                      <TableCell>{emp.currentSalary.toLocaleString()} DZD</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={emp.overtime}
                          disabled={!emp.selected}
                          onChange={(e) =>
                            handleUpdateEmployee(emp.employeeId, "overtime", Number(e.target.value))
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={emp.bonuses}
                          disabled={!emp.selected}
                          onChange={(e) =>
                            handleUpdateEmployee(emp.employeeId, "bonuses", Number(e.target.value))
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={emp.deductions}
                          disabled={!emp.selected}
                          onChange={(e) =>
                            handleUpdateEmployee(emp.employeeId, "deductions", Number(e.target.value))
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          disabled={!emp.selected}
                          defaultValue={emp.nextPayPeriod.split("T")[0]}
                          onChange={(e) =>
                            handleUpdateEmployee(emp.employeeId, "customPayPeriod", new Date(e.target.value))
                          }
                          className="w-36"
                        />
                      </TableCell>
                      <TableCell>
                        {emp.isEligible ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Éligible
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {emp.reason}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Step 3: Review and Configure */}
        {step === "review" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Résumé</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Employés sélectionnés:</span>
                    <span className="font-medium">{selectedEmployees.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant total:</span>
                    <span className="font-bold text-green-600">{totalAmount.toLocaleString()} DZD</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configuration du paiement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Méthode de paiement</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bank Transfer">Virement bancaire</SelectItem>
                        <SelectItem value="Cash">Espèces</SelectItem>
                        <SelectItem value="Check">Chèque</SelectItem>
                        <SelectItem value="Direct Deposit">Dépôt direct</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentMethod === "Bank Transfer" && (
                    <div>
                      <Label>Compte bancaire</Label>
                      <Select
                        value={bankAccountId?.toString()}
                        onValueChange={(val) => setBankAccountId(Number(val))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un compte" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccounts.map((acc) => (
                            <SelectItem key={acc.id} value={acc.id.toString()}>
                              {acc.accountNumber || acc.bankName} - {acc.accountNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label>Date de paiement</Label>
                    <Input
                      type="date"
                      value={paymentDate.toISOString().split("T")[0]}
                      onChange={(e) => setPaymentDate(new Date(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Liste des paiements</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employé</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead className="text-right">Salaire de Base</TableHead>
                      <TableHead className="text-right">H. Sup.</TableHead>
                      <TableHead className="text-right">Primes</TableHead>
                      <TableHead className="text-right">Déductions</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedEmployees.map((emp) => {
                      const total = emp.currentSalary + emp.overtime + emp.bonuses - emp.deductions
                      return (
                        <TableRow key={emp.employeeId}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{emp.employeeId}</div>
                              <div className="text-xs text-muted-foreground">{emp.name}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {emp.customPayPeriod
                              ? emp.customPayPeriod.toLocaleDateString("fr-FR")
                              : new Date(emp.nextPayPeriod).toLocaleDateString("fr-FR")}
                          </TableCell>
                          <TableCell className="text-right">{emp.currentSalary.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{emp.overtime.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{emp.bonuses.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{emp.deductions.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {total.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div>
            {step !== "select-dept" && (
              <Button
                variant="outline"
                onClick={() => {
                  if (step === "select-employees") setStep("select-dept")
                  if (step === "review") setStep("select-employees")
                }}
              >
                Précédent
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            {step === "select-dept" && (
              <Button onClick={handleFetchEmployees} disabled={loading || selectedDepartments.length === 0}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Suivant
              </Button>
            )}
            {step === "select-employees" && (
              <Button onClick={() => setStep("review")} disabled={selectedEmployees.length === 0}>
                Suivant ({selectedEmployees.length} sélectionné{selectedEmployees.length > 1 ? "s" : ""})
              </Button>
            )}
            {step === "review" && (
              <Button onClick={handleCreatePayments} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Créer {selectedEmployees.length} paiement{selectedEmployees.length > 1 ? "s" : ""}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
