"use client"

import { HierarchicalView } from "@/components/hierarchical-view"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function DepartmentDashboard({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold tracking-tight">Monitoramento de Metas</h2>
      </div>
      <HierarchicalView data={data} />
    </div>
  )
}
