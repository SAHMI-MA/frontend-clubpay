"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertTriangle, ArrowLeft, ArrowRight } from "lucide-react"
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

export default function GroupedSalaryPaymentPage() {
  const router = useRouter()
  const [step, setStep] = useState<"select-dept" | "select-employees" | "review">("select-dept")
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([])
  const [employees, setEmployees] = useState<SelectedEmployee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bankAccounts, setBankAccounts] = useState<Array<{ id: number; accountName?: string; bankName: string; accountNumber: string }>>([])
  
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer")
  const [bankAccountId, setBankAccountId] = useState<number>()
  const [paymentDate, setPaymentDate] = useState<Date>(new Date())

  useEffect(() => {
    // Fetch departments
    import("@/lib/api/hr-api").then(({ hrApi }) => {
      hrApi.getDepartments().then(setDepartments).catch(console.error)
    })
    
    // Fetch bank accounts
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
  }, [])

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
        router.push("/salary-payments")
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
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/salary-payments")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Paiements Groupés de Salaires</h1>
              <p className="text-muted-foreground mt-1">
                {step === "select-dept" && "Étape 1/3: Sélectionnez les départements"}
                {step === "select-employees" && "Étape 2/3: Sélectionnez et configurez les employés"}
                {step === "review" && "Étape 3/3: Vérifiez et confirmez"}
              </p>
            </div>
          </div>
        </div>
        
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === "select-dept" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
            1
          </div>
          <div className="w-16 h-1 bg-gray-200"></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === "select-employees" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
            2
          </div>
          <div className="w-16 h-1 bg-gray-200"></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === "review" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
            3
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <p className="whitespace-normal">{String(error)}</p>
        </Alert>
      )}

      {/* Step 1: Select Departments */}
      {step === "select-dept" && (
        <Card>
          <CardHeader>
            <CardTitle>Sélection des départements</CardTitle>
            <CardDescription>Choisissez les départements dont vous souhaitez traiter les paiements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Employees */}
      {step === "select-employees" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sélection des employés</CardTitle>
                <CardDescription>
                  {employees.length} employés trouvés, {selectedEmployees.length} sélectionnés
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
                      <TableCell>{emp.currentSalary.toLocaleString()} MAD</TableCell>
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
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review and Configure */}
      {step === "review" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Résumé</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-lg">
                  <span className="text-muted-foreground">Employés sélectionnés:</span>
                  <span className="font-medium">{selectedEmployees.length}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-muted-foreground">Montant total:</span>
                  <span className="font-bold text-green-600 text-xl">{totalAmount.toLocaleString()} MAD</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuration du paiement</CardTitle>
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
                            {acc.accountName || acc.bankName} - {acc.accountNumber}
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
              <CardTitle>Liste des paiements</CardTitle>
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

      {/* Navigation Footer */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div>
          {step !== "select-dept" && (
            <Button
              variant="outline"
              onClick={() => {
                if (step === "select-employees") setStep("select-dept")
                if (step === "review") setStep("select-employees")
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.push("/salary-payments")}>
            Annuler
          </Button>
          {step === "select-dept" && (
            <Button onClick={handleFetchEmployees} disabled={loading || selectedDepartments.length === 0}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Suivant
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          {step === "select-employees" && (
            <Button onClick={() => setStep("review")} disabled={selectedEmployees.length === 0}>
              Suivant ({selectedEmployees.length} sélectionné{selectedEmployees.length > 1 ? "s" : ""})
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          {step === "review" && (
            <Button onClick={handleCreatePayments} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Créer {selectedEmployees.length} paiement{selectedEmployees.length > 1 ? "s" : ""}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
