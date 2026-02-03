'use client'

import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger, SidebarFooter } from "@/components/ui/sidebar"
import { Home, PieChart, LogOut, Settings, ListCheck, Building2 } from "lucide-react"
import { LogoutButton } from "./logout-button"
import { usePathname } from "next/navigation"

export function AppLayout({ children, isAdmin, deptName }: { children: React.ReactNode, isAdmin: boolean, deptName?: string }) {
  const pathname = usePathname()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4 border-b">
            <h2 className="text-xl font-bold tracking-tight text-primary">PAS 2026</h2>
            <p className="text-xs text-muted-foreground truncate" title={deptName}>
              {deptName || "Departamento"}
            </p>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu className="p-2">
              {isAdmin ? (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/admin/dashboard'}>
                      <a href="/admin/dashboard">
                        <PieChart className="w-4 h-4 mr-2" />
                        <span>Visão Geral</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {/* Add more admin links if needed */}
                </>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/dashboard'}>
                    <a href="/dashboard">
                      <ListCheck className="w-4 h-4 mr-2" />
                      <span>Minhas Metas</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t">
             <div className="flex items-center gap-2">
                <LogoutButton />
             </div>
          </SidebarFooter>
        </Sidebar>
        
        <main className="flex-1 overflow-auto bg-slate-50/50">
            <header className="flex h-14 items-center gap-4 border-b bg-background px-6 lg:h-[60px]">
                <SidebarTrigger />
                <div className="flex-1">
                    <h1 className="text-lg font-semibold">
                        {isAdmin && pathname.includes('admin') ? 'Painel de Gestão Estratégica' : 'Monitoramento de Metas'}
                    </h1>
                </div>
            </header>
            <div className="p-6">
                {children}
            </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
