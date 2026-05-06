"use client"

import { HierarchicalView } from "@/components/hierarchical-view"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { PdfGeneratorButton } from "./pdf-generator-button"

export function DepartmentDashboard({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
         <h2 className="text-2xl font-bold tracking-tight">Monitoramento de Metas</h2>
         <PdfGeneratorButton />
      </div>
      <HierarchicalView data={data} />
    </div>
  )
}
