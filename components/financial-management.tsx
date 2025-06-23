"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { CreditCard, DollarSign, Download, Plus, Search, TrendingDown, TrendingUp } from "lucide-react"

const transactions = [
  {
    id: 1,
    date: "2024-01-10",
    description: "Player Registration Fees",
    category: "Income",
    amount: 2500,
    type: "Credit",
    status: "Completed",
  },
  {
    id: 2,
    date: "2024-01-09",
    description: "Equipment Purchase",
    category: "Equipment",
    amount: -850,
    type: "Debit",
    status: "Completed",
  },
  {
    id: 3,
    date: "2024-01-08",
    description: "Coach Salary - January",
    category: "Salaries",
    amount: -3200,
    type: "Debit",
    status: "Completed",
  },
  {
    id: 4,
    date: "2024-01-07",
    description: "Sponsorship Payment",
    category: "Sponsorship",
    amount: 5000,
    type: "Credit",
    status: "Pending",
  },
]

const monthlyData = [
  { month: "Jul", income: 15000, expenses: 12000 },
  { month: "Aug", income: 18000, expenses: 14000 },
  { month: "Sep", income: 22000, expenses: 16000 },
  { month: "Oct", income: 19000, expenses: 15000 },
  { month: "Nov", income: 25000, expenses: 18000 },
  { month: "Dec", income: 28000, expenses: 20000 },
]

export function FinancialManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategory === "all" || transaction.category.toLowerCase() === selectedCategory.toLowerCase()
    const matchesType = selectedType === "all" || transaction.type.toLowerCase() === selectedType.toLowerCase()
    return matchesSearch && matchesCategory && matchesType
  })

  const getTypeColor = (type: string) => {
    return type === "Credit"
      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
  }

  const getStatusColor = (status: string) => {
    return status === "Completed"
      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
  }

  const totalIncome = transactions.filter((t) => t.type === "Credit").reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = Math.abs(transactions.filter((t) => t.type === "Debit").reduce((sum, t) => sum + t.amount, 0))
  const netProfit = totalIncome - totalExpenses

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Track income, expenses, and financial reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white dark:bg-gray-800">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button className="bg-blue-800 hover:bg-blue-900 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">${totalIncome.toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1">+12.5% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">${totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-red-600 mt-1">+5.2% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-800" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">${netProfit.toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1">+18.2% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">$5,000</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">1 pending transaction</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Recent Transactions</CardTitle>
              <CardDescription>View and manage all financial transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="salaries">Salaries</SelectItem>
                    <SelectItem value="sponsorship">Sponsorship</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Transactions Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell className="font-medium">{transaction.description}</TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(transaction.type)}>{transaction.type}</Badge>
                        </TableCell>
                        <TableCell className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                          ${Math.abs(transaction.amount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Monthly Income vs Expenses</CardTitle>
                <CardDescription>Financial performance over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="income" fill="#10B981" name="Income" />
                    <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Profit Trend</CardTitle>
                <CardDescription>Net profit trend over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="income" stroke="#1E3A8A" strokeWidth={2} name="Profit" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Budget Planning</CardTitle>
              <CardDescription>Set and track budgets for different categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">Budget planning features coming soon...</p>
                <Button className="mt-4 bg-blue-800 hover:bg-blue-900 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Budget
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
