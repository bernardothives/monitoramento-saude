import { getCurrentUser, getDepartments, getHierarchicalData, getGlobalStats } from "@/app/actions";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { DepartmentDashboard } from "@/components/dashboard/department-dashboard";
import { redirect } from "next/navigation";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ deptId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const targetDeptId = params.deptId;

  // 1. ADMIN VIEW
  if (user.isAdmin) {
      const departments = await getDepartments();
      const globalStats = await getGlobalStats();

      // If filtering by department, fetch that specific data
      let departmentData = null;
      if (targetDeptId) {
          const { data } = await getHierarchicalData(targetDeptId);
          departmentData = data;
      }

      return (
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
             <AdminDashboard 
                stats={globalStats}
                departments={departments}
                currentDeptId={targetDeptId}
                departmentData={departmentData}
             />
          </div>
      );
  }

  // 2. STANDARD DEPARTMENT VIEW
  // Non-admins can only see their own data
  const { data } = await getHierarchicalData(); // actions automatically uses current user's dept if not admin

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
       <div className="flex items-center justify-between space-y-2 mb-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Painel Departamental</h2>
            <p className="text-muted-foreground">Monitoramento de Metas - {user.nome}</p>
        </div>
      </div>
      <DepartmentDashboard data={data} />
    </div>
  );
}