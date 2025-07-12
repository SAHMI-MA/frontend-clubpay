"use client"
// State for approval/rejection dialog

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
  Trash2,
} from "lucide-react"
import { Employee, hrApi } from "@/lib/api/hr-api"
import { hrLeavesApi, CreateLeaveRequestDto, UpdateLeaveRequestDto, LeaveStatus, LeaveType } from "@/lib/api/hr-leaves-api"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/redux/store"


interface LeaveBalance {
  employeeId: string
  employeeName: string
  annual: { total: number; used: number; remaining: number }
  sick: { total: number; used: number; remaining: number }
  personal: { total: number; used: number; remaining: number }
}

interface LeaveRequest {
  id: number;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysRequested: string;
  reason: string;
  status: LeaveStatus;
  approvedByUserId?: number | null;
  approvedAt?: string | null;
  approverComments?: string | null;
  isHalfDay?: boolean;
  halfDayPeriod?: string | null;
  documentPath?: string | null;
  emergencyContact?: string | null;
  coveringEmployeeId?: string | null;
  isPaidLeave?: boolean;
  createdAt: string;
  updatedAt: string;
  employee: any;
}

// Use backend leave types exactly
const allowedLeaveTypes = [
  "vacation",
  "sick leave",
  "personal",
  "maternity",
  "paternity",
  "bereavement",
  "emergency",
  "unpaid",
  "compensatory",
  "sabbatical",
];
const sanitizeLeaveType = (type: string): LeaveType => {
  return allowedLeaveTypes.includes(type) ? (type as LeaveType) : LeaveType.PERSONAL;
}

// Update leaveTypeOptions to match backend display
const leaveTypeOptions = [
  "Vacation",
  "Sick Leave",
  "Personal",
  "Maternity",
  "Paternity",
  "Bereavement",
  "Emergency",
  "Unpaid",
  "Compensatory",
  "Sabbatical",
]
const leaveTypeMap: Record<string, string> = {
  "vacation": "Vacation",
  "sick leave": "Sick Leave",
  "personal": "Personal",
  "maternity": "Maternity",
  "paternity": "Paternity",
  "bereavement": "Bereavement",
  "emergency": "Emergency",
  "unpaid": "Unpaid",
  "compensatory": "Compensatory",
  "sabbatical": "Sabbatical",
}
function normalizeLeaveType(type: string): string {
  return leaveTypeMap[type] || (leaveTypeOptions.includes(type) ? type : "Personal")
}

// Update all status values and allowedStatusValues to use lowercase: ["pending", "approved", "declined", "rejected", "cancelled"]
const allowedStatusValues = ["pending", "approved", "rejected", "cancelled"] as const
function normalizeStatus(status: string): LeaveStatus {
  const match = allowedStatusValues.find(
    (s) => s.toLowerCase() === status.toLowerCase()
  )
  return match || "pending"
}

// When displaying status, you can map to PascalCase for UI only:
function displayStatus(status: string) {
  switch (status) {
    case "pending": return "Pending";
    case "approved": return "Approved";
    case "declined": return "Declined";
    case "rejected": return "Rejected";
    case "cancelled": return "Cancelled";
    default: return status;
  }
}

