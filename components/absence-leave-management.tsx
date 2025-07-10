"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Calendar,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  User,
  Plane,
  Heart,
  Baby,
  GraduationCap,
} from "lucide-react"
import { hrLeavesApi, LeaveRequest as ApiLeaveRequest, CreateLeaveRequestDto, UpdateLeaveRequestDto } from "@/lib/api/hr-leaves-api"

interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  position: string
  leaveType: "annual" | "sick" | "maternity" | "paternity" | "personal" | "training"
  startDate: string
  endDate: string
  days: number
  reason: string
  status: "pending" | "approved" | "rejected" | "cancelled"
  requestDate: string
  approvedBy?: string
  approvalDate?: string
  comments?: string
}

interface LeaveBalance {
  employeeId: string
  employeeName: string
  annual: { total: number; used: number; remaining: number }
  sick: { total: number; used: number; remaining: number }
  personal: { total: number; used: number; remaining: number }
}

export function AbsenceLeaveManagement() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false)
  const [newRequest, setNewRequest] = useState({
    employeeId: "",
    leaveType: "annual" as const,
    startDate: "",
    endDate: "",
    reason: "",
  })

  // Fetch leave requests from backend
  useEffect(() => {
    hrLeavesApi.getLeaves().then(setLeaveRequests)
  }, [])

  const filteredRequests = leaveRequests.filter((request) => {
    const matchesSearch =
      request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.position.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    const matchesType = typeFilter === "all" || request.leaveType === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const getLeaveTypeIcon = (type: string) => {
    switch (type) {
      case "annual":
        return <Plane className="w-4 h-4" />
      case "sick":
        return <Heart className="w-4 h-4" />
      case "maternity":
        return <Baby className="w-4 h-4" />
      case "paternity":
        return <Baby className="w-4 h-4" />
      case "personal":
        return <User className="w-4 h-4" />
      case "training":
        return <GraduationCap className="w-4 h-4" />
      default:
        return <Calendar className="w-4 h-4" />
    }
  }

  const getLeaveTypeBadge = (type: string) => {
    const colors = {
      annual: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      sick: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      maternity: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      paternity: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      personal: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      training: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    }

    return (
      <Badge className={colors[type as keyof typeof colors]}>
        {getLeaveTypeIcon(type)}
        <span className="ml-1 capitalize">{type}</span>
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">Cancelled</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const calculateDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const handleCreateRequest = async () => {
    const days = calculateDays(newRequest.startDate, newRequest.endDate)
    const payload: CreateLeaveRequestDto = {
      employeeId: newRequest.employeeId,
      leaveType: newRequest.leaveType,
      startDate: newRequest.startDate,
      endDate: newRequest.endDate,
      reason: newRequest.reason,
    }
    try {
      const created = await hrLeavesApi.createLeave(payload)
      setLeaveRequests((prev) => [...prev, { ...created, days }])
      setShowNewRequestDialog(false)
      setNewRequest({
        employeeId: "",
        leaveType: "annual",
        startDate: "",
        endDate: "",
        reason: "",
      })
    } catch (err: any) {
      alert(err?.message || "Failed to create leave request")
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    try {
      const updated = await hrLeavesApi.updateLeave(requestId, {
        status: "approved",
        approvedBy: "Current User",
        approvalDate: new Date().toISOString().split("T")[0],
      })
      setLeaveRequests((prev) => prev.map((r) => r.id === requestId ? { ...updated, days: r.days } : r))
    } catch (err: any) {
      alert(err?.message || "Failed to approve leave request")
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    try {
      const updated = await hrLeavesApi.updateLeave(requestId, {
        status: "rejected",
        approvedBy: "Current User",
        approvalDate: new Date().toISOString().split("T")[0],
      })
      setLeaveRequests((prev) => prev.map((r) => r.id === requestId ? { ...updated, days: r.days } : r))
    } catch (err: any) {
      alert(err?.message || "Failed to reject leave request")
    }
  }

  // Add delete handler
  const handleDeleteRequest = async (requestId: string) => {
    try {
      await hrLeavesApi.deleteLeave(requestId)
      setLeaveRequests((prev) => prev.filter((r) => r.id !== requestId))
    } catch (err: any) {
      alert(err?.message || "Failed to delete leave request")
    }
  }

  const totalRequests = leaveRequests.length
  const pendingRequests = leaveRequests.filter((r) => r.status === "pending").length
  const approvedRequests = leaveRequests.filter((r) => r.status === "approved").length
  const rejectedRequests = leaveRequests.filter((r) => r.status === "rejected").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Absence & Leave Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage employee leave requests and balances</p>
        </div>
        <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Leave Request</DialogTitle>
              <DialogDescription>Submit a new leave request for an employee</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={newRequest.employeeId}
                  onChange={(e) => setNewRequest({ ...newRequest, employeeId: e.target.value })}
                  placeholder="Enter employee ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leaveType">Leave Type</Label>
                <Select
                  value={newRequest.leaveType}
                  onValueChange={(value: any) => setNewRequest({ ...newRequest, leaveType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual Leave</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="maternity">Maternity Leave</SelectItem>
                    <SelectItem value="paternity">Paternity Leave</SelectItem>
                    <SelectItem value="personal">Personal Leave</SelectItem>
                    <SelectItem value="training">Training Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newRequest.startDate}
                    onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newRequest.endDate}
                    onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
                  />
                </div>
              </div>
              {newRequest.startDate && newRequest.endDate && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Total days: {calculateDays(newRequest.startDate, newRequest.endDate)}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  placeholder="Enter reason for leave request"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewRequestDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateRequest}
                disabled={!newRequest.employeeId || !newRequest.startDate || !newRequest.endDate}
              >
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedRequests}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedRequests}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="balances">Leave Balances</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Leave Requests</CardTitle>
              <CardDescription>Manage all employee leave requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by employee name, ID, or position..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="sick">Sick</SelectItem>
                    <SelectItem value="maternity">Maternity</SelectItem>
                    <SelectItem value="paternity">Paternity</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.employeeName}</div>
                            <div className="text-sm text-gray-500">{request.position}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getLeaveTypeBadge(request.leaveType)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{request.startDate}</div>
                            <div className="text-gray-500">to {request.endDate}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{request.days}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(request)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {request.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApproveRequest(request.id)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRejectRequest(request.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRequest(request.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances">
          <Card>
            <CardHeader>
              <CardTitle>Leave Balances</CardTitle>
              <CardDescription>Track employee leave balances and usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Annual Leave</TableHead>
                      <TableHead>Sick Leave</TableHead>
                      <TableHead>Personal Leave</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveBalances.map((balance) => (
                      <TableRow key={balance.employeeId}>
                        <TableCell>
                          <div className="font-medium">{balance.employeeName}</div>
                          <div className="text-sm text-gray-500">{balance.employeeId}</div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Used: {balance.annual.used}</span>
                              <span>Remaining: {balance.annual.remaining}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(balance.annual.used / balance.annual.total) * 100}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500">Total: {balance.annual.total} days</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Used: {balance.sick.used}</span>
                              <span>Remaining: {balance.sick.remaining}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-red-600 h-2 rounded-full"
                                style={{ width: `${(balance.sick.used / balance.sick.total) * 100}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500">Total: {balance.sick.total} days</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Used: {balance.personal.used}</span>
                              <span>Remaining: {balance.personal.remaining}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gray-600 h-2 rounded-full"
                                style={{ width: `${(balance.personal.used / balance.personal.total) * 100}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500">Total: {balance.personal.total} days</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Details Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Leave Request Details - {selectedRequest.id}</DialogTitle>
              <DialogDescription>Complete leave request information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Employee</Label>
                  <p className="text-lg font-semibold">{selectedRequest.employeeName}</p>
                  <p className="text-sm text-gray-600">{selectedRequest.position}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Leave Type</Label>
                  <div className="mt-1">{getLeaveTypeBadge(selectedRequest.leaveType)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Start Date</Label>
                  <p className="text-lg">{selectedRequest.startDate}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">End Date</Label>
                  <p className="text-lg">{selectedRequest.endDate}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Total Days</Label>
                  <p className="text-lg font-semibold">{selectedRequest.days}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Request Date</Label>
                  <p className="text-lg">{selectedRequest.requestDate}</p>
                </div>
                {selectedRequest.approvalDate && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Approval Date</Label>
                    <p className="text-lg">{selectedRequest.approvalDate}</p>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Reason</Label>
                <p className="text-lg mt-1">{selectedRequest.reason}</p>
              </div>
              {selectedRequest.approvedBy && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Approved By</Label>
                  <p className="text-lg">{selectedRequest.approvedBy}</p>
                </div>
              )}
              {selectedRequest.comments && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Comments</Label>
                  <p className="text-lg">{selectedRequest.comments}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                Close
              </Button>
              {selectedRequest.status === "pending" && (
                <>
                  <Button
                    onClick={() => {
                      handleApproveRequest(selectedRequest.id)
                      setSelectedRequest(null)
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => {
                      handleRejectRequest(selectedRequest.id)
                      setSelectedRequest(null)
                    }}
                    variant="destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
