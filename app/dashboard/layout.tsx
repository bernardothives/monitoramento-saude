import { AppLayout } from "@/components/app-layout"
import { cookies } from "next/headers"
import { db } from "@/lib/db"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const deptId = cookieStore.get('dept_id')?.value
  const isAdmin = cookieStore.get('is_admin')?.value === 'true'
  
  let deptName = ""
  if (deptId) {
    const dept = await db.departamento.findUnique({ where: { id: deptId } })
    deptName = dept?.nome || ""
  }

  return (
    <AppLayout isAdmin={isAdmin} deptName={deptName}>
      {children}
    </AppLayout>
  )
}
