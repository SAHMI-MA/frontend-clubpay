"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Upload,
  Calendar,
  User,
  Shield,
  Award,
  Heart,
  Briefcase,
  X,
  CheckCircle,
  AlertCircle,
  File,
  ImageIcon,
  FileVideo,
  FileAudio,
} from "lucide-react"
import { hrFilesApi, EmployeeFile } from "@/lib/api/hr-files-api"
import { Employee } from "@/lib/api/hr-api"
import { Alert } from "@/components/ui/alert"

// Define FileUpload type (was missing after refactor)
type FileUpload = {
  file: File
  progress: number
  status: "uploading" | "completed" | "error"
  id: string
}

// Restrict allowed file types and size
const allowedTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png'
];
const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.csv'];

export function EmployeeFilesManagement() {
  const [error, setError] = useState<string | null>(null);
  // Start with an empty array for files, removing the fake data
  const [files, setFiles] = useState<EmployeeFile[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedFile, setSelectedFile] = useState<EmployeeFile | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<FileUpload[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [newFile, setNewFile] = useState({
    employeeId: "",
    fileName: "",
    category: "contract" as const,
    expiryDate: "",
    description: "",
    status: "active" as const,
  })

  // Store selected files before upload
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [employees, setEmployees] = useState<Employee[]>([]);

  const filteredFiles = files.filter((file) => {
    // Use nested employee data for name search
    const employeeName = file.employee ? `${file.employee.user.firstName || ''} ${file.employee.user.lastName || ''}`.trim() : '';
    const matchesSearch =
      employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (file.fileName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(file.id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || file.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || file.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  }, [])

  const removeUpload = (uploadId: string) => {
    setUploadingFiles((prev) => prev.filter((upload) => upload.id !== uploadId))
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="w-4 h-4" />
    if (fileType.startsWith("video/")) return <FileVideo className="w-4 h-4" />
    if (fileType.startsWith("audio/")) return <FileAudio className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "contract":
        return <Briefcase className="w-4 h-4" />
      case "insurance":
        return <Shield className="w-4 h-4" />
      case "certification":
        return <Award className="w-4 h-4" />
      case "performance":
        return <FileText className="w-4 h-4" />
      case "personal":
        return <User className="w-4 h-4" />
      case "training":
        return <Heart className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getCategoryBadge = (category: string) => {
    const colors = {
      contract: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      insurance: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      certification: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      performance: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      personal: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      training: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    }

    return (
      <Badge className={colors[category as keyof typeof colors]}>
        {getCategoryIcon(category)}
        <span className="ml-1 capitalize">{category}</span>
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Active</Badge>
      case "expired":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Expired</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>
      case "archived":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">Archived</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  // Remove handleUploadFile, as file creation is handled by uploadFile

  // Fetch files and employees from backend
  useEffect(() => {
    hrFilesApi.getFiles().then(setFiles);
    // Fetch employees for dropdown
    import("@/lib/api/hr-api").then(({ hrApi }) => {
      hrApi.getEmployees().then(setEmployees);
    });
  }, []);

  const handleDeleteFile = (fileId: number) => {
    hrFilesApi.deleteFile(fileId)
      .then(() => setFiles(files.filter((file) => file.id !== fileId)))
      .catch((err) => setError(err.message));
  }

  const totalFiles = files.length
  const activeFiles = files.filter((f) => f.status === "active").length
  const expiredFiles = files.filter((f) => f.status === "expired").length
  const expiringFiles = files.filter((f) => {
    if (!f.expiryDate) return false
    const expiryDate = new Date(f.expiryDate)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return expiryDate <= thirtyDaysFromNow && f.status === "active"
  }).length

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Employee Files Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage employee documents and files</p>
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Employee File</DialogTitle>
              <DialogDescription>Add a new document to an employee&lsquo;s file</DialogDescription>
            </DialogHeader>

            {/* File Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-gray-300 dark:border-gray-600"
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Supports PDF, DOC, DOCX, JPG, PNG, TXT (max 10MB each)
              </p>
              <input
                type="file"
                multiple
                className="hidden"
                id="file-upload"
                onChange={(e) => {
                  if (!e.target.files) return;
                  const files = Array.from(e.target.files);
                  const invalid = files.filter(f => !allowedTypes.includes(f.type) || !allowedExtensions.some(ext => f.name.toLowerCase().endsWith(ext)));
                  if (invalid.length > 0) {
                    setError("Invalid file type selected. Only PDF, DOC, DOCX, JPG, JPEG, PNG, TXT are allowed.");
                    return;
                  }
                  setError(null);
                  setSelectedFiles(files);
                }}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <Button type="button" variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                Browse Files
              </Button>

              {/* Show selected files before upload */}
              {selectedFiles.length > 0 && (
                <div className="mt-6 space-y-2 text-left">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Selected file{selectedFiles.length > 1 ? 's' : ''}:</p>
                  {selectedFiles.map((file, idx) => (
                    <div key={file.name + file.size + idx} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded px-3 py-2 mb-1">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.type)}
                        <span className="font-medium text-gray-900 dark:text-white">{file.name}</span>
                        <span className="text-xs text-gray-500 ml-2">{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {uploadingFiles.length > 0 && (
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {uploadingFiles.map((upload) => (
                  <div
                    key={upload.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    {getFileIcon(upload.file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{upload.file.name}</p>
                      <div className="flex items-center space-x-2">
                        <Progress value={upload.progress} className="flex-1" />
                        <span className="text-xs text-gray-500">{Math.round(upload.progress)}%</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {upload.status === "completed" && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {upload.status === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
                      <Button variant="ghost" size="sm" onClick={() => removeUpload(upload.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* File Details Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee</Label>
                  <Select
                    value={newFile.employeeId}
                    onValueChange={(value) => setNewFile({ ...newFile, employeeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.employeeId} value={employee.employeeId}>
                          {employee.user.firstName} - {employee.user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fileName">File Name</Label>
                  <Input
                    id="fileName"
                    value={newFile.fileName}
                    onChange={(e) => setNewFile({ ...newFile, fileName: e.target.value })}
                    placeholder="Enter file name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newFile.category}
                    onValueChange={(value: any) => setNewFile({ ...newFile, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="certification">Certification</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={newFile.expiryDate}
                    onChange={(e) => setNewFile({ ...newFile, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newFile.description}
                  onChange={(e) => setNewFile({ ...newFile, description: e.target.value })}
                  placeholder="Enter file description"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedFiles.length) {
                    setError("Please select a file");
                    return;
                  }

                  try {
                    setUploading(true);

                    // Process files sequentially
                    const results: EmployeeFile[] = [];
                    for (const file of selectedFiles) {
                      try {
                        const uploaded = await hrFilesApi.uploadFile({
                          file,
                          employeeId: newFile.employeeId,
                          category: newFile.category,
                          ...(newFile.expiryDate && { expiryDate: newFile.expiryDate }),
                          status: newFile.status || "active",
                          description: newFile.description,
                        });
                        results.push(uploaded);
                      } catch (err: any) {
                        console.error(`Failed to upload ${file.name}:`, err);
                        setError(prev =>
                          prev ? `${prev}\n${file.name}: ${err.message}` : `${file.name}: ${err.message}`
                        );
                      }
                    }

                    if (results.length > 0) {
                      setFiles(prev => [...prev, ...results]);
                      setSelectedFiles([]);
                      setShowUploadDialog(false);
                    }
                  } finally {
                    setUploading(false);
                  }
                }}
                disabled={!selectedFiles.length || uploading}
              >
                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiles}</div>
            <p className="text-xs text-muted-foreground">All employee files</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Files</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeFiles}</div>
            <p className="text-xs text-muted-foreground">Currently valid</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringFiles}</div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiredFiles}</div>
            <p className="text-xs text-muted-foreground">Need renewal</p>
          </CardContent>
        </Card>
      </div>

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Files</CardTitle>
          <CardDescription>Manage all employee documents and files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by employee name, file name, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="certification">Certification</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="training">Training</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File ID</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">{file.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm text-gray-500">{file.employeeId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{file.fileName}</div>
                        <div className="text-sm text-gray-500">
                          {file.fileSize} • {file.fileType}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryBadge(file.category)}</TableCell>
                    <TableCell>{file.createdAt}</TableCell>
                    <TableCell>{file.expiryDate || "No expiry"}</TableCell>
                    <TableCell>{getStatusBadge(file.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedFile(file)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => hrFilesApi.downloadFile(file.fileName)}>
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFile(file.id)}
                          className="text-red-600 hover:text-red-700"
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
        </CardContent>
      </Card>

      {/* File Details Dialog */}
      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-2xl">
          {selectedFile && (
            <>
              <DialogHeader>
                <DialogTitle>File Details - {selectedFile.id}</DialogTitle>
                <DialogDescription>Complete file information and metadata</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Employee</Label>
                    <p className="text-sm text-gray-600">{selectedFile.employeeId}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Category</Label>
                    <div className="mt-1">{getCategoryBadge(selectedFile.category)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">File Name</Label>
                    <p className="text-lg">{selectedFile.fileName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">File Size</Label>
                    <p className="text-lg">{selectedFile.fileSize}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Upload Date</Label>
                    <p className="text-lg">{selectedFile.createdAt}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Expiry Date</Label>
                    <p className="text-lg">{selectedFile.expiryDate || "No expiry"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedFile.status)}</div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedFile(null)}>
                  Close
                </Button>
                <Button onClick={() => hrFilesApi.downloadFile(selectedFile.fileName)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
