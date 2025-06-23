"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Building2, CreditCard, DollarSign, TrendingUp, Users, Calendar, Trophy, AlertCircle } from "lucide-react"

const revenueData = [
  { month: "Jan", revenue: 45000, expenses: 32000 },
  { month: "Feb", revenue: 52000, expenses: 38000 },
  { month: "Mar", revenue: 48000, expenses: 35000 },
  { month: "Apr", revenue: 61000, expenses: 42000 },
  { month: "May", revenue: 55000, expenses: 40000 },
  { month: "Jun", revenue: 67000, expenses: 45000 },
]

const clubData = [
  { name: "Active Teams", value: 24, color: "#1E3A8A" },
  { name: "Youth Teams", value: 16, color: "#F97316" },
  { name: "Senior Teams", value: 8, color: "#22D3EE" },
]

const upcomingMatches = [
  { team: "Eagles FC", opponent: "Lions United", date: "2024-01-15", time: "15:00" },
  { team: "Hawks FC", opponent: "Tigers FC", date: "2024-01-16", time: "17:30" },
  { team: "Wolves FC", opponent: "Bears United", date: "2024-01-17", time: "14:00" },
]

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening with your association.
          </p>
        </div>
        <Button className="bg-blue-800 hover:bg-blue-900 text-white">
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Match
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-800" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">$328,000</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Players</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">487</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8 new this week
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Teams</CardTitle>
            <Building2 className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">24</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Across all divisions</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">$45,000</div>
            <p className="text-xs text-red-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
              +5.2% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Revenue vs Expenses</CardTitle>
            <CardDescription>Monthly financial overview for the current year</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#1E3A8A" name="Revenue" />
                <Bar dataKey="expenses" fill="#F97316" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Team Distribution</CardTitle>
            <CardDescription>Breakdown of teams by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={clubData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {clubData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Upcoming Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Matches
            </CardTitle>
            <CardDescription>Next scheduled games this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingMatches.map((match, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {match.team} vs {match.opponent}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {match.date} at {match.time}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                    Scheduled
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recent Alerts
            </CardTitle>
            <CardDescription>Important notifications and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500">
                <Trophy className="h-4 w-4 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Contract Renewal Due</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">3 player contracts expire this month</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                <CreditCard className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Payment Received</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Monthly membership fees collected</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                <Users className="h-4 w-4 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">New Player Registration</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">5 new players joined this week</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
