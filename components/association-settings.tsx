"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Building, Camera, History, Save, Search, Settings, Upload, User, Activity } from "lucide-react"

const activityLogs = [
  {
    id: 1,
    timestamp: "2024-01-10 14:30:25",
    user: "John Smith",
    action: "Created new player",
    details: "Added Alex Rodriguez to Eagles FC",
    type: "Create",
  },
  {
    id: 2,
    timestamp: "2024-01-10 13:15:10",
    user: "Sarah Johnson",
    action: "Updated match result",
    details: "Eagles FC vs Lions United - 2:1",
    type: "Update",
  },
  {
    id: 3,
    timestamp: "2024-01-10 11:45:33",
    user: "Mike Wilson",
    action: "Processed payment",
    details: "Monthly membership fees - $2,500",
    type: "Payment",
  },
  {
    id: 4,
    timestamp: "2024-01-09 16:20:15",
    user: "Emma Davis",
    action: "Scheduled match",
    details: "Hawks FC vs Tigers FC - 2024-01-16",
    type: "Schedule",
  },
  {
    id: 5,
    timestamp: "2024-01-09 10:30:45",
    user: "Admin System",
    action: "Backup completed",
    details: "Daily database backup successful",
    type: "System",
  },
]

export function AssociationSettings() {
  const [searchTerm, setSearchTerm] = useState("")
  const [associationName, setAssociationName] = useState("Premier Sports Association")
  const [associationDescription, setAssociationDescription] = useState(
    "A premier sports association dedicated to developing athletic talent and promoting competitive sports across all age groups.",
  )
  const [contactEmail, setContactEmail] = useState("admin@premiersports.com")
  const [contactPhone, setContactPhone] = useState("+1 (555) 123-4567")
  const [address, setAddress] = useState("123 Sports Complex Drive, Athletic City, AC 12345")

  const filteredLogs = activityLogs.filter(
    (log) =>
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getActionColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "create":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "update":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "payment":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      case "schedule":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
      case "system":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Association Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage association details, branding, and system logs</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="users">User Settings</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <Building className="h-5 w-5" />
                Association Information
              </CardTitle>
              <CardDescription>Update your association's basic information and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="associationName">Association Name</Label>
                  <Input
                    id="associationName"
                    value={associationName}
                    onChange={(e) => setAssociationName(e.target.value)}
                    placeholder="Enter association name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Enter contact email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Enter contact phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter association address"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={associationDescription}
                  onChange={(e) => setAssociationDescription(e.target.value)}
                  placeholder="Enter association description"
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button className="bg-blue-800 hover:bg-blue-900 text-white">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Branding & Logo
              </CardTitle>
              <CardDescription>Customize your association's visual identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Association Logo</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <Camera className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" className="bg-white dark:bg-gray-800">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </Button>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Recommended: 200x200px, PNG or JPG</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input id="primaryColor" type="color" value="#1E3A8A" className="w-16 h-10 p-1 border rounded" />
                      <Input value="#1E3A8A" placeholder="Hex color code" className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value="#F97316"
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input value="#F97316" placeholder="Hex color code" className="flex-1" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Association Tagline</Label>
                  <Input
                    id="tagline"
                    placeholder="Enter a memorable tagline"
                    defaultValue="Excellence in Sports, Unity in Competition"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="bg-blue-800 hover:bg-blue-900 text-white">
                  <Save className="h-4 w-4 mr-2" />
                  Save Branding
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <User className="h-5 w-5" />
                User Management Settings
              </CardTitle>
              <CardDescription>Configure user roles, permissions, and access controls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Advanced user management settings and role configurations.
                </p>
                <Button className="bg-blue-800 hover:bg-blue-900 text-white">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Permissions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <History className="h-5 w-5" />
                Activity Logs
              </CardTitle>
              <CardDescription>Monitor system activities and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search activity logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="bg-white dark:bg-gray-800">
                  <Activity className="h-4 w-4 mr-2" />
                  Export Logs
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                        <TableCell className="font-medium">{log.user}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell className="max-w-xs truncate" title={log.details}>
                          {log.details}
                        </TableCell>
                        <TableCell>
                          <Badge className={getActionColor(log.type)}>{log.type}</Badge>
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
    </div>
  )
}