export function AbsenceLeaveManagement() {
  // Format ISO date string to readable format
  function formatDate(dateStr?: string | null) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: 'approve' | 'reject' | null; request: LeaveRequest | null }>({ open: false, type: null, request: null });
  const [approverComments, setApproverComments] = useState("");
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false)
  const [newRequest, setNewRequest] = useState({
    employeeId: "",
    leaveType: "Vacation",
    startDate: "",
    endDate: "",
    reason: "",
  })
  const [employees, setEmployees] = useState<Employee[]>([])
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const currentUser = useSelector((state: RootState) => state.auth.user)

  // Fetch leave requests from backend
  useEffect(() => {
    hrLeavesApi.getLeaves().then((data: LeaveRequest[]) => setLeaveRequests(data))
  }, [])

  // Fetch employees from backend
  useEffect(() => {
    hrApi.getEmployees().then((data: Employee[]) => {
      setEmployees(data);
    });
  }, [])

  // Compute leave balances whenever leaveRequests or employees change
  useEffect(() => {
    if (employees.length === 0) return;
    const balances: LeaveBalance[] = employees.map((emp) => {
      // Filter leave requests for this employee
      const empRequests = leaveRequests.filter(r => r.employeeId === emp.employeeId);
      // Used days for each type
      const annualUsed = empRequests
        .filter(r => r.leaveType === "annual" && r.status === "approved")
        .reduce((sum, r) => sum + Number(r.daysRequested || 0), 0);
      const sickUsed = empRequests.filter(r => r.leaveType === "sick" && r.status === "approved").reduce((sum, r) => sum + Number(r.daysRequested || 0), 0);
      const personalUsed = empRequests
        .filter(r => r.leaveType === "personal" && r.status === "approved")
        .reduce((sum, r) => sum + Number(r.daysRequested || 0), 0);
      // Default totals (can be replaced with backend values if available)
      const annualTotal = 20;
      const sickTotal = 10;
      const personalTotal = 5;
      return {
        employeeId: emp.employeeId,
        employeeName: emp.user.firstName + " " + emp.user.lastName,
        annual: {
          total: annualTotal,
          used: annualUsed,
          remaining: Math.max(annualTotal - annualUsed, 0),
        },
        sick: {
          total: sickTotal,
          used: sickUsed,
          remaining: Math.max(sickTotal - sickUsed, 0),
        },
        personal: {
          total: personalTotal,
          used: personalUsed,
          remaining: Math.max(personalTotal - personalUsed, 0),
        },
      };
    });
    setLeaveBalances(balances);
  }, [leaveRequests, employees]);

  const filteredRequests = leaveRequests.filter((request) => {
    const employeeName = request.employee?.user ? `${request.employee.user.firstName} ${request.employee.user.lastName}` : "";
    const position = request.employee?.position?.title || "";
    const matchesSearch =
      employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesType = typeFilter === "all" || request.leaveType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
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
    const normalized = normalizeLeaveType(type)
    const colors = {
      Vacation: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      "Sick Leave": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      Maternity: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      Paternity: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      Personal: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      Bereavement: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      Emergency: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      Unpaid: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      Compensatory: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      Sabbatical: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    }
    return (
      <Badge className={colors[normalized as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {normalized}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const normalized = status.toLowerCase();
    switch (normalized) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">Cancelled</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  }

  const calculateDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  // Helper to map display value to backend value
  const displayToBackendLeaveType: Record<string, string> = {
    "Vacation": "vacation",
    "Sick Leave": "sick leave",
    "Personal": "personal",
    "Maternity": "maternity",
    "Paternity": "paternity",
    "Bereavement": "bereavement",
    "Emergency": "emergency",
    "Unpaid": "unpaid",
    "Compensatory": "compensatory",
    "Sabbatical": "sabbatical",
  };

  const handleCreateRequest = async () => {
    const daysRequested = calculateDays(newRequest.startDate, newRequest.endDate)
    // Always use 'Pending' for new requests
    const status: LeaveStatus = allowedStatusValues[0]
    // Map display value to backend value
    const backendLeaveType = displayToBackendLeaveType[newRequest.leaveType] || "personal"
    const payload: CreateLeaveRequestDto = {
      employeeId: newRequest.employeeId,
      leaveType: backendLeaveType as LeaveType,
      startDate: newRequest.startDate,
      endDate: newRequest.endDate,
      daysRequested,
      reason: newRequest.reason,
      status: "pending" as LeaveStatus,
    }
    try {
      const created = await hrLeavesApi.createLeave(payload)
      // Find the employee object for the created request
      const employeeObj = employees.find(e => e.employeeId === created.employeeId)
      setLeaveRequests((prev) => [
        ...prev,
        {
          ...created,
          leaveType: sanitizeLeaveType(created.leaveType),
          daysRequested: daysRequested.toString(),
          employee: employeeObj
            ? {
              user: {
                firstName: employeeObj.user.firstName.split(' ')[0] || '',
                lastName: employeeObj.user.lastName.split(' ').slice(1).join(' ') || '',
              },
              position: employeeObj.position && typeof employeeObj.position === "object"
                ? { title: employeeObj.position.title || '' }
                : { title: employeeObj.position || '' },
            }
            : undefined,
        },
      ])
      setShowNewRequestDialog(false)
      setNewRequest({
        employeeId: "",
        leaveType: "Vacation",
        startDate: "",
        endDate: "",
        reason: "",
      })
    } catch (err: any) {
      alert(err?.message || "Failed to create leave request")
    }
  }

  const handleApproveRequest = async (requestId: number) => {
    const idStr = String(requestId);
    try {
      const payload: UpdateLeaveRequestDto = {
        approverComments,
        approvedBy: currentUser?.id ?? 0,
        approvalDate: new Date().toISOString(),
      };
      const updated = await hrLeavesApi.approveLeave(idStr, payload);
      setLeaveRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
              ...updated,
              leaveType: sanitizeLeaveType(updated.leaveType),
              daysRequested: updated.daysRequested,
              status: (updated.status || "approved") as LeaveStatus,
            }
            : r
        )
      );
    } catch (err: any) {
      alert(err?.message || "Failed to approve leave request");
    }
    setActionDialog({ open: false, type: null, request: null });
    setApproverComments("");
  }

  const handleRejectRequest = async (requestId: number) => {
    const idStr = String(requestId);
    try {
      const payload: UpdateLeaveRequestDto = {
        approverComments,
        approvedBy: currentUser?.id ?? 0,
        approvalDate: new Date().toISOString(),
      };
      const updated = await hrLeavesApi.rejectLeave(idStr, payload);
      setLeaveRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
              ...updated,
              leaveType: sanitizeLeaveType(updated.leaveType),
              daysRequested: updated.daysRequested,
              status: (updated.status || "rejected") as LeaveStatus,
            }
            : r
        )
      );
    } catch (err: any) {
      alert(err?.message || "Failed to reject leave request")
    }
    setActionDialog({ open: false, type: null, request: null });
    setApproverComments("");
  }

  // Add delete handler
  const handleDeleteRequest = async (requestId: number) => {
    const idStr = String(requestId);
    try {
      await hrLeavesApi.deleteLeave(idStr)
      setLeaveRequests((prev) => prev.filter((r) => r.id !== requestId))
    } catch (err: any) {
      alert(err?.message || "Failed to delete leave request")
    }
  }

  const totalRequests = leaveRequests.length;
  const pendingRequests = leaveRequests.filter((r) => r.status === "pending").length;
  const approvedRequests = leaveRequests.filter((r) => r.status === "approved").length;
  const rejectedRequests = leaveRequests.filter((r) => r.status === "rejected").length;

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
                <Label htmlFor="employeeId">Employee</Label>
                <Select
                  value={newRequest.employeeId.toString()}
                  onValueChange={(value) => setNewRequest({ ...newRequest, employeeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.employeeId} value={employee.employeeId}>
                        {employee.user.lastName} - {employee.position?.title || "No Position"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="leaveType">Leave Type</Label>
                <Select
                  value={newRequest.leaveType}
                  onValueChange={(value) => setNewRequest({ ...newRequest, leaveType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
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
                    {leaveTypeOptions.map((type: string) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
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
                            <div className="font-medium">
                              {request.employee?.user
                                ? `${request.employee.user.firstName} ${request.employee.user.lastName}`
                                : (() => {
                                  const emp = employees.find(e => e.employeeId === request.employeeId);
                                  return emp ? emp.user.lastName : "";
                                })()
                              }
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.employee?.position?.title
                                ? request.employee.position.title
                                : (() => {
                                  const emp = employees.find(e => e.employeeId === request.employeeId);
                                  return emp && emp.position && typeof emp.position === "object" ? emp.position.title || "" : "";
                                })()
                              }
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getLeaveTypeBadge(request.leaveType)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{request.startDate}</div>
                            <div className="text-gray-500">to {request.endDate}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{request.daysRequested}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(request)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setConfirmDeleteId(String(request.id))}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Delete Confirmation Dialog */}
              <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this leave request? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (confirmDeleteId) handleDeleteRequest(Number(confirmDeleteId))
                        setConfirmDeleteId(null)
                      }}
                    >
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                            <div className="w-full flex justify-center">
                              <div className="bg-gray-200 rounded-full h-2 w-[120px]">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${(balance.annual.used / balance.annual.total) * 100}%` }}
                                ></div>
                              </div>
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
                            <div className="w-full flex justify-center">
                              <div className="bg-gray-200 rounded-full h-2 w-[120px]">
                                <div
                                  className="bg-red-600 h-2 rounded-full"
                                  style={{ width: `${(balance.sick.used / balance.sick.total) * 100}%` }}
                                ></div>
                              </div>
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
                            <div className="w-full flex justify-center">
                              <div className="bg-gray-200 rounded-full h-2 w-[120px]">
                                <div
                                  className="bg-gray-600 h-2 rounded-full"
                                  style={{ width: `${(balance.personal.used / balance.personal.total) * 100}%` }}
                                ></div>
                              </div>
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
              <DialogTitle>Leave Request Details - {selectedRequest?.id}</DialogTitle>
              <DialogDescription>Complete leave request information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Employee</Label>
                  <p className="text-lg font-semibold">
                    {selectedRequest?.employee?.user
                      ? `${selectedRequest.employee.user.firstName} ${selectedRequest.employee.user.lastName}`
                      : (() => {
                        const emp = employees.find(e => e.employeeId === selectedRequest?.employeeId);
                        return emp ? emp.user.lastName : "";
                      })()
                    }
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedRequest?.employee?.position?.title
                      ? selectedRequest.employee.position.title
                      : (() => {
                        const emp = employees.find(e => e.employeeId === selectedRequest?.employeeId);
                        return emp && emp.position && typeof emp.position === "object" ? emp.position.title || "" : "";
                      })()
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Leave Type</Label>
                  <div className="mt-1">{getLeaveTypeBadge(selectedRequest?.leaveType ?? "")}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Start Date</Label>
                  <p className="text-lg">{selectedRequest?.startDate}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">End Date</Label>
                  <p className="text-lg">{selectedRequest?.endDate}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Total Days</Label>
                  <p className="text-lg font-semibold">{selectedRequest?.daysRequested}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest?.status ?? "")}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Request Date</Label>
                  <p className="text-lg">{formatDate(selectedRequest?.createdAt)}</p>
                </div>
                {selectedRequest?.approvedAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Approval Date</Label>
                    <p className="text-lg">{formatDate(selectedRequest.approvedAt)}</p>
                  </div>
                )}
                {selectedRequest?.approvedByUserId !== undefined && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Approved By User ID</Label>
                    <p className="text-lg">{selectedRequest.approvedByUserId ?? "N/A"}</p>
                  </div>
                )}
                {selectedRequest?.approverComments && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Approver Comments</Label>
                    <p className="text-lg">{selectedRequest.approverComments}</p>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Reason</Label>
                <p className="text-lg mt-1">{selectedRequest?.reason}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                Close
              </Button>
              {selectedRequest && selectedRequest.status?.toLowerCase() === "pending" && (
                <>
                  <Button
                    onClick={() => {
                      setActionDialog({ open: true, type: 'approve', request: selectedRequest });
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => {
                      setActionDialog({ open: true, type: 'reject', request: selectedRequest });
                    }}
                    variant="destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}
              {/* Approve/Reject Dialog (always rendered, controlled by state) */}
              <Dialog open={actionDialog.open} onOpenChange={() => { setActionDialog({ open: false, type: null, request: null }); setApproverComments(""); }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{actionDialog.type === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}</DialogTitle>
                    <DialogDescription>
                      {actionDialog.type === 'approve'
                        ? 'Please provide comments before approving this leave request.'
                        : 'Please provide comments before rejecting this leave request.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Label htmlFor="approverComments">Comments</Label>
                    <Textarea
                      id="approverComments"
                      value={approverComments}
                      onChange={e => setApproverComments(e.target.value)}
                      placeholder="Enter your comments..."
                      rows={3}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setActionDialog({ open: false, type: null, request: null }); setApproverComments(""); }}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (actionDialog.request) {
                          if (actionDialog.type === 'approve') {
                            handleApproveRequest(actionDialog.request.id);
                          } else if (actionDialog.type === 'reject') {
                            handleRejectRequest(actionDialog.request.id);
                          }
                        }
                      }}
                      disabled={!approverComments.trim()}
                      className={actionDialog.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                    >
                      {actionDialog.type === 'approve' ? <CheckCircle className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                      {actionDialog.type === 'approve' ? 'Approve' : 'Reject'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
