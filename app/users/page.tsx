import { UserManagement } from "@/components/Management/user-management"
import { AppLayout } from "@/components/app-layout"

export default function UsersPage() {
  return (
    <AppLayout>
      <UserManagement />
    </AppLayout>
  )
}